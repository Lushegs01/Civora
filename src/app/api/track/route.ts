import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashToken } from "@/lib/auth/tokens";
import { trackPairsSchema } from "@/lib/validation/schemas";
import { toCaseRow } from "@/lib/dto/case";
import { caseRowSelect, normalizeCaseId } from "@/lib/db/repository";
import {
  clientIp,
  enforceRateLimit,
  NO_STORE_HEADERS,
  readJson,
  requireSameOrigin,
  serverError
} from "@/lib/api/respond";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Resolves the cases a device is tracking.
 *
 * `reporter` is derived from the token hash alone — the client's claim to be
 * the reporter is never read. A case the caller holds no token for is only
 * returned when it is already public, so this endpoint cannot be used to
 * enumerate private cases by walking CS-1000…CS-9999.
 */
export async function POST(req: NextRequest) {
  const originCheck = requireSameOrigin(req);
  if (originCheck) return originCheck;

  const limited = await enforceRateLimit({
    rule: RATE_LIMITS.track,
    identity: clientIp(req),
    message: "Too many lookups from this connection. Please wait a moment and try again."
  });
  if (limited) return limited;

  const body = await readJson(req, trackPairsSchema, {
    invalidMessage: "Couldn't read your tracked cases. Please refresh."
  });
  if (!body.ok) return body.response;

  try {
    const pairs = body.data.pairs;

    // One query for the tokens, one for the case rows — never N queries.
    const tokenHashes = pairs
      .map((p) => p.token)
      .filter((t): t is string => Boolean(t))
      .map(hashToken);

    const reports = tokenHashes.length
      ? await prisma.report.findMany({
          where: { trackingTokenHash: { in: tokenHashes } },
          select: { trackingTokenHash: true, case: { select: { publicCaseId: true } } }
        })
      : [];
    const reporterCaseIds = new Set(reports.map((r) => r.case.publicCaseId));

    const requestedIds = Array.from(
      new Set(pairs.map((p) => normalizeCaseId(p.caseId)).filter(Boolean))
    );

    const cases = await prisma.case.findMany({
      where: {
        publicCaseId: { in: requestedIds },
        // Either it is on the public board, or the caller proved they filed it.
        OR: [{ publicVisible: true }, { publicCaseId: { in: Array.from(reporterCaseIds) } }]
      },
      select: caseRowSelect
    });

    const rows = cases.map((c) => {
      const reporter = reporterCaseIds.has(c.publicCaseId);
      return {
        ...toCaseRow(c, reporter ? `/cases/${c.publicCaseId}` : `/community/${c.publicCaseId}`),
        reporter
      };
    });

    return NextResponse.json({ rows }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    return serverError("track.lookup_failed", error, "Couldn't load your cases. Please try again.");
  }
}
