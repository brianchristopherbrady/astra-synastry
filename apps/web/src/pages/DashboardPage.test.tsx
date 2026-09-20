// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DashboardPage from "./DashboardPage.js";
import { peopleApi } from "../api/peopleApi.js";

vi.mock("../api/peopleApi.js", () => ({ peopleApi: { list: vi.fn(), create: vi.fn(), remove: vi.fn() } }));
vi.mock("../api/geoApi.js", () => ({ geoApi: { search: vi.fn().mockResolvedValue([]) } }));

const person = { id: "example", name: "Alex Morgan", localDateTime: "1990-06-15T12:00:00", timezone: "Europe/London", locationName: "London", latitude: 51.5, longitude: -0.12, timeUnknown: false, createdAt: "2026-09-20" };

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(peopleApi.list).mockResolvedValue([person]);
});
afterEach(cleanup);

function renderDashboard() {
  render(<MemoryRouter><DashboardPage /></MemoryRouter>);
}

describe("Workspace person dialogs", () => {
  it("keeps saved charts prominent and preserves a draft when the dialog is dismissed", async () => {
    renderDashboard();
    expect(await screen.findByRole("link", { name: "View Alex Morgan's chart" })).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "Name" })).toBeNull();
    const trigger = screen.getByRole("button", { name: "Add a person" });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), { target: { value: "New person" } });
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    expect((screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement).value).toBe("New person");
  });

  it("does not remove a person until confirmed, and preserves the dialog after failure", async () => {
    renderDashboard();
    fireEvent.click(await screen.findByRole("button", { name: "Remove Alex Morgan" }));
    expect(peopleApi.remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Remove Alex Morgan" }));
    vi.mocked(peopleApi.remove).mockRejectedValueOnce(new Error("Unable to remove"));
    fireEvent.click(screen.getByRole("button", { name: "Remove person" }));
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Unable to remove");
    vi.mocked(peopleApi.remove).mockResolvedValueOnce(undefined);
    vi.mocked(peopleApi.list).mockResolvedValue([]);
    fireEvent.click(screen.getByRole("button", { name: "Remove person" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByRole("status").textContent).toBe("Person removed.");
  });

  it("exposes an empty-state add action and keeps the unknown-time date input", async () => {
    vi.mocked(peopleApi.list).mockResolvedValue([]);
    renderDashboard();
    fireEvent.click(await screen.findByRole("button", { name: "Add your first person" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Birth time unknown/ }));
    expect(screen.getByLabelText("Birth date & time (local)").getAttribute("type")).toBe("date");
  });
});