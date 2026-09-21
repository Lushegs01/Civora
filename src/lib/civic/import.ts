import { z } from "zod";
import { CIVIC_CATEGORIES, JURISDICTION_LEVELS } from "../civic-types";

// Importing civic information from a data file.
//
// Adding a country used to mean editing TypeScript and redeploying, which made
// "Civora adapts to other communities" a claim about intent rather than about
// the software. This turns it into a file a local organization can write and
// hand back.
//
// The schema is deliberately strict about provenance. A civic item with no
// issuing body, no authority, no verification date and no method is exactly
// the kind of unattributed claim the product exists to refuse, and it is
// refused here rather than rendered with an empty source line.

const isoDate = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "must be an ISO date, e.g. 2026-03-05")
  .transform((value) => new Date(value));

const translation = z.object({
  title: z.string().trim().min(1),
  explanation: z.string().trim().min(1),
  eligibility: z.string().trim().min(1).optional(),
  requirements: z.array(z.string().trim().min(1)).optional(),
  whatRemainsUncertain: z.array(z.string().trim().min(1)).optional()
});

const nextAction = z.object({
  label: z.string().trim().min(1),
  labelKey: z.string().trim().min(1).optional(),
  type: z.enum(["link", "internal", "report", "contact", "share", "save", "apply"]),
  href: z.string().trim().min(1).optional()
});

export const civicImportItemSchema = z
  .object({
    id: z
      .string()
      .trim()
      .regex(/^[A-Z0-9][A-Z0-9-]{2,39}$/, "must be upper-case letters, digits and hyphens, e.g. CIV-GH-LAND-01"),
    title: z.string().trim().min(3).max(200),
    category: z.enum(CIVIC_CATEGORIES),
    country: z.string().trim().min(2).max(80),
    region: z.string().trim().min(1).max(80).optional(),
    locality: z.string().trim().min(1).max(80).optional(),
    level: z.enum(JURISDICTION_LEVELS),
    explanation: z.string().trim().min(20).max(4000),

    // ── Provenance. None of this is optional, on purpose. ──────────────────
    officialSource: z.string().trim().min(2).max(200),
    sourceAuthority: z.string().trim().min(2).max(120),
    sourceUrl: z.string().trim().url().optional(),
    publishedAt: isoDate,
    lastVerifiedAt: isoDate,
    verificationMethod: z.string().trim().min(10).max(500),
    freshnessThresholdDays: z.number().int().min(1).max(3650),

    eligibility: z.string().trim().min(1).max(1000).optional(),
    requirements: z.array(z.string().trim().min(1).max(300)).max(20).default([]),
    fees: z.string().trim().min(1).max(300).optional(),
    deadlines: z.string().trim().min(1).max(300).optional(),
    contactInfo: z.string().trim().min(1).max(300).optional(),
    nextActions: z.array(nextAction).max(8).default([]),
    whatRemainsUncertain: z.array(z.string().trim().min(1).max(500)).max(10).default([]),
    relatedCaseIds: z.array(z.string().trim().regex(/^CS-\d{1,9}$/)).max(20).default([]),
    relatedCivicIds: z.array(z.string().trim()).max(20).default([]),
    languageVersions: z.record(translation).default({}),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),

    /**
     * Whether this item is invented. It has no default: a real deployment and
     * a demo corpus must not be distinguishable only by someone having
     * remembered to say so, because the interface labels fictional records and
     * that label has to be right.
     */
    fictional: z.boolean()
  })
  .strict()
  .superRefine((item, ctx) => {
    if (item.lastVerifiedAt < item.publishedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lastVerifiedAt"],
        message: "cannot be earlier than publishedAt — an item cannot be verified before it existed"
      });
    }
    if (item.lastVerifiedAt.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lastVerifiedAt"],
        message: "is in the future; freshness would be computed from a date that has not happened"
      });
    }
  });

export const civicImportFileSchema = z.object({
  /** Free text, for whoever reads the file later. Not stored. */
  source: z.string().trim().min(1).max(200).optional(),
  items: z.array(civicImportItemSchema).min(1).max(500)
});

export type CivicImportItem = z.infer<typeof civicImportItemSchema>;

export interface ImportIssue {
  /** 1-based, matching how a person counts entries in the file. */
  index: number;
  id: string;
  problems: string[];
}

export type ImportParse =
  | { ok: true; items: CivicImportItem[]; duplicates: string[] }
  | { ok: false; issues: ImportIssue[]; formError?: string };

/**
 * Validates a parsed JSON payload.
 *
 * Every item is reported, not just the first to fail: someone fixing a
 * hand-written corpus should see the whole list once rather than discover it
 * one run at a time.
 */
export function parseCivicImport(payload: unknown): ImportParse {
  const file = civicImportFileSchema.safeParse(payload);
  if (file.success) {
    const seen = new Map<string, number>();
    const duplicates: string[] = [];
    for (const item of file.data.items) {
      const count = (seen.get(item.id) ?? 0) + 1;
      seen.set(item.id, count);
      if (count === 2) duplicates.push(item.id);
    }
    if (duplicates.length > 0) {
      return {
        ok: false,
        issues: duplicates.map((id) => ({
          index: 0,
          id,
          problems: ["appears more than once in this file; ids must be unique"]
        }))
      };
    }
    return { ok: true, items: file.data.items, duplicates: [] };
  }

  const byIndex = new Map<number, string[]>();
  let formError: string | undefined;
  for (const issue of file.error.issues) {
    const [first, index, ...rest] = issue.path;
    if (first === "items" && typeof index === "number") {
      const field = rest.length > 0 ? rest.join(".") : "(item)";
      const list = byIndex.get(index) ?? [];
      list.push(`${field}: ${issue.message}`);
      byIndex.set(index, list);
    } else {
      formError = issue.message;
    }
  }

  const raw = (payload as { items?: unknown[] })?.items;
  const issues: ImportIssue[] = [...byIndex.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([index, problems]) => ({
      index: index + 1,
      id: String((Array.isArray(raw) ? (raw[index] as { id?: unknown })?.id : undefined) ?? "(no id)"),
      problems
    }));

  return { ok: false, issues, formError };
}

/** A one-line description of what a validated file will do, before it does it. */
export function describeImport(items: CivicImportItem[]): string {
  const countries = [...new Set(items.map((i) => i.country))].sort();
  const languages = [...new Set(items.flatMap((i) => Object.keys(i.languageVersions)))].sort();
  return [
    `${items.length} item${items.length === 1 ? "" : "s"}`,
    `${countries.length} ${countries.length === 1 ? "country" : "countries"} (${countries.join(", ")})`,
    languages.length > 0 ? `translations: ${languages.join(", ")}` : "no translations"
  ].join(" · ");
}
