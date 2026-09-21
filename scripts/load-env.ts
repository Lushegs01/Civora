import fs from "node:fs";
import { config as loadEnvFile } from "dotenv";

// Where the command-line tools read configuration from.
//
// Next.js reads `.env.local` for `npm run dev`, and `.gitignore` ignores every
// env file except the template — so `.env.local` is the file a contributor
// actually creates, and the one the README tells them to create. The Prisma
// tooling read only `.env`, so the documented quick start
//
//   cp .env.example .env.local && npm run setup
//
// failed at the first step with "Connection url is empty": the application and
// its migrations disagreed about where configuration lives. Both read the same
// files now, in the same order Next.js uses.
//
// dotenv never overwrites a variable that is already set, so the precedence is
// the real environment first — that is how Vercel, CI and an inline
// `DATABASE_URL=… npm run db:seed` inject theirs — then `.env.local`, then
// `.env`.
//
// ── Why there is a flag as well as a variable ──────────────────────────────
//
// Seeding a hosted database was documented as
//
//   DOTENV_CONFIG_PATH=.env.vercel npm run db:seed
//
// which is POSIX shell and only POSIX shell. In Windows `cmd` the equivalent
// is a separate `set` line whose value silently absorbs a trailing space
// before `&&`, and which is lost the moment the window closes; in PowerShell
// it is `$env:` and a third spelling again. Every one of those is a way to run
// the command and have it look for a file that isn't there.
//
// `--env <file>` is the same string on all three. The variable still works.

export type EnvOrigin = "--env" | "DOTENV_CONFIG_PATH" | "default";

export interface EnvFileAttempt {
  origin: EnvOrigin;
  path: string;
  /** The file existed and was read. A missing default file is normal. */
  found: boolean;
}

/** Populated by `loadEnv()`, for error messages that can name what was tried. */
export const envAttempts: EnvFileAttempt[] = [];

/**
 * Set when `--env` was passed without a usable path. Recorded rather than
 * thrown because this module loads on import, including inside the test
 * setup; the command-line scripts report it where the user can act on it.
 */
export let envArgError: string | undefined;

const DEFAULT_FILES = [".env.local", ".env"];

/**
 * The path given by `--env <path>` or `--env=<path>`, if any.
 *
 * A bare `--env`, or one followed by another flag, is a mistake rather than a
 * request for the defaults: it is reported instead of being ignored.
 */
export function envFileFrom(argv: readonly string[]): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--env=")) {
      const value = arg.slice("--env=".length);
      if (value.length === 0) {
        envArgError = "--env= was given with no file after the equals sign.";
        return undefined;
      }
      return value;
    }
    if (arg === "--env") {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("-")) {
        envArgError = "--env was given with no file after it, e.g. --env .env.vercel";
        return undefined;
      }
      return value;
    }
  }
  return undefined;
}

/**
 * `argv` with the `--env` flag and its value removed.
 *
 * `import-civic.ts` takes its input file as the first non-flag argument, so
 * `--env .env.vercel` would otherwise be read as the file to import.
 */
export function withoutEnvArg(argv: readonly string[]): string[] {
  const kept: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--env=")) continue;
    if (arg === "--env") {
      const value = argv[i + 1];
      if (value !== undefined && !value.startsWith("-")) i++;
      continue;
    }
    kept.push(arg);
  }
  return kept;
}

export function loadEnv(argv: readonly string[] = process.argv.slice(2)): void {
  envAttempts.length = 0;
  envArgError = undefined;

  // `quiet` suppresses dotenv's per-load banner. Two loads in every one of
  // eighteen test files is a screenful of tips between the results.
  const read = (origin: EnvOrigin, path: string) => {
    const found = fs.existsSync(path);
    envAttempts.push({ origin, path, found });
    if (found) loadEnvFile({ path, quiet: true });
    return found;
  };

  const flagged = envFileFrom(argv);
  if (envArgError) return;

  // An explicit choice is exactly that: if the named file is absent, fall
  // through to nothing rather than quietly seeding whatever `.env.local`
  // happens to point at. Reaching the wrong database is the failure worth
  // preventing here.
  if (flagged) {
    read("--env", flagged);
    return;
  }
  const fromVariable = process.env.DOTENV_CONFIG_PATH;
  if (fromVariable) {
    read("DOTENV_CONFIG_PATH", fromVariable);
    return;
  }
  for (const path of DEFAULT_FILES) read("default", path);
}

loadEnv();
