import type { Ayanamsa, HouseSystem, ReadingStyle, RelationshipType, SynastryData, TransitReport, ZodiacMode } from "@astro/shared";
import { api } from "./client.js";

export interface CreateSynastryPayload {
  personAId: string;
  personBId: string;
  houseSystem?: HouseSystem;
  zodiacMode?: ZodiacMode;
  ayanamsa?: Ayanamsa;
  relationshipType?: RelationshipType;
  readingStyle?: ReadingStyle;
  customStyleText?: string;
}

export type SynastryRecord = SynastryData & {
  id: string;
  personAName: string;
  personBName: string;
  zodiacMode: ZodiacMode;
  ayanamsa: Ayanamsa;
  relationshipType: RelationshipType;
  readingStyle: ReadingStyle;
  customStyleText: string;
  archetypeName: string | null;
  aiAnalysisMarkdown?: string | null;
  aiProvider?: string | null;
};

export const synastryApi = {
  create: (payload: CreateSynastryPayload) => api.post<SynastryRecord>("/synastry", payload),
  get: (id: string) => api.get<SynastryRecord>(`/synastry/${id}`),
  transits: (id: string) => api.get<TransitReport>(`/synastry/${id}/transits`),
  /** Fires the AI reading in the background so the archetype name/reading are already cached by the time the user opens the chat drawer. */
  pregenerateReading: (id: string): Promise<void> => api.drain(`/ai/synastry/${id}`),
};
