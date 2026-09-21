"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";
import Link from "next/link";
import { cn, relativeTime } from "@/lib/utils";
import { CATEGORY_META, PRIVACY_META } from "@/lib/types";
import type { CaseCategory, PrivacyMode } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { fileError, prepareFile, uploadEvidence, type PreparedFile } from "@/lib/client/upload";
import {
  clearDraft,
  loadDraft,
  persistenceMode,
  queueSubmission,
  saveDraft,
  saveToken
} from "@/lib/offline/db";
import { SUBMITTED_EVENT } from "@/lib/offline/sync";

// ---------------------------------------------------------------- state model

interface WizardData {
  category?: CaseCategory;
  description: string;
  locationGeneral: string;
  coordinates?: { lat: number; lng: number };
  incidentChoice: "now" | "earlier" | "custom";
  customAt: string; // datetime-local value
  privacyMode?: PrivacyMode;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  preferredChannel: "email" | "phone" | "none";
  /** Reporter opted in to a one-time code for regaining access elsewhere. */
  withRecoveryCode: boolean;
  /** Files are held as Blobs and uploaded as binary, never as base64 JSON. */
  evidence: PreparedFile[];
}

const EMPTY: WizardData = {
  description: "",
  locationGeneral: "",
  incidentChoice: "now",
  customAt: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  preferredChannel: "none",
  withRecoveryCode: false,
  evidence: []
};

const STEPS = ["Category", "Description", "Location", "Time", "Evidence", "Privacy", "Review"] as const;

interface SubmittedOutcome {
  kind: "submitted";
  caseId: string;
  at: string;
  recoveryCode?: string;
  publicVisible: boolean;
  publicationState: string;
  possibleMatches: Array<{ caseId: string; score: number }>;
  attachmentsFailed: number;
}

type SubmitOutcome =
  | SubmittedOutcome
  | { kind: "queued"; at: string; durable: boolean }
  | { kind: "error"; message: string };

