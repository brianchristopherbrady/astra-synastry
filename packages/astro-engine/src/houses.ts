import sweph from "sweph";
import type { ChartData, HouseSystem } from "@astro/shared";
import { baseEphemerisFlag, circularMidpoint, eclipticObliquity, utcToJulianDay } from "./ephemeris.js";

const HOUSE_SYSTEM_CODES: Record<HouseSystem, string> = {
  placidus: "P",
  wholeSign: "W",
  koch: "K",
  equal: "E",
  campanus: "C",
  regiomontanus: "R",
};

/** Placidus/Koch cusps become mathematically undefined near the polar circles; fall back to Whole Sign there. */
const POLAR_LATITUDE_LIMIT = 66;

export interface RawHouseResult {
  cusps: number[];
  ascendant: number;
  midheaven: number;
  vertex: number;
  armc: number;
}

function effectiveHouseSystem(system: HouseSystem, latitude: number): HouseSystem {
  if ((system === "placidus" || system === "koch") && Math.abs(latitude) >= POLAR_LATITUDE_LIMIT) {
    return "wholeSign";
  }
  return system;
}

export function calcHouses(tjdUt: number, latitude: number, longitude: number, system: HouseSystem): RawHouseResult {
  const code = HOUSE_SYSTEM_CODES[effectiveHouseSystem(system, latitude)];
  const result = sweph.houses_ex2(tjdUt, 0, latitude, longitude, code as never);
  if (result.flag !== sweph.constants.OK) {
    throw new Error(`House calculation failed: ${result.error ?? "unknown error"}`);
  }
  const houses = result.data.houses as unknown as number[];
  const points = result.data.points as unknown as number[];
  return {
    cusps: houses.slice(0, 12),
    ascendant: points[0]!,
    midheaven: points[1]!,
    vertex: points[3]!,
    armc: points[2]!,
  };
}

/** Composite houses via the standard "midpoint of ARMC + midpoint of latitude" method. */
export function calcCompositeHouses(chartA: ChartData, chartB: ChartData): RawHouseResult {
  const tjdA = utcToJulianDay(new Date(chartA.utcDateTime));
  const tjdB = utcToJulianDay(new Date(chartB.utcDateTime));
  const houseA = calcHouses(tjdA, chartA.birthData.latitude, chartA.birthData.longitude, chartA.houseSystem);
  const houseB = calcHouses(tjdB, chartB.birthData.latitude, chartB.birthData.longitude, chartB.houseSystem);

  const armcMid = circularMidpoint(houseA.armc, houseB.armc);
  const latMid = (chartA.birthData.latitude + chartB.birthData.latitude) / 2;
  const epsMid = (eclipticObliquity(tjdA) + eclipticObliquity(tjdB)) / 2;
  const code = HOUSE_SYSTEM_CODES[effectiveHouseSystem(chartA.houseSystem, latMid)];

  const result = sweph.houses_armc_ex2(armcMid, latMid, epsMid, code as never);
  if (result.flag !== sweph.constants.OK) {
    throw new Error(`Composite house calculation failed: ${result.error ?? "unknown error"}`);
  }
  const houses = result.data.houses as unknown as number[];
  const points = result.data.points as unknown as number[];
  return {
    cusps: houses.slice(0, 12),
    ascendant: points[0]!,
    midheaven: points[1]!,
    vertex: points[3]!,
    armc: armcMid,
  };
}
