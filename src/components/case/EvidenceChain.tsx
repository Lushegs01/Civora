"use client";

import { useMemo, useState } from "react";
import { cn, formatDateTime } from "@/lib/utils";
import type { PublicEvidenceView } from "@/lib/dto/case";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

const KIND_STYLE: Record<string, { icon: string; tile: string; label: string }> = {
  photo: { icon: "camera", tile: "bg-brand-soft text-brand-deep", label: "evidence.photo" },
  video: { icon: "video", tile: "bg-brand-soft text-brand-deep", label: "evidence.video" },
  document: { icon: "file-text", tile: "bg-info-soft text-info", label: "evidence.document" },
  report: { icon: "file-text", tile: "bg-muted text-ink-soft", label: "evidence.report" },
  official: { icon: "building", tile: "bg-success-soft text-success", label: "evidence.official" },
  note: { icon: "message", tile: "bg-warning-soft text-warning", label: "evidence.note" }
};

const SOURCE_TYPE_LABEL: Record<string, string> = {
  primary: "evidence.source.primary",
  corroborating: "evidence.source.corroborating",
  official: "evidence.source.official",
  citizen: "evidence.source.citizen"
};

const SOURCE_TYPE_ICON: Record<string, string> = {
  primary: "star",
  corroborating: "link",
  official: "building",
  citizen: "user"
};

export function EvidenceChain({
  evidence,
  viewerToken,
  className
}: {
  evidence: PublicEvidenceView[];
  /** Reporter's tracking token, when they are viewing their own case. */
  viewerToken?: string;
  className?: string;
}) {
  const { locale } = useLocale();
  const [openId, setOpenId] = useState<string | null>(null);
  const ordered = useMemo(
    () => [...evidence].sort((a, b) => +new Date(a.submittedAt) - +new Date(b.submittedAt)),
    [evidence]
  );
  const open = ordered.find((e) => e.id === openId) || null;

  if (ordered.length === 0) {
    return (
      <section id="evidence-chain" className={cn("card px-5 py-5", className)}>
        <h2 className="meta-label mb-3">{t("case.evidenceChain", locale)}</h2>
        <div className="rounded-2xl bg-canvas px-4 py-5 text-center">
          <span className="mb-2 mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-muted text-ink-soft">
            <Icon name="paperclip" className="h-4 w-4" />
          </span>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
            {t("case.noEvidence", locale)}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="evidence-chain" className={cn("card px-5 py-5", className)}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="meta-label">{t("case.evidenceChain", locale)}</h2>
        <span className="text-[11.5px] font-medium text-ink-soft/70">
          {ordered.length} {ordered.length === 1 ? t("case.linkedItem", locale) : t("case.linkedItems", locale)}
        </span>
      </div>

      <ol className="relative space-y-2">
        <span aria-hidden="true" className="timeline-rail" />
        {ordered.map((e, index) => {
          const style = KIND_STYLE[e.kind] || KIND_STYLE.report;
          // The DTO decides what this viewer can see; "restricted" here only
          // marks items that are not on the public record.
          const restricted = !e.publicVisible;
          const isLast = index === ordered.length - 1;
          return (
            <li key={e.id} className="relative">
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-0 top-3.5 flex h-8 w-8 items-center justify-center rounded-full ring-[3px] ring-canvas",
                  restricted ? "bg-muted text-ink-soft" : style.tile
                )}
              >
                <Icon name={restricted ? "lock" : style.icon} className="h-3.5 w-3.5" strokeWidth={2.2} />
              </span>
              <button
                onClick={() => setOpenId(e.id)}
                aria-haspopup="dialog"
                className="press ml-11 flex w-[calc(100%-2.75rem)] items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3 text-left transition-colors hover:border-ink/15 hover:bg-canvas"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-ink">{e.title}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="inline-flex items-center gap-1 text-[11.5px] text-ink-soft/70">
                      <Icon name={SOURCE_TYPE_ICON[e.sourceType] || "file"} className="h-3 w-3" />
                      {t(SOURCE_TYPE_LABEL[e.sourceType], locale)}
                    </span>
                    <span className="text-[11px] text-ink-soft/40">·</span>
                    <span className="text-[11.5px] tabular-nums text-ink-soft/60">
                      {formatDateTime(e.submittedAt, locale)}
                    </span>
                  </span>
                </span>
                {e.checksum && (
                  <span title="Content checksum recorded" className="hidden shrink-0 items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[11px] font-medium text-ink-soft sm:flex">
                    <Icon name="key-round" className="h-3 w-3" /> {t("case.sha", locale)}
                  </span>
                )}
                {isLast && (
                  <span className="hidden shrink-0 items-center gap-1 rounded-lg bg-brand-soft px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-deep sm:flex">
                    {t("case.latest", locale)}
                  </span>
                )}
                <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-ink-soft/40" />
              </button>
            </li>
          );
        })}
      </ol>

      <Modal open={!!open} onClose={() => setOpenId(null)} title={open ? t("case.evidenceDetail", locale) : ""}>
        {open && <EvidenceDetail e={open} viewerToken={viewerToken} />}
      </Modal>
    </section>
  );
}

