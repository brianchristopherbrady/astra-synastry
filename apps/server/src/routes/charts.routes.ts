import { Router } from "express";
import { z } from "zod";
import type { Ayanamsa, HouseSystem, ZodiacMode } from "@astro/shared";
import { computeHellenisticProfile, computeSecondaryProgression, computeTransitsToChart, findAspects } from "@astro/astro-engine";
import { prisma } from "../lib/prisma.js";
import { getOrComputeChart } from "../services/chart.service.js";

export const chartsRouter: Router = Router();

const houseSystemEnum = z.enum(["placidus", "wholeSign", "koch", "equal", "campanus", "regiomontanus"]);
const zodiacModeEnum = z.enum(["tropical", "sidereal"]);
const ayanamsaEnum = z.enum(["lahiri", "raman", "krishnamurti", "fagan_bradley", "yukteshwar"]);
const querySchema = z.object({
  houseSystem: houseSystemEnum.default("placidus"),
  zodiacMode: zodiacModeEnum.default("tropical"),
  ayanamsa: ayanamsaEnum.default("lahiri"),
});
const dateQuerySchema = querySchema.extend({ date: z.coerce.date().optional() });

chartsRouter.get("/:personId", async (req, res, next) => {
  try {
    const { houseSystem, zodiacMode, ayanamsa } = querySchema.parse(req.query);
    const person = await prisma.person.findUnique({ where: { id: String(req.params.personId) } });
    if (!person) {
      res.status(404).json({ error: "Person not found" });
      return;
    }

    const record = await getOrComputeChart(person, houseSystem as HouseSystem, zodiacMode as ZodiacMode, ayanamsa as Ayanamsa);
    res.json({
      ...record.chart,
      aiAnalysisMarkdown: record.aiAnalysisMarkdown,
      aiProvider: record.aiProvider,
    });
  } catch (err) {
    next(err);
  }
});

chartsRouter.get("/:personId/transits", async (req, res, next) => {
  try {
    const { houseSystem, zodiacMode, ayanamsa, date } = dateQuerySchema.parse(req.query);
    const person = await prisma.person.findUnique({ where: { id: String(req.params.personId) } });
    if (!person) {
      res.status(404).json({ error: "Person not found" });
      return;
    }
    const record = await getOrComputeChart(person, houseSystem as HouseSystem, zodiacMode as ZodiacMode, ayanamsa as Ayanamsa);
    res.json(computeTransitsToChart(record.chart, date ?? new Date()));
  } catch (err) {
    next(err);
  }
});

chartsRouter.get("/:personId/progressions", async (req, res, next) => {
  try {
    const { houseSystem, zodiacMode, ayanamsa, date } = dateQuerySchema.parse(req.query);
    const person = await prisma.person.findUnique({ where: { id: String(req.params.personId) } });
    if (!person) {
      res.status(404).json({ error: "Person not found" });
      return;
    }
    const record = await getOrComputeChart(person, houseSystem as HouseSystem, zodiacMode as ZodiacMode, ayanamsa as Ayanamsa);
    const progression = computeSecondaryProgression(record.chart, date ?? new Date());
    const crossAspectsToNatal = findAspects(progression.chart.points, record.chart.points);
    res.json({ ...progression, crossAspectsToNatal });
  } catch (err) {
    next(err);
  }
});

chartsRouter.get("/:personId/hellenistic", async (req, res, next) => {
  try {
    const { houseSystem, zodiacMode, ayanamsa, date } = dateQuerySchema.parse(req.query);
    const person = await prisma.person.findUnique({ where: { id: String(req.params.personId) } });
    if (!person) {
      res.status(404).json({ error: "Person not found" });
      return;
    }
    const record = await getOrComputeChart(person, houseSystem as HouseSystem, zodiacMode as ZodiacMode, ayanamsa as Ayanamsa);
    const profile = computeHellenisticProfile(record.chart, date ?? new Date());
    if (!profile) {
      res.status(422).json({ error: "Hellenistic techniques require a known birth time" });
      return;
    }
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

