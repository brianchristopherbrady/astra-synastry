import type { ChartData, PointName } from "@astro/shared";

/** Groups a chart's points by house number (points with no house assigned are omitted). */
export function pointsByHouse(chart: ChartData): Map<number, PointName[]> {
  const map = new Map<number, PointName[]>();
  for (const [name, pos] of Object.entries(chart.points) as [PointName, ChartData["points"][PointName]][]) {
    if (!pos?.house) continue;
    const list = map.get(pos.house) ?? [];
    list.push(name);
    map.set(pos.house, list);
  }
  return map;
}
