import Link from "next/link";
import { readDb, findCase } from "@/lib/db/store";
import { buildCaseView, publicCaseRow } from "@/lib/case-view";
import { CivoraLogo } from "@/components/CivoraLogo";
import { Button } from "@/components/ui/Button";
import { VerificationBadge, ResponseBadge } from "@/components/ui/Badges";
import { Icon } from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

const LOOP = [
  { label: "Report", detail: "Safely, with or without your name." },
  { label: "Protect", detail: "Privacy-first by design." },
  { label: "Verify", detail: "Evidence and corroboration, carefully." },
  { label: "Coordinate", detail: "Routed to a responsible organization." },
  { label: "Respond", detail: "Acknowledged, acted on, recorded." },
  { label: "Account", detail: "Status and timeline, in the open." },
  { label: "Inform", detail: "Everyone knows what happens next." }
];

const TRUST = [
  {
    icon: "eye-off",
    title: "Private by default",
    body: "Report anonymously or confidentially. Reporter identity is never public.",
    diagram: (
      <svg viewBox="0 0 120 56" className="h-14 w-full" aria-hidden="true">
        <rect x="8" y="12" width="60" height="32" rx="10" className="fill-muted" />
        <circle cx="24" cy="28" r="7" className="fill-surface stroke-ink-soft" strokeWidth="1.6" />
        <path d="M38 22h22M38 34h16" className="stroke-ink-soft" strokeWidth="2" strokeLinecap="round" />
        <rect x="78" y="18" width="34" height="20" rx="8" className="fill-surface stroke-line" />
        <path d="M85 28h4M93 28h12" className="stroke-ink-soft" strokeWidth="2" strokeLinecap="round" />
        <text x="95" y="15" className="fill-ink-soft" fontSize="7">hidden</text>
      </svg>
    )
  },
  {
    icon: "link",
    title: "Evidence-linked",
    body: "Every claim stays connected to its source, with checksums recorded.",
    diagram: (
      <svg viewBox="0 0 120 56" className="h-14 w-full" aria-hidden="true">
        <circle cx="20" cy="28" r="8" className="fill-brand-soft stroke-brand" strokeWidth="1.6" />
        <circle cx="60" cy="28" r="8" className="fill-surface stroke-line" strokeWidth="1.6" />
        <circle cx="100" cy="28" r="8" className="fill-surface stroke-line" strokeWidth="1.6" />
        <path d="M28 28h24M68 28h24" className="stroke-ink-soft" strokeWidth="2" strokeDasharray="3 4" strokeLinecap="round" />
        <path d="M17 28h6M57 28h6M97 28h6" className="stroke-ink-soft" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  },
  {
    icon: "history",
    title: "Transparent status",
    body: "Reported ≠ verified ≠ responded. Each state stays distinct, in public.",
    diagram: (
      <svg viewBox="0 0 120 56" className="h-14 w-full" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <circle cx={22 + i * 26} cy="28" r={i === 0 ? 8 : 6.5} className={i === 0 ? "fill-ink" : i === 3 ? "fill-surface stroke-line" : "fill-brand-soft stroke-brand"} />
            {i < 3 && <path d={`M${30 + i * 26} 28h${10}`} className="stroke-ink-soft" strokeWidth="2" strokeLinecap="round" />}
          </g>
        ))}
      </svg>
    )
  },
  {
    icon: "arrow-right",
    title: "Action-oriented",
    body: "Every case ends with a concrete next step — never a dead end.",
    diagram: (
      <svg viewBox="0 0 120 56" className="h-14 w-full" aria-hidden="true">
        <rect x="10" y="18" width="52" height="20" rx="10" className="fill-surface stroke-line" />
        <path d="M20 28h30" className="stroke-ink-soft" strokeWidth="2" strokeLinecap="round" />
        <rect x="70" y="18" width="40" height="20" rx="10" className="fill-brand-soft stroke-brand" />
        <path d="M80 28h18m-5-4 5 4-5 4" className="stroke-brand-deep" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    )
  }
];

