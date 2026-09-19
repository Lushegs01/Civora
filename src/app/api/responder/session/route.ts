import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { responderSessionSchema, DEMO_RESPONDER_CODE } from "@/lib/validation/schemas";
import { RESPONDER_COOKIE, responderSessionValue } from "@/lib/auth/session";
import { fail, ok } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Please enter the demo access code.");
  }
  const parsed = responderSessionSchema.safeParse(body);
  if (!parsed.success) return fail("Please enter the demo access code.");
  if (parsed.data.code.trim().toLowerCase() !== DEMO_RESPONDER_CODE.toLowerCase()) {
    return fail("That access code isn't recognized. Check the demo instructions and try again.", 401);
  }

  const store = cookies();
  store.set(RESPONDER_COOKIE, responderSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8 // 8-hour demo session
  });
  return ok({ ok: true });
}

export async function DELETE() {
  const store = cookies();
  store.delete(RESPONDER_COOKIE);
  return ok({ ok: true });
}
