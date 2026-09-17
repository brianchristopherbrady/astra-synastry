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
      className={`flex flex-col items-center rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-center ${
        onSelect ? "cursor-pointer hover:border-aurora" : ""
      }`}
    >
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      {pos ? (
        <>
          <span className={big ? "text-2xl" : "text-lg"}>
            {POINT_GLYPHS[point]} {signGlyph(chart, point)}
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
    <div className="w-full">
      <h3 className="mb-2 text-sm font-semibold text-stardust">{personName}&apos;s key placements</h3>
      <div className="flex flex-wrap gap-2">
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
