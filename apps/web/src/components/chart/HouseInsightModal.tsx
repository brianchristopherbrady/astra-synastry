import { POINT_GLYPHS, POINT_LABELS, ZODIAC_SIGNS } from "@astro/shared";
import type { ChartData } from "@astro/shared";
import { HOUSE_MEANINGS } from "../../content/glossary.js";
import { pointsByHouse } from "../../lib/houseUtils.js";
import { Modal } from "../ui/Modal.js";

interface ChartWithLabel {
  label: string;
  chart: ChartData;
}

interface HouseInsightModalProps {
  house: number | null;
  onClose: () => void;
  charts: ChartWithLabel[];
}

function signGlyph(sign: string): string {
  return ZODIAC_SIGNS.find((s) => s.sign === sign)?.glyph ?? "";
}

/** Static house meaning + a per-chart breakdown of the cusp sign and what actually occupies it. */
export function HouseInsightModal({ house, onClose, charts }: HouseInsightModalProps) {
  if (house === null) return null;
  const meaning = HOUSE_MEANINGS[house];

  return (
    <Modal open={house !== null} onClose={onClose} title={meaning?.title ?? `House ${house}`}>
      {meaning && <p className="mb-4 text-sm text-slate-300">{meaning.body}</p>}
      <div className="flex flex-col gap-3">
        {charts.map(({ label, chart }) => {
          if (!chart.houses) {
            return (
              <div key={label} className="rounded border border-slate-700 bg-slate-950/60 p-3">
                <h3 className="mb-1 text-sm font-semibold text-aurora">For {label}</h3>
                <p className="text-sm text-slate-400">Houses aren&apos;t available (birth time unknown).</p>
              </div>
            );
          }
          const cusp = chart.houses.find((h) => h.house === house);
          const occupants = pointsByHouse(chart).get(house) ?? [];
          return (
            <div key={label} className="rounded border border-slate-700 bg-slate-950/60 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-aurora">For {label}</h3>
                {cusp && (
                  <span className="text-xs capitalize text-slate-400">
                    {signGlyph(cusp.sign)} {cusp.sign} {`${cusp.signDegree.toFixed(1)}\u00b0`}
                  </span>
                )}
              </div>
              {occupants.length === 0 ? (
                <p className="text-sm text-slate-400">No planets or points here.</p>
              ) : (
                <p className="text-sm text-slate-200">
                  {occupants.map((p) => `${POINT_GLYPHS[p]} ${POINT_LABELS[p]}`).join(", ")}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
