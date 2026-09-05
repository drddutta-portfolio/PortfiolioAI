import { Navigate, Route, Routes } from "react-router-dom"
import { RedirectIfAuthenticated } from "../auth/RedirectIfAuthenticated"
import { RequireAuth } from "../auth/RequireAuth"
import { AppShell } from "../components/AppShell"
import { DashboardPage } from "../pages/DashboardPage"
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage"
import { LoginPage } from "../pages/LoginPage"
import { NotFoundPage } from "../pages/NotFoundPage"
import { UpdatePasswordPage } from "../pages/UpdatePasswordPage"

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
          path="/app"
          element={
            <AppShell>
              <DashboardPage />
            </AppShell>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
