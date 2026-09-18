import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ALL_POINTS, POINT_LABELS } from "@astro/shared";
import type { Ayanamsa, HellenisticProfile, PointName, ZodiacMode } from "@astro/shared";
import { chartsApi, type ChartRecord } from "../api/chartsApi.js";
import { peopleApi, type PersonRecord } from "../api/peopleApi.js";
import { ChartWheel } from "../components/chart/ChartWheel.js";
import { AspectGrid } from "../components/chart/AspectGrid.js";
import { ChartPointLegend } from "../components/chart/ChartPointLegend.js";
import { KeyPlacementsSummary } from "../components/chart/KeyPlacementsSummary.js";
import { HouseBreakdown } from "../components/chart/HouseBreakdown.js";
import { BalanceInsightModal, type BalanceInsightTarget } from "../components/chart/BalanceInsightModal.js";
import { PointInsightModal } from "../components/chart/PointInsightModal.js";
import { HouseInsightModal } from "../components/chart/HouseInsightModal.js";
import { ElementRadarChart } from "../components/dashboard/ElementRadarChart.js";
import { ModalityBarChart } from "../components/dashboard/ModalityBarChart.js";
import { HouseOccupancyChart } from "../components/dashboard/HouseOccupancyChart.js";
import { AiChatDrawer } from "../components/ai/AiChatDrawer.js";
import { AppHeader } from "../components/layout/AppHeader.js";
import { computeChartBalance } from "../lib/chartBalance.js";
import { setLastChart } from "../lib/lastChart.js";

const AYANAMSA_OPTIONS: { value: Ayanamsa; label: string }[] = [
  { value: "lahiri", label: "Lahiri" },
  { value: "raman", label: "Raman" },
  { value: "krishnamurti", label: "Krishnamurti" },
  { value: "fagan_bradley", label: "Fagan-Bradley" },
  { value: "yukteshwar", label: "Yukteshwar" },
];

