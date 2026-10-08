import { useState } from "react";
import { GENERAL_TERMS, HOUSE_MEANINGS, PATTERN_MEANINGS, type GlossaryEntry } from "../../content/glossary.js";
import { Modal } from "../ui/Modal.js";

export type GlossaryTopic = "houses" | "patterns" | "hellenistic";

interface TopicContent {
  title: string;
  intro: string;
  entries: GlossaryEntry[];
}

function patternTitle(type: string): string {
  const words = type.replace(/([A-Z])/g, " $1");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const TOPICS: Record<GlossaryTopic, TopicContent> = {
  houses: {
    title: "What are houses?",
    intro:
      "The chart is divided into 12 houses, each an area of life. A planet's sign describes how it acts; its house shows where that energy plays out. Houses depend on an exact birth time.",
    entries: Object.values(HOUSE_MEANINGS),
  },
  patterns: {
    title: "Aspect patterns",
    intro: "Patterns are shapes formed when three or more aspects link up. They concentrate a chart's energy into a recognizable theme.",
    entries: Object.entries(PATTERN_MEANINGS).map(([type, body]) => ({ title: patternTitle(type), body })),
  },
  hellenistic: {
    title: "Hellenistic techniques",
    intro: "Classical techniques from Greco-Roman astrology that read the chart through sect, calculated lots, and yearly timing.",
    entries: GENERAL_TERMS.filter((entry) => ["Sect", "Hellenistic lots", "Annual profections"].includes(entry.title)),
  },
};

/** In-place explanation of a glossary topic, so readers keep their place in the report. */
export function GlossaryHelp({ topic, label }: { topic: GlossaryTopic; label: string }) {
  const [open, setOpen] = useState(false);
  const content = TOPICS[topic];

  return (
    <>
      <button type="button" className="text-link text-xs" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={content.title}>
        <p className="mb-4 text-sm text-muted">{content.intro}</p>
        <dl className="glossary-list">
          {content.entries.map((entry) => (
            <div key={entry.title}>
              <dt>{entry.title}</dt>
              <dd>{entry.body}</dd>
            </div>
          ))}
        </dl>
      </Modal>
    </>
  );
}
