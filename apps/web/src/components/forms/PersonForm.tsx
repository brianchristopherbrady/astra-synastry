import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { PlaceSuggestion } from "@astro/shared";
import type { CreatePersonPayload, PersonRecord } from "../../api/peopleApi.js";
import { PlaceSearchInput } from "./PlaceSearchInput.js";

/** Form state kept as strings so partially typed coordinates and dates survive re-renders. */
export interface PersonDraft {
  name: string;
  localDateTime: string;
  birthDate: string;
  timezone: string;
  locationName: string;
  latitude: string;
  longitude: string;
  timeUnknown: boolean;
}

export function emptyPersonDraft(): PersonDraft {
  return {
    name: "",
    localDateTime: "",
    birthDate: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locationName: "",
    latitude: "",
    longitude: "",
    timeUnknown: false,
  };
}

export function draftFromPerson(person: PersonRecord): PersonDraft {
  return {
    name: person.name,
    localDateTime: person.timeUnknown ? "" : person.localDateTime,
    birthDate: person.localDateTime.slice(0, 10),
    timezone: person.timezone,
    locationName: person.locationName,
    latitude: String(person.latitude),
    longitude: String(person.longitude),
    timeUnknown: person.timeUnknown,
  };
}

export function draftToPayload(draft: PersonDraft): CreatePersonPayload {
  return {
    name: draft.name.trim(),
    // datetime-local can't hold a date-only value, so unknown-time births use a separate date
    // field and default to noon (a standard "noon chart" convention for missing birth times).
    localDateTime: draft.timeUnknown ? `${draft.birthDate}T12:00:00` : draft.localDateTime,
    timezone: draft.timezone,
    locationName: draft.locationName,
    latitude: Number(draft.latitude),
    longitude: Number(draft.longitude),
    timeUnknown: draft.timeUnknown,
  };
}

interface PersonFormProps {
  draft: PersonDraft;
  onChange: Dispatch<SetStateAction<PersonDraft>>;
  onSubmit: () => void;
  saving: boolean;
  submitLabel: string;
  submitIcon: ReactNode;
}

export function PersonForm({ draft, onChange, onSubmit, saving, submitLabel, submitIcon }: PersonFormProps) {
  const update = (patch: Partial<PersonDraft>): void => onChange((current) => ({ ...current, ...patch }));

  function onPlaceSelected(place: PlaceSuggestion): void {
    update({
      locationName: place.locationName,
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      timezone: place.timezone,
    });
  }

  function onTimeUnknownChange(timeUnknown: boolean): void {
    // Carry the chosen date across the date-only and date-time inputs.
    onChange((current) => ({
      ...current,
      timeUnknown,
      birthDate: timeUnknown && current.localDateTime ? current.localDateTime.slice(0, 10) : current.birthDate,
      localDateTime: !timeUnknown && !current.localDateTime && current.birthDate ? `${current.birthDate}T12:00` : current.localDateTime,
    }));
  }

  return (
    <form
      onSubmit={(event) => { event.preventDefault(); if (!saving) onSubmit(); }}
      aria-busy={saving}
      className="flex flex-col gap-3"
    >
      <label className="text-sm text-muted">Name
        <input className="input mt-1 w-full" autoComplete="name" value={draft.name} onChange={(e) => update({ name: e.target.value })} required />
      </label>
      <label className="text-sm text-muted">
        Birth date &amp; time (local)
        {draft.timeUnknown ? (
          <input className="input mt-1 w-full" type="date" value={draft.birthDate} onChange={(e) => update({ birthDate: e.target.value })} required />
        ) : (
          <input className="input mt-1 w-full" type="datetime-local" value={draft.localDateTime} onChange={(e) => update({ localDateTime: e.target.value })} required />
        )}
      </label>
      <label className="flex min-h-8 items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={draft.timeUnknown} onChange={(e) => onTimeUnknownChange(e.target.checked)} />
        Birth time unknown (solar chart, no houses)
      </label>
      <PlaceSearchInput value={draft.locationName} onChange={(locationName) => update({ locationName })} onSelect={onPlaceSelected} />
      <label className="text-sm text-muted">
        Timezone
        <input
          className="input mt-1 w-full"
          placeholder="IANA timezone, e.g. America/New_York"
          value={draft.timezone}
          onChange={(e) => update({ timezone: e.target.value })}
          required
        />
      </label>
      <fieldset className="min-w-0 text-xs text-muted">
        <legend>Exact coordinates</legend>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <label>Latitude<input className="input mt-1 w-full" inputMode="decimal" value={draft.latitude} onChange={(e) => update({ latitude: e.target.value })} required /></label>
          <label>Longitude<input className="input mt-1 w-full" inputMode="decimal" value={draft.longitude} onChange={(e) => update({ longitude: e.target.value })} required /></label>
        </div>
      </fieldset>
      <button className="btn-primary" type="submit" disabled={saving}>
        {submitIcon}
        {saving ? "Saving\u2026" : submitLabel}
      </button>
    </form>
  );
}
