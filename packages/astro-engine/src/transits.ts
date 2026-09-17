import { aspectDefinition } from "@astro/shared";
import type { ChartData, HouseOverlayEntry, NatalTransitReport, PointName, PointPosition, TransitHit, TransitReport } from "@astro/shared";
import { assembleChart } from "./natal.js";
import { angularSeparation, findAspects } from "./aspects.js";
import { houseOfLongitude } from "./chart-utils.js";

const DAY_MS = 86_400_000;

function buildTransitingChart(atDate: Date): ChartData {
  return assembleChart(
    {
      localDateTime: atDate.toISOString(),
      timezone: "UTC",
      latitude: 0,
      longitude: 0,
      locationName: "Geocentric transit positions",
      timeUnknown: true,
    },
    atDate,
    "wholeSign",
  );
}

/** Approximates when a transit hit becomes exact/enters/leaves orb using the transiting point's daily speed. */
function estimateTiming(baseDate: Date, transitPos: PointPosition, natalPos: PointPosition, aspectAngle: number, orbLimit: number) {
  const relativeSpeed = transitPos.speedLongitude - natalPos.speedLongitude; // deg/day
  const currentSep = angularSeparation(transitPos.longitude, natalPos.longitude);
  const signedOrb = currentSep - aspectAngle;

  if (Math.abs(relativeSpeed) < 1e-6) {
    return { exactDate: baseDate, ingressDate: null, egressDate: null };
  }

  const daysToExact = -signedOrb / relativeSpeed;
  const daysToIngress = (-orbLimit - signedOrb) / relativeSpeed;
  const daysToEgress = (orbLimit - signedOrb) / relativeSpeed;
  const toDate = (days: number) => new Date(baseDate.getTime() + days * DAY_MS);

  const [ingressDays, egressDays] = daysToIngress < daysToEgress ? [daysToIngress, daysToEgress] : [daysToEgress, daysToIngress];

  return {
    exactDate: toDate(daysToExact),
    ingressDate: toDate(ingressDays),
    egressDate: toDate(egressDays),
  };
}

function toTransitHits(natalChart: ChartData, transitingChart: ChartData, baseDate: Date): TransitHit[] {
  const hits = findAspects(transitingChart.points, natalChart.points);
  return hits.map((hit) => {
    const transitPos = transitingChart.points[hit.pointA]!;
    const natalPos = natalChart.points[hit.pointB]!;
    const def = aspectDefinition(hit.aspect);
    const timing = estimateTiming(baseDate, transitPos, natalPos, def.angle, def.defaultOrb);
    return {
      ...hit,
      exactDate: timing.exactDate.toISOString(),
      ingressDate: timing.ingressDate?.toISOString() ?? null,
      egressDate: timing.egressDate?.toISOString() ?? null,
    };
  });
}

export function computeTransitReport(
  chartA: ChartData,
  chartB: ChartData,
  compositeChart: ChartData,
  atDate: Date = new Date(),
): TransitReport {
  const transitingChart = buildTransitingChart(atDate);

  return {
    generatedAt: atDate.toISOString(),
    transitingChart,
    hitsToPersonA: toTransitHits(chartA, transitingChart, atDate),
    hitsToPersonB: toTransitHits(chartB, transitingChart, atDate),
    hitsToComposite: toTransitHits(compositeChart, transitingChart, atDate),
  };
}

/** Current (or chosen-date) transits to a single natal chart \u2014 used outside synastry. */
export function computeTransitsToChart(natalChart: ChartData, atDate: Date = new Date()): NatalTransitReport {
  const transitingChart = buildTransitingChart(atDate);
  const houseOverlay: HouseOverlayEntry[] = [];
  if (natalChart.houses) {
    for (const [name, pos] of Object.entries(transitingChart.points) as [PointName, PointPosition | undefined][]) {
      if (!pos) continue;
      houseOverlay.push({ point: name, house: houseOfLongitude(pos.longitude, natalChart.houses) });
    }
  }
  return {
    generatedAt: atDate.toISOString(),
    transitingChart,
    hits: toTransitHits(natalChart, transitingChart, atDate),
    houseOverlay,
  };
}
