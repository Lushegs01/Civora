"use client";

import { useEffect } from "react";
import { seedDemoTracking } from "@/lib/offline/demo-tracking";

/**
 * One-time demo device setup.
 *
 * `demoMode` is decided on the server. In a production deployment it is false
 * and no tracking tokens are ever planted on a visitor's device.
 */
export function CitizenInit({ demoMode }: { demoMode: boolean }) {
  useEffect(() => {
    if (!demoMode) return;
    void seedDemoTracking();
  }, [demoMode]);
  return null;
}
