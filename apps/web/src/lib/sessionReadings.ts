import { useSyncExternalStore } from "react";

/** A reading the user ran from the dashboard during this browser session. */
export interface SessionReading {
  path: string;
  label: string;
  detail: string;
  personIds: string[];
}

const STORAGE_KEY = "astro:sessionReadings";
const MAX_READINGS = 12;
const listeners = new Set<() => void>();
let snapshot: SessionReading[] | null = null;

function isSessionReading(value: unknown): value is SessionReading {
  const entry = value as SessionReading;
  return typeof entry?.path === "string" && typeof entry.label === "string" && typeof entry.detail === "string" && Array.isArray(entry.personIds);
}

function load(): SessionReading[] {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isSessionReading) : [];
  } catch {
    return [];
  }
}

function save(readings: SessionReading[]): void {
  snapshot = readings;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
  listeners.forEach((listener) => listener());
}

export function getSessionReadings(): SessionReading[] {
  snapshot ??= load();
  return snapshot;
}

/** Most recent first; re-running the same reading moves it to the top instead of duplicating it. */
export function addSessionReading(reading: SessionReading): void {
  save([reading, ...getSessionReadings().filter((entry) => entry.path !== reading.path)].slice(0, MAX_READINGS));
}

export function removeSessionReadingsFor(personId: string): void {
  const remaining = getSessionReadings().filter((entry) => !entry.personIds.includes(personId));
  if (remaining.length !== getSessionReadings().length) save(remaining);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSessionReadings(): SessionReading[] {
  return useSyncExternalStore(subscribe, getSessionReadings);
}
