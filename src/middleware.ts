import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Security headers.
//
// The Content-Security-Policy is built per request so production can use a
// nonce instead of 'unsafe-inline' for scripts. Next.js reads the nonce back
// out of this header and stamps it onto the scripts it emits, so the policy
// holds without breaking hydration.
//
// Development keeps 'unsafe-eval' because React Fast Refresh needs it; the
// difference between the two policies is deliberate and explicit rather than
// an accident of configuration.

export function middleware(request: NextRequest) {
  // Only the development server gets the relaxed policy. Anything else —
  // production, staging, a test run — is held to the strict one, so a
  // deployment cannot end up loose because NODE_ENV was set to something
  // unexpected.
  const isDev = process.env.NODE_ENV === "development";
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const scriptSrc = isDev
    ? `'self' 'unsafe-inline' 'unsafe-eval'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`;

  const directives = [
    `default-src 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `script-src ${scriptSrc}`,
    // Tailwind and Next inject style attributes and tags at runtime; there is
    // no nonce path for those, so inline styles remain allowed.
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    // blob: covers object URLs used to open restricted evidence in a new tab.
    `img-src 'self' data: blob:`,
    `media-src 'self' blob:`,
    // Same-origin only: evidence and AI calls are proxied through our own
    // routes, so the browser never needs to reach a third party directly.
    `connect-src 'self'`,
    `worker-src 'self'`,
    `manifest-src 'self'`,
    `upgrade-insecure-requests`
  ];
  const csp = directives.join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Everything except static assets, which carry no script and get their
    // headers from next.config.mjs.
    {
      source: "/((?!_next/static|_next/image|favicon.ico|icon.png|icon.svg|apple-icon.png|manifest.webmanifest|sw.js|.*\\.(?:png|jpg|jpeg|webp|svg|ico)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" }
      ]
    }
  ]
};
