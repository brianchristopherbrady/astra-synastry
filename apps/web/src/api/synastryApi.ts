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
  /** Fires the AI reading in the background (draining the SSE stream without displaying it) so the
   * archetype name/reading are already cached by the time the user opens the chat drawer. */
  pregenerateReading: async (id: string): Promise<void> => {
    const response = await fetch(`/api/ai/synastry/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!response.body) return;
    const reader = response.body.getReader();
    for (;;) {
      const { done } = await reader.read();
      if (done) break;
    }
  },
};
