import { NextResponse } from "next/server";
import { readDb } from "@/lib/db/store";
import { ok, fail } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const query = searchParams.get("q")?.toLowerCase();

    const db = await readDb();
    let results = db.civicInfo || [];

    if (category && category !== "all") {
      results = results.filter((item) => item.category === category);
    }

    if (query) {
      results = results.filter((item) => 
        item.title.toLowerCase().includes(query) || 
        item.explanation.toLowerCase().includes(query) ||
        item.officialSource.toLowerCase().includes(query)
      );
    }

    return ok(results);
  } catch (error) {
    console.error("Error fetching civic info:", error);
    return fail("Failed to fetch civic information", 500);
  }
}
