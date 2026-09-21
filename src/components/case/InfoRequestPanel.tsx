"use client";

import { useState } from "react";
import type { InfoRequestView } from "@/lib/dto/case";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { formatDateTime } from "@/lib/utils";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

/**
 * The reporter's side of a request for information.
 *
 * Previously a responder could ask for more detail and the reporter had no way
 * to answer — the case simply sat marked "awaiting reporter". This is the
 * missing half: the question, and a place to reply to it.
 */
export function InfoRequestPanel({
  caseId,
  token,
  requests,
  onDone
}: {
  caseId: string;
  token: string;
  requests: InfoRequestView[];
  onDone?: () => void;
}) {
  const { locale } = useLocale();
  const [activeId, setActiveId] = useState<string | null>(requests[0]?.id ?? null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!activeId || body.trim().length < 5) {
      setError(t("case.info.tooShort", locale) || "Please write a little more so the team can act on it.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cases/info-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, token, requestId: activeId, body: body.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || t("case.info.failed", locale) || "That reply couldn't be sent.");
        return;
      }
      setSent(true);
      setBody("");
      onDone?.();
    } catch {
      setError(t("case.info.failed", locale) || "That reply couldn't be sent. You may be offline.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <section aria-label={t("case.info.title", locale) || "Information requested"} className="card px-5 py-5">
        <p className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-ink">
          <Icon name="check-circle-2" className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          {t("case.info.sent", locale) ||
            "Your reply has been sent to the responding organization. It is stored with the case and is not shown publicly."}
        </p>
      </section>
    );
  }

  const active = requests.find((r) => r.id === activeId) ?? requests[0];

  return (
    <section
      aria-label={t("case.info.title", locale) || "Information requested"}
      className="card overflow-hidden border-warning/30"
    >
      <div className="flex items-start gap-3 bg-warning-soft/50 px-5 py-4">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning text-white">
          <Icon name="message" className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-[14.5px] font-semibold text-ink">
            {t("case.info.title", locale) || "The response team asked you a question"}
          </h2>
          <p className="mt-0.5 text-[12.5px] text-ink-soft">
            {active.requestedByLabel} · {formatDateTime(active.createdAt, locale)}
          </p>
        </div>
      </div>

      <div className="px-5 py-4">
        {requests.length > 1 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {requests.map((r, i) => (
              <button
                key={r.id}
                onClick={() => setActiveId(r.id)}
                aria-pressed={r.id === active.id}
                className={`chip ${r.id === active.id ? "bg-brand text-white" : "bg-muted text-ink-soft"}`}
              >
                {t("case.info.question", locale) || "Question"} {i + 1}
              </button>
            ))}
          </div>
        )}

        <blockquote className="rounded-xl bg-canvas px-4 py-3 text-[13.5px] leading-relaxed text-ink">
          {active.message}
        </blockquote>

        <label htmlFor="info-reply" className="meta-label mt-4 mb-1.5 block">
          {t("case.info.yourReply", locale) || "Your reply"}
        </label>
        <textarea
          id="info-reply"
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            setError(null);
          }}
          rows={4}
          maxLength={2000}
          className="field resize-none"
          placeholder={t("case.info.placeholder", locale) || "Share what you can. This is not shown publicly."}
        />
        {error && (
          <p role="alert" className="mt-2 text-[13px] text-danger">
            {error}
          </p>
        )}
        <div className="mt-3 flex justify-end">
          <Button onClick={submit} disabled={busy}>
            {busy
              ? t("case.info.sending", locale) || "Sending…"
              : t("case.info.send", locale) || "Send reply"}
          </Button>
        </div>
      </div>
    </section>
  );
}
