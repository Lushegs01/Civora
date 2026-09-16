import Link from "next/link";
import { cn } from "@/lib/utils";
import { CATEGORY_META } from "@/lib/types";
import type { CaseCategory, ResponseState, VerificationState } from "@/lib/types";
import { VerificationBadge, ResponseBadge } from "@/components/ui/Badges";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { Icon } from "@/components/ui/Icon";

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
  const cat = CATEGORY_META[row.category];
  return (
    <Link
      href={row.href}
      className={cn(
        "press card block px-5 py-4 hover:shadow-raise",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-[13px] font-semibold tracking-tight text-ink">
            {row.id}
          </span>
          <span className="chip bg-muted text-ink-soft">
            <Icon name={cat.icon} className="h-3 w-3" />
            {cat.label}
          </span>
        </div>
        <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-ink-soft/60" />
      </div>

      <h3 className="mt-2 text-[15px] font-semibold leading-snug text-ink">{row.title}</h3>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <VerificationBadge state={row.verification} size="sm" />
        <ResponseBadge state={row.response} size="sm" />
      </div>

      <p className="mt-2.5 text-xs text-ink-soft">
        <RelativeTime iso={row.updatedAt} prefix="Updated" />
        {row.locationGeneral && <span className="truncate"> · {row.locationGeneral}</span>}
      </p>
    </Link>
  );
}

export function PublicCaseCard({ row }: { row: CaseCardRow }) {
  const cat = CATEGORY_META[row.category];
  return (
    <Link href={row.href} className="press card block px-5 py-4 hover:shadow-raise">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[13px] font-semibold tracking-tight text-ink">{row.id}</span>
            <span className="chip bg-muted text-ink-soft">
              <Icon name={cat.icon} className="h-3 w-3" />
              {cat.label}
            </span>
          </div>
          <h3 className="mt-1.5 text-[15px] font-semibold leading-snug text-ink">{row.title}</h3>
        </div>
        <Icon name="chevron-right" className="mt-1 h-4 w-4 shrink-0 text-ink-soft/60" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <VerificationBadge state={row.verification} size="sm" />
        <ResponseBadge state={row.response} size="sm" />
      </div>

      <p className="mt-2.5 text-xs text-ink-soft">
        {row.locationGeneral && <span className="truncate">{row.locationGeneral} · </span>}
        <RelativeTime iso={row.updatedAt} prefix="Updated" />
      </p>
    </Link>
  );
}
