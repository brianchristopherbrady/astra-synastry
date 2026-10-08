import type { AiProviderName } from "@astro/shared";

export interface AiStreamCallbacks {
  onToken: (token: string) => void;
}

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiCompletionOptions {
  /** Constrains the response to JSON matching this schema (provider-native structured output). */
  jsonSchema?: { name: string; schema: Record<string, unknown> };
  maxTokens?: number;
}

export interface AiProvider {
  name: AiProviderName;
  streamCompletion(messages: AiMessage[], callbacks: AiStreamCallbacks, options?: AiCompletionOptions): Promise<string>;
}

