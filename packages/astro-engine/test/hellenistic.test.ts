import { describe, expect, it } from "vitest";
import { computeNatalChart } from "../src/natal.js";
import { computeAnnualProfection, computeHellenisticLots, computeHellenisticProfile, determineSect } from "../src/hellenistic.js";

const birthData = {
  localDateTime: "1990-06-15T14:30:00",
  timezone: "America/New_York",
  latitude: 40.7128,
  longitude: -74.006,
  locationName: "New York, NY",
  timeUnknown: false,
};

describe("sidereal vs tropical zodiac", () => {
  it("shifts every point by roughly the Lahiri ayanamsa when sidereal", () => {
    const tropical = computeNatalChart(birthData, "placidus", "tropical");
    const sidereal = computeNatalChart(birthData, "placidus", "sidereal", "lahiri");

    expect(tropical.zodiacMode).toBe("tropical");
    expect(sidereal.zodiacMode).toBe("sidereal");
    expect(sidereal.ayanamsa).toBe("lahiri");

    const sunTropical = tropical.points.sun!.longitude;
    const sunSidereal = sidereal.points.sun!.longitude;
    const diff = ((sunTropical - sunSidereal + 540) % 360) - 180;
    // Lahiri ayanamsa is roughly 24 degrees in this era.
    expect(Math.abs(diff)).toBeGreaterThan(23);
    expect(Math.abs(diff)).toBeLessThan(25);
  });

  it("defaults to tropical when zodiacMode is omitted", () => {
    const chart = computeNatalChart(birthData);
    expect(chart.zodiacMode).toBe("tropical");
    expect(chart.ayanamsa).toBeUndefined();
  });
});

describe("Hellenistic techniques", () => {
  const chart = computeNatalChart(birthData);

  it("determines sect consistently with the Sun's house", () => {
    const sect = determineSect(chart);
    expect(sect).not.toBeNull();
    const sunHouse = chart.points.sun!.house!;
    const expectedSect = sunHouse >= 7 && sunHouse <= 12 ? "day" : "night";
    expect(sect!.sect).toBe(expectedSect);
  });

  it("computes six classical lots with valid longitudes", () => {
    const lots = computeHellenisticLots(chart);
    expect(lots).not.toBeNull();
    expect(lots).toHaveLength(6);
    for (const lot of lots!) {
      expect(lot.longitude).toBeGreaterThanOrEqual(0);
      expect(lot.longitude).toBeLessThan(360);
      expect(lot.house).toBeGreaterThanOrEqual(1);
      expect(lot.house).toBeLessThanOrEqual(12);
    }
  });

  it("computes an annual profection that cycles through all 12 houses", () => {
    const birthInstant = new Date(chart.utcDateTime);
    const at0 = computeAnnualProfection(chart, birthInstant);
    expect(at0!.age).toBe(0);
    expect(at0!.profectedHouse).toBe(1);

    const twelveYearsLater = new Date(birthInstant.getTime() + 12 * 365.25 * 86_400_000);
    const at12 = computeAnnualProfection(chart, twelveYearsLater);
    expect(at12!.age).toBe(12);
    expect(at12!.profectedHouse).toBe(1);
    expect(at12!.profectedSign).toBe(at0!.profectedSign);
  });

  it("bundles sect, lots, and profection into a single profile", () => {
    const profile = computeHellenisticProfile(chart);
    expect(profile).not.toBeNull();
    expect(profile!.lots).toHaveLength(6);
    expect(profile!.sect.sect === "day" || profile!.sect.sect === "night").toBe(true);
  });

  it("returns null when birth time is unknown (no houses/Ascendant)", () => {
    const noTimeChart = computeNatalChart({ ...birthData, timeUnknown: true });
    expect(computeHellenisticProfile(noTimeChart)).toBeNull();
  });
});
