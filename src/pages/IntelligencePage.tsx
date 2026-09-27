import { Link } from "react-router-dom"
import { DashboardCoreExitRisk } from "../components/DashboardCoreExitRisk"
import { DashboardDecisionLayer } from "../components/DashboardDecisionLayer"
import { DashboardMeaningfulChanges } from "../components/DashboardMeaningfulChanges"
import { DashboardRiskConcentration } from "../components/DashboardRiskConcentration"
import { DashboardScopeProvider } from "../components/DashboardScopeContext"

export function IntelligencePage() {
  return (
    <DashboardScopeProvider>
      <section className="portfolio-page intelligence-page">
        <div className="portfolio-hero compact-hero">
          <div>
            <p className="eyebrow">Portfolio intelligence</p>
            <h1>Intelligence</h1>
            <p>
              One read-only decision workspace for portfolio health, fit, risk, meaningful change
              and what currently requires attention. Missing prerequisites stay explicit.
            </p>
          </div>
          <Link className="button button-secondary" to="/app/research">Review evidence</Link>
        </div>

        <nav className="intelligence-jump-nav" aria-label="Intelligence sections">
          <a href="#intelligence-action">Action Center</a>
          <a href="#intelligence-health">Core Health &amp; Exit</a>
          <a href="#intelligence-risk">Portfolio Fit &amp; Risk</a>
          <a href="#intelligence-change">Meaningful Change</a>
          <a href="#intelligence-narrative">Investment Committee</a>
        </nav>

        <div id="intelligence-action" className="dashboard-section-anchor">
          <DashboardDecisionLayer />
        </div>

        <div id="intelligence-health" className="dashboard-section-anchor">
          <DashboardCoreExitRisk />
        </div>

        <div id="intelligence-risk" className="dashboard-section-anchor">
          <DashboardRiskConcentration />
        </div>

        <div id="intelligence-change" className="dashboard-section-anchor">
          <DashboardMeaningfulChanges />
        </div>

        <section id="intelligence-narrative" className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Optional interpretation</p>
              <h2>Investment Committee narrative</h2>
              <p>
                A non-authoritative explanation layer can summarize deterministic facts.
                It cannot change scores, recommendations, owner settings, sizing or trades.
              </p>
            </div>
            <Link className="button button-secondary" to="/app/intelligence/investment-committee">
              Open narrative workspace
            </Link>
          </div>
          <p className="assessment-note">
            The current narrative workspace is local/mock only. External AI remains disabled.
          </p>
        </section>
      </section>
    </DashboardScopeProvider>
  )
}
