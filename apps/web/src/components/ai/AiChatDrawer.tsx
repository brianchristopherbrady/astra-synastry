import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { AiProviderName } from "@astro/shared";
import { useAiStream } from "../../hooks/useAiStream.js";
import { useAiChat } from "../../hooks/useAiChat.js";

interface AiChatDrawerProps {
  /** One-shot cached "full report" endpoint, e.g. `/ai/natal/:personId`. */
  reportEndpoint: string;
  /** Multi-turn Q&A endpoint, e.g. `/ai/natal/:personId/chat`. */
  chatEndpoint: string;
  title: string;
}

const PROVIDERS: { value: AiProviderName; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
];

const MIN_WIDTH = 320;
const MAX_WIDTH = 900;
const DEFAULT_WIDTH = 420;

/** Draggable-width side drawer: shows the cached full reading, then lets you ask follow-up questions in a chat. */
export function AiChatDrawer({ reportEndpoint, chatEndpoint, title }: AiChatDrawerProps) {
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [input, setInput] = useState("");
  const [provider, setProvider] = useState<AiProviderName>("anthropic");
  const draggingRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const seededRef = useRef(false);

  const report = useAiStream();
  const chat = useAiChat();

  useEffect(() => {
    if (!open || seededRef.current) return;
    seededRef.current = true;
    void report.start(reportEndpoint, provider);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (report.text && chat.messages.length === 0) {
      chat.seed([{ role: "assistant", content: report.text }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.text]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [chat.messages, report.text]);

  function onDragMove(e: MouseEvent): void {
    if (!draggingRef.current) return;
    const delta = draggingRef.current.startX - e.clientX;
    setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, draggingRef.current.startWidth + delta)));
  }

  function onDragEnd(): void {
    draggingRef.current = null;
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", onDragEnd);
  }

  function onDragStart(e: React.MouseEvent): void {
    draggingRef.current = { startX: e.clientX, startWidth: width };
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
  }

  function onSend(): void {
    const text = input.trim();
    if (!text || chat.streaming) return;
    setInput("");
    void chat.send(chatEndpoint, text, provider);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-aurora px-4 py-3 text-sm font-semibold text-midnight shadow-lg hover:brightness-110"
      >
        Ask AI
      </button>
    );
  }

  const isStreaming = report.streaming || chat.streaming;

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex" style={{ width }}>
      <div
        onMouseDown={onDragStart}
        className="w-1.5 shrink-0 cursor-col-resize bg-slate-700 hover:bg-aurora"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize AI chat panel"
      />
      <div className="flex min-w-0 flex-1 flex-col border-l border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between gap-2 border-b border-slate-700 p-3">
          <h3 className="truncate text-sm font-semibold text-stardust">{title}</h3>
          <div className="flex items-center gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.value}
                onClick={() => setProvider(p.value)}
                className={`rounded border px-2 py-0.5 text-xs ${
                  provider === p.value ? "border-aurora text-aurora" : "border-slate-600 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded border border-slate-600 px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3">
          {chat.messages.length === 0 && report.streaming && <p className="text-sm text-slate-400">Generating your initial reading…</p>}
          {chat.messages.map((m, idx) => (
            <div key={idx} className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user" ? "bg-aurora/20 text-stardust" : "bg-slate-800 text-slate-200"
                }`}
              >
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{m.content || (isStreaming ? "\u2026" : "")}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {(report.error || chat.error) && <p className="break-words text-sm text-red-400">{report.error || chat.error}</p>}
        </div>

        <div className="flex items-end gap-2 border-t border-slate-700 p-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Ask about this chart…"
            rows={2}
            className="flex-1 resize-none rounded border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
          />
          <button
            onClick={onSend}
            disabled={isStreaming || !input.trim()}
            className="rounded bg-aurora px-3 py-2 text-sm font-semibold text-midnight disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
