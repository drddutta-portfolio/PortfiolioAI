import type { PharmaSectorWorkspaceCapabilities } from "./pharmaSectorWorkspaceCapabilities"

function stateLabel(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/(^|[_\s])\S/g, (match) => match.toLocaleUpperCase())
    .replaceAll("_", " ")
}

export function PharmaSectorCapabilityPanel({
  capabilities,
}: {
  readonly capabilities: PharmaSectorWorkspaceCapabilities
}) {
  const classification = capabilities.classificationLock
  const architecture = capabilities.architecture

  return <details className="pharma-deep-layer" data-pharma-sector-capabilities="true">
    <summary>
      <div>
        <span>PHARMA_V1 architecture, portability & activation state</span>
        <small>Reusable G8/G9 capabilities resolved from this company's canonical assignment</small>
      </div>
      <b>Open details</b>
    </summary>

    <div className="pharma-deep-layer-body">
      <section className="pharma-persistence-package" aria-labelledby="pharma-sector-classification-lock-title">
        <div className="pharma-evidence-pilot-head">
          <div>
            <p className="eyebrow">Classification & evidence lock</p>
            <h3 id="pharma-sector-classification-lock-title">Reviewed business-model authority</h3>
            <p>The reusable classification surface reads the current reviewed assignment and active secondary roles. It does not create, promote or rewrite an assignment.</p>
          </div>
          <span className="pharma-workspace-lock">Canonical reviewed authority</span>
        </div>

        <div className="pharma-persistence-package-summary">
          <div>
            <span>Primary</span>
            <strong>{classification.primary.displayName}</strong>
            <small>{stateLabel(classification.primary.assignmentState)} · {stateLabel(classification.primary.confidence)} confidence</small>
          </div>
          <div>
            <span>Material Overlay</span>
            <strong>{classification.materialOverlays.length
              ? classification.materialOverlays.map((item) => item.displayName).join(" · ")
              : "None reviewed"}</strong>
            <small>{classification.materialOverlays.length ? "Reviewed material role" : "Overlay methodology not engaged"}</small>
          </div>
          <div>
            <span>Emerging Watch</span>
            <strong>{classification.emergingWatches.length
              ? classification.emergingWatches.map((item) => item.displayName).join(" · ")
              : "None reviewed"}</strong>
            <small>Research context only · excluded from score/readiness denominator</small>
          </div>
          <div>
            <span>Unresolved exposure</span>
            <strong>{classification.unresolvedExposures.length
              ? classification.unresolvedExposures.map((item) => item.displayName).join(" · ")
              : "None registered"}</strong>
            <small>{classification.unresolvedExposures.length ? "REVIEW REQUIRED" : "No unresolved exposure supplied to this capability view"}</small>
          </div>
        </div>

        <p className="pharma-evidence-pilot-note"><strong>Boundary:</strong> classification authority is read-only here. Missing or unresolved roles remain explicit and never become zero/default assignments.</p>
      </section>

      <section className="pharma-persistence-package" aria-labelledby="pharma-sector-three-layer-title">
        <div className="pharma-evidence-pilot-head">
          <div>
            <p className="eyebrow">Three-layer Pharma research architecture</p>
            <h3 id="pharma-sector-three-layer-title">Common core + Primary + reviewed secondary roles</h3>
            <p>The same PHARMA_V1 architecture is interpreted through company + active assignment + role while raw evidence stays company scoped.</p>
          </div>
          <span className="pharma-workspace-lock">Read-only architecture</span>
        </div>

        <div className="pharma-persistence-package-summary">
          <div>
            <span>1 · Common Pharma core</span>
            <strong>PHARMA_V1</strong>
            <small>{architecture.commonCore.verified}/{architecture.commonCore.requirementCount} common requirements verified</small>
          </div>
          <div>
            <span>2 · Primary business model</span>
            <strong>{architecture.primary.displayName}</strong>
            <small>{architecture.primary.verified}/{architecture.primary.requirements.length} Primary requirements verified</small>
          </div>
          <div>
            <span>3 · Material Overlay</span>
            <strong>{architecture.secondaryExposures.filter((item) => item.materiality === "MATERIAL").map((item) => item.displayName).join(" · ") || "None reviewed"}</strong>
            <small>Role-aware evidence overlay · never an independent stock score</small>
          </div>
          <div>
            <span>Emerging Watch</span>
            <strong>{architecture.secondaryExposures.filter((item) => item.materiality === "EMERGING").map((item) => item.displayName).join(" · ") || "None reviewed"}</strong>
            <small>Visible context · excluded from readiness/score denominator</small>
          </div>
        </div>

        <div className="pharma-persistence-package-grid">
          <article>
            <strong>Evidence scope</strong>
            <small>{capabilities.portability.rawEvidenceScope}</small>
            <p>Raw observations remain security/company scoped and cannot satisfy another company's research requirements.</p>
            <span>Company isolation: REQUIRED</span>
          </article>
          <article>
            <strong>Interpretation scope</strong>
            <small>{capabilities.portability.interpretationScope}</small>
            <p>The same subprofile may legitimately act as Primary for one company and Material Overlay for another because interpretation is role-bound.</p>
            <span>Role-aware interpretation: ACTIVE</span>
          </article>
        </div>
      </section>

      <section className="pharma-persistence-package" aria-labelledby="pharma-sector-portability-title">
        <div className="pharma-evidence-pilot-head">
          <div>
            <p className="eyebrow">Portability / isolation checkpoint</p>
            <h3 id="pharma-sector-portability-title">Shared-engine leakage protections</h3>
            <p>The reusable workspace inherits the validated cross-company and cross-role isolation invariants rather than creating stock-specific engine behavior.</p>
          </div>
          <span className="pharma-workspace-lock">Validated invariant set</span>
        </div>

        <div className="pharma-persistence-package-summary">
          <div>
            <span>Isolation checks</span>
            <strong>{capabilities.portability.passCount}/{capabilities.portability.totalCount} PASS</strong>
            <small>Locked portability invariants</small>
          </div>
          <div>
            <span>Engine-change test</span>
            <strong>No material redesign</strong>
            <small>{stateLabel(capabilities.portability.engineChangeResult)}</small>
          </div>
          <div>
            <span>Evidence isolation</span>
            <strong>Security / company</strong>
            <small>No cross-company evidence reuse</small>
          </div>
          <div>
            <span>Role isolation</span>
            <strong>Company + assignment + role</strong>
            <small>No Primary / Overlay semantic leakage</small>
          </div>
        </div>
      </section>

      <section className="pharma-persistence-package" aria-labelledby="pharma-sector-activation-title">
        <div className="pharma-evidence-pilot-head">
          <div>
            <p className="eyebrow">Activation-readiness & authority</p>
            <h3 id="pharma-sector-activation-title">Research, scoring, recommendation and sizing stay independently gated</h3>
            <p>Canonical research authority does not activate numeric scoring or any downstream portfolio action.</p>
          </div>
          <span className="pharma-workspace-lock">Research only · downstream blocked</span>
        </div>

        <div className="pharma-persistence-package-grid">
          <article><strong>Parent Pharma profile</strong><small>PHARMA_V1</small><p>Eligible research authority.</p><span>{stateLabel(capabilities.activation.parentProfile)}</span></article>
          <article><strong>Primary authority</strong><small>{classification.primary.displayName}</small><p>Current reviewed Primary role.</p><span>{stateLabel(capabilities.activation.primaryAuthority)}</span></article>
          <article><strong>Material Overlay authority</strong><small>{classification.materialOverlays.map((item) => item.displayName).join(" · ") || "None reviewed"}</small><p>Only reviewed Material exposures may engage overlay methodology.</p><span>{stateLabel(capabilities.activation.materialOverlayAuthority)}</span></article>
          <article><strong>Emerging authority</strong><small>{classification.emergingWatches.map((item) => item.displayName).join(" · ") || "None reviewed"}</small><p>Emerging exposures remain research context only.</p><span>{stateLabel(capabilities.activation.emergingAuthority)}</span></article>
          <article><strong>Unresolved exposure authority</strong><small>{classification.unresolvedExposures.map((item) => item.displayName).join(" · ") || "None registered"}</small><p>Unresolved exposures remain explicit review blockers and are never promoted into active methodology.</p><span>{stateLabel(capabilities.activation.unresolvedAuthority)}</span></article>
          <article><strong>Numeric scoring</strong><small>PHARMA_V1 methodology</small><p>Incomplete methodology stays fail-closed; no score is manufactured for completeness.</p><span>{stateLabel(capabilities.activation.numericScoring)}</span></article>
          <article><strong>Recommendation</strong><small>Deterministic recommendation</small><p>Blocked until approved upstream scoring exists.</p><span>{stateLabel(capabilities.activation.recommendation)}</span></article>
          <article><strong>Position sizing</strong><small>Portfolio sizing</small><p>Blocked until approved recommendation lineage exists.</p><span>{stateLabel(capabilities.activation.positionSizing)}</span></article>
        </div>
      </section>

      <section className="pharma-persistence-package" aria-labelledby="pharma-sector-canonical-assignment-title">
        <div className="pharma-evidence-pilot-head">
          <div>
            <p className="eyebrow">Canonical assignment state</p>
            <h3 id="pharma-sector-canonical-assignment-title">Current reviewed PHARMA_V1 resolver state</h3>
            <p>The sector workspace reads the ordinary canonical assignment authority already resolved for this security.</p>
          </div>
          <span className="pharma-workspace-lock">Resolver · RESOLVED</span>
        </div>

        <div className="pharma-persistence-package-summary">
          <div><span>Resolver state</span><strong>{capabilities.canonicalAssignment.resolverState}</strong><small>Security-scoped canonical assignment</small></div>
          <div><span>Current Primary</span><strong>{classification.primary.displayName}</strong><small>{stateLabel(classification.primary.confidence)} confidence · {stateLabel(classification.primary.assignmentState)}</small></div>
          <div><span>Reviewed secondaries</span><strong>{[
            ...classification.materialOverlays.map((item) => `${item.displayName} · Material`),
            ...classification.emergingWatches.map((item) => `${item.displayName} · Emerging`),
          ].join(" · ") || "None reviewed"}</strong><small>Role and materiality remain assignment-bound</small></div>
          <div><span>Unresolved exposures</span><strong>{classification.unresolvedExposures.map((item) => item.displayName).join(" · ") || "None registered"}</strong><small>{classification.unresolvedExposures.length ? "Review required before any promotion" : "No unresolved exposure supplied to this capability view"}</small></div>
          <div><span>Assignment version</span><strong>v{capabilities.canonicalAssignment.assignmentVersion}</strong><small>{capabilities.canonicalAssignment.reasonCode}</small></div>
          <div><span>Effective from</span><strong>{capabilities.canonicalAssignment.effectiveFrom}</strong><small>{capabilities.canonicalAssignment.effectiveTo ? `Until ${capabilities.canonicalAssignment.effectiveTo}` : "Open-ended active interval"}</small></div>
          <div><span>Review provenance</span><strong>{capabilities.canonicalAssignment.reviewedBy || "Reviewer recorded"}</strong><small>{capabilities.canonicalAssignment.reviewedAt || capabilities.canonicalAssignment.sourceReference}</small></div>
          <div><span>Downstream state</span><strong>Fail closed</strong><small>Score · recommendation · sizing remain blocked</small></div>
        </div>

        <p className="pharma-evidence-pilot-note"><strong>Boundary:</strong> this module is read-only. It does not mutate assignment rows, evidence, score runs, recommendations or sizing state.</p>
      </section>
    </div>
  </details>
}
