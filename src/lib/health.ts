export type Readiness = "ok" | "degraded" | "unavailable";

export interface ReadinessInput {
  /** A connection to the database succeeded. */
  database: boolean;
  /** The schema is present, so a query against a table will not fail. */
  schema: boolean;
  /** Configuration problems already collected for the response. */
  warnings: string[];
}

export const SCHEMA_MISSING_WARNING =
  "The database is reachable but its schema is missing; run prisma migrate deploy.";

/**
 * Whether the deployment can actually serve.
 *
 * Connectivity alone is not readiness. A database with no schema answers
 * `SELECT 1` quite happily while every page that reads a table returns a
 * server error, so migrations that never ran are reported as unavailable
 * rather than as a warning on an otherwise healthy deployment — the whole
 * point of this endpoint is that a misconfiguration is visible here first.
 */
export function readiness(input: ReadinessInput): { status: Readiness; httpStatus: number } {
  if (!input.database || !input.schema) return { status: "unavailable", httpStatus: 503 };
  return { status: input.warnings.length === 0 ? "ok" : "degraded", httpStatus: 200 };
}
