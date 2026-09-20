import { describe, expect, it } from "vitest";
import { readiness, SCHEMA_MISSING_WARNING } from "@/lib/health";

describe("readiness", () => {
  it("is ok only when everything is in place", () => {
    expect(readiness({ database: true, schema: true, warnings: [] })).toEqual({
      status: "ok",
      httpStatus: 200
    });
  });

  it("is degraded when it can serve but something is missing", () => {
    expect(readiness({ database: true, schema: true, warnings: ["no redis"] })).toEqual({
      status: "degraded",
      httpStatus: 200
    });
  });

  it("is unavailable when the database cannot be reached", () => {
    expect(readiness({ database: false, schema: false, warnings: [] })).toEqual({
      status: "unavailable",
      httpStatus: 503
    });
  });

  // The case this function exists for. A reachable database with no schema
  // answers SELECT 1, so connectivity alone reported a healthy deployment
  // while every page that read a table returned a server error.
  it("is unavailable when the database is reachable but unmigrated", () => {
    expect(readiness({ database: true, schema: false, warnings: [] })).toEqual({
      status: "unavailable",
      httpStatus: 503
    });
  });

  it("stays unavailable when unmigrated even with no other warnings", () => {
    const result = readiness({
      database: true,
      schema: false,
      warnings: [SCHEMA_MISSING_WARNING]
    });
    expect(result.status).toBe("unavailable");
    expect(result.httpStatus).toBe(503);
  });

  it("names the remedy in the warning", () => {
    expect(SCHEMA_MISSING_WARNING).toMatch(/prisma migrate deploy/);
  });
});
