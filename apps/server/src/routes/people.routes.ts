import { Router } from "express";
import { z } from "zod";
import type { Ayanamsa, HouseSystem, ZodiacMode } from "@astro/shared";
import { prisma } from "../lib/prisma.js";
import { computeSynastryData } from "../services/synastry.service.js";

export const peopleRouter: Router = Router();

const personSchema = z.object({
  name: z.string().min(1).max(120),
  localDateTime: z.string().min(1),
  timezone: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locationName: z.string().min(1),
  timeUnknown: z.boolean().default(false),
});

const personUpdateSchema = personSchema.partial();

const BIRTH_FIELDS = ["localDateTime", "timezone", "latitude", "longitude", "timeUnknown"] as const;
const CLEARED_READING = { aiAnalysisMarkdown: null, aiProvider: null, aiPromptVersion: null };

peopleRouter.get("/", async (_req, res, next) => {
  try {
    const people = await prisma.person.findMany({ orderBy: { createdAt: "desc" } });
    res.json(people);
  } catch (err) {
    next(err);
  }
});

peopleRouter.post("/", async (req, res, next) => {
  try {
    const body = personSchema.parse(req.body);
    const person = await prisma.person.create({ data: body });
    res.status(201).json(person);
  } catch (err) {
    next(err);
  }
});

peopleRouter.get("/:id", async (req, res, next) => {
  try {
    const person = await prisma.person.findUnique({ where: { id: String(req.params.id) } });
    if (!person) {
      res.status(404).json({ error: "Person not found" });
      return;
    }
    res.json(person);
  } catch (err) {
    next(err);
  }
});

peopleRouter.patch("/:id", async (req, res, next) => {
  try {
    const body = personUpdateSchema.parse(req.body);
    const id = String(req.params.id);
    const existing = await prisma.person.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Person not found" });
      return;
    }
    const birthChanged = BIRTH_FIELDS.some((field) => body[field] !== undefined && body[field] !== existing[field]);
    const nameChanged = body.name !== undefined && body.name !== existing.name;
    const involving = { OR: [{ personAId: id }, { personBId: id }] };

    const person = await prisma.$transaction(async (tx) => {
      const updated = await tx.person.update({ where: { id }, data: body });
      if (birthChanged) {
        // Cached charts were computed from the old birth data; they are rebuilt on next view.
        await tx.chart.deleteMany({ where: { personId: id } });
        const reports = await tx.synastryReport.findMany({ where: involving, include: { personA: true, personB: true } });
        for (const report of reports) {
          const data = computeSynastryData(
            report.personA,
            report.personB,
            report.houseSystem as HouseSystem,
            report.zodiacMode as ZodiacMode,
            report.ayanamsa as Ayanamsa,
          );
          await tx.synastryReport.update({
            where: { id: report.id },
            data: { dataJson: JSON.stringify(data), archetypeName: null, ...CLEARED_READING },
          });
        }
      } else if (nameChanged) {
        // Readings address people by name, so regenerate them rather than show the old one.
        await tx.chart.updateMany({ where: { personId: id }, data: CLEARED_READING });
        await tx.synastryReport.updateMany({ where: involving, data: CLEARED_READING });
      }
      return updated;
    });
    res.json(person);
  } catch (err) {
    next(err);
  }
});

peopleRouter.delete("/:id", async (req, res, next) => {
  try {
    const result = await prisma.person.deleteMany({ where: { id: String(req.params.id) } });
    if (result.count === 0) {
      res.status(404).json({ error: "Person not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
