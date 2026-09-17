import { config } from "../../config.js";
import { readAnthropicSse } from "./sse.js";
import type { AiMessage, AiProvider, AiStreamCallbacks } from "./types.js";

export class AnthropicProvider implements AiProvider {
  name = "anthropic" as const;

  async streamCompletion(messages: AiMessage[], callbacks: AiStreamCallbacks): Promise<string> {
    if (!config.ai.anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured on the server");
    }
    // Anthropic takes system context as a top-level field, not as a message with role "system".
    const system = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");
    const conversation = messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.ai.anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        // Flagship model (not the speed-optimized Sonnet/Haiku tiers) — quality over cost for infrequent use.
        model: "claude-opus-5",
        max_tokens: 4000,
        stream: true,
        ...(system ? { system } : {}),
        messages: conversation,
      }),
    });
    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => "");
      throw new Error(`Anthropic request failed: ${response.status} ${text}`);
    }
    return readAnthropicSse(response.body, callbacks);
  }
}
