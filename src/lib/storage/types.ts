export interface StoredObject {
  body: Uint8Array;
  contentType: string;
  sizeBytes: number;
}

export interface PutResult {
  key: string;
  driver: string;
}

/**
 * Private object storage. Evidence bytes never live in PostgreSQL and are
 * never publicly addressable: every read goes through an authorization check
 * in /api/evidence-file/[id], which is the only caller of `get`.
 */
export interface StorageDriver {
  readonly name: string;
  /** True when the driver can durably survive a process restart. */
  readonly durable: boolean;
  put(key: string, body: Uint8Array, contentType: string): Promise<PutResult>;
  get(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
}

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("Evidence storage is not configured. Set OBJECT_STORAGE_DRIVER and its credentials.");
    this.name = "StorageNotConfiguredError";
  }
}
