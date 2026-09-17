import type { BirthData, ChartData, ProgressedChart } from "@astro/shared";
import { assembleChart } from "./natal.js";

const DAY_MS = 86_400_000;

/** Secondary progressions: the "day for a year" rule (1 day of ephemeris motion after birth = 1 year of life). */
export function computeSecondaryProgression(natalChart: ChartData, forDate: Date): ProgressedChart {
  const birthInstant = new Date(natalChart.utcDateTime).getTime();
  const ageInYears = (forDate.getTime() - birthInstant) / (365.25 * DAY_MS);
  const progressedInstant = new Date(birthInstant + ageInYears * DAY_MS);

  const syntheticBirthData: BirthData = {
    ...natalChart.birthData,
    localDateTime: progressedInstant.toISOString(),
    timezone: "UTC",
  };

  const chart: ChartData = assembleChart(syntheticBirthData, progressedInstant, natalChart.houseSystem);
  return { forDate: forDate.toISOString(), personId: natalChart.personId ?? "", chart };
}
