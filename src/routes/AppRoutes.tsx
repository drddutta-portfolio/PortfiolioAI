import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { RedirectIfAuthenticated } from "../auth/RedirectIfAuthenticated"
import { RequireAuth } from "../auth/RequireAuth"
import { AppShell } from "../components/AppShell"
import { DashboardPage } from "../pages/DashboardPage"
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage"
import { LoginPage } from "../pages/LoginPage"
import { N4aNormalizationPilotPage } from "../pages/N4aNormalizationPilotPage"
import { N4bBatchNormalizationPilotPage } from "../pages/N4bBatchNormalizationPilotPage"
import { N4cLinkedDocumentPilotPage } from "../pages/N4cLinkedDocumentPilotPage"
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
              <DashboardPage />
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
        <Route
          path="/app/internal/n4a-normalization-pilot"
          element={
            <AppShell>
              <N4aNormalizationPilotPage />
            </AppShell>
          }
        />
        <Route
          path="/app/internal/n4b-batch-normalization-pilot"
          element={
            <AppShell>
              <N4bBatchNormalizationPilotPage />
            </AppShell>
          }
        />
        <Route
          path="/app/internal/n4c-linked-document-pilot"
          element={
            <AppShell>
              <N4cLinkedDocumentPilotPage />
            </AppShell>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
