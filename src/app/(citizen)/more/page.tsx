import type { Metadata } from "next";
import { demoToolsEnabled } from "@/lib/config";
import { MoreClient } from "./MoreClient";

export const metadata: Metadata = { title: "More" };
export const dynamic = "force-dynamic";

/**
 * Demo tooling is decided on the server. A production deployment renders no
 * reset control at all, and the endpoint behind it returns 404 there anyway.
 */
export default function MorePage() {
  return <MoreClient demoTools={demoToolsEnabled} />;
}
