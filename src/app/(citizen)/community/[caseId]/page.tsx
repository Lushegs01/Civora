import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findCase, readDb } from "@/lib/db/store";
import { buildCaseView } from "@/lib/case-view";
import { PublicCaseClient } from "./PublicCaseClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: { caseId: string };
}): Promise<Metadata> {
  const db = await readDb();
  const c = findCase(db, params.caseId);
  return { title: c ? `Case ${c.id} — public view` : "Case not found" };
}

// Public case page: what is known, what remains uncertain, what has happened,
// and what happens next — with reporter identity never exposed.
export default async function PublicCasePage({ params }: { params: { caseId: string } }) {
  const db = await readDb();
  const c = findCase(db, params.caseId);
  if (!c || !c.publicVisible) notFound();
  const view = buildCaseView(db, c, "public");
  return <PublicCaseClient view={view} />;
}
