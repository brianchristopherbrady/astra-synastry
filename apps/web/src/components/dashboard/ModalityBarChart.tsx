import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BalanceBreakdown, Modality } from "@astro/shared";
import { ChartDataList } from "../ui/ChartDataList.js";

interface ModalityBarChartProps {
  balance: BalanceBreakdown<Modality>;
  onSelect?: (modality: Modality) => void;
}

const MODALITIES: Modality[] = ["cardinal", "fixed", "mutable"];

export function ModalityBarChart({ balance, onSelect }: ModalityBarChartProps) {
  const data = MODALITIES.map((modality) => ({ modality, count: balance.counts[modality] ?? 0 }));
  return (
    <div>
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" />
        <XAxis dataKey="modality" tick={{ fill: "rgb(var(--color-muted))", fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fill: "rgb(var(--color-muted))", fontSize: 12 }} />
        <Tooltip contentStyle={{ background: "rgb(var(--color-elevated))", border: "1px solid rgb(var(--color-border))", color: "rgb(var(--color-text))" }} itemStyle={{ color: "rgb(var(--color-text))" }} />
        <Bar
          isAnimationActive={false}
          dataKey="count"
          fill="rgb(var(--color-accent))"
          radius={[4, 4, 0, 0]}
          cursor={onSelect ? "pointer" : undefined}
          onClick={(entry) => onSelect?.((entry as unknown as { modality: Modality }).modality)}
        />
      </BarChart>
    </ResponsiveContainer>
    <ChartDataList label="Modality counts" entries={data.map(({ modality, count }) => ({ label: modality, value: count, onSelect: onSelect ? () => onSelect(modality) : undefined }))} />
    </div>
  );
}
