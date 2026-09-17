import type { HouseCusp } from "@astro/shared";
import { longitudeToPoint } from "../../lib/chartMath.js";

interface HouseRingProps {
  center: number;
  outerRadius: number;
  innerRadius: number;
  ascendant: number;
  houses: HouseCusp[];
}

export function HouseRing({ center, outerRadius, innerRadius, ascendant, houses }: HouseRingProps) {
  const numberRadius = innerRadius + (outerRadius - innerRadius) * 0.15;
  return (
    <g>
      {houses.map((cusp, idx) => {
        const outer = longitudeToPoint(cusp.longitude, ascendant, outerRadius, center);
        const inner = longitudeToPoint(cusp.longitude, ascendant, innerRadius, center);
        const isAngle = cusp.house === 1 || cusp.house === 4 || cusp.house === 7 || cusp.house === 10;
        const nextCusp = houses[(idx + 1) % houses.length]!;
        const span = ((nextCusp.longitude - cusp.longitude + 360) % 360) || 30;
        const midLongitude = cusp.longitude + span / 2;
        const numberPos = longitudeToPoint(midLongitude, ascendant, numberRadius, center);
        return (
          <g key={cusp.house}>
            <line
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke={isAngle ? "#f5c451" : "#475569"}
              strokeWidth={isAngle ? 1.5 : 0.75}
            />
            <text x={numberPos.x} y={numberPos.y} fill="#94a3b8" fontSize={9} textAnchor="middle" dominantBaseline="middle">
              {cusp.house}
            </text>
            <title>{`House ${cusp.house} cusp: ${cusp.sign} ${cusp.signDegree.toFixed(1)}\u00b0`}</title>
          </g>
        );
      })}
    </g>
  );
}
