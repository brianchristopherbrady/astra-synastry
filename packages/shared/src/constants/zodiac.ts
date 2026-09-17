import type { Element, Modality, ZodiacSign } from "../types/points.js";

export interface ZodiacSignInfo {
  sign: ZodiacSign;
  name: string;
  glyph: string;
  element: Element;
  modality: Modality;
  ruler: string;
  /** Start ecliptic longitude of this sign, 0-330 in steps of 30. */
  startLongitude: number;
}

export const ZODIAC_SIGNS: ZodiacSignInfo[] = [
  { sign: "aries", name: "Aries", glyph: "\u2648", element: "fire", modality: "cardinal", ruler: "mars", startLongitude: 0 },
  { sign: "taurus", name: "Taurus", glyph: "\u2649", element: "earth", modality: "fixed", ruler: "venus", startLongitude: 30 },
  { sign: "gemini", name: "Gemini", glyph: "\u264A", element: "air", modality: "mutable", ruler: "mercury", startLongitude: 60 },
  { sign: "cancer", name: "Cancer", glyph: "\u264B", element: "water", modality: "cardinal", ruler: "moon", startLongitude: 90 },
  { sign: "leo", name: "Leo", glyph: "\u264C", element: "fire", modality: "fixed", ruler: "sun", startLongitude: 120 },
  { sign: "virgo", name: "Virgo", glyph: "\u264D", element: "earth", modality: "mutable", ruler: "mercury", startLongitude: 150 },
  { sign: "libra", name: "Libra", glyph: "\u264E", element: "air", modality: "cardinal", ruler: "venus", startLongitude: 180 },
  { sign: "scorpio", name: "Scorpio", glyph: "\u264F", element: "water", modality: "fixed", ruler: "pluto", startLongitude: 210 },
  { sign: "sagittarius", name: "Sagittarius", glyph: "\u2650", element: "fire", modality: "mutable", ruler: "jupiter", startLongitude: 240 },
  { sign: "capricorn", name: "Capricorn", glyph: "\u2651", element: "earth", modality: "cardinal", ruler: "saturn", startLongitude: 270 },
  { sign: "aquarius", name: "Aquarius", glyph: "\u2652", element: "air", modality: "fixed", ruler: "uranus", startLongitude: 300 },
  { sign: "pisces", name: "Pisces", glyph: "\u2653", element: "water", modality: "mutable", ruler: "neptune", startLongitude: 330 },
];

export function signForLongitude(longitude: number): ZodiacSignInfo {
  const normalized = ((longitude % 360) + 360) % 360;
  const index = Math.floor(normalized / 30);
  const sign = ZODIAC_SIGNS[index];
  if (!sign) {
    throw new Error(`Invalid ecliptic longitude: ${longitude}`);
  }
  return sign;
}
