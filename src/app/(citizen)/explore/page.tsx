import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { toCivicInfoView } from "@/lib/dto/civic";
import { ExploreClient } from "./ExploreClient";

export const metadata: Metadata = { title: "Civic explorer" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

export default async function ExplorePage() {
  const items = await prisma.civicInfoItem.findMany({
    orderBy: [{ lastVerifiedAt: "desc" }, { id: "asc" }],
    take: PAGE_SIZE
  });
  return <ExploreClient initialItems={items.map((item) => toCivicInfoView(item))} />;
}
