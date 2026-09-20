import crypto from "node:crypto";
import type { PutResult, StorageDriver, StoredObject } from "./types";

// Minimal SigV4 client for S3-compatible object storage (AWS S3, Cloudflare R2,
// MinIO, Backblaze B2 …). Implemented against node:crypto rather than pulling
// in the AWS SDK, which would add tens of megabytes for three verbs.
//
// Objects are written with no ACL, so they inherit the bucket's private
// default. Civora never hands a storage URL to a browser; bytes are streamed
// back only through the authorization-checked evidence route.

export interface S3Options {
  bucket: string;
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
}

const UNSIGNED_PAYLOAD_ALLOWED = false;

function sha256Hex(data: crypto.BinaryLike): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function hmac(key: crypto.BinaryLike | crypto.KeyObject, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

/** RFC 3986 encoding, applied per path segment so "/" stays a separator. */
function encodePath(key: string): string {
  return key
    .split("/")
    .map((segment) =>
      encodeURIComponent(segment).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    )
    .join("/");
}

export class S3StorageDriver implements StorageDriver {
  readonly name = "s3";
  readonly durable = true;
  private readonly opts: S3Options;
  private readonly host: string;
  private readonly baseUrl: string;

  constructor(opts: S3Options) {
    if (!opts.bucket || !opts.endpoint || !opts.accessKeyId || !opts.secretAccessKey) {
      throw new Error(
        "S3 storage requires OBJECT_STORAGE_BUCKET, OBJECT_STORAGE_ENDPOINT, OBJECT_STORAGE_ACCESS_KEY_ID and OBJECT_STORAGE_SECRET_ACCESS_KEY."
      );
    }
    this.opts = opts;
    const endpoint = new URL(opts.endpoint);
    if (opts.forcePathStyle) {
      this.host = endpoint.host;
      this.baseUrl = `${endpoint.protocol}//${endpoint.host}/${opts.bucket}`;
    } else {
      this.host = `${opts.bucket}.${endpoint.host}`;
      this.baseUrl = `${endpoint.protocol}//${this.host}`;
    }
  }

  private sign(
    method: string,
    key: string,
    payloadHash: string,
    extraHeaders: Record<string, string> = {}
  ): { url: string; headers: Record<string, string> } {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);
    const canonicalUri = `${this.opts.forcePathStyle ? `/${this.opts.bucket}` : ""}/${encodePath(key)}`;

    const headers: Record<string, string> = {
      host: this.host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      ...extraHeaders
    };
    const sortedKeys = Object.keys(headers)
      .map((h) => h.toLowerCase())
      .sort();
    const canonicalHeaders = sortedKeys
      .map((h) => `${h}:${String(headers[Object.keys(headers).find((k) => k.toLowerCase() === h)!]).trim()}\n`)
      .join("");
    const signedHeaders = sortedKeys.join(";");

    const canonicalRequest = [
      method,
      canonicalUri,
      "",
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join("\n");

    const scope = `${dateStamp}/${this.opts.region}/s3/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      scope,
      sha256Hex(canonicalRequest)
    ].join("\n");

    const signingKey = hmac(
      hmac(hmac(hmac(`AWS4${this.opts.secretAccessKey}`, dateStamp), this.opts.region), "s3"),
      "aws4_request"
    );
    const signature = crypto.createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");

    headers.Authorization =
      `AWS4-HMAC-SHA256 Credential=${this.opts.accessKeyId}/${scope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return { url: `${this.baseUrl}/${encodePath(key)}`, headers };
  }

  async put(key: string, body: Uint8Array, contentType: string): Promise<PutResult> {
    const payloadHash = UNSIGNED_PAYLOAD_ALLOWED ? "UNSIGNED-PAYLOAD" : sha256Hex(Buffer.from(body));
    const { url, headers } = this.sign("PUT", key, payloadHash, {
      "content-type": contentType,
      "content-length": String(body.byteLength)
    });
    const res = await fetch(url, { method: "PUT", headers, body: Buffer.from(body) });
    if (!res.ok) {
      throw new Error(`Object storage rejected the upload (${res.status}).`);
    }
    return { key, driver: this.name };
  }

  async get(key: string): Promise<StoredObject | null> {
    const { url, headers } = this.sign("GET", key, sha256Hex(""));
    const res = await fetch(url, { method: "GET", headers });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Object storage read failed (${res.status}).`);
    const buf = new Uint8Array(await res.arrayBuffer());
    return {
      body: buf,
      contentType: res.headers.get("content-type") || "application/octet-stream",
      sizeBytes: buf.byteLength
    };
  }

  async delete(key: string): Promise<void> {
    const { url, headers } = this.sign("DELETE", key, sha256Hex(""));
    const res = await fetch(url, { method: "DELETE", headers });
    if (!res.ok && res.status !== 404) {
      throw new Error(`Object storage delete failed (${res.status}).`);
    }
  }
}
