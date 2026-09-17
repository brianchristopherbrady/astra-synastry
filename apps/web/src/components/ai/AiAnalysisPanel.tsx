import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import type { AiProviderName } from "@astro/shared";
import { useAiStream } from "../../hooks/useAiStream.js";

interface AiAnalysisPanelProps {
  /** API path to POST to for streaming, e.g. `/ai/synastry/:id` or `/ai/natal/:personId?houseSystem=...`. */
  endpoint: string;
  title?: string;
}

const PROVIDERS: { value: AiProviderName; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
];

export function AiAnalysisPanel({ endpoint, title = "AI Analysis" }: AiAnalysisPanelProps) {
  const { text, streaming, error, start, stop } = useAiStream();

  useEffect(() => {
    void start(endpoint, "anthropic");
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-stardust">{title}</h3>
        <div className="flex gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.value}
              disabled={streaming}
              onClick={() => void start(endpoint, p.value, true)}
              className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-40"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="break-words text-sm text-red-400">{error}</p>}
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown>{text || (streaming ? "Generating analysis…" : "No analysis yet.")}</ReactMarkdown>
      </div>
      {streaming && <p className="mt-2 text-xs text-slate-500">Streaming…</p>}
    </div>
  );
}
