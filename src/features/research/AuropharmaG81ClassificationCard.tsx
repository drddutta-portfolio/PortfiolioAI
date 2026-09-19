import {
  AUROPHARMA_G8_1_ANNUAL_BUSINESS_MIX,
  AUROPHARMA_G8_1_CLASSIFICATION_REVIEW,
  auropharmaApiRevenueSharePercent,
  auropharmaGlobalGenericsLowerBoundPercent,
} from "./auropharmaG8ClassificationEvidence"
import { PHARMA_SUBPROFILE_CONTRACTS } from "./pharmaSubprofileContracts"

function displayName(code: keyof typeof PHARMA_SUBPROFILE_CONTRACTS) {
  return PHARMA_SUBPROFILE_CONTRACTS[code].displayName
}

function percent(value: number) {
  return `${value.toFixed(1)}%`
}

export function AuropharmaG81ClassificationCard({ symbol }: { readonly symbol: string }) {
  if (symbol.toLocaleUpperCase() !== "AUROPHARMA") return null

  const [fy25, fy26] = AUROPHARMA_G8_1_ANNUAL_BUSINESS_MIX
  if (!fy25 || !fy26) return null

  const review = AUROPHARMA_G8_1_CLASSIFICATION_REVIEW
  const unresolved = review.unresolvedExposures.map(displayName).join(" · ")

  return <section className="pharma-persistence-package" aria-labelledby="auropharma-g8-1-title">
    <div className="pharma-evidence-pilot-head">
      <div>
        <p className="eyebrow">G8.1 · AUROPHARMA classification & evidence lock</p>
        <h3 id="auropharma-g8-1-title">Reviewed business-model evidence</h3>
        <p>Two consecutive annual periods were run through the unchanged G1 classification contract. This review does not create a canonical assignment or execute scoring.</p>
      </div>
      <span className="pharma-workspace-lock">Reviewed evidence · Owner UI validation pending</span>
    </div>

    <div className="pharma-persistence-package-summary">
      <div>
        <span>Primary candidate</span>
        <strong>{displayName(review.primary)}</strong>
        <small>Stable FY25 + FY26 leadership</small>
      </div>
      <div>
        <span>Material Overlay</span>
        <strong>{review.materialOverlays.length ? review.materialOverlays.map(displayName).join(" · ") : "None reviewed"}</strong>
        <small>15% economic-share rule preserved</small>
      </div>
      <div>
        <span>Emerging Watch</span>
        <strong>{review.emergingWatches.map(displayName).join(" · ")}</strong>
        <small>API remains below 15% in both periods</small>
      </div>
      <div>
        <span>Unresolved</span>
        <strong>{unresolved || "None"}</strong>
        <small>No economic share → fail closed</small>
      </div>
    </div>

    <div className="pharma-persistence-package-grid">
      <article>
        <strong>Two-period economic mix</strong>
        <small>Conservative role-determining revenue shares</small>
        <p>FY25: Global Generics lower bound {percent(auropharmaGlobalGenericsLowerBoundPercent(fy25))} · API {percent(auropharmaApiRevenueSharePercent(fy25))}. FY26: Global Generics lower bound {percent(auropharmaGlobalGenericsLowerBoundPercent(fy26))} · API {percent(auropharmaApiRevenueSharePercent(fy26))}.</p>
        <span>Global Generics = US + Europe only; Growth Markets / ARV not assumed</span>
      </article>
      <article>
        <strong>Comparability / distortion lock</strong>
        <small>Consolidated denominator · transfers · acquisitions · profit disclosure</small>
        <p>The API transfer to wholly owned Apitoria does not break consolidated comparability. Khandelwal does not enter the US+Europe/API numerators, and Lannett had no FY26 financial impact. Business-level profit shares remain undisclosed.</p>
        <span>Evidence through 31 Mar 2026 · proposed effective date 31 Mar 2026</span>
      </article>
    </div>

    <p className="pharma-evidence-pilot-note"><strong>Boundary:</strong> no research-evidence row, subprofile assignment, score, recommendation or position-sizing state is persisted by G8.1. Biosimilars stays REVIEW_REQUIRED until comparable economic-share evidence exists.</p>
  </section>
}
