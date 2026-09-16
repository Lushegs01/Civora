import { cookies } from "next/headers";
import { RESPONDER_COOKIE } from "@/lib/auth/session";
import { ok } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST() {
  const store = cookies();
  store.delete(RESPONDER_COOKIE);
  return ok({ ok: true });
}
