import { Router } from "express";
import { z } from "zod";
import type { HouseSystem } from "@astro/shared";
import { computeSecondaryProgression, computeTransitsToChart, findAspects } from "@astro/astro-engine";
import { prisma } from "../lib/prisma.js";
import { getOrComputeChart } from "../services/chart.service.js";

export const chartsRouter: Router = Router();

const houseSystemEnum = z.enum(["placidus", "wholeSign", "koch", "equal", "campanus", "regiomontanus"]);
const querySchema = z.object({ houseSystem: houseSystemEnum.default("placidus") });
const dateQuerySchema = z.object({ houseSystem: houseSystemEnum.default("placidus"), date: z.coerce.date().optional() });

chartsRouter.get("/:personId", async (req, res, next) => {
  try {
    const { houseSystem } = querySchema.parse(req.query);
    const person = await prisma.person.findUnique({ where: { id: String(req.params.personId) } });
    if (!person) {
      res.status(404).json({ error: "Person not found" });
      return;
    }

    const record = await getOrComputeChart(person, houseSystem as HouseSystem);
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
    const { houseSystem, date } = dateQuerySchema.parse(req.query);
    const person = await prisma.person.findUnique({ where: { id: String(req.params.personId) } });
    if (!person) {
      res.status(404).json({ error: "Person not found" });
      return;
    }
    const record = await getOrComputeChart(person, houseSystem as HouseSystem);
    res.json(computeTransitsToChart(record.chart, date ?? new Date()));
  } catch (err) {
    next(err);
  }
});

chartsRouter.get("/:personId/progressions", async (req, res, next) => {
  try {
    const { houseSystem, date } = dateQuerySchema.parse(req.query);
    const person = await prisma.person.findUnique({ where: { id: String(req.params.personId) } });
    if (!person) {
      res.status(404).json({ error: "Person not found" });
      return;
    }
    const record = await getOrComputeChart(person, houseSystem as HouseSystem);
    const progression = computeSecondaryProgression(record.chart, date ?? new Date());
    const crossAspectsToNatal = findAspects(progression.chart.points, record.chart.points);
    res.json({ ...progression, crossAspectsToNatal });
  } catch (err) {
    next(err);
  }
});

