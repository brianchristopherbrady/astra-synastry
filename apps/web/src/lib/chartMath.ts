import type { AspectName } from "@astro/shared";

/** Converts an ecliptic longitude to SVG (x,y), with the Ascendant fixed at the 9 o'clock position. */
export function longitudeToPoint(
  longitude: number,
  ascendant: number,
  radius: number,
  center: number,
): { x: number; y: number } {
  const angleDeg = 180 - (longitude - ascendant);
  const angleRad = (angleDeg * Math.PI) / 180;
  return { x: center + radius * Math.cos(angleRad), y: center - radius * Math.sin(angleRad) };
}

export const ASPECT_LINE_COLOR: Record<AspectName, string> = {
  conjunction: "#94a3b8",
  opposition: "#ef4444",
  square: "#ef4444",
  trine: "#22c55e",
  sextile: "#38bdf8",
  semisextile: "#64748b",
  semisquare: "#f97316",
  sesquiquadrate: "#f97316",
  quincunx: "#a855f7",
  quintile: "#eab308",
  biquintile: "#eab308",
  septile: "#64748b",
};

export function aspectStrokeWidth(orb: number): number {
  return Math.max(0.5, 2.2 - orb / 4);
}

export function aspectOpacity(orb: number): number {
  return Math.max(0.25, 1 - orb / 10);
}
