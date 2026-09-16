import { cn } from "@/lib/utils";
import type { CaseView } from "@/lib/case-view";
import { formatDateTime } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

const EVENT_STYLE: Record<string, { icon: string; tone: string }> = {
  REPORT_SUBMITTED: { icon: "file-text", tone: "bg-ink text-white" },
  EVIDENCE_ADDED: { icon: "paperclip", tone: "bg-ink text-white" },
  CORROBORATION_RECEIVED: { icon: "users", tone: "bg-info-soft text-info" },
  VERIFICATION_UPDATED: { icon: "badge-check", tone: "bg-info-soft text-info" },
  CASE_ASSIGNED: { icon: "building", tone: "bg-ink text-white" },
  CASE_ACKNOWLEDGED: { icon: "mail-check", tone: "bg-ink text-white" },
  RESPONSE_IN_PROGRESS: { icon: "loader-circle", tone: "bg-info-soft text-info" },
  INFO_REQUESTED: { icon: "message", tone: "bg-warning-soft text-warning" },
  PUBLIC_UPDATE_ADDED: { icon: "scroll-text", tone: "bg-brand-soft text-brand-deep" },
  ACTION_RECORDED: { icon: "clipboard-check", tone: "bg-success-soft text-success" },
  UPDATE_REQUESTED: { icon: "clock", tone: "bg-warning-soft text-warning" },
  CASE_CLOSED: { icon: "check-circle-2", tone: "bg-success-soft text-success" }
};

// Vertical case timeline with status markers — the audit spine of a case.
export function CaseTimeline({
  view,
  showRestricted = false,
  className
}: {
  view: CaseView;
  showRestricted?: boolean;
  className?: string;
}) {
  const events = showRestricted
    ? view.events
    : view.events.filter((e) => e.visibility === "public");
  const ordered = [...events].reverse(); // newest first

  return (
    <section aria-label="Case timeline" className={cn("card px-5 py-5", className)}>
      <h2 className="meta-label mb-5">Case timeline</h2>
      {ordered.length === 0 ? (
        <p className="text-sm text-ink-soft">No recorded activity yet.</p>
      ) : (
        <ol className="relative space-y-6">
          <span aria-hidden="true" className="timeline-rail" />
          {ordered.map((e, i) => {
            const style = EVENT_STYLE[e.type] || { icon: "info", tone: "bg-muted text-ink-soft" };
            return (
              <li key={e.id} className="relative pl-11">
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-surface",
                    style.tone
                  )}
                >
                  <Icon name={style.icon} className="h-3.5 w-3.5" strokeWidth={2.2} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <h3 className="text-[14px] font-semibold leading-snug text-ink">{e.title}</h3>
                    <time dateTime={e.at} className="shrink-0 text-xs text-ink-soft">
                      {formatDateTime(e.at)}
                    </time>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-soft">{e.actor}</p>
                  {e.detail && (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{e.detail}</p>
                  )}
                  {e.visibility === "restricted" && (
                    <span className="chip mt-2 bg-warning-soft text-warning">
                      <Icon name="lock" className="h-3 w-3" /> Responder only
                    </span>
                  )}
                  {i === 0 && (
                    <span className="chip mt-2 bg-muted text-ink-soft">Latest</span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
