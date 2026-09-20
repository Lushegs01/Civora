import { describe, expect, it } from "vitest";
import { findCandidates, locationSimilarity, scoreMatch, textSimilarity, type MatchableCase } from "@/lib/matching";

// The matching engine's job is to propose, carefully. These tests pin the two
// failure modes that matter: missing a real corroboration, and — much worse —
// asserting one that isn't there.

const baseTime = new Date("2026-03-01T20:00:00Z");

function candidate(over: Partial<MatchableCase> = {}): MatchableCase {
  return {
    id: "c1",
    publicCaseId: "CS-1042",
    category: "safety",
    narrative:
      "Exposed wiring and a scorched wall panel on the north side of the residences walkway near Halls B entrance.",
    locationGeneral: "North walkway, student residences, Halls B entrance",
    incidentAt: baseTime,
    updatedAt: baseTime,
    ...over
  };
}

describe("location similarity", () => {
  it("does not treat a shared generic place word as a match", () => {
    const { score, specificShared } = locationSimilarity("Market road", "Market road");
    // Identical strings still score, but they contribute no specific tokens…
    expect(specificShared).toBe(0);
    expect(score).toBeGreaterThan(0);
  });

  it("weights a distinctive place name far above a generic one", () => {
    const generic = locationSimilarity("the market road", "the station road");
    const specific = locationSimilarity("Kessler Road junction", "Kessler Road junction");
    expect(specific.score).toBeGreaterThan(generic.score);
    expect(specific.specificShared).toBeGreaterThan(0);
  });

  it("returns nothing for empty input", () => {
    expect(locationSimilarity(null, "Kessler Road").score).toBe(0);
    expect(locationSimilarity("Kessler Road", "").score).toBe(0);
  });
});

describe("text similarity", () => {
  it("ignores stop words", () => {
    const { shared } = textSimilarity(
      "there was a thing that happened with the people around the area",
      "there was a thing that happened with the people around the area"
    );
    expect(shared).toBe(0);
  });

  it("refuses to score very short texts", () => {
    expect(textSimilarity("water gone", "water gone").score).toBe(0);
  });
});

describe("scoreMatch", () => {
  it("proposes a link for two reports about the same incident", () => {
    const match = scoreMatch(
      {
        category: "safety",
        narrative:
          "Sparking from the wall panel on the walkway by Halls B again tonight. Cover is still off and the wall above it is scorched.",
        locationGeneral: "North walkway, Halls B entrance, student residences",
        incidentAt: new Date(baseTime.getTime() + 6 * 3_600_000)
      },
      candidate()
    );
    expect(match).not.toBeNull();
    expect(match!.score).toBeGreaterThanOrEqual(0.55);
    expect(match!.signals.locationSpecificTokens).toBeGreaterThan(0);
  });

  it("never matches across categories", () => {
    const match = scoreMatch(
      {
        category: "service",
        narrative: candidate().narrative,
        locationGeneral: candidate().locationGeneral,
        incidentAt: baseTime
      },
      candidate()
    );
    expect(match).toBeNull();
  });

  it("does not match two unrelated reports that merely share a generic place", () => {
    const market = candidate({
      id: "c2",
      publicCaseId: "CS-2000",
      category: "community",
      narrative: "Rubbish has been piling up behind the stalls for a week and nobody has collected it.",
      locationGeneral: "Market road"
    });
    const match = scoreMatch(
      {
        category: "community",
        narrative: "A group has been playing loud music late into the night, keeping residents awake.",
        locationGeneral: "Market road",
        incidentAt: baseTime
      },
      market
    );
    expect(match).toBeNull();
  });

  it("does not match outside the time window", () => {
    const match = scoreMatch(
      {
        category: "safety",
        narrative: candidate().narrative,
        locationGeneral: candidate().locationGeneral,
        incidentAt: new Date(baseTime.getTime() + 10 * 24 * 3_600_000)
      },
      candidate()
    );
    expect(match).toBeNull();
  });

  it("records per-signal detail so a person can judge the proposal", () => {
    const match = scoreMatch(
      {
        category: "safety",
        narrative: candidate().narrative,
        locationGeneral: candidate().locationGeneral,
        incidentAt: baseTime
      },
      candidate()
    );
    expect(match!.signals).toMatchObject({
      category: true,
      timeScore: expect.any(Number),
      locationScore: expect.any(Number),
      textScore: expect.any(Number)
    });
  });
});

describe("findCandidates", () => {
  it("ranks the strongest candidate first and caps the list", () => {
    const strong = candidate({ id: "strong", publicCaseId: "CS-1" });
    const weak = candidate({
      id: "weak",
      publicCaseId: "CS-2",
      narrative: "A different safety concern about a broken handrail on the residences walkway staircase.",
      locationGeneral: "North walkway, student residences"
    });
    const results = findCandidates(
      {
        category: "safety",
        narrative: candidate().narrative,
        locationGeneral: candidate().locationGeneral,
        incidentAt: baseTime
      },
      [weak, strong],
      1
    );
    expect(results).toHaveLength(1);
    expect(results[0].target.id).toBe("strong");
  });
});
