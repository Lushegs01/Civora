import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { CivoraDB } from "../types";
import { buildSeed } from "./seed-data";

// Demo persistence layer: a JSON file store shaped exactly like the relational
// model in prisma/schema.prisma. Swap `readDb`/`writeDb` for Prisma queries to
// move to PostgreSQL without touching domain code or UI.

const ROOT = process.env.VERCEL ? "/tmp" : process.cwd();
const DATA_DIR = process.env.DATA_DIR || "data";
const DB_PATH = path.join(ROOT, DATA_DIR, "civora-db.json");
const UPLOAD_DIR = path.join(ROOT, DATA_DIR, "uploads");

let cached: { mtimeMs: number; db: CivoraDB } | null = null;

function ensureDirs() {
  if (!fs.existsSync(path.join(ROOT, DATA_DIR))) fs.mkdirSync(path.join(ROOT, DATA_DIR), { recursive: true });
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export function uploadDir(): string {
  ensureDirs();
  return UPLOAD_DIR;
}

export function sha256(input: string | Buffer): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function readDb(): CivoraDB {
  ensureDirs();
  if (!fs.existsSync(DB_PATH)) {
    const seeded = buildSeed();
    fs.writeFileSync(DB_PATH, JSON.stringify(seeded, null, 2), "utf-8");
    return seeded;
  }
  const stat = fs.statSync(DB_PATH);
  if (cached && cached.mtimeMs === stat.mtimeMs) return cached.db;
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as CivoraDB;
  cached = { mtimeMs: stat.mtimeMs, db };
  return db;
}

export function writeDb(db: CivoraDB): void {
  ensureDirs();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  cached = null;
}

export function nextCaseId(db: CivoraDB): string {
  const n = db.meta.lastCaseNumber + 1;
  db.meta.lastCaseNumber = n;
  return `CS-${n}`;
}

export function resetDb(): CivoraDB {
  ensureDirs();
  const seeded = buildSeed();
  fs.writeFileSync(DB_PATH, JSON.stringify(seeded, null, 2), "utf-8");
  cached = null;
  return seeded;
}

export function findCase(db: CivoraDB, caseId: string) {
  return db.cases.find((c) => c.id === caseId.toUpperCase());
}

export function orgName(db: CivoraDB, orgId?: string): string | undefined {
  return db.orgs.find((o) => o.id === orgId)?.name;
}

// ---- simple in-memory rate limiting (per IP, demo grade) -------------------
const hits = new Map<string, number[]>();
export function rateLimit(key: string, limit = 8, windowMs = 15 * 60_000): boolean {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  return true;
}
