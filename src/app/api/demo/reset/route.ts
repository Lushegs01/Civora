import { resetDb } from "@/lib/db/store";
import { ok } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

// Demo utility: restores the seeded fictional dataset. Uploaded evidence files
// from earlier demo runs are left in place harmlessly (they are orphaned).
export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split("Bearer ")[1];
  const expectedCode = process.env.DEMO_RESPONDER_CODE || "civora-demo";

  if (!token || token !== expectedCode) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
      status: 401, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  const db = await resetDb();
  return ok({ ok: true, cases: db.cases.length });
}
