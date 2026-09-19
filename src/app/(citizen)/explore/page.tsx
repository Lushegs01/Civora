import { readDb } from "@/lib/db/store";
import { ExploreClient } from "./ExploreClient";

export default async function ExplorePage() {
  const db = await readDb();
  const initialItems = db.civicInfo || [];

  return <ExploreClient initialItems={initialItems} />;
}
