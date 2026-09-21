import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { civicQuerySchema } from "@/lib/validation/schemas";
import { toCivicInfoView } from "@/lib/dto/civic";
import { clientIp, enforceRateLimit, fail, ok, serverError } from "@/lib/api/respond";
import { RATE_LIMITS } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_LIMIT = 24;

/**
 * Civic information search.
 *
 * Filtering and pagination happen in PostgreSQL. The previous version loaded
 * the entire corpus into memory on every keystroke and filtered in JavaScript,
 * which does not survive a real dataset.
 */
export async function GET(req: NextRequest) {
  const limited = await enforceRateLimit({
    rule: RATE_LIMITS.civicSearch,
    identity: clientIp(req),
    message: "Too many searches from this connection. Please wait a moment."
  });
  if (limited) return limited;

  const parsed = civicQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return fail("That search couldn't be read. Please adjust your filters and try again.");
  }
  const { q, category, level, cursor } = parsed.data;
  const limit = parsed.data.limit ?? DEFAULT_LIMIT;

  try {
    const rows = await prisma.civicInfoItem.findMany({
      where: {
        ...(category && category !== "all" ? { category } : {}),
        ...(level ? { level } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { explanation: { contains: q, mode: "insensitive" } },
                { officialSource: { contains: q, mode: "insensitive" } },
                { tags: { has: q.toLowerCase() } }
              ]
            }
          : {})
      },
      orderBy: [{ lastVerifiedAt: "desc" }, { id: "asc" }],
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
    });

    const hasMore = rows.length > limit;
    const items = (hasMore ? rows.slice(0, limit) : rows).map((item) => toCivicInfoView(item));

    return ok({
      items,
      nextCursor: hasMore ? items[items.length - 1]?.id : null
    });
  } catch (error) {
    return serverError("civic.search_failed", error, "Civic information couldn't be loaded. Please try again.");
  }
}
