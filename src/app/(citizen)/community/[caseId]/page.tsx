import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findCaseByPublicId } from "@/lib/db/repository";
import { toPublicCaseView } from "@/lib/dto/case";
import { PublicCaseClient } from "./PublicCaseClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { caseId: string } }): Promise<Metadata> {
  const record = await findCaseByPublicId(params.caseId);
  return {
    title: record && record.publicVisible ? `Case ${record.publicCaseId} — public view` : "Case not found",
    robots: { index: false }
  };
}

/**
 * Public case page: what is known, what remains uncertain, what has happened,
 * and what happens next. Built from the public DTO, so there is no field to
 * strip — the private ones were never selected.
 */
export default async function PublicCasePage({ params }: { params: { caseId: string } }) {
  const record = await findCaseByPublicId(params.caseId);
  if (!record || !record.publicVisible) notFound();
  return <PublicCaseClient view={toPublicCaseView(record)} />;
}
