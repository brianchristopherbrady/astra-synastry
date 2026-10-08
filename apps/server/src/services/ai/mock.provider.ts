import type { AiCompletionOptions, AiMessage, AiProvider, AiStreamCallbacks } from "./types.js";

/** Used automatically when no provider API key is configured, so the app is usable without any AI account. */
export class MockAiProvider implements AiProvider {
  constructor(public name: AiProvider["name"]) {}

  async streamCompletion(_messages: AiMessage[], callbacks: AiStreamCallbacks, options: AiCompletionOptions = {}): Promise<string> {
    const notice = "_No AI provider API key is configured on the server (set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env for real AI analysis)._";
    const detail = "This is a placeholder report; the computed chart data (aspects, overlays, and scores) above is real and unaffected.";
    const text = options.jsonSchema
      ? JSON.stringify({
          ...("archetypeName" in ((options.jsonSchema.schema.properties as object | undefined) ?? {}) ? { archetypeName: "Placeholder Pairing" } : {}),
          sections: [
            {
              heading: "Overall Summary",
              blocks: [
                { kind: "paragraph", text: notice, items: [] },
                { kind: "paragraph", text: detail, items: [] },
              ],
            },
          ],
        })
      : `${notice}\n\n${detail}`;
    const chunks = text.match(/.{1,24}/g) ?? [text];
    for (const chunk of chunks) {
      callbacks.onToken(chunk);
    }
    return text;
  }
}
