"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { CATEGORY_META } from "@/lib/types";
import type { CaseCategory, ResponseState, VerificationState } from "@/lib/types";
import { VerificationBadge, ResponseBadge } from "@/components/ui/Badges";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { Icon } from "@/components/ui/Icon";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

export interface CaseCardRow {
  id: string;
  title: string;
  category: CaseCategory;
  verification: VerificationState;
  response: ResponseState;
  updatedAt: string;
  locationGeneral?: string;
  href: string;
}

export function CaseCard({ row, className }: { row: CaseCardRow; className?: string }) {
  const { locale } = useLocale();
  const cat = CATEGORY_META[row.category];
  return (
    <Link
      href={row.href}
      className={cn(
        "press card block px-5 py-[18px] hover:shadow-raise",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-[12px] font-semibold tracking-wide text-ink-soft uppercase">
            {row.id}
          </span>
          <span className="chip bg-muted text-ink-soft">
            <Icon name={cat.icon} className="h-3 w-3" />
            {t(cat.label, locale)}
          </span>
        </div>
        <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-ink-soft/60" />
      </div>

      <h3 className="mt-2.5 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink">{row.title}</h3>

      <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
        <VerificationBadge state={row.verification} size="sm" />
        <ResponseBadge state={row.response} size="sm" />
      </div>

      <p className="mt-3 flex items-center gap-1 text-[12px] text-ink-soft/70">
        <RelativeTime iso={row.updatedAt} prefix={t("case.updated", locale)} />
        {row.locationGeneral && (
          <>
            <span className="text-[10px] text-ink-soft/40">·</span>
            <span className="truncate">{row.locationGeneral}</span>
          </>
        )}
      </p>
    </Link>
  );
}

export function PublicCaseCard({ row }: { row: CaseCardRow }) {
  const { locale } = useLocale();
  const cat = CATEGORY_META[row.category];
  return (
    <Link href={row.href} className="press card block px-5 py-[18px] hover:shadow-raise">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[12px] font-semibold tracking-wide text-ink-soft uppercase">{row.id}</span>
            <span className="chip bg-muted text-ink-soft">
              <Icon name={cat.icon} className="h-3 w-3" />
              {t(cat.label, locale)}
            </span>
          </div>
          <h3 className="mt-2.5 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink">{row.title}</h3>
        </div>
        <Icon name="chevron-right" className="mt-1 h-4 w-4 shrink-0 text-ink-soft/60" />
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
        <VerificationBadge state={row.verification} size="sm" />
        <ResponseBadge state={row.response} size="sm" />
      </div>

      <p className="mt-3 flex items-center gap-1 text-[12px] text-ink-soft/70">
        {row.locationGeneral && (
          <>
            <span className="truncate">{row.locationGeneral}</span>
            <span className="text-[10px] text-ink-soft/40">·</span>
          </>
        )}
        <RelativeTime iso={row.updatedAt} prefix={t("case.updated", locale)} />
      </p>
    </Link>
  );
}
