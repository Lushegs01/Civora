"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CaseView } from "@/lib/case-view";
import { CATEGORY_META } from "@/lib/types";
import { VerificationBadge, ResponseBadge, PriorityBadge } from "@/components/ui/Badges";
import { Icon } from "@/components/ui/Icon";
import { CaseProgress } from "@/components/case/CaseProgress";
import { TrustPanel } from "@/components/case/TrustPanel";
import { EvidenceChain } from "@/components/case/EvidenceChain";
import { CaseTimeline } from "@/components/case/CaseTimeline";
import { ResponseSection, EvidenceSummaryRow } from "@/components/case/ResponseSection";
import { AiSummaryCard } from "@/components/case/AiSummaryCard";
import { CaseActionBar } from "@/components/case/CaseActionBar";
import { getToken } from "@/lib/offline/db";

export function CasePageBody({ view, backHref, backLabel }: { view: CaseView; backHref: string; backLabel: string }) {
  const [reporter, setReporter] = useState(false);
  const [checked, setChecked] = useState(false);
  const c = view.case;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = await getToken(c.id);
      if (!t || cancelled) { setChecked(true); return; }
      try {
        const res = await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pairs: [{ caseId: c.id, token: t.token }] })
        });
        const data = await res.json();
        if (!cancelled) {
          const row = (data.rows || []).find((r: { reporter?: boolean }) => r.reporter);
          setReporter(Boolean(row));
        }
      } catch { /* offline */ } finally {
        if (!cancelled) setChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, [c.id]);

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
            {c.id}
          </span>
          <span className="chip bg-muted text-ink-soft">
            <Icon name={CATEGORY_META[c.category].icon} className="h-3 w-3" />
            {CATEGORY_META[c.category].label}
          </span>
          <PriorityBadge priority={c.priority} />
          {c.disputePathway && (
            <span className="chip bg-info-soft text-info">
              <Icon name="handshake" className="h-3 w-3" /> Mediation pathway
            </span>
          )}
        </div>

        <h1 className="mt-4 text-[24px] font-bold leading-[1.1] tracking-[-0.025em] text-ink md:text-[32px]">
          {c.title}
        </h1>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <VerificationBadge state={c.verification} />
          <ResponseBadge state={c.response} />
        </div>

        <p className="mt-2 text-[12.5px] text-ink-soft/70">
          {c.locationGeneral ? `${c.locationGeneral} · ` : ""}
          Reported {new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
        </p>

        <div className="mt-4 border-t border-line/60 pt-4">
          <EvidenceSummaryRow view={view} />
        </div>

        {reporter && (
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-brand/25 bg-brand-soft/40 px-4 py-3 text-[13px] text-ink">
            <Icon name={c.privacyMode === "anonymous" ? "eye-off" : "lock"} className="h-4 w-4 shrink-0 text-brand-deep" />
            <span>
              You are following this case{c.privacyMode === "anonymous" ? " — your report is anonymous." : "."}
            </span>
          </div>
        )}
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <AiSummaryCard caseId={c.id} sourceTitles={sourceTitles} />
          <TrustPanel view={view} />
          <EvidenceChain evidence={view.evidence} canSeeRestricted={reporter} />
          <CaseTimeline view={view} />
        </div>
        <div className="space-y-5">
          <CaseProgress view={view} />
          <ResponseSection view={view} latestUpdate={latestUpdate} trackHref={checked && reporter ? "/cases" : undefined} contactEmail={view.orgContactEmail} />
          <CaseActionBar view={view} tracked={checked && reporter} hasToken={reporter} />
        </div>
      </div>
    </div>
  );
}
