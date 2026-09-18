/** All calculable chart points (planets, luminaries, angles, and sensitive points). */
export type PointName =
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto"
  | "northNode"
  | "southNode"
  | "chiron"
  | "lilith"
  | "ascendant"
  | "midheaven"
  | "vertex"
  | "partOfFortune";

export const PLANET_POINTS: PointName[] = [
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
];

export const ANGLE_POINTS: PointName[] = ["ascendant", "midheaven", "vertex"];

export const OTHER_POINTS: PointName[] = ["northNode", "southNode", "chiron", "lilith", "partOfFortune"];

export const ALL_POINTS: PointName[] = [...PLANET_POINTS, ...OTHER_POINTS, ...ANGLE_POINTS];

export type ZodiacSign =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

export type Element = "fire" | "earth" | "air" | "water";
export type Modality = "cardinal" | "fixed" | "mutable";

export type HouseSystem = "placidus" | "wholeSign" | "koch" | "equal" | "campanus" | "regiomontanus";

/** Tropical is the modern Western standard (zodiac fixed to the equinoxes). Sidereal (used in Vedic/Jyotish
 * astrology) is offset from tropical by the chosen ayanamsa — the precession-corrected distance between
 * the tropical and sidereal zero points. */
export type ZodiacMode = "tropical" | "sidereal";

/** Named ayanamsa (precession correction) used when zodiacMode is "sidereal". Lahiri is the modern
 * Indian government standard and the most common default. */
export type Ayanamsa = "lahiri" | "raman" | "krishnamurti" | "fagan_bradley" | "yukteshwar";

export type AspectName =
  | "conjunction"
  | "sextile"
  | "square"
  | "trine"
  | "opposition"
  | "semisextile"
  | "semisquare"
  | "sesquiquadrate"
  | "quincunx"
  | "quintile"
  | "biquintile"
  | "septile";

export type AspectCategory = "major" | "minor";
