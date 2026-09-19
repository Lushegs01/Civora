import type { Metadata } from "next";
import { readDb } from "@/lib/db/store";
import { publicCaseRow } from "@/lib/case-view";
import { CommunityClient } from "./CommunityClient";

export const metadata: Metadata = { title: "Community cases" };
export const dynamic = "force-dynamic";

// Public transparency surface. Only public-safe fields are exposed here —
// never reporter identity, never sensitive personal data.
export default async function CommunityPage() {
  const db = await readDb();
  const rows = db.cases
    .filter((c) => c.publicVisible)
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .map((c) => ({ ...publicCaseRow(db, c), href: "/community/" + c.id }));

  return <CommunityClient rows={rows} />;
}