export function ReportWizard() {
  const { locale } = useLocale();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(EMPTY);
  const [stepError, setStepError] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<SubmitOutcome | null>(null);
  const [online, setOnline] = useState(true);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [storageDegraded, setStorageDegraded] = useState(false);
  const restoredRef = useRef(false);

  // ---- draft restore
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    (async () => {
      const d = await loadDraft();
      if (d && (d.category || d.description || (d.evidence && d.evidence.length > 0))) {
        setData({
          ...EMPTY,
          category: d.category as CaseCategory | undefined,
          description: d.description || "",
          locationGeneral: d.locationGeneral || "",
          coordinates: d.coordinates,
          incidentChoice: d.incidentChoice || "now",
          customAt: d.incidentAt ? toLocalInput(d.incidentAt) : "",
          privacyMode: d.privacyMode as PrivacyMode | undefined,
          contactName: d.contact?.name || "",
          contactEmail: d.contact?.email || "",
          contactPhone: d.contact?.phone || "",
          preferredChannel: (d.contact?.preferredChannel as WizardData["preferredChannel"]) || "none",
          evidence: (d.evidence || []).map((f) => ({
            id: f.id,
            fileName: f.fileName,
            mimeType: f.mimeType,
            sizeBytes: f.sizeBytes,
            blob: f.blob,
            previewUrl: f.mimeType.startsWith("image/") ? URL.createObjectURL(f.blob) : undefined
          }))
        });
        setDraftRestored(d.savedAt);
      }
      setOnline(navigator.onLine);
      setStorageDegraded(persistenceMode() === "memory");
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

  // A queued report can complete while this screen is open — in this tab or
  // another one. The sync engine broadcasts the outcome; we show it here.
  useEffect(() => {
    const onSubmitted = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { ok?: boolean; caseId?: string; possibleMatches?: Array<{ caseId: string; score: number }>; error?: string }
        | undefined;
      if (!detail) return;
      if (detail.ok && detail.caseId) {
        setOutcome({
          kind: "submitted",
          caseId: detail.caseId,
          at: new Date().toISOString(),
          publicVisible: false,
          publicationState: "screening",
          possibleMatches: detail.possibleMatches || [],
          attachmentsFailed: 0
        });
        void clearDraft();
      } else if (detail.error) {
        setOutcome({ kind: "error", message: detail.error });
      }
    };
    window.addEventListener(SUBMITTED_EVENT, onSubmitted);
    return () => window.removeEventListener(SUBMITTED_EVENT, onSubmitted);
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
        contact: contactFor(data),
        evidence: data.evidence.map((f) => ({
          id: f.id,
          fileName: f.fileName,
          mimeType: f.mimeType,
          sizeBytes: f.sizeBytes,
          blob: f.blob
        })),
        step
      })
        .then(() => setStorageDegraded(persistenceMode() === "memory"))
        .catch(() => setStorageDegraded(true));
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
          ? t("report.error.category", locale)
          : step === 1
            ? t("report.error.description", locale)
            : step === 3
              ? t("report.error.time", locale)
              : step === 5
                ? t("report.error.privacy", locale)
                : t("report.error.general", locale)
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

  /**
   * Report metadata only.
   *
   * Files are uploaded separately once the case exists, so a six-photo report
   * is six bounded requests rather than one very large base64 body that a weak
   * connection is likely to drop.
   */
  function buildPayload() {
    return {
      category: data.category,
      description: data.description.trim(),
      locationGeneral: data.locationGeneral.trim() || undefined,
      coordinates: data.coordinates,
      incidentAt: resolveIncidentAt(data),
      privacyMode: data.privacyMode,
      contact: data.privacyMode === "anonymous" ? undefined : contactFor(data),
      withRecoveryCode: data.withRecoveryCode,
      plannedEvidenceCount: data.evidence.length
    };
  }

  function queuedFiles() {
    return data.evidence.map((f) => ({
      id: f.id,
      fileName: f.fileName,
      mimeType: f.mimeType,
      blob: f.blob
    }));
  }

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setStepError(null);
    const payload = buildPayload();
    try {
      if (!navigator.onLine) {
        await queueOffline(payload);
        return;
      }
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOutcome({ kind: "error", message: result?.error || t("report.error.submit", locale) });
        return;
      }

      // The tracking token is returned once. Store it before anything else, so
      // a later failure can never cost the reporter access to their own case.
      if (result.token) await saveToken(result.caseId, result.token);

      let attachmentsFailed = 0;
      for (const file of data.evidence) {
        const upload = await uploadEvidence(result.caseId, result.token, file);
        if (!upload.ok) attachmentsFailed += 1;
      }

      await clearDraft();
      setOutcome({
        kind: "submitted",
        caseId: result.caseId,
        at: new Date().toISOString(),
        recoveryCode: result.recoveryCode,
        publicVisible: Boolean(result.publicVisible),
        publicationState: String(result.publicationState || "screening"),
        possibleMatches: result.possibleMatches || [],
        attachmentsFailed
      });
    } catch {
      // Lost the network mid-flight — queue it rather than losing the report.
      try {
        await queueOffline(payload);
      } catch {
        setOutcome({ kind: "error", message: t("report.error.submit", locale) });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function queueOffline(payload: ReturnType<typeof buildPayload>) {
    await queueSubmission(payload, queuedFiles());
    setOutcome({
      kind: "queued",
      at: new Date().toISOString(),
      durable: persistenceMode() === "indexeddb"
    });
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
          aria-label={step === 0 ? t("report.leave_report", locale) : t("report.previous_step", locale)}
          className="press flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-muted hover:text-ink"
        >
          <Icon name="chevron-left" className="h-5 w-5" />
        </button>
        {/* Announced on change so a screen-reader user hears which step they
            moved to, rather than only seeing the progress bar. */}
        <p role="status" aria-live="polite" className="text-[13px] font-medium text-ink-soft">
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
            <strong className="font-semibold">{t("report.no_connection.title", locale)}</strong> {t("report.no_connection.desc", locale)}
          </span>
        </div>
      )}

      {storageDegraded && (
        <div role="status" className="mb-5 flex items-start gap-2.5 rounded-2xl border border-warning/40 bg-warning-soft/50 px-4 py-3 text-[13px] text-ink">
          <Icon name="triangle-alert" className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <span>
            <strong className="font-semibold">{t("report.storage.title", locale) || "This browser isn't saving your draft."}</strong>{" "}
            {t("report.storage.desc", locale) ||
              "Private browsing or a storage restriction is blocking on-device saving. Your report is kept in memory only — please finish and submit it without closing this tab."}
          </span>
        </div>
      )}

      {draftRestored && (
        <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-[13px]">
          <span className="text-ink">
            <strong className="font-semibold">{t("report.draft_restored.title", locale)}</strong>
            <span className="text-ink-soft"> {t("report.draft_restored.desc", locale)} {relativeTime(draftRestored, Date.now(), locale)}</span>
          </span>
          <button
            onClick={async () => {
              await clearDraft();
              setData(EMPTY);
              setDraftRestored(null);
            }}
            className="press shrink-0 rounded-lg px-2.5 py-1.5 font-medium text-brand-deep hover:bg-brand-soft"
          >{t("report.draft_restored.start_over", locale)}</button>
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
              <Button variant="secondary" onClick={back} className="flex-1 md:flex-none">{t("report.action.back", locale)}</Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={next} className="flex-1 md:flex-none" iconRight="arrow-right">{t("report.action.continue", locale)}</Button>
            ) : (
              <Button onClick={submit} disabled={submitting} className="flex-1 md:flex-none">
                {submitting ? (
                  <>
                    <Icon name="loader-circle" className="h-4 w-4 animate-spin" /> {t("report.action.submitting", locale)}
                  </>
                ) : (
                  <>
                    <Icon name="lock" className="h-4 w-4" /> {t("report.action.submit_secure", locale)}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Modal open={leaveOpen} onClose={() => setLeaveOpen(false)} title={t("report.leave.title", locale)}>
        <p className="text-sm leading-relaxed text-ink-soft">
          {t("report.leave.desc", locale)}
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setLeaveOpen(false)}>{t("report.leave.keep_editing", locale)}</Button>
          <Button variant="primary" href="/home">{t("report.leave.leave_now", locale)}</Button>
        </div>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------- helpers

/** Only the fields the reporter actually filled in; anonymous sends nothing. */
function contactFor(data: WizardData) {
  if (data.privacyMode === "anonymous" || !data.privacyMode) return undefined;
  const contact = {
    name: data.contactName.trim() || undefined,
    email: data.contactEmail.trim() || undefined,
    phone: data.contactPhone.trim() || undefined,
    preferredChannel: data.preferredChannel
  };
  return contact.name || contact.email || contact.phone ? contact : undefined;
}

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
  const { locale } = useLocale();
  const isSafety = data.category === "safety";
  return (
    <div>
      <StepTitle
        title={t("report.category.title", locale)}
        hint={t("report.category.hint", locale)}
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
                "press flex min-h-11 items-start gap-3 rounded-card border px-4 py-4 text-start",
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
              <strong className="font-semibold">{t("report.category.immediate_danger", locale)}</strong> {t("report.category.danger_desc1", locale)}{" "}
              <Link href="/resources" className="font-medium text-brand-deep underline underline-offset-2">{t("report.category.danger_help", locale)}</Link>
              {t("report.category.danger_desc2", locale)}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

function DescriptionStep({ data, onChange }: { data: WizardData; onChange: (p: Partial<WizardData>) => void }) {
  const { locale } = useLocale();
  return (
    <div>
      <StepTitle title={t("report.description.title", locale)} />
      <label htmlFor="report-description" className="sr-only">
        {t("report.step_name.description", locale)}
      </label>
      <textarea
        id="report-description"
        value={data.description}
        onChange={(e) => onChange({ description: e.target.value })}
        rows={7}
        maxLength={4000}
        autoFocus
        className="field resize-none leading-relaxed"
        placeholder={t("report.description.placeholder", locale)}
      />
      <div className="mt-2 flex items-center justify-between text-xs text-ink-soft">
        <p>{t("report.description.hint", locale)}</p>
        <span className="shrink-0 tabular-nums">{data.description.length}/4000</span>
      </div>
    </div>
  );
}

function LocationStep({ data, onChange }: { data: WizardData; onChange: (p: Partial<WizardData>) => void }) {
  const { locale } = useLocale();
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  function useCurrent() {
    if (!navigator.geolocation) {
      setLocError(t("report.location.error_unavailable", locale));
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
        setLocError(t("report.location.error_failed", locale));
        setLocating(false);
      },
      { timeout: 8000 }
    );
  }

  return (
    <div>
      <StepTitle
        title={t("report.location.title", locale)}
        hint={t("report.location.hint", locale)}
      />
      <div className="space-y-2.5">
        <button
          onClick={useCurrent}
          disabled={locating}
          className={cn(
            "press flex min-h-14 w-full items-center gap-3 rounded-card border px-4 text-start",
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
            <span className="block text-[14.5px] font-semibold text-ink">{t("report.location.use_current", locale)}</span>
            <span className="block text-xs text-ink-soft">
              {data.coordinates
                ? `${t("report.location.shared", locale)} ${data.coordinates.lat}, ${data.coordinates.lng}`
                : t("report.location.adds_approx", locale)}
            </span>
          </span>
        </button>

        <div className="rounded-card border border-line bg-surface px-4 py-4">
          <label htmlFor="report-location" className="mb-1.5 block text-[14.5px] font-semibold text-ink">
            {t("report.location.select_manual", locale)}
          </label>
          <input
            id="report-location"
            value={data.locationGeneral}
            onChange={(e) => onChange({ locationGeneral: e.target.value })}
            maxLength={200}
            className="field"
            placeholder={t("report.location.placeholder", locale)}
          />
        </div>

        <button
          onClick={() => onChange({ locationGeneral: "", coordinates: undefined })}
          className="press min-h-11 w-full rounded-card border border-line bg-surface px-4 py-3 text-start text-[14.5px] font-semibold text-ink hover:bg-muted/60"
        >
          {t("report.location.skip", locale)}
          <span className="mt-0.5 block text-xs font-normal text-ink-soft">
            {t("report.location.skip_hint", locale)}
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
  const { locale } = useLocale();
  const options: Array<{ key: "now" | "earlier" | "custom"; label: string; hint: string }> = [
    { key: "now", label: t("report.time.now.label", locale), hint: t("report.time.now.hint", locale) },
    { key: "earlier", label: t("report.time.earlier.label", locale), hint: t("report.time.earlier.hint", locale) },
    { key: "custom", label: t("report.time.custom.label", locale), hint: t("report.time.custom.hint", locale) }
  ];
  return (
    <div>
      <StepTitle title={t("report.time.title", locale)} hint={t("report.time.hint", locale)} />
      <div className="space-y-2.5">
        {options.map((o) => {
          const active = data.incidentChoice === o.key;
          return (
            <button
              key={o.key}
              onClick={() => onChange({ incidentChoice: o.key })}
              aria-pressed={active}
              className={cn(
                "press flex min-h-14 w-full items-center gap-3 rounded-card border px-4 text-start",
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
              {t("report.time.date_time_label", locale)}
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
  const { locale } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPreparing(true);
    setError(null);
    try {
      const next: PreparedFile[] = [];
      for (const f of Array.from(files).slice(0, 6)) {
        const err = fileError(f);
        if (err) {
          setError(err);
          continue;
        }
        next.push(await prepareFile(f));
      }
      onChange({ evidence: [...data.evidence, ...next].slice(0, 6) });
    } finally {
      setPreparing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(id: string) {
    const removed = data.evidence.find((f) => f.id === id);
    if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
    onChange({ evidence: data.evidence.filter((f) => f.id !== id) });
  }

  return (
    <div>
      <StepTitle
        title={t("report.evidence.title", locale)}
        hint={t("report.evidence.hint", locale)}
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
          {preparing ? t("report.evidence.preparing", locale) : t("report.evidence.attach", locale)}
        </span>
        <span className="text-xs text-ink-soft">{t("report.evidence.compress_hint", locale)}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/mp4,video/webm,application/pdf,text/plain"
        className="sr-only"
        onChange={(e) => addFiles(e.target.files)}
        aria-label={t("report.evidence.attach_label", locale)}
      />

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">
          {error}
        </p>
      )}

      {data.evidence.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {data.evidence.map((f) => (
            <li key={f.id} className="flex items-center gap-3 rounded-card border border-line bg-surface px-3.5 py-3">
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
                  {(f.sizeBytes / 1024).toFixed(0)} {t("report.evidence.kb", locale)}
                </span>
              </span>
              <button
                onClick={() => remove(f.id)}
                aria-label={`${t("report.evidence.remove", locale)} ${f.fileName}`}
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
        {t("report.evidence.integrity", locale)}
      </p>
      <p className="mt-2 flex gap-2 text-[12.5px] leading-relaxed text-ink-soft">
        <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0" />
        {t("report.evidence.visibility", locale) ||
          "Attachments start restricted: only you and the organization handling the case can open them. A case handler decides whether anything is safe to publish."}
      </p>
    </div>
  );
}

function PrivacyStep({ data, onChange }: { data: WizardData; onChange: (p: Partial<WizardData>) => void }) {
  const { locale } = useLocale();
  return (
    <div>
      <StepTitle
        title={t("report.privacy.title", locale)}
        hint={t("report.privacy.hint", locale)}
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
                "press flex w-full items-start gap-3 rounded-card border px-4 py-4 text-start",
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
                    <span className="chip bg-success-soft text-success">{t("report.privacy.recommended", locale)}</span>
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
            <p className="mb-3 flex gap-2 text-xs leading-relaxed text-ink-soft">
              <Icon name="lock" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {t("report.privacy.contact_intro", locale) ||
                "Share only what you're comfortable with — every field here is optional. Contact details are stored separately from the case and are never shown publicly."}
            </p>

            <label htmlFor="report-contact" className="meta-label mb-1.5 block">
              {t("report.privacy.name_label", locale)}
            </label>
            <input
              id="report-contact"
              value={data.contactName}
              onChange={(e) => onChange({ contactName: e.target.value })}
              maxLength={120}
              autoComplete="name"
              className="field"
              placeholder={t("report.privacy.name_placeholder", locale)}
            />

            <label htmlFor="report-contact-email" className="meta-label mb-1.5 mt-3.5 block">
              {t("report.privacy.email_label", locale) || "Email (optional)"}
            </label>
            <input
              id="report-contact-email"
              type="email"
              value={data.contactEmail}
              onChange={(e) => onChange({ contactEmail: e.target.value })}
              maxLength={200}
              autoComplete="email"
              className="field"
              placeholder="you@example.com"
            />

            <label htmlFor="report-contact-phone" className="meta-label mb-1.5 mt-3.5 block">
              {t("report.privacy.phone_label", locale) || "Phone (optional)"}
            </label>
            <input
              id="report-contact-phone"
              type="tel"
              value={data.contactPhone}
              onChange={(e) => onChange({ contactPhone: e.target.value })}
              maxLength={40}
              autoComplete="tel"
              className="field"
            />

            <fieldset className="mt-4">
              <legend className="meta-label mb-1.5">
                {t("report.privacy.channel_label", locale) || "How should they reach you?"}
              </legend>
              <div className="flex flex-wrap gap-2">
                {(["email", "phone", "none"] as const).map((channel) => (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => onChange({ preferredChannel: channel })}
                    aria-pressed={data.preferredChannel === channel}
                    className={cn(
                      "press min-h-10 rounded-btn px-3.5 text-[13px] font-medium",
                      data.preferredChannel === channel
                        ? "bg-brand text-white"
                        : "bg-muted text-ink-soft hover:text-ink"
                    )}
                  >
                    {channel === "email"
                      ? t("report.privacy.channel_email", locale) || "Email"
                      : channel === "phone"
                        ? t("report.privacy.channel_phone", locale) || "Phone"
                        : t("report.privacy.channel_none", locale) || "Don't contact me"}
                  </button>
                ))}
              </div>
            </fieldset>

            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              {t("report.privacy.name_hint", locale)}
            </p>
          </div>
        )}

        <div className="rounded-card border border-line bg-surface px-4 py-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={data.withRecoveryCode}
              onChange={(e) => onChange({ withRecoveryCode: e.target.checked })}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-line text-brand focus:ring-brand"
            />
            <span>
              <span className="block text-[14.5px] font-semibold text-ink">
                {t("report.privacy.recovery_label", locale) || "Give me a recovery code"}
              </span>
              <span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-soft">
                {t("report.privacy.recovery_hint", locale) ||
                  "Your case is tracked on this device only. A one-time code lets you open it from another device if you lose this one — write it down, because it is shown once and we only store a hash of it."}
              </span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ data, onEdit }: { data: WizardData; onEdit: (step: number) => void }) {
  const { locale } = useLocale();
  const when =
    data.incidentChoice === "now"
      ? t("report.review.when_now", locale)
      : data.customAt
        ? new Date(data.customAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
        : t("report.review.not_set", locale);
  const rows: Array<{ label: string; value: React.ReactNode; step: number }> = [
    {
      label: t("report.step_name.category", locale),
      value: data.category ? CATEGORY_META[data.category].label : t("report.review.none", locale),
      step: 0
    },
    {
      label: t("report.step_name.description", locale),
      value: <span className="whitespace-pre-wrap">{data.description || t("report.review.none", locale)}</span>,
      step: 1
    },
    {
      label: t("report.step_name.location", locale),
      value:
        [data.locationGeneral, data.coordinates ? t("report.review.plus_coordinates", locale) : null]
          .filter(Boolean)
          .join(" · ") || t("report.review.not_shared", locale),
      step: 2
    },
    { label: t("report.step_name.time", locale), value: when, step: 3 },
    {
      label: t("report.step_name.evidence", locale),
      value:
        data.evidence.length === 0
          ? t("report.review.none_attached", locale)
          : `${data.evidence.length} ${data.evidence.length === 1 ? t("report.review.file", locale) : t("report.review.files", locale)}`,
      step: 4
    },
    {
      label: t("report.step_name.privacy", locale),
      value: data.privacyMode ? PRIVACY_META[data.privacyMode].label : t("report.review.none", locale),
      step: 5
    }
  ];

  const sensitive = data.category === "safety" || data.category === "dispute";

  return (
    <div>
      <StepTitle title={t("report.review.title", locale)} hint={t("report.review.hint", locale)} />
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
              aria-label={`${t("report.review.edit", locale)} ${r.label}`}
            >{t("report.review.edit", locale)}</button>
          </div>
        ))}
      </div>

      {/* What actually happens to this text, in plain words. The description
          is not published as written — a handler writes the public summary. */}
      <div className="mt-4 rounded-card border border-line bg-surface px-4 py-4">
        <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
          <Icon name="eye" className="h-4 w-4 text-brand-deep" />
          {t("report.review.whoSees.title", locale) || "Who will see what you wrote"}
        </h2>
        <ul className="mt-3 space-y-2.5 text-[12.5px] leading-relaxed text-ink-soft">
          <li className="flex gap-2">
            <Icon name="lock" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink" />
            <span>
              <strong className="font-semibold text-ink">
                {t("report.review.whoSees.descriptionTitle", locale) || "Your description stays private."}
              </strong>{" "}
              {t("report.review.whoSees.description", locale) ||
                "It goes to the organization handling the case, and back to you on your case page. It is never copied onto the public board as you wrote it."}
            </span>
          </li>
          <li className="flex gap-2">
            <Icon name="scroll-text" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink" />
            <span>
              <strong className="font-semibold text-ink">
                {t("report.review.whoSees.publicTitle", locale) || "A short public summary may be published."}
              </strong>{" "}
              {t("report.review.whoSees.public", locale) ||
                "A case handler writes it, based on the category and area — not on your wording."}
            </span>
          </li>
          <li className="flex gap-2">
            <Icon name="paperclip" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink" />
            <span>
              {t("report.review.whoSees.evidence", locale) ||
                "Anything you attach starts restricted and is only published if a handler decides it is safe to."}
            </span>
          </li>
          {sensitive && (
            <li className="flex gap-2 rounded-xl bg-warning-soft/60 px-3 py-2">
              <Icon name="triangle-alert" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
              <span className="text-ink">
                {t("report.review.whoSees.sensitive", locale) ||
                  "Because of what you're reporting, this case is held for review before it can appear publicly at all."}
              </span>
            </li>
          )}
          <li className="flex gap-2">
            <Icon name="user-round" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink" />
            <span>
              {data.privacyMode
                ? PRIVACY_META[data.privacyMode].publicLine
                : t("report.review.whoSees.choosePrivacy", locale) || "Choose a privacy option above."}
              {". "}
              {t("report.review.whoSees.namesWarning", locale) ||
                "If you named someone in your description, that stays in the private text — but consider whether it needs to be there at all."}
            </span>
          </li>
        </ul>
      </div>

      <div className="mt-3 rounded-card bg-muted px-4 py-3.5 text-[12.5px] leading-relaxed text-ink-soft">
        <p className="flex gap-2">
          <Icon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {t("report.review.unverified_note_1", locale)}{" "}
            <strong className="font-semibold text-ink">{t("report.review.unverified_note_2", locale)}</strong>
          </span>
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
  const { locale } = useLocale();

  if (outcome.kind === "queued") {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 py-12 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-warning-soft text-warning">
          <Icon name="wifi-off" className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-[24px] font-bold tracking-[-0.02em] text-ink">
          {t("report.outcome.queued.title", locale)}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          {t("report.outcome.queued.desc", locale)}
        </p>
        {!outcome.durable && (
          <p role="alert" className="mt-4 rounded-2xl bg-warning-soft px-4 py-3 text-[13px] leading-relaxed text-ink">
            {t("report.outcome.queued.memory", locale) ||
              "This browser isn't letting Civora save data on your device, so the queued report will be lost if you close this tab. Keep it open until you reconnect."}
          </p>
        )}
        <div className="mt-7 flex w-full flex-col gap-2.5">
          <Button href="/home" size="lg">
            {t("report.outcome.back_home", locale) || "Back to home"}
          </Button>
          <Button href="/cases" size="lg" variant="secondary">
            {t("cases.title", locale) || "Your cases"}
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
          {t("report.outcome.error.title", locale) || "Something went wrong while submitting your report."}
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">{outcome.message}</p>
        <div className="mt-7 flex w-full flex-col gap-2.5">
          <Button size="lg" onClick={() => window.location.reload()}>
            {t("report.outcome.try_again", locale) || "Try again"}
          </Button>
          <Button size="lg" variant="secondary" href="/home">
            {t("report.outcome.back_home", locale) || "Back to home"}
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
        {t("report.outcome.success.title", locale)}
      </h1>
      <p className="mt-2.5 font-mono text-[15px] font-semibold text-ink">
        {t("report.outcome.success.case", locale)}
        {outcome.caseId}
      </p>
      <p className="mt-3 text-[14.5px] leading-relaxed text-ink-soft">
        {t("report.outcome.success.new_desc", locale)}{" "}
        {t("report.outcome.success.not_verified_1", locale)}{" "}
        <strong className="font-semibold text-ink">{t("report.outcome.success.not_verified_2", locale)}</strong>{" "}
        {t("report.outcome.success.not_verified_3", locale)}
      </p>

      {/* Possible corroboration is reported as exactly that: a candidate a
          person still has to confirm. It is never announced as verification. */}
      {outcome.possibleMatches.length > 0 && (
        <div className="mt-5 w-full rounded-card border border-info/30 bg-info-soft/40 px-4 py-3.5 text-start">
          <p className="flex gap-2 text-[13px] leading-relaxed text-ink">
            <Icon name="search" className="mt-0.5 h-4 w-4 shrink-0 text-info" />
            <span>
              <strong className="font-semibold">
                {t("report.outcome.match.title", locale) || "This may relate to an existing case."}
              </strong>{" "}
              {(t("report.outcome.match.desc", locale) ||
                "Civora found {ids} nearby in time and place. A case handler reviews the link — until they confirm it, nothing is treated as corroborated.").replace(
                "{ids}",
                outcome.possibleMatches.map((m) => m.caseId).join(", ")
              )}
            </span>
          </p>
        </div>
      )}

      {!outcome.publicVisible && (
        <p className="mt-4 w-full rounded-card bg-muted px-4 py-3 text-start text-[12.5px] leading-relaxed text-ink-soft">
          <Icon name="eye-off" className="me-1.5 inline h-3.5 w-3.5" />
          {t("report.outcome.screening", locale) ||
            "Your case is not on the public board. It is held for review first — you can always see it here, and so can the organization handling it."}
        </p>
      )}

      {outcome.attachmentsFailed > 0 && (
        <p role="alert" className="mt-4 w-full rounded-card bg-warning-soft px-4 py-3 text-start text-[12.5px] leading-relaxed text-ink">
          <Icon name="triangle-alert" className="me-1.5 inline h-3.5 w-3.5 text-warning" />
          {(t("report.outcome.attachments_failed", locale) ||
            "{count} attachment(s) didn't upload. Your report was recorded — open the case to attach them again.").replace(
            "{count}",
            String(outcome.attachmentsFailed)
          )}
        </p>
      )}

      {outcome.recoveryCode && (
        <div className="mt-5 w-full rounded-card border border-brand/30 bg-brand-soft/40 px-4 py-4 text-start">
          <p className="text-[13px] font-semibold text-ink">
            {t("report.outcome.recovery.title", locale) || "Your one-time recovery code"}
          </p>
          <p className="mt-2 select-all rounded-xl bg-surface px-3 py-2.5 text-center font-mono text-[18px] font-bold tracking-widest text-ink">
            {outcome.recoveryCode}
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
            {t("report.outcome.recovery.hint", locale) ||
              "Write this down now. It is shown once and only its hash is stored, so nobody — including us — can recover it for you. It lets you open this case from another device."}
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {meta && (
          <span className="chip bg-muted text-ink-soft">
            <Icon name={meta.icon} className="h-3.5 w-3.5" /> {meta.label}
          </span>
        )}
        {category && (
          <span className="chip bg-muted text-ink-soft">
            <Icon name={CATEGORY_META[category].icon} className="h-3.5 w-3.5" />
            {t(CATEGORY_META[category].labelKey, locale) || CATEGORY_META[category].label}
          </span>
        )}
        <span className="chip bg-muted text-ink-soft">
          <Icon name="clock" className="h-3.5 w-3.5" />
          {new Date(outcome.at).toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
          })}
        </span>
      </div>

      <div className="mt-8 flex w-full flex-col gap-2.5">
        <Button href={`/cases/${outcome.caseId}`} size="lg">
          {t("report.outcome.view_case", locale) || "View case"}
        </Button>
        <Button href="/home" size="lg" variant="secondary">
          {t("report.outcome.back_home", locale) || "Back to home"}
        </Button>
      </div>
    </div>
  );
}
