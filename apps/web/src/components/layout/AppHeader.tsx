import { Link, useLocation } from "react-router-dom";
import { getLastChart } from "../../lib/lastChart.js";

/** Persistent header shown on every page — always provides a way back home. */
export function AppHeader() {
  const location = useLocation();
  const lastChart = getLastChart();
  const showBackToChart = lastChart && lastChart.path !== location.pathname;

  return (
    <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
      <Link to="/" className="text-2xl font-bold text-stardust hover:text-aurora">
        Astra Synastry
      </Link>
      <div className="flex items-center gap-3 text-sm text-slate-300">
        {showBackToChart && (
          <Link to={lastChart.path} className="rounded border border-slate-600 px-3 py-1 hover:bg-slate-800">
            View chart
          </Link>
        )}
        <Link to="/" className="rounded border border-slate-600 px-3 py-1 hover:bg-slate-800">
          Dashboard
        </Link>
        <Link to="/wiki" className="rounded border border-slate-600 px-3 py-1 hover:bg-slate-800">
          Wiki
        </Link>
      </div>
    </header>
  );
}
