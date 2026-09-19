import { notFound } from "next/navigation";
import { readDb, findCivicInfo } from "@/lib/db/store";
import { ExploreIdClient } from "./ExploreIdClient";

export default async function CivicInfoDetailPage({ params }: { params: { id: string } }) {
  const db = await readDb();
  const item = findCivicInfo(db, params.id);

  if (!item) {
    notFound();
  }

  return <ExploreIdClient item={item} />;
}
