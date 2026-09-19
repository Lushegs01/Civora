"use client";

import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CivoraLogo } from "@/components/CivoraLogo";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/#home", labelKey: "nav.landing.home" },
  { href: "/report", labelKey: "nav.landing.report" },
  { href: "/community", labelKey: "nav.landing.explore" },
  { href: "/#about", labelKey: "nav.landing.about" }
];

export function LandingNav() {
  const { locale } = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <nav
        aria-label="Main navigation"
        className={cn(
          "mx-auto flex max-w-[1120px] items-center justify-between border border-white/70 bg-white/[0.78] shadow-[0_18px_50px_-36px_rgba(17,17,17,0.55)] transition-all duration-300",
          scrolled
            ? "min-h-14 rounded-[20px] px-3.5 backdrop-blur-2xl"
            : "min-h-16 rounded-[24px] px-4 backdrop-blur-md sm:px-5"
        )}
      >
        <Link href="/" aria-label="Civora home" className="press shrink-0">
          <CivoraLogo size={30} />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-[14px] font-medium text-ink-soft transition-colors hover:bg-muted hover:text-ink"
            >
              {t(item.labelKey, locale) || "Link"}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/responder/access"
            className="press rounded-full px-3.5 py-2 text-[14px] font-medium text-ink-soft transition-colors hover:bg-muted hover:text-ink"
          >
            {t("nav.demo_mode", locale) || "Demo mode"}
          </Link>
          <Link
            href="/home"
            className="press inline-flex min-h-10 items-center justify-center rounded-[14px] bg-ink px-4 text-[14px] font-semibold text-white shadow-card transition-colors hover:bg-black"
          >
            {t("nav.open_app", locale) || "Open app"}
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? (t("nav.close_menu", locale) || "Close navigation menu") : (t("nav.open_menu", locale) || "Open navigation menu")}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="press flex h-10 w-10 items-center justify-center rounded-[14px] border border-line bg-surface text-ink md:hidden"
        >
          <Icon name={open ? "x" : "menu"} className="h-5 w-5" />
        </button>
      </nav>

      {open && (
        <div className="mx-auto mt-2 max-w-[1120px] rounded-[22px] border border-white/70 bg-white/[0.94] p-2 shadow-raise backdrop-blur-2xl md:hidden">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-[14px] px-4 py-3 text-[15px] font-medium text-ink-soft hover:bg-muted hover:text-ink"
            >
              {t(item.labelKey, locale) || "Link"}
            </Link>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line pt-2">
            <Link
              href="/responder/access"
              onClick={() => setOpen(false)}
              className="press inline-flex min-h-11 items-center justify-center rounded-[14px] bg-muted px-3 text-[14px] font-semibold text-ink"
            >
              {t("nav.demo_mode", locale) || "Demo mode"}
            </Link>
            <Link
              href="/home"
              onClick={() => setOpen(false)}
              className="press inline-flex min-h-11 items-center justify-center rounded-[14px] bg-ink px-3 text-[14px] font-semibold text-white"
            >
              {t("nav.open_app", locale) || "Open app"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
