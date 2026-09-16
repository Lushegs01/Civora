"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CivoraLogo } from "@/components/CivoraLogo";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/home", label: "Home", icon: "house" },
  { href: "/cases", label: "My cases", icon: "folder" },
  { href: "/community", label: "Community", icon: "users" },
  { href: "/more", label: "More", icon: "settings" }
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const reportActive = pathname.startsWith("/report");

  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pb-1.5 pt-1.5">
        {ITEMS.slice(0, 2).map((item) => (
          <NavItem key={item.href} item={item} active={pathname.startsWith(item.href)} />
        ))}

        {/* Report — visually prominent, centred, still calm */}
        <div className="relative flex justify-center">
          <Link
            href="/report"
            aria-label="Report an issue"
            aria-current={reportActive ? "page" : undefined}
            className={cn(
              "press -mt-6 flex h-14 w-14 flex-col items-center justify-center rounded-full text-white shadow-raise",
              reportActive ? "bg-brand-deep" : "bg-ink"
            )}
          >
            <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
              <rect width="32" height="32" rx="9" fill="transparent" />
              <path
                d="M22.5 9.5a9 9 0 1 0 0 13"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="23.5" cy="16" r="3" fill="currentColor" className="text-brand-soft" />
            </svg>
            <span className="mt-0.5 text-[10px] font-semibold">Report</span>
          </Link>
        </div>

        {ITEMS.slice(2).map((item) => (
          <NavItem key={item.href} item={item} active={pathname.startsWith(item.href)} />
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  item,
  active
}: {
  item: { href: string; label: string; icon: string };
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "press flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium",
        active ? "text-ink" : "text-ink-soft"
      )}
    >
      <NavGlyph name={item.icon} active={active} />
      {item.label}
    </Link>
  );
}

function NavGlyph({ name, active }: { name: string; active: boolean }) {
  // simple outline glyphs matching the logo language
  const stroke = active ? 2.4 : 2;
  const common = { fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
      {name === "house" && <path d="M4 11.5 12 4l8 7.5V20h-5.5v-5h-5v5H4z" {...common} />}
      {name === "folder" && <path d="M4 7a2 2 0 0 1 2-2h4l2 2.5h6a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" {...common} />}
      {name === "users" && (
        <>
          <circle cx="9" cy="9" r="3.2" {...common} />
          <path d="M3.5 19.5c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5M15.5 6.4a3.2 3.2 0 0 1 0 5.2M17.5 15.2c1.6.7 2.7 2 3.2 4.3" {...common} />
        </>
      )}
      {name === "settings" && (
        <>
          <circle cx="12" cy="12" r="3" {...common} />
          <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" {...common} />
        </>
      )}
    </svg>
  );
}
