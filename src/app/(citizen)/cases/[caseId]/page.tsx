import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findCase, readDb } from "@/lib/db/store";
import { buildCaseView } from "@/lib/case-view";
import { TrackedCaseClient } from "./TrackedCaseClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: { caseId: string };
}): Promise<Metadata> {
  const db = await readDb();
  const c = findCase(db, params.caseId);
  return { title: c ? `Case ${c.id}` : "Case not found" };
}

// Reporter/tracking view of a case. The server renders the public-safe view;
// reporter affordances unlock only after token verification on the client.
export default async function TrackedCasePage({ params }: { params: { caseId: string } }) {
  const db = await readDb();
  const c = findCase(db, params.caseId);
  if (!c) notFound();
  const view = buildCaseView(db, c, "public");
  return <TrackedCaseClient view={view} />;
}
