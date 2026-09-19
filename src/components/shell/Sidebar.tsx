"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CivoraLogo } from "@/components/CivoraLogo";
import { cn } from "@/lib/utils";
import { DemoTag } from "@/components/shell/DemoTag";
import { LanguageSwitcher } from "@/components/shell/LanguageSwitcher";
import { useSimpleMode } from "@/components/system/SimpleMode";
import { Icon } from "@/components/ui/Icon";

const NAV = [
  { href: "/home", labelKey: "nav.home", icon: "house" },
  { href: "/explore", labelKey: "nav.explore", icon: "search" },
  { href: "/report", labelKey: "nav.report", icon: "plus" },
  { href: "/cases", labelKey: "nav.cases", icon: "folder" },
  { href: "/community", labelKey: "nav.community", icon: "users" },
  { href: "/resources", labelKey: "nav.resources", icon: "shield-check" }
] as const;

const SECONDARY = [
  { href: "/privacy", labelKey: "nav.privacy", icon: "eye-off" },
  { href: "/more", labelKey: "nav.more", icon: "settings" }
] as const;

import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { isSimpleMode, setSimpleMode } = useSimpleMode();
  const { locale } = useLocale();
  
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface px-5 py-6 md:flex",
        className
      )}
    >
      <Link href="/home" aria-label="Civora home" className="mb-7 px-2">
        <CivoraLogo size={34} />
      </Link>

      <nav aria-label="Primary" className="flex flex-col gap-1">
        {NAV.map((item) => (
          <SideLink key={item.href} href={item.href} icon={item.icon} active={pathname.startsWith(item.href)}>
            {t(item.labelKey as any, locale)}
          </SideLink>
        ))}
      </nav>

      <div className="my-5 border-t border-line" aria-hidden="true" />

      <nav aria-label="Secondary" className="flex flex-col gap-1">
        {SECONDARY.map((item) => (
          <SideLink key={item.href} href={item.href} icon={item.icon} active={pathname.startsWith(item.href)}>
            {t(item.labelKey as any, locale)}
          </SideLink>
        ))}
        
        <div className="pt-2">
          <LanguageSwitcher />
        </div>
        
        <button
          onClick={() => setSimpleMode(!isSimpleMode)}
          className="press flex min-h-11 items-center gap-3 rounded-xl px-3 text-[14px] font-medium text-ink-soft hover:bg-muted/50 hover:text-ink transition-colors w-full text-left"
        >
          <Icon name="eye" className="h-[18px] w-[18px] text-ink-soft" />
          {isSimpleMode ? "Standard view" : "Simple view"}
        </button>
      </nav>

      <div className="mt-auto space-y-3">
        <DemoTag />
        <Link
          href="/responder"
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium text-ink-soft hover:bg-muted hover:text-ink transition-colors"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-soft text-brand-deep">
            <svg width="11" height="11" viewBox="0 0 32 32" aria-hidden="true">
              <path d="M22.5 9.5a9 9 0 1 0 0 13" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
          Responder workspace
        </Link>
      </div>
    </aside>
  );
}

function SideLink({ href, icon, active, children }: { href: string; icon: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "press flex min-h-11 items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition-colors",
        active ? "bg-muted text-ink font-semibold" : "text-ink-soft hover:bg-muted/50 hover:text-ink"
      )}
    >
      <NavGlyph name={icon} active={active} />
      {children}
    </Link>
  );
}

function NavGlyph({ name, active }: { name: string; active?: boolean }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: active ? 2.3 : 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className={active ? "text-ink" : "text-ink-soft"}>
      {name === "house" && <path d="M4 11.5 12 4l8 7.5V20h-5.5v-5h-5v5H4z" {...common} />}
      {name === "search" && (
        <>
          <circle cx="11" cy="11" r="8" {...common} />
          <path d="m21 21-4.3-4.3" {...common} />
        </>
      )}
      {name === "plus" && <path d="M12 5v14M5 12h14" {...common} />}
      {name === "folder" && <path d="M4 7a2 2 0 0 1 2-2h4l2 2.5h6a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" {...common} />}
      {name === "users" && (
        <>
          <circle cx="9" cy="9" r="3.2" {...common} />
          <path d="M3.5 19.5c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5M15.5 6.4a3.2 3.2 0 0 1 0 5.2M17.5 15.2c1.6.7 2.7 2 3.2 4.3" {...common} />
        </>
      )}
      {name === "shield-check" && (
        <>
          <path d="M12 3.5 5 6v5.5c0 4.3 2.8 7.3 7 9 4.2-1.7 7-4.7 7-9V6z" {...common} />
          <path d="m9 11.8 2.2 2.2L15.4 9.6" {...common} />
        </>
      )}
      {name === "eye-off" && (
        <>
          <path d="M4 4l16 16" {...common} />
          <path d="M9.9 5.2A9.8 9.8 0 0 1 12 5c5 0 8.5 4 9.5 7-.4 1.2-1.2 2.6-2.4 3.9M6.3 6.5C4.3 7.9 2.9 10 2.5 12c1 3 4.5 7 9.5 7 1.4 0 2.7-.3 3.9-.9" {...common} />
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
