import { describe, expect, it } from "vitest";
import {
  buildReadingSchema,
  formatReading,
  markdownToReading,
  normalizeReading,
  parsePartialJson,
  READING_LIMITS,
  renderReadingMarkdown,
  type ReadingSpec,
} from "../src/services/ai/reading-format.js";

const SECTIONS = ["Overall Summary", "Communication", "Growth & Challenges"];
const REPORT: ReadingSpec = { schemaName: "test_reading", sections: SECTIONS, archetype: true, headingLevel: 2 };
const CHAT: ReadingSpec = { schemaName: "chat_answer", archetype: false, headingLevel: 3 };

const sample = {
  archetypeName: "The Twin Lanterns",
  sections: [
    {
      heading: "Overall Summary",
      blocks: [
        { kind: "paragraph", text: "Two **Libra Suns** share one frequency.", items: [] },
        { kind: "bullets", text: "", items: ["**Sun conjunct Sun** (0.17\u00b0)", "*Venus* trine Moon"] },
      ],
    },
    {
      heading: "Communication",
      blocks: [
        { kind: "numbered", text: "", items: ["Listen first", "Then speak"] },
        { kind: "quote", text: "A pebble in the shoe and a brilliant idea at 2 a.m.", items: [] },
      ],
    },
  ],
};

function walkObjects(node: unknown, visit: (node: Record<string, unknown>) => void): void {
  if (Array.isArray(node)) node.forEach((child) => walkObjects(child, visit));
  else if (node && typeof node === "object") {
    const record = node as Record<string, unknown>;
    if (record.type === "object") visit(record);
    Object.values(record).forEach((child) => walkObjects(child, visit));
  }
}

describe("reading schema", () => {
  it("is strict: every object closes additional properties and requires all of its properties", () => {
    const schema = buildReadingSchema(REPORT);
    let objects = 0;
    walkObjects(schema, (node) => {
      objects++;
      expect(node.additionalProperties).toBe(false);
      expect(node.required).toEqual(Object.keys(node.properties as object));
    });
    expect(objects).toBe(3);
    expect(JSON.stringify(schema)).toContain('"enum":["Overall Summary","Communication","Growth & Challenges"]');
    expect(JSON.stringify(schema)).not.toMatch(/minLength|maxLength|minimum|maximum|anyOf|oneOf/);
  });

  it("omits the archetype field and heading enum for free-form chat answers", () => {
    const schema = JSON.stringify(buildReadingSchema(CHAT));
    expect(schema).not.toContain("archetypeName");
    expect(schema).not.toContain('"enum":["Overall');
  });
});

