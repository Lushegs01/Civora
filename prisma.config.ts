import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 reads connection URLs from here rather than from schema.prisma.
// Migrations run against DIRECT_URL when one is set (an unpooled connection is
// required by PgBouncer-style poolers such as Supabase and Neon); otherwise
// they fall back to the same URL the application uses.
const migrationUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";

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
