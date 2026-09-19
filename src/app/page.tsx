import { readDb, findCase } from "@/lib/db/store";
import { buildCaseView, publicCaseRow } from "@/lib/case-view";
import { LandingContent } from "@/components/landing/LandingContent";
import { Icon } from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

const LOOP = [
  { label: "Report", detail: "Safely, with or without your name." },
  { label: "Protect", detail: "Privacy-first by design." },
  { label: "Verify", detail: "Evidence and corroboration, carefully." },
  { label: "Coordinate", detail: "Routed to a responsible organization." },
  { label: "Respond", detail: "Acknowledged, acted on, recorded." },
  { label: "Account", detail: "Status and timeline, in the open." },
  { label: "Inform", detail: "Everyone knows what happens next." }
];




export default async function LandingPage() {
  const db = await readDb();
  const demo = findCase(db, "CS-1042");
  const demoView = demo ? buildCaseView(db, demo, "public") : null;
  const row = demo ? publicCaseRow(db, demo) : null;

  return <LandingContent demo={demo} demoView={demoView} row={row} />;
}
