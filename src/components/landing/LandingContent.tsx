"use client";

import type { PublicCaseView } from "@/lib/dto/case";
import Link from "next/link";
import { CivoraLogo } from "@/components/CivoraLogo";
import { HeroNav } from "@/components/landing/HeroNav";
import { HeroDevice } from "@/components/landing/HeroDevice";
import { VerificationBadge, ResponseBadge } from "@/components/ui/Badges";
import { Icon } from "@/components/ui/Icon";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

const LOOP = [
  { label: "landing.loop.1.label", detail: "landing.loop.1.detail" },
  { label: "landing.loop.2.label", detail: "landing.loop.2.detail" },
  { label: "landing.loop.3.label", detail: "landing.loop.3.detail" },
  { label: "landing.loop.4.label", detail: "landing.loop.4.detail" },
  { label: "landing.loop.5.label", detail: "landing.loop.5.detail" },
  { label: "landing.loop.6.label", detail: "landing.loop.6.detail" },
  { label: "landing.loop.7.label", detail: "landing.loop.7.detail" }
];

export function LandingContent({ demo }: { demo: PublicCaseView | null }) {
  const { locale } = useLocale();

  return (
    <div className="relative min-h-dvh bg-[#F5F7F3] selection:bg-[#2E7D4F]/20 overflow-x-hidden">
      <HeroNav />
      <section className="relative isolate overflow-hidden bg-[#071710] text-white">
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
          <div className="absolute inset-0 bg-[radial-gradient(46rem_24rem_at_24%_8%,rgba(255,255,255,0.07),transparent_65%)]" />
        </div>

        <div className="mx-auto flex min-h-svh w-full max-w-content flex-col justify-center px-6 pb-24 pt-32 sm:px-8 lg:pb-20 lg:pt-36">
          <div className="grid w-full items-center gap-20 lg:grid-cols-[1.1fr_0.94fr] lg:gap-6">
            <div className="max-w-[620px]">
              <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#9CC5AA]">
                {t("landing.hero.super", locale)}
              </p>
              <h1 className="mt-5 font-display text-[44px] font-light leading-[1.06] tracking-[-0.01em] text-white sm:text-[58px] lg:text-[62px]">
                {t("landing.hero.title1", locale)}
                <br />
                {t("landing.hero.title2", locale)}
                <br />
                {t("landing.hero.title3", locale)}
              </h1>
              <p className="mt-6 max-w-md text-[16px] leading-relaxed text-white/65 md:text-[17px]">
                {t("landing.hero.desc", locale)}
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/explore"
                  className="press group inline-flex min-h-[52px] items-center gap-2.5 rounded-full bg-white py-2 pl-7 pr-2 text-[15px] font-semibold text-[#0B1F14] shadow-[0_18px_40px_-16px_rgba(255,255,255,0.45)] transition-colors hover:bg-[#EFF5F0]"
                >
                  {t("landing.hero.btn1", locale)}
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0B1F14] text-white transition-transform duration-200 group-hover:rotate-45">
                    <Icon name="arrow-up-right" className="h-4 w-4" />
                  </span>
                </Link>
                <Link
                  href="/report"
                  className="press inline-flex min-h-[52px] items-center rounded-full border border-white/25 px-7 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {t("landing.hero.btn2", locale)}
                </Link>
              </div>

            </div>

            <div className="relative lg:pl-6">
              <HeroDevice />
            </div>
          </div>
        </div>
      </section>

      {demo && (
        <section className="mx-auto max-w-4xl px-6 py-24 sm:py-32">
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-[#2E7D4F]">
              {t("landing.live.title", locale)}
            </p>
            <h2 className="mt-6 font-display text-3xl font-light text-[#0B1F14] sm:text-4xl">
              {demo.title}
            </h2>
            <div className="mt-8 flex items-center justify-center gap-4">
              <VerificationBadge state={demo.verification} />
              <ResponseBadge state={demo.response} />
            </div>
            
            <div className="mt-12 flex w-full max-w-2xl flex-col gap-4 text-left">
              {demo.known.slice(0, 2).map((k: string, i: number) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center text-success">
                    <Icon name="check" className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <p className="text-[15px] leading-relaxed text-ink-soft">{k}</p>
                </div>
              ))}
              <div className="flex items-start gap-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center text-warning">
                  <Icon name="triangle-alert" className="h-4 w-4" strokeWidth={2} />
                </span>
                <p className="text-[15px] leading-relaxed text-ink-soft">{demo.uncertain[0]}</p>
              </div>
            </div>

            <div className="mt-12 flex w-full max-w-2xl items-center justify-between border-t border-[#E3EAE2] pt-8">
              <span className="text-sm text-ink-soft/70">{t("landing.live.fictional", locale)}</span>
              <Link href={`/community/CS-1042`} className="group flex items-center gap-2 text-sm font-medium text-[#2E7D4F]">
                {t("landing.live.see_details", locale)}
                <Icon name="arrow-right" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Trust section */}
      <section id="trust" className="scroll-mt-28 bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-content px-6 md:px-8">
          <div className="max-w-2xl">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-[#2E7D4F]">
              {t("landing.trust.principles", locale)}
            </p>
            <h2 className="mt-6 font-display text-4xl font-light tracking-tight text-[#0B1F14] sm:text-5xl">
              {t("landing.trust.title", locale)}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-ink-soft">
              {t("landing.trust.desc", locale)}
            </p>
          </div>
          
          <div className="mt-20 grid grid-cols-1 gap-16 md:grid-cols-3">
            <div className="flex flex-col gap-4">
              <div className="text-[#2E7D4F]">
                <Icon name="eye-off" className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-xl font-medium text-[#0B1F14]">
                {t("landing.trust.private_default", locale)}
              </h3>
              <p className="text-[15px] leading-relaxed text-ink-soft">
                {t("landing.trust.private_desc", locale)}
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="text-[#2E7D4F]">
                <Icon name="link" className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-xl font-medium text-[#0B1F14]">
                {t("landing.trust.evidence_linked", locale)}
              </h3>
              <p className="text-[15px] leading-relaxed text-ink-soft">
                {t("landing.trust.evidence_desc", locale)}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="text-[#2E7D4F]">
                <Icon name="history" className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-xl font-medium text-[#0B1F14]">
                {t("landing.trust.transparent", locale)}
              </h3>
              <p className="text-[15px] leading-relaxed text-ink-soft">
                {t("landing.trust.transparent_desc", locale)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Loop section */}
      <section className="bg-[#F5F7F3] py-24 sm:py-32">
        <div className="mx-auto max-w-content px-6 md:px-8">
          <div className="flex flex-col items-center text-center">
            <h2 className="font-display text-3xl font-light tracking-tight text-[#0B1F14] sm:text-4xl">
              {t("landing.loop.headline", locale)}
            </h2>
            <p className="mt-4 max-w-2xl text-[16px] text-ink-soft">
              {t("landing.loop.desc", locale)}
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {LOOP.map((s, i) => (
              <div key={s.label} className="relative pl-10">
                <span className="absolute left-0 top-1 text-[12px] font-mono font-semibold text-[#2E7D4F]">
                  0{i + 1}
                </span>
                <h3 className="font-display text-lg font-medium text-[#0B1F14]">{t(s.label, locale)}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{t(s.detail, locale)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conditions / CTA section */}
      <section className="bg-[#071710] py-24 text-white sm:py-32">
        <div className="mx-auto max-w-content px-6 md:px-8">
          <div className="grid gap-16 md:grid-cols-2 lg:gap-24">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-widest text-[#9CC5AA]">
                {t("landing.conditions.super", locale)}
              </p>
              <h2 className="mt-6 font-display text-3xl font-light tracking-tight text-white sm:text-4xl">
                {t("landing.conditions.title", locale)}
              </h2>
              <div className="mt-12 space-y-10">
                {[
                  ["cloud-off", "landing.conditions.1.title", "landing.conditions.1.desc"],
                  ["upload", "landing.conditions.2.title", "landing.conditions.2.desc"],
                  ["users", "landing.conditions.3.title", "landing.conditions.3.desc"]
                ].map(([icon, titleKey, bodyKey]) => (
                  <div key={titleKey as string} className="flex gap-6">
                    <Icon name={icon as string} className="h-6 w-6 shrink-0 text-[#9CC5AA]" strokeWidth={1.5} />
                    <div>
                      <h3 className="font-display text-[17px] font-medium text-white">{t(titleKey as string, locale)}</h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-white/60">{t(bodyKey as string, locale)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <h3 className="font-display text-2xl font-light text-white">{t("landing.try.title", locale)}</h3>
              <p className="mt-4 text-[15px] leading-relaxed text-white/60">
                {t("landing.try.desc", locale)}
              </p>
              <div className="mt-10 flex flex-col gap-4">
                <Link href="/home" className="group flex items-center justify-between border-b border-white/20 py-4 text-[15px] font-medium text-white transition-colors hover:border-white/50">
                  <span>{t("landing.try.btn1", locale)}</span>
                  <Icon name="arrow-right" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/responder" className="group flex items-center justify-between border-b border-white/20 py-4 text-[15px] font-medium text-white transition-colors hover:border-white/50">
                  <span>{t("landing.try.btn2", locale)}</span>
                  <Icon name="arrow-right" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/community" className="group flex items-center justify-between border-b border-white/20 py-4 text-[15px] font-medium text-white transition-colors hover:border-white/50">
                  <span>{t("landing.try.btn3", locale)}</span>
                  <Icon name="arrow-right" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#071710] py-12">
        <div className="mx-auto flex max-w-content flex-col items-center gap-6 px-6 md:flex-row md:justify-between md:px-8">
          <CivoraLogo size={24} dark={true} />
          <p className="text-[14px] text-white/40">{t("landing.footer.slogan", locale)}</p>
          <div className="flex gap-6 text-[14px] text-white/40">
            <Link href="/privacy" className="transition-colors hover:text-white">{t("landing.footer.privacy", locale)}</Link>
            <Link href="/resources" className="transition-colors hover:text-white">{t("landing.footer.help", locale)}</Link>
            <Link href="/more" className="transition-colors hover:text-white">{t("landing.footer.about", locale)}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}