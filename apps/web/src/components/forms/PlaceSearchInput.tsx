import { useEffect, useId, useState } from "react";
import type { PlaceSuggestion } from "@astro/shared";
import { geoApi } from "../../api/geoApi.js";

interface PlaceSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: PlaceSuggestion) => void;
}

const DEBOUNCE_MS = 350;

export function PlaceSearchInput({ value, onChange, onSelect }: PlaceSearchInputProps) {
  const inputId = useId();
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [complete, setComplete] = useState(false);
  const listId = `${inputId}-suggestions`;
  const expanded = focused && !dismissed && suggestions.length > 0;

  useEffect(() => {
    let active = true;
    setSuggestions([]);
    setLoading(false);
    setError(null);
    setComplete(false);
    setActiveIndex(-1);
    if (!focused || dismissed || value.trim().length < 2) return;
    const debounce = setTimeout(() => {
      setLoading(true);
      geoApi
        .search(value.trim())
        .then((places) => { if (active) { setSuggestions(places); setComplete(true); } })
        .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Place search failed"); })
        .finally(() => { if (active) setLoading(false); });
    }, DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(debounce);
    };
  }, [value, focused, dismissed]);

  useEffect(() => {
    if (expanded && activeIndex >= 0) {
      document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView?.({ block: "nearest" });
    }
  }, [activeIndex, expanded, listId]);

  function pick(place: PlaceSuggestion): void {
    setDismissed(true);
    onSelect(place);
    setSuggestions([]);
  }

  return (
    <div className="relative">
      <label htmlFor={inputId} className="mb-1 block text-sm text-muted">Birth location</label>
      <input
        id={inputId}
        className="input w-full"
        placeholder="City, State"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={expanded ? listId : undefined}
        aria-activedescendant={expanded && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        value={value}
        onFocus={() => { setFocused(true); setDismissed(false); }}
        onBlur={() => setFocused(false)}
        onChange={(event) => { setDismissed(false); onChange(event.target.value); }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === "Escape") {
            if (expanded || loading) { event.preventDefault(); event.stopPropagation(); }
            setDismissed(true);
          } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setDismissed(false);
            if (suggestions.length) {
              setActiveIndex((current) => event.key === "ArrowDown"
                ? Math.min(current + 1, suggestions.length - 1)
                : current < 0 ? suggestions.length - 1 : Math.max(0, current - 1));
            }
          } else if (event.key === "Enter" && expanded && activeIndex >= 0) {
            event.preventDefault();
            const selected = suggestions[activeIndex];
            if (selected) pick(selected);
          }
        }}
        required
      />
      {loading && <p role="status" className="mt-1 text-xs text-muted">Searching…</p>}
      {complete && !dismissed && <p role="status" className="mt-1 text-xs text-muted">{suggestions.length ? `${suggestions.length} locations found` : "No matching locations"}</p>}
      {error && <p id={`${inputId}-error`} role="alert" className="mt-1 text-xs text-danger">{error}</p>}
      {expanded && (
        <ul id={listId} role="listbox" aria-label="Location suggestions" className="place-suggestions">
          {suggestions.map((place, index) => (
            <li
              key={`${place.latitude}-${place.longitude}-${index}`}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={activeIndex === index}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => pick(place)}
            >
              {place.locationName}
              <span className="block text-xs text-muted">{place.timezone}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
