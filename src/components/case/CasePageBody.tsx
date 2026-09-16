"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CaseView } from "@/lib/case-view";
import { CATEGORY_META, PRIVACY_META } from "@/lib/types";
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

// Shared composition for the signature screen. The server always sends the
// public-safe view; reporter affordances unlock only after the device's
// tracking token is verified against the server-side hash.

export function CasePageBody({ view, backHref, backLabel }: { view: CaseView; backHref: string; backLabel: string }) {
  const [reporter, setReporter] = useState(false);
  const [checked, setChecked] = useState(false);
  const c = view.case;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = await getToken(c.id);
      if (!t || cancelled) {
        setChecked(true);
        return;
      }
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
      } catch {
        // offline → stay in public view; token still on device
      } finally {
        if (!cancelled) setChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [c.id]);

  const sourceTitles: Record<string, string> = {};
  view.evidence.forEach((e) => (sourceTitles[e.id] = e.title));
  const latestUpdate = view.updates[view.updates.length - 1];

  return (
    <div className="mx-auto max-w-content px-4 pb-16 pt-4 md:px-8 md:pt-8">
      <Link
        href={backHref}
        className="press inline-flex min-h-11 items-center gap-1.5 rounded-btn px-2 text-[13.5px] font-medium text-ink-soft hover:text-ink"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        {backLabel}
      </Link>

      {/* Case header */}
      <header className="mt-3 md:mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-ink px-3 py-1 font-mono text-[12.5px] font-semibold tracking-tight text-white">
            CASE #{c.id}
          </span>
          <span className="chip bg-muted text-ink-soft">
            <Icon name={CATEGORY_META[c.category].icon} className="h-3.5 w-3.5" />
            {CATEGORY_META[c.category].label}
          </span>
          <PriorityBadge priority={c.priority} />
          {c.disputePathway && (
            <span className="chip bg-info-soft text-info">
              <Icon name="handshake" className="h-3.5 w-3.5" /> Mediation pathway
            </span>
          )}
        </div>

        <h1 className="text-balance mt-3.5 text-[25px] font-bold leading-[1.15] tracking-[-0.02em] text-ink md:text-[32px]">
          {c.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <VerificationBadge state={c.verification} />
          <ResponseBadge state={c.response} />
        </div>
        <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">
          {c.locationGeneral ? `${c.locationGeneral} · ` : ""}
          Reported {new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
        </p>

        <div className="mt-4 border-t border-line pt-4">
          <EvidenceSummaryRow view={view} />
        </div>

        {reporter && (
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-brand/20 bg-brand-soft/50 px-4 py-3 text-[13px] text-ink">
            <Icon name={c.privacyMode === "anonymous" ? "eye-off" : "lock"} className="h-4 w-4 shrink-0 text-brand-deep" />
            <span>
              You're following this case{c.privacyMode === "anonymous" ? " — your report is anonymous, so your identity isn't attached to it." : "."}
            </span>
          </div>
        )}
      </header>

      {/* Desktop: two-column */}
      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
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
