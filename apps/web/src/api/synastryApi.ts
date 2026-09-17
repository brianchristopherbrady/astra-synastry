import type { HouseSystem, SynastryData, TransitReport } from "@astro/shared";
import { api } from "./client.js";

export interface CreateSynastryPayload {
  personAId: string;
  personBId: string;
  houseSystem?: HouseSystem;
}

export type SynastryRecord = SynastryData & {
  id: string;
  personAName: string;
  personBName: string;
  aiAnalysisMarkdown?: string | null;
  aiProvider?: string | null;
};

export const synastryApi = {
  create: (payload: CreateSynastryPayload) => api.post<SynastryRecord>("/synastry", payload),
  get: (id: string) => api.get<SynastryRecord>(`/synastry/${id}`),
  transits: (id: string) => api.get<TransitReport>(`/synastry/${id}/transits`),
};
