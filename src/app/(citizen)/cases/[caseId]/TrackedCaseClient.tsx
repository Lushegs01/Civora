"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";
import { CasePageBody } from "@/components/case/CasePageBody";
import { EmptyState } from "@/components/ui/EmptyState";
import { getToken } from "@/lib/offline/db";
import type { PublicCaseView, ReporterCaseView } from "@/lib/dto/case";

type Loaded = { view: PublicCaseView | ReporterCaseView; token?: string };

export function TrackedCaseClient({ caseId }: { caseId: string }) {
  const { locale } = useLocale();
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  const load = useCallback(async () => {
    try {
      // The token never appears in the URL — it is read from device storage
      // and sent in the request body.
      const entry = await getToken(caseId);
      const res = await fetch("/api/cases/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, token: entry?.token })
      });
      if (res.status === 404) {
        setState("missing");
        return;
      }
      if (!res.ok) {
        setState("error");
        return;
      }
      const data = (await res.json()) as { view: PublicCaseView | ReporterCaseView };
      setLoaded({ view: data.view, token: entry?.token });
      setState("ready");
    } catch {
      setState("error");
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state === "loading") {
    return (
      <div className="mx-auto max-w-content px-4 pb-16 pt-6 md:px-8" aria-busy="true">
        <p className="sr-only">{t("case.loading", locale) || "Loading case"}</p>
        <div className="card h-24 animate-pulse" aria-hidden="true" />
        <div className="mt-5 card h-64 animate-pulse" aria-hidden="true" />
      </div>
    );
  }

  if (state === "missing") {
    return (
      <div className="mx-auto max-w-content px-4 pb-16 pt-10 md:px-8">
        <EmptyState
          icon="folder"
          title={t("case.notTracked.title", locale) || "This case isn't available on this device"}
          body={
            t("case.notTracked.body", locale) ||
            "Cases you report are tracked on the device you reported them from. If you have a recovery code, you can restore access from My cases."
          }
          actionLabel={t("cases.title", locale) || "My cases"}
          actionHref="/cases"
        />
      </div>
    );
  }

  if (state === "error" || !loaded) {
    return (
      <div className="mx-auto max-w-content px-4 pb-16 pt-10 md:px-8">
        <EmptyState
          icon="wifi-off"
          title={t("cases.failed.title", locale) || "Couldn't load this case"}
          body={
            t("cases.failed.body", locale) ||
            "Your tracking data is safe on this device. Check your connection and try again."
          }
        />
        <p className="mt-4 text-center text-[13px]">
          <Link href="/cases" className="font-medium text-brand-deep underline underline-offset-2">
            {t("cases.title", locale) || "My cases"}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <CasePageBody
      view={loaded.view}
      token={loaded.token}
      backHref="/cases"
      backLabel={t("cases.title", locale) || "My cases"}
      onRefresh={load}
    />
  );
}
