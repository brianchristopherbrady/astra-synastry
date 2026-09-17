import { computeNatalChart } from "@astro/astro-engine";
import type { ChartData, HouseSystem } from "@astro/shared";
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
export async function getOrComputeChart(person: PersonLike, houseSystem: HouseSystem): Promise<ChartRecord> {
  const cached = await prisma.chart.findUnique({
    where: { personId_houseSystem: { personId: person.id, houseSystem } },
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
  );

  const created = await prisma.chart.create({
    data: { personId: person.id, houseSystem, dataJson: JSON.stringify(chart) },
  });

  return { id: created.id, chart, aiProvider: null, aiAnalysisMarkdown: null, aiPromptVersion: null };
}
