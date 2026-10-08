import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Compass } from "lucide-react";
import { useSessionReadings } from "../../lib/sessionReadings.js";

/** Disclosure menu listing readings run this session; hidden until the first one exists. */
export function ReadingsMenu() {
  const readings = useSessionReadings();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [location.pathname, location.search]);

  useEffect(() => {
    if (!open) return;
    // Pointer handling covers browsers that don't focus buttons on click, so blur alone won't fire.
    const onPointerDown = (event: PointerEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (readings.length === 0) return null;

  return (
    <div
      ref={rootRef}
      className="nav-menu"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
      onBlur={(event) => {
        if (open && event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className="nav-link"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        <Compass size={17} aria-hidden="true" />
        <span className="nav-menu-text">
          View chart <ChevronDown size={14} aria-hidden="true" className="nav-menu-chevron" />
        </span>
      </button>
      <ul id={listId} className="nav-menu-list" hidden={!open}>
        {readings.map((reading) => (
          <li key={reading.path}>
            <Link
              to={reading.path}
              className="nav-menu-item"
              aria-current={reading.path.split("?")[0] === location.pathname ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <span className="nav-menu-label">{reading.label}</span>
              <span className="nav-menu-detail">{reading.detail}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
