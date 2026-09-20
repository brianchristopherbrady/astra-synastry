// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AiChatDrawer } from "./AiChatDrawer.js";

const mocks = vi.hoisted(() => ({ start: vi.fn(), send: vi.fn(), seed: vi.fn() }));
vi.mock("../../hooks/useAiStream.js", () => ({ useAiStream: () => ({ ...mocks, text: "", streaming: false, error: null }) }));
vi.mock("../../hooks/useAiChat.js", () => ({ useAiChat: () => ({ ...mocks, messages: [], streaming: false, error: null }) }));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  HTMLElement.prototype.scrollTo = vi.fn();
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

function renderDrawer() {
  render(<AiChatDrawer reportEndpoint="/ai/natal/test" chatEndpoint="/ai/natal/test/chat" title="Chart reading" />);
  fireEvent.click(screen.getByRole("button", { name: "Ask AI" }));
}

describe("AI drawer contracts", () => {
  it("opens a named modal, handles native cancellation, and restores the launcher", async () => {
    renderDrawer();
    const dialog = screen.getByRole("dialog", { name: "Chart reading" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close" }));
    fireEvent(dialog, new Event("cancel", { bubbles: true, cancelable: true }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Ask AI" })));
    expect(document.body.style.overflow).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "Ask AI" }));
    expect(mocks.start).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("supports keyboard and non-drag resizing", () => {
    renderDrawer();
    const separator = screen.getByRole("separator", { name: "Resize AI chat panel" });
    fireEvent.keyDown(separator, { key: "ArrowLeft" });
    expect(separator.getAttribute("aria-valuenow")).toBe("460");
    fireEvent.change(screen.getByRole("slider", { name: "Panel width" }), { target: { value: "600" } });
    expect(separator.getAttribute("aria-valuenow")).toBe("600");
    expect(screen.getByRole("dialog").style.width).toBe("600px");
  });

  it("preserves IME composition and Shift+Enter while sending explicit messages", () => {
    renderDrawer();
    const input = screen.getByRole("textbox", { name: "Message about this chart" });
    fireEvent.change(input, { target: { value: "Explain this placement" } });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(mocks.send).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mocks.send).toHaveBeenCalledWith("/ai/natal/test/chat", "Explain this placement", "anthropic");
    expect((input as HTMLTextAreaElement).value).toBe("");
  });
});