import type { AiStreamCallbacks } from "./types.js";

interface SseJson {
  choices?: { delta?: { content?: string } }[];
}

export async function readOpenAiSse(body: ReadableStream<Uint8Array>, callbacks: AiStreamCallbacks): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buffer = "";

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload) as SseJson;
        const token = json.choices?.[0]?.delta?.content;
        if (token) {
          full += token;
          callbacks.onToken(token);
        }
      } catch {
        // ignore malformed SSE chunk
      }
    }
  }
  return full;
}

interface AnthropicSseJson {
  type?: string;
  delta?: { text?: string };
}

export async function readAnthropicSse(body: ReadableStream<Uint8Array>, callbacks: AiStreamCallbacks): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buffer = "";

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      try {
        const json = JSON.parse(payload) as AnthropicSseJson;
        if (json.type === "content_block_delta" && json.delta?.text) {
          full += json.delta.text;
          callbacks.onToken(json.delta.text);
        }
      } catch {
        // ignore malformed SSE chunk
      }
    }
  }
  return full;
}
