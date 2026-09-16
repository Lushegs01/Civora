import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function ok<T>(data: T, init?: number) {
  return NextResponse.json(data as object, { status: init ?? 200 });
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

const MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "application/pdf": ".pdf",
  "text/plain": ".txt"
};

export function extFor(mimeType: string, fileName?: string): string {
  if (MIME_EXT[mimeType]) return MIME_EXT[mimeType];
  const m = fileName?.match(/(\.[a-z0-9]{1,8})$/i);
  if (m) return m[1].toLowerCase();
  return ".bin";
}

export function kindFor(mimeType: string): "photo" | "video" | "document" | "note" {
  if (mimeType.startsWith("image/")) return "photo";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}
