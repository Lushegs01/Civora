import { CivicExplorer } from "@/components/civic/CivicExplorer";
import { readDb } from "@/lib/db/store";
import { TopBar } from "@/components/shell/TopBar";

export default async function ExplorePage() {
  const db = await readDb();
  const initialItems = db.civicInfo || [];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-8">
      <TopBar />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Civic Explorer</h1>
          <p className="text-slate-600 text-lg">
            Find trusted information about services, rights, policies, and community issues.
          </p>
        </div>

        <CivicExplorer initialItems={initialItems} />
      </main>
    </div>
  );
}
