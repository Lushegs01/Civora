import { readDb } from "@/lib/db/store";
import { isResolved } from "@/lib/types";
import { HomeContent } from "@/components/home/HomeContent";

export const dynamic = "force-dynamic";

const HOW = [
  { icon: "file-text", label: "Report", body: "Describe what you saw — with or without your name." },
  { icon: "badge-check", label: "Verify", body: "Evidence and corroboration build the picture." },
  { icon: "building", label: "Respond", body: "A responsible organization acts and updates." },
  { icon: "eye", label: "Track", body: "Anyone can follow status and outcome." }
];

export default async function HomePage() {
  const db = await readDb();
  const openCases = db.cases.filter((c) => !isResolved(c));
  const awaitingResponse = db.cases.filter((c) =>
    ["not_assigned", "received"].includes(c.response)
  ).length;
  const resolved = db.cases.filter((c) => isResolved(c)).length;

  const snapshot = [
    { label: "Active cases", value: openCases.length, icon: "folder", tone: "bg-brand-soft text-brand-deep" },
    { label: "Awaiting response", value: awaitingResponse, icon: "inbox", tone: "bg-warning-soft text-warning" },
    { label: "Resolved", value: resolved, icon: "check-circle-2", tone: "bg-success-soft text-success" }
  ];

  return <HomeContent openCases={openCases.length} awaitingResponse={awaitingResponse} resolved={resolved} />;
}
