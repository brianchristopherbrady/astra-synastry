import type { AspectCategory, AspectName } from "../types/points.js";

export interface AspectDefinition {
  aspect: AspectName;
  angle: number;
  category: AspectCategory;
  /** Default max orb in degrees for this aspect (before per-planet adjustments). */
  defaultOrb: number;
  glyph: string;
  /** Positive = harmonious, negative = challenging, 0 = neutral, for scoring purposes. */
  harmony: number;
}

export const ASPECT_DEFINITIONS: AspectDefinition[] = [
  { aspect: "conjunction", angle: 0, category: "major", defaultOrb: 8, glyph: "\u260C", harmony: 0 },
  { aspect: "sextile", angle: 60, category: "major", defaultOrb: 6, glyph: "\u26B9", harmony: 1 },
  { aspect: "square", angle: 90, category: "major", defaultOrb: 7, glyph: "\u25A1", harmony: -1 },
  { aspect: "trine", angle: 120, category: "major", defaultOrb: 8, glyph: "\u25B3", harmony: 2 },
  { aspect: "opposition", angle: 180, category: "major", defaultOrb: 8, glyph: "\u260D", harmony: -1 },
  { aspect: "semisextile", angle: 30, category: "minor", defaultOrb: 2, glyph: "\u26BA", harmony: 0 },
  { aspect: "semisquare", angle: 45, category: "minor", defaultOrb: 2, glyph: "\u2220", harmony: -1 },
  { aspect: "sesquiquadrate", angle: 135, category: "minor", defaultOrb: 2, glyph: "\u26BC", harmony: -1 },
  { aspect: "quincunx", angle: 150, category: "minor", defaultOrb: 3, glyph: "\u26BB", harmony: -1 },
  { aspect: "quintile", angle: 72, category: "minor", defaultOrb: 2, glyph: "Q", harmony: 1 },
  { aspect: "biquintile", angle: 144, category: "minor", defaultOrb: 2, glyph: "bQ", harmony: 1 },
  { aspect: "septile", angle: 51.4286, category: "minor", defaultOrb: 1.5, glyph: "S", harmony: 0 },
];

export const MAJOR_ASPECTS = ASPECT_DEFINITIONS.filter((a) => a.category === "major");
export const MINOR_ASPECTS = ASPECT_DEFINITIONS.filter((a) => a.category === "minor");

/** Wider orbs for aspects involving the Sun or Moon (luminaries), per traditional practice. */
export const LUMINARY_ORB_BONUS = 2;

export function aspectDefinition(aspect: AspectName): AspectDefinition {
  const def = ASPECT_DEFINITIONS.find((a) => a.aspect === aspect);
  if (!def) throw new Error(`Unknown aspect: ${aspect}`);
  return def;
}
