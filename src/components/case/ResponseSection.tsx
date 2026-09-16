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
      ? [{ label: `${counts.updates} official update${counts.updates === 1 ? "" : "s"}`, icon: "scroll-text" }]
      : [])
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-soft">
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

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="meta-label">Responsible organization</dt>
          <dd className="mt-1 text-[14.5px] font-semibold text-ink">
            {view.orgName || "Not yet assigned"}
          </dd>
        </div>
        <div>
          <dt className="meta-label">Current status</dt>
          <dd className="mt-1">
            <ResponseBadge state={c.response} />
          </dd>
        </div>
      </dl>

      <div className="mt-5 space-y-4 border-t border-line pt-5">
        {latestUpdate ? (
          <div>
            <dt className="meta-label">
              Latest update · {formatDateTime(latestUpdate.at)}
            </dt>
            <dd className="mt-1.5 rounded-2xl bg-muted px-4 py-3 text-[13.5px] leading-relaxed text-ink">
              “{latestUpdate.body}”
              <span className="mt-1 block text-xs text-ink-soft">— {latestUpdate.authorLabel}</span>
            </dd>
          </div>
        ) : (
          <div>
            <dt className="meta-label">Latest update</dt>
            <dd className="mt-1 text-[13.5px] text-ink-soft">
              No official response has been recorded yet.
            </dd>
          </div>
        )}

        <div>
          <dt className="meta-label">Next expected update</dt>
          <dd className="mt-1 text-[13.5px] text-ink">
            {closed ? (
              "Case closed — outcome recorded on the timeline."
            ) : c.awaitingReporter ? (
              "Awaiting additional information from the reporter."
            ) : c.nextUpdateAt ? (
              formatDateTime(c.nextUpdateAt)
            ) : (
              "Not scheduled — the responding organization will publish an update."
            )}
          </dd>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2.5">
        {trackHref && (
          <a
            href={trackHref}
            className="press inline-flex min-h-11 items-center gap-2 rounded-btn bg-brand-soft px-4 text-[14px] font-medium text-brand-deep hover:bg-brand/15"
          >
            <Icon name="eye" className="h-4 w-4" />
            Track updates
          </a>
        )}
        {contactEmail && (
          <a
            href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Inquiry about case ${c.id}`)}`}
            className="press inline-flex min-h-11 items-center gap-2 rounded-btn border border-line bg-surface px-4 text-[14px] font-medium text-ink hover:bg-muted"
          >
            <Icon name="message" className="h-4 w-4" />
            Contact response channel
          </a>
        )}
      </div>
    </section>
  );
}
