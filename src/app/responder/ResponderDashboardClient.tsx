"use client";

import Link from "next/link";
import type { CaseCategory, CasePriority, PublicationState, ResponseState, VerificationState } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";
import { VERIFICATION_META, RESPONSE_META, TONE_STYLES } from "@/lib/states";
import { PriorityBadge } from "@/components/ui/Badges";
import { Icon } from "@/components/ui/Icon";
import { relativeTime } from "@/lib/utils";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

export interface WorkspaceCaseRow {
  id: string;
  title: string;
  category: CaseCategory;
  locationGeneral: string | null;
  verification: VerificationState;
  response: ResponseState;
  priority: CasePriority;
  updatedAt: string;
  assigned: boolean;
  publicationState: PublicationState;
  awaitingReporter: boolean;
  /** Corroboration candidates awaiting a decision on this case. */
  proposedLinks: number;
}

export interface WorkspaceMetrics {
  newCases: number;
  unverified: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  proposedLinks: number;
}

export function ResponderDashboardClient({
  cases,
  metrics,
  orgCount,
  viewer
}: {
  cases: WorkspaceCaseRow[];
  metrics: WorkspaceMetrics;
  orgCount: number;
  viewer: { displayName: string; role: string; orgName: string | null; isDemo: boolean };
}) {
  const { locale } = useLocale();

  const open = cases.filter((c) => c.response !== "closed");
  const tiles = [
    { label: t("responder.dashboard.metrics.new", locale), value: metrics.newCases, tone: "bg-brand-soft text-brand-deep", icon: "inbox" },
    { label: t("responder.dashboard.metrics.verification", locale), value: metrics.unverified, tone: "bg-warning-soft text-warning", icon: "badge-check" },
    { label: t("responder.dashboard.metrics.corroboration", locale) || "Corroboration to review", value: metrics.proposedLinks, tone: "bg-info-soft text-info", icon: "search" },
    { label: t("responder.dashboard.metrics.in_progress", locale), value: metrics.inProgress, tone: "bg-info-soft text-info", icon: "loader-circle" },
    { label: t("responder.dashboard.metrics.resolved", locale), value: metrics.resolved, tone: "bg-success-soft text-success", icon: "check-circle-2" }
  ];

  const sorted = [...cases].sort((a, b) => {
    const rank = (c: WorkspaceCaseRow) =>
      (c.priority === "urgent" ? 0 : c.priority === "elevated" ? 1 : 2) * 10 +
      (c.response === "received" || !c.assigned ? 0 : 1);
    return rank(a) - rank(b) || +new Date(b.updatedAt) - +new Date(a.updatedAt);
  });

  return (
    <main className="mx-auto max-w-content px-4 py-6 md:px-8 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold tracking-[-0.02em] text-ink md:text-[28px]">
            {t("responder.dashboard.title", locale)}
          </h1>
          <p className="mt-1.5 text-[14px] text-ink-soft">
            {viewer.displayName}
            {viewer.orgName ? ` · ${viewer.orgName}` : ` · ${t("responder.dashboard.triage", locale) || "Triage desk"}`}
            {" · "}
            {open.length}{" "}
            {open.length === 1
              ? t("responder.dashboard.open_case", locale)
              : t("responder.dashboard.open_cases", locale)}{" "}
            {t("responder.dashboard.across", locale)} {orgCount}{" "}
            {t("responder.dashboard.configured_orgs", locale)}
          </p>
        </div>
        {viewer.isDemo && (
          <span className="chip bg-warning-soft text-warning">
            <Icon name="triangle-alert" className="h-3.5 w-3.5" />
            {t("responder.dashboard.demo_account", locale) || "Demo account — fictional data"}
          </span>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((m) => (
          <div key={m.label} className="card px-4 py-4">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${m.tone}`}>
              <Icon name={m.icon} className="h-4 w-4" />
            </span>
            <p className="mt-3 text-[26px] font-bold leading-none tracking-[-0.02em] text-ink">{m.value}</p>
            <p className="mt-1.5 text-[12.5px] font-medium text-ink-soft">{m.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-[18px] font-semibold tracking-[-0.01em] text-ink">
        {t("responder.dashboard.cases.title", locale)}
      </h2>
      <div className="mt-3 card divide-y divide-line overflow-hidden">
        {sorted.length === 0 && (
          <p className="px-5 py-8 text-center text-[14px] text-ink-soft">
            {t("responder.dashboard.cases.empty", locale) || "No cases are currently in your queue."}
          </p>
        )}
        {sorted.map((c) => {
          const cat = CATEGORY_META[c.category];
          const vm = VERIFICATION_META[c.verification];
          const rm = RESPONSE_META[c.response];
          return (
            <Link
              key={c.id}
              href={`/responder/cases/${c.id}`}
              className="press grid grid-cols-2 items-center gap-x-4 gap-y-2 px-4 py-4 hover:bg-muted/50 sm:grid-cols-[110px_1fr_150px_150px_110px] md:px-5"
            >
              <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1">
                <span className="font-mono text-[13px] font-semibold text-ink">{c.id}</span>
                <PriorityBadge priority={c.priority} />
              </div>
              <div className="col-span-2 min-w-0 sm:col-span-1">
                <p className="truncate text-[14px] font-semibold text-ink">{c.title}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-soft">
                  <Icon name={cat.icon} className="h-3 w-3" />
                  {t(cat.labelKey, locale) || cat.label}
                  {c.locationGeneral && <span className="truncate">· {c.locationGeneral}</span>}
                  {c.proposedLinks > 0 && (
                    <span className="chip bg-info-soft text-info">
                      <Icon name="search" className="h-3 w-3" />
                      {c.proposedLinks} {t("responder.dashboard.to_review", locale) || "to review"}
                    </span>
                  )}
                  {c.publicationState !== "public_case" && (
                    <span className="chip bg-muted text-ink-soft">
                      <Icon name="eye-off" className="h-3 w-3" />
                      {t("responder.dashboard.not_public", locale) || "Not public"}
                    </span>
                  )}
                  {c.awaitingReporter && (
                    <span className="chip bg-warning-soft text-warning">
                      <Icon name="clock" className="h-3 w-3" />
                      {t("responder.dashboard.awaiting", locale) || "Awaiting reporter"}
                    </span>
                  )}
                </p>
              </div>
              <div className="col-span-1">
                <span className={`chip ${TONE_STYLES[vm.tone].chip} w-full justify-center sm:justify-start`}>
                  <Icon name={vm.icon} className="h-3 w-3" />
                  {t(`verification.${c.verification}`, locale) || vm.label}
                </span>
              </div>
              <div className="col-span-1">
                <span className={`chip ${TONE_STYLES[rm.tone].chip} w-full justify-center sm:justify-start`}>
                  <Icon name={rm.icon} className="h-3 w-3" />
                  {t(`response.${c.response}`, locale) || rm.label}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:justify-end">
                <span className="text-xs text-ink-soft sm:text-right">{relativeTime(c.updatedAt, Date.now(), locale)}</span>
                <Icon name="chevron-right" className="h-4 w-4 text-ink-soft/60 sm:hidden" />
              </div>
            </Link>
          );
        })}
      </div>
      <p className="mt-3 px-1 text-xs text-ink-soft">{t("responder.dashboard.cases.note", locale)}</p>
    </main>
  );
}
