import { findCaseByPublicId } from "@/lib/db/repository";
import { toPublicCaseView } from "@/lib/dto/case";
import { LandingContent } from "@/components/landing/LandingContent";

export const dynamic = "force-dynamic";

/**
 * Landing page.
 *
 * The preview it shows is built from the same public DTO the community board
 * uses, so the marketing surface cannot display anything a visitor could not
 * already see on the case page itself.
 */
export default async function LandingPage() {
  const record = await findCaseByPublicId("CS-1042");
  const demo = record && record.publicVisible ? toPublicCaseView(record) : null;
  return <LandingContent demo={demo} />;
}
