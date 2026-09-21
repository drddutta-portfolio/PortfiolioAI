import {
  buildPharmaGateJFinalPortabilityStatus,
} from "./pharmaGateJFinalPortability"
import { PHARMA_SUBPROFILE_CONTRACTS } from "./pharmaSubprofileContracts"
import type { PharmaSubprofileResolution } from "./pharmaSubprofileAssignment"

function displayName(code: keyof typeof PHARMA_SUBPROFILE_CONTRACTS) {
  return PHARMA_SUBPROFILE_CONTRACTS[code].displayName
}

export function PharmaGateJPortabilityPanel({
  assignmentResolution,
}: {
  readonly assignmentResolution: PharmaSubprofileResolution | null
}) {
  const evaluationDate = new Date().toISOString().slice(0, 10)
  const status = buildPharmaGateJFinalPortabilityStatus(
    assignmentResolution,
    evaluationDate,
  )

  if (status.state === "BLOCKED_SUBPROFILE_REVIEW") {
    return <section className="pharma-persistence-package" aria-labelledby="gate-j-portability-title">
      <div className="pharma-evidence-pilot-head">
        <div>
          <p className="eyebrow">Gate J · G10-FINAL · Runtime portability</p>
          <h3 id="gate-j-portability-title">Pharma methodology routing</h3>
          <p>PHARMA_V1 is available, but methodology routing remains blocked until one active reviewed Pharma subprofile assignment is resolved.</p>
        </div>
        <span className="pharma-workspace-lock">Subprofile review required</span>
      </div>
      <div className="research-callout research-callout-neutral">
        <strong>No methodology guessed</strong>
        <p>A new Pharma stock without a reviewed subprofile remains fail-closed: no score, no Gate I recommendation and no persistence.</p>
      </div>
    </section>
  }

  const authority = status.methodologyAuthority

  return <section className="pharma-persistence-package" aria-labelledby="gate-j-portability-title">
    <div className="pharma-evidence-pilot-head">
      <div>
        <p className="eyebrow">Gate J · G10-FINAL · Runtime portability</p>
        <h3 id="gate-j-portability-title">Pharma methodology routing</h3>
        <p>The reviewed primary subprofile selects the existing PHARMA_V1 methodology authority. Reference stocks validate the methodology; they do not limit which Pharma securities can use it.</p>
      </div>
      <span className="pharma-workspace-lock">Portable by subprofile · Symbol-independent</span>
    </div>

    <div className="pharma-persistence-package-summary">
      <div>
        <span>Primary subprofile</span>
        <strong>{authority.displayName}</strong>
        <small>Reviewed assignment authority</small>
      </div>
      <div>
        <span>Methodology authority</span>
        <strong>{authority.referenceStage}</strong>
        <small>{authority.methodologyVersion}</small>
      </div>
      <div>
        <span>Reference validation stock</span>
        <strong>{authority.referenceValidationSymbol}</strong>
        <small>Validation anchor only · not a runtime requirement</small>
      </div>
      <div>
        <span>Gate I policy</span>
        <strong>Unchanged</strong>
        <small>{authority.gateIRecommendationPolicyVersion}</small>
      </div>
    </div>

    <div className="pharma-persistence-package-grid">
      <article>
        <strong>Material Overlay</strong>
        <small>Context within one stock score</small>
        <p>{status.materialOverlays.length ? status.materialOverlays.map(displayName).join(" · ") : "None active"}</p>
        <span>No second independent stock score</span>
      </article>
      <article>
        <strong>Emerging Watch</strong>
        <small>Context only · numerically excluded</small>
        <p>{status.emergingWatches.length ? status.emergingWatches.map(displayName).join(" · ") : "None active"}</p>
        <span>No denominator participation</span>
      </article>
    </div>

    <p className="pharma-evidence-pilot-note"><strong>Runtime rule:</strong> Any Pharma stock with a reviewed subprofile assignment routes to this authority without symbol-specific methodology code. Missing mandatory evidence still fails closed; score/recommendation persistence remains off.</p>
  </section>
}
