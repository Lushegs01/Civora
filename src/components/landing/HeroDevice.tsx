"use client";

import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";
import { Icon } from "@/components/ui/Icon";

/**
 * CSS-built device mockup for the landing hero: a phone running the Civora
 * citizen app, with two floating status cards overlapping the frame — the
 * landing-page analogue of a product screenshot.
 */

function Donut({ value, className }: { value: number; className?: string }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r={r} fill="none" stroke="#E7efe9" strokeWidth="5" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke="#2E8B57"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${(c * value) / 100} ${c}`}
        transform="rotate(-90 20 20)"
      />
      <text x="20" y="24" textAnchor="middle" fontSize="10" fontWeight="700" fill="#111111">
        {value}%
      </text>
    </svg>
  );
}

function CategoryBubble({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF3EE] text-[#2E7D4F]">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <span className="text-[8px] font-medium text-[#6F6F6B]">{label}</span>
    </div>
  );
}

export function HeroDevice() {
  const { locale } = useLocale();
  return (
    <div className="relative mx-auto w-fit">
      {/* Glow behind device */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3E9B63]/30 blur-[90px]" />

      {/* Phone frame */}
      <div className="hero-device relative w-[292px] rounded-[52px] border border-white/20 bg-[#0D1512] p-[10px] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.7)] sm:w-[310px]">
        {/* Side buttons */}
        <div className="absolute -left-[2.5px] top-[110px] h-14 w-[3px] rounded-l-md bg-[#2A3A31]" />
        <div className="absolute -right-[2.5px] top-[150px] h-20 w-[3px] rounded-r-md bg-[#2A3A31]" />

        {/* Screen */}
        <div className="relative overflow-hidden rounded-[43px] bg-[#F5F7F4]">
          {/* Dynamic island */}
          <div className="absolute left-1/2 top-2.5 z-10 h-[22px] w-[92px] -translate-x-1/2 rounded-full bg-[#0D1512]" />

          <div className="px-4 pb-3 pt-12">
            {/* Status bar */}
            <div className="absolute inset-x-0 top-0 flex h-11 items-center justify-between px-7 pt-1">
              <span className="text-[11px] font-semibold text-[#111111]">9:41</span>
              <span className="flex items-center gap-1">
                <span className="flex items-end gap-[1.5px]">
                  <span className="h-1.5 w-[3px] rounded-sm bg-[#111]" />
                  <span className="h-2 w-[3px] rounded-sm bg-[#111]" />
                  <span className="h-2.5 w-[3px] rounded-sm bg-[#111]" />
                </span>
                <span className="ml-0.5 h-2.5 w-5 rounded-[3px] border border-[#111]/60 p-[1.5px]">
                  <span className="block h-full w-3/4 rounded-[1.5px] bg-[#111]" />
                </span>
              </span>
            </div>

            {/* Greeting */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-medium uppercase tracking-[0.14em] text-[#6F6F6B]">{t("hero.device.greeting.date", locale) || "Tuesday · District 4"}</p>
                <p className="mt-0.5 text-[17px] font-bold tracking-tight text-[#111111]">{t("hero.device.greeting.title", locale) || "Hello, Neighbor"}</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E3EFE7] text-[#2E7D4F]">
                <Icon name="user" className="h-[18px] w-[18px]" />
              </span>
            </div>

            {/* Total reports card */}
            <div className="mt-4 rounded-2xl bg-white p-3.5 shadow-[0_6px_20px_-10px_rgba(17,17,17,0.18)]">
              <div className="flex items-center justify-between">
                <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#9A9A94]">{t("hero.device.total_reports", locale) || "Total reports"}</p>
                <span className="rounded-full bg-[#E7F3EC] px-1.5 py-0.5 text-[8px] font-bold text-[#2E8B57]">+12%</span>
              </div>
              <p className="mt-1 text-[26px] font-bold leading-none tracking-tight text-[#111111]">1,248</p>
              <p className="mt-1 text-[9px] font-medium text-[#6F6F6B]">{t("hero.device.total_reports.subtitle", locale) || "in your district this month"}</p>
            </div>

            {/* Quick actions */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <span className="flex items-center justify-center gap-1.5 rounded-xl bg-[#EAF0FF] py-2.5 text-[10px] font-bold text-[#4A63D8]">
                <Icon name="plus" className="h-3.5 w-3.5" /> {t("hero.device.action.report", locale) || "Report"}
              </span>
              <span className="flex items-center justify-center gap-1.5 rounded-xl bg-[#E7F3EC] py-2.5 text-[10px] font-bold text-[#2E8B57]">
                <Icon name="check" className="h-3.5 w-3.5" /> {t("hero.device.action.verify", locale) || "Verify"}
              </span>
            </div>

            {/* Nearby activity */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-[#111111]">{t("hero.device.nearby", locale) || "Nearby activity"}</p>
                <span className="text-[8px] font-semibold text-[#9A9A94]">{t("hero.device.see_all", locale) || "See all"}</span>
              </div>
              <div className="mt-2 flex justify-between px-1">
                <CategoryBubble icon="wrench" label={t("hero.device.category.roads", locale) || "Roads"} />
                <CategoryBubble icon="siren" label={t("hero.device.category.safety", locale) || "Safety"} />
                <CategoryBubble icon="hard-hat" label={t("hero.device.category.utilities", locale) || "Utilities"} />
                <CategoryBubble icon="trash" label={t("hero.device.category.waste", locale) || "Waste"} />
              </div>
            </div>

            {/* Stats tiles */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white p-3 shadow-[0_6px_20px_-12px_rgba(17,17,17,0.16)]">
                <p className="text-[8px] font-semibold uppercase tracking-wider text-[#9A9A94]">{t("hero.device.stat.verified", locale) || "Verified"}</p>
                <p className="mt-0.5 text-[15px] font-bold text-[#111]">1,020</p>
                <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-[#EDEDEA]">
                  <span className="w-[82%] rounded-full bg-[#2E8B57]" />
                </div>
              </div>
              <div className="rounded-2xl bg-white p-3 shadow-[0_6px_20px_-12px_rgba(17,17,17,0.16)]">
                <p className="text-[8px] font-semibold uppercase tracking-wider text-[#9A9A94]">{t("hero.device.stat.in_response", locale) || "In response"}</p>
                <p className="mt-0.5 text-[15px] font-bold text-[#111]">214</p>
                <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-[#EDEDEA]">
                  <span className="w-[46%] rounded-full bg-[#5B6FE8]" />
                </div>
              </div>
            </div>

            {/* Mini list */}
            <div className="mt-3 rounded-2xl bg-white p-3 shadow-[0_6px_20px_-12px_rgba(17,17,17,0.16)]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FBF3E2] text-[#C98A00]">
                  <Icon name="map-pin" className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-bold text-[#111]">{t("hero.device.list.item.title", locale) || "Street light out — Elm & 3rd"}</p>
                  <p className="text-[8px] font-medium text-[#6F6F6B]">{t("hero.device.list.item.subtitle", locale) || "Crew assigned · ETA tomorrow"}</p>
                </div>
                <span className="rounded-full bg-[#EAF0FF] px-2 py-0.5 text-[8px] font-bold text-[#4A63D8]">{t("hero.device.list.item.status", locale) || "Active"}</span>
              </div>
            </div>
          </div>

          {/* Bottom nav */}
          <div className="flex items-center justify-around border-t border-[#E8EAE6] bg-white/90 px-5 py-2.5 backdrop-blur">
            <Icon name="house" className="h-[18px] w-[18px] text-[#2E7D4F]" />
            <Icon name="search" className="h-[18px] w-[18px] text-[#B4B6B0]" />
            <span className="flex h-9 w-9 -translate-y-2 items-center justify-center rounded-full bg-[#14532D] text-white shadow-lg">
              <Icon name="plus" className="h-[18px] w-[18px]" />
            </span>
            <Icon name="inbox" className="h-[18px] w-[18px] text-[#B4B6B0]" />
            <Icon name="user" className="h-[18px] w-[18px] text-[#B4B6B0]" />
          </div>
        </div>
      </div>

      {/* Floating card: verified case (mirrors the "Goal" card in reference) */}
      <div className="hero-float absolute -left-24 top-[56%] hidden w-[228px] rounded-2xl bg-white p-4 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.55)] md:block">
        <div className="flex items-center gap-3">
          <Donut value={80} className="h-11 w-11 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-[#111111]">{t("hero.device.float1.title", locale) || "Case CS-1042"}</p>
            <p className="truncate text-[11px] font-medium text-[#6F6F6B]">{t("hero.device.float1.subtitle", locale) || "Fallen power line · 5th Ave"}</p>
            <p className="mt-0.5 text-[10px] font-semibold text-[#2E8B57]">{t("hero.device.float1.status", locale) || "Verified by 3 neighbors"}</p>
          </div>
        </div>
      </div>

      {/* Floating card: crew dispatched (mirrors the "Premium" transaction card) */}
      <div className="hero-float hero-float-delay absolute -bottom-14 -right-16 hidden items-center gap-2.5 rounded-2xl bg-white py-3 pl-3 pr-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.55)] sm:flex">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF0FF] text-[#4A63D8]">
          <Icon name="wrench" className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[11px] font-bold text-[#111111]">{t("hero.device.float2.title", locale) || "Crew dispatched"}</p>
          <p className="text-[10px] font-medium text-[#6F6F6B]">{t("hero.device.float2.subtitle", locale) || "Public Works · 11:15 UTC"}</p>
        </div>
      </div>
    </div>
  );
}
