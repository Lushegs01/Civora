"use client";

import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { CaseCardRow } from "@/components/case/CaseCard";
import { CaseCard } from "@/components/case/CaseCard";
import { getTokens } from "@/lib/offline/db";
import { Icon } from "@/components/ui/Icon";

export function YourCases() {
  const { locale } = useLocale();
  const [rows, setRows] = useState<CaseCardRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tokens = await getTokens();
        if (cancelled) return;
        if (tokens.length === 0) {
          setRows([]);
          return;
        }
        const res = await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pairs: tokens.map((t) => ({ caseId: t.caseId, token: t.token })) })
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) setRows(data.rows as CaseCardRow[]);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return null;

  if (rows === null) {
    return (
      <div className="space-y-3" aria-hidden="true">
        <div className="card h-28 animate-pulse bg-surface" />
        <div className="card h-28 animate-pulse bg-surface" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="card flex items-center justify-between gap-4 px-5 py-5">
        <div>
          <h3 className="text-[15px] font-semibold text-ink">{t("your_cases.empty.title", locale) || "You haven't submitted a case yet."}</h3>
          <p className="mt-1 text-[13px] text-ink-soft">
            {t("your_cases.empty.body", locale) || "Reports you submit on this device will appear here with their progress."}
          </p>
        </div>
        <Link
          href="/report"
          className="press inline-flex min-h-11 shrink-0 items-center gap-2 rounded-btn bg-brand px-4 text-[13.5px] font-medium text-white hover:bg-brand-deep"
        >
          <Icon name="plus" className="h-4 w-4" />
          {t("action.report", locale) || "Report"}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.slice(0, 3).map((r) => (
        <CaseCard key={r.id} row={r} />
      ))}
      {rows.length > 3 && (
        <Link
          href="/cases"
          className="press inline-flex min-h-11 items-center gap-1.5 rounded-btn px-2 text-[13.5px] font-medium text-brand-deep hover:bg-brand-soft"
        >
          {t("your_cases.view_all", locale) || "View all your cases"} <Icon name="arrow-right" className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
