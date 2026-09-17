import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ALL_POINTS } from "@astro/shared";
import type { PointName } from "@astro/shared";
import { synastryApi, type SynastryRecord } from "../api/synastryApi.js";
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
import { CompatibilityGauge } from "../components/dashboard/CompatibilityGauge.js";
import { HouseOccupancyChart } from "../components/dashboard/HouseOccupancyChart.js";
import { AiChatDrawer } from "../components/ai/AiChatDrawer.js";
import { AppHeader } from "../components/layout/AppHeader.js";
import { setLastChart } from "../lib/lastChart.js";

export default function SynastryReportPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<SynastryRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hiddenPoints, setHiddenPoints] = useState<Set<PointName>>(new Set());
  const [insightTarget, setInsightTarget] = useState<BalanceInsightTarget | null>(null);
  const [pointTarget, setPointTarget] = useState<PointName | null>(null);
  const [houseTarget, setHouseTarget] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    synastryApi
      .get(id)
      .then((result) => {
        setReport(result);
        setLastChart(`/synastry/${id}`);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load report"));
  }, [id]);

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
  if (!report) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <AppHeader />
        <p className="text-slate-400">Loading synastry report…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <AppHeader />
      <h1 className="mb-4 text-2xl font-bold text-stardust">Synastry Report</h1>
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <KeyPlacementsSummary chart={report.personAChart} personName={report.personAName} onSelect={setPointTarget} />
        </div>
        <div className="min-w-0">
          <KeyPlacementsSummary chart={report.personBChart} personName={report.personBName} onSelect={setPointTarget} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(280px,380px)_1fr] md:items-start">
        <div className="flex min-w-0 flex-col items-center gap-4 md:sticky md:top-6">
          <ChartWheel
            innerChart={report.personAChart}
            outerChart={report.personBChart}
            crossAspects={report.crossAspects}
            hiddenPoints={hiddenPoints}
            innerLabel={report.personAName}
            outerLabel={report.personBName}
          />
          <p className="text-xs text-slate-400">
            Inner wheel: <span className="text-aurora">{report.personAName}</span> {"\u2022"} Outer wheel:{" "}
            <span className="text-stardust">{report.personBName}</span>
          </p>
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
              <h2 className="mb-2 text-sm font-semibold">Compatibility</h2>
              <CompatibilityGauge score={report.compatibilityScore} />
            </section>
            <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <h2 className="mb-2 text-sm font-semibold">Element balance</h2>
              <ElementRadarChart
                balance={report.compatibilityScore.elementBalance}
                onSelect={(element) => setInsightTarget({ kind: "element", value: element })}
              />
            </section>
            <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <h2 className="mb-2 text-sm font-semibold">Modality balance</h2>
              <ModalityBarChart
                balance={report.compatibilityScore.modalityBalance}
                onSelect={(modality) => setInsightTarget({ kind: "modality", value: modality })}
              />
            </section>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <h2 className="mb-2 text-lg font-semibold">{report.personAName}&apos;s houses</h2>
              <HouseOccupancyChart chart={report.personAChart} onSelect={setHouseTarget} />
            </section>
            <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <h2 className="mb-2 text-lg font-semibold">{report.personBName}&apos;s houses</h2>
              <HouseOccupancyChart chart={report.personBChart} onSelect={setHouseTarget} />
            </section>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">{report.personAName}&apos;s houses, explained</h2>
                <Link to="/wiki#houses" className="text-xs text-aurora hover:underline">
                  What are houses?
                </Link>
              </div>
              <HouseBreakdown chart={report.personAChart} />
            </section>
            <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <h2 className="mb-2 text-lg font-semibold">{report.personBName}&apos;s houses, explained</h2>
              <HouseBreakdown chart={report.personBChart} />
            </section>
          </div>

          <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
            <h2 className="mb-2 text-lg font-semibold">Cross-aspect grid</h2>
            <AspectGrid pointsA={ALL_POINTS} pointsB={ALL_POINTS} aspects={report.crossAspects} />
          </section>

          <div className="grid gap-6 sm:grid-cols-2">
            <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <h2 className="mb-2 text-lg font-semibold">Composite chart</h2>
              <p className="mb-3 text-xs text-slate-400">The relationship as its own entity, built from the midpoint of every placement.</p>
              <div className="flex flex-col items-center gap-3">
                <div className="w-full max-w-[260px]">
                  <ChartWheel innerChart={report.compositeChart} size={420} />
                </div>
                <KeyPlacementsSummary chart={report.compositeChart} personName="The relationship (composite)" />
              </div>
            </section>
            <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <h2 className="mb-2 text-lg font-semibold">Davison chart</h2>
              <p className="mb-3 text-xs text-slate-400">A real chart for the midpoint moment in time and location between you two.</p>
              <div className="flex flex-col items-center gap-3">
                <div className="w-full max-w-[260px]">
                  <ChartWheel innerChart={report.davisonChart} size={420} />
                </div>
                <KeyPlacementsSummary chart={report.davisonChart} personName="The relationship (Davison)" />
              </div>
            </section>
          </div>

          <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center">
            <h2 className="mb-1 text-lg font-semibold">Current transits</h2>
            <p className="mb-3 text-sm text-slate-400">
              See what's happening for {report.personAName} &amp; {report.personBName} right now, on a dedicated page.
            </p>
            <Link
              to={`/synastry/${report.id}/now`}
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
        charts={[
          { label: report.personAName, chart: report.personAChart },
          { label: report.personBName, chart: report.personBChart },
        ]}
      />
      <PointInsightModal
        point={pointTarget}
        onClose={() => setPointTarget(null)}
        charts={[
          { label: report.personAName, chart: report.personAChart },
          { label: report.personBName, chart: report.personBChart },
        ]}
      />
      <HouseInsightModal
        house={houseTarget}
        onClose={() => setHouseTarget(null)}
        charts={[
          { label: report.personAName, chart: report.personAChart },
          { label: report.personBName, chart: report.personBChart },
        ]}
      />
      <AiChatDrawer
        reportEndpoint={`/ai/synastry/${report.id}`}
        chatEndpoint={`/ai/synastry/${report.id}/chat`}
        title={`AI Chat — ${report.personAName} & ${report.personBName}`}
      />
    </div>
  );
}