function EvidenceDetail({ e, viewerToken }: { e: PublicEvidenceView; viewerToken?: string }) {
  const { locale } = useLocale();
  const style = KIND_STYLE[e.kind] || KIND_STYLE.report;
  const rows: Array<[string, React.ReactNode]> = [
    [t("case.source", locale), e.submittedByLabel],
    [t("case.sourceType", locale), t(SOURCE_TYPE_LABEL[e.sourceType], locale)],
    [t("case.dateSubmitted", locale), formatDateTime(e.submittedAt, locale)]
  ];
  if (e.excerpt) rows.push([t("case.relevantExcerpt", locale), <span key="x">&ldquo;{e.excerpt}&rdquo;</span>]);
  if (e.relationship) rows.push([t("case.relationshipToClaim", locale), e.relationship]);
  if (e.checksum) {
    rows.push([
      t("case.integrity", locale),
      <span key="c" className="break-all font-mono text-[11px] text-ink-soft">
        SHA-256 · {e.checksum.slice(0, 24)}{"\u2026"}
      </span>
    ]);
  }
  if (e.sourceRef) rows.push([t("case.reference", locale), e.sourceRef]);

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", style.tile)}>
          <Icon name={style.icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-ink">{e.title}</p>
          <p className="text-[12px] font-medium text-ink-soft/70">{t(style.label, locale)}</p>
        </div>
      </div>

      <dl className="divide-y divide-line/60">
        {rows.map(([k, v]) => (
          <div key={k} className="py-3">
            <dt className="meta-label mb-0.5">{k}</dt>
            <dd className="text-[13.5px] leading-relaxed text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        {e.hasFile && <EvidenceFileLink evidence={e} viewerToken={viewerToken} />}
        <span className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-btn border border-line bg-canvas px-5 text-[12.5px] text-ink-soft">
          <Icon name="shield-check" className="h-4 w-4" />
          {e.publicVisible ? t("case.publicSafeEvidence", locale) : t("case.restrictedEvidence", locale)}
        </span>
      </div>
    </div>
  );
}

/**
 * Opens an evidence file.
 *
 * Public evidence is a plain link. Restricted evidence is fetched with the
 * tracking token in a request header and handed to the browser as an object
 * URL, so the token never appears in a URL, the referrer or browser history.
 */
function EvidenceFileLink({
  evidence,
  viewerToken
}: {
  evidence: PublicEvidenceView;
  viewerToken?: string;
}) {
  const { locale } = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const className =
    "press inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-btn bg-brand px-5 text-[14px] font-medium text-white hover:bg-brand-deep disabled:opacity-60";

  if (evidence.publicVisible || !viewerToken) {
    return (
      <a
        href={`/api/evidence-file/${evidence.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        <Icon name="arrow-up-right" className="h-4 w-4" />
        {t("case.viewOriginalFile", locale)}
      </a>
    );
  }

  async function open() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/evidence-file/${evidence.id}`, {
        headers: { "x-civora-tracking-token": viewerToken! }
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      // Give the new tab time to load before releasing the object URL.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setError(t("case.fileUnavailable", locale) || "That file couldn't be opened right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1">
      <button onClick={open} disabled={busy} className={`${className} w-full`}>
        <Icon name={busy ? "loader-circle" : "arrow-up-right"} className={busy ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        {t("case.viewOriginalFile", locale)}
      </button>
      {error && (
        <p role="alert" className="mt-1.5 text-[12px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
