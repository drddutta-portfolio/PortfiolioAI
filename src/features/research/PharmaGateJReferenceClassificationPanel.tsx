import { pharmaGateJReferenceClassification } from "./pharmaGateJReferenceClassification"
import { PHARMA_SUBPROFILE_CONTRACTS } from "./pharmaSubprofileContracts"
import { ALIVUS_G10_1_READ_ONLY_SCORE_RESULT } from "./alivusG101ReadOnlyScore"
import { ALIVUS_G10_1_READ_ONLY_RECOMMENDATION } from "./alivusG101RecommendationPreview"

function displayName(code: keyof typeof PHARMA_SUBPROFILE_CONTRACTS) {
  return PHARMA_SUBPROFILE_CONTRACTS[code].displayName
}

function shortDate(value: string) {
  const [year] = value.split("-")
  return `FY${year?.slice(2)}`
}

export function PharmaGateJReferenceClassificationPanel({ symbol }: { readonly symbol: string }) {
  const review = pharmaGateJReferenceClassification(symbol)
  if (!review) return null

  return <section className="pharma-persistence-package" aria-labelledby="gate-j-reference-classification-title">
    <div className="pharma-evidence-pilot-head">
      <div>
        <p className="eyebrow">Gate J · {review.stage} · Checkpoint {review.checkpoint}</p>
        <h3 id="gate-j-reference-classification-title">Reference-company classification lock</h3>
        <p>Classification evidence is frozen before methodology or scoring work begins. Owner approval of this localhost review is required before Checkpoint B can start.</p>
      </div>
      <span className="pharma-workspace-lock">Ready for owner lock · Score not started</span>
    </div>

    <div className="pharma-persistence-package-summary">
      <div>
        <span>Reference company</span>
        <strong>{review.companyName}</strong>
        <small>{review.symbol}</small>
      </div>
      <div>
        <span>Primary candidate</span>
        <strong>{displayName(review.primary)}</strong>
        <small>Stable two-period leadership</small>
      </div>
      <div>
        <span>Material Overlay</span>
        <strong>{review.materialOverlays.length ? review.materialOverlays.map(displayName).join(" · ") : "None reviewed"}</strong>
        <small>15% sustained-share rule preserved</small>
      </div>
      <div>
        <span>Emerging Watch</span>
        <strong>{review.emergingWatches.length ? review.emergingWatches.map(displayName).join(" · ") : "None"}</strong>
        <small>Context only · no independent role</small>
      </div>
    </div>

    <div className="pharma-persistence-package-grid">
      <article>
        <strong>Two-period operating-model mix</strong>
        <small>Issuer-disclosed Generic API versus CDMO</small>
        <p>{review.annualMix.map((row) => `${shortDate(row.periodEnd)}: API ${row.primarySharePercent}% · CDMO ${row.cdmoSharePercent}%`).join(" · ")}</p>
        <span>Evidence through {review.evidenceThrough} · proposed effective date {review.proposedEffectiveDate}</span>
      </article>
      <article>
        <strong>Reference selection</strong>
        <small>Low-ambiguity API portability candidate</small>
        <p>{review.selectionReason}</p>
        <span>Classification lock precedes any score visibility</span>
      </article>
    </div>

    <div className="pharma-persistence-package-grid">
      {review.distortionChecks.map((check) => <article key={check.code}>
        <strong>{check.code.replaceAll("_", " ")}</strong>
        <small>{check.state.replaceAll("_", " ")}</small>
        <p>{check.note}</p>
      </article>)}
    </div>

    <p className="pharma-evidence-pilot-note"><strong>Boundary:</strong> Checkpoint A writes no research evidence, assignment, score or recommendation. Checkpoint B remains blocked until the owner approves this classification lock.</p>

    <section className="pharma-persistence-package" aria-labelledby="gate-j-api-checkpoint-b-title">
      <div className="pharma-evidence-pilot-head">
        <div>
          <p className="eyebrow">Gate J · G10.1 · Checkpoint B</p>
          <h3 id="gate-j-api-checkpoint-b-title">API methodology → score → Gate I recommendation</h3>
          <p>The locked API classification now runs through one PHARMA_V1 ten-dimension score and the unchanged Gate I recommendation policy. This is a read-only candidate for owner review.</p>
        </div>
        <span className="pharma-workspace-lock">Read-only candidate · Persistence off</span>
      </div>
      <div className="pharma-persistence-package-summary">
        <div><span>Deterministic score</span><strong>{ALIVUS_G10_1_READ_ONLY_SCORE_RESULT.overallScore.toFixed(4)}</strong><small>10/10 dimensions · no renormalization</small></div>
        <div><span>Gate I role</span><strong>{ALIVUS_G10_1_READ_ONLY_RECOMMENDATION.suggestedRole.replaceAll("_", " ")}</strong><small>Unchanged Gate I thresholds/floors</small></div>
        <div><span>Valuation</span><strong>{ALIVUS_G10_1_READ_ONLY_SCORE_RESULT.dimensions.find((item) => item.dimensionCode === "VALUATION")?.finalScore.toFixed(0)}</strong><small>Below neutral anchor · caution only</small></div>
        <div><span>Momentum</span><strong>{ALIVUS_G10_1_READ_ONLY_SCORE_RESULT.dimensions.find((item) => item.dimensionCode === "MOMENTUM")?.finalScore.toFixed(0)}</strong><small>Does not neutralize valuation caution</small></div>
      </div>
      <div className="pharma-persistence-package-grid">
        {ALIVUS_G10_1_READ_ONLY_SCORE_RESULT.dimensions.map((dimension) => <article key={dimension.dimensionCode}>
          <strong>{dimension.dimensionCode.replaceAll("_", " ")}</strong>
          <small>Score-ready · 100% reference evidence coverage</small>
          <p>{dimension.finalScore.toFixed(2)}</p>
          <span>API/Bulk methodology candidate</span>
        </article>)}
      </div>
      <p className="pharma-evidence-pilot-note"><strong>Safety:</strong> CDMO remains Emerging Watch and numerically excluded. Score/recommendation persistence, weight guidance, action bias, position sizing and AI interpretation remain off.</p>
    </section>


  </section>
}
