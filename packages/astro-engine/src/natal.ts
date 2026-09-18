import { signForLongitude } from "@astro/shared";
import type { Ayanamsa, BirthData, ChartData, HouseCusp, HouseSystem, PointName, PointPosition, ZodiacMode } from "@astro/shared";
import { calcBody, southNodeLongitude, utcToJulianDay, zodiacFlag } from "./ephemeris.js";
import { calcHouses } from "./houses.js";
import { assignHousesToPoints, computePartOfFortune, toPointPosition } from "./chart-utils.js";
import { findNatalAspects } from "./aspects.js";
import { detectPatterns } from "./patterns.js";
import { resolveBirthDataToUtc } from "./geo.js";

// Always computable via the built-in Moshier approximation (no ephemeris data files required).
const REQUIRED_BODY_POINTS: PointName[] = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "northNode",
  "lilith",
];

// Chiron is a real minor planet; Moshier has no theory for it, so it needs an ephemeris data file
// (configureEphemeris({ mode: "swiss", ephePath })). Skip it gracefully when that file isn't installed.
const OPTIONAL_BODY_POINTS: PointName[] = ["chiron"];

/** Assembles a full chart for an exact UTC instant + location. Shared by natal, davison and progression calculations. */
export function assembleChart(
  birthData: BirthData,
  utcDate: Date,
  houseSystem: HouseSystem,
  zodiacMode: ZodiacMode = "tropical",
  ayanamsa: Ayanamsa = "lahiri",
): ChartData {
  const tjdUt = utcToJulianDay(utcDate);
  const extraFlags = zodiacFlag(zodiacMode, ayanamsa);

  const points: Partial<Record<PointName, PointPosition>> = {};
  for (const point of REQUIRED_BODY_POINTS) {
    points[point] = toPointPosition(point, calcBody(point, tjdUt, extraFlags));
  }
  for (const point of OPTIONAL_BODY_POINTS) {
    try {
      points[point] = toPointPosition(point, calcBody(point, tjdUt, extraFlags));
    } catch {
      // no ephemeris data file available for this body; omit it rather than failing the whole chart
    }
  }
  const northNode = points.northNode!;
  points.southNode = toPointPosition("southNode", {
    longitude: southNodeLongitude(northNode.longitude),
    latitude: -northNode.latitude,
    speedLongitude: northNode.speedLongitude,
  });

  let houses: HouseCusp[] | null = null;
  if (!birthData.timeUnknown) {
    const houseResult = calcHouses(tjdUt, birthData.latitude, birthData.longitude, houseSystem, extraFlags);
    houses = houseResult.cusps.map((longitude, idx) => ({
      house: idx + 1,
      longitude,
      sign: signForLongitude(longitude).sign,
      signDegree: longitude % 30,
    }));

    assignHousesToPoints(points, houses);

    points.ascendant = toPointPosition("ascendant", { longitude: houseResult.ascendant, latitude: 0, speedLongitude: 0 }, 1);
    points.midheaven = toPointPosition("midheaven", { longitude: houseResult.midheaven, latitude: 0, speedLongitude: 0 });
    points.vertex = toPointPosition("vertex", { longitude: houseResult.vertex, latitude: 0, speedLongitude: 0 });
    assignHousesToPoints(
      { midheaven: points.midheaven, vertex: points.vertex },
      houses,
    );

    const pofLongitude = computePartOfFortune(houseResult.ascendant, points.sun!, points.moon!);
    points.partOfFortune = toPointPosition("partOfFortune", { longitude: pofLongitude, latitude: 0, speedLongitude: 0 });
    assignHousesToPoints({ partOfFortune: points.partOfFortune }, houses);
  }

  const aspects = findNatalAspects(points);
  const patterns = detectPatterns(points, aspects);

  return {
    birthData,
    utcDateTime: utcDate.toISOString(),
    houseSystem,
    zodiacMode,
    ayanamsa: zodiacMode === "sidereal" ? ayanamsa : undefined,
    points,
    houses,
    aspects,
    patterns,
  };
}

export function computeNatalChart(
  birthData: BirthData,
  houseSystem: HouseSystem = "placidus",
  zodiacMode: ZodiacMode = "tropical",
  ayanamsa: Ayanamsa = "lahiri",
): ChartData {
  const utcDate = resolveBirthDataToUtc(birthData);
  return assembleChart(birthData, utcDate, houseSystem, zodiacMode, ayanamsa);
}
