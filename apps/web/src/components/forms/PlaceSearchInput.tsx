import { useEffect, useRef, useState } from "react";
import type { PlaceSuggestion } from "@astro/shared";
import { geoApi } from "../../api/geoApi.js";

interface PlaceSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: PlaceSuggestion) => void;
}

const DEBOUNCE_MS = 350;

export function PlaceSearchInput({ value, onChange, onSelect }: PlaceSearchInputProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      setError(null);
      geoApi
        .search(value.trim())
        .then(setSuggestions)
        .catch((err) => setError(err instanceof Error ? err.message : "Place search failed"))
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function pick(place: PlaceSuggestion): void {
    onSelect(place);
    setSuggestions([]);
  }

  return (
    <div className="relative">
      <input
        className="input w-full"
        placeholder="City, State (auto-fills timezone & coordinates)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
      {loading && <p className="mt-1 text-xs text-slate-500">Searching…</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      {suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded border border-slate-600 bg-slate-800 text-sm shadow-lg">
          {suggestions.map((s, idx) => (
            <li key={`${s.latitude}-${s.longitude}-${idx}`}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left hover:bg-slate-700"
                onClick={() => pick(s)}
              >
                {s.locationName}
                <span className="ml-2 text-xs text-slate-400">{s.timezone}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
