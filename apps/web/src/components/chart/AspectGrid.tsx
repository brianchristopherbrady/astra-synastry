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
    <div className="overflow-auto">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="w-8" />
            {pointsB.map((b) => (
              <th key={b} className="p-1 text-slate-400" title={POINT_LABELS[b]}>
                {POINT_GLYPHS[b]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pointsA.map((a) => (
            <tr key={a}>
              <th className="p-1 text-slate-400 text-left" title={POINT_LABELS[a]}>
                {POINT_GLYPHS[a]}
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
                    {hit && def ? <span style={{ color: def.harmony >= 0 ? "#22c55e" : "#ef4444" }}>{def.glyph}</span> : ""}
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
