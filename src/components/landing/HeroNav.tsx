"use client";

import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CivoraLogo } from "@/components/CivoraLogo";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", labelKey: "nav.home", active: true },
  { href: "/report", labelKey: "nav.report", active: false },
  { href: "/community", labelKey: "nav.cases", active: false },
  { href: "/#trust", labelKey: "nav.how_it_works", active: false },
  { href: "/privacy", labelKey: "nav.privacy", active: false }
];

export function HeroNav() {
  const { locale } = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex max-w-content items-center justify-between gap-4">
        <Link href="/" aria-label="Civora home" className="press shrink-0">
          <CivoraLogo size={32} dark={!scrolled} />
        </Link>

        {/* Center pill bar */}
        <nav
          aria-label="Main navigation"
          className={cn(
            "hidden items-center gap-1 rounded-full border p-1.5 backdrop-blur-xl transition-all duration-300 lg:flex",
            scrolled
              ? "border-white/10 bg-[#0B1F14]/90 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.65)]"
              : "border-white/15 bg-white/[0.09] shadow-[0_12px_40px_-20px_rgba(0,0,0,0.5)]"
          )}
        >
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2 text-[14px] transition-colors",
                item.active
                  ? "bg-white font-semibold text-[#0B1F14] shadow-sm"
                  : "font-medium text-white/75 hover:bg-white/10 hover:text-white"
              )}
            >
              {t(item.labelKey, locale) || "Link"}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/responder/access"
            className={cn(
              "press rounded-full px-4 py-2 text-[14px] font-medium transition-colors",
              scrolled
                ? "border border-line bg-white/80 text-ink-soft shadow-xs backdrop-blur-xl hover:text-ink"
                : "text-white/70 hover:text-white"
            )}
          >
            {t("nav.responder_demo", locale) || "Responder demo"}
          </Link>
          <Link
            href="/home"
            className="press group inline-flex min-h-11 items-center gap-2 rounded-full bg-white py-1.5 ps-5 pe-1.5 text-[14px] font-semibold text-[#0B1F14] shadow-[0_10px_30px_-12px_rgba(255,255,255,0.4)] transition-all hover:bg-white/90"
          >
            {t("nav.get_started", locale) || "Get started"}
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0B1F14] text-white transition-transform duration-200 group-hover:rotate-45">
              <Icon name="arrow-up-right" className="h-4 w-4" />
            </span>
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/home"
            className="press inline-flex min-h-10 items-center rounded-full bg-white px-4 text-[13px] font-semibold text-[#0B1F14]"
          >
            {t("nav.get_started", locale) || "Get started"}
          </Link>
          <button
            type="button"
            aria-label={open ? (t("nav.close_menu", locale) || "Close navigation menu") : (t("nav.open_menu", locale) || "Open navigation menu")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="press flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-xl"
          >
            <Icon name={open ? "x" : "menu"} className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="mx-auto mt-2 max-w-content rounded-[24px] border border-white/12 bg-[#0B1F14]/95 p-2 shadow-2xl backdrop-blur-2xl lg:hidden">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-2xl px-4 py-3 text-[15px] transition-colors",
                item.active ? "bg-white/10 font-semibold text-white" : "font-medium text-white/75 hover:bg-white/5 hover:text-white"
              )}
            >
              {t(item.labelKey, locale) || "Link"}
            </Link>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/10 pt-2">
            <Link
              href="/responder/access"
              onClick={() => setOpen(false)}
              className="press inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/15 px-3 text-[14px] font-semibold text-white"
            >
              {t("nav.responder_demo", locale) || "Responder demo"}
            </Link>
            <Link
              href="/home"
              onClick={() => setOpen(false)}
              className="press inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-3 text-[14px] font-semibold text-[#0B1F14]"
            >
              {t("nav.get_started", locale) || "Get started"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
