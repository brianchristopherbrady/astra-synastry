import { config } from "../../config.js";
import { readOpenAiSse } from "./sse.js";
import type { AiCompletionOptions, AiMessage, AiProvider, AiStreamCallbacks } from "./types.js";

export class OpenAiProvider implements AiProvider {
  name = "openai" as const;

  async streamCompletion(messages: AiMessage[], callbacks: AiStreamCallbacks, options: AiCompletionOptions = {}): Promise<string> {
    if (!config.ai.openaiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured on the server");
    }
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.ai.openaiApiKey}` },
      body: JSON.stringify({
        // Flagship model (not the cost-optimized tiers) — quality over cost for infrequent use.
        model: "gpt-6-astra",
        stream: true,
        messages,
        ...(options.maxTokens ? { max_completion_tokens: options.maxTokens } : {}),
        ...(options.jsonSchema
          ? { response_format: { type: "json_schema", json_schema: { name: options.jsonSchema.name, strict: true, schema: options.jsonSchema.schema } } }
          : {}),
      }),
    });
    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => "");
      throw new Error(`OpenAI request failed: ${response.status} ${text}`);
    }
    return readOpenAiSse(response.body, callbacks);
  }
}
