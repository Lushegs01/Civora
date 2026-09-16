import type { Metadata } from "next";
import { ReportWizard } from "@/components/report/ReportWizard";

export const metadata: Metadata = { title: "Report an issue" };

export default function ReportPage() {
  return <ReportWizard />;
}
