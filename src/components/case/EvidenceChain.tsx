"use client";

import { useMemo, useState } from "react";
import { cn, formatDateTime } from "@/lib/utils";
import type { EvidenceRecord } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";

const KIND_STYLE: Record<string, { icon: string; tile: string; label: string }> = {
  photo: { icon: "camera", tile: "bg-brand-soft text-brand-deep", label: "Photo" },
  video: { icon: "video", tile: "bg-brand-soft text-brand-deep", label: "Video" },
  document: { icon: "file-text", tile: "bg-info-soft text-info", label: "Document" },
  report: { icon: "file-text", tile: "bg-muted text-ink-soft", label: "Report" },
  official: { icon: "building", tile: "bg-success-soft text-success", label: "Official record" },
  note: { icon: "message", tile: "bg-warning-soft text-warning", label: "Record note" }
};

const SOURCE_TYPE_LABEL: Record<string, string> = {
  primary: "Primary source",
  corroborating: "Independent corroborating source",
  official: "Official source",
  citizen: "Citizen-submitted"
};

// Interactive evidence chain: each node opens its full provenance record.

export function EvidenceChain({
  evidence,
  canSeeRestricted,
  className
}: {
  evidence: EvidenceRecord[];
  canSeeRestricted?: boolean;
  className?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const ordered = useMemo(
    () => [...evidence].sort((a, b) => +new Date(a.submittedAt) - +new Date(b.submittedAt)),
    [evidence]
  );
  const open = ordered.find((e) => e.id === openId) || null;

  if (ordered.length === 0) {
    return (
      <section id="evidence-chain" className={cn("card px-5 py-5", className)}>
        <h2 className="meta-label mb-3">Evidence chain</h2>
        <p className="text-sm leading-relaxed text-ink-soft">
          No supporting evidence has been added yet. Reports can be submitted without evidence, and
          evidence can be added at any time.
        </p>
      </section>
    );
  }

  return (
    <section id="evidence-chain" className={cn("card px-5 py-5", className)}>
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="meta-label">Evidence chain</h2>
        <span className="text-xs text-ink-soft">{ordered.length} linked item{ordered.length === 1 ? "" : "s"}</span>
      </div>

      <ol className="relative space-y-2">
        <span aria-hidden="true" className="timeline-rail" />
        {ordered.map((e) => {
          const style = KIND_STYLE[e.kind] || KIND_STYLE.report;
          const restricted = !e.publicVisible && !canSeeRestricted;
          return (
            <li key={e.id} className="relative">
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-0 top-3.5 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-surface",
                  restricted ? "bg-muted text-ink-soft" : style.tile
                )}
              >
                <Icon name={restricted ? "lock" : style.icon} className="h-3.5 w-3.5" strokeWidth={2.2} />
              </span>
              <button
                onClick={() => setOpenId(e.id)}
                aria-haspopup="dialog"
                className="press ml-11 flex w-[calc(100%-2.75rem)] items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3 text-left hover:border-ink-soft/40 hover:bg-muted/60"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-ink">{e.title}</span>
                  <span className="mt-0.5 block text-xs text-ink-soft">
                    {SOURCE_TYPE_LABEL[e.sourceType]} · {formatDateTime(e.submittedAt)}
                  </span>
                </span>
                {e.checksum && (
                  <span title="Content checksum recorded" className="chip hidden bg-muted text-ink-soft sm:inline-flex">
                    <Icon name="key-round" className="h-3 w-3" /> SHA-256
                  </span>
                )}
                <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-ink-soft/60" />
              </button>
            </li>
          );
        })}
      </ol>

      <Modal open={!!open} onClose={() => setOpenId(null)} title={open ? "Evidence detail" : ""}>
        {open && <EvidenceDetail e={open} />}
      </Modal>
    </section>
  );
}

function EvidenceDetail({ e }: { e: EvidenceRecord }) {
  const style = KIND_STYLE[e.kind] || KIND_STYLE.report;
  const rows: Array<[string, React.ReactNode]> = [
    ["Source", e.submittedByLabel],
    ["Source type", SOURCE_TYPE_LABEL[e.sourceType]],
    ["Date", formatDateTime(e.submittedAt)]
  ];
  if (e.excerpt) rows.push(["Relevant evidence", <span key="x">“{e.excerpt}”</span>]);
  if (e.relationship) rows.push(["Relationship to claim", e.relationship]);
  if (e.checksum) {
    rows.push([
      "Integrity",
      <span key="c" className="break-all font-mono text-[11.5px]">
        SHA-256 {e.checksum.slice(0, 24)}…
      </span>
    ]);
  }
  if (e.sourceRef) rows.push(["Reference", e.sourceRef]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", style.tile)}>
          <Icon name={style.icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-ink">{e.title}</p>
          <p className="text-xs text-ink-soft">{style.label}</p>
        </div>
      </div>

      <dl className="space-y-3.5">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="meta-label">{k}</dt>
            <dd className="mt-1 text-[13.5px] leading-relaxed text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        {e.storageKey && (
          <a
            href={`/api/evidence-file/${e.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="press inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-btn bg-ink px-5 text-[14px] font-medium text-white hover:bg-black"
          >
            <Icon name="arrow-up-right" className="h-4 w-4" />
            View original file
          </a>
        )}
        <span className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-btn border border-line bg-muted px-5 text-[13px] text-ink-soft">
          <Icon name="shield-check" className="h-4 w-4" />
          {e.publicVisible ? "Public-safe evidence" : "Restricted to authorized viewers"}
        </span>
      </div>
    </div>
  );
}
