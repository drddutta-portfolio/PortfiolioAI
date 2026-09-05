import { Navigate, Outlet, useLocation } from "react-router-dom"
import { PageLoader } from "../components/PageLoader"
import { useAuth } from "./authContext"

export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader label="Restoring your secure session" />

  if (!user) {
    const destination = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" replace state={{ from: destination }} />
  }

  return <Outlet />
}
