"use client";

import { useCallback, useEffect, useState } from "react";
import type { CaseCardRow } from "@/components/case/CaseCard";
import { CaseCard } from "@/components/case/CaseCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getTokens, saveToken } from "@/lib/offline/db";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

export function MyCasesClient() {
  const { locale } = useLocale();
  const [rows, setRows] = useState<CaseCardRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);

  const load = useCallback(async () => {
    try {
      const tokens = await getTokens();
      if (tokens.length === 0) {
        setRows([]);
        return;
      }
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairs: tokens.map((entry) => ({ caseId: entry.caseId, token: entry.token })) })
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { rows: CaseCardRow[] };
      setRows(data.rows);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-content px-4 pb-16 pt-5 md:px-8 md:pt-10">
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-ink md:text-[30px]">
          {t("cases.title", locale) || "My cases"}
        </h1>
        <p className="mt-2 max-w-lg text-[14.5px] leading-relaxed text-ink-soft">
          {t("cases.description", locale) ||
            "Cases submitted or tracked on this device. Tracking is device-local — nothing here is public."}
        </p>

        <div className="mt-6 space-y-3">
          {rows === null && !failed && (
            <>
              <div className="card h-28 animate-pulse" aria-hidden="true" />
              <div className="card h-28 animate-pulse" aria-hidden="true" />
            </>
          )}
          {rows?.map((row) => (
            <CaseCard key={row.id} row={{ ...row, href: row.href || `/cases/${row.id}` }} />
          ))}
          {rows !== null && rows.length === 0 && (
            <EmptyState
              icon="folder"
              title={t("cases.empty.title", locale) || "You haven't submitted a case yet."}
              body={
                t("cases.empty.body", locale) ||
                "When you report an issue on this device, it appears here with its verification and response progress."
              }
              actionLabel={t("cases.empty.action", locale) || "Report an issue"}
              actionHref="/report"
            />
          )}
          {failed && (
            <EmptyState
              icon="wifi-off"
              title={t("cases.failed.title", locale) || "Couldn't load your cases"}
              body={
                t("cases.failed.body", locale) ||
                "Your tracking data is safe on this device. Check your connection and try again."
              }
            />
          )}
        </div>

        <section aria-label={t("cases.recovery.title", locale) || "Restore a case"} className="mt-10">
          <div className="card px-5 py-5">
            <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink">
              {t("cases.recovery.title", locale) || "Using a different device?"}
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">
              {t("cases.recovery.body", locale) ||
                "Cases are tracked on the device you reported them from — that's what keeps them private. If you asked for a recovery code when you reported, you can restore access here."}
            </p>
            {showRecovery ? (
              <RecoveryForm
                onRecovered={async (caseId, token) => {
                  await saveToken(caseId, token);
                  setShowRecovery(false);
                  await load();
                }}
                onCancel={() => setShowRecovery(false)}
              />
            ) : (
              <div className="mt-4">
                <Button variant="secondary" icon="key-round" onClick={() => setShowRecovery(true)}>
                  {t("cases.recovery.action", locale) || "Use a recovery code"}
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

/**
 * Exchanges a one-time recovery code for a fresh tracking token.
 *
 * The server rotates the token on success, so the old device loses access —
 * which is what you want if the reason you're here is that you lost the phone.
 */
function RecoveryForm({
  onRecovered,
  onCancel
}: {
  onRecovered: (caseId: string, token: string) => Promise<void>;
  onCancel: () => void;
}) {
  const { locale } = useLocale();
  const [caseId, setCaseId] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/track/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: caseId.trim().toUpperCase(), recoveryCode: code.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || t("cases.recovery.failed", locale) || "That code wasn't recognized.");
        return;
      }
      await onRecovered(data.caseId, data.token);
    } catch {
      setError(t("cases.recovery.failed", locale) || "That code couldn't be checked. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div>
        <label htmlFor="recovery-case" className="meta-label mb-1.5 block">
          {t("cases.recovery.case_label", locale) || "Case ID"}
        </label>
        <input
          id="recovery-case"
          value={caseId}
          onChange={(e) => {
            setCaseId(e.target.value);
            setError(null);
          }}
          className="field"
          placeholder="CS-1042"
          autoComplete="off"
        />
      </div>
      <div>
        <label htmlFor="recovery-code" className="meta-label mb-1.5 block">
          {t("cases.recovery.code_label", locale) || "Recovery code"}
        </label>
        <input
          id="recovery-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          className="field font-mono"
          placeholder="ABCD-1234-EFGH"
          autoComplete="off"
        />
      </div>
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-[13px] text-danger">
          <Icon name="circle-alert" className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2.5">
        <Button type="submit" disabled={busy || !caseId.trim() || !code.trim()}>
          {busy
            ? t("cases.recovery.checking", locale) || "Checking…"
            : t("cases.recovery.submit", locale) || "Restore access"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
          {t("case.cancel", locale) || "Cancel"}
        </Button>
      </div>
    </form>
  );
}
