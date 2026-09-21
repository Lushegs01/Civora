import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { toCivicInfoView } from "@/lib/dto/civic";
import { findPublicCasesByIds } from "@/lib/db/repository";
import { ExploreIdClient } from "./ExploreIdClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const item = await prisma.civicInfoItem.findUnique({
    where: { id: params.id.toUpperCase() },
    select: { title: true }
  });
  return { title: item ? item.title : "Civic information not found" };
}

export default async function CivicInfoDetailPage({ params }: { params: { id: string } }) {
  if (!/^[A-Za-z0-9-]{3,40}$/.test(params.id)) notFound();
  const item = await prisma.civicInfoItem.findUnique({ where: { id: params.id.toUpperCase() } });
  if (!item) notFound();
  // Resolved here rather than in the DTO: the mapper stays synchronous and
  // pure, and the visibility check happens once, on the server, in view of the
  // database.
  const related = await findPublicCasesByIds(item.relatedCaseIds);
  return (
    <ExploreIdClient
      item={toCivicInfoView(
        item,
        related.map((c) => ({ ...c, updatedAt: c.updatedAt.toISOString() }))
      )}
    />
  );
}
