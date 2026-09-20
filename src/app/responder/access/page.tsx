import type { Metadata } from "next";
import { enforceCspNonce } from "@/lib/csp";
import { ResponderAccessClient } from "./ResponderAccessClient";

export const metadata: Metadata = { title: "Responder access", robots: { index: false } };

// Rendered per request so the nonce-based CSP from src/middleware.ts reaches
// this page's scripts. See src/lib/csp.ts.
export const dynamic = "force-dynamic";

export default function ResponderAccessPage() {
  enforceCspNonce();
  return <ResponderAccessClient />;
}
