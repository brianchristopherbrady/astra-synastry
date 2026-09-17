import { POINT_SIGNIFICANCE_WEIGHT, ZODIAC_SIGNS, aspectDefinition } from "@astro/shared";
import type {
  AspectHit,
  BalanceBreakdown,
  ChartData,
  CompatibilityCategoryScores,
  CompatibilityScore,
  Element,
  Modality,
  PointName,
} from "@astro/shared";

type Category = keyof CompatibilityCategoryScores;

const CATEGORIES: Category[] = ["communication", "emotional", "passion", "stability", "growth", "conflict"];

/** Which compatibility categories each point contributes to when it takes part in a cross-aspect. */
const POINT_DOMAINS: Partial<Record<PointName, Category[]>> = {
  sun: ["growth", "stability"],
  moon: ["emotional"],
  mercury: ["communication"],
  venus: ["passion", "emotional"],
  mars: ["passion"],
  jupiter: ["growth"],
  saturn: ["stability"],
  uranus: ["growth"],
  neptune: ["emotional"],
  pluto: ["passion"],
  ascendant: ["communication", "passion"],
  midheaven: ["growth"],
  northNode: ["growth"],
  southNode: ["stability"],
  chiron: ["emotional"],
  lilith: ["passion"],
  vertex: ["passion"],
  partOfFortune: ["growth"],
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Transparent, weighted scoring model (not a black box): each cross-chart aspect contributes
 * to one or more categories based on the astrological domain of the two points involved,
 * weighted by point significance and how exact the aspect is.
 */
export function scoreCompatibility(chartA: ChartData, chartB: ChartData, crossAspects: AspectHit[]): CompatibilityScore {
  const totals: Record<Category, number> = { communication: 0, emotional: 0, passion: 0, stability: 0, growth: 0, conflict: 0 };
  const weights: Record<Category, number> = { communication: 0, emotional: 0, passion: 0, stability: 0, growth: 0, conflict: 0 };

  for (const hit of crossAspects) {
    const def = aspectDefinition(hit.aspect);
    const weightA = POINT_SIGNIFICANCE_WEIGHT[hit.pointA] ?? 0.2;
    const weightB = POINT_SIGNIFICANCE_WEIGHT[hit.pointB] ?? 0.2;
    const orbFactor = clamp(1 - hit.orb / 10, 0, 1);
    const weight = weightA * weightB * orbFactor;
    if (weight <= 0) continue;

    const domains = new Set<Category>([...(POINT_DOMAINS[hit.pointA] ?? []), ...(POINT_DOMAINS[hit.pointB] ?? [])]);
    for (const domain of domains) {
      totals[domain] += def.harmony * weight;
      weights[domain] += weight;
    }
    if (def.harmony < 0) {
      totals.conflict += Math.abs(def.harmony) * weight;
      weights.conflict += weight;
    }
  }

  const categories = {} as CompatibilityCategoryScores;
  for (const category of CATEGORIES) {
    const totalWeight = weights[category];
    const rawHarmony = totalWeight > 0 ? totals[category] / totalWeight : 0;
    const score = category === "conflict" ? 100 - rawHarmony * 40 : 50 + rawHarmony * 25;
    categories[category] = Math.round(clamp(score, 0, 100));
  }

  const overall = Math.round(
    clamp(
      categories.communication * 0.2 +
        categories.emotional * 0.25 +
        categories.passion * 0.2 +
        categories.stability * 0.15 +
        categories.growth * 0.1 +
        categories.conflict * 0.1,
      0,
      100,
    ),
  );

  return {
    overall,
    categories,
    elementBalance: balanceOf([chartA, chartB], "element"),
    modalityBalance: balanceOf([chartA, chartB], "modality"),
  };
}

/** Element/modality balance for a single chart (e.g. for a standalone natal reading, no synastry involved). */
export function computeChartBalance(chart: ChartData): { elementBalance: BalanceBreakdown<Element>; modalityBalance: BalanceBreakdown<Modality> } {
  return {
    elementBalance: balanceOf([chart], "element"),
    modalityBalance: balanceOf([chart], "modality"),
  };
}

function balanceOf(charts: ChartData[], kind: "element"): BalanceBreakdown<Element>;
function balanceOf(charts: ChartData[], kind: "modality"): BalanceBreakdown<Modality>;
function balanceOf(
  charts: ChartData[],
  kind: "element" | "modality",
): BalanceBreakdown<Element> | BalanceBreakdown<Modality> {
  const counts: Partial<Record<Element | Modality, number>> = {};
  for (const chart of charts) {
    for (const pos of Object.values(chart.points)) {
      if (!pos) continue;
      const signInfo = ZODIAC_SIGNS.find((s) => s.sign === pos.sign);
      if (!signInfo) continue;
      const key = kind === "element" ? signInfo.element : signInfo.modality;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  const dominantEntry = (Object.entries(counts) as [Element | Modality, number][]).sort((a, b) => b[1] - a[1])[0];
  if (kind === "element") {
    return { counts: counts as Record<Element, number>, dominant: dominantEntry?.[0] as Element };
  }
  return { counts: counts as Record<Modality, number>, dominant: dominantEntry?.[0] as Modality };
}
