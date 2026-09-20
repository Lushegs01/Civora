// Server-authoritative file validation.
//
// The browser's File.type and File.name are attacker-controlled. Every upload
// is re-derived here from the bytes themselves: the declared type only counts
// when the magic bytes agree with it.

import { uploads } from "../config";

export interface DetectedFile {
  mimeType: string;
  extension: string;
  kind: "photo" | "video" | "document";
}

export type ValidationResult =
  | { ok: true; file: DetectedFile }
  | { ok: false; reason: string };

interface Signature {
  mimeType: string;
  extension: string;
  kind: DetectedFile["kind"];
  /** Byte pattern; null entries are wildcards. */
  magic: Array<number | null>;
  offset?: number;
}

const SIGNATURES: Signature[] = [
  { mimeType: "image/jpeg", extension: ".jpg", kind: "photo", magic: [0xff, 0xd8, 0xff] },
  { mimeType: "image/png", extension: ".png", kind: "photo", magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mimeType: "image/gif", extension: ".gif", kind: "photo", magic: [0x47, 0x49, 0x46, 0x38] },
  { mimeType: "application/pdf", extension: ".pdf", kind: "document", magic: [0x25, 0x50, 0x44, 0x46, 0x2d] }
];

const RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP = [0x57, 0x45, 0x42, 0x50];

/** Content types Civora is willing to store and serve back. */
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "text/plain"
] as const;

function matches(bytes: Uint8Array, magic: Array<number | null>, offset = 0): boolean {
  if (bytes.length < offset + magic.length) return false;
  for (let i = 0; i < magic.length; i += 1) {
    const expected = magic[i];
    if (expected !== null && bytes[offset + i] !== expected) return false;
  }
  return true;
}

function isUtf8Text(bytes: Uint8Array): boolean {
  // Reject anything with NUL bytes, then confirm the rest really is UTF-8.
  const sample = bytes.subarray(0, Math.min(bytes.length, 4096));
  for (const byte of sample) {
    if (byte === 0) return false;
  }
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(sample);
    return true;
  } catch {
    return false;
  }
}

/** Identifies a file from its bytes. Returns null when nothing matches. */
export function detectFileType(bytes: Uint8Array): DetectedFile | null {
  for (const sig of SIGNATURES) {
    if (matches(bytes, sig.magic, sig.offset ?? 0)) {
      return { mimeType: sig.mimeType, extension: sig.extension, kind: sig.kind };
    }
  }

  // RIFF containers: bytes 8..12 distinguish WebP from WAV/AVI.
  if (matches(bytes, RIFF) && matches(bytes, WEBP, 8)) {
    return { mimeType: "image/webp", extension: ".webp", kind: "photo" };
  }

  // ISO base media (MP4 / HEIC / 3GP): "ftyp" at offset 4, brand at 8.
  if (matches(bytes, [0x66, 0x74, 0x79, 0x70], 4)) {
    const brand = new TextDecoder("latin1").decode(bytes.subarray(8, 12)).toLowerCase();
    if (brand.startsWith("heic") || brand.startsWith("heix") || brand.startsWith("hevc") || brand.startsWith("mif1")) {
      return { mimeType: "image/heic", extension: ".heic", kind: "photo" };
    }
    return { mimeType: "video/mp4", extension: ".mp4", kind: "video" };
  }

  // Matroska / WebM.
  if (matches(bytes, [0x1a, 0x45, 0xdf, 0xa3])) {
    return { mimeType: "video/webm", extension: ".webm", kind: "video" };
  }

  if (isUtf8Text(bytes)) {
    return { mimeType: "text/plain", extension: ".txt", kind: "document" };
  }

  return null;
}

/**
 * Validates an uploaded file end to end. `declaredMimeType` is advisory: it is
 * only accepted when the bytes agree, so an HTML payload announced as
 * image/jpeg is rejected rather than stored and later served inline.
 */
export function validateUpload(
  bytes: Uint8Array,
  declaredMimeType: string | undefined,
  maxBytes: number = uploads.maxBytes
): ValidationResult {
  if (bytes.byteLength === 0) return { ok: false, reason: "The file is empty." };
  if (bytes.byteLength > maxBytes) {
    return {
      ok: false,
      reason: `The file is larger than ${Math.round(maxBytes / (1024 * 1024))} MB.`
    };
  }

  const detected = detectFileType(bytes);
  if (!detected) {
    return {
      ok: false,
      reason: "That file type isn't supported. Photos, video, PDF or text files work best."
    };
  }
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(detected.mimeType)) {
    return { ok: false, reason: "That file type isn't supported." };
  }

  const declared = (declaredMimeType || "").split(";")[0].trim().toLowerCase();
  if (declared && declared !== detected.mimeType) {
    const bothImages = declared.startsWith("image/") && detected.mimeType.startsWith("image/");
    if (!bothImages) {
      return {
        ok: false,
        reason: "The file's contents don't match its declared type, so it wasn't accepted."
      };
    }
  }

  return { ok: true, file: detected };
}

/**
 * Content type used when streaming evidence back.
 *
 * Anything a browser might execute in Civora's origin is downgraded to an
 * octet-stream and served as an attachment, so a crafted upload cannot become
 * stored XSS.
 */
export function safeServingContentType(mimeType: string | null | undefined): {
  contentType: string;
  disposition: "inline" | "attachment";
} {
  const value = (mimeType || "").split(";")[0].trim().toLowerCase();
  const inlineSafe = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"];
  if (inlineSafe.includes(value)) return { contentType: value, disposition: "inline" };
  if (value === "application/pdf") {
    // PDFs can carry scripts; hand them to the user as a download instead.
    return { contentType: "application/pdf", disposition: "attachment" };
  }
  if (value === "text/plain") return { contentType: "text/plain; charset=utf-8", disposition: "attachment" };
  return { contentType: "application/octet-stream", disposition: "attachment" };
}

/** Strips directory components and anything unusual from a client filename. */
export function sanitizeFileName(name: string | undefined, fallbackExtension: string): string {
  const base = (name || "").split(/[\\/]/).pop() || "";
  const cleaned = base.replace(/[^a-zA-Z0-9._ -]/g, "").replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned.startsWith(".")) return `evidence${fallbackExtension}`;
  return cleaned.slice(0, 120);
}
