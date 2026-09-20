import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import type { BalanceBreakdown, Element } from "@astro/shared";
import { ChartDataList } from "../ui/ChartDataList.js";

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
          <PolarGrid stroke="rgb(var(--color-border))" />
          <PolarAngleAxis dataKey="element" tick={{ fill: "rgb(var(--color-muted))", fontSize: 12 }} />
          <PolarRadiusAxis tick={false} axisLine={false} />
          <Radar dataKey="count" stroke="rgb(var(--color-action))" fill="rgb(var(--color-action))" fillOpacity={0.5} isAnimationActive={false} />
        </RadarChart>
      </ResponsiveContainer>
      <ChartDataList label="Element counts" entries={data.map(({ element, count }) => ({ label: element, value: count, onSelect: onSelect ? () => onSelect(element) : undefined }))} />
    </div>
  );
}
