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
    <ul className="transit-list">
      {sorted.map((hit, idx) => (
        <li
          key={`${hit.pointA}-${hit.aspect}-${hit.pointB}-${idx}`}
          className="transit-row"
        >
          <span className="transit-glyphs">
            <span title={POINT_LABELS[hit.pointA]}>{POINT_GLYPHS[hit.pointA]}</span>
            <span className="text-muted" title={hit.aspect}>
              {aspectDefinition(hit.aspect).glyph}
            </span>
            <span title={POINT_LABELS[hit.pointB]}>{POINT_GLYPHS[hit.pointB]}</span>
          </span>
          <span className="transit-description">
            transiting {POINT_LABELS[hit.pointA]} {hit.aspect} natal {POINT_LABELS[hit.pointB]}
          </span>
          <span className="transit-orb">{`${hit.orb.toFixed(2)}\u00b0 orb${hit.applying ? " \u00b7 applying" : ""}`}</span>
        </li>
      ))}
    </ul>
  );
}
