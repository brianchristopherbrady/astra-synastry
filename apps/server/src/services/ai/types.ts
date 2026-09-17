import type { AiProviderName } from "@astro/shared";

export interface AiStreamCallbacks {
  onToken: (token: string) => void;
}

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiProvider {
  name: AiProviderName;
  streamCompletion(messages: AiMessage[], callbacks: AiStreamCallbacks): Promise<string>;
}

