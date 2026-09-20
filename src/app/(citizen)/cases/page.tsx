import type { Metadata } from "next";
import { enforceCspNonce } from "@/lib/csp";
import { MyCasesClient } from "./MyCasesClient";

export const metadata: Metadata = { title: "My cases", robots: { index: false } };

// Rendered per request so the nonce-based CSP from src/middleware.ts reaches
// this page's scripts. See src/lib/csp.ts.
export const dynamic = "force-dynamic";

export default function MyCasesPage() {
  enforceCspNonce();
  return <MyCasesClient />;
}
