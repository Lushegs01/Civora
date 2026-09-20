import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { normalizeCaseId } from "@/lib/db/repository";
import { TrackedCaseClient } from "./TrackedCaseClient";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { caseId: string } }): Metadata {
  const id = normalizeCaseId(params.caseId);
  return { title: id ? `Case ${id}` : "Case not found", robots: { index: false } };
}

/**
 * The reporter's own view of a case.
 *
 * Rendered on the client because the tracking token lives on the device and
 * nowhere else: the server is handed the token by the browser, verifies it
 * against the stored hash, and returns the reporter DTO. Nothing about who
 * reported what is inferable from the URL alone.
 */
export default function TrackedCasePage({ params }: { params: { caseId: string } }) {
  const caseId = normalizeCaseId(params.caseId);
  if (!caseId) notFound();
  return <TrackedCaseClient caseId={caseId} />;
}
