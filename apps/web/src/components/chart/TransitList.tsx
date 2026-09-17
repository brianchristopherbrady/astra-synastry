import { aspectDefinition, POINT_GLYPHS, POINT_LABELS } from "@astro/shared";
import type { TransitHit } from "@astro/shared";

interface TransitListProps {
  hits: TransitHit[];
  /** Label for the target chart, e.g. "your natal chart" or "Alice's chart". */
  targetLabel: string;
  emptyMessage?: string;
}

/** Sorted tightest-orb-first, capped so the list stays scannable. */
const MAX_ROWS = 25;

export function TransitList({ hits, targetLabel, emptyMessage }: TransitListProps) {
  const sorted = [...hits].sort((a, b) => a.orb - b.orb).slice(0, MAX_ROWS);

  if (sorted.length === 0) {
    return <p className="text-sm text-slate-400">{emptyMessage ?? `No notable transits to ${targetLabel} right now.`}</p>;
  }

  return (
    <ul className="flex flex-col gap-1.5 text-sm">
      {sorted.map((hit, idx) => (
        <li
          key={`${hit.pointA}-${hit.aspect}-${hit.pointB}-${idx}`}
          className="flex items-center justify-between gap-3 rounded border border-slate-700 bg-slate-900/60 px-3 py-1.5"
        >
          <span className="flex items-center gap-1.5 text-slate-200">
            <span title={POINT_LABELS[hit.pointA]}>{POINT_GLYPHS[hit.pointA]}</span>
            <span className="text-slate-500" title={hit.aspect}>
              {aspectDefinition(hit.aspect).glyph}
            </span>
            <span title={POINT_LABELS[hit.pointB]}>{POINT_GLYPHS[hit.pointB]}</span>
            <span className="text-xs capitalize text-slate-400">
              transiting {POINT_LABELS[hit.pointA]} {hit.aspect} natal {POINT_LABELS[hit.pointB]}
            </span>
          </span>
          <span className="shrink-0 text-xs text-slate-500">{`${hit.orb.toFixed(2)}\u00b0 orb${hit.applying ? " \u00b7 applying" : ""}`}</span>
        </li>
      ))}
    </ul>
  );
}
