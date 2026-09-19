"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

interface Summary {
  overview: string;
  known: string[];
  uncertain: string[];
  conflicts: string[];
  sourcesUsed: string[];
  provider: string;
  generatedAt: string;
}

export function AiSummaryCard({
  caseId,
  sourceTitles,
  className
}: {
  caseId: string;
  sourceTitles: Record<string, string>;
  className?: string;
}) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState(false);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !summary && !error) {
      try {
        const res = await fetch(`/api/ai/case-summary/${caseId}`);
        if (!res.ok) throw new Error();
        setSummary(await res.json());
      } catch {
        setError(true);
      }
    }
  }

  return (
    <section className={cn("card overflow-hidden", className)} aria-label={t("case.ai.summary", locale)}>
      <button
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-canvas"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
          <Icon name="sparkles" className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold text-ink">{t("case.ai.summary", locale)}</span>
          <span className="block text-[11.5px] text-ink-soft/70">
            {t("case.ai.generatedFrom", locale)}
          </span>
        </span>
        <Icon
          name="chevron-right"
          className={cn("h-4 w-4 shrink-0 text-ink-soft/50 transition-transform duration-200", open && "rotate-90")}
        />
      </button>

      {open && (
        <div className="border-t border-line/60 px-5 py-4">
          {!summary && !error && (
            <div className="flex items-center gap-2.5 text-[13.5px] text-ink-soft">
              <Icon name="loader-circle" className="h-4 w-4 animate-spin" />
              {t("case.ai.reading", locale)}
            </div>
          )}
          {error && (
            <p className="text-[13.5px] leading-relaxed text-ink-soft">
              {t("case.ai.error", locale)}
            </p>
          )}
          {summary && (
            <div className="space-y-4">
              <p className="text-[13.5px] leading-relaxed text-ink">{summary.overview}</p>

              {summary.known.length > 0 && (
                <div className="border-t border-line/40 pt-4">
                  <h3 className="meta-label mb-2">{t("case.ai.established", locale)}</h3>
                  <ul className="space-y-1.5">
                    {summary.known.map((k, i) => (
                      <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                        <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                        {k}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.uncertain.length > 0 && (
                <div className="border-t border-line/40 pt-4">
                  <h3 className="meta-label mb-2">{t("case.ai.stillUncertain", locale)}</h3>
                  <ul className="space-y-1.5">
                    {summary.uncertain.map((u, i) => (
                      <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                        <Icon name="triangle-alert" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                        {u}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.conflicts.length > 0 && (
                <div className="border-t border-line/40 pt-4">
                  <h3 className="meta-label mb-2">{t("case.ai.potentialConflicts", locale)}</h3>
                  <ul className="space-y-1.5">
                    {summary.conflicts.map((c, i) => (
                      <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                        <Icon name="circle-alert" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.sourcesUsed.length > 0 && (
                <div className="border-t border-line/40 pt-4">
                  <h3 className="meta-label mb-2">{t("case.ai.sourcesUsed", locale)}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.sourcesUsed.map((id) => (
                      <a
                        key={id}
                        href="#evidence-chain"
                        className="chip bg-muted text-ink-soft transition-colors hover:bg-line hover:text-ink"
                      >
                        <Icon name="file-text" className="h-3 w-3" />
                        {sourceTitles[id] || t("case.ai.evidenceFallback", locale)}
                      </a>
                    ))}
                  </div>
                  <p className="mt-2 text-[11.5px] text-ink-soft/60">
                    {t("case.ai.traceable", locale)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
