import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requestActor } from "@/lib/auth/actor";
import { canViewCase } from "@/lib/authz";
import { hashToken } from "@/lib/auth/tokens";
import { findReportByTokenHash } from "@/lib/db/repository";
import { storageDriver } from "@/lib/storage";
import { safeServingContentType, sanitizeFileName } from "@/lib/files/validate";
import { fail } from "@/lib/api/respond";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * The only way evidence bytes leave Civora.
 *
 * Storage is private in every driver, so there is no URL a browser could use
 * to bypass this check. Access is granted when the evidence is marked public,
 * when an authorized handler asks, or when the caller proves they reported the
 * case with their tracking token.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!id || id.length > 64) return notFound();

  const evidence = await prisma.evidence.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      storageKey: true,
      mimeType: true,
      fileName: true,
      publicVisible: true,
      case: { select: { id: true, assignedOrgId: true } }
    }
  });
  if (!evidence || !evidence.storageKey) return notFound();

  if (!evidence.publicVisible) {
    const allowed = await isAuthorized(req, evidence.case.id, evidence.case.assignedOrgId);
    if (!allowed) {
      log.warn("evidence.access_denied", { evidenceId: id });
      return fail("This evidence is restricted to authorized viewers.", { status: 403, code: "forbidden" });
    }
  }

  const driver = storageDriver();
  if (!driver) {
    log.error("evidence.storage_unavailable_on_read");
    return fail("Evidence files are temporarily unavailable.", { status: 503 });
  }

  let object;
  try {
    object = await driver.get(evidence.storageKey);
  } catch (error) {
    log.error("evidence.read_failed", { evidenceId: id, error });
    return fail("Evidence files are temporarily unavailable.", { status: 503 });
  }
  if (!object) return fail("The original file is no longer available.", { status: 404 });

  // The stored content type is re-derived, never echoed from the upload: an
  // attacker-chosen type served inline would be stored XSS on our origin.
  const serving = safeServingContentType(evidence.mimeType || object.contentType);
  // Re-sanitized on the way out as well as on the way in, so a row written by
  // any other path still cannot shape a response header.
  const safeName = sanitizeFileName(evidence.fileName ?? undefined, "");

  return new Response(object.body as unknown as BodyInit, {
    headers: {
      "Content-Type": serving.contentType,
      "Content-Length": String(object.sizeBytes),
      "Content-Disposition": `${serving.disposition}; filename="${safeName}"`,
      "X-Content-Type-Options": "nosniff",
      // Never let a shared cache hold restricted evidence.
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "X-Robots-Tag": "noindex"
    }
  });
}

async function isAuthorized(req: NextRequest, caseId: string, assignedOrgId: string | null): Promise<boolean> {
  const actor = await requestActor();
  if (canViewCase(actor, { assignedOrgId })) return true;

  // Reporter access: the token is read from a request header only. Accepting
  // it from the query string would leak it through the referrer, the browser's
  // history and every access log between here and the client.
  const token = req.headers.get("x-civora-tracking-token") || "";
  if (!token || token.length < 20 || token.length > 200) return false;

  const report = await findReportByTokenHash(hashToken(token));
  return Boolean(report && report.caseId === caseId);
}

function notFound() {
  return fail("Evidence file not found.", { status: 404 });
}
