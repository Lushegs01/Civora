import type { Metadata } from "next";
import { enforceCspNonce } from "@/lib/csp";
import { PrivacyClient } from "./PrivacyClient";

// Rendered per request so the nonce-based Content-Security-Policy applied by
// src/middleware.ts reaches this page's scripts. See src/lib/csp.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  enforceCspNonce();
  return <PrivacyClient />;
}
