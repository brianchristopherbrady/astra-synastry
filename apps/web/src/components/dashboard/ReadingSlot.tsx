import { useId, useState, type DragEvent } from "react";
import { UserPlus, X } from "lucide-react";
import type { PersonRecord } from "../../api/peopleApi.js";

/** Custom drag type so only people from the dashboard list (not text or links) can be dropped. */
export const PERSON_DRAG_TYPE = "application/x-astra-person";

interface ReadingSlotProps {
  label: string;
  emptyText: string;
  person: PersonRecord | undefined;
  /** True while any person is being dragged, so every slot advertises itself as a target. */
  dragActive: boolean;
  onDropPerson: (personId: string) => void;
  onClear: () => void;
}

function carriesPerson(event: DragEvent): boolean {
  return Array.from(event.dataTransfer.types).includes(PERSON_DRAG_TYPE);
}

export function ReadingSlot({ label, emptyText, person, dragActive, onDropPerson, onClear }: ReadingSlotProps) {
  const labelId = useId();
  const [over, setOver] = useState(false);

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className="reading-slot"
      data-filled={person ? "true" : undefined}
      data-target={dragActive ? "true" : undefined}
      data-over={over ? "true" : undefined}
      onDragOver={(event) => {
        if (!carriesPerson(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setOver(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false);
      }}
      onDrop={(event) => {
        setOver(false);
        const personId = event.dataTransfer.getData(PERSON_DRAG_TYPE);
        if (!personId) return;
        event.preventDefault();
        onDropPerson(personId);
      }}
    >
      <span id={labelId} className="reading-slot-label">{label}</span>
      {person ? (
        <div className="reading-slot-person">
          <span className="person-monogram" aria-hidden="true">{person.name.trim().slice(0, 1).toUpperCase()}</span>
          <span className="person-identity">
            <span className="person-name">{person.name}</span>
            <span className="person-meta">{person.localDateTime.split("T")[0]}</span>
          </span>
          <button type="button" className="icon-button" aria-label={`Remove ${person.name} from the reading`} title="Remove from the reading" onClick={onClear}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <p className="reading-slot-empty">
          <UserPlus size={20} aria-hidden="true" />
          {emptyText}
        </p>
      )}
    </div>
  );
}
