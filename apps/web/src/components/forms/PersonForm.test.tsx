// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { draftFromPerson, draftToPayload, emptyPersonDraft, PersonForm, type PersonDraft } from "./PersonForm.js";
import type { PersonRecord } from "../../api/peopleApi.js";

vi.mock("../../api/geoApi.js", () => ({ geoApi: { search: vi.fn().mockResolvedValue([]) } }));
afterEach(cleanup);

const base: PersonRecord = {
  id: "p", name: "Sam", localDateTime: "1990-06-15T12:00", timezone: "Europe/London", locationName: "London",
  latitude: 51.5, longitude: -0.12, timeUnknown: false, gender: "", createdAt: "2026-10-08",
};

function Harness({ onSubmit }: { onSubmit: (draft: PersonDraft) => void }) {
  const [draft, setDraft] = useState<PersonDraft>(draftFromPerson(base));
  return <PersonForm draft={draft} onChange={setDraft} onSubmit={() => onSubmit(draft)} saving={false} submitLabel="Save" submitIcon={null} />;
}

describe("Person gender identity", () => {
  it("offers inclusive options and a self-description field that is sent as the gender", () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    const select = screen.getByRole("combobox", { name: "Gender identity" }) as HTMLSelectElement;
    const options = Array.from(select.options).map((option) => option.text);
    expect(options).toEqual(expect.arrayContaining(["Not specified", "Woman", "Man", "Non-binary", "Two-Spirit", "Prefer not to say", "Self-describe\u2026"]));
    expect(screen.queryByRole("textbox", { name: "Describe gender identity" })).toBeNull();

    fireEvent.change(select, { target: { value: "self-describe" } });
    const description = screen.getByRole("textbox", { name: "Describe gender identity" });
    expect(description.hasAttribute("required")).toBe(true);
    fireEvent.change(description, { target: { value: "  Demigirl  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(draftToPayload(onSubmit.mock.calls[0]![0]).gender).toBe("Demigirl");
  });

  it("round-trips preset and self-described values when editing", () => {
    expect(draftFromPerson({ ...base, gender: "Agender" })).toMatchObject({ gender: "Agender", genderDescription: "" });
    expect(draftFromPerson({ ...base, gender: "Demigirl" })).toMatchObject({ gender: "self-describe", genderDescription: "Demigirl" });
    expect(draftToPayload(emptyPersonDraft()).gender).toBe("");
  });
});
