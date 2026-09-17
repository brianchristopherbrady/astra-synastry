import { POINT_GLYPHS, POINT_LABELS, ZODIAC_SIGNS } from "@astro/shared";
import type { ChartData, Element, Modality, PointName } from "@astro/shared";
import { ELEMENT_MEANINGS, MODALITY_MEANINGS } from "../../content/glossary.js";
import { Modal } from "../ui/Modal.js";

export type BalanceKind = "element" | "modality";

export interface BalanceInsightTarget {
  kind: BalanceKind;
  value: Element | Modality;
}

interface ChartWithLabel {
  label: string;
  chart: ChartData;
}

interface BalanceInsightModalProps {
  target: BalanceInsightTarget | null;
  onClose: () => void;
  charts: ChartWithLabel[];
}

function matchingPoints(chart: ChartData, kind: BalanceKind, value: Element | Modality): PointName[] {
  const matches: PointName[] = [];
  for (const [name, pos] of Object.entries(chart.points) as [PointName, ChartData["points"][PointName]][]) {
    if (!pos) continue;
    const signInfo = ZODIAC_SIGNS.find((s) => s.sign === pos.sign);
    if (!signInfo) continue;
    if ((kind === "element" ? signInfo.element : signInfo.modality) === value) matches.push(name);
  }
  return matches;
}

/** Static definition + a per-chart breakdown of what actually carries this element/modality. */
export function BalanceInsightModal({ target, onClose, charts }: BalanceInsightModalProps) {
  if (!target) return null;
  const { kind, value } = target;
  const title = value.charAt(0).toUpperCase() + value.slice(1);
  const staticBody = kind === "element" ? ELEMENT_MEANINGS[value as Element] : MODALITY_MEANINGS[value as Modality];

  return (
    <Modal open={!!target} onClose={onClose} title={`${title} ${kind === "element" ? "element" : "modality"}`}>
      <p className="mb-4 text-sm text-slate-300">{staticBody}</p>
      <div className="flex flex-col gap-3">
        {charts.map(({ label, chart }) => {
          const points = matchingPoints(chart, kind, value);
          return (
            <div key={label} className="rounded border border-slate-700 bg-slate-950/60 p-3">
              <h3 className="mb-1 text-sm font-semibold text-aurora">For {label}</h3>
              {points.length === 0 ? (
                <p className="text-sm text-slate-400">
                  {`No placements fall in ${title.toLowerCase()} signs \u2014 this theme shows up less directly for ${label}.`}
                </p>
              ) : (
                <p className="text-sm text-slate-200">
                  {`${points.length} placement${points.length === 1 ? "" : "s"}: `}
                  {points.map((p) => `${POINT_GLYPHS[p]} ${POINT_LABELS[p]}`).join(", ")}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
