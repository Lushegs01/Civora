import { envArgError, envAttempts, withoutEnvArg } from "./load-env";

// Resolving, describing and confirming the database a command-line tool is
// about to write to.
//
// This exists because "A database connection string is required" is a true
// sentence that tells you nothing. The person reading it has usually done
// something reasonable — pulled the wrong file, opened a second terminal, let
// a `set` line absorb a trailing space — and the fix depends entirely on which
// of those it was. The diagnostic below names the files that were opened and
// the variables that were looked for, so the answer is in the failure.
//
// It also prints the host before a destructive command runs. `--env` makes
// seeding a hosted database easy, and a wipe you can trigger easily is a wipe
// worth showing the target of first.

/**
 * In precedence order. An unpooled endpoint comes first because both callers
 * do bulk writes, and a pooled connection cannot hold the session-level
 * advisory lock those transactions want.
 */
export const CONNECTION_VARS = [
  "DIRECT_URL",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL_UNPOOLED",
  "DATABASE_URL",
  "POSTGRES_URL"
] as const;

export function connectionString(): string | undefined {
  for (const name of CONNECTION_VARS) {
    const value = process.env[name];
    if (value && value.length > 0) return value;
  }
  return undefined;
}

/** Host and database name. Never the password — this gets printed and pasted. */
export function describeTarget(url: string): string {
  try {
    const parsed = new URL(url);
    const database = parsed.pathname.replace(/^\//, "");
    return database ? `${parsed.host}/${database}` : parsed.host;
  } catch {
    return "an unparseable connection string";
  }
}

export function isLocal(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
  } catch {
    return false;
  }
}

/** What was read, and from where, as lines for an error message. */
export function describeEnvSearch(): string[] {
  if (envArgError) return [`  ${envArgError}`];
  if (envAttempts.length === 0) return ["  No env file was read; only the real environment was consulted."];
  return envAttempts.map(({ origin, path, found }) => {
    const how = origin === "default" ? "default" : `from ${origin}`;
    return `  ${found ? "read" : "not found"}: ${path} (${how})`;
  });
}

/**
 * The command the operator typed, with flags this message is about to add
 * removed, so the suggestion below can be pasted rather than edited.
 *
 * `command` is the npm prefix — `npm run db:seed --` — and the rest is rebuilt
 * from the real arguments, so an example never contradicts what was run.
 */
function suggest(command: string, argv: readonly string[], ...add: string[]): string {
  const rest = withoutEnvArg(argv).filter((a) => a !== "--yes");
  return [command, ...rest, ...add].join(" ").replace(/\s+/g, " ");
}

/**
 * The connection string, or a diagnostic and a non-zero exit.
 *
 * "A database connection string is required" is a true sentence that tells the
 * reader nothing. Naming the files that were opened turns the most common
 * causes — a file never pulled, a second terminal, a `set` line whose value
 * absorbed a trailing space — into something visible in the failure itself.
 */
export function requireConnectionString(command: string, argv: readonly string[] = process.argv.slice(2)): string {
  const found = connectionString();
  if (found) return found;

  console.error(
    [
      "",
      "  No database connection string was found, so nothing was written.",
      "",
      "  Env files:",
      ...describeEnvSearch(),
      "",
      `  Variables checked, in order: ${CONNECTION_VARS.join(", ")}`,
      "",
      "  To write to the hosted database, pull its configuration and point this",
      "  command at the file. The flag is spelled the same in cmd, PowerShell",
      "  and bash:",
      "",
      "    vercel env pull .env.vercel",
      `    ${suggest(command, argv, "--env", ".env.vercel")}`,
      "",
      "  `vercel env pull` needs `vercel login` first, and writes the file into",
      "  the current directory — run both from the repository root.",
      ""
    ].join("\n")
  );
  process.exit(1);
}

/**
 * Gate for a command that deletes before it writes.
 *
 * A local database is a developer's own and is not worth a prompt. Anything
 * else is somebody's deployment: it needs `--yes`, which is a deliberate
 * keystroke and also works unattended, where an interactive prompt would not
 * work in a build at all.
 *
 * `consequence` is a whole sentence naming what will be destroyed. Nothing has
 * connected to the database at this point, so a refusal here costs a second
 * rather than a timeout.
 */
export function confirmDestructive(
  url: string,
  argv: readonly string[],
  consequence: string,
  command: string
): void {
  const target = describeTarget(url);
  if (isLocal(url)) {
    console.log(`  Target: ${target} (local)`);
    return;
  }
  if (argv.includes("--yes")) {
    console.warn(`  Target: ${target} — not a local database. ${consequence}`);
    return;
  }
  console.error(
    [
      "",
      `  Refusing to run against ${target}.`,
      "",
      `  That is not a local database. ${consequence}`,
      "",
      "  Add --yes if that is what you intend:",
      "",
      // The command exactly as it was run, plus the flag. Any --env the
      // operator passed is kept: dropping it would suggest a command that
      // reads a different database from the one being refused.
      `    ${[command, ...argv, "--yes"].join(" ").replace(/\s+/g, " ")}`,
      ""
    ].join("\n")
  );
  process.exit(1);
}
