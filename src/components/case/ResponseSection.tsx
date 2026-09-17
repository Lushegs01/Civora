import type { CaseView } from "@/lib/case-view";
import { formatDateTime } from "@/lib/utils";
import { ResponseBadge } from "@/components/ui/Badges";
import { Icon } from "@/components/ui/Icon";

export function EvidenceSummaryRow({ view }: { view: CaseView }) {
  const { counts } = view;
  const items = [
    { label: `${counts.reports} report${counts.reports === 1 ? "" : "s"}`, icon: "file-text" },
    ...(counts.photos > 0
      ? [{ label: `${counts.photos} photo${counts.photos === 1 ? "" : "s"}`, icon: "camera" }]
      : []),
    ...(counts.updates > 0
      ? [{ label: `${counts.updates} update${counts.updates === 1 ? "" : "s"}`, icon: "scroll-text" }]
      : [])
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-soft">
          <Icon name={i.icon} className="h-3.5 w-3.5" />
          {i.label}
        </span>
      ))}
    </div>
  );
}

// Response section: who is responsible, what they've said, and what's next.
export function ResponseSection({
  view,
  latestUpdate,
  trackHref,
  contactEmail
}: {
  view: CaseView;
  latestUpdate?: { at: string; body: string; authorLabel: string };
  trackHref?: string;
  contactEmail?: string;
}) {
  const c = view.case;
  const closed = c.response === "closed";

  return (
    <section aria-label="Response" className="card px-5 py-5">
      <h2 className="meta-label mb-4">Response</h2>

      {/* Org + status row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="meta-label mb-1">Responsible organization</p>
          <p className="text-[14px] font-semibold text-ink">
            {view.orgName || "Not yet assigned"}
          </p>
        </div>
        <div>
          <p className="meta-label mb-1">Current status</p>
          <ResponseBadge state={c.response} />
        </div>
      </div>

      <div className="mt-5 space-y-4 border-t border-line/60 pt-5">
        {latestUpdate ? (
          <div>
            <p className="meta-label mb-2">
              Latest update
            </p>
            <blockquote className="rounded-2xl bg-canvas px-4 py-3.5">
              <p className="text-[13.5px] leading-relaxed text-ink">"{latestUpdate.body}"</p>
              <footer className="mt-1.5 text-[11.5px] font-medium text-ink-soft/70">
                — {latestUpdate.authorLabel} · {formatDateTime(latestUpdate.at)}
              </footer>
            </blockquote>
          </div>
        ) : (
          <div>
            <p className="meta-label mb-1">Latest update</p>
            <p className="text-[13.5px] text-ink-soft">
              No official response has been recorded yet.
            </p>
          </div>
        )}

        <div>
          <p className="meta-label mb-1">Next expected update</p>
          <p className="text-[13.5px] text-ink">
            {closed ? (
              "Case closed — outcome recorded on the timeline."
            ) : c.awaitingReporter ? (
              "Awaiting additional information from the reporter."
            ) : c.nextUpdateAt ? (
              formatDateTime(c.nextUpdateAt)
            ) : (
              "Not yet scheduled."
            )}
          </p>
        </div>
      </div>

      {(trackHref || contactEmail) && (
        <div className="mt-5 flex flex-wrap gap-2.5 border-t border-line/60 pt-5">
          {trackHref && (
            <a
              href={trackHref}
              className="press inline-flex min-h-10 items-center gap-2 rounded-btn bg-brand-soft px-4 text-[13.5px] font-medium text-brand-deep hover:bg-brand/15"
            >
              <Icon name="eye" className="h-4 w-4" />
              Track updates
            </a>
          )}
          {contactEmail && (
            <a
              href={`mailto:${contactEmail}?subject=${encodeURIComponent("Inquiry about case " + c.id)}`}
              className="press inline-flex min-h-10 items-center gap-2 rounded-btn border border-line bg-surface px-4 text-[13.5px] font-medium text-ink hover:bg-muted"
            >
              <Icon name="message" className="h-4 w-4" />
              Contact response channel
            </a>
          )}
        </div>
      )}
    </section>
  );
}
