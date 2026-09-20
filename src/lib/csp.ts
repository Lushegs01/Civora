import { headers } from "next/headers";

/**
 * Opts a route into request-scoped rendering so the nonce-based
 * Content-Security-Policy from src/middleware.ts is stamped onto its scripts.
 *
 * Next only applies the nonce when a render actually reads the request. A page
 * that renders without touching it can be served from the full route cache,
 * where the cached HTML carries an old nonce while the response header carries
 * a fresh one — every script on the page is then blocked. Calling this is what
 * keeps the two in step, so the call is load-bearing even though it returns
 * nothing useful to the caller.
 *
 * Pages that already read the request (a database query, headers, cookies) do
 * not need it. There is a test that checks every route for nonce coverage.
 */
export function enforceCspNonce(): void {
  headers().get("x-nonce");
}
