import { companyLogoPublicUrl } from "../../data/companyProfileRepository"
import { useCompanyProfile } from "./useCompanyProfile"
import "./CompanyAboutPanel.css"

export function CompanyAboutPanel({ portfolioId, securityId, symbol, companyName }: {
  readonly portfolioId: string
  readonly securityId: string
  readonly symbol: string
  readonly companyName: string
}) {
  const profile = useCompanyProfile(portfolioId, securityId)
  const logoUrl = companyLogoPublicUrl(profile.data?.logoStoragePath ?? null)
  const initial = (symbol.trim()[0] ?? companyName.trim()[0] ?? "?").toLocaleUpperCase()

  return <section className="company-about-panel" aria-labelledby="company-about-title">
    <header className="company-about-header">
      <div className="company-about-heading">
        <div className="company-logo-shell" aria-hidden="true">
          {logoUrl ? <img src={logoUrl} alt="" loading="lazy" /> : <span>{initial}</span>}
        </div>
        <div>
          <p className="eyebrow" id="company-about-title">About the company</p>
          <strong>{companyName}</strong>
        </div>
      </div>
      <span className="about-source">{profile.data?.aboutSummary ? "Cached company profile" : "Profile not cached"}</span>
    </header>

    <div className="company-about-scroll" tabIndex={0}>
      {profile.isLoading ? <p className="company-about-muted">Loading cached company profile…</p> : profile.data?.aboutSummary ? <p>{profile.data.aboutSummary}</p> : <p className="company-about-muted">No cached company description is available yet. Fetch it once to store a normalized About summary and, when available, the company logo.</p>}
    </div>

    <footer className="company-about-actions">
      {profile.data?.companyWebsiteUrl ? <a href={profile.data.companyWebsiteUrl} target="_blank" rel="noreferrer">Official website ↗</a> : <span />}
      {!profile.isLoading && !profile.data?.aboutSummary ? <button type="button" className="button button-secondary company-profile-fetch" onClick={() => void profile.discover()} disabled={profile.isDiscovering}>{profile.isDiscovering ? "Fetching…" : "Fetch company profile once"}</button> : null}
      {profile.error ? <small role="alert" className="company-about-error">{profile.error}</small> : null}
    </footer>
  </section>
}
