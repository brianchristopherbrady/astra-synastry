import { describe, expect, it } from "vitest";
import { computeNatalChart, computeSynastry } from "@astro/astro-engine";
import { buildNatalChatContext, buildNatalPrompt, buildSynastryPrompt } from "../src/services/ai/prompt-builder.js";

const birth = {
  localDateTime: "1990-06-15T10:30:00",
  timezone: "Europe/London",
  latitude: 51.5,
  longitude: -0.12,
  locationName: "London",
  timeUnknown: false,
};

describe("zodiac grounding in prompts", () => {
  it("labels sidereal positions with their ayanamsa so the model does not reinterpret them as tropical", () => {
    const sidereal = computeNatalChart(birth, "placidus", "sidereal", "fagan_bradley");
    const prompt = buildNatalPrompt(sidereal, "Alex");
    expect(prompt).toContain("sidereal zodiac (Fagan-Bradley ayanamsa)");
    expect(buildNatalChatContext(sidereal, "Alex")).toContain("sidereal zodiac (Fagan-Bradley ayanamsa)");
    expect(buildSynastryPrompt(computeSynastry(sidereal, sidereal), "Alex", "Sam")).toContain("sidereal zodiac (Fagan-Bradley ayanamsa)");
  });

  it("leaves tropical prompts unchanged", () => {
    const tropical = computeNatalChart(birth, "placidus");
    expect(buildNatalPrompt(tropical, "Alex")).not.toContain("sidereal");
  });
});
