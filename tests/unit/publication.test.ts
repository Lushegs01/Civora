import { describe, expect, it } from "vitest";
import { defaultPublicSummary, defaultTitle, publicVisibleFor, screenNewCase } from "@/lib/publication";
import { scanForPersonalData, PUBLIC_REPORTER_LABEL } from "@/lib/privacy";

describe("screening a new case", () => {
  it("holds a safety report for review rather than publishing it", () => {
    const decision = screenNewCase({
      category: "safety",
      narrative: "A wall panel on the walkway is sparking and the cover is missing.",
      locationGeneral: "North walkway",
      hasPreciseCoordinates: false
    });
    expect(decision.publicVisible).toBe(false);
    expect(decision.publicationState).toBe("screening");
    expect(decision.flags).toContain("sensitive-category:safety");
  });

  it("holds anything with allegation language", () => {
    const decision = screenNewCase({
      category: "service",
      narrative: "The supervisor stole the fuel allocation meant for the generators last month.",
      hasPreciseCoordinates: false
    });
    expect(decision.publicVisible).toBe(false);
    expect(decision.flags).toContain("allegation-language");
  });

  it("holds anything containing contact details", () => {
    const decision = screenNewCase({
      category: "infrastructure",
      narrative: "The crossing sign is bent. Call me on 0803 123 4567 if you need more detail.",
      hasPreciseCoordinates: false
    });
    expect(decision.publicVisible).toBe(false);
    expect(decision.flags.some((f) => f.startsWith("contains-"))).toBe(true);
  });

  it("holds a report that carries precise coordinates", () => {
    const decision = screenNewCase({
      category: "infrastructure",
      narrative: "The crossing sign at the entrance is bent and facing the wrong way.",
      hasPreciseCoordinates: true
    });
    expect(decision.flags).toContain("precise-location");
    expect(decision.publicVisible).toBe(false);
  });

  it("publishes a plain low-risk report", () => {
    const decision = screenNewCase({
      category: "infrastructure",
      narrative: "The crossing sign at the market entrance is bent and facing the wrong way.",
      locationGeneral: "Market entrance",
      hasPreciseCoordinates: false
    });
    expect(decision.publicVisible).toBe(true);
    expect(decision.publicationState).toBe("public_case");
    expect(decision.flags).toHaveLength(0);
  });
});

describe("default published text", () => {
  it("describes the category and area without quoting the report", () => {
    const narrative = "Mr Adeyemi threatened my sister outside the hall on Tuesday evening.";
    const summary = defaultPublicSummary({ category: "dispute", locationGeneral: "Elm Ward" });
    expect(summary).not.toContain("Adeyemi");
    expect(summary).not.toContain(narrative);
    expect(summary).toContain("Elm Ward");
  });

  it("produces a title that names nobody", () => {
    expect(defaultTitle({ category: "safety", locationGeneral: "Halls B" })).toBe(
      "Safety concern reported — Halls B"
    );
  });
});

describe("publication flags", () => {
  it("keeps publicVisible in step with the publication state", () => {
    expect(publicVisibleFor("public_case")).toBe(true);
    expect(publicVisibleFor("screening")).toBe(false);
    expect(publicVisibleFor("restricted")).toBe(false);
    expect(publicVisibleFor("private_case")).toBe(false);
    expect(publicVisibleFor("archived")).toBe(false);
  });
});

describe("personal data scanning", () => {
  it("spots emails and phone numbers", () => {
    expect(scanForPersonalData("write to me at someone@example.com").hasEmail).toBe(true);
    expect(scanForPersonalData("ring 0803 123 4567 any time").hasPhone).toBe(true);
  });

  it("leaves ordinary prose alone", () => {
    const scan = scanForPersonalData("The lights along the riverside path have been out since the storm.");
    expect(scan.flags).toHaveLength(0);
  });
});

describe("public reporter labels", () => {
  it("uses a fixed vocabulary that can never contain a name", () => {
    expect(Object.values(PUBLIC_REPORTER_LABEL)).toEqual([
      "Anonymous reporter",
      "Confidential reporter",
      "Identified reporter"
    ]);
  });
});
