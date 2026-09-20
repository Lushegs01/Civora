import type { Metadata } from "next";
import { emergencyContacts } from "@/lib/config";
import { ResourcesClient } from "./ResourcesClient";

export const metadata: Metadata = { title: "Get help" };
export const dynamic = "force-dynamic";

/**
 * Emergency contacts come from configuration and default to none.
 *
 * Civora ships no phone numbers: a fictional number shown to someone in danger
 * is worse than showing none, so an unconfigured deployment says so plainly.
 */
export default function ResourcesPage() {
  return <ResourcesClient contacts={emergencyContacts()} />;
}
