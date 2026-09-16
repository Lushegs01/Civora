import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isResponder } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { CATEGORY_META, isResolved } from "@/lib/types";
import { VERIFICATION_META, RESPONSE_META, TONE_STYLES } from "@/lib/states";
import { VerificationBadge, ResponseBadge, PriorityBadge } from "@/components/ui/Badges";
import { Icon } from "@/components/ui/Icon";
import { relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Responder workspace" };
export const dynamic = "force-dynamic";

export default function ResponderDashboard() {
  if (!isResponder(cookies())) redirect("/responder/access");

  const db = readDb();
  const open = db.cases.filter((c) => !isResolved(c));
  const metrics = [
    { label: "New", value: db.cases.filter((c) => ["received", "not_assigned"].includes(c.response)).length, tone: "bg-brand-soft text-brand-deep", icon: "inbox" },
    { label: "Verification", value: db.cases.filter((c) => c.verification === "unverified" && !isResolved(c)).length, tone: "bg-warning-soft text-warning", icon: "badge-check" },
    { label: "Assigned", value: db.cases.filter((c) => c.assignedOrgId && !isResolved(c)).length, tone: "bg-info-soft text-info", icon: "building" },
    { label: "In progress", value: db.cases.filter((c) => ["in_progress", "action_recorded"].includes(c.response)).length, tone: "bg-info-soft text-info", icon: "loader-circle" },
    { label: "Resolved", value: db.cases.filter((c) => isResolved(c)).length, tone: "bg-success-soft text-success", icon: "check-circle-2" }
  ];

  const sorted = [...db.cases].sort((a, b) => {
    const rank = (c: (typeof db.cases)[number]) =>
      (c.priority === "urgent" ? 0 : c.priority === "elevated" ? 1 : 2) * 10 +
      (c.response === "received" || c.response === "not_assigned" ? 0 : 1);
    return rank(a) - rank(b) || +new Date(b.updatedAt) - +new Date(a.updatedAt);
  });

  return (
    <main className="mx-auto max-w-content px-4 py-6 md:px-8 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold tracking-[-0.02em] text-ink md:text-[28px]">
            Response overview
          </h1>
          <p className="mt-1.5 text-[14px] text-ink-soft">
            {open.length} open case{open.length === 1 ? "" : "s"} across {db.orgs.length} configured
            organizations. Demo data.
          </p>
        </div>
        <Link
          href="/cases/CS-1042"
          className="press inline-flex min-h-10 items-center gap-1.5 rounded-btn bg-brand-soft px-3.5 text-[13px] font-medium text-brand-deep hover:bg-brand/15"
        >
          <Icon name="sparkles" className="h-4 w-4" />
          Primary demo case
        </Link>
      </div>

      {/* Metrics */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((m) => (
          <div key={m.label} className="card px-4 py-4">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${m.tone}`}>
              <Icon name={m.icon} className="h-4 w-4" />
            </span>
            <p className="mt-3 text-[26px] font-bold leading-none tracking-[-0.02em] text-ink">
              {m.value}
            </p>
            <p className="mt-1.5 text-[12.5px] font-medium text-ink-soft">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Case list */}
      <h2 className="mt-8 text-[18px] font-semibold tracking-[-0.01em] text-ink">Cases</h2>
      <div className="mt-3 card divide-y divide-line overflow-hidden">
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
              <div className="col-span-2 flex items-center gap-2.5 sm:col-span-1">
                <span className="font-mono text-[13px] font-semibold text-ink">{c.id}</span>
                <PriorityBadge priority={c.priority} />
              </div>
              <div className="col-span-2 min-w-0 sm:col-span-1">
                <p className="truncate text-[14px] font-semibold text-ink">{c.title}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-soft">
                  <Icon name={cat.icon} className="h-3 w-3" />
                  {cat.label}
                  {c.locationGeneral && <span className="truncate">· {c.locationGeneral}</span>}
                </p>
              </div>
              <div className="col-span-1">
                <span className={`chip ${TONE_STYLES[vm.tone].chip} w-full justify-center sm:justify-start`}>
                  <Icon name={vm.icon} className="h-3 w-3" />
                  {vm.label}
                </span>
              </div>
              <div className="col-span-1">
                <span className={`chip ${TONE_STYLES[rm.tone].chip} w-full justify-center sm:justify-start`}>
                  <Icon name={rm.icon} className="h-3 w-3" />
                  {rm.label}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:justify-end">
                <span className="text-xs text-ink-soft sm:text-right">
                  {relativeTime(c.updatedAt)}
                </span>
                <Icon name="chevron-right" className="h-4 w-4 text-ink-soft/60 sm:hidden" />
              </div>
            </Link>
          );
        })}
      </div>
      <p className="mt-3 px-1 text-xs text-ink-soft">
        Cases are ordered by priority, then recency. Reporter identities stay protected in every
        view; anonymous reports show no identity at all.
      </p>
    </main>
  );
}
