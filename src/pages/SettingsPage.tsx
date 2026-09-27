import { Link } from "react-router-dom"
import { getEnvironmentIdentity } from "../lib/environment"

export function SettingsPage() {
  const environment = getEnvironmentIdentity(window.location.hostname) ?? "Unknown"

  return (
    <section className="portfolio-page settings-page">
      <div className="portfolio-hero compact-hero">
        <div>
          <p className="eyebrow">Administration &amp; controls</p>
          <h1>Settings</h1>
          <p>
            Data-source controls, refresh planning, operational diagnostics and environment state.
            Investment decisions and owner portfolio settings remain separate.
          </p>
        </div>
        <span className="environment-badge">Environment: {environment}</span>
      </div>

      <div className="settings-hub-grid">
        <article className="panel">
          <p className="eyebrow">Data sources</p>
          <h2>Providers &amp; refresh planning</h2>
          <p>Review provider status, quotas, safety budgets and owner-confirmed refresh plans.</p>
          <Link className="button button-secondary" to="/app/settings/data-sources">Open data sources</Link>
        </article>

        <article className="panel">
          <p className="eyebrow">Operations</p>
          <h2>Diagnostics &amp; run history</h2>
          <p>Inspect local orchestration safety, dry-run history and fail-closed diagnostics.</p>
          <Link className="button button-secondary" to="/app/settings/diagnostics/operations">Open diagnostics</Link>
        </article>

        <article className="panel">
          <p className="eyebrow">Environment</p>
          <h2>{environment}</h2>
          <p>
            This surface reports the currently loaded app environment. Production operations remain
            separately governed and are not implied by Development access.
          </p>
        </article>

        <article className="panel">
          <p className="eyebrow">Decision authority</p>
          <h2>Owner settings stay separate</h2>
          <p>
            Portfolio roles, targets and other owner decisions are managed from Portfolio Structure
            and individual Research pages, not from engine recommendations.
          </p>
          <Link className="button button-secondary" to="/app/structure">Portfolio Structure</Link>
        </article>
      </div>
    </section>
  )
}
