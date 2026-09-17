import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ALL_POINTS, POINT_LABELS } from "@astro/shared";
import type { PointName } from "@astro/shared";
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

export default function NatalChartPage() {
  const { personId } = useParams<{ personId: string }>();
  const [chart, setChart] = useState<ChartRecord | null>(null);
  const [person, setPerson] = useState<PersonRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hiddenPoints, setHiddenPoints] = useState<Set<PointName>>(new Set());
  const [insightTarget, setInsightTarget] = useState<BalanceInsightTarget | null>(null);
  const [pointTarget, setPointTarget] = useState<PointName | null>(null);
  const [houseTarget, setHouseTarget] = useState<number | null>(null);

  useEffect(() => {
    if (!personId) return;
    Promise.all([chartsApi.get(personId), peopleApi.get(personId)])
      .then(([chartResult, personResult]) => {
        setChart(chartResult);
        setPerson(personResult);
        setLastChart(`/chart/${personId}`);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load chart"));
  }, [personId]);

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
      <h1 className="mb-4 text-2xl font-bold text-stardust">Natal Chart Reading</h1>
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
