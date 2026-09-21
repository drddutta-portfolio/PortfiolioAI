import { pharmaGateJReferenceClassification } from "./pharmaGateJReferenceClassification"
import { PHARMA_SUBPROFILE_CONTRACTS } from "./pharmaSubprofileContracts"
import { ALIVUS_G10_1_READ_ONLY_SCORE_RESULT } from "./alivusG101ReadOnlyScore"
import { ALIVUS_G10_1_READ_ONLY_RECOMMENDATION } from "./alivusG101RecommendationPreview"
import { PHARMA_GLOBAL_GENERICS_G10_2_METHOD_COMPLETION_CANDIDATE } from "./pharmaGlobalGenericsG102MethodologyCompletionCandidate"\nimport { PHARMA_GLOBAL_GENERICS_G10_2_NUMERIC_METHODOLOGY } from "./pharmaGlobalGenericsG102NumericMethodology"

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

  const isReconfirmation = review.lockMode === "RECONFIRM_EXISTING_LOCK"
  const renderAlivusCheckpointB = review.symbol === "ALIVUS"
  const renderAuropharmaCheckpointB = review.symbol === "AUROPHARMA"
  const globalCandidate = PHARMA_GLOBAL_GENERICS_G10_2_METHOD_COMPLETION_CANDIDATE\n  const approvedGlobalMethod = PHARMA_GLOBAL_GENERICS_G10_2_NUMERIC_METHODOLOGY

  return <section className="pharma-persistence-package" aria-labelledby="gate-j-reference-classification-title">
    <div className="pharma-evidence-pilot-head">
      <div>
        <p className="eyebrow">Gate J · {review.stage} · Checkpoint {review.checkpoint}</p>
        <h3 id="gate-j-reference-classification-title">
          {isReconfirmation ? "Reference-company classification re-confirmation" : "Reference-company classification lock"}
        </h3>
        <p>
          {isReconfirmation
            ? "The existing reviewed classification is checked again before Global Generics methodology work starts. It is not rebuilt from scratch and cannot be altered because of a later score."
            : "Classification evidence is frozen before methodology or scoring work begins. Owner approval of this localhost review is required before Checkpoint B can start."}
        </p>
      </div>
      <span className="pharma-workspace-lock">
        {isReconfirmation ? "Ready for owner re-confirmation" : "Ready for owner lock"} · {review.scoreStateLabel}
      </span>
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
        <small>{isReconfirmation ? "Existing reviewed primary" : "Stable two-period leadership"}</small>
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

    {review.unresolvedExposures.length
      ? <div className="research-callout research-callout-neutral">
          <strong>Unresolved exposure remains unresolved</strong>
          <p>{review.unresolvedExposures.map(displayName).join(" · ")} remains REVIEW_REQUIRED and is not silently back-filled by Gate J methodology availability.</p>
        </div>
      : null}

    <div className="pharma-persistence-package-grid">
      <article>
        <strong>Two-period operating-model mix</strong>
        <small>{review.operatingMixLabel}</small>
        <p>{review.operatingMixRows.map((row) => `${shortDate(row.periodEnd)}: ${row.summary}`).join(" · ")}</p>
        <span>Evidence through {review.evidenceThrough} · effective date {review.proposedEffectiveDate}</span>
      </article>
      <article>
        <strong>{isReconfirmation ? "Reference re-confirmation" : "Reference selection"}</strong>
        <small>{review.selectionLabel}</small>
        <p>{review.selectionReason}</p>
        <span>{isReconfirmation ? "Existing classification remains locked before score visibility" : "Classification lock precedes any score visibility"}</span>
      </article>
    </div>

    <div className="pharma-persistence-package-grid">
      {review.distortionChecks.map((check) => <article key={check.code}>
        <strong>{check.code.replaceAll("_", " ")}</strong>
        <small>{check.state.replaceAll("_", " ")}</small>
        <p>{check.note}</p>
      </article>)}
    </div>

    <p className="pharma-evidence-pilot-note"><strong>Boundary:</strong> {review.boundaryNote}</p>

    {renderAlivusCheckpointB
      ? <section className="pharma-persistence-package" aria-labelledby="gate-j-api-checkpoint-b-title">
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
      : null}

    {renderAuropharmaCheckpointB
      ? <section className="pharma-persistence-package" aria-labelledby="gate-j-global-generics-checkpoint-b-title">
          <div className="pharma-evidence-pilot-head">
            <div>
              <p className="eyebrow">Gate J · G10.2 · Checkpoint B</p>
              <h3 id="gate-j-global-generics-checkpoint-b-title">Global Generics methodology completion candidate</h3>
              <p>Checkpoint B consolidates the old Global Generics G6 fail-closed families into one explicit owner-review decision. No Domestic, API or BANK/NBFC scoring bands are borrowed.</p>
            </div>
            <span className="pharma-workspace-lock">Methodology approved · Evidence/score build next</span>
          </div>

          <div className="pharma-persistence-package-summary">
            <div><span>Resolution policy</span><strong>Reference-relative median</strong><small>No fabricated absolute bands</small></div>
            <div><span>Ten-dimension spine</span><strong>Preserved</strong><small>Gate I policy unchanged</small></div>
            <div><span>Approved building blocks</span><strong>{globalCandidate.approvedBuildingBlocks.length}</strong><small>Growth · pipeline · qualitative rubric</small></div>
            <div><span>Current score state</span><strong>{globalCandidate.scoreState.replaceAll("_", " ")}</strong><small>Evidence package incomplete · no partial score</small></div>
          </div>

          <div className="research-callout research-callout-neutral">
            <strong>Single methodology decision — not a new gate</strong>
            <p>The owner-approved Global Generics contract now uses reviewed same-primary peer-relative percentiles where Global-specific calibration was previously absent. Required components aggregate by median, and any missing mandatory component fails closed instead of being renormalized away.</p>
          </div>

          <div className="pharma-persistence-package-grid">
            {globalCandidate.dimensionDecisions.map((decision) => <article key={decision.dimension}>
              <strong>{decision.dimension.replaceAll("_", " ")}</strong>
              <small>OWNER APPROVED METHOD</small>
              <p>{decision.proposedMethod}</p>
              <span>{decision.evidenceBoundary}</span>
            </article>)}
          </div>

          <p className="pharma-evidence-pilot-note"><strong>Safety:</strong> Methodology is owner-approved under {approvedGlobalMethod.version}. AUROPHARMA remains non-computable until the bounded reference evidence package is complete. API stays Emerging Watch, Biosimilars stays unresolved, no partial score is reconstructed, and all persistence/sizing/AI actions remain off.</p>
        </section>
      : null}
  </section>
}
