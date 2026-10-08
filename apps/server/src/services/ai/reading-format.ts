/**
 * Deterministic formatting guardrails for AI output: the model supplies content as schema-constrained
 * JSON, and only this module produces markdown syntax. Model text can never introduce headings, lists,
 * links, HTML, or code; it may only use **bold** and *italic* inline emphasis.
 */

export type ReadingBlockKind = "paragraph" | "bullets" | "numbered" | "quote";

export interface ReadingBlock {
  kind: ReadingBlockKind;
  text: string;
  items: string[];
}

export interface ReadingSection {
  heading: string;
  blocks: ReadingBlock[];
}

export interface ReadingDocument {
  archetypeName: string | null;
  sections: ReadingSection[];
}

export interface ReadingSpec {
  schemaName: string;
  /** Allowed section headings in render order; omit to allow free-form (or empty) headings. */
  sections?: readonly string[];
  archetype: boolean;
  headingLevel: 2 | 3;
}

export interface FormattedReading {
  markdown: string;
  archetypeName: string | null;
  /** False when the output was truncated or unparseable and only partially recovered; never cache it. */
  complete: boolean;
}

const BLOCK_KINDS: readonly string[] = ["paragraph", "bullets", "numbered", "quote"];

export const READING_LIMITS = { sections: 12, blocks: 16, items: 20, text: 2400, heading: 80, archetype: 60 } as const;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** JSON schema shared by every provider; uses only features supported by both OpenAI strict mode and Anthropic structured outputs. */
export function buildReadingSchema(spec: ReadingSpec): JsonRecord {
  const block = {
    type: "object",
    additionalProperties: false,
    required: ["kind", "text", "items"],
    properties: {
      kind: {
        type: "string",
        enum: BLOCK_KINDS,
        description: "paragraph: prose in text. bullets/numbered: entries in items. quote: one memorable line in text.",
      },
      text: {
        type: "string",
        description: "Prose for paragraph or quote blocks, empty string for lists. Plain sentences; only **bold** and *italic* allowed.",
      },
      items: {
        type: "array",
        items: { type: "string" },
        description: "Entries for bullets or numbered blocks, empty array otherwise. Each entry is plain text without list markers.",
      },
    },
  };
  const heading = spec.sections
    ? { type: "string", enum: [...spec.sections], description: "Section heading; each heading appears once, in the listed order." }
    : { type: "string", description: "Short heading, or an empty string when the answer needs none." };
  const properties: JsonRecord = {};
  const required: string[] = [];
  if (spec.archetype) {
    properties.archetypeName = {
      type: "string",
      description: "A vivid 2-6 word archetypal or mythic name bespoke to this specific pairing.",
    };
    required.push("archetypeName");
  }
  properties.sections = {
    type: "array",
    items: {
      type: "object",
      additionalProperties: false,
      required: ["heading", "blocks"],
      properties: { heading, blocks: { type: "array", items: block } },
    },
  };
  required.push("sections");
  return { type: "object", additionalProperties: false, required, properties };
}

/** Best-effort parse of a streamed JSON prefix by closing open strings and containers. */
export function parsePartialJson(input: string): unknown {
  const closers: string[] = [];
  let inString = false;
  let escaped = false;
  let stringStart = -1;
  let stringIsKey = false;
  let previous = "";
  for (let index = 0; index < input.length; index++) {
    const char = input[index]!;
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') {
        inString = false;
        previous = stringIsKey ? "key" : "value";
      }
      continue;
    }
    if (char === " " || char === "\n" || char === "\r" || char === "\t") continue;
    if (char === '"') {
      inString = true;
      stringStart = index;
      stringIsKey = closers[closers.length - 1] === "}" && (previous === "{" || previous === ",");
      continue;
    }
    if (char === "{") closers.push("}");
    else if (char === "[") closers.push("]");
    else if (char === "}" || char === "]") closers.pop();
    previous = char;
  }

  let text = input;
  if (inString) {
    if (stringIsKey) text = text.slice(0, stringStart);
    else text = (escaped ? text.slice(0, -1) : text).replace(/\\u[0-9a-fA-F]{0,3}$/, "") + '"';
  } else if (previous === "key") {
    text = text.replace(/"(?:[^"\\]|\\.)*"\s*$/, "");
  }
  for (let before = ""; before !== text; ) {
    before = text;
    text = text.replace(/\s+$/, "").replace(/,$/, "").replace(/"(?:[^"\\]|\\.)*"\s*:$/, "");
  }
  try {
    return JSON.parse(text + closers.reverse().join(""));
  } catch {
    return undefined;
  }
}

