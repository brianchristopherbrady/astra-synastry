import { POINT_LABELS } from "@astro/shared";
import type { AspectHit, Ayanamsa, ChartData, ReadingStyle, RelationshipType, SynastryData } from "@astro/shared";

export const PROMPT_VERSION = "v3";

export const NATAL_SECTIONS = [
  "Overall Summary",
  "Personality & Identity",
  "Emotional Nature",
  "Communication & Mind",
  "Love & Relating",
  "Career & Purpose",
  "Growth & Challenges",
] as const;

export function synastrySections(relationshipType: RelationshipType = "romantic"): string[] {
  const bond = relationshipType === "friendship" ? "Camaraderie & Shared Adventure" : "Attraction & Passion";
  return ["Overall Summary", "Communication", "Emotional Connection", bond, "Long-Term Stability", "Growth & Challenges"];
}

const TEXT_RULES =
  "Text fields are plain prose: never include headings, list markers, numbering, links, tables, code, or HTML. The only inline formatting allowed is **bold** for named placements, aspects, and scores, and *italic* for occasional emphasis.";

function reportFormatRules(sections: readonly string[]): string {
  return [
    `Return the reading as JSON matching the provided schema. Include each of these sections exactly once, in this order: ${sections.join(", ")}.`,
    "Give each section 2-4 blocks. Use paragraph blocks of 2-4 sentences for interpretation, a bullets block when listing several placements or aspects (one per item), numbered only for ranked or sequential points, and at most one quote block in the whole reading for a single memorable line.",
    TEXT_RULES,
  ].join(" ");
}

const CHAT_FORMAT_RULES = [
  "Respond as JSON matching the provided schema.",
  "For a simple answer use one section with an empty heading and 1-3 short paragraph blocks; add short headings only when the answer has distinct parts. Use a bullets block for lists of placements or aspects.",
  TEXT_RULES,
].join(" ");

const AYANAMSA_LABELS: Record<Ayanamsa, string> = {
  lahiri: "Lahiri",
  raman: "Raman",
  krishnamurti: "Krishnamurti",
  fagan_bradley: "Fagan-Bradley",
  yukteshwar: "Yukteshwar",
};

/** Sidereal charts list signs roughly 24 degrees earlier than tropical; without this the model may "correct" them. */
function zodiacNote(chart: ChartData): string[] {
  if (chart.zodiacMode !== "sidereal") return [];
  const ayanamsa = AYANAMSA_LABELS[chart.ayanamsa ?? "lahiri"];
  return [
    `All positions below are in the sidereal zodiac (${ayanamsa} ayanamsa), not the tropical zodiac. Interpret every sign exactly as listed, say "sidereal" when naming a sign would otherwise be ambiguous, and never convert positions back to tropical.`,
  ];
}

function describeChartPoints(chart: ChartData): string {
  return Object.values(chart.points)
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map(
      (p) =>
        `- ${POINT_LABELS[p.point]}: ${p.sign} ${p.signDegree.toFixed(1)}°${p.house ? ` (house ${p.house})` : ""}${p.retrograde ? " Rx" : ""}`,
    )
    .join("\n");
}

function describeAspects(aspects: AspectHit[]): string {
  if (aspects.length === 0) return "(no major cross-aspects found within orb)";
  return aspects
    .slice()
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 40)
    .map((a) => `- ${POINT_LABELS[a.pointA]} ${a.aspect} ${POINT_LABELS[a.pointB]} (orb ${a.orb.toFixed(2)}°)`)
    .join("\n");
}

function relationshipFraming(type: RelationshipType): string {
  if (type === "friendship") {
    return "Frame this ENTIRELY as a platonic friendship reading. Do not discuss romantic attraction, sexual chemistry, or partnership/marriage potential. Focus on camaraderie, loyalty, shared adventures, how they support and challenge each other, and the dynamics of spending time together.";
  }
  return "Frame this as a romantic relationship reading \u2014 attraction, chemistry, partnership potential, and long-term romantic compatibility.";
}

function styleInstruction(style: ReadingStyle, customStyleText?: string): string {
  switch (style) {
    case "clever":
      return "Write in a clever, witty, incisive voice \u2014 sharp observations, smart wordplay, and quiet confidence.";
    case "flirty":
      return "Write in a flirty, playful, teasing voice, full of warmth and charm.";
    case "funny":
      return "Write in a funny, lighthearted, comedic voice \u2014 don't be afraid of jokes and playful exaggeration.";
    case "mythic":
      return "Write in a mythic, epic voice, as if narrating a legend \u2014 invoke archetypes, gods, and grand metaphor.";
    case "brutal":
      return "Write in a brutally honest, blunt, unsparing voice \u2014 no sugar-coating, direct and unflinching, but still fair and evidence-based.";
    case "other":
      return customStyleText?.trim()
        ? `Write in this specific requested style/voice: ${customStyleText.trim()}`
        : "Write in a warm, insightful voice.";
    default:
      return "Write in a warm, insightful voice.";
  }
}

