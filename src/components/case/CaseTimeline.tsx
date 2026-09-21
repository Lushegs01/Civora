"use client";

import { cn } from "@/lib/utils";
import type { PublicCaseView } from "@/lib/dto/case";
import { formatDateTime } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

const EVENT_STYLE: Record<string, { icon: string; tone: string }> = {
  REPORT_SUBMITTED: { icon: "file-text", tone: "bg-brand-soft text-brand-deep" },
  EVIDENCE_ADDED: { icon: "paperclip", tone: "bg-brand-soft text-brand-deep" },
  POSSIBLE_MATCH_FOUND: { icon: "search", tone: "bg-muted text-ink-soft" },
  CORROBORATION_CONFIRMED: { icon: "users", tone: "bg-info-soft text-info" },
  CORROBORATION_REJECTED: { icon: "x", tone: "bg-muted text-ink-soft" },
  INFO_PROVIDED: { icon: "message", tone: "bg-brand-soft text-brand-deep" },
  PUBLICATION_CHANGED: { icon: "eye", tone: "bg-muted text-ink-soft" },
  VERIFICATION_UPDATED: { icon: "badge-check", tone: "bg-info-soft text-info" },
  CASE_ASSIGNED: { icon: "building", tone: "bg-brand text-white" },
  CASE_ACKNOWLEDGED: { icon: "mail-check", tone: "bg-brand text-white" },
  RESPONSE_IN_PROGRESS: { icon: "loader-circle", tone: "bg-info-soft text-info" },
  INFO_REQUESTED: { icon: "message", tone: "bg-warning-soft text-warning" },
  PUBLIC_UPDATE_ADDED: { icon: "scroll-text", tone: "bg-brand-soft text-brand-deep" },
  ACTION_RECORDED: { icon: "clipboard-check", tone: "bg-success-soft text-success" },
  UPDATE_REQUESTED: { icon: "clock", tone: "bg-warning-soft text-warning" },
  CASE_CLOSED: { icon: "check-circle-2", tone: "bg-success-soft text-success" }
};

export function CaseTimeline({
  view,
  className
}: {
  view: PublicCaseView;
  className?: string;
}) {
  const { locale } = useLocale();
  // The DTO already contains only the events this viewer is allowed to see;
  // the component does no filtering of its own.
  const ordered = [...view.events].reverse();

  return (
    <section aria-label={t("case.timeline", locale)} className={cn("card px-5 py-5", className)}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="meta-label">{t("case.timeline", locale)}</h2>
        {ordered.length > 0 && (
          <span className="text-[11.5px] text-ink-soft/70">{ordered.length} {ordered.length === 1 ? t("case.event", locale) : t("case.events", locale)}</span>
        )}
      </div>
      {ordered.length === 0 ? (
        <p className="text-[13.5px] leading-relaxed text-ink-soft">{t("case.noActivity", locale)}</p>
      ) : (
        <ol className="relative space-y-0">
          <span aria-hidden="true" className="timeline-rail" />
          {ordered.map((e, i) => {
            const style = EVENT_STYLE[e.type] || { icon: "info", tone: "bg-muted text-ink-soft" };
            const isFirst = i === 0;
            return (
              <li key={e.id} className="relative pb-6 pl-11 last:pb-0">
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
                      {formatDateTime(e.at, locale)}
                    </time>
                  </div>
                  <p className="mt-0.5 text-[12px] font-medium text-ink-soft/70">{e.actorLabel}</p>
                  {e.detail && (
                    <p className="mt-1.5 rounded-xl bg-canvas px-3 py-2 text-[12.5px] leading-relaxed text-ink-soft">
                      {e.detail}
                    </p>
                  )}
                  {(isFirst || e.visibility === "restricted") && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {isFirst && (
                        <span className="inline-flex items-center rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold tracking-widest text-brand-deep uppercase">
                          {t("case.latest", locale)}
                        </span>
                      )}
                      {e.visibility === "restricted" && (
                        <span className="chip bg-warning-soft text-warning">
                          <Icon name="lock" className="h-3 w-3" /> {t("case.responderOnly", locale)}
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
