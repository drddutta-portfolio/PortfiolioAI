import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { RedirectIfAuthenticated } from "../auth/RedirectIfAuthenticated"
import { RequireAuth } from "../auth/RequireAuth"
import { AppShell } from "../components/AppShell"
import { DashboardAllocationPerformance } from "../components/DashboardAllocationPerformance"
import { DashboardCollapsibleSection } from "../components/DashboardCollapsibleSection"
import { DashboardDecisionLayer } from "../components/DashboardDecisionLayer"
import { DashboardMonitoringReadiness } from "../components/DashboardMonitoringReadiness"
import { DashboardNewsPreview } from "../components/DashboardNewsPreview"
import { DashboardPortfolioIntelligence } from "../components/DashboardPortfolioIntelligence"
import { DashboardResearchIntelligence } from "../components/DashboardResearchIntelligence"
import { DashboardRiskConcentration } from "../components/DashboardRiskConcentration"
import { DashboardScopeProvider } from "../components/DashboardScopeContext"
import { DashboardSectionNavigator } from "../components/DashboardSectionNavigator"
import "../components/DashboardTypography.css"
import { DashboardPage } from "../pages/DashboardPage"
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage"
import { LoginPage } from "../pages/LoginPage"
import { NotFoundPage } from "../pages/NotFoundPage"
import { UpdatePasswordPage } from "../pages/UpdatePasswordPage"
import { PageLoader } from "../components/PageLoader"

const ImportPage = lazy(async () => {
  const module = await import("../pages/ImportPage")
  return { default: module.ImportPage }
})
const HoldingsPage = lazy(async () => {
  const module = await import("../pages/HoldingsPage")
  return { default: module.HoldingsPage }
})
const PortfolioStructurePage = lazy(async () => {
  const module = await import("../pages/PortfolioStructurePage")
  return { default: module.PortfolioStructurePage }
})
const TransactionsPage = lazy(async () => {
  const module = await import("../pages/TransactionsPage")
  return { default: module.TransactionsPage }
})
const ResearchPage = lazy(async () => {
  const module = await import("../pages/ResearchPage")
  return { default: module.ResearchPage }
})
const ResearchCoveragePage = lazy(async () => {
  const module = await import("../pages/ResearchCoveragePage")
  return { default: module.ResearchCoveragePage }
})
const DataSourcesPage = lazy(async () => {
  const module = await import("../pages/DataSourcesPage")
  return { default: module.DataSourcesPage }
})

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<RedirectIfAuthenticated />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/update-password" element={<UpdatePasswordPage />} />

      <Route element={<RequireAuth />}>
        <Route
          path="/app/transactions"
          element={
            <AppShell>
              <Suspense fallback={<PageLoader label="Loading transactions" />}>
                <TransactionsPage />
              </Suspense>
            </AppShell>
          }
        />
        <Route
          path="/app"
          element={
            <AppShell>
              <DashboardScopeProvider>
                <DashboardSectionNavigator />
                <div id="dashboard-overview" className="dashboard-section-anchor"><DashboardPage /></div>
                <div id="dashboard-performance" className="dashboard-section-anchor"><DashboardAllocationPerformance /></div>
                <div id="dashboard-structure" className="dashboard-section-anchor"><DashboardDecisionLayer /></div>
                <div id="dashboard-risk" className="dashboard-section-anchor"><DashboardCollapsibleSection storageKey="risk" label="Portfolio Risk & Concentration" anchorId="dashboard-risk" defaultOpen><DashboardRiskConcentration /></DashboardCollapsibleSection></div>
                <div id="dashboard-monitoring" className="dashboard-section-anchor"><DashboardCollapsibleSection storageKey="monitoring" label="Monitoring & Configuration Coverage" anchorId="dashboard-monitoring"><DashboardMonitoringReadiness /></DashboardCollapsibleSection></div>
                <div id="dashboard-research" className="dashboard-section-anchor"><DashboardCollapsibleSection storageKey="research" label="Research & Intelligence Status" anchorId="dashboard-research"><DashboardResearchIntelligence /></DashboardCollapsibleSection></div>
                <div id="dashboard-intelligence" className="dashboard-section-anchor"><DashboardCollapsibleSection storageKey="intelligence" label="Portfolio Intelligence Snapshot" anchorId="dashboard-intelligence"><DashboardPortfolioIntelligence /></DashboardCollapsibleSection></div>
                <div id="dashboard-news" className="dashboard-section-anchor"><DashboardNewsPreview /></div>
              </DashboardScopeProvider>
            </AppShell>
          }
        />
        <Route
          path="/app/holdings"
          element={
            <AppShell>
              <Suspense fallback={<PageLoader label="Loading holdings" />}>
                <HoldingsPage />
              </Suspense>
            </AppShell>
          }
        />
        <Route
          path="/app/structure"
          element={
            <AppShell>
              <Suspense fallback={<PageLoader label="Loading portfolio structure" />}>
                <PortfolioStructurePage />
              </Suspense>
            </AppShell>
          }
        />
        <Route
          path="/app/research"
          element={<AppShell><Suspense fallback={<PageLoader label="Loading Research Coverage" />}><ResearchCoveragePage /></Suspense></AppShell>}
        />
        <Route
          path="/app/research/:security"
          element={<AppShell><Suspense fallback={<PageLoader label="Loading security research" />}><ResearchPage /></Suspense></AppShell>}
        />
        <Route
          path="/app/settings/data-sources"
          element={<AppShell><Suspense fallback={<PageLoader label="Loading Data Sources" />}><DataSourcesPage /></Suspense></AppShell>}
        />
        <Route
          path="/app/import"
          element={
            <AppShell>
              <Suspense fallback={<PageLoader label="Loading the Import Centre" />}>
                <ImportPage />
              </Suspense>
            </AppShell>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
