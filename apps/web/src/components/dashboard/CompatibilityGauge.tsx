import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import type { CompatibilityScore } from "@astro/shared";

interface CompatibilityGaugeProps {
  score: CompatibilityScore;
}

function gaugeColor(value: number): string {
  if (value >= 70) return "rgb(var(--color-success))";
  if (value >= 45) return "rgb(var(--color-accent))";
  return "rgb(var(--color-danger))";
}

export function CompatibilityGauge({ score }: CompatibilityGaugeProps) {
  const data = [{ name: "overall", value: score.overall, fill: gaugeColor(score.overall) }];
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full">
        <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={180}>
          <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar dataKey="value" background={{ fill: "rgb(var(--color-elevated))" }} cornerRadius={8} isAnimationActive={false} />
          </RadialBarChart>
        </ResponsiveContainer>
        </div>
        <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold"><span className="sr-only">Overall compatibility: </span>{score.overall}<span className="sr-only"> out of 100</span></div>
      </div>
      <div className="mt-2 grid grid-cols-1 gap-y-1 text-xs text-slate-300 w-full">
        {Object.entries(score.categories).map(([category, value]) => (
          <div key={category} className="flex items-center justify-between gap-2">
            <span className="capitalize">{category}</span>
            <span className="font-semibold text-slate-100">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
