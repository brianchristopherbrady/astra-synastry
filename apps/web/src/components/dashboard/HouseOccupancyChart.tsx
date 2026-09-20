import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartData } from "@astro/shared";
import { ChartDataList } from "../ui/ChartDataList.js";

interface HouseOccupancyChartProps {
  chart: ChartData;
  onSelect?: (house: number) => void;
}

/** How many points fall in each house \u2014 a quick read on where a chart's energy is concentrated. */
export function HouseOccupancyChart({ chart, onSelect }: HouseOccupancyChartProps) {
  const counts = Array.from({ length: 12 }, (_, i) => ({ house: i + 1, count: 0 }));
  for (const pos of Object.values(chart.points)) {
    if (!pos?.house) continue;
    const entry = counts[pos.house - 1];
    if (entry) entry.count += 1;
  }

  return (
    <div>
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={counts}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" />
        <XAxis dataKey="house" tick={{ fill: "rgb(var(--color-muted))", fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fill: "rgb(var(--color-muted))", fontSize: 12 }} />
        <Tooltip contentStyle={{ background: "rgb(var(--color-elevated))", border: "1px solid rgb(var(--color-border))", color: "rgb(var(--color-text))" }} itemStyle={{ color: "rgb(var(--color-text))" }} labelFormatter={(house) => `House ${house}`} />
        <Bar
          isAnimationActive={false}
          dataKey="count"
          fill="rgb(var(--color-data-house))"
          radius={[4, 4, 0, 0]}
          cursor={onSelect ? "pointer" : undefined}
          onClick={(entry) => onSelect?.((entry as unknown as { house: number }).house)}
        />
      </BarChart>
    </ResponsiveContainer>
    <ChartDataList label="House counts" entries={counts.map(({ house, count }) => ({ label: `House ${house}`, value: count, onSelect: onSelect ? () => onSelect(house) : undefined }))} />
    </div>
  );
}
