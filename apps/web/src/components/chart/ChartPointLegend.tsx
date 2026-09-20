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
    <div className="point-legend">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-muted">Chart points</span>
        <div className="flex gap-2 text-xs">
          <button className="min-h-8 text-aurora hover:underline" onClick={onShowAll}>
            Show all
          </button>
          <button className="min-h-8 text-muted hover:underline" onClick={onHideAll}>
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
              aria-pressed={!hidden}
              className="point-toggle"
            >
              <span aria-hidden="true">{POINT_GLYPHS[point]}</span>
              <span>{POINT_LABELS[point]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