function stripFence(raw: string): string {
  return raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

function parseCompleteJson(source: string): JsonRecord | undefined {
  const candidates = [source];
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start > 0 && end > start) candidates.push(source.slice(start, end + 1));
  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (isRecord(parsed) && Array.isArray(parsed.sections)) return parsed;
    } catch {
      // try the next candidate
    }
  }
  return undefined;
}

const LINE_MARKER = /^\s*(?:#{1,6}\s+|>\s?|[-*+\u2022]\s+)/;
const ORDINAL_MARKER = /^(\d{1,9})([.)])(\s)/;

function balanceStrong(text: string): string {
  if ((text.split("**").length - 1) % 2 === 0) return text;
  const at = text.lastIndexOf("**");
  return text.slice(0, at) + text.slice(at + 2);
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}\u2026`;
}

/** Reduces model text to a single line of prose with only bold/italic inline markdown. */
export function sanitizeInline(value: unknown, max: number = READING_LIMITS.text): string {
  if (typeof value !== "string") return "";
  const text = value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/`+/g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(LINE_MARKER, "").replace(/^\s*(?:[-*_]\s*){3,}$/, ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(ORDINAL_MARKER, "$1\\$2$3");
  return balanceStrong(truncate(text, max));
}

function sanitizeItem(value: unknown): string {
  return sanitizeInline(value).replace(/^\d{1,9}\\[.)]\s+/, "");
}

function sanitizeHeading(value: unknown): string {
  return sanitizeItem(value).slice(0, READING_LIMITS.heading).replace(/[*_]/g, "").replace(/[:.\s]+$/, "").trim();
}

