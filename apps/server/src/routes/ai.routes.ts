import { Router } from "express";
import { z } from "zod";
import type { AiProviderName, HouseSystem, SynastryData } from "@astro/shared";
import { prisma } from "../lib/prisma.js";
import { aiRateLimiter } from "../middleware/rateLimit.middleware.js";
import {
  buildNatalChatContext,
  buildNatalPrompt,
  buildSynastryChatContext,
  buildSynastryPrompt,
  extractArchetype,
  PROMPT_VERSION,
} from "../services/ai/prompt-builder.js";
import { resolveProvider } from "../services/ai/ai.service.js";
import { getOrComputeChart } from "../services/chart.service.js";

export const aiRouter: Router = Router();

const bodySchema = z.object({
  provider: z.enum(["openai", "anthropic"]).optional(),
  force: z.boolean().optional(),
});

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});
const chatBodySchema = z.object({
  provider: z.enum(["openai", "anthropic"]).optional(),
  messages: z.array(chatMessageSchema).min(1).max(40),
});

const houseSystemEnum = z.enum(["placidus", "wholeSign", "koch", "equal", "campanus", "regiomontanus"]);
const querySchema = z.object({ houseSystem: houseSystemEnum.default("placidus") });

/** Once SSE headers are sent, we can no longer send a normal HTTP error response — emit an SSE error event instead. */
function writeSseError(res: import("express").Response, err: unknown): void {
  console.error(err);
  const message = err instanceof Error ? err.message : "AI analysis failed";
  res.write(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`);
  res.end();
}

aiRouter.post("/synastry/:id", aiRateLimiter, async (req, res, next) => {
  try {
    const { provider, force } = bodySchema.parse(req.body ?? {});
    const report = await prisma.synastryReport.findUnique({
      where: { id: String(req.params.id) },
      include: { personA: true, personB: true },
    });
    if (!report) {
      res.status(404).json({ error: "Synastry report not found" });
      return;
    }

    const providerName: AiProviderName = provider ?? "anthropic";

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    if (!force && report.aiAnalysisMarkdown && report.aiProvider === providerName && report.aiPromptVersion === PROMPT_VERSION) {
      res.write(`event: cached\ndata: ${JSON.stringify({ text: report.aiAnalysisMarkdown, archetypeName: report.archetypeName })}\n\n`);
      res.end();
      return;
    }

    const synastryData = JSON.parse(report.dataJson) as SynastryData;
    const prompt = buildSynastryPrompt(
      synastryData,
      report.personA.name,
      report.personB.name,
      report.relationshipType as "romantic" | "friendship",
      report.readingStyle as "clever" | "flirty" | "funny" | "mythic" | "brutal" | "other",
      report.customStyleText,
    );
    const aiProvider = resolveProvider(providerName);

    try {
      const rawText = await aiProvider.streamCompletion([{ role: "user", content: prompt }], {
        onToken: (token) => {
          res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
        },
      });
      const { archetypeName, body } = extractArchetype(rawText);

      await prisma.synastryReport.update({
        where: { id: report.id },
        data: { aiAnalysisMarkdown: body, aiProvider: providerName, aiPromptVersion: PROMPT_VERSION, archetypeName },
      });

      res.write(`event: done\ndata: ${JSON.stringify({ text: body, archetypeName })}\n\n`);
      res.end();
    } catch (streamErr) {
      writeSseError(res, streamErr);
    }
  } catch (err) {
    next(err);
  }
});

aiRouter.post("/natal/:personId", aiRateLimiter, async (req, res, next) => {
  try {
    const { provider, force } = bodySchema.parse(req.body ?? {});
    const { houseSystem } = querySchema.parse(req.query);
    const person = await prisma.person.findUnique({ where: { id: String(req.params.personId) } });
    if (!person) {
      res.status(404).json({ error: "Person not found" });
      return;
    }

    const record = await getOrComputeChart(person, houseSystem as HouseSystem);
    const providerName: AiProviderName = provider ?? "anthropic";

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    if (!force && record.aiAnalysisMarkdown && record.aiProvider === providerName && record.aiPromptVersion === PROMPT_VERSION) {
      res.write(`event: cached\ndata: ${JSON.stringify({ text: record.aiAnalysisMarkdown })}\n\n`);
      res.end();
      return;
    }

    const prompt = buildNatalPrompt(record.chart, person.name);
    const aiProvider = resolveProvider(providerName);

    try {
      const fullText = await aiProvider.streamCompletion([{ role: "user", content: prompt }], {
        onToken: (token) => {
          res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
        },
      });

      await prisma.chart.update({
        where: { id: record.id },
        data: { aiAnalysisMarkdown: fullText, aiProvider: providerName, aiPromptVersion: PROMPT_VERSION },
      });

      res.write(`event: done\ndata: ${JSON.stringify({ text: fullText })}\n\n`);
      res.end();
    } catch (streamErr) {
      writeSseError(res, streamErr);
    }
  } catch (err) {
    next(err);
  }
});

aiRouter.post("/natal/:personId/chat", aiRateLimiter, async (req, res, next) => {
  try {
    const { provider, messages } = chatBodySchema.parse(req.body ?? {});
    const { houseSystem } = querySchema.parse(req.query);
    const person = await prisma.person.findUnique({ where: { id: String(req.params.personId) } });
    if (!person) {
      res.status(404).json({ error: "Person not found" });
      return;
    }

    const record = await getOrComputeChart(person, houseSystem as HouseSystem);
    const providerName: AiProviderName = provider ?? "anthropic";
    const context = buildNatalChatContext(record.chart, person.name);
    const aiProvider = resolveProvider(providerName);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
      const fullText = await aiProvider.streamCompletion([{ role: "system", content: context }, ...messages], {
        onToken: (token) => {
          res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
        },
      });
      res.write(`event: done\ndata: ${JSON.stringify({ text: fullText })}\n\n`);
      res.end();
    } catch (streamErr) {
      writeSseError(res, streamErr);
    }
  } catch (err) {
    next(err);
  }
});

aiRouter.post("/synastry/:id/chat", aiRateLimiter, async (req, res, next) => {
  try {
    const { provider, messages } = chatBodySchema.parse(req.body ?? {});
    const report = await prisma.synastryReport.findUnique({
      where: { id: String(req.params.id) },
      include: { personA: true, personB: true },
    });
    if (!report) {
      res.status(404).json({ error: "Synastry report not found" });
      return;
    }

    const providerName: AiProviderName = provider ?? "anthropic";
    const synastryData = JSON.parse(report.dataJson) as SynastryData;
    const context = buildSynastryChatContext(
      synastryData,
      report.personA.name,
      report.personB.name,
      report.relationshipType as "romantic" | "friendship",
      report.readingStyle as "clever" | "flirty" | "funny" | "mythic" | "brutal" | "other",
      report.customStyleText,
    );
    const aiProvider = resolveProvider(providerName);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
      const fullText = await aiProvider.streamCompletion([{ role: "system", content: context }, ...messages], {
        onToken: (token) => {
          res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
        },
      });
      res.write(`event: done\ndata: ${JSON.stringify({ text: fullText })}\n\n`);
      res.end();
    } catch (streamErr) {
      writeSseError(res, streamErr);
    }
  } catch (err) {
    next(err);
  }
});
