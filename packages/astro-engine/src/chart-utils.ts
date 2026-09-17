import { signForLongitude } from "@astro/shared";
import type { HouseCusp, PointName, PointPosition } from "@astro/shared";
import { normalizeDegrees } from "./ephemeris.js";

export function toPointPosition(
  point: PointName,
  raw: { longitude: number; latitude: number; speedLongitude: number },
  house: number | null = null,
): PointPosition {
  const longitude = normalizeDegrees(raw.longitude);
  const signInfo = signForLongitude(longitude);
  return {
    point,
    longitude,
    latitude: raw.latitude,
    speedLongitude: raw.speedLongitude,
    sign: signInfo.sign,
    signDegree: longitude - signInfo.startLongitude,
    house,
    retrograde: raw.speedLongitude < 0,
  };
}

/** True if `longitude` falls within the circular [start, end) span (handles wraparound past 360deg). */
function isWithinCircularSpan(longitude: number, start: number, end: number): boolean {
  const relativeLon = normalizeDegrees(longitude - start);
  const span = normalizeDegrees(end - start);
  return relativeLon < (span === 0 ? 360 : span);
}

export function houseOfLongitude(longitude: number, cusps: HouseCusp[]): number {
  for (let i = 0; i < cusps.length; i++) {
    const start = cusps[i]!.longitude;
    const end = cusps[(i + 1) % cusps.length]!.longitude;
    if (isWithinCircularSpan(longitude, start, end)) {
      return cusps[i]!.house;
    }
  }
  return cusps[cusps.length - 1]!.house;
}

export function assignHousesToPoints(points: Partial<Record<PointName, PointPosition>>, houses: HouseCusp[]): void {
  for (const position of Object.values(points)) {
    if (position) {
      position.house = houseOfLongitude(position.longitude, houses);
    }
  }
}

/**
 * Part of Fortune: Asc + Moon - Sun by day (Sun above horizon, houses 7-12),
 * Asc - Moon + Sun by night (Sun below horizon, houses 1-6).
 */
export function computePartOfFortune(
  ascendant: number,
  sun: PointPosition,
  moon: PointPosition,
): number {
  const isDayChart = sun.house !== null && sun.house >= 7 && sun.house <= 12;
  const longitude = isDayChart ? ascendant + moon.longitude - sun.longitude : ascendant - moon.longitude + sun.longitude;
  return normalizeDegrees(longitude);
}
