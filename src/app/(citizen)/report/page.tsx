import type { Metadata } from "next";
import { enforceCspNonce } from "@/lib/csp";
import { ReportWizard } from "@/components/report/ReportWizard";

// Rendered per request so the nonce-based Content-Security-Policy applied by
// src/middleware.ts reaches this page's scripts. See src/lib/csp.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Report an issue" };

export default async function ReportPage() {
  enforceCspNonce();
  return <ReportWizard />;
}
