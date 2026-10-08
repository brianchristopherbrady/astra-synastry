import { POINT_GLYPHS, POINT_LABELS, ZODIAC_SIGNS } from "@astro/shared";
import type { ChartData } from "@astro/shared";
import { HOUSE_MEANINGS } from "../../content/glossary.js";
import { pointsByHouse } from "../../lib/houseUtils.js";

interface HouseBreakdownProps {
  chart: ChartData;
  headingLevel?: "h3" | "h4";
}

function signGlyph(sign: string): string {
  return ZODIAC_SIGNS.find((s) => s.sign === sign)?.glyph ?? "";
}

/** Shows what's actually in each of *this* chart's houses, not just the abstract meaning. */
export function HouseBreakdown({ chart, headingLevel: Heading = "h3" }: HouseBreakdownProps) {
  if (!chart.houses) {
    return (
      <p className="text-sm text-slate-400">
        Houses aren&apos;t available for this chart because the exact birth time is unknown.
      </p>
    );
  }

  const pointsByHouseMap = pointsByHouse(chart);

  return (
    <div className="house-grid">
      {chart.houses.map((cusp) => {
        const meaning = HOUSE_MEANINGS[cusp.house];
        const occupants = pointsByHouseMap.get(cusp.house) ?? [];
        return (
          <div key={cusp.house} className="house-entry">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <Heading className="text-sm font-semibold text-aurora">{meaning?.title ?? `House ${cusp.house}`}</Heading>
              <span className="text-xs capitalize text-muted">
                <span className="astro-symbol">{`${signGlyph(cusp.sign)}\ufe0e`}</span> {cusp.sign} {`${cusp.signDegree.toFixed(1)}\u00b0`}
              </span>
            </div>
            {meaning && <p className="mb-2 text-xs text-slate-400">{meaning.body}</p>}
            {occupants.length > 0 ? (
              <p className="text-sm text-slate-200">
                {occupants.map((point) => `${POINT_GLYPHS[point]} ${POINT_LABELS[point]}`).join(", ")}
              </p>
            ) : (
              <p className="text-sm text-slate-500">No planets or points here.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
