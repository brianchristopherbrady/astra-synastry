import { ASPECT_DEFINITIONS, LUMINARY_ORB_BONUS } from "@astro/shared";
import type { AspectHit, PointName, PointPosition } from "@astro/shared";

export interface AspectOptions {
  includeMinor: boolean;
  /** Scales all orbs uniformly; e.g. 0.5 for a tighter "exact aspects only" view. */
  orbMultiplier: number;
}

const DEFAULT_OPTIONS: AspectOptions = { includeMinor: true, orbMultiplier: 1 };

export function angularSeparation(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function computeApplying(posA: PointPosition, posB: PointPosition, aspectAngle: number): boolean | null {
  const relativeSpeed = posA.speedLongitude - posB.speedLongitude;
  if (relativeSpeed === 0) return null;
  const currentOrb = Math.abs(angularSeparation(posA.longitude, posB.longitude) - aspectAngle);
  const stepDays = 0.5;
  const futureSep = angularSeparation(
    posA.longitude + posA.speedLongitude * stepDays,
    posB.longitude + posB.speedLongitude * stepDays,
  );
  const futureOrb = Math.abs(futureSep - aspectAngle);
  return futureOrb < currentOrb;
}

function matchAspect(
  nameA: PointName,
  posA: PointPosition,
  nameB: PointName,
  posB: PointPosition,
  opts: AspectOptions,
): AspectHit | null {
  const sep = angularSeparation(posA.longitude, posB.longitude);
  const isLuminary = nameA === "sun" || nameA === "moon" || nameB === "sun" || nameB === "moon";
  let best: AspectHit | null = null;
  for (const def of ASPECT_DEFINITIONS) {
    if (!opts.includeMinor && def.category === "minor") continue;
    const maxOrb = (def.defaultOrb + (isLuminary ? LUMINARY_ORB_BONUS : 0)) * opts.orbMultiplier;
    const orb = Math.abs(sep - def.angle);
    if (orb <= maxOrb && (!best || orb < best.orb)) {
      best = {
        pointA: nameA,
        pointB: nameB,
        aspect: def.aspect,
        orb: Number(orb.toFixed(3)),
        exact: orb <= 1,
        applying: computeApplying(posA, posB, def.angle),
      };
    }
  }
  return best;
}

/** Aspects between two distinct point sets (e.g. synastry cross-aspects or transit-to-natal hits). */
export function findAspects(
  pointsA: Partial<Record<PointName, PointPosition>>,
  pointsB: Partial<Record<PointName, PointPosition>>,
  options: Partial<AspectOptions> = {},
): AspectHit[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const hits: AspectHit[] = [];
  for (const [nameA, posA] of Object.entries(pointsA) as [PointName, PointPosition][]) {
    for (const [nameB, posB] of Object.entries(pointsB) as [PointName, PointPosition][]) {
      const hit = matchAspect(nameA, posA, nameB, posB, opts);
      if (hit) hits.push(hit);
    }
  }
  return hits;
}

/** Aspects within a single chart's own points (each unordered pair considered once). */
export function findNatalAspects(
  points: Partial<Record<PointName, PointPosition>>,
  options: Partial<AspectOptions> = {},
): AspectHit[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const entries = Object.entries(points) as [PointName, PointPosition][];
  const hits: AspectHit[] = [];
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [nameA, posA] = entries[i]!;
      const [nameB, posB] = entries[j]!;
      const hit = matchAspect(nameA, posA, nameB, posB, opts);
      if (hit) hits.push(hit);
    }
  }
  return hits;
}
