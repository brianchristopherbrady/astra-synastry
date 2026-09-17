import { find as findTimezone } from "geo-tz";
import NodeGeocoder from "node-geocoder";
import { DateTime } from "luxon";
import type { BirthData, PlaceSuggestion } from "@astro/shared";

// Nominatim's usage policy requires identifying the app via email and/or a descriptive user-agent.
const geocoder = NodeGeocoder({
  provider: "openstreetmap",
  email: "support@astra-synastry.local",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- node-geocoder's fetch type conflicts with the DOM lib's RequestInfo
  fetch: ((url: any, options: any) =>
    fetch(url, { ...options, headers: { ...options?.headers, "user-agent": "AstraSynastry/0.1 (local dev)" } })) as never,
});

/** Prefers a concise "City, State" (or "City, Country" if no state) over Nominatim's verbose full address. */
function toConciseLocationName(entry: { city?: string; state?: string; country?: string; formattedAddress?: string }, fallback: string): string {
  const region = entry.state ?? entry.country;
  if (entry.city && region) return `${entry.city}, ${region}`;
  return entry.city ?? entry.formattedAddress ?? fallback;
}

/** Free-text place lookup via OpenStreetMap Nominatim (no API key required), with timezone pre-resolved. */
export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const results = await geocoder.geocode(query);
  return results
    .filter((r): r is typeof r & { latitude: number; longitude: number } => r.latitude != null && r.longitude != null)
    .map((r) => ({
      locationName: toConciseLocationName(r, query),
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: resolveTimezone(r.latitude, r.longitude),
    }));
}

/** Resolves the IANA timezone for a coordinate (works for historical dates via the caller's date logic). */
export function resolveTimezone(latitude: number, longitude: number): string {
  const zones = findTimezone(latitude, longitude);
  const zone = zones[0];
  if (!zone) {
    throw new Error(`Could not resolve a timezone for coordinates ${latitude}, ${longitude}`);
  }
  return zone;
}

/**
 * Resolves birth data's local wall-clock time to a precise UTC instant, honoring the
 * historically-correct UTC offset for that date/timezone (DST rules, zone changes, etc.)
 * via the IANA tz database through luxon.
 */
export function resolveBirthDataToUtc(birthData: BirthData): Date {
  const dt = DateTime.fromISO(birthData.localDateTime, { zone: birthData.timezone });
  if (!dt.isValid) {
    throw new Error(`Invalid birth date/timezone: ${dt.invalidExplanation}`);
  }
  return dt.toUTC().toJSDate();
}
