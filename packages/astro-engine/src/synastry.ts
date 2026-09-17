import type { ChartData, HouseOverlayEntry, PointName, PointPosition, SynastryData } from "@astro/shared";
import { findAspects } from "./aspects.js";
import { computeCompositeChart } from "./composite.js";
import { computeDavisonChart } from "./davison.js";
import { houseOfLongitude } from "./chart-utils.js";
import { scoreCompatibility } from "./scoring.js";

function computeHouseOverlay(
  sourcePoints: Partial<Record<PointName, PointPosition>>,
  targetHouses: ChartData["houses"],
): HouseOverlayEntry[] {
  if (!targetHouses) return [];
  const overlay: HouseOverlayEntry[] = [];
  for (const [name, pos] of Object.entries(sourcePoints) as [PointName, PointPosition | undefined][]) {
    if (!pos) continue;
    overlay.push({ point: name, house: houseOfLongitude(pos.longitude, targetHouses) });
  }
  return overlay;
}

export function computeSynastry(chartA: ChartData, chartB: ChartData): SynastryData {
  const crossAspects = findAspects(chartA.points, chartB.points);
  const houseOverlayAtoB = computeHouseOverlay(chartA.points, chartB.houses);
  const houseOverlayBtoA = computeHouseOverlay(chartB.points, chartA.houses);
  const compositeChart = computeCompositeChart(chartA, chartB);
  const davisonChart = computeDavisonChart(chartA, chartB);
  const compatibilityScore = scoreCompatibility(chartA, chartB, crossAspects);

  return {
    personAChart: chartA,
    personBChart: chartB,
    crossAspects,
    houseOverlayAtoB,
    houseOverlayBtoA,
    compositeChart,
    davisonChart,
    compatibilityScore,
  };
}
