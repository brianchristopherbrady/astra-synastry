import type { ReactElement } from "react";
import { Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage.js";
import SynastryReportPage from "./pages/SynastryReportPage.js";
import SynastryNowPage from "./pages/SynastryNowPage.js";
import NatalChartPage from "./pages/NatalChartPage.js";
import NatalNowPage from "./pages/NatalNowPage.js";
import WikiPage from "./pages/WikiPage.js";

export default function App(): ReactElement {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/synastry/:id" element={<SynastryReportPage />} />
      <Route path="/synastry/:id/now" element={<SynastryNowPage />} />
      <Route path="/chart/:personId" element={<NatalChartPage />} />
      <Route path="/chart/:personId/now" element={<NatalNowPage />} />
      <Route path="/wiki" element={<WikiPage />} />
    </Routes>
  );
}
