import type { Metadata } from "next";
import { readDb } from "@/lib/db/store";
import { publicCaseRow } from "@/lib/case-view";
import { TopBar } from "@/components/shell/TopBar";
import { CommunityExplorer } from "@/components/community/CommunityExplorer";

export const metadata: Metadata = { title: "Community cases" };
export const dynamic = "force-dynamic";

// Public transparency surface. Only public-safe fields are exposed here —
// never reporter identity, never sensitive personal data.
export default async function CommunityPage() {
  const db = await readDb();
  const rows = db.cases
    .filter((c) => c.publicVisible)
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .map((c) => publicCaseRow(db, c));

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-content px-4 pb-16 pt-5 md:px-8 md:pt-10">
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-ink md:text-[30px]">
          Community cases
        </h1>
        <p className="mt-2 max-w-lg text-[14.5px] leading-relaxed text-ink-soft">
          Follow documented civic issues and see how they progress. Reporter identities are never
          shown; unverified information is always labelled as such.
        </p>
        <div className="mt-6">
          <CommunityExplorer rows={rows} />
        </div>
      </main>
    </>
  );
}