export default function NatalChartPage() {
  const { personId } = useParams<{ personId: string }>();
  const [chart, setChart] = useState<ChartRecord | null>(null);
  const [person, setPerson] = useState<PersonRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hiddenPoints, setHiddenPoints] = useState<Set<PointName>>(new Set());
  const [insightTarget, setInsightTarget] = useState<BalanceInsightTarget | null>(null);
  const [pointTarget, setPointTarget] = useState<PointName | null>(null);
  const [houseTarget, setHouseTarget] = useState<number | null>(null);
  const [zodiacMode, setZodiacMode] = useState<ZodiacMode>("tropical");
  const [ayanamsa, setAyanamsa] = useState<Ayanamsa>("lahiri");
  const [hellenistic, setHellenistic] = useState<HellenisticProfile | null>(null);

  useEffect(() => {
    if (!personId) return;
    Promise.all([chartsApi.get(personId, { zodiacMode, ayanamsa }), peopleApi.get(personId)])
      .then(([chartResult, personResult]) => {
        setChart(chartResult);
        setPerson(personResult);
        setLastChart(`/chart/${personId}`);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load chart"));
  }, [personId, zodiacMode, ayanamsa]);

  useEffect(() => {
    if (!personId) return;
    chartsApi
      .hellenistic(personId, undefined, { zodiacMode, ayanamsa })
      .then(setHellenistic)
      .catch(() => setHellenistic(null));
  }, [personId, zodiacMode, ayanamsa]);

  function togglePoint(point: PointName): void {
    setHiddenPoints((prev) => {
      const next = new Set(prev);
      if (next.has(point)) next.delete(point);
      else next.add(point);
      return next;
    });
  }

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
        <p className="text-slate-400">Loading chart…</p>
      </div>
    );
  }

  const { elementBalance, modalityBalance } = computeChartBalance(chart);
  const personName = person?.name ?? "This person";

  return (
    <div className="mx-auto max-w-6xl p-6">
      <AppHeader />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-stardust">Natal Chart Reading</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-xs uppercase tracking-wide text-slate-400">Zodiac</span>
          <div className="flex overflow-hidden rounded border border-slate-600">
            <button
              onClick={() => setZodiacMode("tropical")}
              className={`px-3 py-1 ${zodiacMode === "tropical" ? "bg-aurora text-midnight" : "bg-slate-900 text-slate-300 hover:bg-slate-800"}`}
            >
              Tropical
            </button>
            <button
              onClick={() => setZodiacMode("sidereal")}
              className={`px-3 py-1 ${zodiacMode === "sidereal" ? "bg-aurora text-midnight" : "bg-slate-900 text-slate-300 hover:bg-slate-800"}`}
            >
              Sidereal
            </button>
          </div>
          {zodiacMode === "sidereal" && (
            <select
              value={ayanamsa}
              onChange={(e) => setAyanamsa(e.target.value as Ayanamsa)}
              className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-200"
            >
              {AYANAMSA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      <div className="mb-6">
        <KeyPlacementsSummary chart={chart} personName={personName} onSelect={setPointTarget} />
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(280px,380px)_1fr] md:items-start">
        <div className="flex min-w-0 flex-col items-center gap-4 md:sticky md:top-6">
          <ChartWheel innerChart={chart} hiddenPoints={hiddenPoints} />
          <ChartPointLegend
            hiddenPoints={hiddenPoints}
            onToggle={togglePoint}
            onShowAll={() => setHiddenPoints(new Set())}
            onHideAll={() => setHiddenPoints(new Set(ALL_POINTS))}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <h2 className="mb-2 text-sm font-semibold">Element balance</h2>
              <ElementRadarChart balance={elementBalance} onSelect={(element) => setInsightTarget({ kind: "element", value: element })} />
            </section>
            <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <h2 className="mb-2 text-sm font-semibold">Modality balance</h2>
              <ModalityBarChart balance={modalityBalance} onSelect={(modality) => setInsightTarget({ kind: "modality", value: modality })} />
            </section>
            <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <h2 className="mb-2 text-sm font-semibold">House occupancy</h2>
              <HouseOccupancyChart chart={chart} onSelect={setHouseTarget} />
            </section>
          </div>

          <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Your houses</h2>
              <Link to="/wiki#houses" className="text-xs text-aurora hover:underline">
                What are houses?
              </Link>
            </div>
            <p className="mb-3 text-xs text-slate-400">
              What each house means, plus what&apos;s actually sitting in it for {personName}.
            </p>
            <HouseBreakdown chart={chart} />
          </section>

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <h2 className="mb-2 text-lg font-semibold">Aspect grid</h2>
              <AspectGrid pointsA={ALL_POINTS} pointsB={ALL_POINTS} aspects={chart.aspects} />
            </section>

            <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Detected aspect patterns</h2>
                <Link to="/wiki#patterns" className="text-xs text-aurora hover:underline">
                  What do these mean?
                </Link>
              </div>
              {chart.patterns.length === 0 ? (
                <p className="text-sm text-slate-400">No major aspect patterns detected.</p>
              ) : (
                <ul className="space-y-1 text-sm text-slate-300">
                  {chart.patterns.map((pattern, idx) => (
                    <li key={idx}>
                      <span className="font-medium capitalize text-stardust">{pattern.type.replace(/([A-Z])/g, " $1")}</span>:{" "}
                      {pattern.description}
                      <span className="ml-1 text-xs text-slate-500">
                        ({pattern.points.map((p) => POINT_LABELS[p]).join(", ")})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Hellenistic techniques</h2>
              <Link to="/wiki#terms" className="text-xs text-aurora hover:underline">
                What is this?
              </Link>
            </div>
            {hellenistic ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-stardust">
                    Sect: <span className="capitalize text-aurora">{hellenistic.sect.sect} chart</span>
                  </h3>
                  <ul className="space-y-0.5 text-sm text-slate-300">
                    <li>Luminary of sect: <span className="capitalize">{POINT_LABELS[hellenistic.sect.sectLight]}</span></li>
                    <li>Benefic of sect: <span className="capitalize">{POINT_LABELS[hellenistic.sect.benefic]}</span></li>
                    <li>Malefic of sect: <span className="capitalize">{POINT_LABELS[hellenistic.sect.malefic]}</span></li>
                    <li>Contrary-to-sect benefic: <span className="capitalize">{POINT_LABELS[hellenistic.sect.contraryBenefic]}</span></li>
                    <li>Contrary-to-sect malefic: <span className="capitalize">{POINT_LABELS[hellenistic.sect.contraryMalefic]}</span></li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-stardust">Classical lots</h3>
                  <ul className="space-y-0.5 text-sm text-slate-300">
                    {hellenistic.lots.map((lot) => (
                      <li key={lot.name}>
                        {lot.label}: <span className="capitalize">{lot.sign}</span>{" "}
                        {`${lot.signDegree.toFixed(1)}\u00b0`}
                        {lot.house ? ` (house ${lot.house})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                Hellenistic techniques require a known birth time (Ascendant &amp; houses).
              </p>
            )}
          </section>

          <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center">
            <h2 className="mb-1 text-lg font-semibold">Current transits &amp; secondary progressions</h2>
            <p className="mb-3 text-sm text-slate-400">See what's happening for {personName} right now, on a dedicated page.</p>
            <Link
              to={`/chart/${personId}/now`}
              className="inline-block rounded border border-aurora px-4 py-2 text-sm font-semibold text-aurora hover:bg-aurora/10"
            >
              View the "Now" page →
            </Link>
          </section>
        </div>
      </div>

      <BalanceInsightModal
        target={insightTarget}
        onClose={() => setInsightTarget(null)}
        charts={[{ label: personName, chart }]}
      />
      <PointInsightModal point={pointTarget} onClose={() => setPointTarget(null)} charts={[{ label: personName, chart }]} />
      <HouseInsightModal house={houseTarget} onClose={() => setHouseTarget(null)} charts={[{ label: personName, chart }]} />
      <AiChatDrawer reportEndpoint={`/ai/natal/${personId}`} chatEndpoint={`/ai/natal/${personId}/chat`} title={`AI Chat — ${personName}`} />
    </div>
  );
}
