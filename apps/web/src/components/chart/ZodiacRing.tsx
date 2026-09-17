import { ZODIAC_SIGNS } from "@astro/shared";
import { longitudeToPoint } from "../../lib/chartMath.js";

interface ZodiacRingProps {
  center: number;
  outerRadius: number;
  innerRadius: number;
  ascendant: number;
}

const SIGN_COLORS: Record<string, string> = {
  fire: "#3a1620",
  earth: "#1b2a1a",
  air: "#1a2233",
  water: "#141d33",
};

function wedgePath(cx: number, rOuter: number, rInner: number, lonStart: number, lonEnd: number, ascendant: number): string {
  const o1 = longitudeToPoint(lonStart, ascendant, rOuter, cx);
  const o2 = longitudeToPoint(lonEnd, ascendant, rOuter, cx);
  const i1 = longitudeToPoint(lonEnd, ascendant, rInner, cx);
  const i2 = longitudeToPoint(lonStart, ascendant, rInner, cx);
  return `M ${o1.x} ${o1.y} A ${rOuter} ${rOuter} 0 0 0 ${o2.x} ${o2.y} L ${i1.x} ${i1.y} A ${rInner} ${rInner} 0 0 1 ${i2.x} ${i2.y} Z`;
}

export function ZodiacRing({ center, outerRadius, innerRadius, ascendant }: ZodiacRingProps) {
  const glyphRadius = (outerRadius + innerRadius) / 2;
  return (
    <g>
      {ZODIAC_SIGNS.map((signInfo) => {
        const start = signInfo.startLongitude;
        const end = start + 30;
        const mid = start + 15;
        const glyphPos = longitudeToPoint(mid, ascendant, glyphRadius, center);
        return (
          <g key={signInfo.sign}>
            <path
              d={wedgePath(center, outerRadius, innerRadius, start, end, ascendant)}
              fill={SIGN_COLORS[signInfo.element]}
              stroke="#334155"
              strokeWidth={0.5}
            />
            <text x={glyphPos.x} y={glyphPos.y} fill="#f5c451" fontSize={16} textAnchor="middle" dominantBaseline="middle">
              {signInfo.glyph}
            </text>
            <title>{`${signInfo.name} (${signInfo.element}, ${signInfo.modality})`}</title>
          </g>
        );
      })}
    </g>
  );
}
