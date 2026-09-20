import { del, get, put } from "@vercel/blob";
import type { PutResult, StorageDriver, StoredObject } from "./types";

/**
 * Vercel Blob driver, always with `access: "private"`.
 *
 * Private blobs have no publicly guessable URL and can only be read with the
 * store token, so the bytes stay behind Civora's own authorization check.
 */
export class VercelBlobStorageDriver implements StorageDriver {
  readonly name = "vercel-blob";
  readonly durable = true;

  constructor() {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("Vercel Blob storage requires BLOB_READ_WRITE_TOKEN.");
    }
  }

  async put(key: string, body: Uint8Array, contentType: string): Promise<PutResult> {
    await put(key, Buffer.from(body), {
      access: "private",
      addRandomSuffix: false,
      contentType,
      // Evidence is fetched through our own route; never let a CDN hold a copy.
      cacheControlMaxAge: 0
    });
    return { key, driver: this.name };
  }

  async get(key: string): Promise<StoredObject | null> {
    const result = await get(key, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const chunks: Uint8Array[] = [];
    for await (const chunk of streamIterator(result.stream)) chunks.push(chunk);
    const total = chunks.reduce((n, c) => n + c.byteLength, 0);
    const body = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return {
      body,
      contentType: result.blob.contentType || "application/octet-stream",
      sizeBytes: total
    };
  }

  async delete(key: string): Promise<void> {
    try {
      await del(key);
    } catch {
      // A missing object is already in the desired state.
    }
  }
}

async function* streamIterator(stream: ReadableStream<Uint8Array>): AsyncGenerator<Uint8Array> {
  const reader = stream.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      if (value) yield value;
    }
  } finally {
    reader.releaseLock();
  }
}
