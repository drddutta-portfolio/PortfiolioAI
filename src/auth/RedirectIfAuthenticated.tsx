import { Navigate, Outlet } from "react-router-dom"
import { PageLoader } from "../components/PageLoader"
import { useAuth } from "./authContext"

export function RedirectIfAuthenticated() {
  const { user, loading } = useAuth()

  if (loading) return <PageLoader label="Checking your session" />
  if (user) return <Navigate to="/app" replace />

  return <Outlet />
}