describe("formatReading", () => {
  it("renders valid JSON into canonical markdown", () => {
    const result = formatReading(JSON.stringify(sample), REPORT);
    expect(result).toEqual({
      archetypeName: "The Twin Lanterns",
      complete: true,
      markdown: [
        "## Overall Summary",
        "Two **Libra Suns** share one frequency.",
        "- **Sun conjunct Sun** (0.17\u00b0)\n- *Venus* trine Moon",
        "## Communication",
        "1. Listen first\n2. Then speak",
        "> A pebble in the shoe and a brilliant idea at 2 a.m.",
      ].join("\n\n"),
    });
  });

  it("is deterministic for identical input", () => {
    const raw = JSON.stringify(sample);
    expect(formatReading(raw, REPORT)).toEqual(formatReading(raw, REPORT));
  });

  it("neutralizes block markdown, links, HTML, and code smuggled into text fields", () => {
    const hostile = {
      archetypeName: '**"ARCHETYPE: Star Crossed."**',
      sections: [
        {
          heading: "## overall summary:",
          blocks: [
            {
              kind: "paragraph",
              text: "Intro line\n## Fake heading\n- fake bullet\n> fake quote\n---\n[click](https://evil.example) <script>alert(1)</script> `code` **unclosed",
              items: [],
            },
            { kind: "bullets", text: "", items: ["- already bulleted", "3. already numbered", "   "] },
          ],
        },
      ],
    };
    const result = formatReading(JSON.stringify(hostile), REPORT)!;
    expect(result.archetypeName).toBe("Star Crossed");
    expect(result.markdown).toBe(
      "## Overall Summary\n\nIntro line Fake heading fake bullet fake quote click alert(1) code unclosed\n\n- already bulleted\n- already numbered",
    );
    expect(result.markdown).not.toMatch(/https?:|<|`/);
  });

  it("escapes a leading ordinal in prose so it cannot start a list", () => {
    const doc = { sections: [{ heading: "", blocks: [{ kind: "paragraph", text: "1990. A pivotal year.", items: [] }] }] };
    expect(formatReading(JSON.stringify(doc), CHAT)!.markdown).toBe("1990\\. A pivotal year.");
  });

  it("drops unknown headings, merges duplicates, and restores canonical order regardless of casing", () => {
    const messy = {
      archetypeName: "",
      sections: [
        { heading: "Growth & Challenges", blocks: [{ kind: "paragraph", text: "Grow.", items: [] }] },
        { heading: "Bonus Section", blocks: [{ kind: "paragraph", text: "Invented.", items: [] }] },
        { heading: "overall SUMMARY", blocks: [{ kind: "paragraph", text: "First.", items: [] }] },
        { heading: "Overall Summary", blocks: [{ kind: "paragraph", text: "Second.", items: [] }] },
      ],
    };
    const result = formatReading(JSON.stringify(messy), REPORT)!;
    expect(result.archetypeName).toBeNull();
    expect(result.markdown).toBe("## Overall Summary\n\nFirst.\n\nSecond.\n\n## Growth & Challenges\n\nGrow.");
  });

  it("repairs mismatched block kinds and merges adjacent lists", () => {
    const doc = {
      sections: [
        {
          heading: "Answer",
          blocks: [
            { kind: "Bullets", text: "Lead-in.", items: ["a"] },
            { kind: "bullets", text: "", items: ["b"] },
            { kind: "paragraph", text: "", items: ["c"] },
            { kind: "numbered", text: "", items: [] },
            { kind: "table", text: "Recovered prose.", items: [] },
          ],
        },
      ],
    };
    expect(formatReading(JSON.stringify(doc), CHAT)!.markdown).toBe("### Answer\n\nLead-in.\n\n- a\n- b\n- c\n\nRecovered prose.");
  });

  it("enforces size limits", () => {
    const long = "word ".repeat(2000);
    const doc = {
      sections: Array.from({ length: 30 }, (_, index) => ({
        heading: `Part ${index}`,
        blocks: [{ kind: "bullets", text: "", items: Array.from({ length: 50 }, () => long) }],
      })),
    };
    const reading = normalizeReading(doc, CHAT);
    expect(reading.sections).toHaveLength(READING_LIMITS.sections);
    expect(reading.sections[0]!.blocks[0]!.items).toHaveLength(READING_LIMITS.items);
    expect(reading.sections[0]!.blocks[0]!.items[0]!.length).toBeLessThanOrEqual(READING_LIMITS.text + 1);
  });

  it("accepts fenced JSON and returns null when nothing usable exists", () => {
    expect(formatReading("```json\n" + JSON.stringify(sample) + "\n```", REPORT)!.complete).toBe(true);
    expect(formatReading("", REPORT)).toBeNull();
    expect(formatReading('{"sections":[]}', REPORT)).toBeNull();
  });

  it("recovers truncated JSON but marks it incomplete so it is never cached", () => {
    const raw = JSON.stringify(sample);
    const truncated = raw.slice(0, raw.indexOf("Then speak") + 4);
    const result = formatReading(truncated, REPORT)!;
    expect(result.complete).toBe(false);
    expect(result.markdown).toContain("1. Listen first\n2. Then");
  });

  it("converts loose markdown from providers that ignore the schema", () => {
    const legacy = "ARCHETYPE: The Long Table\n\n# Report\n\nOpening.\nStill opening.\n\n**Communication**\n\n- one\n- two\n\n1. first\n\n> quoted\n\n---\n\nClosing.";
    expect(markdownToReading(legacy).archetypeName).toBe("The Long Table");
    const result = formatReading(legacy, REPORT)!;
    expect(result.complete).toBe(true);
    expect(result.markdown).toBe(
      "## Report\n\nOpening. Still opening.\n\n## Communication\n\n- one\n- two\n\n1. first\n\n> quoted\n\nClosing.",
    );
  });
});

describe("parsePartialJson", () => {
  it("never throws on any prefix and converges on the complete document", () => {
    const raw = JSON.stringify(sample, null, 2);
    let lastMarkdown = "";
    for (let end = 0; end <= raw.length; end++) {
      const snapshot = formatReading(raw.slice(0, end), REPORT, true);
      if (snapshot) lastMarkdown = snapshot.markdown;
    }
    expect(lastMarkdown).toBe(formatReading(raw, REPORT)!.markdown);
  });

  it("closes open strings and drops dangling keys", () => {
    expect(parsePartialJson('{"sections":[{"heading":"Over')).toEqual({ sections: [{ heading: "Over" }] });
    expect(parsePartialJson('{"sections":[{"heading":"A","blo')).toEqual({ sections: [{ heading: "A" }] });
    expect(parsePartialJson('{"sections":[{"heading":"A","blocks":')).toEqual({ sections: [{ heading: "A" }] });
    expect(parsePartialJson('{"a":"x\\')).toEqual({ a: "x" });
    expect(parsePartialJson('{"a":"\\u00')).toEqual({ a: "" });
  });
});

describe("renderReadingMarkdown", () => {
  it("omits empty headings for free-form answers", () => {
    expect(
      renderReadingMarkdown({ archetypeName: null, sections: [{ heading: "", blocks: [{ kind: "paragraph", text: "Hi.", items: [] }] }] }, 3),
    ).toBe("Hi.");
  });
});
