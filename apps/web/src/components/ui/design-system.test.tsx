// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { MemoryRouter } from "react-router-dom";
import { Modal } from "./Modal.js";
import { ChartDataList } from "./ChartDataList.js";
import { ChartPointLegend } from "../chart/ChartPointLegend.js";
import { AspectGrid } from "../chart/AspectGrid.js";
import { AppHeader } from "../layout/AppHeader.js";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterEach(cleanup);

function DialogExample() {
  const [open, setOpen] = useState(false);
  return <><button onClick={() => setOpen(true)}>Inspect</button><Modal open={open} onClose={() => setOpen(false)} title="Placement"><p>Chart content</p></Modal></>;
}

describe("Design system contracts", () => {
  it("names dialogs, dismisses with Escape, restores focus and body scrolling", () => {
    render(<DialogExample />);
    const trigger = screen.getByRole("button", { name: "Inspect" });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Placement" });
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("");
  });

  it("handles native cancel and explicit close", () => {
    render(<DialogExample />);
    fireEvent.click(screen.getByText("Inspect"));
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { bubbles: true, cancelable: true }));
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByText("Inspect"));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("exposes selected chart points and preserves toggle callbacks", () => {
    const onToggle = vi.fn();
    render(<ChartPointLegend hiddenPoints={new Set(["sun"])} onToggle={onToggle} onShowAll={vi.fn()} onHideAll={vi.fn()} />);
    const sun = screen.getByRole("button", { name: "Sun" });
    expect(sun.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("button", { name: "Moon" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(sun);
    expect(onToggle).toHaveBeenCalledWith("sun");
  });

  it("makes chart values and insight actions available as text", () => {
    const onSelect = vi.fn();
    render(<ChartDataList label="House counts" entries={[{ label: "House 1", value: 3, onSelect }, { label: "House 2", value: 0 }]} />);
    fireEvent.click(screen.getByRole("button", { name: "House 1: 3" }));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.getByText("House 2: 0")).toBeTruthy();
  });

  it("names aspect headers and permits keyboard access to the scroll region", () => {
    render(<AspectGrid pointsA={["sun"]} pointsB={["moon"]} aspects={[]} />);
    expect(screen.getByRole("region", { name: "Aspect comparison" }).tabIndex).toBe(0);
    expect(screen.getByRole("columnheader", { name: "Moon" })).toBeTruthy();
    expect(screen.getByRole("rowheader", { name: "Sun" })).toBeTruthy();
    expect(screen.getByText("No aspect")).toBeTruthy();
  });

  it("marks the current navigation destination", () => {
    render(<MemoryRouter initialEntries={["/wiki"]}><AppHeader /></MemoryRouter>);
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Wiki" }).getAttribute("aria-current")).toBe("page");
  });
});