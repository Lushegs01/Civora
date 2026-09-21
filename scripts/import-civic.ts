import "./load-env";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient, type Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { describeImport, parseCivicImport, type CivicImportItem } from "../src/lib/civic/import";

// Loads civic information from a JSON file.
//
//   npm run civic:import -- path/to/items.json [--replace] [--dry-run]
//
// Upsert by default, so re-running after a correction updates in place and
// nothing else in the corpus is touched. --replace deletes the items named in
// the file first; it never deletes anything the file does not name, so one
// country's corpus cannot remove another's.
//
// Validation is separate from writing: --dry-run runs the whole check and
// reports what would happen without opening a write transaction.

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const replace = args.includes("--replace");
const dryRun = args.includes("--dry-run");

function die(message: string): never {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

if (!file) {
  die("Usage: npm run civic:import -- <file.json> [--replace] [--dry-run]");
}

const resolved = path.resolve(file);
if (!fs.existsSync(resolved)) die(`No such file: ${resolved}`);

let payload: unknown;
try {
  payload = JSON.parse(fs.readFileSync(resolved, "utf-8"));
} catch (error) {
  die(`${path.basename(resolved)} is not valid JSON: ${(error as Error).message}`);
}

const parsed = parseCivicImport(payload);
if (!parsed.ok) {
  console.error(`\n  ${path.basename(resolved)} was not imported.\n`);
  if (parsed.formError) console.error(`  ${parsed.formError}\n`);
  for (const issue of parsed.issues) {
    console.error(`  item ${issue.index} (${issue.id})`);
    for (const problem of issue.problems) console.error(`    - ${problem}`);
  }
  console.error(`\n  ${parsed.issues.length} item(s) need attention. Nothing was written.\n`);
  process.exit(1);
}

const items = parsed.items;
console.log(`\n  ${path.basename(resolved)} — ${describeImport(items)}`);

if (dryRun) {
  console.log("  --dry-run: valid, nothing written.\n");
  process.exit(0);
}

const connectionString =
  process.env.DIRECT_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;
if (!connectionString) {
  die("A database connection string is required. Set DATABASE_URL, or pull one from a connected store.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/** Prisma's create and update payloads for one validated item. */
function rowFor(item: CivicImportItem) {
  return {
    title: item.title,
    category: item.category,
    country: item.country,
    region: item.region ?? null,
    locality: item.locality ?? null,
    level: item.level,
    explanation: item.explanation,
    officialSource: item.officialSource,
    sourceUrl: item.sourceUrl ?? null,
    sourceAuthority: item.sourceAuthority,
    publishedAt: item.publishedAt,
    lastVerifiedAt: item.lastVerifiedAt,
    freshnessThresholdDays: item.freshnessThresholdDays,
    verificationMethod: item.verificationMethod,
    eligibility: item.eligibility ?? null,
    requirements: item.requirements,
    fees: item.fees ?? null,
    deadlines: item.deadlines ?? null,
    contactInfo: item.contactInfo ?? null,
    nextActions: item.nextActions as unknown as Prisma.InputJsonValue,
    relatedCaseIds: item.relatedCaseIds,
    relatedCivicIds: item.relatedCivicIds,
    whatRemainsUncertain: item.whatRemainsUncertain,
    languageVersions: item.languageVersions as unknown as Prisma.InputJsonValue,
    fictional: item.fictional,
    tags: item.tags
  };
}

async function main() {
  const ids = items.map((i) => i.id);
  const existing = await prisma.civicInfoItem.findMany({
    where: { id: { in: ids } },
    select: { id: true }
  });
  const existingIds = new Set(existing.map((e) => e.id));

  await prisma.$transaction(async (tx) => {
    if (replace) {
      const { count } = await tx.civicInfoItem.deleteMany({ where: { id: { in: ids } } });
      console.log(`  --replace: removed ${count} existing item(s) named in this file`);
    }
    for (const item of items) {
      const row = rowFor(item);
      await tx.civicInfoItem.upsert({
        where: { id: item.id },
        create: { id: item.id, ...row },
        update: row
      });
    }
  });

  const created = ids.filter((id) => !existingIds.has(id)).length;
  const updated = ids.length - created;
  const total = await prisma.civicInfoItem.count();
  console.log(`  ${created} created, ${updated} updated. ${total} civic items in the corpus.\n`);
}

main()
  .catch((error) => {
    console.error(`\n  Import failed, nothing committed: ${(error as Error).message}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
