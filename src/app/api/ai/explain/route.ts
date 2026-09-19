import { NextResponse } from "next/server";
import { explainCivicInfo } from "@/lib/ai/analyze";

export async function POST(request: Request) {
  try {
    const { text, locale } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Call the mock/real AI provider (same pattern as analyze.ts)
    const explanation = await explainCivicInfo(text, locale || "en");

    return NextResponse.json({ data: { explanation } });
  } catch (error) {
    console.error("Explanation error:", error);
    return NextResponse.json({ error: "Failed to generate explanation" }, { status: 500 });
  }
}
