import { POINT_GLYPHS, POINT_LABELS, ZODIAC_SIGNS } from "@astro/shared";
import type { ChartData, PointName } from "@astro/shared";

interface KeyPlacementsSummaryProps {
  chart: ChartData;
  personName: string;
  onSelect?: (point: PointName) => void;
}

const BIG_THREE: PointName[] = ["sun", "moon", "ascendant"];
const SECONDARY: PointName[] = ["mercury", "venus", "mars", "midheaven"];

function signGlyph(chart: ChartData, point: PointName): string {
  const pos = chart.points[point];
  if (!pos) return "";
  return ZODIAC_SIGNS.find((s) => s.sign === pos.sign)?.glyph ?? "";
}

function PlacementCard({
  chart,
  point,
  big,
  onSelect,
}: {
  chart: ChartData;
  point: PointName;
  big?: boolean;
  onSelect?: (point: PointName) => void;
}) {
  const pos = chart.points[point];
  const label = point === "ascendant" ? "Rising" : POINT_LABELS[point];
  const Wrapper = onSelect ? "button" : "div";
  return (
    <Wrapper
      onClick={onSelect ? () => onSelect(point) : undefined}
      className={`placement${big ? " placement-primary" : ""}`}
    >
      <span className="text-xs text-muted">{label}</span>
      {pos ? (
        <>
          <span className={`astro-symbol ${big ? "text-2xl" : "text-lg"}`} aria-hidden="true">
            {POINT_GLYPHS[point]} {`${signGlyph(chart, point)}\ufe0e`}
          </span>
          <span className="text-xs capitalize text-slate-300">{`${pos.sign} ${pos.signDegree.toFixed(1)}\u00b0`}</span>
        </>
      ) : (
        <span className="text-xs text-slate-500">unknown</span>
      )}
    </Wrapper>
  );
}

/** "At a glance" summary so a viewer immediately sees the Sun/Moon/Rising (and a few more) without reading the wheel. */
export function KeyPlacementsSummary({ chart, personName, onSelect }: KeyPlacementsSummaryProps) {
  return (
    <div className="placements">
      <h2 className="mb-3 text-sm font-medium text-muted">{personName}&apos;s key placements</h2>
      <div className="placement-grid">
        {BIG_THREE.map((point) => (
          <PlacementCard key={point} chart={chart} point={point} big onSelect={onSelect} />
        ))}
        {SECONDARY.map((point) => (
          <PlacementCard key={point} chart={chart} point={point} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
