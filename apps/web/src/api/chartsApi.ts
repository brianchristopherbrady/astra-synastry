import type { ChartData, HouseSystem, NatalTransitReport, ProgressedChartReport } from "@astro/shared";
import { api } from "./client.js";

export type ChartRecord = ChartData & {
  aiAnalysisMarkdown?: string | null;
  aiProvider?: string | null;
};

function dateQuery(date?: Date): string {
  return date ? `&date=${encodeURIComponent(date.toISOString())}` : "";
}

export const chartsApi = {
  get: (personId: string, houseSystem: HouseSystem = "placidus") =>
    api.get<ChartRecord>(`/charts/${personId}?houseSystem=${houseSystem}`),
  transits: (personId: string, date?: Date, houseSystem: HouseSystem = "placidus") =>
    api.get<NatalTransitReport>(`/charts/${personId}/transits?houseSystem=${houseSystem}${dateQuery(date)}`),
  progressions: (personId: string, date?: Date, houseSystem: HouseSystem = "placidus") =>
    api.get<ProgressedChartReport>(`/charts/${personId}/progressions?houseSystem=${houseSystem}${dateQuery(date)}`),
};
