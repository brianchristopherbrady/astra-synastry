import { ALL_POINTS, POINT_GLYPHS, POINT_LABELS } from "@astro/shared";
import type { PointName } from "@astro/shared";

interface ChartPointLegendProps {
  hiddenPoints: Set<PointName>;
  onToggle: (point: PointName) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

/** Lets the viewer declutter a busy wheel by hiding individual points (and their aspect lines). */
export function ChartPointLegend({ hiddenPoints, onToggle, onShowAll, onHideAll }: ChartPointLegendProps) {
  return (
    <div className="w-full rounded-lg border border-slate-700 bg-slate-900/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Show/hide points</span>
        <div className="flex gap-2 text-xs">
          <button className="text-aurora hover:underline" onClick={onShowAll}>
            Show all
          </button>
          <button className="text-slate-400 hover:underline" onClick={onHideAll}>
            Hide all
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ALL_POINTS.map((point) => {
          const hidden = hiddenPoints.has(point);
          return (
            <button
              key={point}
              onClick={() => onToggle(point)}
              title={POINT_LABELS[point]}
              className={`flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors ${
                hidden
                  ? "border-slate-700 text-slate-600 line-through"
                  : "border-slate-600 text-slate-200 hover:border-aurora"
              }`}
            >
              <span>{POINT_GLYPHS[point]}</span>
              <span>{POINT_LABELS[point]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
