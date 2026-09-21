import { describe, expect, it } from "vitest";
import { describeImport, parseCivicImport } from "@/lib/civic/import";

// The importer is what makes "adapt Civora for another community" a file
// rather than a pull request. Its value depends entirely on it being strict:
// an item that arrives without provenance and is written anyway would put an
// unattributed claim on a page whose whole argument is attribution.

const valid = {
  id: "CIV-GH-LAND-01",
  title: "Registering a land title at the district office",
  category: "procedure",
  country: "Ghana",
  region: "Greater Accra",
  level: "local",
  explanation: "A land title is registered at the district office covering the plot, not the applicant's home district.",
  officialSource: "District Lands Office, Ga East",
  sourceAuthority: "District Assembly",
  publishedAt: "2025-11-14",
  lastVerifiedAt: "2026-09-02",
  verificationMethod: "Checked against the published fee schedule and posted counter hours.",
  freshnessThresholdDays: 60,
  fictional: true
};

const file = (...items: unknown[]) => ({ items });

function problemsFor(payload: unknown): string {
  const result = parseCivicImport(payload);
  if (result.ok) throw new Error("expected the import to be rejected");
  return result.issues.flatMap((i) => i.problems).join(" | ");
}

describe("civic import validation", () => {
  it("accepts a well-formed item and fills the optional collections", () => {
    const result = parseCivicImport(file(valid));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items).toHaveLength(1);
    expect(result.items[0].requirements).toEqual([]);
    expect(result.items[0].nextActions).toEqual([]);
    expect(result.items[0].languageVersions).toEqual({});
    // Dates arrive as strings and land as Dates, so freshness can be computed.
    expect(result.items[0].lastVerifiedAt).toBeInstanceOf(Date);
  });

  for (const field of ["officialSource", "sourceAuthority", "verificationMethod", "lastVerifiedAt"]) {
    it(`refuses an item with no ${field}`, () => {
      const { [field as keyof typeof valid]: _removed, ...without } = valid;
      expect(problemsFor(file(without))).toContain(field);
    });
  }

  it("refuses an item that does not say whether it is fictional", () => {
    const { fictional: _omitted, ...without } = valid;
    // No default: a demo corpus and a real one must not differ only by whether
    // someone remembered to say which this is.
    expect(problemsFor(file(without))).toContain("fictional");
  });

  it("refuses a verification date earlier than publication", () => {
    expect(problemsFor(file({ ...valid, publishedAt: "2026-09-02", lastVerifiedAt: "2025-11-14" })))
      .toContain("cannot be verified before it existed");
  });

  it("refuses a verification date in the future", () => {
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    expect(problemsFor(file({ ...valid, lastVerifiedAt: nextYear }))).toContain("has not happened");
  });

  it("refuses an unknown category rather than storing it", () => {
    expect(problemsFor(file({ ...valid, category: "gossip" }))).toContain("category");
  });

  it("refuses a field it does not recognize, instead of dropping it silently", () => {
    // A typo in a key would otherwise import as an item missing that field.
    expect(problemsFor(file({ ...valid, verifiedBy: "someone" }))).toBeTruthy();
  });

  it("refuses the same id twice in one file", () => {
    expect(problemsFor(file(valid, { ...valid, title: "A second entry, same id" })))
      .toContain("more than once");
  });

  it("refuses a related case id that is not a case id", () => {
    expect(problemsFor(file({ ...valid, relatedCaseIds: ["not-a-case"] }))).toContain("relatedCaseIds");
  });

  it("reports every bad item at once, not just the first", () => {
    const result = parseCivicImport(
      file(valid, { ...valid, id: "CIV-B-01", officialSource: "" }, { ...valid, id: "CIV-C-01", category: "nope" })
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toHaveLength(2);
    expect(result.issues.map((i) => i.id)).toEqual(["CIV-B-01", "CIV-C-01"]);
    // 1-based, matching how a person counts entries in the file.
    expect(result.issues.map((i) => i.index)).toEqual([2, 3]);
  });

  it("requires at least one item, so an empty file is a mistake not a no-op", () => {
    expect(parseCivicImport({ items: [] }).ok).toBe(false);
  });

  it("summarises what a file will do before it does it", () => {
    const result = parseCivicImport(
      file(valid, {
        ...valid,
        id: "CIV-TZ-01",
        country: "Tanzania",
        languageVersions: { sw: { title: "Kichwa", explanation: "Maelezo ya kutosha hapa." } }
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const summary = describeImport(result.items);
    expect(summary).toContain("2 items");
    expect(summary).toContain("Ghana, Tanzania");
    expect(summary).toContain("translations: sw");
  });
});
