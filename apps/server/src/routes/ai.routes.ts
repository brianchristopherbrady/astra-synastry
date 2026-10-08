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
  NATAL_SECTIONS,
  PROMPT_VERSION,
  synastrySections,
} from "../services/ai/prompt-builder.js";
import { resolveProvider } from "../services/ai/ai.service.js";
import { buildReadingSchema, formatReading, type FormattedReading, type ReadingSpec } from "../services/ai/reading-format.js";
import type { AiMessage, AiProvider } from "../services/ai/types.js";
import { getOrComputeChart } from "../services/chart.service.js";

export const aiRouter: Router = Router();

const bodySchema = z.object({
  provider: z.enum(["openai", "anthropic"]).optional(),
  force: z.boolean().optional(),
});

// Assistant turns include the seeded full reading, which routinely exceeds a typical user message.
const chatMessageSchema = z.discriminatedUnion("role", [
  z.object({ role: z.literal("user"), content: z.string().min(1).max(8000) }),
  z.object({ role: z.literal("assistant"), content: z.string().min(1).max(24000) }),
]);
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

const SNAPSHOT_INTERVAL_MS = 200;
const REPORT_MAX_TOKENS = 8000;
const CHAT_SPEC: ReadingSpec = { schemaName: "chat_answer", archetype: false, headingLevel: 3 };

/** Streams schema-constrained JSON from the provider as formatted markdown snapshots; resolves with the validated final reading. */
async function streamFormattedReading(
  res: import("express").Response,
  provider: AiProvider,
  messages: AiMessage[],
  spec: ReadingSpec,
  maxTokens?: number,
): Promise<FormattedReading> {
  let raw = "";
  let lastSnapshot = "";
  let lastSentAt = 0;
  const fullText = await provider.streamCompletion(
    messages,
    {
      onToken: (token) => {
        raw += token;
        const now = Date.now();
        if (now - lastSentAt < SNAPSHOT_INTERVAL_MS) return;
        lastSentAt = now;
        const snapshot = formatReading(raw, spec, true);
        if (snapshot && snapshot.markdown !== lastSnapshot) {
          lastSnapshot = snapshot.markdown;
          res.write(`event: snapshot\ndata: ${JSON.stringify({ text: snapshot.markdown })}\n\n`);
        }
      },
    },
    { jsonSchema: { name: spec.schemaName, schema: buildReadingSchema(spec) }, maxTokens },
  );
  const reading = formatReading(fullText, spec);
  if (!reading) throw new Error("The AI response could not be formatted. Please try again.");
  return reading;
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
    const relationshipType = report.relationshipType as "romantic" | "friendship";
    const prompt = buildSynastryPrompt(
      synastryData,
      report.personA.name,
      report.personB.name,
      relationshipType,
      report.readingStyle as "clever" | "flirty" | "funny" | "mythic" | "brutal" | "other",
      report.customStyleText,
    );
    const aiProvider = resolveProvider(providerName);
    const spec: ReadingSpec = { schemaName: "synastry_reading", sections: synastrySections(relationshipType), archetype: true, headingLevel: 2 };

    try {
      const reading = await streamFormattedReading(res, aiProvider, [{ role: "user", content: prompt }], spec, REPORT_MAX_TOKENS);
      if (reading.complete) {
        await prisma.synastryReport.update({
          where: { id: report.id },
          data: { aiAnalysisMarkdown: reading.markdown, aiProvider: providerName, aiPromptVersion: PROMPT_VERSION, archetypeName: reading.archetypeName },
        });
      }

      res.write(`event: done\ndata: ${JSON.stringify({ text: reading.markdown, archetypeName: reading.archetypeName })}\n\n`);
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
    const spec: ReadingSpec = { schemaName: "natal_reading", sections: NATAL_SECTIONS, archetype: false, headingLevel: 2 };

    try {
      const reading = await streamFormattedReading(res, aiProvider, [{ role: "user", content: prompt }], spec, REPORT_MAX_TOKENS);
      if (reading.complete) {
        await prisma.chart.update({
          where: { id: record.id },
          data: { aiAnalysisMarkdown: reading.markdown, aiProvider: providerName, aiPromptVersion: PROMPT_VERSION },
        });
      }

      res.write(`event: done\ndata: ${JSON.stringify({ text: reading.markdown })}\n\n`);
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
      const reading = await streamFormattedReading(res, aiProvider, [{ role: "system", content: context }, ...messages], CHAT_SPEC);
      res.write(`event: done\ndata: ${JSON.stringify({ text: reading.markdown })}\n\n`);
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
      const reading = await streamFormattedReading(res, aiProvider, [{ role: "system", content: context }, ...messages], CHAT_SPEC);
      res.write(`event: done\ndata: ${JSON.stringify({ text: reading.markdown })}\n\n`);
      res.end();
    } catch (streamErr) {
      writeSseError(res, streamErr);
    }
  } catch (err) {
    next(err);
  }
});
