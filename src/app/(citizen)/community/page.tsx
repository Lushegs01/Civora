import type { Metadata } from "next";
import { listPublicCases } from "@/lib/db/repository";
import { toCaseRow } from "@/lib/dto/case";
import { CommunityClient } from "./CommunityClient";

export const metadata: Metadata = { title: "Community cases" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

/**
 * The public transparency surface.
 *
 * Only cases a handler has published appear here, and only through the public
 * row DTO — reporter identity, precise coordinates and raw report text have no
 * path to this page.
 */
export default async function CommunityPage() {
  const rows = await listPublicCases({ take: PAGE_SIZE });
  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  return (
    <CommunityClient
      rows={page.map((c) => toCaseRow(c, `/community/${c.publicCaseId}`))}
      hasMore={hasMore}
    />
  );
}
