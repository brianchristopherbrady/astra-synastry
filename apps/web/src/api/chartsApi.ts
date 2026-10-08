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

/** Query for natal AI endpoints; empty for tropical so existing cached tropical readings keep their URL. */
export function aiZodiacQuery(opts: Pick<ChartQueryOptions, "zodiacMode" | "ayanamsa">): string {
  return opts.zodiacMode === "sidereal" ? `?${new URLSearchParams({ zodiacMode: "sidereal", ayanamsa: opts.ayanamsa ?? "lahiri" })}` : "";
}

export const chartsApi = {
  get: (personId: string, opts: ChartQueryOptions = {}) => api.get<ChartRecord>(`/charts/${personId}?${toQuery(opts)}`),
  transits: (personId: string, date?: Date, opts: ChartQueryOptions = {}) =>
    api.get<NatalTransitReport>(`/charts/${personId}/transits?${toQuery(opts, date)}`),
  progressions: (personId: string, date?: Date, opts: ChartQueryOptions = {}) =>
    api.get<ProgressedChartReport>(`/charts/${personId}/progressions?${toQuery(opts, date)}`),
  hellenistic: (personId: string, date?: Date, opts: ChartQueryOptions = {}) =>
    api.get<HellenisticProfile>(`/charts/${personId}/hellenistic?${toQuery(opts, date)}`),
  /** Fires the natal AI reading in the background so it is cached before the chat drawer opens. */
  pregenerateReading: (personId: string, opts: Pick<ChartQueryOptions, "zodiacMode" | "ayanamsa"> = {}): Promise<void> =>
    api.drain(`/ai/natal/${personId}${aiZodiacQuery(opts)}`),
};

