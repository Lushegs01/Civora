import type { Metadata } from "next";
import { ResourcesClient } from "./ResourcesClient";

export const metadata: Metadata = { title: "Get help" };

function loadContacts(): Array<{ name: string; detail?: string; phone?: string }> {
  try {
    const raw = process.env.EMERGENCY_CONTACTS;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ResourcesPage() {
  const contacts = loadContacts();

  return <ResourcesClient contacts={contacts} />;
}
