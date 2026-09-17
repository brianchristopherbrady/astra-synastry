import type { BirthData, ChartData } from "@astro/shared";
import { assembleChart } from "./natal.js";
import { circularMidpoint } from "./ephemeris.js";

/** Davison chart: a real chart computed for the midpoint instant in time AND the midpoint location. */
export function computeDavisonChart(chartA: ChartData, chartB: ChartData): ChartData {
  const timeA = new Date(chartA.utcDateTime).getTime();
  const timeB = new Date(chartB.utcDateTime).getTime();
  const midDate = new Date((timeA + timeB) / 2);

  const midLatitude = (chartA.birthData.latitude + chartB.birthData.latitude) / 2;
  const midLongitude = circularMidpoint(chartA.birthData.longitude, chartB.birthData.longitude);

  const syntheticBirthData: BirthData = {
    localDateTime: midDate.toISOString(),
    timezone: "UTC",
    latitude: midLatitude,
    longitude: midLongitude,
    locationName: `Midpoint of ${chartA.birthData.locationName} & ${chartB.birthData.locationName}`,
    timeUnknown: chartA.birthData.timeUnknown || chartB.birthData.timeUnknown,
  };

  return assembleChart(syntheticBirthData, midDate, chartA.houseSystem);
}
