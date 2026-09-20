import { cookies } from "next/headers";
import { revokeSession } from "@/lib/auth/session";
import { NO_STORE_HEADERS } from "@/lib/api/respond";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Revokes the session server-side, not just in the browser. */
export async function POST() {
  await revokeSession(cookies());
  return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
}
