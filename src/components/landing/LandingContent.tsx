"use client";

import Link from "next/link";
import { CivoraLogo } from "@/components/CivoraLogo";
import { HeroNav } from "@/components/landing/HeroNav";
import { HeroDevice } from "@/components/landing/HeroDevice";
import { VerificationBadge, ResponseBadge } from "@/components/ui/Badges";
import { Icon } from "@/components/ui/Icon";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

const LOOP = [
  { label: "Report", detail: "Safely, with or without your name." },
  { label: "Protect", detail: "Privacy-first by design." },
  { label: "Verify", detail: "Evidence and corroboration, carefully." },
  { label: "Coordinate", detail: "Routed to a responsible organization." },
  { label: "Respond", detail: "Acknowledged, acted on, recorded." },
  { label: "Account", detail: "Status and timeline, in the open." },
  { label: "Inform", detail: "Everyone knows what happens next." }
];

export function LandingContent({ demo, demoView, row }: { demo: any, demoView: any, row: any }) {
  const { locale } = useLocale();

  return (
    <div className="relative min-h-dvh bg-[#F5F7F3] selection:bg-[#2E7D4F]/20 overflow-x-hidden">
      {/* ============ Hero â€” dark forest gradient with flowing waves ============ */}
      <HeroNav />
      <section className="relative isolate overflow-hidden bg-[#071710] text-white">
        {/* Atmosphere: layered gradients + blurred wave shapes */}
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(90rem 44rem at 82% -12%, rgba(83,158,109,0.32), transparent 62%), radial-gradient(70rem 40rem at -18% 34%, rgba(35,94,60,0.48), transparent 64%), radial-gradient(64rem 44rem at 52% 118%, rgba(16,54,33,0.85), transparent 68%)"
            }}
          />
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 1440 900"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="heroWaveA" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2E7D4F" />
                <stop offset="100%" stopColor="#0C2E1D" />
              </linearGradient>
              <linearGradient id="heroWaveB" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#123B26" />
                <stop offset="55%" stopColor="#1E5A36" />
                <stop offset="100%" stopColor="#0A2416" />
              </linearGradient>
              <linearGradient id="heroWaveC" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3E9B63" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#123B26" stopOpacity="0" />
              </linearGradient>
              <filter id="heroBlur" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="42" />
              </filter>
            </defs>
            <g filter="url(#heroBlur)">
              <g className="hero-wave-a">
                <path
                  d="M-180,640 C220,470 470,760 860,600 C1140,485 1330,540 1640,380 L1640,1080 L-180,1080 Z"
                  fill="url(#heroWaveA)"
                  opacity="0.75"
                />
              </g>
              <g className="hero-wave-b">
                <path
                  d="M-180,780 C320,640 690,850 1080,690 C1310,595 1500,650 1640,540 L1640,1080 L-180,1080 Z"
                  fill="url(#heroWaveB)"
                  opacity="0.85"
                />
              </g>
              <g className="hero-wave-a">
                <path
                  d="M420,-80 C620,140 980,60 1190,220 C1380,365 1580,290 1680,220 L1680,-260 L380,-260 Z"
                  fill="url(#heroWaveC)"
                  opacity="0.5"
                />
              </g>
            </g>
          </svg>
          {/* Soft sheen */}
          <div className="absolute inset-0 bg-[radial-gradient(46rem_24rem_at_24%_8%,rgba(255,255,255,0.07),transparent_65%)]" />
        </div>

        <div className="mx-auto flex min-h-svh w-full max-w-content flex-col justify-center px-6 pb-24 pt-32 sm:px-8 lg:pb-20 lg:pt-36">
          <div className="grid w-full items-center gap-20 lg:grid-cols-[1.1fr_0.94fr] lg:gap-6">
            {/* Copy */}
            <div className="max-w-[620px]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#9CC5AA]">
                {t("landing.hero.super", locale) || "Information you can trust"}
              </p>
              <h1 className="mt-5 font-display text-[44px] font-light leading-[1.06] tracking-[-0.01em] text-white sm:text-[58px] lg:text-[62px]">
                {t("landing.hero.title1", locale) || "Know your rights."}
                <br />
                {t("landing.hero.title2", locale) || "Report safely."}
                <br />
                {t("landing.hero.title3", locale) || "Verify together."}
              </h1>
              <p className="mt-6 max-w-md text-[16px] leading-relaxed text-white/65 md:text-[17px]">
                {t("landing.hero.desc", locale) || "Civora helps you find verified information about services and opportunities, and connects reports, evidence, and response in one transparent workflow."}
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/explore"
                  className="press group inline-flex min-h-[52px] items-center gap-2.5 rounded-full bg-white py-2 pl-7 pr-2 text-[15px] font-semibold text-[#0B1F14] shadow-[0_18px_40px_-16px_rgba(255,255,255,0.45)] transition-colors hover:bg-[#EFF5F0]"
                >
                  {t("landing.hero.btn1", locale) || "Find trusted information"}
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0B1F14] text-white transition-transform duration-200 group-hover:rotate-45">
                    <Icon name="arrow-up-right" className="h-4 w-4" />
                  </span>
                </Link>
                <Link
                  href="/report"
                  className="press inline-flex min-h-[52px] items-center rounded-full border border-white/25 px-7 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {t("landing.hero.btn2", locale) || "Report an issue"}
                </Link>
              </div>

            </div>

            {/* Device mockup */}
            <div className="relative lg:pl-6">
              <HeroDevice />
            </div>
          </div>
        </div>
      </section>

      {/* Floating Case Example Component */}
      {demo && demoView && row && (
        <section className="relative mx-auto max-w-3xl px-4 pb-20 pt-4 md:pb-28">
          <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2E7D4F]">
            Follow a live case
          </p>
          <div className="relative group">
            <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-b from-[#2E7D4F]/20 to-transparent opacity-60 blur-lg transition duration-500 group-hover:opacity-80"></div>
            <Link href="/community/CS-1042" className="relative block rounded-[28px] border border-[#DCE5DC] bg-white/90 p-8 backdrop-blur-xl shadow-[0_24px_60px_-30px_rgba(11,31,20,0.35)] transition-transform duration-500 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold tracking-wide text-[#0B1F14]/60">CS-1042</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-danger">
                  <Icon name="shield-alert" className="h-3.5 w-3.5" /> Safety
                </span>
              </div>
              <h2 className="mt-4 font-display text-2xl font-medium leading-tight tracking-tight text-[#0B1F14] md:text-3xl">
                {demo.title}
              </h2>
              <div className="mt-6 flex flex-wrap gap-3">
                <VerificationBadge state={demo.verification} className="bg-white border border-[#DCE5DC] shadow-xs" />
                <ResponseBadge state={demo.response} className="bg-white border border-[#DCE5DC] shadow-xs" />
              </div>
              <div className="mt-8 space-y-4 border-t border-[#E3EAE2] pt-6">
                {demoView.case.known.slice(0, 2).map((k: string, i: number) => (
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
              <div className="mt-8 flex items-center justify-between border-t border-[#E3EAE2] pt-6">
                <p className="text-sm text-ink-soft">Fictional demo case for evaluation.</p>
                <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2E7D4F] transition-colors group-hover:text-[#14532D]">
                  See full details <Icon name="arrow-right" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </p>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Bento Grid: Trust by Design */}
      <section id="trust" className="scroll-mt-28 border-y border-[#DCE5DC]/70 bg-[#EAF0E9]/60 py-20 md:py-28">
        <div className="mx-auto max-w-content px-4 md:px-8">
          {/* Section Header */}
          <div className="mb-14 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE5DC] bg-white px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2E7D4F] shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D4F]"></span>
              Core Principles
            </div>
            <h2 className="mt-5 font-display text-4xl font-normal tracking-tight text-[#0B1F14] sm:text-[42px] md:text-5xl">
              Trust by design
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-ink-soft md:text-[18px]">
              Civic information is often fragmented and unverified. Civora was built to demonstrate how platforms can protect reporter privacy, establish ground truth, and demand accountability.
            </p>
          </div>
          
          {/* Bento Grid */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            
            {/* Card 1: Private by default (Featured Large Card) */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-[#DCE5DC] bg-white p-7 md:col-span-2 md:p-9 shadow-[0_1px_2px_rgba(11,31,20,0.04),0_14px_36px_-24px_rgba(11,31,20,0.18)] transition-all duration-300 hover:border-[#2E7D4F]/40 hover:shadow-[0_2px_4px_rgba(11,31,20,0.05),0_22px_48px_-24px_rgba(11,31,20,0.26)]">
              <div>
                <div className="flex items-center justify-between">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#2E7D4F]/20 bg-[#E7F3EC] text-[#2E7D4F] shadow-xs">
                    <Icon name="eye-off" className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-xs">
                    <Icon name="check" className="h-3 w-3" />
                    Zero-Knowledge Identity
                  </span>
                </div>

                <h3 className="mt-6 font-display text-2xl font-medium tracking-tight text-[#0B1F14] md:text-3xl">
                  Private by default
                </h3>
                <p className="mt-2.5 max-w-xl text-[15px] leading-relaxed text-ink-soft">
                  Report anonymously or confidentially. Reporter identity is isolated from incident facts â€” never accessible to the public, and protected from responder exposure.
                </p>
              </div>

              {/* Feature highlight: Anonymity */}
              <div className="mt-8 rounded-2xl border border-[#E3EAE2] bg-[#F5F8F4]/80 p-4 shadow-xs sm:p-5">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                  <div className="flex items-center gap-2 rounded-xl border border-[#E3EAE2] bg-white px-3 py-2.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Icon name="check" className="h-2.5 w-2.5" />
                    </span>
                    <span className="font-medium text-ink-soft text-[12px]">Location is optional</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-[#E3EAE2] bg-white px-3 py-2.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Icon name="check" className="h-2.5 w-2.5" />
                    </span>
                    <span className="font-medium text-ink-soft text-[12px]">No account required</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (Cards 2 & 3 stacked) */}
            <div className="flex flex-col gap-5 md:col-span-1">
              
              {/* Card 2: Evidence-linked */}
              <div className="group relative flex flex-1 flex-col justify-between overflow-hidden rounded-[28px] border border-[#DCE5DC] bg-white p-6 shadow-[0_1px_2px_rgba(11,31,20,0.04),0_14px_36px_-24px_rgba(11,31,20,0.18)] transition-all duration-300 hover:border-[#2E7D4F]/40 hover:shadow-[0_2px_4px_rgba(11,31,20,0.05),0_22px_48px_-24px_rgba(11,31,20,0.26)] sm:p-7">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#2E7D4F]/20 bg-[#E7F3EC] text-[#2E7D4F] shadow-xs">
                      <Icon name="link" className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-[#DCE5DC] bg-[#F5F8F4] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-ink-soft">
                      SHA-256
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-medium tracking-tight text-[#0B1F14]">
                    Evidence-linked
                  </h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
                    Every claim stays connected to its source, with cryptographic hashes verified at ingestion.
                  </p>
                </div>

                {/* Mini-UI: File & Hash Snippet */}
                <div className="mt-5 rounded-xl border border-[#E3EAE2] bg-[#F5F8F4]/80 p-3">
                  <div className="flex items-center justify-between rounded-lg border border-[#E3EAE2] bg-white p-2.5 shadow-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#E7F3EC] text-[#2E7D4F]">
                        <Icon name="camera" className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-[#0B1F14]">evidence_photo_01.jpg</div>
                        <div className="font-mono text-[10px] text-ink-soft">2.4 MB Â· Corroborated</div>
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
              <div className="group relative flex flex-1 flex-col justify-between overflow-hidden rounded-[28px] border border-[#DCE5DC] bg-white p-6 shadow-[0_1px_2px_rgba(11,31,20,0.04),0_14px_36px_-24px_rgba(11,31,20,0.18)] transition-all duration-300 hover:border-[#2E7D4F]/40 hover:shadow-[0_2px_4px_rgba(11,31,20,0.05),0_22px_48px_-24px_rgba(11,31,20,0.26)] sm:p-7">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-warning/20 bg-warning-soft text-warning shadow-xs">
                      <Icon name="history" className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-[#DCE5DC] bg-[#F5F8F4] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-ink-soft">
                      Distinct States
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-medium tracking-tight text-[#0B1F14]">
                    Transparent status
                  </h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
                    Reported â‰  verified â‰  responded. Distinct operational stages prevent premature closure.
                  </p>
                </div>

                {/* Mini-UI: Workflow progression */}
                <div className="mt-5 space-y-1.5 rounded-xl border border-[#E3EAE2] bg-[#F5F8F4]/80 p-2.5">
                  <div className="flex items-center justify-between rounded-lg border border-[#E3EAE2] bg-white px-2.5 py-1.5 text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-[#0B1F14]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#2E7D4F]" /> Reported
                    </span>
                    <span className="font-mono text-[10px] text-ink-soft">10:14 UTC</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-[#E3EAE2] bg-white px-2.5 py-1.5 text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Verified
                    </span>
                    <span className="font-mono text-[10px] text-emerald-600">Corroborated</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-[#E3EAE2] bg-white px-2.5 py-1.5 text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-[#14532D]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#14532D]" /> Responded
                    </span>
                    <span className="font-mono text-[10px] text-[#14532D]">Assigned</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Card 4: No hidden decisions (Wide Bottom Card) */}
            <div className="group relative overflow-hidden rounded-[28px] border border-[#DCE5DC] bg-white p-7 md:col-span-3 md:p-8 shadow-[0_1px_2px_rgba(11,31,20,0.04),0_14px_36px_-24px_rgba(11,31,20,0.18)] transition-all duration-300 hover:border-[#2E7D4F]/40 hover:shadow-[0_2px_4px_rgba(11,31,20,0.05),0_22px_48px_-24px_rgba(11,31,20,0.26)]">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#2E7D4F]/20 bg-[#E7F3EC] text-[#2E7D4F] shadow-xs">
                    <Icon name="scroll-text" className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-medium tracking-tight text-[#0B1F14]">
                    No hidden decisions
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
                    Changes, reclassifications, and retractions are logged in a permanent public audit trail. Every action has an attributable timestamp and rationale.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DCE5DC] bg-[#F5F8F4] px-3 py-1 font-mono text-xs font-semibold text-[#0B1F14]">
                    <Icon name="badge-check" className="h-3.5 w-3.5 text-[#2E7D4F]" />
                    Public Audit Ledger
                  </span>
                </div>
              </div>

              {/* Mini-UI: Audit trail sequence */}
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#E3EAE2] bg-[#F5F8F4]/80 p-3.5 transition-colors hover:bg-[#F0F5EF]">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-ink-soft">10:14:02 UTC</span>
                    <span className="rounded border border-[#DCE5DC] bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#0B1F14]">
                      CS-1042
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-[#0B1F14]">Citizen Submission</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">
                    Infrastructure hazard flagged with anonymous cryptographic token.
                  </p>
                </div>

                <div className="rounded-xl border border-[#E3EAE2] bg-[#F5F8F4]/80 p-3.5 transition-colors hover:bg-[#F0F5EF]">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-ink-soft">10:48:15 UTC</span>
                    <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
                      Corroborated
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-[#0B1F14]">Evidence Verification</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">
                    2 independent field photographs confirmed at coordinate radius.
                  </p>
                </div>

                <div className="rounded-xl border border-[#E3EAE2] bg-[#F5F8F4]/80 p-3.5 transition-colors hover:bg-[#F0F5EF]">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-ink-soft">11:15:30 UTC</span>
                    <span className="rounded border border-[#2E7D4F]/25 bg-[#E7F3EC] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#14532D]">
                      Dispatched
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-[#0B1F14]">Agency Assignment</p>
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2E7D4F]">
            The Lifecycle
          </p>
          <h2 className="mt-4 font-display text-4xl font-normal tracking-tight text-[#0B1F14] md:text-5xl">
            One traceable lifecycle
          </h2>
          <p className="mt-4 max-w-2xl text-[17px] text-ink-soft">
            Every case moves through the same transparent loop. Reported never collapses into verified; verified never collapses into resolved.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LOOP.slice(0, 4).map((s, i) => (
            <div key={s.label} className="group relative rounded-3xl border border-[#DCE5DC] bg-white p-6 shadow-[0_1px_2px_rgba(11,31,20,0.04),0_10px_28px_-20px_rgba(11,31,20,0.16)] transition-all hover:border-[#2E7D4F]/40 hover:shadow-[0_2px_4px_rgba(11,31,20,0.05),0_18px_40px_-22px_rgba(11,31,20,0.24)] hover:-translate-y-1">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#E7F3EC] font-mono text-sm font-bold text-[#2E7D4F]">
                0{i + 1}
              </div>
              <h3 className="font-display text-lg font-medium text-[#0B1F14]">{s.label}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{s.detail}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
          {LOOP.slice(4).map((s, i) => (
            <div key={s.label} className="group relative rounded-3xl border border-[#DCE5DC] bg-white p-6 shadow-[0_1px_2px_rgba(11,31,20,0.04),0_10px_28px_-20px_rgba(11,31,20,0.16)] transition-all hover:border-[#2E7D4F]/40 hover:shadow-[0_2px_4px_rgba(11,31,20,0.05),0_18px_40px_-22px_rgba(11,31,20,0.24)] hover:-translate-y-1">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#E7F3EC] font-mono text-sm font-bold text-[#2E7D4F]">
                0{i + 5}
              </div>
              <h3 className="font-display text-lg font-medium text-[#0B1F14]">{s.label}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{s.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Built for real conditions + CTA */}
      <section className="relative isolate overflow-hidden bg-[#071710] text-white">
        {/* Atmosphere */}
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(70rem 36rem at 12% -10%, rgba(83,158,109,0.22), transparent 60%), radial-gradient(60rem 40rem at 108% 42%, rgba(35,94,60,0.35), transparent 62%), radial-gradient(56rem 36rem at 46% 128%, rgba(16,54,33,0.8), transparent 66%)"
            }}
          />
        </div>

        <div className="mx-auto max-w-content px-4 py-24 md:px-8 md:py-32">
          <div className="grid gap-16 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9CC5AA]">
                Field ready
              </p>
              <h2 className="mt-4 font-display text-4xl font-light tracking-tight text-white md:text-5xl">
                Built for real conditions
              </h2>
              <ul className="mt-10 space-y-8">
                {[
                  ["cloud-off", "Works offline", "Drafts are stored on the device and submitted automatically when connection returns."],
                  ["upload", "Low-bandwidth friendly", "Text and status first; photos are compressed before upload."],
                  ["users", "Neutral by design", "Civora organizes evidence and response. It doesn't judge people."]
                ].map(([icon, title, body]) => (
                  <li key={title as string} className="flex gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-[#9CC5AA]">
                      <Icon name={icon as string} className="h-6 w-6" />
                    </span>
                    <div>
                      <h3 className="font-display text-xl font-medium">{title}</h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-white/65">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/[0.05] p-8 backdrop-blur-xl md:p-12">
              <h3 className="font-display text-3xl font-light">{t("landing.try.title", locale) || "Try the demo"}</h3>
              <p className="mt-4 text-[16px] leading-relaxed text-white/65">
                {t("landing.try.desc", locale) || "Experience the platform from three perspectives. All data is entirely fictional."}
              </p>
              <div className="mt-10 flex flex-col gap-4">
                <Link href="/home" className="press group flex items-center justify-between rounded-full bg-white py-2 pl-7 pr-2 text-[15px] font-semibold text-[#0B1F14] transition-colors hover:bg-[#EFF5F0]">
                  <span>{t("landing.try.btn1", locale) || "Explore as a citizen"}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0B1F14] text-white transition-transform duration-200 group-hover:rotate-45">
                    <Icon name="arrow-up-right" className="h-4 w-4" />
                  </span>
                </Link>
                <Link href="/responder" className="press group flex items-center justify-between rounded-full border border-white/20 px-7 py-4 text-[15px] font-semibold text-white transition-colors hover:bg-white/10">
                  <span>{t("landing.try.btn2", locale) || "Open responder workspace"}</span>
                  <Icon name="arrow-right" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/community" className="press group flex items-center justify-between rounded-full border border-white/20 px-7 py-4 text-[15px] font-semibold text-white transition-colors hover:bg-white/10">
                  <span>{t("landing.try.btn3", locale) || "Browse public cases"}</span>
                  <Icon name="arrow-right" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#071710]">
        <div className="mx-auto flex max-w-content flex-col gap-6 px-4 py-12 text-[15px] text-white/50 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-3 text-white">
            <CivoraLogo size={28} dark={true} />
          </div>
          <p className="text-white/60">Know your rights. Report safely. Verify together.</p>
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
