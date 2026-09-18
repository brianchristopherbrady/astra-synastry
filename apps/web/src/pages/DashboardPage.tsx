import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Ayanamsa, PlaceSuggestion, ReadingStyle, RelationshipType, ZodiacMode } from "@astro/shared";
import { peopleApi, type PersonRecord } from "../api/peopleApi.js";
import { synastryApi } from "../api/synastryApi.js";
import { PlaceSearchInput } from "../components/forms/PlaceSearchInput.js";
import { AppHeader } from "../components/layout/AppHeader.js";

const READING_STYLES: { value: ReadingStyle; label: string }[] = [
  { value: "clever", label: "Clever" },
  { value: "flirty", label: "Flirty" },
  { value: "funny", label: "Funny" },
  { value: "mythic", label: "Mythic" },
  { value: "brutal", label: "Brutal" },
  { value: "other", label: "Other\u2026" },
];

const AYANAMSA_OPTIONS: { value: Ayanamsa; label: string }[] = [
  { value: "lahiri", label: "Lahiri" },
  { value: "raman", label: "Raman" },
  { value: "krishnamurti", label: "Krishnamurti" },
  { value: "fagan_bradley", label: "Fagan-Bradley" },
  { value: "yukteshwar", label: "Yukteshwar" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [people, setPeople] = useState<PersonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [localDateTime, setLocalDateTime] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);

  const [personAId, setPersonAId] = useState("");
  const [personBId, setPersonBId] = useState("");
  const [zodiacMode, setZodiacMode] = useState<ZodiacMode>("tropical");
  const [ayanamsa, setAyanamsa] = useState<Ayanamsa>("lahiri");
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("romantic");
  const [readingStyle, setReadingStyle] = useState<ReadingStyle>("clever");
  const [customStyleText, setCustomStyleText] = useState("");
  const [generating, setGenerating] = useState(false);

  async function loadPeople(): Promise<void> {
    setLoading(true);
    try {
      const loaded = await peopleApi.list();
      setPeople(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load people");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPeople();
  }, []);

  async function onAddPerson(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    try {
      // datetime-local can't hold a date-only value, so unknown-time births use a separate date
      // field and default to noon (a standard "noon chart" convention for missing birth times).
      const resolvedDateTime = timeUnknown ? `${birthDate}T12:00:00` : localDateTime;
      await peopleApi.create({
        name,
        localDateTime: resolvedDateTime,
        timezone,
        locationName,
        latitude: Number(latitude),
        longitude: Number(longitude),
        timeUnknown,
      });
      setName("");
      setLocalDateTime("");
      setBirthDate("");
      setLocationName("");
      setLatitude("");
      setLongitude("");
      await loadPeople();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add person");
    }
  }

  async function onGenerateSynastry(): Promise<void> {
    if (!personAId || !personBId || personAId === personBId) return;
    setGenerating(true);
    setError(null);
    try {
      const report = await synastryApi.create({
        personAId,
        personBId,
        zodiacMode,
        ayanamsa,
        relationshipType,
        readingStyle,
        customStyleText: readingStyle === "other" ? customStyleText : "",
      });
      // Fire-and-forget: kick off the AI reading (including the archetype name) right away so it's
      // likely already ready by the time the user opens the chat drawer on the report page.
      void synastryApi.pregenerateReading(report.id).catch(() => {});
      navigate(`/synastry/${report.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate synastry report");
    } finally {
      setGenerating(false);
    }
  }

  async function onRemovePerson(id: string): Promise<void> {
    await peopleApi.remove(id);
    await loadPeople();
  }

  function onPlaceSelected(place: PlaceSuggestion): void {
    setLocationName(place.locationName);
    setLatitude(String(place.latitude));
    setLongitude(String(place.longitude));
    setTimezone(place.timezone);
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <AppHeader />

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
          <h2 className="mb-3 text-lg font-semibold">Add a person</h2>
          <form onSubmit={onAddPerson} className="flex flex-col gap-2">
            <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <label className="text-xs text-slate-400">
              Birth date &amp; time (local)
              {timeUnknown ? (
                <input
                  className="input mt-1 w-full"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                />
              ) : (
                <input
                  className="input mt-1 w-full"
                  type="datetime-local"
                  value={localDateTime}
                  onChange={(e) => setLocalDateTime(e.target.value)}
                  required
                />
              )}
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input type="checkbox" checked={timeUnknown} onChange={(e) => setTimeUnknown(e.target.checked)} />
              Birth time unknown (solar chart, no houses)
            </label>
            <PlaceSearchInput value={locationName} onChange={setLocationName} onSelect={onPlaceSelected} />
            <label className="text-xs text-slate-400">
              Timezone (auto-filled from city search, override if needed)
              <input
                className="input mt-1 w-full"
                placeholder="IANA timezone, e.g. America/New_York"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                required
              />
            </label>
            <label className="text-xs text-slate-400">
              Exact coordinates (auto-filled from city search, override if needed)
              <div className="mt-1 flex gap-2">
                <input className="input" placeholder="Latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} required />
                <input className="input" placeholder="Longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} required />
              </div>
            </label>
            <button className="btn-primary" type="submit">
              Save person
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
          <h2 className="mb-3 text-lg font-semibold">Your people</h2>
          {loading ? (
            <p className="text-sm text-slate-400">Loading people…</p>
          ) : people.length === 0 ? (
            <p className="text-sm text-slate-400">Add a person to view their natal chart reading.</p>
          ) : (
            <ul className="space-y-1 text-sm text-slate-300">
              {people.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <span>{p.name}</span>
                  <span className="flex items-center gap-3">
                    <Link className="text-xs text-aurora hover:underline" to={`/chart/${p.id}`}>
                      View chart
                    </Link>
                    <button className="text-xs text-red-400 hover:underline" onClick={() => void onRemovePerson(p.id)}>
                      Remove
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mb-3 mt-6 text-lg font-semibold">Generate a synastry report (optional)</h2>
          <p className="mb-3 text-xs text-slate-400">
            Synastry compares two people. If you just want one person&apos;s own reading, use "View chart" above instead.
          </p>
          {people.length < 2 ? (
            <p className="text-sm text-slate-400">Add at least two people to compare.</p>
          ) : (
            <div className="flex flex-col gap-3">
              <select className="input" value={personAId} onChange={(e) => setPersonAId(e.target.value)}>
                <option value="">Person A</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select className="input" value={personBId} onChange={(e) => setPersonBId(e.target.value)}>
                <option value="">Person B</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <fieldset className="flex flex-col gap-1">
                <legend className="text-xs text-slate-400">Zodiac</legend>
                <div className="flex overflow-hidden rounded border border-slate-600 self-start">
                  <button
                    type="button"
                    onClick={() => setZodiacMode("tropical")}
                    className={`px-3 py-1 text-sm ${zodiacMode === "tropical" ? "bg-aurora text-midnight" : "bg-slate-900 text-slate-300 hover:bg-slate-800"}`}
                  >
                    Tropical
                  </button>
                  <button
                    type="button"
                    onClick={() => setZodiacMode("sidereal")}
                    className={`px-3 py-1 text-sm ${zodiacMode === "sidereal" ? "bg-aurora text-midnight" : "bg-slate-900 text-slate-300 hover:bg-slate-800"}`}
                  >
                    Sidereal
                  </button>
                </div>
                {zodiacMode === "sidereal" && (
                  <select
                    className="input mt-1"
                    value={ayanamsa}
                    onChange={(e) => setAyanamsa(e.target.value as Ayanamsa)}
                  >
                    {AYANAMSA_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </fieldset>

              <fieldset className="flex flex-col gap-1">
                <legend className="text-xs text-slate-400">Reading type</legend>
                <div className="flex gap-4 text-sm text-slate-200">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="relationshipType"
                      checked={relationshipType === "romantic"}
                      onChange={() => setRelationshipType("romantic")}
                    />
                    Romantic
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="relationshipType"
                      checked={relationshipType === "friendship"}
                      onChange={() => setRelationshipType("friendship")}
                    />
                    Friendship
                  </label>
                </div>
              </fieldset>

              <label className="text-xs text-slate-400">
                Reading style
                <select
                  className="input mt-1 w-full"
                  value={readingStyle}
                  onChange={(e) => setReadingStyle(e.target.value as ReadingStyle)}
                >
                  {READING_STYLES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              {readingStyle === "other" && (
                <input
                  className="input"
                  placeholder={`Describe the style you want (e.g. \u2018noir detective narration\u2019)`}
                  value={customStyleText}
                  onChange={(e) => setCustomStyleText(e.target.value)}
                />
              )}

              <button className="btn-primary" disabled={generating} onClick={() => void onGenerateSynastry()}>
                {generating ? "Generating…" : "Generate synastry report"}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
