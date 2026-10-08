// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { GlossaryHelp } from "./GlossaryHelp.js";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(cleanup);

describe("GlossaryHelp", () => {
  it("explains a topic in a dialog instead of navigating, and returns focus on close", () => {
    render(<GlossaryHelp topic="houses" label="What are houses?" />);
    const trigger = screen.getByRole("button", { name: "What are houses?" });
    expect(screen.queryByRole("link")).toBeNull();
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "What are houses?" });
    expect(within(dialog).getByText("1st House \u2014 Self")).toBeTruthy();
    expect(within(dialog).getAllByRole("term")).toHaveLength(12);
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("covers aspect patterns and Hellenistic techniques", () => {
    render(<><GlossaryHelp topic="patterns" label="What do these mean?" /><GlossaryHelp topic="hellenistic" label="What is this?" /></>);
    fireEvent.click(screen.getByRole("button", { name: "What do these mean?" }));
    expect(within(screen.getByRole("dialog", { name: "Aspect patterns" })).getByText("Grand Trine")).toBeTruthy();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "What is this?" }));
    const dialog = screen.getByRole("dialog", { name: "Hellenistic techniques" });
    expect(within(dialog).getAllByRole("term").map((term) => term.textContent)).toEqual(["Sect", "Hellenistic lots", "Annual profections"]);
  });
});
