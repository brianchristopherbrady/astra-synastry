// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import NatalNowPage from "./NatalNowPage.js";
import SynastryNowPage from "./SynastryNowPage.js";
import { chartsApi } from "../api/chartsApi.js";
import { peopleApi } from "../api/peopleApi.js";
import { synastryApi } from "../api/synastryApi.js";

vi.mock("../api/chartsApi.js", () => ({ chartsApi: { get: vi.fn(), transits: vi.fn(), progressions: vi.fn(), hellenistic: vi.fn() } }));
vi.mock("../api/peopleApi.js", () => ({ peopleApi: { get: vi.fn() } }));
vi.mock("../api/synastryApi.js", () => ({ synastryApi: { get: vi.fn(), transits: vi.fn() } }));
vi.mock("../components/ai/AiChatDrawer.js", () => ({ AiChatDrawer: () => null }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(chartsApi.get).mockResolvedValue({ points: {} } as Awaited<ReturnType<typeof chartsApi.get>>);
  vi.mocked(peopleApi.get).mockResolvedValue({ name: "Alex", timeUnknown: false } as Awaited<ReturnType<typeof peopleApi.get>>);
  vi.mocked(chartsApi.transits).mockRejectedValue(new Error("Offline"));
  vi.mocked(chartsApi.progressions).mockRejectedValue(new Error("Offline"));
  vi.mocked(chartsApi.hellenistic).mockRejectedValue(new Error("Offline"));
});
afterEach(cleanup);

function renderNatal() {
  render(<MemoryRouter initialEntries={["/chart/example/now"]}><Routes><Route path="/chart/:personId/now" element={<NatalNowPage />} /></Routes></MemoryRouter>);
}

describe("Current sky states", () => {
  it("announces request errors rather than leaving permanent loading messages", async () => {
    renderNatal();
    expect(await screen.findAllByRole("alert")).toHaveLength(3);
    expect(screen.queryByText("Loading transits…")).toBeNull();
    expect(screen.getByRole("link", { name: "Current sky" }).getAttribute("aria-current")).toBe("page");
    const calls = vi.mocked(chartsApi.transits).mock.calls.length;
    fireEvent.change(screen.getByLabelText("Transit date"), { target: { value: "" } });
    expect(chartsApi.transits).toHaveBeenCalledTimes(calls);
  });

  it("ignores stale failures after a date change", async () => {
    let rejectPrevious!: (reason: Error) => void;
    vi.mocked(chartsApi.transits).mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectPrevious = reject; }));
    vi.mocked(chartsApi.transits).mockImplementationOnce(() => new Promise(() => {}));
    renderNatal();
    fireEvent.change(await screen.findByLabelText("Transit date"), { target: { value: "2027-01-01" } });
    await act(async () => { rejectPrevious(new Error("Old failure")); });
    expect(screen.getByText("Loading transits…")).toBeTruthy();
    expect(screen.queryByText(/Transits are unavailable/)).toBeNull();
  });

  it("distinguishes unknown birth time from a profection request failure", async () => {
    vi.mocked(peopleApi.get).mockResolvedValue({ name: "Alex", timeUnknown: true } as Awaited<ReturnType<typeof peopleApi.get>>);
    renderNatal();
    expect(await screen.findByText("Annual profections require a known birth time.")).toBeTruthy();
    expect(screen.queryByText("Loading profection…")).toBeNull();
  });

  it("shows failed relationship transits without hiding report navigation", async () => {
    vi.mocked(synastryApi.get).mockResolvedValue({ id: "example", personAName: "Alex", personBName: "Jordan" } as Awaited<ReturnType<typeof synastryApi.get>>);
    vi.mocked(synastryApi.transits).mockRejectedValue(new Error("Offline"));
    render(<MemoryRouter initialEntries={["/synastry/example/now"]}><Routes><Route path="/synastry/:id/now" element={<SynastryNowPage />} /></Routes></MemoryRouter>);
    expect((await screen.findByRole("alert")).textContent).toMatch(/Transits are unavailable/);
    expect(screen.getByRole("link", { name: "Relationship chart" }).getAttribute("href")).toBe("/synastry/example");
  });
});