export default function LandingPage() {
  const db = readDb();
  const demo = findCase(db, "CS-1042");
  const demoView = demo ? buildCaseView(db, demo, "public") : null;
  const row = demo ? publicCaseRow(db, demo) : null;

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <header className="mx-auto flex max-w-content items-center justify-between px-4 py-5 md:px-8">
        <CivoraLogo size={34} />
        <div className="flex items-center gap-2">
          <Button href="/responder" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Responder demo
          </Button>
          <Button href="/home" size="sm">
            Open the app
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-content px-4 pb-14 pt-8 md:px-8 md:pb-20 md:pt-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <span className="chip bg-brand-soft text-brand-deep">
              <Icon name="shield-check" className="h-3.5 w-3.5" />
              Civic incident platform
            </span>
            <h1 className="text-balance mt-4 text-[34px] font-bold leading-[1.12] tracking-[-0.02em] text-ink md:text-[44px]">
              Report safely.
              <br />
              Verify carefully.
              <br />
              Respond together.
            </h1>
            <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-ink-soft md:text-base">
              Civora connects civic reports, evidence, response, and accountability in one traceable
              workflow — so communities know what's happening, what's verified, and what happens next.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/report" size="lg" icon="plus">
                Report an issue
              </Button>
              <Button href="/community" size="lg" variant="secondary">
                Explore cases
              </Button>
            </div>
            <p className="mt-6 text-[13px] leading-relaxed text-ink-soft">
              Know what's happening. Know what's verified. Know what happens next.
            </p>
          </div>

          {/* Case example — the product in one card */}
          {demo && demoView && row && (
            <div className="md:pl-6">
              <p className="meta-label mb-3">A Civora case</p>
              <Link href="/community/CS-1042" className="press card block px-6 py-6 hover:shadow-raise">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[13px] font-semibold text-ink">CS-1042</span>
                  <span className="chip bg-danger-soft text-danger">
                    <Icon name="shield-alert" className="h-3 w-3" /> Safety
                  </span>
                </div>
                <h2 className="mt-2.5 text-xl font-semibold leading-snug tracking-[-0.01em] text-ink">
                  {demo.title}
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  <VerificationBadge state={demo.verification} />
                  <ResponseBadge state={demo.response} />
                </div>
                <div className="mt-5 space-y-2.5 border-t border-line pt-4">
                  {demoView.case.known.slice(0, 2).map((k, i) => (
                    <p key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                      <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      {k}
                    </p>
                  ))}
                  <p className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                    <Icon name="triangle-alert" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                    {demoView.case.uncertain[0]}
                  </p>
                </div>
                <p className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-deep">
                  See what happens next <Icon name="arrow-right" className="h-3.5 w-3.5" />
                </p>
              </Link>
              <p className="mt-2.5 px-1 text-xs text-ink-soft">
                Fictional demo case for evaluation.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* The problem */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-content px-4 py-14 md:px-8 md:py-20">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-[26px] font-bold tracking-[-0.02em] text-ink md:text-[30px]">
                Civic information is fragmented
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
                People report problems through word-of-mouth, chats and phone calls. The result:
                duplicated reports, unverified claims, unclear responsibility — and rumours moving
                faster than facts.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Duplicate or conflicting reports",
                "Unsafe reporting channels",
                "Unclear responsibility",
                "No visibility into response",
                "Rumours replacing verified updates",
                "People not knowing what's next"
              ].map((p) => (
                <p key={p} className="flex items-start gap-2.5 rounded-2xl bg-muted px-4 py-3.5 text-[13.5px] font-medium text-ink">
                  <Icon name="circle-alert" className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-content px-4 py-14 md:px-8 md:py-20">
        <h2 className="text-[26px] font-bold tracking-[-0.02em] text-ink md:text-[30px]">
          One traceable lifecycle
        </h2>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft">
          Every case moves through the same loop. Reported never collapses into verified; verified
          never collapses into resolved.
        </p>
        <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LOOP.map((s, i) => (
            <li key={s.label} className="card px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink font-mono text-[11px] font-semibold text-white">
                  {i + 1}
                </span>
                <h3 className="text-[15px] font-semibold text-ink">{s.label}</h3>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{s.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Trust by design */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-content px-4 py-14 md:px-8 md:py-20">
          <h2 className="text-[26px] font-bold tracking-[-0.02em] text-ink md:text-[30px]">
            Trust by design
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((t) => (
              <div key={t.title} className="card px-5 py-5">
                {t.diagram}
                <div className="mt-3 flex items-center gap-2">
                  <Icon name={t.icon} className="h-4 w-4 text-brand-deep" />
                  <h3 className="text-[15px] font-semibold text-ink">{t.title}</h3>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built for real conditions + CTA */}
      <section className="mx-auto max-w-content px-4 py-14 md:px-8 md:py-20">
        <div className="card overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="px-6 py-8 md:px-8 md:py-10">
              <h2 className="text-[22px] font-bold tracking-[-0.02em] text-ink">
                Built for real conditions
              </h2>
              <ul className="mt-5 space-y-3.5">
                {[
                  ["cloud-off", "Works offline", "Drafts are stored on the device and submitted automatically when connection returns."],
                  ["upload", "Low-bandwidth friendly", "Text and status first; photos are compressed before upload."],
                  ["eye-off", "Privacy controls", "Anonymous, confidential or identified — chosen per report."],
                  ["users", "Neutral by design", "Civora organizes evidence and response. It doesn't judge people."]
                ].map(([icon, title, body]) => (
                  <li key={title as string} className="flex gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
                      <Icon name={icon as string} className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-[14.5px] font-semibold text-ink">{title}</h3>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-ink-soft">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-line bg-muted/60 px-6 py-8 md:border-l md:border-t-0 md:px-8 md:py-10">
              <h3 className="text-[17px] font-semibold text-ink">Try the demo</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
                Three roles, one product. All data is fictional.
              </p>
              <div className="mt-5 space-y-2.5">
                <Button href="/home" className="w-full" iconRight="arrow-right">
                  Explore as a citizen
                </Button>
                <Button href="/responder" variant="secondary" className="w-full" iconRight="arrow-right">
                  Open the responder workspace
                </Button>
                <Button href="/community" variant="secondary" className="w-full" iconRight="arrow-right">
                  Browse public cases
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-content flex-col gap-3 px-4 py-8 text-[13px] text-ink-soft md:flex-row md:items-center md:justify-between md:px-8">
          <CivoraLogo size={26} />
          <p>Report safely. Verify carefully. Respond together.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/resources" className="hover:text-ink">Get help</Link>
            <Link href="/more" className="hover:text-ink">About this demo</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