/** Builds a fact-grounded prompt strictly from already-computed chart data (no invented placements). */
export function buildSynastryPrompt(
  synastry: SynastryData,
  personAName: string,
  personBName: string,
  relationshipType: RelationshipType = "romantic",
  readingStyle: ReadingStyle = "clever",
  customStyleText?: string,
): string {
  const lines: string[] = [
    `You are an expert, grounded astrologer writing a synastry (relationship compatibility) analysis for ${personAName} and ${personBName}.`,
    relationshipFraming(relationshipType),
    styleInstruction(readingStyle, customStyleText),
    `Base your analysis STRICTLY on the computed placements and aspects listed below. Do not invent any placement, aspect, or house position that is not explicitly listed. If data is missing (e.g. no houses because a birth time is unknown), say so rather than guessing.`,
    ...zodiacNote(synastry.personAChart),
    "",
    `## ${personAName}'s placements`,
    describeChartPoints(synastry.personAChart),
    "",
    `## ${personBName}'s placements`,
    describeChartPoints(synastry.personBChart),
    "",
    `## Cross-chart aspects (${personAName} to ${personBName})`,
    describeAspects(synastry.crossAspects),
    "",
    `## Compatibility scores (0-100, computed deterministically, not AI-generated)`,
    `Overall: ${synastry.compatibilityScore.overall}`,
    ...Object.entries(synastry.compatibilityScore.categories).map(([category, score]) => `${category}: ${score}`),
    "",
    `Set archetypeName to a short, vivid 2-6 word archetypal or mythic name for this SPECIFIC pairing (not a generic zodiac combination name \u2014 make it feel bespoke to their actual placements/aspects).`,
    `Reference specific aspects/placements from the data above to support each point.`,
    reportFormatRules(synastrySections(relationshipType)),
  ];
  return lines.join("\n");
}

function describePatterns(chart: ChartData): string {
  if (chart.patterns.length === 0) return "(no major aspect patterns detected)";
  return chart.patterns.map((p) => `- ${p.description}`).join("\n");
}

/** Builds a fact-grounded prompt for a single person's own natal chart reading. */
export function buildNatalPrompt(chart: ChartData, personName: string): string {
  const lines: string[] = [
    `You are an expert, grounded astrologer writing a personal natal chart reading for ${personName}.`,
    `Base your analysis STRICTLY on the computed placements, aspects, and patterns listed below. Do not invent any placement, aspect, or house position that is not explicitly listed. If houses are missing (birth time unknown), say so rather than guessing.`,
    ...zodiacNote(chart),
    "",
    `## ${personName}'s placements`,
    describeChartPoints(chart),
    "",
    `## Aspects`,
    describeAspects(chart.aspects),
    "",
    `## Detected aspect patterns`,
    describePatterns(chart),
    "",
    "Write a warm, insightful, and honest natal chart reading. Reference specific placements/aspects from the data above to support each point.",
    reportFormatRules(NATAL_SECTIONS),
  ];
  return lines.join("\n");
}

/** Grounding context for a natal chat: the raw facts, without the "write a full report" instruction. */
export function buildNatalChatContext(chart: ChartData, personName: string): string {
  const lines: string[] = [
    `You are an expert, grounded astrologer answering questions about ${personName}'s natal chart.`,
    `Base every answer STRICTLY on the computed data below. Do not invent any placement, aspect, or house position that is not explicitly listed. If houses are missing (birth time unknown), say so rather than guessing. Keep answers conversational and reasonably concise unless the user asks for more depth.`,
    CHAT_FORMAT_RULES,
    ...zodiacNote(chart),
    "",
    `## ${personName}'s placements`,
    describeChartPoints(chart),
    "",
    `## Aspects`,
    describeAspects(chart.aspects),
    "",
    `## Detected aspect patterns`,
    describePatterns(chart),
  ];
  return lines.join("\n");
}

/** Grounding context for a synastry chat: the raw facts, without the "write a full report" instruction. */
export function buildSynastryChatContext(
  synastry: SynastryData,
  personAName: string,
  personBName: string,
  relationshipType: RelationshipType = "romantic",
  readingStyle: ReadingStyle = "clever",
  customStyleText?: string,
): string {
  const lines: string[] = [
    `You are an expert, grounded astrologer answering questions about the synastry (relationship compatibility) between ${personAName} and ${personBName}.`,
    relationshipFraming(relationshipType),
    styleInstruction(readingStyle, customStyleText),
    `Base every answer STRICTLY on the computed data below. Do not invent any placement, aspect, or house position that is not explicitly listed. Keep answers conversational and reasonably concise unless the user asks for more depth.`,
    CHAT_FORMAT_RULES,
    ...zodiacNote(synastry.personAChart),
    "",
    `## ${personAName}'s placements`,
    describeChartPoints(synastry.personAChart),
    "",
    `## ${personBName}'s placements`,
    describeChartPoints(synastry.personBChart),
    "",
    `## Cross-chart aspects (${personAName} to ${personBName})`,
    describeAspects(synastry.crossAspects),
    "",
    `## Compatibility scores (0-100, computed deterministically, not AI-generated)`,
    `Overall: ${synastry.compatibilityScore.overall}`,
    ...Object.entries(synastry.compatibilityScore.categories).map(([category, score]) => `${category}: ${score}`),
  ];
  return lines.join("\n");
}
