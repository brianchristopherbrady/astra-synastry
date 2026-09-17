import type { AspectName, HouseSystem, PointName, ZodiacSign } from "./points.js";

/** Birth/event data needed to compute a chart. Time may be unknown (rated-chart mode). */
export interface BirthData {
  /** ISO 8601 local wall-clock time as entered by the user, e.g. "1990-06-15T14:30:00". */
  localDateTime: string;
  /** IANA timezone id, e.g. "America/New_York". Resolved from lat/lng via geo-tz. */
  timezone: string;
  latitude: number;
  longitude: number;
  locationName: string;
  /** True if the user does not know their exact birth time (disables houses/Asc/MC). */
  timeUnknown: boolean;
}

export interface PointPosition {
  point: PointName;
  /** Ecliptic longitude in degrees, 0-360. */
  longitude: number;
  latitude: number;
  /** Degrees/day; negative = retrograde. */
  speedLongitude: number;
  sign: ZodiacSign;
  /** Degrees (0-30) into the sign. */
  signDegree: number;
  /** House number 1-12, or null if time is unknown. */
  house: number | null;
  retrograde: boolean;
}

export interface HouseCusp {
  house: number;
  longitude: number;
  sign: ZodiacSign;
  signDegree: number;
}

export interface AspectHit {
  pointA: PointName;
  pointB: PointName;
  aspect: AspectName;
  /** Absolute orb in degrees between the exact aspect angle and actual separation. */
  orb: number;
  /** True if within a tight (<1deg) orb of exact. */
  exact: boolean;
  /** True if the faster point is approaching exactness rather than moving away. */
  applying: boolean | null;
}

export type AspectPatternType =
  | "stellium"
  | "grandTrine"
  | "tSquare"
  | "yod"
  | "grandCross"
  | "mysticRectangle"
  | "kite";

export interface AspectPattern {
  type: AspectPatternType;
  points: PointName[];
  description: string;
}

export interface ChartData {
  id?: string;
  personId?: string;
  birthData: BirthData;
  /** Resolved UTC instant used for the calculation, ISO 8601. */
  utcDateTime: string;
  houseSystem: HouseSystem;
  points: Partial<Record<PointName, PointPosition>>;
  houses: HouseCusp[] | null;
  aspects: AspectHit[];
  patterns: AspectPattern[];
}
