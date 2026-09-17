import { POINT_LABELS } from "@astro/shared";
import type { AspectHit, PointName, PointPosition } from "@astro/shared";
import { ASPECT_LINE_COLOR, aspectOpacity, aspectStrokeWidth, longitudeToPoint } from "../../lib/chartMath.js";

interface AspectLinesProps {
  center: number;
  radius: number;
  ascendant: number;
  aspects: AspectHit[];
  pointsA: Partial<Record<PointName, PointPosition>>;
  /** For synastry biwheels: pointB in each hit resolves against this chart's points instead of pointsA. */
  pointsB?: Partial<Record<PointName, PointPosition>>;
  /** Points to omit (aspect lines touching a hidden point are skipped entirely). */
  hiddenPoints?: Set<PointName>;
}

export function AspectLines({ center, radius, ascendant, aspects, pointsA, pointsB, hiddenPoints }: AspectLinesProps) {
  const resolveB = pointsB ?? pointsA;
  return (
    <g>
      {aspects.map((hit, idx) => {
        if (hiddenPoints?.has(hit.pointA) || hiddenPoints?.has(hit.pointB)) return null;
        const posA = pointsA[hit.pointA];
        const posB = resolveB[hit.pointB];
        if (!posA || !posB) return null;
        const p1 = longitudeToPoint(posA.longitude, ascendant, radius, center);
        const p2 = longitudeToPoint(posB.longitude, ascendant, radius, center);
        return (
          <g key={`${hit.pointA}-${hit.pointB}-${idx}`} className="cursor-help">
            {/* Wider invisible line to make hovering for the tooltip easier than the thin visible stroke. */}
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={10} />
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={ASPECT_LINE_COLOR[hit.aspect]}
              strokeWidth={aspectStrokeWidth(hit.orb)}
              opacity={aspectOpacity(hit.orb)}
            />
            <title>{`${POINT_LABELS[hit.pointA]} ${hit.aspect} ${POINT_LABELS[hit.pointB]} (orb ${hit.orb.toFixed(2)}\u00b0)`}</title>
          </g>
        );
      })}
    </g>
  );
}
