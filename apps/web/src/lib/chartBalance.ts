import { ZODIAC_SIGNS } from "@astro/shared";
import type { BalanceBreakdown, ChartData, Element, Modality } from "@astro/shared";

/** Client-side mirror of astro-engine's single-chart element/modality tally (avoids depending on the full engine package). */
export function computeChartBalance(chart: ChartData): {
  elementBalance: BalanceBreakdown<Element>;
  modalityBalance: BalanceBreakdown<Modality>;
} {
  const elementCounts: Partial<Record<Element, number>> = {};
  const modalityCounts: Partial<Record<Modality, number>> = {};

  for (const pos of Object.values(chart.points)) {
    if (!pos) continue;
    const signInfo = ZODIAC_SIGNS.find((s) => s.sign === pos.sign);
    if (!signInfo) continue;
    elementCounts[signInfo.element] = (elementCounts[signInfo.element] ?? 0) + 1;
    modalityCounts[signInfo.modality] = (modalityCounts[signInfo.modality] ?? 0) + 1;
  }

  const dominant = <K extends string>(counts: Partial<Record<K, number>>): K =>
    (Object.entries(counts) as [K, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] as K;

  return {
    elementBalance: { counts: elementCounts as Record<Element, number>, dominant: dominant(elementCounts) },
    modalityBalance: { counts: modalityCounts as Record<Modality, number>, dominant: dominant(modalityCounts) },
  };
}
