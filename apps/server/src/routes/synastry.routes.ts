import { Router } from "express";
import { z } from "zod";
import { computeNatalChart, computeSynastry, computeTransitReport } from "@astro/astro-engine";
import type { BirthData, HouseSystem, SynastryData } from "@astro/shared";
import { prisma } from "../lib/prisma.js";

export const synastryRouter: Router = Router();

const houseSystemEnum = z.enum(["placidus", "wholeSign", "koch", "equal", "campanus", "regiomontanus"]);
const bodySchema = z.object({
  personAId: z.string(),
  personBId: z.string(),
  houseSystem: houseSystemEnum.default("placidus"),
});

interface HttpError extends Error {
  statusCode?: number;
}

async function loadPerson(id: string) {
  const person = await prisma.person.findUnique({ where: { id } });
  if (!person) {
    const error: HttpError = new Error("Person not found");
    error.statusCode = 404;
    throw error;
  }
  return person;
}

function toBirthData(person: {
  localDateTime: string;
  timezone: string;
  latitude: number;
  longitude: number;
  locationName: string;
  timeUnknown: boolean;
}): BirthData {
  return { ...person };
}

synastryRouter.post("/", async (req, res, next) => {
  try {
    const body = bodySchema.parse(req.body);
    if (body.personAId === body.personBId) {
      res.status(400).json({ error: "Select two different people for a synastry report" });
      return;
    }
    const [personA, personB] = await Promise.all([loadPerson(body.personAId), loadPerson(body.personBId)]);

    const existing = await prisma.synastryReport.findUnique({
      where: {
        personAId_personBId_houseSystem: {
          personAId: personA.id,
          personBId: personB.id,
          houseSystem: body.houseSystem,
        },
      },
    });
    if (existing) {
      res.json({
        id: existing.id,
        personAName: personA.name,
        personBName: personB.name,
        ...(JSON.parse(existing.dataJson) as object),
      });
      return;
    }

    const chartA = computeNatalChart(toBirthData(personA), body.houseSystem as HouseSystem);
    const chartB = computeNatalChart(toBirthData(personB), body.houseSystem as HouseSystem);
    const synastry = computeSynastry(chartA, chartB);

    const created = await prisma.synastryReport.create({
      data: {
        personAId: personA.id,
        personBId: personB.id,
        houseSystem: body.houseSystem,
        dataJson: JSON.stringify(synastry),
      },
    });

    res.status(201).json({ id: created.id, personAName: personA.name, personBName: personB.name, ...synastry });
  } catch (err) {
    next(err);
  }
});

synastryRouter.get("/:id", async (req, res, next) => {
  try {
    const report = await prisma.synastryReport.findUnique({
      where: { id: String(req.params.id) },
      include: { personA: true, personB: true },
    });
    if (!report) {
      res.status(404).json({ error: "Synastry report not found" });
      return;
    }
    res.json({
      id: report.id,
      personAName: report.personA.name,
      personBName: report.personB.name,
      ...(JSON.parse(report.dataJson) as object),
      aiAnalysisMarkdown: report.aiAnalysisMarkdown,
      aiProvider: report.aiProvider,
    });
  } catch (err) {
    next(err);
  }
});

synastryRouter.get("/:id/transits", async (req, res, next) => {
  try {
    const report = await prisma.synastryReport.findUnique({ where: { id: String(req.params.id) } });
    if (!report) {
      res.status(404).json({ error: "Synastry report not found" });
      return;
    }
    const data = JSON.parse(report.dataJson) as SynastryData;
    const transits = computeTransitReport(data.personAChart, data.personBChart, data.compositeChart, new Date());
    res.json(transits);
  } catch (err) {
    next(err);
  }
});
