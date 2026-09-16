import type { NextRequest } from "next/server";
import { findCase, readDb } from "@/lib/db/store";
import { buildCaseView } from "@/lib/case-view";
import { getSummaryProvider } from "@/lib/ai/analyze";
import { fail, ok } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

// AI-assisted case summary. Always labelled in the UI; never treated as an
// official finding. Subordinate to the underlying evidence (Product Rule 2).

export async function GET(req: NextRequest, { params }: { params: { caseId: string } }) {
  const db = readDb();
  const c = findCase(db, params.caseId);
  if (!c) return fail("Case not found.", 404);

  const view = buildCaseView(db, c, "public");
  const provider = getSummaryProvider();
  const summary = await provider.summarize({
    caseRecord: {
      id: c.id,
      title: c.title,
      category: c.category,
      description: c.description,
      verification: c.verification,
      known: c.known,
      uncertain: c.uncertain
    },
    evidence: view.evidence,
    updates: view.updates,
    reportCount: c.reports.length
  });
  return ok(summary);
}
