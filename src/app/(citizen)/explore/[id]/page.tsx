import { notFound } from "next/navigation";
import Link from "next/link";
import { TrustCard } from "@/components/civic/TrustCard";
import { VerificationExplainer } from "@/components/civic/VerificationExplainer";
import { readDb, findCivicInfo } from "@/lib/db/store";
import { TopBar } from "@/components/shell/TopBar";
import { Icon } from "@/components/ui/Icon";

export default async function CivicInfoDetailPage({ params }: { params: { id: string } }) {
  const db = await readDb();
  const item = findCivicInfo(db, params.id);

  if (!item) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-8">
      <TopBar />
      
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-8 md:py-12">
        <Link 
          href="/explore"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          Back to Explorer
        </Link>
        <TrustCard item={item} />
        
        <VerificationExplainer />
      </div>
    </div>
  );
}
