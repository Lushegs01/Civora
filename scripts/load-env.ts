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
// DOTENV_CONFIG_PATH still wins outright, so the documented
// `DOTENV_CONFIG_PATH=.env.vercel npm run db:seed` reaches a pulled deployment
// environment and nothing else.
export function loadEnv(): void {
  // `quiet` suppresses dotenv's per-load banner. Two loads in every one of
  // eighteen test files is a screenful of tips between the results.
  const explicit = process.env.DOTENV_CONFIG_PATH;
  if (explicit) {
    loadEnvFile({ path: explicit, quiet: true });
    return;
  }
  loadEnvFile({ path: ".env.local", quiet: true });
  loadEnvFile({ path: ".env", quiet: true });
}

loadEnv();
