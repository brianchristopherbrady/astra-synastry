import { Link, NavLink, useLocation } from "react-router-dom";
import { BookOpen, Orbit, Users, Compass } from "lucide-react";
import { getLastChart } from "../../lib/lastChart.js";

/** Persistent header shown on every page — always provides a way back home. */
export function AppHeader() {
  const location = useLocation();
  const lastChart = getLastChart();
  const showBackToChart = lastChart && lastChart.path !== location.pathname;

  return (
    <header className="app-header">
      <Link to="/" className="app-brand">
        <Orbit aria-hidden="true" className="brand-mark" strokeWidth={1.25} />
        <span>Astra <span className="brand-subtitle">Synastry</span></span>
      </Link>
      <nav aria-label="Primary" className="app-nav">
        <NavLink to="/" end className="nav-link">
          <Users size={17} aria-hidden="true" /> Dashboard
        </NavLink>
        {showBackToChart && (
          <Link to={lastChart.path} className="nav-link">
            <Compass size={17} aria-hidden="true" /> View chart
          </Link>
        )}
        <NavLink to="/wiki" className="nav-link">
          <BookOpen size={17} aria-hidden="true" /> Wiki
        </NavLink>
      </nav>
    </header>
  );
}
