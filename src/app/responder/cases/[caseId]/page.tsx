import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { isResponder } from "@/lib/auth/session";
import { findCase, readDb } from "@/lib/db/store";
import { buildCaseView } from "@/lib/case-view";
import { ResponderCasePanel } from "@/components/responder/ResponderCasePanel";

export const metadata: Metadata = { title: "Case workspace" };
export const dynamic = "force-dynamic";

export default async function ResponderCasePage({
  params
}: {
  params: { caseId: string };
}) {
  if (!isResponder(cookies())) redirect("/responder/access");
  const db = readDb();
  const c = findCase(db, params.caseId);
  if (!c) notFound();
  const view = buildCaseView(db, c, "responder");
  return <ResponderCasePanel view={view} orgs={db.orgs} />;
}
