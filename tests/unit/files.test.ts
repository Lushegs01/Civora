import { describe, expect, it } from "vitest";
import { detectFileType, safeServingContentType, sanitizeFileName, validateUpload } from "@/lib/files/validate";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
const HTML = new TextEncoder().encode("<html><script>alert(1)</script></html>");
const ELF = new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00, 0, 0, 0, 0]);

describe("magic-byte detection", () => {
  it("identifies real files from their bytes", () => {
    expect(detectFileType(JPEG)?.mimeType).toBe("image/jpeg");
    expect(detectFileType(PNG)?.mimeType).toBe("image/png");
    expect(detectFileType(PDF)?.mimeType).toBe("application/pdf");
  });

  it("classifies plain text, and refuses binary it does not recognize", () => {
    expect(detectFileType(new TextEncoder().encode("just some notes"))?.mimeType).toBe("text/plain");
    expect(detectFileType(ELF)).toBeNull();
  });
});

describe("upload validation", () => {
  it("accepts a real image announced correctly", () => {
    const result = validateUpload(JPEG, "image/jpeg");
    expect(result.ok).toBe(true);
  });

  it("rejects a payload whose bytes contradict the declared type", () => {
    // The attack: send HTML, announce it as an image, have it served inline.
    const result = validateUpload(HTML, "image/jpeg");
    expect(result.ok).toBe(false);
  });

  it("rejects an unrecognized binary regardless of what the client claims", () => {
    expect(validateUpload(ELF, "image/png").ok).toBe(false);
    expect(validateUpload(ELF, undefined).ok).toBe(false);
  });

  it("rejects empty and oversized files", () => {
    expect(validateUpload(new Uint8Array(0), "image/jpeg").ok).toBe(false);
    expect(validateUpload(JPEG, "image/jpeg", 4).ok).toBe(false);
  });

  it("accepts an image whose exact format the client got wrong", () => {
    // Browsers mislabel image types often enough that this should not fail.
    const result = validateUpload(PNG, "image/jpeg");
    expect(result.ok).toBe(true);
    expect(result.ok && result.file.mimeType).toBe("image/png");
  });
});

describe("serving content types", () => {
  it("serves images and video inline", () => {
    expect(safeServingContentType("image/jpeg")).toEqual({ contentType: "image/jpeg", disposition: "inline" });
    expect(safeServingContentType("video/mp4").disposition).toBe("inline");
  });

  it("never serves anything scriptable inline on our origin", () => {
    for (const type of ["text/html", "image/svg+xml", "application/xhtml+xml", "application/javascript"]) {
      const serving = safeServingContentType(type);
      expect(serving.contentType).toBe("application/octet-stream");
      expect(serving.disposition).toBe("attachment");
    }
  });

  it("hands PDFs over as downloads rather than rendering them in our origin", () => {
    expect(safeServingContentType("application/pdf").disposition).toBe("attachment");
  });
});

describe("filename sanitization", () => {
  it("strips directory traversal and control characters", () => {
    expect(sanitizeFileName("../../etc/passwd", ".txt")).toBe("passwd");
    expect(sanitizeFileName("..\\..\\windows\\system32", ".bin")).toBe("system32");
    expect(sanitizeFileName('evil"; rm -rf /.jpg', ".jpg")).not.toContain('"');
  });

  it("falls back when nothing usable is left", () => {
    expect(sanitizeFileName("", ".jpg")).toBe("evidence.jpg");
    expect(sanitizeFileName("...", ".png")).toBe("evidence.png");
  });
});
