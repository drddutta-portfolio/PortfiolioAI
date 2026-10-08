import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { RedirectIfAuthenticated } from "../auth/RedirectIfAuthenticated"
import { RequireAuth } from "../auth/RequireAuth"
import { AppShell } from "../components/AppShell"
import { DashboardAllocationPerformance } from "../components/DashboardAllocationPerformance"
import { DashboardDailyMovement } from "../components/DashboardDailyMovement"
import { DashboardNewsPreview } from "../components/DashboardNewsPreview"
import { DashboardScopeProvider } from "../components/DashboardScopeContext"
import { DashboardSectionNavigator } from "../components/DashboardSectionNavigator"
import "../components/DashboardTypography.css"
import "../components/DashboardD32Polish.css"
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
  const module = await import("../pages/StockResearchRoute")
  return { default: module.StockResearchRoute }
})
const ResearchCoveragePage = lazy(async () => {
  const module = await import("../pages/ResearchCoveragePage")
  return { default: module.ResearchCoveragePage }
})
const DataSourcesPage = lazy(async () => {
  const module = await import("../pages/DataSourcesPage")
  return { default: module.DataSourcesPage }
})
const OperationsPage = lazy(async () => {
  const module = await import("../pages/OperationsPage")
  return { default: module.OperationsPage }
})
const InvestmentCommitteePage = lazy(async () => {
  const module = await import("../pages/InvestmentCommitteePage")
  return { default: module.InvestmentCommitteePage }
})
const IntelligencePage = lazy(async () => {
  const module = await import("../pages/IntelligencePage")
  return { default: module.IntelligencePage }
})
const BacktestingReadinessPage = lazy(async () => {
  const module = await import("../pages/BacktestingReadinessPage")
  return { default: module.BacktestingReadinessPage }
})
const BankingReadOnlyValidationPage = lazy(async () => {
  const module = await import("../pages/BankingReadOnlyValidationPage")
  return { default: module.BankingReadOnlyValidationPage }
})
const SettingsPage = lazy(async () => {
  const module = await import("../pages/SettingsPage")
  return { default: module.SettingsPage }
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
                <div id="dashboard-daily-move" className="dashboard-section-anchor dashboard-content-block"><DashboardDailyMovement /></div>
                <div id="dashboard-performance" className="dashboard-section-anchor dashboard-content-block"><DashboardAllocationPerformance /></div>
                <div id="dashboard-news" className="dashboard-section-anchor dashboard-content-block dashboard-news-section"><DashboardNewsPreview /></div>
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
          path="/app/intelligence"
          element={<AppShell><Suspense fallback={<PageLoader label="Loading Intelligence" />}><IntelligencePage /></Suspense></AppShell>}
        />
        <Route
          path="/app/intelligence/investment-committee"
          element={<AppShell><Suspense fallback={<PageLoader label="Loading Investment Committee narrative" />}><InvestmentCommitteePage /></Suspense></AppShell>}
        />
        <Route
          path="/app/intelligence/backtesting"
          element={<AppShell><Suspense fallback={<PageLoader label="Loading backtesting readiness" />}><BacktestingReadinessPage /></Suspense></AppShell>}
        />
        <Route
          path="/app/settings"
          element={<AppShell><Suspense fallback={<PageLoader label="Loading Settings" />}><SettingsPage /></Suspense></AppShell>}
        />
        <Route
          path="/app/settings/data-sources"
          element={<AppShell><Suspense fallback={<PageLoader label="Loading Data Sources" />}><DataSourcesPage /></Suspense></AppShell>}
        />
        <Route
          path="/app/settings/diagnostics/operations"
          element={<AppShell><Suspense fallback={<PageLoader label="Loading diagnostics" />}><OperationsPage /></Suspense></AppShell>}
        />
        <Route path="/app/settings/diagnostics/banking-v1-4" element={<AppShell><Suspense fallback={<PageLoader label="Loading banking validator" />}><BankingReadOnlyValidationPage /></Suspense></AppShell>} />\n        <Route path="/app/operations" element={<Navigate to="/app/settings/diagnostics/operations" replace />} />
        <Route path="/app/investment-committee" element={<Navigate to="/app/intelligence/investment-committee" replace />} />
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
