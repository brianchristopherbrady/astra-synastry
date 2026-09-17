import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { TransitReport } from "@astro/shared";
import { synastryApi, type SynastryRecord } from "../api/synastryApi.js";
import { ChartWheel } from "../components/chart/ChartWheel.js";
import { TransitList } from "../components/chart/TransitList.js";
import { ElementRadarChart } from "../components/dashboard/ElementRadarChart.js";
import { ModalityBarChart } from "../components/dashboard/ModalityBarChart.js";
import { AppHeader } from "../components/layout/AppHeader.js";
import { AiChatDrawer } from "../components/ai/AiChatDrawer.js";
import { computeChartBalance } from "../lib/chartBalance.js";

export default function SynastryNowPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<SynastryRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transits, setTransits] = useState<TransitReport | null>(null);

  useEffect(() => {
    if (!id) return;
    synastryApi.get(id).then(setReport).catch((err) => setError(err instanceof Error ? err.message : "Failed to load report"));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    synastryApi
      .transits(id)
      .then(setTransits)
      .catch(() => setTransits(null));
  }, [id]);

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
        <p className="text-slate-400">Loading…</p>
      </div>
    );
  }

  const transitBalance = transits ? computeChartBalance(transits.transitingChart) : null;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <AppHeader />
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-stardust">Now: Current Transits</h1>
        <Link to={`/synastry/${id}`} className="text-sm text-aurora hover:underline">
          &larr; Back to {report.personAName} &amp; {report.personBName}&apos;s report
        </Link>
      </div>
      <p className="mb-6 text-sm text-slate-400">
        Where the sky is today, compared against {report.personAName}, {report.personBName}, and your composite chart.
      </p>

      {transits ? (
        <>
          <div className="mb-8 grid gap-6 md:grid-cols-[minmax(260px,340px)_1fr] md:items-start">
            <div className="flex min-w-0 flex-col items-center gap-3">
              <ChartWheel
                innerChart={transits.transitingChart}
                innerLabel="Transiting sky"
                size={420}
              />
              <p className="text-xs text-slate-400">Today's transiting planets, geocentric &amp; sign-based.</p>
            </div>

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
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <h3 className="mb-2 text-sm font-semibold text-aurora">To {report.personAName}</h3>
              <TransitList hits={transits.hitsToPersonA} targetLabel={`${report.personAName}'s chart`} />
            </section>
            <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <h3 className="mb-2 text-sm font-semibold text-aurora">To {report.personBName}</h3>
              <TransitList hits={transits.hitsToPersonB} targetLabel={`${report.personBName}'s chart`} />
            </section>
            <section className="min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
              <h3 className="mb-2 text-sm font-semibold text-aurora">To your composite chart</h3>
              <TransitList hits={transits.hitsToComposite} targetLabel="your composite chart" />
            </section>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-400">Loading transits…</p>
      )}

      <AiChatDrawer
        reportEndpoint={`/ai/synastry/${report.id}`}
        chatEndpoint={`/ai/synastry/${report.id}/chat`}
        title={`AI Chat — ${report.personAName} & ${report.personBName}`}
      />
    </div>
  );
}
