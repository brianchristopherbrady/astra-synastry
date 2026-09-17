import type { AiProviderName } from "@astro/shared";
import { config } from "../../config.js";
import { OpenAiProvider } from "./openai.provider.js";
import { AnthropicProvider } from "./anthropic.provider.js";
import { MockAiProvider } from "./mock.provider.js";
import type { AiProvider } from "./types.js";

export function resolveProvider(name: AiProviderName): AiProvider {
  if (name === "openai" && config.ai.openaiApiKey) return new OpenAiProvider();
  if (name === "anthropic" && config.ai.anthropicApiKey) return new AnthropicProvider();
  return new MockAiProvider(name);
}
