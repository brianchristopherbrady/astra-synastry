import { computeNatalChart } from "@astro/astro-engine";
import type { Ayanamsa, ChartData, HouseSystem, ZodiacMode } from "@astro/shared";
import { prisma } from "../lib/prisma.js";

interface PersonLike {
  id: string;
  localDateTime: string;
  timezone: string;
  latitude: number;
  longitude: number;
  locationName: string;
  timeUnknown: boolean;
}

export interface ChartRecord {
  id: string;
  chart: ChartData;
  aiProvider: string | null;
  aiAnalysisMarkdown: string | null;
  aiPromptVersion: string | null;
}

/** Fetches a person's cached natal chart, computing and persisting it on first request. */
export async function getOrComputeChart(
  person: PersonLike,
  houseSystem: HouseSystem,
  zodiacMode: ZodiacMode = "tropical",
  ayanamsa: Ayanamsa = "lahiri",
): Promise<ChartRecord> {
  const cached = await prisma.chart.findUnique({
    where: { personId_houseSystem_zodiacMode_ayanamsa: { personId: person.id, houseSystem, zodiacMode, ayanamsa } },
  });
  if (cached) {
    return {
      id: cached.id,
      chart: JSON.parse(cached.dataJson) as ChartData,
      aiProvider: cached.aiProvider,
      aiAnalysisMarkdown: cached.aiAnalysisMarkdown,
      aiPromptVersion: cached.aiPromptVersion,
    };
  }

  const chart = computeNatalChart(
    {
      localDateTime: person.localDateTime,
      timezone: person.timezone,
      latitude: person.latitude,
      longitude: person.longitude,
      locationName: person.locationName,
      timeUnknown: person.timeUnknown,
    },
    houseSystem,
    zodiacMode,
    ayanamsa,
  );

  const created = await prisma.chart.create({
    data: { personId: person.id, houseSystem, zodiacMode, ayanamsa, dataJson: JSON.stringify(chart) },
  });

  return { id: created.id, chart, aiProvider: null, aiAnalysisMarkdown: null, aiPromptVersion: null };
}

