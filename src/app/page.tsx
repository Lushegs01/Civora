import Image from "next/image";
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




export default function LandingPage() {
  const db = readDb();
  const demo = findCase(db, "CS-1042");
  const demoView = demo ? buildCaseView(db, demo, "public") : null;
  const row = demo ? publicCaseRow(db, demo) : null;

  return (
    <div className="relative min-h-dvh bg-canvas selection:bg-brand/20 overflow-x-hidden">
      {/* Hero & Header Shared Atmosphere Container */}
      <div className="relative isolate overflow-hidden">
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
        <section className="relative mx-auto flex max-w-content flex-col items-center justify-center px-4 pt-16 pb-20 md:pt-28 md:pb-28 text-center">
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            <span className="inline-flex items-center gap-2 rounded-full border border-line/80 bg-surface/85 px-4 py-1.5 text-sm font-medium text-ink-soft backdrop-blur-md shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand"></span>
              </span>
              <span className="ml-2">Civic incident platform</span>
            </span>
          </div>
          
          <h1 className="text-balance mt-8 max-w-4xl text-5xl font-extrabold tracking-tighter text-ink md:text-7xl lg:text-[80px] leading-[1.05] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both drop-shadow-sm">
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
            <Button href="/community" size="lg" variant="secondary" className="rounded-full px-8 bg-surface/90 backdrop-blur transition-all hover:bg-surface">
              Explore cases
            </Button>
          </div>
        </section>
      </div>

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
      <section className="border-y border-line/60 bg-muted/30 py-20 md:py-28">
        <div className="mx-auto max-w-content px-4 md:px-8">
          {/* Section Header */}
          <div className="mb-14 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1 text-xs font-semibold text-ink-soft shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-brand"></span>
              Core Principles
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl md:text-5xl">
              Trust by design
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-ink-soft md:text-[18px]">
              Civic information is often fragmented and unverified. Civora was built from the ground up to protect privacy, establish ground truth, and demand accountability.
            </p>
          </div>
          
          {/* Bento Grid */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            
            {/* Card 1: Private by default (Featured Large Card) */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-line bg-surface p-7 md:col-span-2 md:p-9 shadow-card transition-all duration-300 hover:border-brand/40 hover:shadow-raise">
              <div>
                <div className="flex items-center justify-between">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-brand/20 bg-brand-soft text-brand shadow-xs">
                    <Icon name="eye-off" className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-xs">
                    <Icon name="check" className="h-3 w-3" />
                    Zero-Knowledge Identity
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-bold tracking-tight text-ink md:text-3xl">
                  Private by default
                </h3>
                <p className="mt-2.5 max-w-xl text-[15px] leading-relaxed text-ink-soft">
                  Report anonymously or confidentially. Reporter identity is isolated from incident facts — never accessible to the public, and protected from responder exposure.
                </p>
              </div>

              {/* Mini-UI: Anonymity & Sanitation Simulation */}
              <div className="mt-8 rounded-2xl border border-line/80 bg-canvas/70 p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-line/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                      Sanitized Ingestion Tunnel
                    </span>
                  </div>
                  <span className="rounded-md border border-line bg-surface px-2 py-0.5 font-mono text-[11px] text-ink-soft">
                    TLS 1.3 · E2E
                  </span>
                </div>

                <div className="mt-3.5 space-y-2.5">
                  <div className="flex items-center justify-between rounded-xl border border-line/80 bg-surface p-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
                        <Icon name="user" className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-ink">Reporter Identity Masked</div>
                        <div className="font-mono text-[11px] text-ink-soft">ID: anon_8b4e9f · Stripped at boundary</div>
                      </div>
                    </div>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                      Protected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                    <div className="flex items-center gap-2 rounded-xl border border-line/70 bg-surface px-3 py-2.5">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Icon name="check" className="h-2.5 w-2.5" />
                      </span>
                      <span className="font-medium text-ink-soft text-[12px]">EXIF & GPS metadata stripped</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-line/70 bg-surface px-3 py-2.5">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Icon name="check" className="h-2.5 w-2.5" />
                      </span>
                      <span className="font-medium text-ink-soft text-[12px]">No IP addresses or cookies stored</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (Cards 2 & 3 stacked) */}
            <div className="flex flex-col gap-5 md:col-span-1">
              
              {/* Card 2: Evidence-linked */}
              <div className="group relative flex flex-1 flex-col justify-between overflow-hidden rounded-[28px] border border-line bg-surface p-6 sm:p-7 shadow-card transition-all duration-300 hover:border-brand/40 hover:shadow-raise">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-info/20 bg-info-soft text-info shadow-xs">
                      <Icon name="link" className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-line bg-canvas px-2.5 py-0.5 font-mono text-[11px] font-semibold text-ink-soft">
                      SHA-256
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold tracking-tight text-ink">
                    Evidence-linked
                  </h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
                    Every claim stays connected to its source, with cryptographic hashes verified at ingestion.
                  </p>
                </div>

                {/* Mini-UI: File & Hash Snippet */}
                <div className="mt-5 rounded-xl border border-line/80 bg-canvas/60 p-3">
                  <div className="flex items-center justify-between rounded-lg border border-line bg-surface p-2.5 shadow-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-info/10 text-info">
                        <Icon name="camera" className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-ink">evidence_photo_01.jpg</div>
                        <div className="font-mono text-[10px] text-ink-soft">2.4 MB · Corroborated</div>
                      </div>
                    </div>
                    <span className="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      SEALED
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between px-1 font-mono text-[10px] text-ink-soft">
                    <span className="truncate">hash: 9a2f...3c81</span>
                    <span className="font-semibold text-emerald-600">Integrity intact</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Transparent status */}
              <div className="group relative flex flex-1 flex-col justify-between overflow-hidden rounded-[28px] border border-line bg-surface p-6 sm:p-7 shadow-card transition-all duration-300 hover:border-brand/40 hover:shadow-raise">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-warning/20 bg-warning-soft text-warning shadow-xs">
                      <Icon name="history" className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-line bg-canvas px-2.5 py-0.5 font-mono text-[11px] font-semibold text-ink-soft">
                      Distinct States
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold tracking-tight text-ink">
                    Transparent status
                  </h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
                    Reported ≠ verified ≠ responded. Distinct operational stages prevent premature closure.
                  </p>
                </div>

                {/* Mini-UI: Workflow progression */}
                <div className="mt-5 space-y-1.5 rounded-xl border border-line/80 bg-canvas/60 p-2.5">
                  <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-ink">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Reported
                    </span>
                    <span className="font-mono text-[10px] text-ink-soft">10:14 UTC</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Verified
                    </span>
                    <span className="font-mono text-[10px] text-emerald-600">Corroborated</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-info">
                      <span className="h-1.5 w-1.5 rounded-full bg-info" /> Responded
                    </span>
                    <span className="font-mono text-[10px] text-info">Assigned</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Card 4: No hidden decisions (Wide Bottom Card) */}
            <div className="group relative overflow-hidden rounded-[28px] border border-line bg-surface p-7 md:col-span-3 md:p-8 shadow-card transition-all duration-300 hover:border-brand/40 hover:shadow-raise">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand/20 bg-brand-soft text-brand shadow-xs">
                    <Icon name="scroll-text" className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-2xl font-bold tracking-tight text-ink">
                    No hidden decisions
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
                    Changes, reclassifications, and retractions are logged in a permanent public audit trail. Every action has an attributable timestamp and rationale.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-3 py-1 font-mono text-xs font-semibold text-ink">
                    <Icon name="badge-check" className="h-3.5 w-3.5 text-brand" />
                    Public Audit Ledger
                  </span>
                </div>
              </div>

              {/* Mini-UI: Audit trail sequence */}
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-line/80 bg-canvas/60 p-3.5 transition-colors hover:bg-canvas">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-ink-soft">10:14:02 UTC</span>
                    <span className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink">
                      CS-1042
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-ink">Citizen Submission</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">
                    Infrastructure hazard flagged with anonymous cryptographic token.
                  </p>
                </div>

                <div className="rounded-xl border border-line/80 bg-canvas/60 p-3.5 transition-colors hover:bg-canvas">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-ink-soft">10:48:15 UTC</span>
                    <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
                      Corroborated
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-ink">Evidence Verification</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">
                    2 independent field photographs confirmed at coordinate radius.
                  </p>
                </div>

                <div className="rounded-xl border border-line/80 bg-canvas/60 p-3.5 transition-colors hover:bg-canvas">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-ink-soft">11:15:30 UTC</span>
                    <span className="rounded border border-info/20 bg-info-soft px-1.5 py-0.5 font-mono text-[10px] font-bold text-info">
                      Dispatched
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-ink">Agency Assignment</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">
                    Routed to Department of Public Works. Response team scheduled.
                  </p>
                </div>
              </div>
            </div>

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
