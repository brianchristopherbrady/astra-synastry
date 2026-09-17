import { Router } from "express";
import { z } from "zod";
import { searchPlaces } from "@astro/astro-engine";
import { geoRateLimiter } from "../middleware/rateLimit.middleware.js";

export const geoRouter: Router = Router();

const querySchema = z.object({ query: z.string().min(2).max(200) });

geoRouter.get("/search", geoRateLimiter, async (req, res, next) => {
  try {
    const { query } = querySchema.parse(req.query);
    const suggestions = await searchPlaces(query);
    res.json(suggestions);
  } catch (err) {
    next(err);
  }
});
