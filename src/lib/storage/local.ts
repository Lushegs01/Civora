import fs from "node:fs/promises";
import path from "node:path";
import type { PutResult, StorageDriver, StoredObject } from "./types";

/**
 * Filesystem driver for local development and tests only.
 *
 * It is explicitly non-authoritative: `durable` is false, and
 * src/lib/storage/index.ts refuses to select it when NODE_ENV=production so a
 * deployment can never end up writing evidence to an ephemeral container disk.
 */
export class LocalStorageDriver implements StorageDriver {
  readonly name = "local";
  readonly durable = false;
  private readonly root: string;

  constructor(dir: string) {
    this.root = path.resolve(process.cwd(), dir);
  }

  /** Rejects any key that would escape the storage root. */
  private resolve(key: string): string {
    if (!/^[A-Za-z0-9/_.-]+$/.test(key) || key.includes("..")) {
      throw new Error("Invalid storage key.");
    }
    const target = path.resolve(this.root, key);
    const rootWithSep = this.root.endsWith(path.sep) ? this.root : this.root + path.sep;
    if (!target.startsWith(rootWithSep)) throw new Error("Invalid storage key.");
    return target;
  }

  async put(key: string, body: Uint8Array, contentType: string): Promise<PutResult> {
    const target = this.resolve(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, body);
    await fs.writeFile(`${target}.meta`, JSON.stringify({ contentType }), "utf-8");
    return { key, driver: this.name };
  }

  async get(key: string): Promise<StoredObject | null> {
    const target = this.resolve(key);
    try {
      const body = await fs.readFile(target);
      let contentType = "application/octet-stream";
      try {
        const meta = JSON.parse(await fs.readFile(`${target}.meta`, "utf-8")) as { contentType?: string };
        if (meta.contentType) contentType = meta.contentType;
      } catch {
        // Metadata sidecar is optional.
      }
      return { body: new Uint8Array(body), contentType, sizeBytes: body.byteLength };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const target = this.resolve(key);
    await fs.rm(target, { force: true });
    await fs.rm(`${target}.meta`, { force: true });
  }
}
