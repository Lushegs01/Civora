"use client";

import { getToken, saveToken } from "./db";

// Demo device tracking.
//
// A fresh browser has no tracking tokens, so "your cases" would be empty and
// the demo would show nothing. These two tokens match reports in the seeded
// fictional dataset; they are planted only when the server says the deployment
// is running in demo mode, so a production build never plants credentials.

const SEED_FLAG = "civora_demo_tracking_seeded_v2";

export const DEMO_TRACKING: Array<{ caseId: string; token: string }> = [
  { caseId: "CS-1042", token: "demo-device-token-cs1042-0000000000aaaa" },
  { caseId: "CS-1040", token: "demo-device-token-cs1040-0000000000bbbb" }
];

export async function seedDemoTracking(): Promise<void> {
  try {
    if (localStorage.getItem(SEED_FLAG)) return;
  } catch {
    // Storage blocked; seeding would repeat on every load, so skip it.
    return;
  }

  // Write the tokens first, then record that we did — the previous version set
  // the flag before awaiting the writes, so a failure meant the demo device
  // silently ended up with no cases and never retried.
  try {
    for (const { caseId, token } of DEMO_TRACKING) {
      if (!(await getToken(caseId))) await saveToken(caseId, token);
    }
    localStorage.setItem(SEED_FLAG, "1");
  } catch {
    // Leave the flag unset so the next visit tries again.
  }
}

export function clearDemoTrackingFlag(): void {
  try {
    localStorage.removeItem(SEED_FLAG);
  } catch {
    // Nothing to clear.
  }
}
