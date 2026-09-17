import { useCallback, useRef, useState } from "react";
import type { AiProviderName } from "@astro/shared";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Manages a multi-turn AI conversation over SSE, streaming tokens into the last assistant message. */
export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  function applyMessages(updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])): void {
    setMessages((prev) => {
      const next = typeof updater === "function" ? (updater as (prev: ChatMessage[]) => ChatMessage[])(prev) : updater;
      messagesRef.current = next;
      return next;
    });
  }

  const seed = useCallback((initial: ChatMessage[]) => {
    applyMessages(initial);
  }, []);

  const send = useCallback(async (endpoint: string, userText: string, provider?: AiProviderName) => {
    setError(null);
    setStreaming(true);
    const history = messagesRef.current;
    applyMessages((prev) => [...prev, { role: "user", content: userText }, { role: "assistant", content: "" }]);

    const controller = new AbortController();
    abortRef.current = controller;

    function updateLastAssistant(updater: (content: string) => string): void {
      applyMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === "assistant") next[next.length - 1] = { ...last, content: updater(last.content) };
        return next;
      });
    }

    try {
      const response = await fetch(`/api${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, messages: [...history, { role: "user", content: userText }] }),
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
            const payload = JSON.parse(line.slice(5).trim()) as { token?: string; text?: string; error?: string };
            if (currentEvent === "token" && payload.token) {
              updateLastAssistant((content) => content + payload.token);
            } else if (currentEvent === "done" && payload.text !== undefined) {
              updateLastAssistant(() => payload.text!);
            } else if (currentEvent === "error") {
              setError(payload.error ?? "AI request failed");
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

  return { messages, streaming, error, seed, send, stop };
}
