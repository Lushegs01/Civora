import { NextResponse } from "next/server";
import { translateCivicInfo } from "@/lib/ai/translate";

export async function POST(request: Request) {
  try {
    const { text, locale } = await request.json();
    
    if (!text || !locale) {
      return NextResponse.json({ error: "Text and locale are required" }, { status: 400 });
    }

    const translation = await translateCivicInfo(text, locale);

    return NextResponse.json({ data: { translation } });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json({ error: "Failed to generate translation" }, { status: 500 });
  }
}
