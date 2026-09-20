import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { toCivicInfoView } from "@/lib/dto/civic";
import { clientIp, enforceRateLimit, fail, ok, serverError } from "@/lib/api/respond";
import { RATE_LIMITS } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const limited = await enforceRateLimit({
    rule: RATE_LIMITS.civicSearch,
    identity: clientIp(req),
    message: "Too many requests from this connection. Please wait a moment."
  });
  if (limited) return limited;

  const id = params.id?.toUpperCase();
  if (!id || !/^[A-Z0-9-]{3,40}$/.test(id)) {
    return fail("Civic information not found", { status: 404 });
  }

  try {
    const item = await prisma.civicInfoItem.findUnique({ where: { id } });
    if (!item) return fail("Civic information not found", { status: 404 });
    return ok({ item: toCivicInfoView(item) });
  } catch (error) {
    return serverError("civic.detail_failed", error, "That civic information couldn't be loaded.");
  }
}
