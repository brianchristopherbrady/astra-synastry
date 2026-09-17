import type { BirthData } from "@astro/shared";
import { api } from "./client.js";

export interface PersonRecord extends BirthData {
  id: string;
  name: string;
  createdAt: string;
}

export type CreatePersonPayload = Omit<PersonRecord, "id" | "createdAt">;
export type UpdatePersonPayload = Partial<CreatePersonPayload>;

export const peopleApi = {
  list: () => api.get<PersonRecord[]>("/people"),
  get: (id: string) => api.get<PersonRecord>(`/people/${id}`),
  create: (payload: CreatePersonPayload) => api.post<PersonRecord>("/people", payload),
  update: (id: string, payload: UpdatePersonPayload) => api.patch<PersonRecord>(`/people/${id}`, payload),
  remove: (id: string) => api.delete<void>(`/people/${id}`),
};
