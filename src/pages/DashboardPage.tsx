import { Link } from "react-router-dom"

export function DashboardPage() {
  return (
    <section className="dashboard-placeholder">
      <p className="eyebrow">Secure workspace</p>
      <h1>Authentication is ready.</h1>
      <p>
        This protected page confirms that your PortfolioAI session is active.
        Portfolio data and dashboard features will be added in later, separately
        reviewed phases.
      </p>
      <div className="status-card">
        <span className="status-dot" aria-hidden="true" />
        <div>
          <strong>Private session active</strong>
          <p>Database access remains governed by Supabase Row Level Security.</p>
        </div>
      </div>
      <Link className="button button-primary link-button dashboard-action" to="/app/import">
        Open Data Import Centre
      </Link>
    </section>
  )
}
