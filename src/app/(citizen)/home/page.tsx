import Link from "next/link";
import { readDb } from "@/lib/db/store";
import { isResolved } from "@/lib/types";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { YourCases } from "@/components/home/YourCases";
import { CheckCase } from "@/components/home/CheckCase";

export const dynamic = "force-dynamic";

const HOW = [
  { icon: "file-text", label: "Report", body: "Describe what you saw — with or without your name." },
  { icon: "badge-check", label: "Verify", body: "Evidence and corroboration build the picture." },
  { icon: "building", label: "Respond", body: "A responsible organization acts and updates." },
  { icon: "eye", label: "Track", body: "Anyone can follow status and outcome." }
];

export default function HomePage() {
  const db = readDb();
  const openCases = db.cases.filter((c) => !isResolved(c));
  const awaitingResponse = db.cases.filter((c) =>
    ["not_assigned", "received"].includes(c.response)
  ).length;
  const resolved = db.cases.filter((c) => isResolved(c)).length;

  const snapshot = [
    { label: "Active cases", value: openCases.length, icon: "folder", tone: "bg-brand-soft text-brand-deep" },
    { label: "Awaiting response", value: awaitingResponse, icon: "inbox", tone: "bg-warning-soft text-warning" },
    { label: "Resolved", value: resolved, icon: "check-circle-2", tone: "bg-success-soft text-success" }
  ];

  return (
    <>
      <TopBar
        action={
          <Link
            href="/more"
            aria-label="Settings and more"
            className="press flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink-soft hover:bg-canvas hover:text-ink transition-colors"
          >
            <Icon name="settings" className="h-5 w-5" />
          </Link>
        }
      />

      <main className="mx-auto max-w-content px-4 md:px-8">
        {/* Hero */}
        <section className="pb-10 pt-8 md:pb-14 md:pt-12">
          <h1 className="text-balance text-[28px] font-bold leading-[1.12] tracking-[-0.03em] text-ink md:text-[34px]">
            Know what's happening.
            <br />
            Know what's verified.
            <br />
            Know what happens next.
          </h1>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-soft">
            Report civic issues safely, follow the evidence, and track what happens next.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button href="/report" size="lg" icon="plus">
              Report an issue
            </Button>
            <CheckCase />
          </div>
        </section>

        {/* Your cases */}
        <section aria-labelledby="your-cases-heading" className="pb-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="your-cases-heading" className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
              Your cases
            </h2>
            <Link href="/cases" className="text-[13px] font-medium text-ink-soft hover:text-ink transition-colors">
              View all
            </Link>
          </div>
          <YourCases />
        </section>

        {/* Community snapshot */}
        <section aria-labelledby="snapshot-heading" className="pb-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="snapshot-heading" className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
              Community snapshot
            </h2>
            <Link href="/community" className="text-[13px] font-medium text-ink-soft hover:text-ink transition-colors">
              Browse cases
            </Link>
          </div>
          <div className="card grid grid-cols-3 divide-x divide-line">
            {snapshot.map((s) => (
              <div key={s.label} className="px-4 py-5 text-center sm:px-6 sm:text-left">
                <span className={`mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full sm:mx-0 ${s.tone}`}>
                  <Icon name={s.icon} className="h-4 w-4" />
                </span>
                <p className="text-[24px] font-bold leading-none tracking-[-0.02em] text-ink">{s.value}</p>
                <p className="mt-1.5 text-[12px] font-medium leading-tight text-ink-soft">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How Civora works */}
        <section aria-labelledby="how-heading" className="pb-10">
          <h2 id="how-heading" className="mb-4 text-[17px] font-semibold tracking-[-0.01em] text-ink">
            How Civora works
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {HOW.map((h, i) => (
              <div key={h.label} className="card px-5 py-5 transition-colors hover:border-ink-soft/40">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-ink">
                    <Icon name={h.icon} className="h-4 w-4" />
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-ink-soft/50">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-[14.5px] font-semibold text-ink">{h.label}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{h.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 max-w-2xl text-[13.5px] leading-relaxed text-ink-soft">
            Civora separates reports, evidence, verification, and response so you can clearly see what is
            known and what is still uncertain.
          </p>
        </section>
      </main>
    </>
  );
}
