import { cookies, headers } from "next/headers";
import { currentActor, type AuthenticatedActor } from "./session";

/**
 * The actor for the current request, derived entirely server-side from the
 * session cookie. No route ever reads a role, organization or "reporter: true"
 * claim from a request body.
 */
export async function requestActor(): Promise<AuthenticatedActor | null> {
  return currentActor(cookies());
}

export function clientContext(): { ip: string | null; userAgent: string | null } {
  const h = headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]!.trim() : h.get("x-real-ip");
  return { ip: ip || null, userAgent: h.get("user-agent") };
}

export type { AuthenticatedActor };
