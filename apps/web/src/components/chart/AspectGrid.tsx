import { ASPECT_DEFINITIONS, POINT_GLYPHS, POINT_LABELS } from "@astro/shared";
import type { AspectHit, PointName } from "@astro/shared";

interface AspectGridProps {
  pointsA: PointName[];
  pointsB: PointName[];
  aspects: AspectHit[];
}

function findHit(aspects: AspectHit[], a: PointName, b: PointName): AspectHit | undefined {
  return aspects.find((hit) => (hit.pointA === a && hit.pointB === b) || (hit.pointA === b && hit.pointB === a));
}

export function AspectGrid({ pointsA, pointsB, aspects }: AspectGridProps) {
  return (
    <div className="data-scroll" role="region" aria-label="Aspect comparison" tabIndex={0}>
      <table className="border-collapse text-xs">
      <caption className="sr-only">Planetary aspects and orb in degrees</caption>
        <thead>
          <tr>
            <th className="w-8" />
            {pointsB.map((b) => (
              <th key={b} scope="col" className="p-1 text-muted" title={POINT_LABELS[b]}>
                <span aria-hidden="true">{POINT_GLYPHS[b]}</span><span className="sr-only">{POINT_LABELS[b]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pointsA.map((a) => (
            <tr key={a}>
              <th scope="row" className="p-1 text-muted text-left" title={POINT_LABELS[a]}>
                <span aria-hidden="true">{POINT_GLYPHS[a]}</span><span className="sr-only">{POINT_LABELS[a]}</span>
              </th>
              {pointsB.map((b) => {
                const hit = findHit(aspects, a, b);
                const def = hit ? ASPECT_DEFINITIONS.find((d) => d.aspect === hit.aspect) : undefined;
                return (
                  <td
                    key={b}
                    className="w-8 h-8 text-center border border-slate-700"
                    title={hit ? `${POINT_LABELS[a]} ${hit.aspect} ${POINT_LABELS[b]} (orb ${hit.orb.toFixed(2)}°)` : undefined}
                  >
                    {hit && def ? <><span aria-hidden="true" style={{ color: `rgb(var(--color-${def.harmony >= 0 ? "success" : "danger"}))` }}>{def.glyph}</span><span className="sr-only">{`${hit.aspect}, orb ${hit.orb.toFixed(2)} degrees`}</span></> : <span className="sr-only">No aspect</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
