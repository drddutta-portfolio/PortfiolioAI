import { Link } from "react-router-dom"

export function NotFoundPage() {
  return (
    <main className="centered-page">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p className="muted">The page you requested does not exist.</p>
      <Link className="button button-primary link-button" to="/app">Return to PortfolioAI</Link>
    </main>
  )
}
