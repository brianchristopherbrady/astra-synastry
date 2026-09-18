import { useCallback, useRef, useState } from "react";
import type { AiProviderName } from "@astro/shared";

export function useAiStream() {
  const [text, setText] = useState("");
  const [archetypeName, setArchetypeName] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (endpoint: string, provider?: AiProviderName, force?: boolean) => {
    setText("");
    setArchetypeName(null);
    setError(null);
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`/api${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, force }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        throw new Error(`AI request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentEvent = "message";

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("event:")) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            const payload = JSON.parse(line.slice(5).trim()) as {
              token?: string;
              text?: string;
              error?: string;
              archetypeName?: string | null;
            };
            if (currentEvent === "token" && payload.token) {
              setText((prev) => prev + payload.token);
            } else if ((currentEvent === "done" || currentEvent === "cached") && payload.text !== undefined) {
              setText(payload.text);
              if (payload.archetypeName !== undefined) setArchetypeName(payload.archetypeName);
            } else if (currentEvent === "error") {
              setError(payload.error ?? "AI analysis failed");
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : "AI request failed");
      }
    } finally {
      setStreaming(false);
    }
  }, []);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  return { text, archetypeName, streaming, error, start, stop };
}
