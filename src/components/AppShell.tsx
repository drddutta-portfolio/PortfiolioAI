import { useState, type PropsWithChildren } from "react"
import { NavLink } from "react-router-dom"
import { useAuth } from "../auth/authContext"
import { getAuthErrorMessage } from "../lib/authError"
import { getEnvironmentIdentity } from "../lib/environment"

export function AppShell({ children }: PropsWithChildren) {
  const { user, signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const environmentIdentity = getEnvironmentIdentity(window.location.hostname)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    setError(null)

    try {
      await signOut()
    } catch (signOutError) {
      setError(getAuthErrorMessage(signOutError))
      setIsSigningOut(false)
    }
  }

  return (
    <div className="app-shell">
      <header id="app-top" className="app-header">
        <NavLink className="app-brand" to="/app" end aria-label="PortfolioAI home">
          <span className="app-brand-mark" aria-hidden="true">P</span>
          <span>PortfolioAI</span>
          {environmentIdentity ? (
            <span className="environment-badge" aria-label={`Environment: ${environmentIdentity}`}>
              {environmentIdentity}
            </span>
          ) : null}
        </NavLink>
        <nav className="app-navigation" aria-label="Primary navigation">
          <NavLink to="/app" end>Dashboard</NavLink>
          <NavLink to="/app/holdings">Holdings</NavLink>
          <NavLink to="/app/structure">Portfolio Structure</NavLink>
          <NavLink to="/app/research">Research</NavLink>
          <NavLink to="/app/intelligence">Intelligence</NavLink>
          <NavLink to="/app/transactions">Transactions</NavLink>
          <NavLink to="/app/settings">Settings</NavLink>
        </nav>
        <div className="account-menu">
          <span className="account-email">{user?.email}</span>
          <button
            className="button button-secondary button-compact"
            type="button"
            onClick={() => void handleSignOut()}
            disabled={isSigningOut}
          >
            {isSigningOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </header>
      {error ? <div className="shell-error" role="alert">{error}</div> : null}
      <main className="app-content">{children}</main>
    </div>
  )
}
