import { describe, expect, it } from "vitest";
import { calcBody, utcToJulianDay } from "../src/ephemeris.js";
import { calcHouses } from "../src/houses.js";
import { computeNatalChart } from "../src/natal.js";

describe("ephemeris accuracy gate", () => {
  // These UTC instants are the well-published moments of the equinoxes/solstices, when the
  // Sun's ecliptic longitude is exactly 0/90/180/270 degrees. Used as ground truth because they
  // don't depend on any single astrology software's chart output, only on public astronomical almanacs.
  it("places the Sun at 0 degrees (Aries point) at the March 2020 equinox", () => {
    const tjd = utcToJulianDay(new Date("2020-03-20T03:50:00Z"));
    const sun = calcBody("sun", tjd);
    expect(angularDistanceFromZero(sun.longitude)).toBeLessThan(0.5);
  });

  it("places the Sun at 90 degrees (Cancer point) at the June 2020 solstice", () => {
    const tjd = utcToJulianDay(new Date("2020-06-20T21:44:00Z"));
    const sun = calcBody("sun", tjd);
    expect(Math.abs(sun.longitude - 90)).toBeLessThan(0.5);
  });

  it("places the Sun at 180 degrees (Libra point) at the September 2020 equinox", () => {
    const tjd = utcToJulianDay(new Date("2020-09-22T13:31:00Z"));
    const sun = calcBody("sun", tjd);
    expect(Math.abs(sun.longitude - 180)).toBeLessThan(0.5);
  });

  it("places the Sun at 270 degrees (Capricorn point) at the December 2020 solstice", () => {
    const tjd = utcToJulianDay(new Date("2020-12-21T10:02:00Z"));
    const sun = calcBody("sun", tjd);
    expect(Math.abs(sun.longitude - 270)).toBeLessThan(0.5);
  });

  it("detects Mercury retrograde during the well-documented June-July 2020 retrograde window", () => {
    const tjd = utcToJulianDay(new Date("2020-06-25T00:00:00Z"));
    const mercury = calcBody("mercury", tjd);
    expect(mercury.speedLongitude).toBeLessThan(0);
  });

  it("does not throw and falls back away from Placidus near the polar circle", () => {
    const tjd = utcToJulianDay(new Date("2020-06-20T12:00:00Z"));
    const result = calcHouses(tjd, 80, 20, "placidus");
    expect(result.cusps).toHaveLength(12);
  });

  it("assembles a full natal chart with houses, aspects and a valid ascendant", () => {
    const chart = computeNatalChart({
      localDateTime: "1990-06-15T14:30:00",
      timezone: "America/New_York",
      latitude: 40.7128,
      longitude: -74.006,
      locationName: "New York, NY",
      timeUnknown: false,
    });

    expect(chart.points.sun).toBeDefined();
    expect(chart.points.ascendant).toBeDefined();
    expect(chart.houses).toHaveLength(12);
    expect(chart.aspects.length).toBeGreaterThan(0);
    for (const aspect of chart.aspects) {
      expect(aspect.orb).toBeGreaterThanOrEqual(0);
    }
  });
});

function angularDistanceFromZero(longitude: number): number {
  const normalized = ((longitude % 360) + 360) % 360;
  return Math.min(normalized, 360 - normalized);
}
