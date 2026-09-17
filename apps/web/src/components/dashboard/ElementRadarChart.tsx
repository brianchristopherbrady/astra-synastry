import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import type { BalanceBreakdown, Element } from "@astro/shared";

interface ElementRadarChartProps {
  balance: BalanceBreakdown<Element>;
  onSelect?: (element: Element) => void;
}

const ELEMENTS: Element[] = ["fire", "earth", "air", "water"];

export function ElementRadarChart({ balance, onSelect }: ElementRadarChartProps) {
  const data = ELEMENTS.map((element) => ({ element, count: balance.counts[element] ?? 0 }));
  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data} outerRadius="60%" margin={{ top: 16, right: 24, bottom: 16, left: 24 }}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="element" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
          <PolarRadiusAxis tick={false} axisLine={false} />
          <Radar dataKey="count" stroke="#7c5cff" fill="#7c5cff" fillOpacity={0.5} />
        </RadarChart>
      </ResponsiveContainer>
      {onSelect && (
        <div className="flex flex-wrap justify-center gap-2">
          {ELEMENTS.map((element) => (
            <button
              key={element}
              onClick={() => onSelect(element)}
              className="rounded border border-slate-600 px-2 py-0.5 text-xs capitalize text-slate-300 hover:border-aurora hover:text-aurora"
            >
              {element}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
