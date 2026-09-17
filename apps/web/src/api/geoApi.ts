import type { PlaceSuggestion } from "@astro/shared";
import { api } from "./client.js";

export const geoApi = {
  search: (query: string) => api.get<PlaceSuggestion[]>(`/geo/search?query=${encodeURIComponent(query)}`),
};
