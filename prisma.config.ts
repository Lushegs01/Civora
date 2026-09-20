import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 reads connection URLs from here rather than from schema.prisma.
//
// Migrations need an unpooled connection, which PgBouncer-style poolers
// (Supabase, Neon, Vercel Postgres) expose separately. Vercel's integration
// injects its own variable names, so those are accepted too — a Vercel-native
// deployment needs no database configuration set by hand.
const migrationUrl =
  process.env.DIRECT_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: migrationUrl
  }
});