function sanitizeArchetype(value: unknown): string | null {
  const name = sanitizeInline(value, READING_LIMITS.archetype)
    .replace(/[*_"\u201c\u201d]/g, "")
    .replace(/^archetype:\s*/i, "")
    .replace(/[.\s]+$/, "")
    .trim();
  return name || null;
}

function headingKey(heading: string): string {
  return heading.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
}

function normalizeBlocks(value: unknown): ReadingBlock[] {
  if (!Array.isArray(value)) return [];
  const blocks: ReadingBlock[] = [];
  const push = (block: ReadingBlock): void => {
    const last = blocks[blocks.length - 1];
    // Adjacent same-kind lists would otherwise render as one ambiguous loose list.
    if (last && last.kind === block.kind && (block.kind === "bullets" || block.kind === "numbered")) {
      last.items = [...last.items, ...block.items].slice(0, READING_LIMITS.items);
    } else if (blocks.length < READING_LIMITS.blocks) {
      blocks.push(block);
    }
  };
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const rawKind = typeof entry.kind === "string" ? entry.kind.trim().toLowerCase() : "";
    const text = sanitizeInline(entry.text);
    const items = Array.isArray(entry.items)
      ? entry.items.map(sanitizeItem).filter(Boolean).slice(0, READING_LIMITS.items)
      : [];
    const kind = (BLOCK_KINDS.includes(rawKind) ? rawKind : items.length ? "bullets" : "paragraph") as ReadingBlockKind;
    if (kind === "bullets" || kind === "numbered") {
      if (text) push({ kind: "paragraph", text, items: [] });
      if (items.length) push({ kind, text: "", items });
    } else {
      if (text) push({ kind, text, items: [] });
      if (items.length) push({ kind: "bullets", text: "", items });
    }
  }
  return blocks;
}

/** Validates and repairs arbitrary model JSON into a bounded document with canonical section order. */
export function normalizeReading(input: unknown, spec: ReadingSpec): ReadingDocument {
  const source = isRecord(input) ? input : {};
  const rawSections = Array.isArray(source.sections) ? source.sections : [];
  const canonical = spec.sections ? new Map(spec.sections.map((heading) => [headingKey(heading), heading])) : null;
  const sections: ReadingSection[] = [];

  for (const entry of rawSections) {
    if (!isRecord(entry)) continue;
    const blocks = normalizeBlocks(entry.blocks);
    if (blocks.length === 0) continue;
    let heading = sanitizeHeading(entry.heading);
    if (canonical) {
      const match = canonical.get(headingKey(heading));
      if (!match) continue;
      heading = match;
      const existing = sections.find((section) => section.heading === heading);
      if (existing) {
        existing.blocks = [...existing.blocks, ...blocks].slice(0, READING_LIMITS.blocks);
        continue;
      }
    } else {
      const last = sections[sections.length - 1];
      if (last && last.heading === heading) {
        last.blocks = [...last.blocks, ...blocks].slice(0, READING_LIMITS.blocks);
        continue;
      }
    }
    sections.push({ heading, blocks });
  }

  if (spec.sections) {
    const order = spec.sections.map(headingKey);
    sections.sort((a, b) => order.indexOf(headingKey(a.heading)) - order.indexOf(headingKey(b.heading)));
  }
  return {
    archetypeName: spec.archetype ? sanitizeArchetype(source.archetypeName) : null,
    sections: sections.slice(0, READING_LIMITS.sections),
  };
}

export function renderReadingMarkdown(doc: ReadingDocument, headingLevel: 2 | 3): string {
  const hashes = "#".repeat(headingLevel);
  const parts: string[] = [];
  for (const section of doc.sections) {
    if (section.heading) parts.push(`${hashes} ${section.heading}`);
    for (const block of section.blocks) {
      if (block.kind === "paragraph") parts.push(block.text);
      else if (block.kind === "quote") parts.push(`> ${block.text}`);
      else if (block.kind === "bullets") parts.push(block.items.map((item) => `- ${item}`).join("\n"));
      else parts.push(block.items.map((item, index) => `${index + 1}. ${item}`).join("\n"));
    }
  }
  return parts.join("\n\n");
}

/** Fallback for providers that ignore the schema: converts loose markdown into the same document shape. */
export function markdownToReading(markdown: string): JsonRecord {
  const sections: { heading: string; blocks: ReadingBlock[] }[] = [{ heading: "", blocks: [] }];
  let archetypeName: string | null = null;
  let paragraph: string[] = [];
  let list: { kind: "bullets" | "numbered"; items: string[] } | null = null;
  const current = () => sections[sections.length - 1]!;
  const flushParagraph = (): void => {
    if (paragraph.length) current().blocks.push({ kind: "paragraph", text: paragraph.join(" "), items: [] });
    paragraph = [];
  };
  const flushList = (): void => {
    if (list) current().blocks.push({ kind: list.kind, text: "", items: list.items });
    list = null;
  };

  for (const line of markdown.split(/\r?\n/)) {
    const trimmed = line.trim();
    const archetype = /^ARCHETYPE:\s*(.+)$/i.exec(trimmed);
    if (archetype && archetypeName === null) {
      archetypeName = archetype[1]!;
      continue;
    }
    const heading = /^#{1,6}\s+(.+)$/.exec(trimmed) ?? /^\*\*([^*]+)\*\*:?$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      flushList();
      sections.push({ heading: heading[1]!, blocks: [] });
      continue;
    }
    if (!trimmed || /^([-*_])(\s*\1){2,}$/.test(trimmed)) {
      flushParagraph();
      flushList();
      continue;
    }
    const bullet = /^[-*+\u2022]\s+(.+)$/.exec(trimmed);
    const numbered = /^\d{1,3}[.)]\s+(.+)$/.exec(trimmed);
    if (bullet || numbered) {
      flushParagraph();
      const kind = bullet ? "bullets" : "numbered";
      if (list && list.kind !== kind) flushList();
      list ??= { kind, items: [] };
      list.items.push((bullet ?? numbered)![1]!);
      continue;
    }
    const quote = /^>\s?(.*)$/.exec(trimmed);
    if (quote) {
      flushParagraph();
      flushList();
      current().blocks.push({ kind: "quote", text: quote[1]!, items: [] });
      continue;
    }
    flushList();
    paragraph.push(trimmed);
  }
  flushParagraph();
  flushList();
  return { archetypeName, sections };
}

/** Turns raw (possibly partial) model output into canonical markdown, or null when nothing usable exists. */
export function formatReading(raw: string, spec: ReadingSpec, partial = false): FormattedReading | null {
  const source = stripFence(raw);
  if (!source) return null;
  const looksLikeJson = source.startsWith("{");
  let parsed: unknown = partial ? undefined : parseCompleteJson(source);
  let complete = parsed !== undefined;
  let effectiveSpec = spec;

  if (parsed === undefined && looksLikeJson) parsed = parsePartialJson(source);
  if (parsed === undefined && !looksLikeJson) {
    parsed = markdownToReading(source);
    effectiveSpec = { ...spec, sections: undefined };
    complete = !partial;
  }
  if (parsed === undefined) return null;

  const doc = normalizeReading(parsed, effectiveSpec);
  if (doc.sections.length === 0) return null;
  return { markdown: renderReadingMarkdown(doc, spec.headingLevel), archetypeName: doc.archetypeName, complete };
}
