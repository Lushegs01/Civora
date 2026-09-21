import { afterEach, describe, expect, it } from "vitest";
import { envAttempts, envFileFrom, loadEnv, withoutEnvArg } from "@/../scripts/load-env";
import { CONNECTION_VARS, connectionString, describeTarget, isLocal } from "@/../scripts/db-target";

// The command-line tools are how a deployment gets its data, and the way they
// were configured — an environment variable, set differently in every shell —
// was the step that actually failed in practice. `--env` is one string
// everywhere. These tests cover the two ways that flag can go wrong: being
// read as something else, and pointing somewhere silently.

afterEach(() => {
  // loadEnv() records module state; put it back to the default search so one
  // test cannot decide what the next one sees.
  loadEnv([]);
});

describe("--env", () => {
  it("reads both spellings", () => {
    expect(envFileFrom(["--env", ".env.vercel"])).toBe(".env.vercel");
    expect(envFileFrom(["--env=.env.vercel"])).toBe(".env.vercel");
  });

  it("is absent when not given", () => {
    expect(envFileFrom(["examples/civic-ghana.json", "--dry-run"])).toBeUndefined();
  });

  it("does not swallow the next flag as its filename", () => {
    // `--env --yes` is a mistake; treating --yes as a path would then look for
    // a file called "--yes", and the operator would be told that file is
    // missing rather than that the flag is malformed.
    expect(envFileFrom(["--env", "--yes"])).toBeUndefined();
    expect(envFileFrom(["--env"])).toBeUndefined();
  });

  it("is removed from the arguments, so it is not taken as the input file", () => {
    // import-civic.ts picks the first argument that is not a flag. Left in,
    // `--env .env.vercel` would make .env.vercel the corpus to import.
    const argv = ["--env", ".env.vercel", "examples/civic-ghana.json", "--replace"];
    const rest = withoutEnvArg(argv);
    expect(rest.find((a) => !a.startsWith("--"))).toBe("examples/civic-ghana.json");
    expect(rest).toEqual(["examples/civic-ghana.json", "--replace"]);
  });

  it("removes the = spelling too, and keeps everything else in order", () => {
    expect(withoutEnvArg(["a.json", "--env=.env.vercel", "--yes"])).toEqual(["a.json", "--yes"]);
  });

  it("leaves a malformed --env's neighbour alone", () => {
    expect(withoutEnvArg(["--env", "--yes", "a.json"])).toEqual(["--yes", "a.json"]);
  });

  it("records a named file that does not exist, instead of falling back to .env.local", () => {
    // Falling back would seed whatever the developer's own configuration
    // points at, which is the one outcome worse than failing.
    loadEnv(["--env", "no/such/.env"]);
    expect(envAttempts).toEqual([{ origin: "--env", path: "no/such/.env", found: false }]);
  });

  it("consults .env.local then .env when nothing is named", () => {
    loadEnv([]);
    expect(envAttempts.map((a) => a.path)).toEqual([".env.local", ".env"]);
    expect(envAttempts.every((a) => a.origin === "default")).toBe(true);
  });
});

describe("database target", () => {
  it("names the host and database", () => {
    expect(describeTarget("postgres://u:p@db.example.com:5432/civora")).toBe("db.example.com:5432/civora");
  });

  it("never prints the password", () => {
    // This string ends up in build logs and in messages people paste into
    // chat. A connection string carries a live credential.
    const shown = describeTarget("postgres://civora:sup3r-s3cret@ep-x.aws.neon.tech/verceldb?sslmode=require");
    expect(shown).not.toContain("sup3r-s3cret");
    expect(shown).not.toContain("civora:");
    expect(shown).toBe("ep-x.aws.neon.tech/verceldb");
  });

  it("does not throw on a string that is not a URL", () => {
    expect(describeTarget("not a url")).toBe("an unparseable connection string");
  });

  it("recognises a local database, and nothing else", () => {
    expect(isLocal("postgres://u:p@localhost:5432/civora")).toBe(true);
    expect(isLocal("postgres://u:p@127.0.0.1:5432/civora")).toBe(true);
    expect(isLocal("postgres://u:p@ep-x.aws.neon.tech/verceldb")).toBe(false);
    // A host that merely contains "localhost" is somebody else's server.
    expect(isLocal("postgres://u:p@localhost.attacker.example/db")).toBe(false);
  });

  it("prefers an unpooled connection, because both callers write in bulk", () => {
    expect(CONNECTION_VARS[0]).toBe("DIRECT_URL");
    expect(CONNECTION_VARS).toContain("DATABASE_URL");
    expect(CONNECTION_VARS.indexOf("DIRECT_URL")).toBeLessThan(CONNECTION_VARS.indexOf("DATABASE_URL"));
  });

  it("returns whichever variable is set, in that order", () => {
    const saved = CONNECTION_VARS.map((name) => process.env[name]);
    try {
      for (const name of CONNECTION_VARS) delete process.env[name];
      expect(connectionString()).toBeUndefined();
      process.env.DATABASE_URL = "postgres://late";
      expect(connectionString()).toBe("postgres://late");
      process.env.DIRECT_URL = "postgres://first";
      expect(connectionString()).toBe("postgres://first");
      // An empty variable is not a configuration; Vercel writes these.
      process.env.DIRECT_URL = "";
      expect(connectionString()).toBe("postgres://late");
    } finally {
      CONNECTION_VARS.forEach((name, i) => {
        const value = saved[i];
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      });
    }
  });
});
