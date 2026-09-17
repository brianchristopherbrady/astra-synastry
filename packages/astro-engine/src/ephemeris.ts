import sweph from "sweph";
import type { PointName } from "@astro/shared";

/**
 * Calculation precision mode.
 * "moshier" needs no external data files (default, good enough for astrology to arc-second precision).
 * "swiss" uses full Swiss Ephemeris data files placed via configureEphemeris({ ephePath }).
 */
export type EphemerisMode = "swiss" | "moshier";

let currentMode: EphemerisMode = "moshier";

export function configureEphemeris(opts: { mode?: EphemerisMode; ephePath?: string }): void {
  if (opts.ephePath) {
    sweph.set_ephe_path(opts.ephePath);
  }
  if (opts.mode) {
    currentMode = opts.mode;
  }
}

export function baseEphemerisFlag(): number {
  return currentMode === "swiss" ? sweph.constants.SEFLG_SWIEPH : sweph.constants.SEFLG_MOSEPH;
}

const BODY_IDS: Partial<Record<PointName, number>> = {
  sun: sweph.constants.SE_SUN,
  moon: sweph.constants.SE_MOON,
  mercury: sweph.constants.SE_MERCURY,
  venus: sweph.constants.SE_VENUS,
  mars: sweph.constants.SE_MARS,
  jupiter: sweph.constants.SE_JUPITER,
  saturn: sweph.constants.SE_SATURN,
  uranus: sweph.constants.SE_URANUS,
  neptune: sweph.constants.SE_NEPTUNE,
  pluto: sweph.constants.SE_PLUTO,
  northNode: sweph.constants.SE_MEAN_NODE,
  chiron: sweph.constants.SE_CHIRON,
  lilith: sweph.constants.SE_MEAN_APOG,
};

export interface RawBodyPosition {
  longitude: number;
  latitude: number;
  distanceAu: number;
  speedLongitude: number;
}

/** Converts a JS UTC Date to a Julian Day in universal time, as required by all sweph `_ut` calls. */
export function utcToJulianDay(utcDate: Date): number {
  const result = sweph.utc_to_jd(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth() + 1,
    utcDate.getUTCDate(),
    utcDate.getUTCHours(),
    utcDate.getUTCMinutes(),
    utcDate.getUTCSeconds() + utcDate.getUTCMilliseconds() / 1000,
    sweph.constants.SE_GREG_CAL,
  );
  if (result.flag !== sweph.constants.OK) {
    throw new Error(`Failed to convert date to Julian day: ${result.error}`);
  }
  return result.data[1];
}

export function calcBody(point: PointName, tjdUt: number): RawBodyPosition {
  const id = BODY_IDS[point];
  if (id === undefined) {
    throw new Error(`No ephemeris body mapping for point: ${point}`);
  }
  const flags = baseEphemerisFlag() | sweph.constants.SEFLG_SPEED;
  const result = sweph.calc_ut(tjdUt, id, flags);
  if (result.flag === sweph.constants.ERR) {
    throw new Error(`Ephemeris calculation failed for ${point}: ${result.error}`);
  }
  const [lon, lat, dist, lonSpd] = result.data;
  return { longitude: lon, latitude: lat, distanceAu: dist, speedLongitude: lonSpd };
}

/** True obliquity of the ecliptic at a given instant, needed for composite/davison house math. */
export function eclipticObliquity(tjdUt: number): number {
  const result = sweph.calc_ut(tjdUt, sweph.constants.SE_ECL_NUT, baseEphemerisFlag());
  if (result.flag === sweph.constants.ERR) {
    throw new Error(`Obliquity calculation failed: ${result.error}`);
  }
  return result.data[0];
}

export function southNodeLongitude(northNodeLongitude: number): number {
  return (northNodeLongitude + 180) % 360;
}

export function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Shortest-arc midpoint between two ecliptic longitudes (handles the 0/360 wraparound). */
export function circularMidpoint(lonA: number, lonB: number): number {
  const diff = (((lonB - lonA + 540) % 360) + 360) % 360 - 180;
  return normalizeDegrees(lonA + diff / 2);
}
