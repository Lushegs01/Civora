"use client";

import Link from "next/link";
import { useLocale } from "@/components/system/LocaleProvider";
import { Icon } from "@/components/ui/Icon";
import { FreshnessBadge } from "@/components/civic/FreshnessBadge";
import { CIVIC_CATEGORY_META, type CivicCategory, type FreshnessState } from "@/lib/civic-types";
import { t } from "@/lib/i18n/i18n";

export interface CitingCivicItem {
  id: string;
  title: string;
  category: CivicCategory;
  freshnessState: FreshnessState;
}

/**
 * Civic information that names this case.
 *
 * The other half of the link rendered on a civic item. It matters most on a
 * case whose verification is `conflicting`: the reader arrives at published
 * information, finds it contested, and can reach the case documenting the
 * contradiction — and from the case, get back to the information it concerns.
 */
export function CitedByPanel({ items }: { items: CitingCivicItem[] }) {
  const { locale } = useLocale();
  if (items.length === 0) return null;

  return (
    <section className="card p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink-soft">
        <Icon name="link" className="h-4 w-4" />
        {t("case.cited_by", locale)}
      </h2>
      <p className="mt-1 text-[13px] text-ink-soft">{t("case.cited_by.desc", locale)}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => {
          const meta = CIVIC_CATEGORY_META[item.category];
          return (
            <li key={item.id}>
              <Link
                href={`/explore/${item.id}`}
                className="group flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-line bg-surface px-3 py-2.5 transition-colors hover:border-ink-soft/30 hover:bg-muted/40"
              >
                <Icon name={meta.icon} className="h-4 w-4 shrink-0 text-ink-soft" />
                <span className="min-w-0 flex-1 truncate text-[14px] text-ink group-hover:underline">
                  {item.title}
                </span>
                <FreshnessBadge state={item.freshnessState} />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
