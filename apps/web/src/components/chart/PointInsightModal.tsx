import { POINT_GLYPHS, POINT_LABELS, ZODIAC_SIGNS } from "@astro/shared";
import type { ChartData, PointName } from "@astro/shared";
import { POINT_MEANINGS, SIGN_MEANINGS } from "../../content/glossary.js";
import { Modal } from "../ui/Modal.js";

interface ChartWithLabel {
  label: string;
  chart: ChartData;
}

interface PointInsightModalProps {
  point: PointName | null;
  onClose: () => void;
  charts: ChartWithLabel[];
}

function signGlyph(sign: string): string {
  return ZODIAC_SIGNS.find((s) => s.sign === sign)?.glyph ?? "";
}

/** Static point + sign meaning, plus exactly where that point sits (sign, degree, house) in each chart. */
export function PointInsightModal({ point, onClose, charts }: PointInsightModalProps) {
  if (!point) return null;
  const label = point === "ascendant" ? "Rising" : POINT_LABELS[point];
  const staticBody = POINT_MEANINGS[point];

  return (
    <Modal open={!!point} onClose={onClose} title={`${POINT_GLYPHS[point]} ${label}`}>
      {staticBody && <p className="mb-4 text-sm text-slate-300">{staticBody}</p>}
      <div className="flex flex-col gap-3">
        {charts.map(({ label: chartLabel, chart }) => {
          const pos = chart.points[point];
          if (!pos) {
            return (
              <div key={chartLabel} className="rounded border border-slate-700 bg-slate-950/60 p-3">
                <h3 className="mb-1 text-sm font-semibold text-aurora">For {chartLabel}</h3>
                <p className="text-sm text-slate-400">Not available in this chart.</p>
              </div>
            );
          }
          const signMeaning = SIGN_MEANINGS[pos.sign];
          return (
            <div key={chartLabel} className="rounded border border-slate-700 bg-slate-950/60 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-aurora">For {chartLabel}</h3>
                <span className="text-xs capitalize text-slate-400">
                  {signGlyph(pos.sign)} {pos.sign} {`${pos.signDegree.toFixed(1)}\u00b0`}
                  {pos.house ? ` \u00b7 House ${pos.house}` : ""}
                </span>
              </div>
              {signMeaning && <p className="text-sm text-slate-200">{signMeaning}</p>}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
