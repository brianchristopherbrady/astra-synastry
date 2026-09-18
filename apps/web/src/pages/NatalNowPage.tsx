import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { HOUSE_MEANINGS } from "../content/glossary.js";
import { chartsApi, type ChartRecord } from "../api/chartsApi.js";
import { peopleApi, type PersonRecord } from "../api/peopleApi.js";
import { ChartWheel } from "../components/chart/ChartWheel.js";
import { AspectGrid } from "../components/chart/AspectGrid.js";
import { KeyPlacementsSummary } from "../components/chart/KeyPlacementsSummary.js";
import { TransitList } from "../components/chart/TransitList.js";
import { ElementRadarChart } from "../components/dashboard/ElementRadarChart.js";
import { ModalityBarChart } from "../components/dashboard/ModalityBarChart.js";
import { AppHeader } from "../components/layout/AppHeader.js";
import { AiChatDrawer } from "../components/ai/AiChatDrawer.js";
import { computeChartBalance } from "../lib/chartBalance.js";
import type { HellenisticProfile, NatalTransitReport, ProgressedChartReport } from "@astro/shared";
import { ALL_POINTS, POINT_GLYPHS, POINT_LABELS } from "@astro/shared";

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
    chartsApi
      .transits(personId, toUtcNoon(transitsDate))
      .then(setTransits)
      .catch(() => setTransits(null));
  }, [personId, transitsDate]);

  useEffect(() => {
    if (!personId) return;
    chartsApi
      .progressions(personId, toUtcNoon(progressionDate))
      .then(setProgression)
      .catch(() => setProgression(null));
  }, [personId, progressionDate]);

  useEffect(() => {
    if (!personId) return;
    chartsApi
      .hellenistic(personId, toUtcNoon(profectionDate))
      .then(setHellenistic)
      .catch(() => setHellenistic(null));
  }, [personId, profectionDate]);

  if (error) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <AppHeader />
        <p className="text-red-400">{error}</p>
      </div>
    );
  }
  if (!chart || !personId) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <AppHeader />
        <p className="text-slate-400">Loading…</p>
      </div>
    );
  }

  const personName = person?.name ?? "This person";
  const transitBalance = transits ? computeChartBalance(transits.transitingChart) : null;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <AppHeader />
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-stardust">Now: Transits &amp; Progressions</h1>
        <Link to={`/chart/${personId}`} className="text-sm text-aurora hover:underline">
          &larr; Back to {personName}&apos;s chart
        </Link>
      </div>

      <section className="mb-8">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-stardust">Current transits</h2>
          <input
            type="date"
            value={transitsDate}
            onChange={(e) => setTransitsDate(e.target.value)}
            className="rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-slate-200"
          />
        </div>
        <p className="mb-4 text-sm text-slate-400">Where the sky is today compared to {personName}&apos;s natal chart.</p>

        {transits ? (
          <div className="grid gap-6 md:grid-cols-[minmax(260px,340px)_1fr] md:items-start">
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

            <div className="flex min-w-0 flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                  <h3 className="mb-2 text-sm font-semibold">Today's sky: element balance</h3>
                  {transitBalance && <ElementRadarChart balance={transitBalance.elementBalance} />}
                </section>
                <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                  <h3 className="mb-2 text-sm font-semibold">Today's sky: modality balance</h3>
                  {transitBalance && <ModalityBarChart balance={transitBalance.modalityBalance} />}
                </section>
              </div>

              <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
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

              <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                <h3 className="mb-2 text-sm font-semibold">Transit timeline</h3>
                <TransitList hits={transits.hits} targetLabel={`${personName}'s chart`} />
              </section>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Loading transits…</p>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-stardust">Secondary progressions</h2>
          <input
            type="date"
            value={progressionDate}
            onChange={(e) => setProgressionDate(e.target.value)}
            className="rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-slate-200"
          />
        </div>
        <p className="mb-4 text-sm text-slate-400">
          The "day for a year" progressed chart, showing how {personName}&apos;s chart has symbolically grown.
        </p>

        {progression ? (
          <div className="grid gap-6 md:grid-cols-[minmax(260px,340px)_1fr] md:items-start">
            <div className="flex min-w-0 flex-col items-center gap-3">
              <ChartWheel innerChart={progression.chart} />
              <KeyPlacementsSummary chart={progression.chart} personName={`${personName} (progressed)`} />
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                  <h3 className="mb-2 text-sm font-semibold">Progressed element balance</h3>
                  <ElementRadarChart balance={computeChartBalance(progression.chart).elementBalance} />
                </section>
                <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                  <h3 className="mb-2 text-sm font-semibold">Progressed modality balance</h3>
                  <ModalityBarChart balance={computeChartBalance(progression.chart).modalityBalance} />
                </section>
              </div>

              <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
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
          <p className="text-sm text-slate-400">Loading progressed chart…</p>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-stardust">Annual profection</h2>
          <input
            type="date"
            value={profectionDate}
            onChange={(e) => setProfectionDate(e.target.value)}
            className="rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-slate-200"
          />
        </div>
        <p className="mb-4 text-sm text-slate-400">
          A Hellenistic "whole sign for a year" technique: each completed year of life activates the
          next sign/house from the Ascendant, and its traditional ruler becomes that year's "lord of
          the year."
        </p>
        {hellenistic ? (
          <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
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
          <p className="text-sm text-slate-400">Loading profection…</p>
        )}
      </section>

      <AiChatDrawer reportEndpoint={`/ai/natal/${personId}`} chatEndpoint={`/ai/natal/${personId}/chat`} title={`AI Chat — ${personName}`} />
    </div>
  );
}
