import { computeNatalChart, computeSynastry } from "@astro/astro-engine";
import type { Ayanamsa, BirthData, HouseSystem, SynastryData, ZodiacMode } from "@astro/shared";

export interface BirthFields {
  localDateTime: string;
  timezone: string;
  latitude: number;
  longitude: number;
  locationName: string;
  timeUnknown: boolean;
}

export function toBirthData(person: BirthFields): BirthData {
  return {
    localDateTime: person.localDateTime,
    timezone: person.timezone,
    latitude: person.latitude,
    longitude: person.longitude,
    locationName: person.locationName,
    timeUnknown: person.timeUnknown,
  };
}

export function computeSynastryData(
  personA: BirthFields,
  personB: BirthFields,
  houseSystem: HouseSystem,
  zodiacMode: ZodiacMode,
  ayanamsa: Ayanamsa,
): SynastryData {
  const chartA = computeNatalChart(toBirthData(personA), houseSystem, zodiacMode, ayanamsa);
  const chartB = computeNatalChart(toBirthData(personB), houseSystem, zodiacMode, ayanamsa);
  return computeSynastry(chartA, chartB);
}
