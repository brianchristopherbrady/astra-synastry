import { describe, expect, it } from "vitest";
import { computeNatalChart } from "../src/natal.js";
import { computeSynastry } from "../src/synastry.js";
import { computeTransitReport } from "../src/transits.js";
import { computeSecondaryProgression } from "../src/progressions.js";

const personA = computeNatalChart({
  localDateTime: "1990-06-15T14:30:00",
  timezone: "America/New_York",
  latitude: 40.7128,
  longitude: -74.006,
  locationName: "New York, NY",
  timeUnknown: false,
});

const personB = computeNatalChart({
  localDateTime: "1992-11-03T08:15:00",
  timezone: "Europe/London",
  latitude: 51.5072,
  longitude: -0.1276,
  locationName: "London, UK",
  timeUnknown: false,
});

describe("synastry engine", () => {
  it("computes cross-aspects, overlays, composite/davison charts and a bounded score", () => {
    const synastry = computeSynastry(personA, personB);

    expect(synastry.crossAspects.length).toBeGreaterThan(0);
    expect(synastry.houseOverlayAtoB.length).toBeGreaterThan(0);
    expect(synastry.houseOverlayBtoA.length).toBeGreaterThan(0);
    expect(synastry.compositeChart.points.sun).toBeDefined();
    expect(synastry.davisonChart.points.sun).toBeDefined();

    expect(synastry.compatibilityScore.overall).toBeGreaterThanOrEqual(0);
    expect(synastry.compatibilityScore.overall).toBeLessThanOrEqual(100);
    for (const value of Object.values(synastry.compatibilityScore.categories)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it("computes a transit report with hits to both natal charts and the composite", () => {
    const synastry = computeSynastry(personA, personB);
    const report = computeTransitReport(personA, personB, synastry.compositeChart, new Date("2026-01-01T00:00:00Z"));

    expect(report.transitingChart.points.sun).toBeDefined();
    expect(Array.isArray(report.hitsToPersonA)).toBe(true);
    expect(Array.isArray(report.hitsToPersonB)).toBe(true);
    expect(Array.isArray(report.hitsToComposite)).toBe(true);
  });

  it("computes secondary progressions for a given date", () => {
    const progressed = computeSecondaryProgression(personA, new Date("2026-01-01T00:00:00Z"));
    expect(progressed.chart.points.sun).toBeDefined();
  });
});
