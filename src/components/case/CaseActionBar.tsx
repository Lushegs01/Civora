"use client";

import { useRef, useState } from "react";
import type { PublicCaseView, ReporterCaseView } from "@/lib/dto/case";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { fileError, prepareFile, uploadEvidence } from "@/lib/client/upload";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

/**
 * What a viewer can do with a case.
 *
 * Reporter affordances appear only when the page was loaded with a valid
 * tracking token, which the server verified before returning the reporter
 * view — the client never decides this for itself.
 */
export function CaseActionBar({
  view,
  token,
  onChanged
}: {
  view: PublicCaseView | ReporterCaseView;
  token?: string;
  onChanged?: () => void;
}) {
  const { locale } = useLocale();
  const [message, setMessage] = useState<string | null>(null);
  const [showAddEvidence, setShowAddEvidence] = useState(false);

  const isReporter = view.role === "reporter" && Boolean(token);
  const closed = view.response === "closed";

  async function share() {
    const url = `${window.location.origin}/community/${view.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Civora case ${view.id}`,
          text: `Public case ${view.id}: ${view.title}`,
          url
        });
        return;
      }
      throw new Error("no share");
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setMessage(t("case.linkCopied", locale));
      } catch {
        setMessage(url);
      }
    }
  }

  async function requestUpdate() {
    if (!token) return;
    try {
      const res = await fetch("/api/cases/request-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: view.id, token })
      });
      const data = await res.json().catch(() => ({}));
      setMessage(res.ok ? t("case.updateRequested", locale) : data?.error || t("case.updateFailed", locale));
      if (res.ok) onChanged?.();
    } catch {
      setMessage(t("case.updateFailed", locale));
    }
  }

  return (
    <section aria-label={t("case.whatNext", locale)} className="card px-5 py-5">
      <h2 className="meta-label mb-4">{t("case.whatNext", locale)}</h2>
      <div className="flex flex-wrap gap-2">
        {isReporter && !closed && (
          <Button icon="paperclip" onClick={() => setShowAddEvidence(true)}>
            {t("case.addEvidence", locale)}
          </Button>
        )}
        {view.publicationState === "public_case" && (
          <Button icon="share" variant="secondary" onClick={share}>
            {t("case.sharePublic", locale)}
          </Button>
        )}
        {isReporter && !closed && (
          <Button icon="clock" variant="secondary" onClick={requestUpdate}>
            {t("case.requestUpdate", locale)}
          </Button>
        )}
        {view.category === "safety" && (
          <Button icon="siren" variant="brandSoft" href="/resources">
            {t("case.urgentDanger", locale)}
          </Button>
        )}
        <Button icon="plus" variant="ghost" href="/report">
          {t("case.reportAnother", locale)}
        </Button>
      </div>

      {view.publicationState !== "public_case" && (
        <p className="mt-4 flex gap-2 rounded-2xl bg-muted px-4 py-3 text-[12.5px] leading-relaxed text-ink-soft">
          <Icon name="eye-off" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <strong className="font-semibold text-ink">{view.publicationLabel}.</strong>{" "}
            {view.publicationDescription}
          </span>
        </p>
      )}

      {message && (
        <p
          role="status"
          className="mt-4 rounded-2xl border border-line/60 bg-canvas px-4 py-3 text-[13px] leading-relaxed text-ink"
        >
          {message}
        </p>
      )}

      {isReporter && token && (
        <AddEvidenceDialog
          caseId={view.id}
          token={token}
          open={showAddEvidence}
          onClose={() => setShowAddEvidence(false)}
          onDone={() => {
            setShowAddEvidence(false);
            setMessage(t("case.evidenceAdded", locale));
            onChanged?.();
          }}
        />
      )}
    </section>
  );
}

function AddEvidenceDialog({
  caseId,
  token,
  open,
  onClose,
  onDone
}: {
  caseId: string;
  token: string;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const { locale } = useLocale();
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const file = fileRef.current?.files?.[0] || null;
      const note = noteRef.current?.value.trim();
      if (!file && !note) throw new Error(t("case.evidenceMissingError", locale));

      if (note) {
        const res = await fetch("/api/evidence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caseId, token, note })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || t("case.evidenceAddFailed", locale));
      }

      if (file) {
        const problem = fileError(file);
        if (problem) throw new Error(problem);
        // Sent as binary, not base64 inside JSON.
        const prepared = await prepareFile(file);
        const result = await uploadEvidence(caseId, token, prepared);
        if (prepared.previewUrl) URL.revokeObjectURL(prepared.previewUrl);
        if (!result.ok) throw new Error(result.error || t("case.evidenceAddFailed", locale));
      }

      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("case.evidenceAddFailedFallback", locale));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t("case.addEvidenceTitle", locale)}>
      <p className="mb-4 text-[13.5px] leading-relaxed text-ink-soft">
        {t("case.evidenceNoticePart1", locale)}
        {caseId}
        {t("case.evidenceNoticePart2", locale)}
      </p>
      <div className="space-y-4">
        <div>
          <label htmlFor="evidence-note" className="meta-label mb-1.5 block">
            {t("case.shortNote", locale)}
          </label>
          <textarea
            id="evidence-note"
            ref={noteRef}
            rows={3}
            maxLength={1000}
            className="field resize-none"
            placeholder={t("case.evidencePlaceholder", locale)}
          />
        </div>
        <div>
          <label htmlFor="evidence-file" className="meta-label mb-1.5 block">
            {t("case.fileOptional", locale)}
          </label>
          <input
            id="evidence-file"
            ref={fileRef}
            type="file"
            accept="image/*,video/mp4,video/webm,application/pdf,text/plain"
            onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
            className="block w-full rounded-field border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink-soft file:me-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-ink"
          />
          {fileName && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-soft">
              <Icon name="paperclip" className="h-3.5 w-3.5" /> {fileName}
            </p>
          )}
        </div>
        <p className="flex gap-2 text-[12px] leading-relaxed text-ink-soft">
          <Icon name="lock" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t("case.evidenceRestrictedNote", locale) ||
            "Anything you add here stays restricted to you and the case handlers unless they publish it."}
        </p>
        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t("case.cancel", locale)}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? t("case.adding", locale) : t("case.addToCase", locale)}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
