import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findCaseByPublicId, findCivicItemsCitingCase } from "@/lib/db/repository";
import { computeFreshness } from "@/lib/civic-types";
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
  // Only reached once the case is known to be public, so nothing here can
  // disclose a case a reader was not already looking at.
  const citing = await findCivicItemsCitingCase(record.publicCaseId);
  return (
    <PublicCaseClient
      view={toPublicCaseView(record)}
      citedBy={citing.map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        freshnessState: computeFreshness(c.lastVerifiedAt.toISOString(), c.freshnessThresholdDays)
      }))}
    />
  );
}
