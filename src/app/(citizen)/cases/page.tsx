"use client";

import { useEffect, useState } from "react";
import type { CaseCardRow } from "@/components/case/CaseCard";
import { CaseCard } from "@/components/case/CaseCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { TopBar } from "@/components/shell/TopBar";
import { getTokens } from "@/lib/offline/db";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

export default function MyCasesPage() {
  const { locale } = useLocale();
  const [rows, setRows] = useState<CaseCardRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tokens = await getTokens();
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

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-content px-4 pb-16 pt-5 md:px-8 md:pt-10">
      <h1 className="text-[26px] font-bold tracking-[-0.02em] text-ink md:text-[30px]">{t("cases.title", locale) || "My cases"}</h1>
      <p className="mt-2 max-w-lg text-[14.5px] leading-relaxed text-ink-soft">
        {t("cases.description", locale) || "Cases submitted or tracked on this device. Tracking is device-local — nothing here is public."}
      </p>

      <div className="mt-6 space-y-3">
        {rows === null && !failed && (
          <>
            <div className="card h-28 animate-pulse" aria-hidden="true" />
            <div className="card h-28 animate-pulse" aria-hidden="true" />
          </>
        )}
        {rows !== null &&
          rows.map((r) => <CaseCard key={r.id} row={{ ...r, href: r.href || `/cases/${r.id}` }} />)}
        {rows !== null && rows.length === 0 && (
          <EmptyState
            icon="folder"
            title={t("cases.empty.title", locale) || "You haven't submitted a case yet."}
            body={t("cases.empty.body", locale) || "When you report an issue on this device, it appears here with its verification and response progress."}
            actionLabel={t("cases.empty.action", locale) || "Report an issue"}
            actionHref="/report"
          />
        )}
        {failed && (
          <EmptyState
            icon="wifi-off"
            title={t("cases.failed.title", locale) || "Couldn't load your cases"}
            body={t("cases.failed.body", locale) || "Your tracking data is safe on this device. Check your connection and try again."}
          />
        )}
      </div>
    </main>
    </>
  );
}
