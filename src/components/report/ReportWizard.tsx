"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, relativeTime } from "@/lib/utils";
import { CATEGORY_META, PRIVACY_META } from "@/lib/types";
import type { CaseCategory, PrivacyMode } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { fileError, prepareFile } from "@/lib/client/upload";
import {
  clearDraft,
  getTokens,
  loadDraft,
  queueSubmission,
  saveDraft,
  saveToken
} from "@/lib/offline/db";

// ---------------------------------------------------------------- state model

interface EvidenceItem {
  localId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataBase64: string;
  previewUrl?: string;
}

interface WizardData {
  category?: CaseCategory;
  description: string;
  locationGeneral: string;
  coordinates?: { lat: number; lng: number };
  incidentChoice: "now" | "earlier" | "custom";
  customAt: string; // datetime-local value
  privacyMode?: PrivacyMode;
  contactName: string;
  evidence: EvidenceItem[];
}

const EMPTY: WizardData = {
  description: "",
  locationGeneral: "",
  incidentChoice: "now",
  customAt: "",
  contactName: "",
  evidence: []
};

const STEPS = ["Category", "Description", "Location", "Time", "Evidence", "Privacy", "Review"] as const;

type SubmitOutcome =
  | { kind: "submitted"; caseId: string; linkedTo: boolean; at: string }
  | { kind: "queued"; at: string }
  | { kind: "error"; message: string };

