import { Link } from "react-router-dom"
import { P7CanonicalIntelligencePanel } from "../components/P7CanonicalIntelligencePanel"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"

export function IntelligencePage() {
  const { portfolio, isLoading, error } = usePortfolioView()
  if (isLoading) return <div className="portfolio-loading"><span className="loader" /><p>Loading canonical portfolio intelligence…</p></div>
  if (error || !portfolio) return <div className="notice notice-error" role="alert">{error ?? "Portfolio intelligence could not be loaded."}</div>
  return (
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

        <P7CanonicalIntelligencePanel portfolio={portfolio} />

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
  )
}
