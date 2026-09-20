import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { HOUSE_MEANINGS } from "../content/glossary.js";
import { chartsApi, type ChartRecord } from "../api/chartsApi.js";
import { peopleApi, type PersonRecord } from "../api/peopleApi.js";
import { ChartWheel } from "../components/chart/ChartWheel.js";
import { AspectGrid } from "../components/chart/AspectGrid.js";
import { KeyPlacementsSummary } from "../components/chart/KeyPlacementsSummary.js";
import { TransitList } from "../components/chart/TransitList.js";
import { ElementRadarChart } from "../components/dashboard/ElementRadarChart.js";
import { ModalityBarChart } from "../components/dashboard/ModalityBarChart.js";
import { AiChatDrawer } from "../components/ai/AiChatDrawer.js";
import { computeChartBalance } from "../lib/chartBalance.js";
import type { HellenisticProfile, NatalTransitReport, ProgressedChartReport } from "@astro/shared";
import { ALL_POINTS, POINT_GLYPHS, POINT_LABELS } from "@astro/shared";
import { ChartNavigation } from "../components/layout/ChartNavigation.js";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function toUtcNoon(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00Z`);
}

export default function NatalNowPage() {
  const { personId } = useParams<{ personId: string }>();
  const [chart, setChart] = useState<ChartRecord | null>(null);
  const [person, setPerson] = useState<PersonRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transitsDate, setTransitsDate] = useState<string>(todayIso());
  const [transits, setTransits] = useState<NatalTransitReport | null>(null);
  const [progressionDate, setProgressionDate] = useState<string>(todayIso());
  const [progression, setProgression] = useState<ProgressedChartReport | null>(null);
  const [profectionDate, setProfectionDate] = useState<string>(todayIso());
  const [hellenistic, setHellenistic] = useState<HellenisticProfile | null>(null);
  const [transitsError, setTransitsError] = useState<string | null>(null);
  const [progressionError, setProgressionError] = useState<string | null>(null);
  const [profectionError, setProfectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!personId) return;
    Promise.all([chartsApi.get(personId), peopleApi.get(personId)])
      .then(([chartResult, personResult]) => {
        setChart(chartResult);
        setPerson(personResult);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load chart"));
  }, [personId]);

  useEffect(() => {
    if (!personId) return;
    let active = true;
    setTransits(null);
    setTransitsError(null);
    chartsApi
      .transits(personId, toUtcNoon(transitsDate))
      .then((result) => { if (active) setTransits(result); })
      .catch(() => { if (active) setTransitsError("Transits are unavailable. Choose another date or reload to try again."); });
    return () => { active = false; };
  }, [personId, transitsDate]);

  useEffect(() => {
    if (!personId) return;
    let active = true;
    setProgression(null);
    setProgressionError(null);
    chartsApi
      .progressions(personId, toUtcNoon(progressionDate))
      .then((result) => { if (active) setProgression(result); })
      .catch(() => { if (active) setProgressionError("Progressions are unavailable. Choose another date or reload to try again."); });
    return () => { active = false; };
  }, [personId, progressionDate]);

  useEffect(() => {
    if (!personId) return;
    let active = true;
    setHellenistic(null);
    setProfectionError(null);
    chartsApi
      .hellenistic(personId, toUtcNoon(profectionDate))
      .then((result) => { if (active) setHellenistic(result); })
      .catch(() => { if (active) setProfectionError("Annual profection is unavailable for this date."); });
    return () => { active = false; };
  }, [personId, profectionDate]);

  if (error) {
    return (
      <div className="page-content">
        <p role="alert" className="text-danger">{error}</p>
      </div>
    );
  }
  if (!chart || !personId) {
    return (
      <div className="page-content">
        <p role="status" className="text-muted">Loading chart…</p>
      </div>
    );
  }

  const personName = person?.name ?? "This person";
  const transitBalance = transits ? computeChartBalance(transits.transitingChart) : null;

  return (
    <div className="page-content">
      <div className="page-heading">
        <div><p className="eyebrow">Transits &amp; progressions</p><h1 className="page-title">{personName}</h1></div>
      </div>
      <ChartNavigation basePath={`/chart/${personId}`} />

      <section className="mb-8">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-stardust">Current transits</h2>
          <input
            type="date"
            value={transitsDate}
            aria-label="Transit date"
            onChange={(e) => { if (e.target.value) setTransitsDate(e.target.value); }}
            className="input"
          />
        </div>
        <p className="mb-4 text-sm text-slate-400">Where the sky is today compared to {personName}&apos;s natal chart.</p>

        {transits ? (
          <div className="report-layout">
            <div className="flex min-w-0 flex-col items-center gap-3">
              <ChartWheel
                innerChart={chart}
                outerChart={transits.transitingChart}
                crossAspects={transits.hits}
                innerLabel={personName}
                outerLabel="Transiting sky"
              />
              <p className="text-xs text-slate-400">
                Inner wheel: <span className="text-aurora">{personName}</span> &middot; Outer wheel:{" "}
                <span className="text-stardust">Transiting planets</span>
              </p>
            </div>

            <div className="report-details">
              <div className="report-pair">
                <section className="report-section">
                  <h3 className="mb-2 text-sm font-semibold">Today's sky: element balance</h3>
                  {transitBalance && <ElementRadarChart balance={transitBalance.elementBalance} />}
                </section>
                <section className="report-section">
                  <h3 className="mb-2 text-sm font-semibold">Today's sky: modality balance</h3>
                  {transitBalance && <ModalityBarChart balance={transitBalance.modalityBalance} />}
                </section>
              </div>

              <section className="report-section">
                <h3 className="mb-2 text-sm font-semibold">Where transiting planets are visiting</h3>
                {transits.houseOverlay.length === 0 ? (
                  <p className="text-sm text-slate-400">Houses aren&apos;t available for this chart (birth time unknown).</p>
                ) : (
                  <ul className="space-y-1 text-sm text-slate-300">
                    {transits.houseOverlay.map((entry) => (
                      <li key={entry.point}>
                        <span className="text-slate-200">
                          {POINT_GLYPHS[entry.point]} {POINT_LABELS[entry.point]}
                        </span>{" "}
                        is transiting your {HOUSE_MEANINGS[entry.house]?.title ?? `${entry.house}th house`}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="report-section">
                <h3 className="mb-2 text-sm font-semibold">Transit timeline</h3>
                <TransitList hits={transits.hits} targetLabel={`${personName}'s chart`} />
              </section>
            </div>
          </div>
        ) : (
          <p role={transitsError ? "alert" : "status"} className={`text-sm ${transitsError ? "text-danger" : "text-muted"}`}>{transitsError ?? "Loading transits…"}</p>
        )}
      </section>

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-stardust">Secondary progressions</h2>
          <input
            type="date"
            value={progressionDate}
            aria-label="Progression date"
            onChange={(e) => { if (e.target.value) setProgressionDate(e.target.value); }}
            className="input"
          />
        </div>
        <p className="mb-4 text-sm text-slate-400">
          The "day for a year" progressed chart, showing how {personName}&apos;s chart has symbolically grown.
        </p>

        {progression ? (
          <div className="report-layout">
            <div className="flex min-w-0 flex-col items-center gap-3">
              <ChartWheel innerChart={progression.chart} />
              <KeyPlacementsSummary chart={progression.chart} personName={`${personName} (progressed)`} />
            </div>

            <div className="report-details">
              <div className="report-pair">
                <section className="report-section">
                  <h3 className="mb-2 text-sm font-semibold">Progressed element balance</h3>
                  <ElementRadarChart balance={computeChartBalance(progression.chart).elementBalance} />
                </section>
                <section className="report-section">
                  <h3 className="mb-2 text-sm font-semibold">Progressed modality balance</h3>
                  <ModalityBarChart balance={computeChartBalance(progression.chart).modalityBalance} />
                </section>
              </div>

              <section className="report-section">
                <h3 className="mb-2 text-sm font-semibold">Progressed &harr; natal aspects</h3>
                {progression.crossAspectsToNatal.length === 0 ? (
                  <p className="text-sm text-slate-400">No notable aspects between the progressed and natal chart right now.</p>
                ) : (
                  <AspectGrid pointsA={ALL_POINTS} pointsB={ALL_POINTS} aspects={progression.crossAspectsToNatal} />
                )}
              </section>
            </div>
          </div>
        ) : (
          <p role={progressionError ? "alert" : "status"} className={`text-sm ${progressionError ? "text-danger" : "text-muted"}`}>{progressionError ?? "Loading progressed chart…"}</p>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-stardust">Annual profection</h2>
          <input
            type="date"
            value={profectionDate}
            aria-label="Profection date"
            onChange={(e) => { if (e.target.value) setProfectionDate(e.target.value); }}
            className="input"
          />
        </div>
        <p className="mb-4 text-sm text-slate-400">
          A Hellenistic "whole sign for a year" technique: each completed year of life activates the
          next sign/house from the Ascendant, and its traditional ruler becomes that year's "lord of
          the year."
        </p>
        {hellenistic ? (
          <section className="report-section">
            <p className="text-sm text-slate-200">
              At age <span className="font-semibold text-aurora">{hellenistic.profection.age}</span>,{" "}
              {personName} is in a <span className="capitalize text-aurora">{hellenistic.profection.profectedSign}</span>{" "}
              profection (house {hellenistic.profection.profectedHouse}). This year&apos;s lord is{" "}
              <span className="text-aurora">
                {POINT_GLYPHS[hellenistic.profection.lordOfYear]} {POINT_LABELS[hellenistic.profection.lordOfYear]}
              </span>
              , natally in <span className="capitalize">{hellenistic.profection.lordNatalSign}</span>
              {hellenistic.profection.lordNatalHouse ? ` (house ${hellenistic.profection.lordNatalHouse})` : ""}.
            </p>
          </section>
        ) : (
          person?.timeUnknown ? <p className="text-sm text-muted">Annual profections require a known birth time.</p> :
          <p role={profectionError ? "alert" : "status"} className={`text-sm ${profectionError ? "text-danger" : "text-muted"}`}>{profectionError ?? "Loading profection…"}</p>
        )}
      </section>

      <AiChatDrawer reportEndpoint={`/ai/natal/${personId}`} chatEndpoint={`/ai/natal/${personId}/chat`} title={`AI Chat — ${personName}`} />
    </div>
  );
}
