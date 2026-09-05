import { useState, type PropsWithChildren } from "react"
import { useAuth } from "../auth/authContext"
import { getAuthErrorMessage } from "../lib/authError"

export function AppShell({ children }: PropsWithChildren) {
  const { user, signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      <header className="app-header">
        <a className="app-brand" href="/app" aria-label="PortfolioAI home">
          <span className="app-brand-mark" aria-hidden="true">P</span>
          <span>PortfolioAI</span>
        </a>
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
