import { Compass, Clock3 } from "lucide-react";
import { NavLink } from "react-router-dom";

export function ChartNavigation({ basePath, label = "Natal chart" }: { basePath: string; label?: string }) {
  return (
    <nav aria-label="Chart views" className="chart-navigation">
      <NavLink to={basePath} end className="nav-link"><Compass size={16} aria-hidden="true" />{label}</NavLink>
      <NavLink to={`${basePath}/now`} className="nav-link"><Clock3 size={16} aria-hidden="true" />Current sky</NavLink>
    </nav>
  );
}