// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlaceSuggestion } from "@astro/shared";
import { geoApi } from "../../api/geoApi.js";
import { PlaceSearchInput } from "./PlaceSearchInput.js";

vi.mock("../../api/geoApi.js", () => ({ geoApi: { search: vi.fn() } }));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.resetAllMocks();
});

const paris: PlaceSuggestion = { locationName: "Paris, France", timezone: "Europe/Paris", latitude: 48.85, longitude: 2.35 };

describe("Location search", () => {
  it("ignores responses for a query that has been cleared", async () => {
    vi.useFakeTimers();
    let resolveSearch!: (places: PlaceSuggestion[]) => void;
    vi.mocked(geoApi.search).mockReturnValue(new Promise((resolve) => { resolveSearch = resolve; }));
    const props = { onChange: vi.fn(), onSelect: vi.fn() };
    const { rerender } = render(<PlaceSearchInput {...props} value="Paris" />);
    fireEvent.focus(screen.getByRole("combobox"));
    await act(async () => { vi.advanceTimersByTime(350); });
    rerender(<PlaceSearchInput {...props} value="" />);
    await act(async () => { resolveSearch([paris]); });
    expect(screen.queryByRole("option")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("selects a result with arrows and Enter without submitting the form", async () => {
    vi.useFakeTimers();
    vi.mocked(geoApi.search).mockResolvedValue([paris]);
    const onSelect = vi.fn();
    const onSubmit = vi.fn((event) => event.preventDefault());
    render(<form onSubmit={onSubmit}><PlaceSearchInput value="Paris" onChange={vi.fn()} onSelect={onSelect} /></form>);
    const input = screen.getByRole("combobox", { name: "Birth location" });
    fireEvent.focus(input);
    await act(async () => { vi.advanceTimersByTime(350); });
    expect(input.getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option").id);
    expect(screen.getByRole("option").getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(paris);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input.getAttribute("aria-expanded")).toBe("false");
  });

  it("does not reopen dismissed results when a pending request completes", async () => {
    vi.useFakeTimers();
    let resolveSearch!: (places: PlaceSuggestion[]) => void;
    vi.mocked(geoApi.search).mockReturnValue(new Promise((resolve) => { resolveSearch = resolve; }));
    render(<PlaceSearchInput value="Paris" onChange={vi.fn()} onSelect={vi.fn()} />);
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    await act(async () => { vi.advanceTimersByTime(350); });
    fireEvent.keyDown(input, { key: "Escape" });
    await act(async () => { resolveSearch([paris]); });
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("keeps manual entry available and associates a search failure with the input", async () => {
    vi.useFakeTimers();
    vi.mocked(geoApi.search).mockRejectedValue(new Error("Location service unavailable"));
    const onChange = vi.fn();
    render(<PlaceSearchInput value="Paris" onChange={onChange} onSelect={vi.fn()} />);
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    await act(async () => { vi.advanceTimersByTime(350); });
    expect(input.getAttribute("aria-describedby")).toBe(screen.getByRole("alert").id);
    fireEvent.change(input, { target: { value: "Manual location" } });
    expect(onChange).toHaveBeenCalledWith("Manual location");
  });
});