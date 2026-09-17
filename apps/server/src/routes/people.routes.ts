import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

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
    const person = await prisma.person.update({ where: { id }, data: body });
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
