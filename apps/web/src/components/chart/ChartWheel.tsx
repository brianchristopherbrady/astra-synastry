import { ALL_POINTS } from "@astro/shared";
import type { AspectHit, ChartData, PointName } from "@astro/shared";
import { ZodiacRing } from "./ZodiacRing.js";
import { HouseRing } from "./HouseRing.js";
import { PlanetMarker } from "./PlanetMarker.js";
import { AspectLines } from "./AspectLines.js";

interface ChartWheelProps {
  /** Internal SVG coordinate system size; the rendered size is fluid (scales to its container). */
  size?: number;
  /** Person A (natal mode: the only chart). */
  innerChart: ChartData;
  /** Person B, for a synastry biwheel. */
  outerChart?: ChartData;
  /** Cross-chart aspects to draw when outerChart is present. */
  crossAspects?: AspectHit[];
  showNatalAspects?: boolean;
  /** Points to hide from both the wheel and any aspect lines touching them. */
  hiddenPoints?: Set<PointName>;
  innerLabel?: string;
  outerLabel?: string;
}

export function ChartWheel({
  size = 560,
  innerChart,
  outerChart,
  crossAspects,
  showNatalAspects = true,
  hiddenPoints,
  innerLabel,
  outerLabel,
}: ChartWheelProps) {
  const center = size / 2;
  const zodiacOuter = center - 8;
  const zodiacInner = zodiacOuter - 32;
  const houseOuter = zodiacInner;
  const houseInner = outerChart ? center * 0.6 : center * 0.55;
  const ascendant = innerChart.points.ascendant?.longitude ?? 0;

  const innerPlanetRadius = houseInner + (zodiacInner - houseInner) * (outerChart ? 0.6 : 0.55);
  const outerPlanetRadius = zodiacInner - 14;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto block w-full max-w-[420px] aspect-square"
      role="img"
      aria-label="Astrology chart wheel"
    >
      <circle cx={center} cy={center} r={zodiacOuter} fill="#12142a" />
      <ZodiacRing center={center} outerRadius={zodiacOuter} innerRadius={zodiacInner} ascendant={ascendant} />
      {innerChart.houses && (
        <HouseRing
          center={center}
          outerRadius={houseOuter}
          innerRadius={houseInner}
          ascendant={ascendant}
          houses={innerChart.houses}
        />
      )}

      {showNatalAspects && !outerChart && (
        <AspectLines
          center={center}
          radius={houseInner}
          ascendant={ascendant}
          aspects={innerChart.aspects}
          pointsA={innerChart.points}
          hiddenPoints={hiddenPoints}
        />
      )}

      {outerChart && crossAspects && (
        <AspectLines
          center={center}
          radius={houseInner}
          ascendant={ascendant}
          aspects={crossAspects}
          pointsA={innerChart.points}
          pointsB={outerChart.points}
          hiddenPoints={hiddenPoints}
        />
      )}

      {ALL_POINTS.map((point) => {
        if (hiddenPoints?.has(point)) return null;
        const pos = innerChart.points[point];
        if (!pos) return null;
        return (
          <PlanetMarker
            key={`inner-${point}`}
            center={center}
            radius={innerPlanetRadius}
            ascendant={ascendant}
            position={pos}
            color="#7c5cff"
            ownerLabel={outerChart ? innerLabel : undefined}
          />
        );
      })}

      {outerChart &&
        ALL_POINTS.map((point) => {
          if (hiddenPoints?.has(point)) return null;
          const pos = outerChart.points[point];
          if (!pos) return null;
          return (
            <PlanetMarker
              key={`outer-${point}`}
              center={center}
              radius={outerPlanetRadius}
              ascendant={ascendant}
              position={pos}
              color="#f5c451"
              ownerLabel={outerLabel}
            />
          );
        })}
    </svg>
  );
}
