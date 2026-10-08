import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Compass, Pencil, Plus, Save, Trash2, Users, Orbit, MapPin } from "lucide-react";
import type { Ayanamsa, ReadingStyle, RelationshipType, ZodiacMode } from "@astro/shared";
import { peopleApi, type PersonRecord } from "../api/peopleApi.js";
import { synastryApi } from "../api/synastryApi.js";
import { chartsApi } from "../api/chartsApi.js";
import { addSessionReading, removeSessionReadingsFor } from "../lib/sessionReadings.js";
import { draftFromPerson, draftToPayload, emptyPersonDraft, PersonForm, type PersonDraft } from "../components/forms/PersonForm.js";
import { Modal } from "../components/ui/Modal.js";

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
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [addingPerson, setAddingPerson] = useState(false);
  const [personToRemove, setPersonToRemove] = useState<PersonRecord | null>(null);
  const [addDraft, setAddDraft] = useState<PersonDraft>(emptyPersonDraft);
  const [personToEdit, setPersonToEdit] = useState<PersonRecord | null>(null);
  const [editDraft, setEditDraft] = useState<PersonDraft>(emptyPersonDraft);

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

  async function onAddPerson(): Promise<void> {
    setSaving(true);
    setError(null);
    setStatus("");
    try {
      await peopleApi.create(draftToPayload(addDraft));
      setAddDraft((current) => ({ ...emptyPersonDraft(), timezone: current.timezone }));
      await loadPeople();
      setAddingPerson(false);
      setStatus("Person saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add person");
    } finally {
      setSaving(false);
    }
  }

  function openEditor(person: PersonRecord): void {
    setError(null);
    setEditDraft(draftFromPerson(person));
    setPersonToEdit(person);
  }

  async function onEditPerson(): Promise<void> {
    if (!personToEdit) return;
    setSaving(true);
    setError(null);
    setStatus("");
    try {
      await peopleApi.update(personToEdit.id, draftToPayload(editDraft));
      await loadPeople();
      setPersonToEdit(null);
      setStatus("Person updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update person");
    } finally {
      setSaving(false);
    }
  }

  async function onGenerateReading(): Promise<void> {
    const personA = people.find((p) => p.id === personAId);
    if (!personA || personAId === personBId) return;
    const ayanamsaLabel = AYANAMSA_OPTIONS.find((opt) => opt.value === ayanamsa)?.label ?? ayanamsa;
    const zodiacDetail = zodiacMode === "sidereal" ? `sidereal (${ayanamsaLabel})` : "tropical";

    if (!personBId) {
      const query = zodiacMode === "sidereal" ? `?${new URLSearchParams({ zodiac: "sidereal", ayanamsa })}` : "";
      const path = `/chart/${personA.id}${query}`;
      void chartsApi.pregenerateReading(personA.id, { zodiacMode, ayanamsa }).catch(() => {});
      addSessionReading({ path, label: personA.name, detail: `Natal reading \u00b7 ${zodiacDetail}`, personIds: [personA.id] });
      navigate(path);
      return;
    }

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
      addSessionReading({
        path: `/synastry/${report.id}`,
        label: `${report.personAName} & ${report.personBName}`,
        detail: `Synastry \u00b7 ${relationshipType} \u00b7 ${zodiacDetail}`,
        personIds: [personAId, personBId],
      });
      navigate(`/synastry/${report.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate synastry report");
    } finally {
      setGenerating(false);
    }
  }

  async function onRemovePerson(id: string): Promise<void> {
    if (removing) return;
    setRemoving(id);
    setError(null);
    setStatus("");
    try {
      await peopleApi.remove(id);
      removeSessionReadingsFor(id);
      await loadPeople();
      if (personAId === id) setPersonAId("");
      if (personBId === id) setPersonBId("");
      setPersonToRemove(null);
      setStatus("Person removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove person");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="page-content">

      <div className="page-heading">
        <div>
          <p className="eyebrow">People &amp; connections</p>
          <h1 className="page-title">Your workspace</h1>
        </div>
        <button className="btn-primary" onClick={() => { setError(null); setAddingPerson(true); }}>
          <Plus size={18} aria-hidden="true" /> Add a person
        </button>
      </div>
      {error && !addingPerson && !personToRemove && !personToEdit && <p role="alert" className="mb-4 text-sm text-danger">{error}</p>}
      <p role="status" className="text-sm text-success">{status}</p>

      <Modal open={addingPerson} onClose={() => { if (!saving) setAddingPerson(false); }} title="Add a person">
        {error && <p role="alert" className="mb-4 text-sm text-danger">{error}</p>}
        <PersonForm
          draft={addDraft}
          onChange={setAddDraft}
          onSubmit={() => void onAddPerson()}
          saving={saving}
          submitLabel="Save person"
          submitIcon={<Plus size={18} aria-hidden="true" />}
        />
      </Modal>
      <Modal open={personToEdit !== null} onClose={() => { if (!saving) setPersonToEdit(null); }} title={`Edit ${personToEdit?.name ?? "person"}`}>
        <p className="mb-4 text-sm text-muted">
          Changing birth details recalculates this person&apos;s charts and relationship reports. Their AI readings regenerate the next time you open them.
        </p>
        {error && <p role="alert" className="mb-4 text-sm text-danger">{error}</p>}
        <PersonForm
          draft={editDraft}
          onChange={setEditDraft}
          onSubmit={() => void onEditPerson()}
          saving={saving}
          submitLabel="Save changes"
          submitIcon={<Save size={18} aria-hidden="true" />}
        />
      </Modal>
      <Modal open={personToRemove !== null} onClose={() => { if (!removing) setPersonToRemove(null); }} title="Remove person?">
        <p className="mb-4 text-sm text-muted">Remove {personToRemove?.name} and their saved charts and relationship reports? This cannot be undone.</p>
        {error && <p role="alert" className="mb-4 text-sm text-danger">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <button className="btn-secondary" disabled={removing !== null} onClick={() => setPersonToRemove(null)}>Cancel</button>
          <button className="btn-danger" disabled={removing !== null} onClick={() => { if (personToRemove) void onRemovePerson(personToRemove.id); }}>
            <Trash2 size={16} aria-hidden="true" /> {removing ? "Removing…" : "Remove person"}
          </button>
        </div>
      </Modal>

      <div className="workspace-layout">
        <section className="workspace-people" aria-labelledby="people-title">
          <div className="section-heading">
            <h2 id="people-title"><Users size={18} aria-hidden="true" /> Your people</h2>
            {!loading && <span className="text-sm text-muted">{people.length} saved</span>}
          </div>
          {loading ? (
            <p role="status" className="empty-state text-sm text-muted">Loading people…</p>
          ) : people.length === 0 ? (
            <div className="empty-state">
              <Orbit size={40} strokeWidth={1} aria-hidden="true" />
              <h3>No saved people yet</h3>
              <button className="btn-secondary" onClick={() => { setError(null); setAddingPerson(true); }}><Plus size={16} aria-hidden="true" /> Add your first person</button>
            </div>
          ) : (
            <ul className="people-list">
              {people.map((p) => (
                <li key={p.id} className="person-row">
                  <span className="person-monogram" aria-hidden="true">{p.name.trim().slice(0, 1).toUpperCase()}</span>
                  <div className="person-identity">
                    <h3 className="person-name">{p.name}</h3>
                    <span className="person-meta">{p.localDateTime.split("T")[0]}{p.timeUnknown ? " · Time unknown" : ""}</span>
                    {p.locationName && <span className="person-meta"><MapPin size={12} aria-hidden="true" />{p.locationName}</span>}
                  </div>
                  <div className="person-actions">
                    <Link className="btn-secondary" to={`/chart/${p.id}`} aria-label={`Open ${p.name}'s natal chart`}>
                      <Compass size={16} aria-hidden="true" /> Natal chart
                    </Link>
                    <button className="icon-button" title={`Edit ${p.name}`} aria-label={`Edit ${p.name}`} disabled={saving} onClick={() => openEditor(p)}>
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                    <button className="icon-button remove-person" title={`Remove ${p.name}`} disabled={removing !== null} aria-label={`Remove ${p.name}`} onClick={() => { setError(null); setPersonToRemove(p); }}>
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="workspace-comparison" aria-labelledby="comparison-title">
          <div className="section-heading"><h2 id="comparison-title"><Orbit size={18} aria-hidden="true" /> Run a reading</h2><span className="eyebrow">Natal or synastry</span></div>
          {people.length === 0 ? (
            <p className="empty-state text-sm text-muted">Add a person to run a reading.</p>
          ) : (
            <div className="comparison-form">
              <div className="report-pair comparison-pair">
              <label className="field-label" htmlFor="person-a">Person A
              <select id="person-a" className="input" value={personAId} onChange={(e) => setPersonAId(e.target.value)}>
                <option value="">Select person</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              </label>
              <label className="field-label" htmlFor="person-b">Person B (optional)
              <select id="person-b" className="input" value={personBId} onChange={(e) => setPersonBId(e.target.value)}>
                <option value="">None (natal reading)</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              </label>
              </div>

              <fieldset className="flex flex-col gap-1">
                <legend className="text-xs text-slate-400">Zodiac</legend>
                <div className="segmented-control">
                  <button
                    type="button"
                    onClick={() => setZodiacMode("tropical")}
                    aria-pressed={zodiacMode === "tropical"}
                    className="px-3 py-1 text-sm"
                  >
                    Tropical
                  </button>
                  <button
                    type="button"
                    onClick={() => setZodiacMode("sidereal")}
                    aria-pressed={zodiacMode === "sidereal"}
                    className="px-3 py-1 text-sm"
                  >
                    Sidereal
                  </button>
                </div>
                {zodiacMode === "sidereal" && (
                  <select
                    aria-label="Ayanamsa"
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

              {personBId && (
              <>
              <fieldset className="flex flex-col gap-1">
                <legend className="text-xs text-slate-400">Reading type</legend>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  <label className="flex min-h-8 items-center gap-1.5">
                    <input
                      type="radio"
                      name="relationshipType"
                      checked={relationshipType === "romantic"}
                      onChange={() => setRelationshipType("romantic")}
                    />
                    Romantic
                  </label>
                  <label className="flex min-h-8 items-center gap-1.5">
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

              <label className="text-sm text-muted">
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
                  aria-label="Custom reading style"
                  placeholder={`Describe the style you want (e.g. \u2018noir detective narration\u2019)`}
                  value={customStyleText}
                  onChange={(e) => setCustomStyleText(e.target.value)}
                />
              )}
              </>
              )}

              {personAId && personAId === personBId && <p className="text-sm text-danger">Choose two different people, or set Person B to None.</p>}
              <button className="btn-primary" disabled={generating || !personAId || personAId === personBId} onClick={() => void onGenerateReading()}>
                <Orbit size={18} aria-hidden="true" />
                {generating ? "Generating…" : personBId ? "Generate synastry report" : "Generate natal reading"}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
