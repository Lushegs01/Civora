"use client";

// Client-side evidence preparation: compresses images before upload (low
// bandwidth matters — Rule 9) and validates type/size before anything moves.

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "text/plain"
];

export interface PreparedFile {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataBase64: string;
}

export function fileError(f: File): string | null {
  if (f.size > MAX_BYTES) return `"${f.name}" is larger than 8 MB. Please attach a smaller file.`;
  const mime = f.type || "application/octet-stream";
  const extOk = /\.(jpe?g|png|webp|heic|mp4|webm|pdf|txt)$/i.test(f.name);
  if (!ALLOWED.includes(mime) && !extOk)
    return `"${f.name}" is not a supported file type. Photos, video, PDF or text files work best.`;
  return null;
}

export async function prepareFile(f: File): Promise<PreparedFile> {
  if (f.type.startsWith("image/") && f.type !== "image/heic") {
    try {
      const compressed = await compressImage(f, 1280, 0.82);
      if (compressed.size < f.size) {
        return {
          fileName: f.name.replace(/\.[a-z0-9]+$/i, ".jpg"),
          mimeType: "image/jpeg",
          sizeBytes: compressed.size,
          dataBase64: await toBase64(compressed)
        };
      }
    } catch {
      // fall through to original file
    }
  }
  const buf = await f.arrayBuffer();
  return {
    fileName: f.name,
    mimeType: f.type || "application/octet-stream",
    sizeBytes: buf.byteLength,
    dataBase64: arrayBufferToBase64(buf)
  };
}

async function compressImage(file: File, maxDim: number, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      quality
    )
  );
}

function toBase64(blob: Blob): Promise<string> {
  return blob.arrayBuffer().then(arrayBufferToBase64);
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
