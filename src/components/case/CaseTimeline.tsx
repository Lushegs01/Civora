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

// Vertical case timeline — the audit spine of every civic case.
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
      <div className="mb-5 flex items-center justify-between">
        <h2 className="meta-label">Case timeline</h2>
        {ordered.length > 0 && (
          <span className="text-[11.5px] text-ink-soft/70">{ordered.length} event{ordered.length === 1 ? "" : "s"}</span>
        )}
      </div>
      {ordered.length === 0 ? (
        <p className="text-[13.5px] leading-relaxed text-ink-soft">No recorded activity yet.</p>
      ) : (
        <ol className="relative space-y-0">
          <span aria-hidden="true" className="timeline-rail" />
          {ordered.map((e, i) => {
            const style = EVENT_STYLE[e.type] || { icon: "info", tone: "bg-muted text-ink-soft" };
            const isFirst = i === 0;
            return (
              <li key={e.id} className="relative pb-6 pl-11 last:pb-0">
                {/* Icon marker */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full ring-[3px] ring-canvas",
                    style.tone
                  )}
                >
                  <Icon name={style.icon} className="h-3.5 w-3.5" strokeWidth={2.2} />
                </span>

                <div className="min-w-0 pt-0.5">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5">
                    <h3 className="text-[13.5px] font-semibold leading-snug text-ink">{e.title}</h3>
                    <time dateTime={e.at} className="shrink-0 text-[11px] tabular-nums text-ink-soft/60">
                      {formatDateTime(e.at)}
                    </time>
                  </div>
                  <p className="mt-0.5 text-[12px] font-medium text-ink-soft/70">{e.actor}</p>
                  {e.detail && (
                    <p className="mt-1.5 rounded-xl bg-canvas px-3 py-2 text-[12.5px] leading-relaxed text-ink-soft">
                      {e.detail}
                    </p>
                  )}
                  {(isFirst || e.visibility === "restricted") && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {isFirst && (
                        <span className="inline-flex items-center rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold tracking-widest text-white uppercase">
                          Latest
                        </span>
                      )}
                      {e.visibility === "restricted" && (
                        <span className="chip bg-warning-soft text-warning">
                          <Icon name="lock" className="h-3 w-3" /> Responder only
                        </span>
                      )}
                    </div>
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
