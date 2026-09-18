import type { NextRequest } from "next/server";
import { readDb, findCase } from "@/lib/db/store";
import { publicCaseRow } from "@/lib/case-view";
import { isAuthorizedReporter } from "@/lib/auth/session";
import { fail, ok } from "@/lib/api-helpers";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  pairs: z
    .array(
      z.object({
        caseId: z.string().trim().min(4).max(16),
        token: z.string().trim().max(120).optional()
      })
    )
    .max(20)
});

// Returns public-safe rows for the requested case IDs. `reporter` is only true
// when the device's tracking token matches the server-stored hash — the client
// claim alone is never trusted.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Couldn't read your tracked cases. Please refresh.");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Couldn't read your tracked cases. Please refresh.");

  const db = await readDb();
  const rows = [];
  for (const p of parsed.data.pairs) {
    const c = findCase(db, p.caseId);
    if (!c || !c.publicVisible) continue;
    const reporter = p.token ? isAuthorizedReporter(c, p.token) : false;
    rows.push({ ...publicCaseRow(db, c), href: reporter ? `/cases/${c.id}` : `/community/${c.id}`, reporter });
  }
  return ok({ rows });
}
