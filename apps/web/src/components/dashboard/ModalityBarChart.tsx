import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BalanceBreakdown, Modality } from "@astro/shared";

interface ModalityBarChartProps {
  balance: BalanceBreakdown<Modality>;
  onSelect?: (modality: Modality) => void;
}

const MODALITIES: Modality[] = ["cardinal", "fixed", "mutable"];

export function ModalityBarChart({ balance, onSelect }: ModalityBarChartProps) {
  const data = MODALITIES.map((modality) => ({ modality, count: balance.counts[modality] ?? 0 }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="modality" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fill: "#cbd5e1", fontSize: 12 }} />
        <Tooltip contentStyle={{ background: "#0b0c1a", border: "1px solid #334155" }} />
        <Bar
          dataKey="count"
          fill="#f5c451"
          radius={[4, 4, 0, 0]}
          cursor={onSelect ? "pointer" : undefined}
          onClick={(entry) => onSelect?.((entry as unknown as { modality: Modality }).modality)}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
