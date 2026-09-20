import { publicSnapshot } from "@/lib/db/repository";
import { HomeContent } from "@/components/home/HomeContent";

export const dynamic = "force-dynamic";

/** Counts only — the dashboard never loads the case table to show three numbers. */
export default async function HomePage() {
  const snapshot = await publicSnapshot();
  return (
    <HomeContent
      openCases={snapshot.open}
      awaitingResponse={snapshot.awaitingResponse}
      resolved={snapshot.resolved}
    />
  );
}
