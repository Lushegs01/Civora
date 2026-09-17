"use client";

import { useMemo, useState } from "react";
import type { CaseCardRow } from "@/components/case/CaseCard";
import { PublicCaseCard } from "@/components/case/CaseCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "safety", label: "Safety" },
  { key: "service", label: "Services" },
  { key: "infrastructure", label: "Infrastructure" },
  { key: "community", label: "Community" }
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const FILTER_MAP: Record<Exclude<FilterKey, "all">, string[]> = {
  safety: ["safety"],
  service: ["service"],
  infrastructure: ["infrastructure"],
  community: ["community", "dispute", "other"]
};

export function CommunityExplorer({ rows }: { rows: Array<Omit<CaseCardRow, "href">> }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && !FILTER_MAP[filter].includes(r.category)) return false;
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        (r.locationGeneral || "").toLowerCase().includes(q)
      );
    });
  }, [rows, filter, query]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search cases</span>
          <Icon
            name="search"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ID, title or area"
            className="field pl-10"
            type="search"
          />
        </label>
      </div>

      <div className="mt-4 flex gap-1.5 overflow-x-auto scroll-hide pb-1" role="tablist" aria-label="Filter cases">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "press min-h-10 shrink-0 rounded-full border px-4 text-[13.5px] font-medium transition-colors",
              filter === f.key
                ? "border-ink bg-ink text-white"
                : "border-line bg-surface text-ink-soft hover:border-ink-soft/40 hover:text-ink"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-2.5">
        {filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title="No cases match"
            description={
              query
                ? `Nothing matches "${query}". Try a case ID like CS-1042, or clear the filters.`
                : "No public cases in this filter yet."
            }
          />
        ) : (
          filtered.map((r) => <PublicCaseCard key={r.id} row={{ ...r, href: `/community/${r.id}` }} />)
        )}
      </div>
    </div>
  );
}
