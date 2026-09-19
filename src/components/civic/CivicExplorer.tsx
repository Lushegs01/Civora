"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { CivicInfoCard } from "./CivicInfoCard";
import type { CivicInfoItem } from "@/lib/civic-types";
import { t } from "@/lib/i18n/i18n";
import { useLocale } from "@/components/system/LocaleProvider";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "all", labelKey: "explore.tab.all" },
  { id: "service", labelKey: "explore.tab.services" },
  { id: "right", labelKey: "explore.tab.rights" },
  { id: "policy", labelKey: "explore.tab.policies" },
  { id: "opportunity", labelKey: "explore.tab.opportunities" },
  { id: "safety", labelKey: "explore.tab.safety" },
  { id: "project", labelKey: "explore.tab.projects" },
] as const;

export function CivicExplorer({ 
  initialItems 
}: { 
  initialItems: CivicInfoItem[]; 
}) {
  const { locale } = useLocale();
  const [items, setItems] = useState<CivicInfoItem[]>(initialItems);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    async function fetchFiltered() {
      setIsPending(true);
      try {
        const url = new URL("/api/civic", window.location.origin);
        if (activeTab !== "all") url.searchParams.set("category", activeTab);
        if (query) url.searchParams.set("q", query);
        
        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          setItems(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch filtered civic info", err);
      } finally {
        setIsPending(false);
      }
    }

    // Debounce the search
    const timer = setTimeout(() => {
      fetchFiltered();
    }, 300);

    return () => clearTimeout(timer);
  }, [activeTab, query]);

  return (
    <div className="space-y-6">
      {/* Search and Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder={t("explore.search_placeholder", locale)}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex overflow-x-auto pb-1 -mx-2 px-2 hide-scrollbar">
          <div className="flex gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  activeTab === tab.id
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {t(tab.labelKey as any, locale)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className={cn("transition-opacity duration-200", isPending && "opacity-50")}>
        {items.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-xl border border-slate-200 border-dashed">
            <Icon name="search-x" className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">{t("system.no_results", locale)}</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <CivicInfoCard key={item.id} item={item} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
