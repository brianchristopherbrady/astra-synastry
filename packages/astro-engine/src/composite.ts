import { signForLongitude } from "@astro/shared";
import type { ChartData, HouseCusp, PointName, PointPosition } from "@astro/shared";
import { calcCompositeHouses } from "./houses.js";
import { circularMidpoint } from "./ephemeris.js";
import { assignHousesToPoints, toPointPosition } from "./chart-utils.js";
import { findNatalAspects } from "./aspects.js";
import { detectPatterns } from "./patterns.js";

const ANGLE_POINTS = new Set<PointName>(["ascendant", "midheaven", "vertex"]);

/** Composite chart via the classic midpoint method: each point is the near-midpoint of the two natal placements. */
export function computeCompositeChart(chartA: ChartData, chartB: ChartData): ChartData {
  const points: Partial<Record<PointName, PointPosition>> = {};

  for (const name of Object.keys(chartA.points) as PointName[]) {
    if (ANGLE_POINTS.has(name)) continue;
    const a = chartA.points[name];
    const b = chartB.points[name];
    if (!a || !b) continue;
    const longitude = circularMidpoint(a.longitude, b.longitude);
    points[name] = toPointPosition(name, {
      longitude,
      latitude: (a.latitude + b.latitude) / 2,
      speedLongitude: (a.speedLongitude + b.speedLongitude) / 2,
    });
  }

  let houses: HouseCusp[] | null = null;
  if (chartA.houses && chartB.houses) {
    const houseResult = calcCompositeHouses(chartA, chartB);
    houses = houseResult.cusps.map((longitude, idx) => ({
      house: idx + 1,
      longitude,
      sign: signForLongitude(longitude).sign,
      signDegree: longitude % 30,
    }));
    points.ascendant = toPointPosition("ascendant", { longitude: houseResult.ascendant, latitude: 0, speedLongitude: 0 }, 1);
    points.midheaven = toPointPosition("midheaven", { longitude: houseResult.midheaven, latitude: 0, speedLongitude: 0 });
    points.vertex = toPointPosition("vertex", { longitude: houseResult.vertex, latitude: 0, speedLongitude: 0 });
    assignHousesToPoints(points, houses);
  }

  const aspects = findNatalAspects(points);
  const patterns = detectPatterns(points, aspects);

  return {
    birthData: {
      ...chartA.birthData,
      locationName: `Composite of ${chartA.birthData.locationName} & ${chartB.birthData.locationName}`,
    },
    utcDateTime: chartA.utcDateTime,
    houseSystem: chartA.houseSystem,
    points,
    houses,
    aspects,
    patterns,
  };
}
