// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ReadingsMenu } from "./ReadingsMenu.js";
import { addSessionReading, getSessionReadings, removeSessionReadingsFor } from "../../lib/sessionReadings.js";

afterEach(() => {
  cleanup();
  ["brian", "collin", "melissa", "pamela"].forEach(removeSessionReadingsFor);
});

function renderMenu(path = "/") {
  render(<MemoryRouter initialEntries={[path]}><ReadingsMenu /></MemoryRouter>);
}

describe("Session readings menu", () => {
  it("stays hidden until a reading has been run", () => {
    renderMenu();
    expect(screen.queryByRole("button", { name: "View chart" })).toBeNull();
    act(() => addSessionReading({ path: "/synastry/one", label: "Brian & Collin", detail: "Synastry", personIds: ["brian", "collin"] }));
    expect(screen.getByRole("button", { name: "View chart" })).toBeTruthy();
  });

  it("lists every run, newest first, marks the current one, and closes with Escape", () => {
    addSessionReading({ path: "/synastry/one", label: "Brian & Collin", detail: "Synastry", personIds: ["brian", "collin"] });
    addSessionReading({ path: "/chart/melissa", label: "Melissa", detail: "Natal reading", personIds: ["melissa"] });
    addSessionReading({ path: "/synastry/one", label: "Brian & Collin", detail: "Synastry", personIds: ["brian", "collin"] });
    renderMenu("/synastry/one");
    const trigger = screen.getByRole("button", { name: "View chart" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Brian & CollinSynastry", "MelissaNatal reading"]);
    expect(links[0]!.getAttribute("aria-current")).toBe("page");
    fireEvent.keyDown(links[1]!, { key: "Escape" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("forgets readings that involve a removed person", () => {
    addSessionReading({ path: "/synastry/two", label: "Melissa & Pamela", detail: "Synastry", personIds: ["melissa", "pamela"] });
    addSessionReading({ path: "/chart/brian", label: "Brian", detail: "Natal reading", personIds: ["brian"] });
    removeSessionReadingsFor("pamela");
    expect(getSessionReadings().map((reading) => reading.label)).toEqual(["Brian"]);
  });
});
