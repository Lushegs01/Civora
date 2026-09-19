import { NextResponse } from "next/server";
import { readDb, findCivicInfo } from "@/lib/db/store";
import { ok, fail } from "@/lib/api-helpers";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = await readDb();
    const item = findCivicInfo(db, params.id);

    if (!item) {
      return fail("Civic information not found", 404);
    }

    return ok(item);
  } catch (error) {
    console.error("Error fetching civic info detail:", error);
    return fail("Failed to fetch civic information detail", 500);
  }
}
