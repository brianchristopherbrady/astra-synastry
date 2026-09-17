import { POINT_GLYPHS, POINT_LABELS } from "@astro/shared";
import type { PointPosition } from "@astro/shared";
import { longitudeToPoint } from "../../lib/chartMath.js";

interface PlanetMarkerProps {
  center: number;
  radius: number;
  ascendant: number;
  position: PointPosition;
  color?: string;
  /** Prefixes the tooltip, e.g. a person's name in a synastry biwheel. */
  ownerLabel?: string;
}

export function PlanetMarker({ center, radius, ascendant, position, color = "#e2e8f0", ownerLabel }: PlanetMarkerProps) {
  const pos = longitudeToPoint(position.longitude, ascendant, radius, center);
  const prefix = ownerLabel ? `${ownerLabel} \u2013 ` : "";
  const tooltip = `${prefix}${POINT_LABELS[position.point]}: ${position.sign} ${position.signDegree.toFixed(1)}\u00b0${
    position.house ? ` (house ${position.house})` : ""
  }${position.retrograde ? " Rx" : ""}`;
  return (
    <g>
      <circle cx={pos.x} cy={pos.y} r={9} fill="#0b0c1a" stroke={color} strokeWidth={1} />
      <text x={pos.x} y={pos.y} fill={color} fontSize={11} textAnchor="middle" dominantBaseline="middle">
        {POINT_GLYPHS[position.point]}
      </text>
      {position.retrograde && (
        <text x={pos.x + 10} y={pos.y - 8} fill="#ef4444" fontSize={8}>
          R
        </text>
      )}
      <title>{tooltip}</title>
    </g>
  );
}
