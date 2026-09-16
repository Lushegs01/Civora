"use client";

import { useEffect } from "react";
import { maybeSeedDemoTracking } from "@/lib/offline/db";

// One-time demo device setup: adopts the primary fictional cases as
// "your cases" so the dashboard demonstrates tracking out of the box.
export function CitizenInit() {
  useEffect(() => {
    maybeSeedDemoTracking();
  }, []);
  return null;
}
