import crypto from "node:crypto";
import { isProduction, storage as storageConfig } from "../config";
import { log } from "../log";
import { LocalStorageDriver } from "./local";
import { S3StorageDriver } from "./s3";
import { VercelBlobStorageDriver } from "./blob";
import { StorageNotConfiguredError, type StorageDriver } from "./types";

export * from "./types";

let cached: StorageDriver | null | undefined;

/**
 * Selects the configured private storage driver.
 *
 * Returns null — rather than quietly writing somewhere unsafe — when nothing
 * durable is configured in production. Callers surface that as "uploads are
 * temporarily unavailable" instead of losing a reporter's evidence.
 */
export function storageDriver(): StorageDriver | null {
  if (cached !== undefined) return cached;
  cached = build();
  return cached;
}

function build(): StorageDriver | null {
  const driver = storageConfig.driver;
  try {
    switch (driver) {
      case "s3":
        return new S3StorageDriver({
          bucket: storageConfig.bucket,
          region: storageConfig.region,
          endpoint: storageConfig.endpoint,
          accessKeyId: storageConfig.accessKeyId,
          secretAccessKey: storageConfig.secretAccessKey,
          forcePathStyle: storageConfig.forcePathStyle
        });
      case "vercel-blob":
        return new VercelBlobStorageDriver();
      case "local":
        if (isProduction) {
          log.error("storage.local_rejected_in_production");
          return null;
        }
        return new LocalStorageDriver(storageConfig.localDir);
      case "":
        if (!isProduction) return new LocalStorageDriver(storageConfig.localDir);
        log.error("storage.not_configured");
        return null;
      default:
        log.error("storage.unknown_driver", { driver });
        return null;
    }
  } catch (error) {
    log.error("storage.init_failed", { driver, error });
    return null;
  }
}

/** Throwing accessor for call sites that cannot proceed without storage. */
export function requireStorage(): StorageDriver {
  const driver = storageDriver();
  if (!driver) throw new StorageNotConfiguredError();
  return driver;
}

/**
 * Builds an unguessable storage key. The key is never returned to a client, so
 * this is defence in depth rather than the access control itself.
 */
export function evidenceStorageKey(evidenceId: string, extension: string): string {
  const salt = crypto.randomBytes(8).toString("hex");
  const safeExtension = /^\.[a-z0-9]{1,8}$/.test(extension) ? extension : ".bin";
  const prefix = storageConfig.prefix.replace(/[^a-zA-Z0-9/_-]/g, "") || "evidence";
  return `${prefix}/${evidenceId}-${salt}${safeExtension}`;
}

/** Reset hook for tests. */
export function __resetStorageForTests(): void {
  cached = undefined;
}
