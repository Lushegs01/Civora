"use client";

import Link from "next/link";
import type { PublicCaseView, ReporterCaseView } from "@/lib/dto/case";
import { CATEGORY_META, PRIVACY_META } from "@/lib/types";
import { VerificationBadge, ResponseBadge, PriorityBadge } from "@/components/ui/Badges";
import { Icon } from "@/components/ui/Icon";
import { CaseProgress } from "@/components/case/CaseProgress";
import { TrustPanel } from "@/components/case/TrustPanel";
import { TrustExplainer } from "@/components/case/TrustExplainer";
import { EvidenceChain } from "@/components/case/EvidenceChain";
import { CaseTimeline } from "@/components/case/CaseTimeline";
import { ResponseSection, EvidenceSummaryRow } from "@/components/case/ResponseSection";
import { AiSummaryCard } from "@/components/case/AiSummaryCard";
import { CaseActionBar } from "@/components/case/CaseActionBar";
import { InfoRequestPanel } from "@/components/case/InfoRequestPanel";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

function isReporterView(view: PublicCaseView | ReporterCaseView): view is ReporterCaseView {
  return view.role === "reporter";
}

export function CasePageBody({
  view,
  backHref,
  backLabel,
  token,
  onRefresh,
  after
}: {
  view: PublicCaseView | ReporterCaseView;
  backHref: string;
  backLabel: string;
  /** Present only in the reporter view; used to authorize follow-up actions. */
  token?: string;
  onRefresh?: () => void;
  /** Rendered under the side column. Used for context the case itself does
   *  not own — civic information citing it, for instance. */
  after?: React.ReactNode;
}) {
  const { locale } = useLocale();
  const reporter = isReporterView(view);
  const sourceTitles: Record<string, string> = {};
  view.evidence.forEach((e) => (sourceTitles[e.id] = e.title));
  const latestUpdate = view.updates[view.updates.length - 1];

  return (
    <div className="mx-auto max-w-content px-4 pb-16 pt-4 md:px-8 md:pt-8">
      <Link
        href={backHref}
        className="press inline-flex min-h-10 items-center gap-1 rounded-btn px-2 text-[13px] font-medium text-ink-soft/70 hover:text-ink"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        {backLabel}
      </Link>

      <header className="mt-4 md:mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-soft px-3 py-1 font-mono text-[11.5px] font-bold tracking-tight text-brand-deep">
            {view.id}
          </span>
          <span className="chip bg-muted text-ink-soft">
            <Icon name={CATEGORY_META[view.category].icon} className="h-3 w-3" />
            {t(CATEGORY_META[view.category].labelKey, locale) || CATEGORY_META[view.category].label}
          </span>
          <PriorityBadge priority={view.priority} />
          {view.disputePathway && (
            <span className="chip bg-info-soft text-info">
              <Icon name="handshake" className="h-3 w-3" /> {t("case.mediationPathway", locale)}
            </span>
          )}
          {!view.publicationState.startsWith("public") && (
            <span className="chip bg-warning-soft text-warning">
              <Icon name="eye-off" className="h-3 w-3" /> {view.publicationLabel}
            </span>
          )}
        </div>

        <h1 className="mt-4 text-[24px] font-bold leading-[1.1] tracking-[-0.025em] text-ink md:text-[32px]">
          {view.title}
        </h1>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <VerificationBadge state={view.verification} />
          <ResponseBadge state={view.response} />
        </div>

        <p className="mt-2 text-[12.5px] text-ink-soft/70">
          {view.locationGeneral ? `${view.locationGeneral} · ` : ""}
          {t("case.reported", locale)}{" "}
          {new Date(view.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
        </p>

        {/* The published summary — written for publication, never the raw report. */}
        <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-ink">{view.summary}</p>

        <div className="mt-4 border-t border-line/60 pt-4">
          <EvidenceSummaryRow view={view} />
        </div>

        {reporter && (
          <div className="mt-4 rounded-2xl border border-brand/25 bg-brand-soft/40 px-4 py-3.5">
            <p className="flex items-start gap-2.5 text-[13px] text-ink">
              <Icon
                name={view.privacyMode === "anonymous" ? "eye-off" : "lock"}
                className="mt-0.5 h-4 w-4 shrink-0 text-brand-deep"
              />
              <span>
                <strong className="font-semibold">{t("case.yourReport", locale) || "This is your report."}</strong>{" "}
                {PRIVACY_META[view.privacyMode].publicLine}.{" "}
                {t("case.reporterOnlyNote", locale) ||
                  "What you wrote is shown below to you and to the case handlers only — the public page shows the summary above."}
              </span>
            </p>
            <blockquote className="mt-3 whitespace-pre-wrap rounded-xl bg-surface px-3.5 py-3 text-[13.5px] leading-relaxed text-ink-soft">
              {view.yourReport}
            </blockquote>
          </div>
        )}
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {view.publicationState === "public_case" && (
            <AiSummaryCard caseId={view.id} sourceTitles={sourceTitles} />
          )}
          <TrustPanel view={view} />
          <TrustExplainer />
          {reporter && view.openInfoRequests.length > 0 && token && (
            <InfoRequestPanel
              caseId={view.id}
              token={token}
              requests={view.openInfoRequests}
              onDone={onRefresh}
            />
          )}
          <EvidenceChain evidence={view.evidence} viewerToken={token} />
          <CaseTimeline view={view} />
        </div>
        <div className="space-y-5">
          <CaseProgress view={view} />
          <ResponseSection
            view={view}
            latestUpdate={latestUpdate}
            trackHref={reporter ? "/cases" : undefined}
            contactEmail={view.orgContactEmail}
          />
          <CaseActionBar view={view} token={token} onChanged={onRefresh} />
          {after}
        </div>
      </div>
    </div>
  );
}
