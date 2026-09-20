import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { TransitReport } from "@astro/shared";
import { synastryApi, type SynastryRecord } from "../api/synastryApi.js";
import { ChartWheel } from "../components/chart/ChartWheel.js";
import { TransitList } from "../components/chart/TransitList.js";
import { ElementRadarChart } from "../components/dashboard/ElementRadarChart.js";
import { ModalityBarChart } from "../components/dashboard/ModalityBarChart.js";
import { AiChatDrawer } from "../components/ai/AiChatDrawer.js";
import { computeChartBalance } from "../lib/chartBalance.js";
import { ChartNavigation } from "../components/layout/ChartNavigation.js";

export default function SynastryNowPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<SynastryRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transits, setTransits] = useState<TransitReport | null>(null);
  const [transitsError, setTransitsError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    synastryApi.get(id).then(setReport).catch((err) => setError(err instanceof Error ? err.message : "Failed to load report"));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setTransits(null);
    setTransitsError(null);
    synastryApi
      .transits(id)
      .then((result) => { if (active) setTransits(result); })
      .catch(() => { if (active) setTransitsError("Transits are unavailable. Reload to try again."); });
    return () => { active = false; };
  }, [id]);

  if (error) {
    return (
      <div className="page-content">
        <p role="alert" className="text-danger">{error}</p>
      </div>
    );
  }
  if (!report) {
    return (
      <div className="page-content">
        <p role="status" className="text-muted">Loading relationship chart…</p>
      </div>
    );
  }

  const transitBalance = transits ? computeChartBalance(transits.transitingChart) : null;

  return (
    <div className="page-content">
      <div className="page-heading">
        <div><p className="eyebrow">Current transits</p><h1 className="page-title">{report.personAName} &amp; {report.personBName}</h1></div>
      </div>
      <ChartNavigation basePath={`/synastry/${report.id}`} label="Relationship chart" />
      <p className="mb-6 text-sm text-slate-400">
        Where the sky is today, compared against {report.personAName}, {report.personBName}, and your composite chart.
      </p>

      {transits ? (
        <>
          <div className="report-layout mb-8">
            <div className="flex min-w-0 flex-col items-center gap-3">
              <ChartWheel
                innerChart={transits.transitingChart}
                innerLabel="Transiting sky"
                size={420}
              />
              <p className="text-xs text-slate-400">Today's transiting planets, geocentric &amp; sign-based.</p>
            </div>

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
          </div>

          <div className="report-pair">
            <section className="report-section">
              <h3 className="mb-2 text-sm font-semibold text-aurora">To {report.personAName}</h3>
              <TransitList hits={transits.hitsToPersonA} targetLabel={`${report.personAName}'s chart`} />
            </section>
            <section className="report-section">
              <h3 className="mb-2 text-sm font-semibold text-aurora">To {report.personBName}</h3>
              <TransitList hits={transits.hitsToPersonB} targetLabel={`${report.personBName}'s chart`} />
            </section>
            <section className="report-section">
              <h3 className="mb-2 text-sm font-semibold text-aurora">To your composite chart</h3>
              <TransitList hits={transits.hitsToComposite} targetLabel="your composite chart" />
            </section>
          </div>
        </>
      ) : (
        <p role={transitsError ? "alert" : "status"} className={`text-sm ${transitsError ? "text-danger" : "text-muted"}`}>{transitsError ?? "Loading transits…"}</p>
      )}

      <AiChatDrawer
        reportEndpoint={`/ai/synastry/${report.id}`}
        chatEndpoint={`/ai/synastry/${report.id}/chat`}
        title={`AI Chat — ${report.personAName} & ${report.personBName}`}
      />
    </div>
  );
}
