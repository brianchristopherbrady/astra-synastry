import type { Ayanamsa, ChartData, HellenisticProfile, HouseSystem, NatalTransitReport, ProgressedChartReport, ZodiacMode } from "@astro/shared";
import { api } from "./client.js";

export type ChartRecord = ChartData & {
  aiAnalysisMarkdown?: string | null;
  aiProvider?: string | null;
};

export interface ChartQueryOptions {
  houseSystem?: HouseSystem;
  zodiacMode?: ZodiacMode;
  ayanamsa?: Ayanamsa;
}

function toQuery(opts: ChartQueryOptions, date?: Date): string {
  const params = new URLSearchParams({
    houseSystem: opts.houseSystem ?? "placidus",
    zodiacMode: opts.zodiacMode ?? "tropical",
    ayanamsa: opts.ayanamsa ?? "lahiri",
  });
  if (date) params.set("date", date.toISOString());
  return params.toString();
}

export const chartsApi = {
  get: (personId: string, opts: ChartQueryOptions = {}) => api.get<ChartRecord>(`/charts/${personId}?${toQuery(opts)}`),
  transits: (personId: string, date?: Date, opts: ChartQueryOptions = {}) =>
    api.get<NatalTransitReport>(`/charts/${personId}/transits?${toQuery(opts, date)}`),
  progressions: (personId: string, date?: Date, opts: ChartQueryOptions = {}) =>
    api.get<ProgressedChartReport>(`/charts/${personId}/progressions?${toQuery(opts, date)}`),
  hellenistic: (personId: string, date?: Date, opts: ChartQueryOptions = {}) =>
    api.get<HellenisticProfile>(`/charts/${personId}/hellenistic?${toQuery(opts, date)}`),
};