export function ReportWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(EMPTY);
  const [stepError, setStepError] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<SubmitOutcome | null>(null);
  const [online, setOnline] = useState(true);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const restoredRef = useRef(false);

  // ---- draft restore
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    (async () => {
      const d = await loadDraft();
      if (d && (d.category || d.description || (d.evidenceMeta && d.evidenceMeta.length > 0))) {
        setData({
          ...EMPTY,
          category: d.category as CaseCategory | undefined,
          description: d.description || "",
          locationGeneral: d.locationGeneral || "",
          coordinates: d.coordinates,
          incidentChoice: d.incidentChoice || "now",
          customAt: d.incidentAt ? toLocalInput(d.incidentAt) : "",
          privacyMode: d.privacyMode as PrivacyMode | undefined,
          contactName: d.contactName || "",
          evidence: (d.evidenceMeta || []).map((f) => ({ ...f, localId: f.id }))
        });
        setDraftRestored(d.savedAt);
      }
      setOnline(navigator.onLine);
    })();
  }, []);

  // ---- connectivity
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // ---- auto-submission result when returning online (fired by OutboxSync)
  useEffect(() => {
    const onSubmitted = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      setOutcome({
        kind: "submitted",
        caseId: detail.linkedTo || detail.caseId,
        linkedTo: Boolean(detail.linkedTo),
        at: new Date().toISOString()
      });
      clearDraft();
    };
    window.addEventListener("civora:submitted", onSubmitted);
    return () => window.removeEventListener("civora:submitted", onSubmitted);
  }, []);

  // ---- draft autosave (debounced)
  useEffect(() => {
    if (outcome) return;
    const t = setTimeout(() => {
      saveDraft({
        category: data.category,
        description: data.description,
        locationGeneral: data.locationGeneral,
        coordinates: data.coordinates,
        incidentChoice: data.incidentChoice,
        incidentAt: resolveIncidentAt(data),
        privacyMode: data.privacyMode,
        contactName: data.contactName,
        evidenceMeta: data.evidence.map((f) => ({
          id: f.localId,
          fileName: f.fileName,
          mimeType: f.mimeType,
          sizeBytes: f.sizeBytes,
          dataBase64: f.dataBase64
        })),
        step
      }).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [data, step, outcome]);

  const update = useCallback((patch: Partial<WizardData>) => {
    setData((d) => ({ ...d, ...patch }));
    setStepError(null);
  }, []);

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return Boolean(data.category);
      case 1:
        return data.description.trim().length >= 20;
      case 2:
        return true; // location is never mandatory
      case 3:
        return data.incidentChoice !== "custom" || Boolean(data.customAt);
      case 4:
        return true; // evidence is optional
      case 5:
        return Boolean(data.privacyMode);
      default:
        return true;
    }
  }, [step, data]);

  function next() {
    if (!canContinue) {
      setStepError(
        step === 0
          ? "Choose the category that fits best."
          : step === 1
            ? "Please describe what happened in at least 20 characters."
            : step === 3
              ? "Pick the date and time it happened."
              : step === 5
                ? "Choose how your identity should be handled."
                : "This step needs your attention."
      );
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0 });
  }

  function back() {
    if (step === 0) {
      setLeaveOpen(true);
      return;
    }
    setStep((s) => s - 1);
    setStepError(null);
  }

  // ---- submission ----------------------------------------------------------

  async function buildPayload() {
    const evidence = [];
    for (const f of data.evidence) {
      evidence.push({
        fileName: f.fileName,
        mimeType: f.mimeType,
        sizeBytes: f.sizeBytes,
        dataBase64: f.dataBase64
      });
    }
    const incidentAt = resolveIncidentAt(data);
    return {
      category: data.category,
      description: data.description.trim(),
      locationGeneral: data.locationGeneral.trim() || undefined,
      coordinates: data.coordinates,
      incidentAt,
      privacyMode: data.privacyMode,
      contactName: data.privacyMode === "identified" ? data.contactName.trim() || undefined : undefined,
      evidence
    };
  }

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setStepError(null);
    try {
      const payload = await buildPayload();
      if (!navigator.onLine) {
        await queueSubmission(payload);
        setOutcome({ kind: "queued", at: new Date().toISOString() });
        await clearDraft();
        return;
      }
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOutcome({ kind: "error", message: result?.error || "Something went wrong while submitting your report." });
        return;
      }
      if (result.token) await saveToken(result.caseId, result.token);
      await clearDraft();
      setOutcome({
        kind: "submitted",
        caseId: result.linkedTo || result.caseId,
        linkedTo: Boolean(result.linkedTo),
        at: new Date().toISOString()
      });
    } catch {
      // network failure mid-flight → queue for automatic retry
      try {
        const payload = await buildPayload();
        await queueSubmission(payload);
        setOutcome({ kind: "queued", at: new Date().toISOString() });
        await clearDraft();
      } catch {
        setOutcome({ kind: "error", message: "Something went wrong while submitting your report." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function queueNow() {
    const payload = await buildPayload();
    await queueSubmission(payload);
    setOutcome({ kind: "queued", at: new Date().toISOString() });
    await clearDraft();
  }

  // ---- success / queued screens --------------------------------------------

  if (outcome) {
    return <OutcomeScreen outcome={outcome} category={data.category} privacyMode={data.privacyMode} />;
  }

  // ---- wizard ---------------------------------------------------------------

  return (
    <div className="mx-auto flex min-h-dvh max-w-content flex-col px-4 md:px-8">
      <header className="flex h-14 items-center justify-between">
        <button
          onClick={back}
          aria-label={step === 0 ? "Leave report" : "Previous step"}
          className="press flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-muted hover:text-ink"
        >
          <Icon name="chevron-left" className="h-5 w-5" />
        </button>
        <p className="text-[13px] font-medium text-ink-soft">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </p>
        <span className="w-10" aria-hidden="true" />
      </header>

      <div className="mb-6 h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div
          className="h-full rounded-full bg-brand transition-all duration-300"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {!online && (
        <div role="status" className="mb-5 flex items-center gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3 text-[13px] text-ink">
          <Icon name="wifi-off" className="h-4 w-4 shrink-0 text-warning" />
          <span>
            <strong className="font-semibold">No connection.</strong> You can keep writing — your
            draft is saved on this device.
          </span>
        </div>
      )}

      {draftRestored && (
        <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-[13px]">
          <span className="text-ink">
            <strong className="font-semibold">Draft restored</strong>
            <span className="text-ink-soft"> — saved {relativeTime(draftRestored)}</span>
          </span>
          <button
            onClick={async () => {
              await clearDraft();
              setData(EMPTY);
              setDraftRestored(null);
            }}
            className="press shrink-0 rounded-lg px-2.5 py-1.5 font-medium text-brand-deep hover:bg-brand-soft"
          >
            Start over
          </button>
        </div>
      )}

      <main className="flex-1 pb-40">
        {step === 0 && <CategoryStep data={data} onChange={update} />}
        {step === 1 && <DescriptionStep data={data} onChange={update} />}
        {step === 2 && <LocationStep data={data} onChange={update} />}
        {step === 3 && <TimeStep data={data} onChange={update} />}
        {step === 4 && <EvidenceStep data={data} onChange={update} />}
        {step === 5 && <PrivacyStep data={data} onChange={update} />}
        {step === 6 && <ReviewStep data={data} onEdit={(s) => setStep(s)} />}
      </main>

      {/* sticky action bar */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 backdrop-blur shadow-nav md:static md:border-0 md:bg-transparent md:backdrop-blur-none md:shadow-none">
        <div className="mx-auto max-w-content px-4 py-3.5 md:px-0 md:pb-10">
          {stepError && (
            <p role="alert" className="mb-2.5 text-[13px] font-medium text-danger">
              {stepError}
            </p>
          )}
          <div className="flex gap-3 md:justify-end">
            {step > 0 && (
              <Button variant="secondary" onClick={back} className="flex-1 md:flex-none">
                Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={next} className="flex-1 md:flex-none" iconRight="arrow-right">
                Continue
              </Button>
            ) : (
              <Button onClick={submit} disabled={submitting} className="flex-1 md:flex-none">
                {submitting ? (
                  <>
                    <Icon name="loader-circle" className="h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    <Icon name="lock" className="h-4 w-4" /> Submit secure report
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Modal open={leaveOpen} onClose={() => setLeaveOpen(false)} title="Leave this report?">
        <p className="text-sm leading-relaxed text-ink-soft">
          Your draft stays saved on this device. You can pick up where you left off any time.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setLeaveOpen(false)}>
            Keep editing
          </Button>
          <Button variant="primary" href="/home">
            Leave for now
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------- helpers

function resolveIncidentAt(data: WizardData): string | undefined {
  if (data.incidentChoice === "now") return new Date().toISOString();
  if (data.customAt) return new Date(data.customAt).toISOString();
  return undefined;
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---------------------------------------------------------------- steps

function StepTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-[24px] font-bold tracking-[-0.02em] text-ink md:text-[28px]">{title}</h1>
      {hint && <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{hint}</p>}
    </div>
  );
}

function CategoryStep({ data, onChange }: { data: WizardData; onChange: (p: Partial<WizardData>) => void }) {
  const isSafety = data.category === "safety";
  return (
    <div>
      <StepTitle
        title="What would you like to report?"
        hint="Pick the closest fit — the responding organization can adjust it later."
      />
      <div className="grid gap-2.5 sm:grid-cols-2">
        {(Object.keys(CATEGORY_META) as CaseCategory[]).map((key) => {
          const meta = CATEGORY_META[key];
          const active = data.category === key;
          return (
            <button
              key={key}
              onClick={() => onChange({ category: key })}
              aria-pressed={active}
              className={cn(
                "press flex min-h-11 items-start gap-3 rounded-card border px-4 py-4 text-left",
                active
                  ? "border-brand bg-brand-soft/60 ring-2 ring-brand/20"
                  : "border-line bg-surface hover:bg-muted/60"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  active ? "bg-brand text-white" : "bg-muted text-ink-soft"
                )}
              >
                <Icon name={meta.icon} className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-[15px] font-semibold text-ink">{meta.label}</span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-soft">{meta.blurb}</span>
              </span>
            </button>
          );
        })}
      </div>

      {isSafety && (
        <div className="mt-5 rounded-card border border-warning/30 bg-warning-soft/60 px-4 py-4">
          <p className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink">
            <Icon name="siren" className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <span>
              <strong className="font-semibold">Immediate danger?</strong> Contact the appropriate
              emergency or protection service first.{" "}
              <Link href="/resources" className="font-medium text-brand-deep underline underline-offset-2">
                Get help
              </Link>
              . Civora is not an emergency service.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

function DescriptionStep({ data, onChange }: { data: WizardData; onChange: (p: Partial<WizardData>) => void }) {
  return (
    <div>
      <StepTitle title="What happened?" />
      <label htmlFor="report-description" className="sr-only">
        Description
      </label>
      <textarea
        id="report-description"
        value={data.description}
        onChange={(e) => onChange({ description: e.target.value })}
        rows={7}
        maxLength={4000}
        autoFocus
        className="field resize-none leading-relaxed"
        placeholder="Describe what you saw or experienced…"
      />
      <div className="mt-2 flex items-center justify-between text-xs text-ink-soft">
        <p>You don't need to know who is responsible to submit a report.</p>
        <span className="shrink-0 tabular-nums">{data.description.length}/4000</span>
      </div>
    </div>
  );
}

function LocationStep({ data, onChange }: { data: WizardData; onChange: (p: Partial<WizardData>) => void }) {
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  function useCurrent() {
    if (!navigator.geolocation) {
      setLocError("Location isn't available on this device. You can type an area instead.");
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          coordinates: { lat: +pos.coords.latitude.toFixed(5), lng: +pos.coords.longitude.toFixed(5) },
          locationGeneral: data.locationGeneral || "Shared device coordinates"
        });
        setLocating(false);
      },
      () => {
        setLocError("We couldn't get your location. You can type a general area instead.");
        setLocating(false);
      },
      { timeout: 8000 }
    );
  }

  return (
    <div>
      <StepTitle
        title="Where did it happen?"
        hint="A general area or landmark is enough. Location is optional."
      />
      <div className="space-y-2.5">
        <button
          onClick={useCurrent}
          disabled={locating}
          className={cn(
            "press flex min-h-14 w-full items-center gap-3 rounded-card border px-4 text-left",
            data.coordinates ? "border-brand bg-brand-soft/50" : "border-line bg-surface hover:bg-muted/60"
          )}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-ink-soft">
            {locating ? (
              <Icon name="loader-circle" className="h-4 w-4 animate-spin" />
            ) : (
              <Icon name="map-pin" className="h-4 w-4" />
            )}
          </span>
          <span className="flex-1">
            <span className="block text-[14.5px] font-semibold text-ink">Use current location</span>
            <span className="block text-xs text-ink-soft">
              {data.coordinates
                ? `Shared: ${data.coordinates.lat}, ${data.coordinates.lng}`
                : "Adds approximate coordinates to the report"}
            </span>
          </span>
        </button>

        <div className="rounded-card border border-line bg-surface px-4 py-4">
          <label htmlFor="report-location" className="mb-1.5 block text-[14.5px] font-semibold text-ink">
            Select location manually
          </label>
          <input
            id="report-location"
            value={data.locationGeneral}
            onChange={(e) => onChange({ locationGeneral: e.target.value })}
            maxLength={200}
            className="field"
            placeholder="e.g. North walkway, near Halls B entrance"
          />
        </div>

        <button
          onClick={() => onChange({ locationGeneral: "", coordinates: undefined })}
          className="press min-h-11 w-full rounded-card border border-line bg-surface px-4 py-3 text-left text-[14.5px] font-semibold text-ink hover:bg-muted/60"
        >
          Skip location
          <span className="mt-0.5 block text-xs font-normal text-ink-soft">
            The report can still be submitted without it
          </span>
        </button>

        {locError && (
          <p role="alert" className="text-[13px] text-danger">
            {locError}
          </p>
        )}
      </div>
    </div>
  );
}

function TimeStep({ data, onChange }: { data: WizardData; onChange: (p: Partial<WizardData>) => void }) {
  const options: Array<{ key: "now" | "earlier" | "custom"; label: string; hint: string }> = [
    { key: "now", label: "Now", hint: "It's happening or just happened" },
    { key: "earlier", label: "Earlier today", hint: "This morning or afternoon" },
    { key: "custom", label: "Custom date & time", hint: "Pick an exact date and time" }
  ];
  return (
    <div>
      <StepTitle title="When did it happen?" hint="An approximate time is fine." />
      <div className="space-y-2.5">
        {options.map((o) => {
          const active = data.incidentChoice === o.key;
          return (
            <button
              key={o.key}
              onClick={() => onChange({ incidentChoice: o.key })}
              aria-pressed={active}
              className={cn(
                "press flex min-h-14 w-full items-center gap-3 rounded-card border px-4 text-left",
                active ? "border-brand bg-brand-soft/50 ring-2 ring-brand/15" : "border-line bg-surface hover:bg-muted/60"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                  active ? "border-brand bg-brand" : "border-ink-soft/40"
                )}
              >
                {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              <span>
                <span className="block text-[14.5px] font-semibold text-ink">{o.label}</span>
                <span className="block text-xs text-ink-soft">{o.hint}</span>
              </span>
            </button>
          );
        })}
        {data.incidentChoice !== "now" && (
          <div className="rounded-card border border-line bg-surface px-4 py-4">
            <label htmlFor="report-when" className="meta-label mb-1.5 block">
              Date and time
            </label>
            <input
              id="report-when"
              type="datetime-local"
              value={data.customAt}
              max={toLocalInput(new Date().toISOString())}
              onChange={(e) => onChange({ customAt: e.target.value, incidentChoice: "custom" })}
              className="field"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function EvidenceStep({ data, onChange }: { data: WizardData; onChange: (p: Partial<WizardData>) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPreparing(true);
    setError(null);
    try {
      const next: EvidenceItem[] = [];
      for (const f of Array.from(files).slice(0, 6)) {
        const err = fileError(f);
        if (err) {
          setError(err);
          continue;
        }
        const prepared = await prepareFile(f);
        next.push({
          localId: crypto.randomUUID(),
          fileName: prepared.fileName,
          mimeType: prepared.mimeType,
          sizeBytes: prepared.sizeBytes,
          dataBase64: prepared.dataBase64,
          previewUrl: prepared.mimeType.startsWith("image/") ? URL.createObjectURL(f) : undefined
        });
      }
      onChange({ evidence: [...data.evidence, ...next].slice(0, 6) });
    } finally {
      setPreparing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(id: string) {
    onChange({ evidence: data.evidence.filter((f) => f.localId !== id) });
  }

  return (
    <div>
      <StepTitle
        title="Add evidence"
        hint="Photo, video, document or other supporting material. Evidence is optional — you can submit a report without attaching anything."
      />

      <button
        onClick={() => inputRef.current?.click()}
        className="press flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-line bg-surface px-4 py-6 text-center hover:border-brand/50 hover:bg-brand-soft/30"
      >
        {preparing ? (
          <Icon name="loader-circle" className="h-6 w-6 animate-spin text-brand-deep" />
        ) : (
          <Icon name="file-up" className="h-6 w-6 text-ink-soft" />
        )}
        <span className="text-[14.5px] font-semibold text-ink">
          {preparing ? "Preparing files…" : "Attach files"}
        </span>
        <span className="text-xs text-ink-soft">Photos are compressed automatically · max 8 MB each</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/mp4,video/webm,application/pdf,text/plain"
        className="sr-only"
        onChange={(e) => addFiles(e.target.files)}
        aria-label="Attach evidence files"
      />

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">
          {error}
        </p>
      )}

      {data.evidence.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {data.evidence.map((f) => (
            <li key={f.localId} className="flex items-center gap-3 rounded-card border border-line bg-surface px-3.5 py-3">
              {f.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.previewUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-ink-soft">
                  <Icon name={f.mimeType.startsWith("video/") ? "video" : "file-text"} className="h-5 w-5" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium text-ink">{f.fileName}</span>
                <span className="block text-xs text-ink-soft">
                  {(f.sizeBytes / 1024).toFixed(0)} KB · checksum recorded on submit
                </span>
              </span>
              <button
                onClick={() => remove(f.localId)}
                aria-label={`Remove ${f.fileName}`}
                className="press rounded-full p-2 text-ink-soft hover:bg-muted hover:text-ink"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 flex gap-2 text-[12.5px] leading-relaxed text-ink-soft">
        <Icon name="shield-check" className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        Evidence is stored with its source and a SHA-256 checksum so its integrity can be checked
        later.
      </p>
    </div>
  );
}

function PrivacyStep({ data, onChange }: { data: WizardData; onChange: (p: Partial<WizardData>) => void }) {
  return (
    <div>
      <StepTitle
        title="Your privacy"
        hint="Choose how your identity is handled. You can report without identifying yourself."
      />
      <div className="space-y-2.5">
        {(Object.keys(PRIVACY_META) as PrivacyMode[]).map((key) => {
          const meta = PRIVACY_META[key];
          const active = data.privacyMode === key;
          return (
            <button
              key={key}
              onClick={() => onChange({ privacyMode: key })}
              aria-pressed={active}
              className={cn(
                "press flex w-full items-start gap-3 rounded-card border px-4 py-4 text-left",
                active ? "border-brand bg-brand-soft/50 ring-2 ring-brand/15" : "border-line bg-surface hover:bg-muted/60"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  active ? "bg-brand text-white" : "bg-muted text-ink-soft"
                )}
              >
                <Icon name={meta.icon} className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-semibold text-ink">{meta.label}</span>
                  {key === "anonymous" && (
                    <span className="chip bg-success-soft text-success">Recommended default</span>
                  )}
                </span>
                <span className="mt-1 block text-[13px] font-medium text-ink">{meta.title}</span>
                <span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-soft">{meta.body}</span>
              </span>
            </button>
          );
        })}

        {(data.privacyMode === "identified" || data.privacyMode === "confidential") && (
          <div className="rounded-card border border-line bg-surface px-4 py-4">
            <label htmlFor="report-contact" className="meta-label mb-1.5 block">
              Name or contact {data.privacyMode === "identified" ? "(optional)" : "(optional)"}
            </label>
            <input
              id="report-contact"
              value={data.contactName}
              onChange={(e) => onChange({ contactName: e.target.value })}
              maxLength={120}
              className="field"
              placeholder="e.g. Amina, Halls B resident"
            />
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              Only visible to authorized case handlers — never shown publicly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewStep({ data, onEdit }: { data: WizardData; onEdit: (step: number) => void }) {
  const when =
    data.incidentChoice === "now"
      ? "Now (at submission)"
      : data.customAt
        ? new Date(data.customAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
        : "Not set";
  const rows: Array<{ label: string; value: React.ReactNode; step: number }> = [
    {
      label: "Category",
      value: data.category ? CATEGORY_META[data.category].label : "—",
      step: 0
    },
    {
      label: "Description",
      value: <span className="whitespace-pre-wrap">{data.description || "—"}</span>,
      step: 1
    },
    {
      label: "Location",
      value:
        [data.locationGeneral, data.coordinates ? "plus device coordinates" : null]
          .filter(Boolean)
          .join(" · ") || "Not shared",
      step: 2
    },
    { label: "When", value: when, step: 3 },
    {
      label: "Evidence",
      value:
        data.evidence.length === 0
          ? "None attached (optional)"
          : `${data.evidence.length} file${data.evidence.length === 1 ? "" : "s"}`,
      step: 4
    },
    {
      label: "Privacy",
      value: data.privacyMode ? PRIVACY_META[data.privacyMode].label : "—",
      step: 5
    }
  ];

  return (
    <div>
      <StepTitle title="Review your report" hint="Check everything before you submit. You can edit any section." />
      <div className="card divide-y divide-line overflow-hidden">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <p className="meta-label">{r.label}</p>
              <div className="mt-1 text-[14px] leading-relaxed text-ink">{r.value}</div>
            </div>
            <button
              onClick={() => onEdit(r.step)}
              className="press shrink-0 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-brand-deep hover:bg-brand-soft"
              aria-label={`Edit ${r.label}`}
            >
              Edit
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-card bg-muted px-4 py-3.5 text-[12.5px] leading-relaxed text-ink-soft">
        <p className="flex gap-2">
          <Icon name="lock" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink" />
          Your identity is handled according to the privacy
          mode you select.
        </p>
        <p className="mt-2 flex gap-2">
          <Icon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Submitting is not the same as verifying. New reports start as{" "}
          <strong className="font-semibold text-ink">Unverified</strong>.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- outcome

function OutcomeScreen({
  outcome,
  category,
  privacyMode
}: {
  outcome: SubmitOutcome;
  category?: CaseCategory;
  privacyMode?: PrivacyMode;
}) {
  if (outcome.kind === "queued") {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 py-12 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-warning-soft text-warning">
          <Icon name="wifi-off" className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-[24px] font-bold tracking-[-0.02em] text-ink">No connection</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          Your report has been saved securely on this device.
          <br />
          We'll submit it when you're back online.
        </p>
        <div className="mt-7 flex w-full flex-col gap-2.5">
          <Button href="/home" size="lg">
            Back to home
          </Button>
          <Button href="/cases" size="lg" variant="secondary">
            Your cases
          </Button>
        </div>
      </div>
    );
  }

  if (outcome.kind === "error") {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 py-12 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-soft text-danger">
          <Icon name="circle-alert" className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-[22px] font-bold tracking-[-0.02em] text-ink">
          Something went wrong while submitting your report.
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">{outcome.message}</p>
        <div className="mt-7 flex w-full flex-col gap-2.5">
          <Button size="lg" onClick={() => window.location.reload()}>
            Try again
          </Button>
          <Button size="lg" variant="secondary" href="/home">
            Back to home
          </Button>
        </div>
      </div>
    );
  }

  const meta = privacyMode ? PRIVACY_META[privacyMode] : null;
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 py-12 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
        <Icon name="check-circle-2" className="h-7 w-7" strokeWidth={1.8} />
      </span>
      <h1 className="mt-5 text-[26px] font-bold tracking-[-0.02em] text-ink">
        {outcome.linkedTo ? "Report submitted safely." : "Report submitted safely."}
      </h1>
      <p className="mt-2.5 font-mono text-[15px] font-semibold text-ink">
        CASE #{outcome.caseId}
      </p>
      <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">
        {outcome.linkedTo
          ? "Your report matched an existing case and was recorded as an independent corroborating report."
          : "Your report has been added to Civora."}{" "}
        It has <strong className="font-semibold text-ink">not yet been verified</strong> — that
        happens through evidence and review.
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {meta && (
          <span className="chip bg-muted text-ink-soft">
            <Icon name={meta.icon} className="h-3.5 w-3.5" /> {meta.label}
          </span>
        )}
        {category && (
          <span className="chip bg-muted text-ink-soft">
            <Icon name={CATEGORY_META[category].icon} className="h-3.5 w-3.5" />
            {CATEGORY_META[category].label}
          </span>
        )}
        <span className="chip bg-muted text-ink-soft">
          <Icon name="clock" className="h-3.5 w-3.5" />
          {new Date(outcome.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="mt-8 flex w-full flex-col gap-2.5">
        <Button href={`/cases/${outcome.caseId}`} size="lg">
          View case
        </Button>
        <Button href="/home" size="lg" variant="secondary">
          Back to home
        </Button>
      </div>
    </div>
  );
}
