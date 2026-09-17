import type { AiMessage, AiProvider, AiStreamCallbacks } from "./types.js";

/** Used automatically when no provider API key is configured, so the app is usable without any AI account. */
export class MockAiProvider implements AiProvider {
  constructor(public name: AiProvider["name"]) {}

  async streamCompletion(_messages: AiMessage[], callbacks: AiStreamCallbacks): Promise<string> {
    const text =
      "_No AI provider API key is configured on the server (set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env for real AI analysis)._\n\n" +
      "This is a placeholder report; the computed chart data (aspects, overlays, and scores) above is real and unaffected.";
    const chunks = text.match(/.{1,24}/g) ?? [text];
    for (const chunk of chunks) {
      callbacks.onToken(chunk);
    }
    return text;
  }
}
