import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import type { AiProviderName } from "@astro/shared";
import { useAiStream } from "../../hooks/useAiStream.js";
import { useAiChat } from "../../hooks/useAiChat.js";
import { useModalDialog } from "../ui/useModalDialog.js";
import { AiMarkdown } from "./AiMarkdown.js";

interface AiChatDrawerProps {
  /** One-shot cached "full report" endpoint, e.g. `/ai/natal/:personId`. */
  reportEndpoint: string;
  /** Multi-turn Q&A endpoint, e.g. `/ai/natal/:personId/chat`. */
  chatEndpoint: string;
  title: string;
  /** Called once an archetype name is available (synastry reports only). */
  onArchetypeName?: (name: string) => void;
}

const PROVIDER: AiProviderName = "anthropic";

const MIN_WIDTH = 320;
const MAX_WIDTH = 900;
const DEFAULT_WIDTH = 420;

/** Draggable-width side drawer: shows the cached full reading, then lets you ask follow-up questions in a chat. */
export function AiChatDrawer({ reportEndpoint, chatEndpoint, title, onArchetypeName }: AiChatDrawerProps) {
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [input, setInput] = useState("");
  const draggingRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const seededRef = useRef(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useModalDialog(open);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  useEffect(() => () => {
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", onDragEnd);
  }, []);

  function closeDrawer(): void {
    onDragEnd();
    setOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  }

  const report = useAiStream();
  const chat = useAiChat();

  useEffect(() => {
    if (!open || seededRef.current) return;
    seededRef.current = true;
    void report.start(reportEndpoint, PROVIDER);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!report.streaming && report.text && chat.messages.length === 0) {
      chat.seed([{ role: "assistant", content: report.text }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.text, report.streaming]);

  useEffect(() => {
    if (report.archetypeName) onArchetypeName?.(report.archetypeName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.archetypeName]);

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
    if (!text || report.streaming || chat.streaming) return;
    setInput("");
    void chat.send(chatEndpoint, text, PROVIDER);
  }

  if (!open) {
    return (
      <button
        ref={launcherRef}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="chat-launcher btn-primary"
      >
        <MessageCircle size={18} aria-hidden="true" /> Ask AI
      </button>
    );
  }

  const isStreaming = report.streaming || chat.streaming;
  const visibleMessages = chat.messages.length === 0 && report.text ? [{ role: "assistant" as const, content: report.text }] : chat.messages;

  return (
    <dialog ref={dialogRef} className="chat-drawer" style={{ width }} aria-label={title} aria-modal="true" onCancel={(event) => { event.preventDefault(); closeDrawer(); }} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeDrawer(); } }}>
      <div
        onMouseDown={onDragStart}
        className="chat-resizer"
        role="separator"
        tabIndex={0}
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={MAX_WIDTH}
        aria-valuenow={width}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            setWidth((current) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, current + (event.key === "ArrowLeft" ? 40 : -40))));
          }
        }}
        aria-orientation="vertical"
        aria-label="Resize AI chat panel"
      />
      <div className="flex min-w-0 flex-1 flex-col bg-surface">
        <div className="flex items-start justify-between gap-3 border-b border-line/50 p-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-stardust">{title}</h2>
            {report.archetypeName && <p className="text-xs text-aurora">{report.archetypeName}</p>}
          </div>
          <button
            ref={closeRef}
            onClick={closeDrawer}
            aria-label="Close"
            title="Close"
            className="icon-button -me-2 -mt-2"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <label className="chat-width text-xs text-muted">
          Panel width
          <input type="range" min={MIN_WIDTH} max={MAX_WIDTH} step={20} value={width} onChange={(event) => setWidth(Number(event.target.value))} />
        </label>
        <p className="sr-only" role="status">{isStreaming ? "AI response in progress" : "AI ready"}</p>
        <div ref={scrollRef} className="chat-messages" role="region" aria-label="Conversation" tabIndex={0}>
          {visibleMessages.length === 0 && report.streaming && <p className="text-sm text-muted">Generating your initial reading…</p>}
          {visibleMessages.map((m, idx) => (
            <div key={idx} className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user" ? "bg-aurora/10 text-stardust" : "bg-elevated"
                }`}
              >
                <AiMarkdown>{m.content || (isStreaming ? "\u2026" : "")}</AiMarkdown>
              </div>
            </div>
          ))}
          {(report.error || chat.error) && <p role="alert" className="break-words text-sm text-danger">{report.error || chat.error}</p>}
        </div>

        <div className="chat-composer">
          <textarea
            aria-label="Message about this chart"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Ask about this chart…"
            rows={2}
            className="input min-w-0 flex-1 resize-none"
          />
          <button
            onClick={onSend}
            disabled={isStreaming || !input.trim()}
            aria-label="Send"
            title="Send message"
            className="btn-primary"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </dialog>
  );
}
