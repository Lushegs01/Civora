import type { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { readDb, uploadDir } from "@/lib/db/store";
import { fail } from "@/lib/api-helpers";
import { isResponder, isAuthorizedReporter } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// Evidence access is protected: public-safe evidence is served openly;
// restricted evidence requires a responder session or a valid tracking token.

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const db = await readDb();
  const e = db.evidence.find((x) => x.id === params.id);
  if (!e || !e.storageKey) return fail("Evidence file not found.", 404);

  if (!e.publicVisible) {
    const c = db.cases.find((x) => x.id === e.caseId);
    const token = req.nextUrl.searchParams.get("token") || "";
    const allowed = isResponder(cookies()) || (c ? isAuthorizedReporter(c, token) : false);
    if (!allowed) return fail("This evidence is restricted to authorized viewers.", 403);
  }

  const filePath = path.join(uploadDir(), e.storageKey);
  if (!fs.existsSync(filePath)) return fail("The original file is no longer available.", 404);

  const buf = fs.readFileSync(filePath);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": e.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${(e.fileName || "evidence").replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=60"
    }
  });
}
