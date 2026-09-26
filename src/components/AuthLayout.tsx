import type { PropsWithChildren, ReactNode } from "react"
import { getEnvironmentIdentity } from "../lib/environment"

interface AuthLayoutProps extends PropsWithChildren {
  readonly eyebrow: string
  readonly title: string
  readonly description: string
  readonly footer?: ReactNode
}

export function AuthLayout({
  eyebrow,
  title,
  description,
  footer,
  children,
}: AuthLayoutProps) {
  const environmentIdentity = getEnvironmentIdentity(window.location.hostname)

  return (
    <main className="auth-page">
      <section className="brand-panel" aria-label="PortfolioAI introduction">
        <div className="brand-mark" aria-hidden="true">P</div>
        <div>
          <p className="brand-name">PortfolioAI</p>
          {environmentIdentity ? (
            <p className="environment-badge environment-badge-auth" aria-label={`Environment: ${environmentIdentity}`}>
              {environmentIdentity}
            </p>
          ) : null}
          <h1>Clarity for every portfolio decision.</h1>
          <p>
            A private, evidence-led investment workspace where accounting stays
            deterministic and your data remains yours.
          </p>
        </div>
        <p className="brand-footnote">Built for deliberate, auditable investing.</p>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="auth-description">{description}</p>
          {children}
          {footer ? <div className="auth-footer">{footer}</div> : null}
        </div>
      </section>
    </main>
  )
}
