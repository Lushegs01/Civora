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
    className: "md:col-span-2 md:row-span-2",
    diagram: (
      <div className="absolute -right-4 -top-4 opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-100 bg-brand/20 h-40 w-40 rounded-full" />
    )
  },
  {
    icon: "link",
    title: "Evidence-linked",
    body: "Every claim stays connected to its source, with checksums recorded.",
    className: "md:col-span-1 md:row-span-1",
    diagram: null
  },
  {
    icon: "history",
    title: "Transparent status",
    body: "Reported ≠ verified ≠ responded. Distinct states.",
    className: "md:col-span-1 md:row-span-1",
    diagram: null
  },
  {
    icon: "arrow-right",
    title: "Action-oriented",
    body: "Every case ends with a concrete next step — never a dead end.",
    className: "md:col-span-2 md:row-span-1",
    diagram: null
  }
];

export default function LandingPage() {
  const db = readDb();
  const demo = findCase(db, "CS-1042");
  const demoView = demo ? buildCaseView(db, demo, "public") : null;
  const row = demo ? publicCaseRow(db, demo) : null;

  return (
    <div className="min-h-dvh bg-canvas selection:bg-brand/20 overflow-x-hidden">
      {/* Premium ambient glow background */}
      <div className="absolute inset-0 -z-10 h-screen w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(47,107,255,0.15),rgba(255,255,255,0))]"></div>
      
      {/* Header */}
      <header className="mx-auto flex max-w-content items-center justify-between px-6 py-6 md:px-8">
        <CivoraLogo size={34} />
        <div className="flex items-center gap-3">
          <Button href="/responder" variant="ghost" size="sm" className="hidden sm:inline-flex text-[14px]">
            Responder demo
          </Button>
          <Button href="/home" size="sm" className="rounded-full shadow-lg shadow-brand/20 transition-transform hover:scale-105">
            Open the app
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto flex max-w-content flex-col items-center justify-center px-4 pt-20 pb-16 md:pt-32 md:pb-24 text-center">
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/50 px-4 py-1.5 text-sm font-medium text-ink-soft backdrop-blur-md shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand"></span>
            </span>
            <span className="ml-2">Civic incident platform</span>
          </span>
        </div>
        
        <h1 className="text-balance mt-8 max-w-4xl text-5xl font-extrabold tracking-tighter text-ink md:text-7xl lg:text-[80px] leading-[1.05] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
          Report safely.<br />
          <span className="bg-gradient-to-r from-brand via-info to-brand bg-clip-text text-transparent">Verify carefully.</span><br />
          Respond together.
        </h1>
        
        <p className="mt-8 max-w-2xl text-[17px] leading-relaxed text-ink-soft md:text-xl animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 fill-mode-both text-balance">
          Civora connects civic reports, evidence, response, and accountability in one traceable
          workflow — so communities know what's happening and what happens next.
        </p>
        
        <div className="mt-10 flex flex-wrap justify-center gap-4 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-500 fill-mode-both">
          <Button href="/report" size="lg" icon="plus" className="rounded-full px-8 shadow-xl shadow-brand/20 transition-all hover:scale-105 hover:shadow-brand/30">
            Report an issue
          </Button>
          <Button href="/community" size="lg" variant="secondary" className="rounded-full px-8 bg-surface/80 backdrop-blur transition-all hover:bg-surface">
            Explore cases
          </Button>
        </div>
      </section>

      {/* Floating Case Example Component */}
      {demo && demoView && row && (
        <section className="mx-auto max-w-3xl px-4 pb-20 md:pb-32 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-700 fill-mode-both">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-b from-brand/20 to-transparent opacity-50 blur-lg transition duration-500 group-hover:opacity-75"></div>
            <Link href="/community/CS-1042" className="relative block rounded-[28px] border border-line/80 bg-surface/80 p-8 backdrop-blur-xl shadow-2xl transition-transform duration-500 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold tracking-wide text-ink/70">CS-1042</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-danger">
                  <Icon name="shield-alert" className="h-3.5 w-3.5" /> Safety
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-ink md:text-3xl">
                {demo.title}
              </h2>
              <div className="mt-6 flex flex-wrap gap-3">
                <VerificationBadge state={demo.verification} className="bg-surface border border-line shadow-sm" />
                <ResponseBadge state={demo.response} className="bg-surface border border-line shadow-sm" />
              </div>
              <div className="mt-8 space-y-4 border-t border-line/60 pt-6">
                {demoView.case.known.slice(0, 2).map((k, i) => (
                  <p key={i} className="flex items-start gap-3 text-[15px] leading-relaxed text-ink-soft">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                      <Icon name="check" className="h-3 w-3" />
                    </span>
                    {k}
                  </p>
                ))}
                <p className="flex items-start gap-3 text-[15px] leading-relaxed text-ink-soft">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
                    <Icon name="triangle-alert" className="h-3 w-3" />
                  </span>
                  {demoView.case.uncertain[0]}
                </p>
              </div>
              <div className="mt-8 flex items-center justify-between border-t border-line/60 pt-6">
                <p className="text-sm text-ink-soft">Fictional demo case for evaluation.</p>
                <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors group-hover:text-brand-deep">
                  See full details <Icon name="arrow-right" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </p>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Bento Grid: Trust by Design */}
      <section className="bg-surface py-24 md:py-32">
        <div className="mx-auto max-w-content px-4 md:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">
              Trust by design
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[17px] text-ink-soft">
              Civic information is often fragmented and unverified. Civora was built from the ground up to protect privacy, establish ground truth, and demand accountability.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2">
            {TRUST.map((t, i) => (
              <div key={t.title} className={`group relative overflow-hidden rounded-[32px] border border-line bg-canvas/40 p-8 transition-colors hover:bg-muted/50 ${t.className}`}>
                {t.diagram}
                <div className="relative z-10 flex h-full flex-col">
                  <div className="mb-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface shadow-sm border border-line/50">
                    <Icon name={t.icon} className="h-6 w-6 text-brand" />
                  </div>
                  <div className="mt-12">
                    <h3 className="text-xl font-bold text-ink">{t.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-ink-soft max-w-[280px]">{t.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Lifecycle Loop */}
      <section className="mx-auto max-w-content px-4 py-24 md:px-8 md:py-32">
        <div className="mb-16 flex flex-col items-center text-center">
          <h2 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">
            One traceable lifecycle
          </h2>
          <p className="mt-4 max-w-2xl text-[17px] text-ink-soft">
            Every case moves through the same transparent loop. Reported never collapses into verified; verified never collapses into resolved.
          </p>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LOOP.slice(0, 4).map((s, i) => (
            <div key={s.label} className="group relative rounded-3xl border border-line bg-surface p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 font-mono text-sm font-bold text-brand">
                0{i + 1}
              </div>
              <h3 className="text-lg font-bold text-ink">{s.label}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{s.detail}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
          {LOOP.slice(4).map((s, i) => (
            <div key={s.label} className="group relative rounded-3xl border border-line bg-surface p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 font-mono text-sm font-bold text-brand">
                0{i + 5}
              </div>
              <h3 className="text-lg font-bold text-ink">{s.label}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{s.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Built for real conditions + CTA */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-content px-4 py-24 md:px-8 md:py-32">
          <div className="grid gap-16 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
                Built for real conditions
              </h2>
              <ul className="mt-10 space-y-8">
                {[
                  ["cloud-off", "Works offline", "Drafts are stored on the device and submitted automatically when connection returns."],
                  ["upload", "Low-bandwidth friendly", "Text and status first; photos are compressed before upload."],
                  ["users", "Neutral by design", "Civora organizes evidence and response. It doesn't judge people."]
                ].map(([icon, title, body]) => (
                  <li key={title as string} className="flex gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
                      <Icon name={icon as string} className="h-6 w-6" />
                    </span>
                    <div>
                      <h3 className="text-xl font-bold">{title}</h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-white/70">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl md:p-12">
              <h3 className="text-3xl font-bold">Try the demo</h3>
              <p className="mt-4 text-[16px] leading-relaxed text-white/70">
                Experience the platform from three perspectives. All data is entirely fictional.
              </p>
              <div className="mt-10 flex flex-col gap-4">
                <Link href="/home" className="group flex items-center justify-between rounded-2xl bg-white px-6 py-5 text-ink transition-transform hover:scale-[1.02]">
                  <span className="font-bold">Explore as a citizen</span>
                  <Icon name="arrow-right" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/responder" className="group flex items-center justify-between rounded-2xl border border-white/20 bg-transparent px-6 py-5 transition-colors hover:bg-white/10">
                  <span className="font-bold">Open responder workspace</span>
                  <Icon name="arrow-right" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/community" className="group flex items-center justify-between rounded-2xl border border-white/20 bg-transparent px-6 py-5 transition-colors hover:bg-white/10">
                  <span className="font-bold">Browse public cases</span>
                  <Icon name="arrow-right" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line/10 bg-ink">
        <div className="mx-auto flex max-w-content flex-col gap-6 px-4 py-12 text-[15px] text-white/50 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-3 text-white">
            <CivoraLogo size={28} dark={true} />
          </div>
          <p>Report safely. Verify carefully. Respond together.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="transition-colors hover:text-white">Privacy</Link>
            <Link href="/resources" className="transition-colors hover:text-white">Get help</Link>
            <Link href="/more" className="transition-colors hover:text-white">About this demo</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
