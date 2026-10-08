// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DashboardPage from "./DashboardPage.js";
import { peopleApi } from "../api/peopleApi.js";
import { chartsApi } from "../api/chartsApi.js";
import { getSessionReadings, removeSessionReadingsFor } from "../lib/sessionReadings.js";

vi.mock("../api/peopleApi.js", () => ({ peopleApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() } }));
vi.mock("../api/geoApi.js", () => ({ geoApi: { search: vi.fn().mockResolvedValue([]) } }));
vi.mock("../api/chartsApi.js", () => ({ chartsApi: { pregenerateReading: vi.fn() } }));

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
    expect(await screen.findByRole("link", { name: "Open Alex Morgan's natal chart" })).toBeTruthy();
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

  it("keeps the card inert and edits a person from a dedicated button", async () => {
    vi.mocked(peopleApi.update).mockResolvedValue({ ...person, name: "Alex M." });
    renderDashboard();
    const chartLink = await screen.findByRole("link", { name: "Open Alex Morgan's natal chart" });
    expect(chartLink.getAttribute("href")).toBe("/chart/example");
    expect(screen.getByRole("heading", { name: "Alex Morgan" }).closest("a, button")).toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Edit Alex Morgan" }));
    const dialog = screen.getByRole("dialog", { name: "Edit Alex Morgan" });
    const nameInput = within(dialog).getByRole("textbox", { name: "Name" }) as HTMLInputElement;
    expect(nameInput.value).toBe("Alex Morgan");
    expect((within(dialog).getByRole("textbox", { name: "Latitude" }) as HTMLInputElement).value).toBe("51.5");
    fireEvent.change(nameInput, { target: { value: "Alex M." } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(peopleApi.update).toHaveBeenCalledWith("example", {
      name: "Alex M.",
      localDateTime: person.localDateTime,
      timezone: person.timezone,
      locationName: person.locationName,
      latitude: 51.5,
      longitude: -0.12,
      timeUnknown: false,
    });
    expect(screen.getByRole("status").textContent).toBe("Person updated.");
  });
});

describe("Reading form", () => {
  afterEach(() => removeSessionReadingsFor("example"));

  it("runs a single-person natal reading when Person B is left empty", async () => {
    vi.mocked(chartsApi.pregenerateReading).mockResolvedValue(undefined);
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/chart/:personId" element={<p>Natal chart page</p>} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.change(await screen.findByRole("combobox", { name: "Person A" }), { target: { value: "example" } });
    expect(screen.queryByRole("radio", { name: "Romantic" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Generate natal reading" }));
    expect(await screen.findByText("Natal chart page")).toBeTruthy();
    expect(chartsApi.pregenerateReading).toHaveBeenCalledWith("example", { zodiacMode: "tropical", ayanamsa: "lahiri" });
    expect(getSessionReadings()[0]).toMatchObject({ path: "/chart/example", label: "Alex Morgan", personIds: ["example"] });
  });
});