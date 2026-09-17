import { ASPECT_DEFINITIONS, POINT_GLYPHS, POINT_LABELS, ZODIAC_SIGNS } from "@astro/shared";
import type { PointName } from "@astro/shared";
import { AppHeader } from "../components/layout/AppHeader.js";
import { GENERAL_TERMS, HOUSE_MEANINGS, PATTERN_MEANINGS, POINT_MEANINGS, SIGN_MEANINGS } from "../content/glossary.js";

const POINT_ORDER: PointName[] = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "northNode",
  "southNode",
  "chiron",
  "lilith",
  "ascendant",
  "midheaven",
  "vertex",
  "partOfFortune",
];

const SECTIONS = [
  { id: "terms", label: "Key terms" },
  { id: "points", label: "Planets & points" },
  { id: "signs", label: "Zodiac signs" },
  { id: "houses", label: "Houses" },
  { id: "aspects", label: "Aspects" },
  { id: "patterns", label: "Aspect patterns" },
];

export default function WikiPage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <AppHeader />
      <h1 className="mb-2 text-2xl font-bold text-stardust">Astrology Wiki</h1>
      <p className="mb-6 text-sm text-slate-400">
        A quick reference for the terms and symbols used throughout your charts and readings.
      </p>

      <nav className="mb-8 flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded border border-slate-600 px-3 py-1 text-sm text-slate-200 hover:border-aurora hover:text-aurora"
          >
            {s.label}
          </a>
        ))}
      </nav>

      <section id="terms" className="mb-10 scroll-mt-6">
        <h2 className="mb-3 text-xl font-semibold text-stardust">Key terms</h2>
        {GENERAL_TERMS.some((entry) => entry.implemented === false) && (
          <p className="mb-3 text-xs text-slate-500">
            Terms marked <span className="rounded border border-slate-600 px-1.5 py-0.5 text-slate-400">Not in this app yet</span> are explained for
            context but aren't something Astra Synastry can generate for you today.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {GENERAL_TERMS.map((entry) => (
            <div key={entry.title} className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-aurora">{entry.title}</h3>
                {entry.implemented === false && (
                  <span className="shrink-0 rounded border border-slate-600 px-1.5 py-0.5 text-[11px] text-slate-400">
                    Not in this app yet
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300">{entry.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="points" className="mb-10 scroll-mt-6">
        <h2 className="mb-3 text-xl font-semibold text-stardust">Planets &amp; points</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {POINT_ORDER.map((point) => (
            <div key={point} className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
              <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-aurora">
                <span className="text-lg">{POINT_GLYPHS[point]}</span>
                {POINT_LABELS[point]}
              </h3>
              <p className="text-sm text-slate-300">{POINT_MEANINGS[point]}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="signs" className="mb-10 scroll-mt-6">
        <h2 className="mb-3 text-xl font-semibold text-stardust">Zodiac signs</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {ZODIAC_SIGNS.map((signInfo) => (
            <div key={signInfo.sign} className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
              <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-aurora">
                <span className="text-lg">{signInfo.glyph}</span>
                {signInfo.name}
                <span className="text-xs font-normal capitalize text-slate-500">{`${signInfo.element} · ${signInfo.modality}`}</span>
              </h3>
              <p className="text-sm text-slate-300">{SIGN_MEANINGS[signInfo.sign]}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="houses" className="mb-10 scroll-mt-6">
        <h2 className="mb-3 text-xl font-semibold text-stardust">Houses</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(HOUSE_MEANINGS).map(([house, entry]) => (
            <div key={house} className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
              <h3 className="mb-1 text-sm font-semibold text-aurora">{entry.title}</h3>
              <p className="text-sm text-slate-300">{entry.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="aspects" className="mb-10 scroll-mt-6">
        <h2 className="mb-3 text-xl font-semibold text-stardust">Aspects</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {ASPECT_DEFINITIONS.map((def) => (
            <div key={def.aspect} className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
              <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-aurora">
                <span className="text-lg">{def.glyph}</span>
                <span className="capitalize">{def.aspect}</span>
                <span className="text-xs font-normal text-slate-500">{`${def.angle}\u00b0`}</span>
              </h3>
              <p className="text-sm text-slate-300">
                {def.harmony > 0
                  ? "A harmonious, flowing aspect \u2014 things click easily, sometimes too easily to notice."
                  : def.harmony < 0
                    ? "A tense, friction-generating aspect \u2014 uncomfortable, but often where growth happens."
                    : "A neutral, blending aspect \u2014 the two points merge and amplify each other."}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="patterns" className="mb-10 scroll-mt-6">
        <h2 className="mb-3 text-xl font-semibold text-stardust">Aspect patterns</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(PATTERN_MEANINGS).map(([type, body]) => (
            <div key={type} className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
              <h3 className="mb-1 text-sm font-semibold capitalize text-aurora">{type.replace(/([A-Z])/g, " $1")}</h3>
              <p className="text-sm text-slate-300">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
