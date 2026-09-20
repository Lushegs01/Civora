"use client";

// Client-side evidence preparation.
//
// Images are still compressed before they leave the device — bandwidth is a
// real constraint for the people this is built for. What changed is the wire
// format: files are sent as binary through FormData rather than as base64
// inside the report JSON, which removes the 33% encoding overhead and lets a
// six-photo report be six resumable requests instead of one 60 MB body.
//
// The checks here are a courtesy to the user, not a security boundary: the
// server re-derives the type from the bytes and can reject anything.

export const MAX_BYTES = 8 * 1024 * 1024;

const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|gif|webp|heic|mp4|webm|pdf|txt)$/i;
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "text/plain"
];

export interface PreparedFile {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  blob: Blob;
  previewUrl?: string;
}

export function fileError(file: File): string | null {
  if (file.size > MAX_BYTES) {
    return `"${file.name}" is larger than 8 MB. Please attach a smaller file.`;
  }
  const mime = file.type || "";
  if (!ACCEPTED_TYPES.includes(mime) && !ACCEPTED_EXTENSIONS.test(file.name)) {
    return `"${file.name}" is not a supported file type. Photos, video, PDF or text files work best.`;
  }
  return null;
}

/** Compresses images where possible; everything else is passed through as-is. */
export async function prepareFile(file: File): Promise<PreparedFile> {
  const id = newId();
  if (file.type.startsWith("image/") && file.type !== "image/heic") {
    try {
      const compressed = await compressImage(file, 1600, 0.82);
      if (compressed.size < file.size) {
        return {
          id,
          fileName: file.name.replace(/\.[a-z0-9]+$/i, ".jpg"),
          mimeType: "image/jpeg",
          sizeBytes: compressed.size,
          blob: compressed,
          previewUrl: URL.createObjectURL(compressed)
        };
      }
    } catch {
      // Canvas unavailable or the image failed to decode — send the original.
    }
  }
  return {
    id,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    blob: file,
    previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined
  };
}

export interface UploadResult {
  ok: boolean;
  error?: string;
}

/** Uploads one prepared file to a case the caller holds the tracking token for. */
export async function uploadEvidence(
  caseId: string,
  token: string,
  file: PreparedFile
): Promise<UploadResult> {
  const form = new FormData();
  form.append("caseId", caseId);
  form.append("token", token);
  form.append("file", file.blob, file.fileName);
  try {
    const res = await fetch("/api/evidence", { method: "POST", body: form });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data?.error || "That file couldn't be attached." };
  } catch {
    return { ok: false, error: "That file couldn't be attached — you may be offline." };
  }
}

async function compressImage(file: File, maxDimension: number, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas unavailable");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      quality
    )
  );
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
