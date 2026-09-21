import { pharmaGateJReferenceClassification } from "./pharmaGateJReferenceClassification"
import { PHARMA_SUBPROFILE_CONTRACTS } from "./pharmaSubprofileContracts"
import { ALIVUS_G10_1_READ_ONLY_SCORE_RESULT } from "./alivusG101ReadOnlyScore"
import { ALIVUS_G10_1_READ_ONLY_RECOMMENDATION } from "./alivusG101RecommendationPreview"
import { PHARMA_GLOBAL_GENERICS_G10_2_METHOD_COMPLETION_CANDIDATE } from "./pharmaGlobalGenericsG102MethodologyCompletionCandidate"
import { PHARMA_GLOBAL_GENERICS_G10_2_NUMERIC_METHODOLOGY } from "./pharmaGlobalGenericsG102NumericMethodology"
import { AUROPHARMA_G10_2_FINAL_RESULT } from "./auropharmaG102FinalResult"
import { BIOCON_G10_3_CHECKPOINT_B_EVIDENCE } from "./bioconG103CheckpointBEvidence"
import { BIOCON_G10_3_FINAL_RESULT } from "./bioconG103FinalResult"
import { PHARMA_BIOSIMILARS_G10_3_METHODOLOGY } from "./pharmaBiosimilarsG103Methodology"
import { PHARMA_CDMO_G10_4_METHODOLOGY } from "./pharmaCdmoG104Methodology"
import { SYNGENE_G10_4_CHECKPOINT_B_EVIDENCE } from "./syngeneG104CheckpointBEvidence"
import { SYNGENE_G10_4_FINAL_RESULT } from "./syngeneG104FinalResult"

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
  const renderBioconCheckpointB = review.symbol === "BIOCON"
  const renderSyngeneCheckpointB = review.symbol === "SYNGENE"
  const globalCandidate = PHARMA_GLOBAL_GENERICS_G10_2_METHOD_COMPLETION_CANDIDATE
  const approvedGlobalMethod = PHARMA_GLOBAL_GENERICS_G10_2_NUMERIC_METHODOLOGY
  const finalAuroResult = AUROPHARMA_G10_2_FINAL_RESULT

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


    {renderBioconCheckpointB
      ? <section className="pharma-persistence-package" aria-labelledby="gate-j-biosimilars-checkpoint-b-title">
          <div className="pharma-evidence-pilot-head">
            <div>
              <p className="eyebrow">Gate J · G10.3 · Checkpoint B</p>
              <h3 id="gate-j-biosimilars-checkpoint-b-title">Biosimilars controlled-expansion result</h3>
              <p>The Biosimilars-primary methodology and bounded issuer evidence package have been applied without borrowing bands from another subprofile. Mandatory evidence gaps keep the ten-dimension score fail-closed.</p>
            </div>
            <span className="pharma-workspace-lock">Checkpoint B candidate · Fail-closed outcome</span>
          </div>

          <div className="pharma-persistence-package-summary">
            <div><span>Methodology</span><strong>Biosimilars-specific</strong><small>{PHARMA_BIOSIMILARS_G10_3_METHODOLOGY.dimensionContracts.length}/10 dimension contracts defined</small></div>
            <div><span>Material Overlays</span><strong>Global Generics · CDMO / CRAMS</strong><small>Context only · no independent score</small></div>
            <div><span>Evidence through</span><strong>{BIOCON_G10_3_CHECKPOINT_B_EVIDENCE.evidenceThrough}</strong><small>Issuer-official bounded package</small></div>
            <div><span>Current score state</span><strong>{BIOCON_G10_3_FINAL_RESULT.scoreState.replaceAll("_", " ")}</strong><small>Gate I recommendation not executed</small></div>
          </div>

          <div className="research-callout research-callout-neutral">
            <strong>Deterministic fail-closed result</strong>
            <p>No partial BIOCON score is reconstructed. Both Material Overlays remain visible, and the existence of a Biosimilars methodology does not resolve AUROPHARMA&apos;s company-specific unresolved Biosimilars exposure.</p>
          </div>

          <div className="pharma-persistence-package-grid">
            {BIOCON_G10_3_FINAL_RESULT.blockerGroups.map((blocker) => <article key={blocker.code}>
              <strong>{blocker.code.replaceAll("_", " ")}</strong>
              <small>MANDATORY BLOCKER</small>
              <p>{blocker.details.join(" ")}</p>
              <span>No substitution · no renormalization</span>
            </article>)}
          </div>

          <p className="pharma-evidence-pilot-note"><strong>Safety:</strong> Gate I policy remains unchanged and is not executed without a complete ten-dimension score. Score/recommendation persistence, sizing, AI interpretation, production mutation, deployment and PR merge remain off.</p>
        </section>
      : null}

    {renderSyngeneCheckpointB
      ? <section className="pharma-persistence-package" aria-labelledby="gate-j-cdmo-checkpoint-b-title">
          <div className="pharma-evidence-pilot-head">
            <div>
              <p className="eyebrow">Gate J · G10.4 · Checkpoint B</p>
              <h3 id="gate-j-cdmo-checkpoint-b-title">CDMO / CRAMS controlled-expansion result</h3>
              <p>The CDMO/CRAMS-primary methodology and bounded issuer evidence package have been applied without borrowing bands from another subprofile. Mandatory evidence gaps keep the ten-dimension score fail-closed.</p>
            </div>
            <span className="pharma-workspace-lock">Checkpoint B candidate · Fail-closed outcome</span>
          </div>

          <div className="pharma-persistence-package-summary">
            <div><span>Methodology</span><strong>CDMO / CRAMS-specific</strong><small>{PHARMA_CDMO_G10_4_METHODOLOGY.dimensionContracts.length}/10 dimension contracts defined</small></div>
            <div><span>Material Overlays</span><strong>None</strong><small>No independent secondary score</small></div>
            <div><span>Evidence through</span><strong>{SYNGENE_G10_4_CHECKPOINT_B_EVIDENCE.evidenceThrough}</strong><small>Issuer-official bounded package</small></div>
            <div><span>Current score state</span><strong>{SYNGENE_G10_4_FINAL_RESULT.scoreState.replaceAll("_", " ")}</strong><small>Gate I recommendation not executed</small></div>
          </div>

          <div className="research-callout research-callout-neutral">
            <strong>Deterministic fail-closed result</strong>
            <p>No partial SYNGENE score is reconstructed. Missing client-concentration, utilization and other mandatory evidence remains unavailable rather than being treated as neutral.</p>
          </div>

          <div className="pharma-persistence-package-grid">
            {SYNGENE_G10_4_FINAL_RESULT.blockerGroups.map((blocker) => <article key={blocker.code}>
              <strong>{blocker.code.replaceAll("_", " ")}</strong>
              <small>MANDATORY BLOCKER</small>
              <p>{blocker.details.join(" ")}</p>
              <span>No substitution · no renormalization</span>
            </article>)}
          </div>

          <p className="pharma-evidence-pilot-note"><strong>Safety:</strong> Gate I policy remains unchanged and is not executed without a complete ten-dimension score. Score/recommendation persistence, sizing, AI interpretation, production mutation, deployment and PR merge remain off.</p>
        </section>
      : null}

    {renderAuropharmaCheckpointB
      ? <section className="pharma-persistence-package" aria-labelledby="gate-j-global-generics-checkpoint-b-title">
          <div className="pharma-evidence-pilot-head">
            <div>
              <p className="eyebrow">Gate J · G10.2 · Checkpoint B</p>
              <h3 id="gate-j-global-generics-checkpoint-b-title">Global Generics controlled-expansion result</h3>
              <p>Checkpoint B is complete. The approved Global Generics methodology was exercised against the bounded evidence package and correctly fails closed because mandatory inputs remain incomplete. No partial score is reconstructed.</p>
            </div>
            <span className="pharma-workspace-lock">Checkpoint B complete · Fail-closed outcome</span>
          </div>

          <div className="pharma-persistence-package-summary">
            <div><span>Resolution policy</span><strong>Reference-relative median</strong><small>No fabricated absolute bands</small></div>
            <div><span>Ten-dimension spine</span><strong>Preserved</strong><small>Gate I policy unchanged</small></div>
            <div><span>Approved building blocks</span><strong>{globalCandidate.approvedBuildingBlocks.length}</strong><small>Growth · pipeline · qualitative rubric</small></div>
            <div><span>Current score state</span><strong>{finalAuroResult.scoreState.replaceAll("_", " ")}</strong><small>Gate I recommendation not executed</small></div>
          </div>

          <div className="research-callout research-callout-neutral">
            <strong>Deterministic fail-closed result</strong>
            <p>The approved contract was not weakened to force a score. Missing mandatory evidence blocks the ten-dimension result, so AUROPHARMA remains non-computable and Gate I is not run.</p>
          </div>

          <div className="pharma-persistence-package-grid">
            {finalAuroResult.blockerGroups.map((blocker) => <article key={blocker.code}>
              <strong>{blocker.code.replaceAll("_", " ")}</strong>
              <small>MANDATORY BLOCKER</small>
              <p>{blocker.details.join(" ")}</p>
              <span>No substitution · no renormalization</span>
            </article>)}
          </div>

          <p className="pharma-evidence-pilot-note"><strong>Safety:</strong> Methodology is owner-approved under {approvedGlobalMethod.version}. Final G10.2 state is {finalAuroResult.state.replaceAll("_", " ")}. API stays Emerging Watch, Biosimilars stays unresolved, no partial score is reconstructed, and all persistence/sizing/AI actions remain off.</p>
        </section>
      : null}
  </section>
}
