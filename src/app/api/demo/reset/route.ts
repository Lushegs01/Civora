import { resetDb } from "@/lib/db/store";
import { ok } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

// Demo utility: restores the seeded fictional dataset. Uploaded evidence files
// from earlier demo runs are left in place harmlessly (they are orphaned).
export async function POST() {
  const db = resetDb();
  return ok({ ok: true, cases: db.cases.length });
}
