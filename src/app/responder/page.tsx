import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isResponder } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { ResponderDashboardClient } from "./ResponderDashboardClient";

export const metadata: Metadata = { title: "Responder workspace" };
export const dynamic = "force-dynamic";

export default async function ResponderDashboard() {
  if (!isResponder(cookies())) redirect("/responder/access");

  const db = await readDb();

  return <ResponderDashboardClient cases={db.cases} orgCount={db.orgs.length} />;
}