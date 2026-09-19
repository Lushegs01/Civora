"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CaseView } from "@/lib/case-view";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { fileError, prepareFile } from "@/lib/client/upload";
import { getTokens, getToken, saveToken } from "@/lib/offline/db";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

export function CaseActionBar({
  view,
  tracked: trackedInitial,
  hasToken
}: {
  view: CaseView;
  tracked: boolean;
  hasToken: boolean;
}) {
  const router = useRouter();
  const c = view.case;
  const { locale } = useLocale();
  const [message, setMessage] = useState<string | null>(null);
  const [tracked, setTracked] = useState(trackedInitial);
  const [showAddEvidence, setShowAddEvidence] = useState(false);

  const isReporter = hasToken;
  const closed = c.response === "closed";

  async function track() {
    const t_token = await getToken(c.id);
    if (t_token) {
      setTracked(true);
      return;
    }
    await saveToken(c.id, `public-track-${c.id.toLowerCase()}`);
    setTracked(true);
    setMessage(t("case.trackingSuccess", locale));
  }

  async function share() {
    const url = `${window.location.origin}/community/${c.id}`;
    const shareData = {
      title: `Civora case ${c.id}`,
      text: `Public case ${c.id}: ${c.title}`,
      url
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
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
    const tokens = await getTokens();
    const t_token = tokens.find((x) => x.caseId === c.id);
    if (!t_token) {
      setMessage(t("case.trackToUpdate", locale));
      return;
    }
    const res = await fetch("/api/cases/request-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: c.id, token: t_token.token })
    });
    const data = await res.json().catch(() => ({}));
    setMessage(
      res.ok
        ? t("case.updateRequested", locale)
        : data?.error || t("case.updateFailed", locale)
    );
  }

  return (
    <section aria-label="Actions" className="card px-5 py-5">
      <h2 className="meta-label mb-4">{t("case.whatNext", locale)}</h2>
      <div className="flex flex-wrap gap-2">
        {isReporter && !closed && (
          <Button icon="paperclip" onClick={() => setShowAddEvidence(true)}>
            {t("case.addEvidence", locale)}
          </Button>
        )}
        {!isReporter && !tracked && (
          <Button icon="eye" variant="secondary" onClick={track}>
            {t("case.trackCase", locale)}
          </Button>
        )}
        {tracked && !isReporter && (
          <Button icon="check" variant="brandSoft">
            {t("case.trackingOnDevice", locale)}
          </Button>
        )}
        <Button icon="share" variant="secondary" onClick={share}>
          {t("case.sharePublic", locale)}
        </Button>
        {isReporter && !closed && (
          <Button icon="clock" variant="secondary" onClick={requestUpdate}>
            {t("case.requestUpdate", locale)}
          </Button>
        )}
        {c.category === "safety" && (
          <Button icon="siren" variant="brandSoft" href="/resources">
            {t("case.urgentDanger", locale)}
          </Button>
        )}
        <Button icon="plus" variant="ghost" href="/report">
          {t("case.reportAnother", locale)}
        </Button>
      </div>

      {message && (
        <p role="status" className="mt-4 rounded-2xl border border-line/60 bg-canvas px-4 py-3 text-[13px] leading-relaxed text-ink">
          {message}
        </p>
      )}

      <AddEvidenceDialog
        caseId={c.id}
        open={showAddEvidence}
        onClose={() => setShowAddEvidence(false)}
        onDone={() => {
          setShowAddEvidence(false);
          setMessage(t("case.evidenceAdded", locale));
          router.refresh();
        }}
      />
    </section>
  );
}

function AddEvidenceDialog({
  caseId,
  open,
  onClose,
  onDone
}: {
  caseId: string;
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
      const tokens = await getTokens();
      const t_token = tokens.find((x) => x.caseId === caseId);
      if (!t_token) throw new Error(t("case.evidenceTrackError", locale));

      const file = fileRef.current?.files?.[0] || null;
      let payloadFile: unknown = undefined;
      if (file) {
        const err = fileError(file);
        if (err) throw new Error(err);
        payloadFile = await prepareFile(file);
      }
      const note = noteRef.current?.value.trim();
      if (!file && !note) throw new Error(t("case.evidenceMissingError", locale));

      const res = await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, token: t_token.token, note: note || undefined, file: payloadFile })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || t("case.evidenceAddFailed", locale));
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
        {t("case.evidenceNoticePart1", locale)}{caseId}{t("case.evidenceNoticePart2", locale)}
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
            maxLength={400}
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
            className="block w-full rounded-field border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-ink"
          />
          {fileName && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-soft">
              <Icon name="paperclip" className="h-3.5 w-3.5" /> {fileName}
            </p>
          )}
        </div>
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
