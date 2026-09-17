import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartData } from "@astro/shared";

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
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={counts}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="house" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fill: "#cbd5e1", fontSize: 12 }} />
        <Tooltip contentStyle={{ background: "#0b0c1a", border: "1px solid #334155" }} labelFormatter={(h) => `House ${h}`} />
        <Bar
          dataKey="count"
          fill="#38bdf8"
          radius={[4, 4, 0, 0]}
          cursor={onSelect ? "pointer" : undefined}
          onClick={(entry) => onSelect?.((entry as unknown as { house: number }).house)}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
