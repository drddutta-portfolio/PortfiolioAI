import { useMemo } from "react"
import "./PharmaResearchWorkspacePanel.css"
import { buildTorntpharmEvidencePilotPreview } from "./pharmaEvidencePilotPreview"
import { buildPharmaBusinessModelEvidenceAcquisitionPlan, type PharmaBusinessModelEvidenceAcquisitionItem } from "./pharmaBusinessModelEvidenceAcquisitionContract"
import { buildTorntpharmPublicOfficialSourceDiscoveryPlan } from "./torntpharmPublicOfficialSourceDiscovery"
import { buildTorntpharmArtifactContentReviewPlan } from "./torntpharmArtifactContentReviewPlan"
import { buildTorntpharmReadOnlyContentReviewDryRun } from "./torntpharmReadOnlyContentReviewDryRun"
import { buildTorntpharmCandidateToIngestionProposal } from "./torntpharmCandidateToIngestionProposal"
import { buildTorntpharmLocalNumericIngestionPackage } from "./torntpharmLocalNumericIngestionPackage"
import { buildPharmaRegulatoryEventPersistenceProposal } from "./pharmaRegulatoryEventPersistenceProposal"
import { buildTorntpharmLocalNumericPreflightPlan } from "./torntpharmLocalNumericPreflight"
import { buildPharmaRegulatoryEventMigrationReplayPlan } from "./pharmaRegulatoryEventMigrationReplayPlan"
import { buildTorntpharmCanonicalPrerequisitePackage } from "./torntpharmCanonicalPrerequisitePackage"
import { buildTorntpharmLocalPrerequisiteMutationProposal } from "./torntpharmLocalPrerequisiteMutationProposal"
import { buildTorntpharmLocalObservationMutationProposal } from "./torntpharmLocalObservationMutationProposal"
import { buildPharmaGateGScoringMethodProposal } from "./pharmaGateGScoringMethodProposal"
import { PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL } from "./pharmaSegmentGrowthCurveProposal"
import { PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL } from "./pharmaOperatingMarginCurveProposal"
import { PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT } from "./pharmaAdaptiveClassificationContract"
import { PHARMA_OVERLAY_MODIFIER_CONTRACT } from "./pharmaOverlayModifierContract"
import { PHARMA_READINESS_MAPPING_CONTRACT } from "./pharmaReadinessMappingContract"
import { PHARMA_GOVERNANCE_REGULATORY_GATE_CONTRACT } from "./pharmaGovernanceRegulatoryGateContract"
import { PHARMA_ROCE_CURVE_PROPOSAL } from "./pharmaRoceCurveProposal"
import { PHARMA_CASH_CONVERSION_CURVE_PROPOSAL } from "./pharmaCashConversionCurveProposal"
import { PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL } from "./pharmaBalanceSheetLeverageCurveProposal"
import { PHARMA_VALUATION_CURVE_PROPOSAL } from "./pharmaValuationCurveProposal"
import { PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL } from "./pharmaOwnershipGovernanceCurveProposal"
import { PHARMA_RISK_CURVE_PROPOSAL } from "./pharmaRiskCurveProposal"
import { PHARMA_MOMENTUM_CURVE_PROPOSAL } from "./pharmaMomentumCurveProposal"
import { PHARMA_G6_LAYERING_BOUNDARY, pharmaG6CurveContractForPrimary } from "./pharmaG6SubprofileCurveApplicability"
import { PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE } from "./pharmaDomesticValuationSelfHistoryCurveProposal"
import { PHARMA_G6_DOMESTIC_VALUATION_FCF_IDENTITY } from "./pharmaG6DomesticValuationFcfIdentity"
import { PHARMA_FCF_YIELD_METRIC_CONTRACT } from "./pharmaFcfYieldMetricContract"
import { PHARMA_FCF_YIELD_DERIVATION_VERSION } from "./pharmaFcfYieldDerivationProposal"
import { PHARMA_DOMESTIC_FCF_YIELD_CURVE } from "./pharmaDomesticFcfYieldCurveProposal"
import { PHARMA_DOMESTIC_PEER_VALUATION_CONTRACT } from "./pharmaDomesticPeerValuationContract"
import { PHARMA_DOMESTIC_PEER_COHORT_BUILDER_VERSION } from "./pharmaDomesticPeerCohortBuilder"
import { PHARMA_DOMESTIC_PEER_COMPARABILITY } from "./pharmaDomesticPeerComparabilityContract"
import { PHARMA_DOMESTIC_PEER_PREMIUM_DISCOUNT } from "./pharmaDomesticPeerPremiumDiscountProposal"
import { PHARMA_DOMESTIC_PEER_COMBINATION } from "./pharmaDomesticPeerCombinationContract"
import { PHARMA_DOMESTIC_PEER_WEIGHTING_GATE } from "./pharmaDomesticPeerWeightingGate"
import { PHARMA_DOMESTIC_PEER_COMBINED_SCORE } from "./pharmaDomesticPeerCombinedScoreContract"
import { PHARMA_DOMESTIC_VALUATION_WEIGHTING_GATE } from "./pharmaDomesticValuationWeightingGate"
import { PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE } from "./pharmaDomesticValuationCombinedScoreContract"
import { PHARMA_GLOBAL_GENERIC_PRICE_EROSION_CURVE } from "./pharmaGlobalGenericPriceErosionCurveProposal"
import { PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE } from "./pharmaGlobalGenericsPipelineEvidenceContract"
import { PHARMA_GLOBAL_GENERICS_PIPELINE_STAGE_NORMALIZATION } from "./pharmaGlobalGenericsPipelineStageNormalization"
import { PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_GATE } from "./pharmaGlobalGenericsPipelineAggregationGate"
import { PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL } from "./pharmaGlobalGenericsPipelineAggregationMethodProposal"
import { PHARMA_GLOBAL_GENERICS_PIPELINE_COMBINED_SCORE } from "./pharmaGlobalGenericsPipelineCombinedScoreContract"
import { PHARMA_GLOBAL_GENERICS_REGULATORY_SITE_TREATMENT } from "./pharmaGlobalGenericsRegulatorySiteTreatmentContract"
import { PHARMA_GLOBAL_GENERICS_MARKET_RISK_NORMALIZATION_GATE } from "./pharmaGlobalGenericsMarketRiskNormalizationGate"
import { PHARMA_GLOBAL_GENERICS_DRAWDOWN_METHOD_GATE } from "./pharmaGlobalGenericsDrawdownMethodGate"
import { PHARMA_GLOBAL_GENERICS_DRAWDOWN_EVIDENCE_SUFFICIENCY } from "./pharmaGlobalGenericsDrawdownEvidenceSufficiency"
import { PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_METHOD_GATE } from "./pharmaGlobalGenericsVolatilityContextMethodGate"
import { PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_EVIDENCE_SUFFICIENCY } from "./pharmaGlobalGenericsVolatilityContextEvidenceSufficiency"
import { PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_METHOD_GATE } from "./pharmaGlobalGenericsOperatingMarginMethodGate"
import { PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_CALIBRATION_EVIDENCE } from "./pharmaGlobalGenericsOperatingMarginCalibrationEvidence"
import { PHARMA_GLOBAL_GENERICS_ROCE_METHOD_GATE } from "./pharmaGlobalGenericsRoceMethodGate"
import { PHARMA_GLOBAL_GENERICS_ROCE_CALIBRATION_EVIDENCE } from "./pharmaGlobalGenericsRoceCalibrationEvidence"
import { PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_METHOD_GATE } from "./pharmaGlobalGenericsCashConversionMethodGate"
import { PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_CALIBRATION_EVIDENCE } from "./pharmaGlobalGenericsCashConversionCalibrationEvidence"
import { PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_METHOD_GATE } from "./pharmaGlobalGenericsBalanceSheetMethodGate"
import { PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_CALIBRATION_EVIDENCE } from "./pharmaGlobalGenericsBalanceSheetCalibrationEvidence"
import { PHARMA_GLOBAL_GENERICS_VALUATION_METHOD_GATE } from "./pharmaGlobalGenericsValuationMethodGate"
import { PHARMA_GLOBAL_GENERICS_VALUATION_CALIBRATION_EVIDENCE } from "./pharmaGlobalGenericsValuationCalibrationEvidence"
import { PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_METHOD_GATE } from "./pharmaGlobalGenericsOwnershipGovernanceMethodGate"
import { PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_CALIBRATION_EVIDENCE } from "./pharmaGlobalGenericsOwnershipGovernanceCalibrationEvidence"
import { PHARMA_GLOBAL_GENERICS_MOMENTUM_METHOD_GATE } from "./pharmaGlobalGenericsMomentumMethodGate"
import { PHARMA_GLOBAL_GENERICS_MOMENTUM_EVIDENCE_SUFFICIENCY } from "./pharmaGlobalGenericsMomentumEvidenceSufficiency"
import { PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW } from "./pharmaGlobalGenericsG6CoverageReview"
import { PHARMA_GLOBAL_GENERICS_APPLICABILITY_REGISTRY_RECONCILIATION } from "./pharmaGlobalGenericsApplicabilityRegistryReconciliation"
import { PHARMA_G7_OVERLAY_NUMERIC_MODIFIER } from "./pharmaG7OverlayNumericModifierProposal"
import { PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT } from "./pharmaG7GovernanceHighRiskConstraint"
import { PHARMA_G7_READ_ONLY_SCORING_ADAPTER } from "./pharmaG7ReadOnlyScoringAdapter"
import { buildTorntpharmG7ExplainablePreview } from "./pharmaTorntpharmG7ExplainablePreview"
import { PHARMA_G7_RESEARCH_GAP_REGISTER, PHARMA_G7_VALIDATION_INVARIANTS } from "./pharmaG7ValidationAndResearchGapRegister"
import { buildPharmaResearchWorkspaceModel, type PharmaWorkspaceRequirement, type PharmaWorkspaceSecondaryExposure } from "./pharmaResearchWorkspaceModel"
import { usePharmaSubprofileResolution } from "./usePharmaSubprofileResolution"
import type { SecurityResearch } from "./types"

function titleCase(value: string) {
  return value.toLocaleLowerCase().replace(/(^|[_\s])\S/g, (match) => match.toLocaleUpperCase()).replaceAll("_", " ")
}

function statusClass(status: PharmaWorkspaceRequirement["status"]) {
  if (status === "VERIFIED") return "is-verified"
  if (status === "UNAVAILABLE") return "is-unavailable"
  if (status === "CONFLICTING" || status === "AMBIGUOUS" || status === "REVIEW_REQUIRED") return "is-attention"
  if (status === "STALE") return "is-stale"
  return "is-provisional"
}

function RequirementList({ items, empty }: { readonly items: readonly PharmaWorkspaceRequirement[]; readonly empty: string }) {
  if (!items.length) return <p className="pharma-workspace-empty">{empty}</p>
  return <div className="pharma-workspace-requirements">
    {items.map((item) => <div className="pharma-workspace-requirement" key={item.metricCode}>
      <div>
        <strong>{item.label}</strong>
        <small>{titleCase(item.dimension)} · {titleCase(item.requirementLevel)}</small>
      </div>
      <span className={`pharma-workspace-status ${statusClass(item.status)}`}>{titleCase(item.status)}</span>
    </div>)}
  </div>
}

function overlayLabel(exposure: PharmaWorkspaceSecondaryExposure) {
  if (exposure.mode === "EVIDENCE_OVERLAY") return "Evidence overlay active"
  if (exposure.mode === "EMERGING_WATCH") return "Emerging watchlist"
  if (exposure.mode === "MONITOR_ONLY") return "Monitor only"
  if (exposure.mode === "RECLASSIFICATION_REVIEW") return "Reclassification review"
  return "Blocked"
}

function SecondaryExposureCard({ exposure }: { readonly exposure: PharmaWorkspaceSecondaryExposure }) {
  return <article className={`pharma-secondary-card mode-${exposure.mode.toLocaleLowerCase()}`}>
    <div className="pharma-secondary-card-head">
      <div>
        <p className="eyebrow">Secondary exposure</p>
        <h4>{exposure.displayName}</h4>
      </div>
      <span className="pharma-materiality-pill">{titleCase(exposure.materiality)}</span>
    </div>
    <div className="pharma-overlay-meta">
      <strong>{overlayLabel(exposure)}</strong>
      <span>{titleCase(exposure.confidence)} confidence</span>
    </div>
    <p>{exposure.note}</p>
    {exposure.mode === "EVIDENCE_OVERLAY" ? <RequirementList items={exposure.requirements} empty="No overlay-specific requirements are currently defined." /> : null}
  </article>
}


function acquisitionAccessLabel(value: PharmaBusinessModelEvidenceAcquisitionItem["accessGate"]) {
  if (value === "PUBLIC_OFFICIAL_FIRST") return "Public / official first"
  if (value === "PUBLIC_OR_LICENSED") return "Public or licensed"
  return "Licensed source required"
}

function acquisitionMethodLabel(value: PharmaBusinessModelEvidenceAcquisitionItem["acquisitionMethod"]) {
  if (value === "DOCUMENT_EXTRACTION") return "Document extraction"
  if (value === "EVENT_REVIEW") return "Event review"
  if (value === "DERIVED_FROM_DISCLOSED_INPUTS") return "Derived from disclosed inputs"
  if (value === "LICENSED_DATA_REVIEW") return "Licensed data review"
  return "Composite review"
}

function AcquisitionRequirementList({ items }: { readonly items: readonly PharmaBusinessModelEvidenceAcquisitionItem[] }) {
  return <div className="pharma-acquisition-list">
    {items.map((item) => <article className="pharma-acquisition-item" key={item.metricCode}>
      <div className="pharma-acquisition-item-head">
        <div>
          <strong>{item.label}</strong>
          <small>{titleCase(item.requirementLevel)} · minimum {item.minimumObservations} / preferred {item.preferredObservations} {titleCase(item.historyUnit).toLocaleLowerCase()}</small>
        </div>
        <span>{acquisitionAccessLabel(item.accessGate)}</span>
      </div>
      <div className="pharma-acquisition-item-meta">
        <span>{acquisitionMethodLabel(item.acquisitionMethod)}</span>
        <span>{item.sourceLanes.map(titleCase).join(" · ")}</span>
      </div>
      <p>{item.evidenceShape}</p>
      <small className="pharma-acquisition-fail-closed"><strong>Fail closed:</strong> {item.failClosedRule}</small>
    </article>)}
  </div>
}

export function PharmaResearchWorkspacePanel({ securityId, symbol, research }: { readonly securityId: string; readonly symbol: string; readonly research: SecurityResearch }) {
  const resolution = usePharmaSubprofileResolution(securityId)
  const evaluationDate = useMemo(() => new Date().toISOString().slice(0, 10), [])

  if (resolution.isLoading) return <section className="pharma-workspace-panel"><p className="muted">Loading reviewed Pharma business model…</p></section>
  if (resolution.error) return <section className="pharma-workspace-panel"><div className="notice notice-error">Reviewed Pharma business model could not be loaded.</div></section>
  if (!resolution.data || resolution.data.status !== "RESOLVED") {
    return <section className="pharma-workspace-panel pharma-workspace-blocked">
      <div>
        <p className="eyebrow">Pharma research model</p>
        <h2>Subprofile review required</h2>
        <p>Profile-driven evidence lanes remain blocked until one active reviewed Pharma subprofile assignment is available.</p>
      </div>
    </section>
  }

  const model = buildPharmaResearchWorkspaceModel(resolution.data.assignment, research.metrics, evaluationDate)
  const evidencePilot = symbol.toLocaleUpperCase() === "TORNTPHARM" ? buildTorntpharmEvidencePilotPreview(securityId, model) : null
  const acquisitionPlan = symbol.toLocaleUpperCase() === "TORNTPHARM" ? buildPharmaBusinessModelEvidenceAcquisitionPlan(model) : null
  const publicSourceDiscovery = acquisitionPlan ? buildTorntpharmPublicOfficialSourceDiscoveryPlan(acquisitionPlan) : null
  const artifactReviewPlan = acquisitionPlan && publicSourceDiscovery ? buildTorntpharmArtifactContentReviewPlan(acquisitionPlan, publicSourceDiscovery) : null
  const contentReviewDryRun = symbol.toLocaleUpperCase() === "TORNTPHARM" ? buildTorntpharmReadOnlyContentReviewDryRun() : null
  const ingestionProposal = symbol.toLocaleUpperCase() === "TORNTPHARM" ? buildTorntpharmCandidateToIngestionProposal(securityId, resolution.data.assignment.assignmentVersion) : null
  const localNumericPackage = symbol.toLocaleUpperCase() === "TORNTPHARM" ? buildTorntpharmLocalNumericIngestionPackage(securityId, resolution.data.assignment.assignmentVersion) : null
  const eventPersistenceProposal = symbol.toLocaleUpperCase() === "TORNTPHARM" ? buildPharmaRegulatoryEventPersistenceProposal(securityId, resolution.data.assignment.assignmentVersion) : null
  const localNumericPreflight = symbol.toLocaleUpperCase() === "TORNTPHARM" ? buildTorntpharmLocalNumericPreflightPlan(securityId, resolution.data.assignment.assignmentVersion) : null
  const eventMigrationReplay = symbol.toLocaleUpperCase() === "TORNTPHARM" ? buildPharmaRegulatoryEventMigrationReplayPlan(securityId, resolution.data.assignment.assignmentVersion) : null
  const canonicalPrerequisitePackage = symbol.toLocaleUpperCase() === "TORNTPHARM" ? buildTorntpharmCanonicalPrerequisitePackage() : null
  const localPrerequisiteMutationProposal = symbol.toLocaleUpperCase() === "TORNTPHARM" ? buildTorntpharmLocalPrerequisiteMutationProposal() : null
  const localObservationMutationProposal = symbol.toLocaleUpperCase() === "TORNTPHARM" ? buildTorntpharmLocalObservationMutationProposal() : null
  const gateGScoringProposal = buildPharmaGateGScoringMethodProposal(model)
  const g7TorntpharmPreview = symbol.toLocaleUpperCase() === "TORNTPHARM"
    ? buildTorntpharmG7ExplainablePreview(model)
    : null

  return <section className="pharma-workspace-panel" aria-labelledby="pharma-workspace-title">
    <div className="pharma-workspace-titlebar">
      <div>
        <p className="eyebrow">Sector research workspace · Pharmaceuticals</p>
        <h2 id="pharma-workspace-title">Pharmaceuticals deep research</h2>
        <p>Profile-specific evidence follows the reviewed Pharma business model. Open the detailed layers only when you need the underlying requirements, sources or review controls.</p>
      </div>
      <span className="pharma-workspace-lock">Scoring methodology not yet approved</span>
    </div>

    <div className="pharma-workspace-summary" aria-label="Pharma research model summary">
      <div><span>Primary model</span><strong>{model.primary.displayName}</strong><small>Reviewed · {titleCase(model.primary.confidence)} confidence</small></div>
      <div><span>Primary evidence</span><strong>{model.primary.verified}/{model.primary.requirements.length} verified</strong><small>{model.primary.unavailable} unavailable · {model.primary.reviewAttention} need attention</small></div>
      <div><span>Secondary exposures</span><strong>{model.secondaries.length}</strong><small>{model.secondaries.length ? model.secondaries.map((item) => `${item.displayName} · ${titleCase(item.materiality)}`).join(" · ") : "None active"}</small></div>
      <div><span>Effective from</span><strong>{model.primary.effectiveFrom}</strong><small>Reviewed assignment authority</small></div>
    </div>

    <details className="pharma-deep-layer pharma-scoring-methodology">
      <summary>
        <div><span>Gate G · Scoring methodology design</span><small>PHARMA_V1 dimensions, subprofile participation and readiness gates · no numeric curves approved</small></div>
        <b>Open details</b>
      </summary>
      <div className="pharma-deep-layer-body">
        <section className="pharma-persistence-package" aria-labelledby="pharma-gate-g-methodology-title">
          <div className="pharma-evidence-pilot-head">
            <div>
              <p className="eyebrow">Gate G · Methodology contract</p>
              <h3 id="pharma-gate-g-methodology-title">PHARMA_V1 scoring design</h3>
              <p>The scoring architecture is reviewable before any curve is approved. Primary and material business-model evidence participate inside one PHARMA_V1 score; emerging watches stay outside the denominator.</p>
            </div>
            <span className="pharma-workspace-lock">Design only · No score run</span>
          </div>
          <div className="pharma-persistence-package-summary">
            <div><span>Weighted dimensions</span><strong>{gateGScoringProposal.dimensionWeights.length}</strong><small>{gateGScoringProposal.dimensionWeights.reduce((sum, item) => sum + item.weight, 0)}% total weight</small></div>
            <div><span>Dimension gate</span><strong>{Math.round(gateGScoringProposal.dimensionMinimumScoreReadyCoverage * 100)}%</strong><small>Minimum score-ready coverage per weighted dimension</small></div>
            <div><span>Overall preview gate</span><strong>{Math.round(gateGScoringProposal.overallMinimumScoreReadyCoverage * 100)}%</strong><small>All weighted dimensions must also be score-ready</small></div>
            <div><span>Curve approval</span><strong>Pending</strong><small>No numeric Pharma score curve is approved yet</small></div>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>Primary scoring model</strong>
              <small>{gateGScoringProposal.primary.displayName}</small>
              <p>{gateGScoringProposal.primary.note}</p>
              <span>Role: PRIMARY SCORE DRIVER</span>
            </article>
            {gateGScoringProposal.overlays.map((overlay) => <article key={overlay.code}>
              <strong>{overlay.role === "MATERIAL_EVIDENCE_OVERLAY" ? "Material scoring overlay" : "Emerging scoring watch"}</strong>
              <small>{overlay.displayName}</small>
              <p>{overlay.note}</p>
              <span>{overlay.denominatorEffect === "WITHIN_DIMENSION_ONLY" ? "No second score · within-dimension evidence only" : "Excluded from score denominator"}</span>
            </article>)}
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G1 · Adaptive classification contract</strong>
              <small>{PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT.version}</small>
              <p>Primary classification requires stable leadership across {PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT.primaryRequiresStableLeadershipPeriods} consecutive annual periods. Material Overlay requires ≥{PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT.materialOverlayThresholdPercent}% revenue or profit for {PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT.annualPeriodsRequired} consecutive annual periods; Emerging Watch begins at {PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT.emergingWatchLowerBoundPercent}% or from separately reviewed evidence of growth toward materiality.</p>
              <span>Proposal only · No assignment write · No score execution</span>
            </article>
            <article>
              <strong>G1 · Fail-closed classification boundary</strong>
              <small>Revenue + profit evidence · effective-dated review</small>
              <p>Revenue/profit Primary disagreement, missing consecutive annual evidence, or an unconfirmed structural Primary change returns review required instead of an inferred classification. Unreviewed evidence cannot classify.</p>
              <span>Ambiguity: REVIEW REQUIRED · Effective dating: REQUIRED</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G2 · Overlay modifier contract</strong>
              <small>{PHARMA_OVERLAY_MODIFIER_CONTRACT.version}</small>
              <p>Material overlays may modify only dimensions explicitly touched by their versioned subprofile evidence contract. Economic materiality, evidence completeness, evidence confidence and an approved normalized overlay signal are all required inputs.</p>
              <span>Proposal only · Formula pending · No modifier execution</span>
            </article>
            <article>
              <strong>G2 · Combined-cap & contradiction boundary</strong>
              <small>One shared cap per dimension · exact value unapproved</small>
              <p>All material overlays affecting one dimension must share a single combined cap. Missing overlay evidence cannot become neutral, unresolved contradictions require review, and Emerging Watch remains numerically excluded.</p>
              <span>Combined cap: REQUIRED · Exact cap: PENDING · Emerging Watch: EXCLUDED</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G3 · Readiness mapping contract</strong>
              <small>{PHARMA_READINESS_MAPPING_CONTRACT.version}</small>
              <p>Visible readiness resolves deterministically to READY, PARTIAL, INSUFFICIENT EVIDENCE, PROFILE PENDING, BLOCKED REVIEW or NOT APPLICABLE. A weighted dimension requires at least {Math.round(PHARMA_READINESS_MAPPING_CONTRACT.dimensionMinimumScoreReadyCoverage * 100)}% score-ready coverage plus satisfied mandatory blockers.</p>
              <span>Proposal only · Emerging Watch excluded · No score execution</span>
            </article>
            <article>
              <strong>G3 · Overall fail-closed readiness gate</strong>
              <small>{Math.round(PHARMA_READINESS_MAPPING_CONTRACT.overallMinimumScoreReadyCoverage * 100)}% overall coverage is necessary, not sufficient</small>
              <p>Overall preview requires the common Pharma core, Primary subprofile and every weighted dimension to be READY. Partial material-overlay evidence can keep an affected dimension PARTIAL; Primary or governance/review failure blocks the company.</p>
              <span>Every weighted dimension: READY · Primary: READY · Common core: READY</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G4 · Governance / regulatory gate</strong>
              <small>{PHARMA_GOVERNANCE_REGULATORY_GATE_CONTRACT.version}</small>
              <p>Critical governance events or an explicit blocked-review state stop preview readiness before aggregation. High-risk states remain prominent but non-blocking unless a separately versioned transparent constraint is later approved.</p>
              <span>Proposal only · Critical: BLOCKS · High risk: NON-BLOCKING · Cap: UNAPPROVED</span>
            </article>
            <article>
              <strong>G4 · Materiality, remediation & anti-double-counting</strong>
              <small>Regulatory scope + materiality + remediation + subsequent outcome</small>
              <p>Unknown regulatory materiality requires review and exposure is never inferred. Closeout does not erase the historical event, and no hidden extra governance/regulatory penalty may duplicate the weighted Ownership / Governance dimension.</p>
              <span>Unknown materiality: REVIEW REQUIRED · Hidden double-counting: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G5.1 · ROCE / Capital Efficiency framework</strong>
              <small>{PHARMA_ROCE_CURVE_PROPOSAL.proposalVersion}</small>
              <p>ROCE keeps its existing minimum {PHARMA_ROCE_CURVE_PROPOSAL.history.minimumComparableAnnualPeriods}-year / preferred {PHARMA_ROCE_CURVE_PROPOSAL.history.preferredComparableAnnualPeriods}-year reviewed history contract. The shared methodology shape is Level + Stability + Trend, but component weights and numeric bands remain unapproved.</p>
              <span>Proposal only · Numeric curve not ready · No score execution</span>
            </article>
            <article>
              <strong>G5.1 · Dimension alignment & threshold boundary</strong>
              <small>Canonical: {titleCase(PHARMA_ROCE_CURVE_PROPOSAL.canonicalDimension)} · Current parent contract: {titleCase(PHARMA_ROCE_CURVE_PROPOSAL.currentParentContractDimension)}</small>
              <p>The canonical model places ROCE in Capital Efficiency, while the older parent evidence contract still labels it Quality. This must be reconciled explicitly, and every Pharma subprofile still needs its own approved ROCE threshold contract before numeric scoring.</p>
              <span>Alignment: REQUIRED · Universal ROCE bands: NO · Subprofile thresholds: PENDING</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G5.2 · Cash Conversion framework</strong>
              <small>{PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.proposalVersion}</small>
              <p>Cash Conversion preserves the minimum {PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.history.minimumComparableAnnualPeriods}-year / preferred {PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.history.preferredComparableAnnualPeriods}-year history contract and requires matched CFO, PAT and capex/FCF periods. CFO alone is not sufficient.</p>
              <span>Proposal only · Numeric curve not ready · No score execution</span>
            </article>
            <article>
              <strong>G5.2 · Dimension alignment & capex-context boundary</strong>
              <small>Canonical: {titleCase(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.canonicalDimension)} · Current parent contract: {titleCase(PHARMA_CASH_CONVERSION_CURVE_PROPOSAL.currentParentContractDimension)}</small>
              <p>The canonical model places this metric in Cash Flow, while the older parent evidence contract still labels it Earnings Cash Quality. Universal numeric bands remain prohibited and FCF interpretation requires capex-intensity context.</p>
              <span>Alignment: REQUIRED · Universal bands: NO · Capex context: REQUIRED</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G5.3 · Balance Sheet / Leverage framework</strong>
              <small>{PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.proposalVersion}</small>
              <p>Balance Sheet / Leverage preserves the minimum {PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.history.minimumComparableAnnualPeriods}-year / preferred {PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.history.preferredComparableAnnualPeriods}-year history contract and requires matched debt, cash and operating-earnings evidence. One point-in-time snapshot is not sufficient.</p>
              <span>Proposal only · Numeric curve not ready · No score execution</span>
            </article>
            <article>
              <strong>G5.3 · Dimension alignment & leverage-context boundary</strong>
              <small>Canonical: {titleCase(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.canonicalDimension)} · Current parent contract: {titleCase(PHARMA_BALANCE_SHEET_LEVERAGE_CURVE_PROPOSAL.currentParentContractDimension)}</small>
              <p>The canonical model places this family in Balance Sheet / Credit, while the older parent contract still labels it Financial Strength. Universal leverage bands remain prohibited; cash semantics, net-cash treatment and acquisition/expansion context must be explicit.</p>
              <span>Alignment: REQUIRED · Universal bands: NO · Context: REQUIRED</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G5.4 · Valuation framework</strong>
              <small>{PHARMA_VALUATION_CURVE_PROPOSAL.proposalVersion}</small>
              <p>Valuation already aligns directly with the canonical Valuation dimension. The framework uses self-history, business-model-appropriate peers and cash-flow corroboration across P/E, EV/EBITDA and FCF yield while keeping component weights and numeric bands unapproved.</p>
              <span>Proposal only · Dimension aligned · Numeric curve not ready</span>
            </article>
            <article>
              <strong>G5.4 · Price authority, peer-context & denominator boundary</strong>
              <small>Authoritative price required · P/BV excluded for Pharma</small>
              <p>Current authoritative market price and reviewed earnings/cash inputs are mandatory. Provider valuation labels cannot override price authority, peer cohorts must respect the Pharma business model, and broken or one-off-distorted denominators require explicit treatment.</p>
              <span>Universal absolute bands: NO · Peer context: REQUIRED · P/BV: EXCLUDED</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G5.5 · Ownership / Governance framework</strong>
              <small>{PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.proposalVersion}</small>
              <p>Ownership / Governance preserves a minimum {PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.history.minimumComparableShareholdingQuarters}-quarter / preferred {PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.history.preferredComparableShareholdingQuarters}-quarter shareholding history plus current material governance events. Promoter absence is not automatically negative and ownership percentages are not scored mechanically.</p>
              <span>Proposal only · Numeric curve not ready · No score execution</span>
            </article>
            <article>
              <strong>G5.5 · G4 separation & anti-double-counting boundary</strong>
              <small>Canonical: {titleCase(PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.canonicalDimension)} · Current parent contract: {titleCase(PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.currentParentContractDimension)}</small>
              <p>Critical/high-risk governance events remain owned by G4. The weighted Ownership / Governance dimension may retain event context for explanation but cannot apply a second hidden deduction or embedded gate cap for the same event.</p>
              <span>Alignment: REQUIRED · G4 second penalty: NO · Hidden double-counting: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G5.6 · Regulatory & Market Risk framework</strong>
              <small>{PHARMA_RISK_CURVE_PROPOSAL.proposalVersion}</small>
              <p>Risk already aligns with the canonical Risk dimension. The framework combines regulated-export site context with existing deterministic 1-year drawdown and volatility evidence, while Pharma-specific market-risk normalization remains unapproved.</p>
              <span>Proposal only · Dimension aligned · Numeric curve not ready</span>
            </article>
            <article>
              <strong>G5.6 · G4 separation & market-rule boundary</strong>
              <small>G4 owns critical/high-risk gates · Pharma market-risk rules pending</small>
              <p>Regulatory event context may remain visible inside Risk, but the same G4 event cannot receive a second hidden penalty or embedded cap. BANK/NBFC market-risk thresholds are not inherited; Pharma drawdown/volatility bands require separate review.</p>
              <span>G4 second penalty: NO · BANK thresholds inherited: NO · Pharma bands: PENDING</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G5.7 · Momentum framework</strong>
              <small>{PHARMA_MOMENTUM_CURVE_PROPOSAL.proposalVersion}</small>
              <p>Momentum uses existing deterministic 12-month, 6-month and benchmark-relative market evidence, but PHARMA_V1 still lacks a dedicated parent Momentum metric contract. No BANK/NBFC weighting or benchmark assumption is inherited.</p>
              <span>Proposal only · Parent contract missing · Numeric curve not ready</span>
            </article>
            <article>
              <strong>G5.7 · Parent-contract & benchmark boundary</strong>
              <small>Canonical: Momentum · Pharma benchmark unapproved</small>
              <p>Relative-strength scoring requires an explicitly approved Pharma benchmark. NIFTY Bank is not inherited, missing relative strength cannot become neutral, and the BANK/NBFC 12M/6M weights remain isolated to that pilot.</p>
              <span>Parent contract: REQUIRED · BANK weights inherited: NO · Pharma benchmark: PENDING</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.1 · Subprofile curve applicability lock</strong>
              <small>Primary-specific curve scope · No new numeric bands</small>
              <p>Domestic Formulations keeps the validated Domestic Revenue Growth and Domestic-only Operating Margin proposals. Global Generics may use the validated Export / US Growth curve, while API/Bulk Drugs, CDMO/CRAMS and Biopharma/Biosimilars remain fail-closed for those unsupported curve families.</p>
              <span>Domestic threshold reuse: NO · Unsupported primaries: FAIL CLOSED</span>
            </article>
            <article>
              <strong>G6.1 · Primary / Overlay / Emerging boundary</strong>
              <small>Primary contract drives curves · Material Overlay stays within-dimension · Emerging excluded</small>
              <p>TORNTPHARM remains Primary Domestic Formulations, Material Overlay Global Generics and Emerging Watch CDMO/CRAMS. The overlay cannot create a second stock score and Emerging Watch cannot enter numeric scoring.</p>
              <span>Primary contract: {pharmaG6CurveContractForPrimary("DOMESTIC_FORMULATIONS").subprofileCode} · Overlay score: {PHARMA_G6_LAYERING_BOUNDARY.materialOverlayCreatesIndependentStockScore ? "YES" : "NO"} · Emerging score: {PHARMA_G6_LAYERING_BOUNDARY.emergingWatchCreatesIndependentStockScore ? "YES" : "NO"}</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.2 · Domestic valuation self-history curve</strong>
              <small>{PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE.proposalVersion}</small>
              <p>Domestic Formulations valuation now has a proposal-only self-history score curve using current P/E versus the company’s own five-year average P/E. It uses relative valuation rather than an absolute Pharma P/E cutoff.</p>
              <span>≥25%: 100 · ≥10%: 80 · ≥-5%: 60 · ≥-20%: 40 · &lt;-20%: 20</span>
            </article>
            <article>
              <strong>G6.2 · Scope & incomplete-dimension boundary</strong>
              <small>Domestic Formulations only · Whole Valuation dimension not ready</small>
              <p>Peer-relative valuation and FCF corroboration remain unapproved, BANK/NBFC dimension weights are not inherited, and unsupported Pharma primaries fail closed rather than receiving Domestic thresholds.</p>
              <span>Absolute P/E bands: NO · BANK weights inherited: NO · Whole dimension ready: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.3 · FCF-yield evidence identity lock</strong>
              <small>{PHARMA_G6_DOMESTIC_VALUATION_FCF_IDENTITY.proposalVersion}</small>
              <p>Domestic Valuation cash-flow corroboration is conceptually valid, but the repository currently uses both FCF_YIELD and FCF_YIELD_PERCENT without one approved canonical metric definition tying them together.</p>
              <span>Metric identity: AMBIGUOUS · Numeric thresholds: BLOCKED</span>
            </article>
            <article>
              <strong>G6.3 · Numeric-threshold blocker</strong>
              <small>Canonical formula, unit and alias reconciliation required</small>
              <p>No FCF-yield scoring bands may be introduced until the canonical metric code, formula, unit, price/market-cap authority, negative-FCF treatment and alias semantics are explicitly versioned.</p>
              <span>Canonical definition: MISSING · Alias reconciliation: PENDING · Whole dimension ready: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.4 · Canonical FCF-yield metric</strong>
              <small>{PHARMA_FCF_YIELD_METRIC_CONTRACT.contractVersion}</small>
              <p>FCF_YIELD_PERCENT is the proposed canonical Pharma valuation cash-flow corroboration metric. FCF_YIELD remains a legacy alias only and must not create a second independent observation.</p>
              <span>Canonical code: FCF_YIELD_PERCENT · Legacy alias: FCF_YIELD · Double-counting: NO</span>
            </article>
            <article>
              <strong>G6.4 · Formula & authority boundary</strong>
              <small>(FREE_CASH_FLOW_ANNUAL / CURRENT_MARKET_CAP) × 100</small>
              <p>The numerator uses reviewed PortfolioAI free cash flow. The denominator must reflect current authoritative market-price semantics; stale or provider-only market-cap authority cannot override that contract. Negative FCF yield remains negative evidence.</p>
              <span>Unit: PERCENT · Numeric bands: NO · Storage migration: NO · Whole dimension ready: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.6 · Canonical FCF-yield registration proposal</strong>
              <small>{PHARMA_FCF_YIELD_METRIC_CONTRACT.canonicalMetricCode} · {PHARMA_FCF_YIELD_METRIC_CONTRACT.contractVersion}</small>
              <p>The repository now has a proposal-only canonical definition for FCF_YIELD_PERCENT with NUMERIC / PERCENT / VALUATION semantics. The SQL artifact lives under docs/sql and deliberately rolls back, so no database state is changed.</p>
              <span>Repository proposal: YES · Local migration: NO · Production migration: NO</span>
            </article>
            <article>
              <strong>G6.6 · Deterministic derivation & alias-safe evidence</strong>
              <small>{PHARMA_FCF_YIELD_DERIVATION_VERSION}</small>
              <p>FCF yield is derived as annual free cash flow divided by current market cap × 100. Negative FCF remains negative evidence, invalid market cap fails closed, and FCF_YIELD remains an alias fallback that cannot double-count the canonical component.</p>
              <span>Canonical code: FCF_YIELD_PERCENT · Alias double-counting: NO · Numeric score bands: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.8 · Domestic FCF-yield corroboration curve</strong>
              <small>{PHARMA_DOMESTIC_FCF_YIELD_CURVE.proposalVersion}</small>
              <p>Domestic Formulations now has a proposal-only cash-flow corroboration curve using canonical FCF_YIELD_PERCENT. The curve rewards stronger cash yield, preserves negative FCF as adverse evidence, and does not act as a standalone valuation verdict.</p>
              <span>≥5%: 100 · ≥3%: 80 · ≥1.5%: 60 · ≥0%: 40 · &lt;0%: 20</span>
            </article>
            <article>
              <strong>G6.8 · Corroboration-only boundary</strong>
              <small>Domestic Formulations only · Peer-relative valuation still unapproved</small>
              <p>The FCF-yield curve is only one Valuation component. Peer-relative valuation and component weights remain unapproved, so the 12% Valuation dimension is still not score-ready.</p>
              <span>Standalone verdict: NO · Component weights: PENDING · Whole dimension ready: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.9 · Domestic peer-cohort methodology lock</strong>
              <small>{PHARMA_DOMESTIC_PEER_VALUATION_CONTRACT.contractVersion}</small>
              <p>Peer-relative Valuation must use reviewed, effective-dated Domestic Formulations Primary assignments. Sector/industry membership, Material Overlay labels and provider peer lists are not sufficient to define a scoring cohort.</p>
              <span>Same reviewed Primary: REQUIRED · Generic Pharma peers: NO · Provider peer authority: NO</span>
            </article>
            <article>
              <strong>G6.9 · Peer-relative numeric blocker</strong>
              <small>Peer count, aggregation statistic, metric mix and relative bands remain unapproved</small>
              <p>PE_TTM and EV_EBITDA are candidate evidence families, but no peer builder, minimum cohort size, median/percentile rule, outlier treatment or premium/discount score curve is approved yet.</p>
              <span>Cohort builder: NO · Numeric peer curve: NO · Whole dimension ready: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.10 · Domestic peer-cohort builder</strong>
              <small>{PHARMA_DOMESTIC_PEER_COHORT_BUILDER_VERSION}</small>
              <p>The deterministic cohort builder now admits only active securities whose PHARMA_V1 assignment resolves to a reviewed Domestic Formulations Primary on the evaluation date. Target, inactive, unresolved and Primary-mismatched securities are excluded explicitly.</p>
              <span>Same reviewed Primary: ENFORCED · Unresolved assignments: EXCLUDED · Provider peers: NOT USED</span>
            </article>
            <article>
              <strong>G6.10 · Minimum-comparability boundary</strong>
              <small>Peer universe can be built, but score readiness remains blocked</small>
              <p>No minimum peer count, comparable-evidence threshold, aggregation statistic, outlier rule or premium/discount curve is approved yet. Eligible peers can be identified without pretending the cohort is score-ready.</p>
              <span>Minimum peer count: UNAPPROVED · Numeric peer curve: NO · Whole dimension ready: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.11 · Peer minimum-comparability contract</strong>
              <small>{PHARMA_DOMESTIC_PEER_COMPARABILITY.contractVersion}</small>
              <p>Domestic Formulations peer-relative Valuation now has a proposal-only minimum cohort contract: at least three comparable peers are required, with five preferred. Fewer than three comparable peers fails closed as insufficient evidence.</p>
              <span>Minimum peers: 3 · Preferred: 5 · Missing peers: FAIL CLOSED</span>
            </article>
            <article>
              <strong>G6.11 · Median aggregation boundary</strong>
              <small>PE_TTM and EV_EBITDA aggregated independently</small>
              <p>Comparable peer multiples use a median with no hidden winsorization. Both PE and EV/EBITDA cohorts must satisfy comparability before the full peer-relative component can be considered complete; premium/discount bands and metric weights remain unapproved.</p>
              <span>Aggregation: MEDIAN · Winsorization: NO · Numeric peer curve: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.12 · Peer premium/discount normalization</strong>
              <small>{PHARMA_DOMESTIC_PEER_PREMIUM_DISCOUNT.proposalVersion}</small>
              <p>Domestic Formulations peer-relative Valuation now has a proposal-only calculation convention for PE_TTM and EV_EBITDA: peer median divided by target multiple minus one, expressed as a percentage. Positive values mean discount; negative values mean premium.</p>
              <span>≥25%: 100 · ≥10%: 80 · ≥-5%: 60 · ≥-20%: 40 · &lt;-20%: 20</span>
            </article>
            <article>
              <strong>G6.12 · Cross-metric combination boundary</strong>
              <small>PE and EV/EBITDA normalize independently</small>
              <p>No averaging or weighting between PE and EV/EBITDA is approved yet. G6.12 can normalize each comparable metric family, but it cannot emit a combined peer-component score or activate the Valuation dimension.</p>
              <span>PE/EV weighting: NO · Combined peer score: NO · Whole dimension ready: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.13 · Peer cross-metric combination lock</strong>
              <small>{PHARMA_DOMESTIC_PEER_COMBINATION.contractVersion}</small>
              <p>Both normalized PE_TTM and EV_EBITDA peer-relative scores are required before the Domestic peer component can advance. Neither metric may silently substitute for the other, and missing/invalid input fails closed.</p>
              <span>Both metrics: REQUIRED · Single-metric fallback: NO · Missing input: FAIL CLOSED</span>
            </article>
            <article>
              <strong>G6.13 · Explicit weighting blocker</strong>
              <small>No approved PE-vs-EV/EBITDA combination rule exists yet</small>
              <p>Equal weighting, weighted mean, best-of, worst-of and single-metric fallback are all unapproved. Even with both normalized inputs present, the state is only ready for an explicit weighting decision and the combined peer score remains null.</p>
              <span>PE weight: NONE · EV/EBITDA weight: NONE · Combined peer score: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.14 · Peer weighting approval gate</strong>
              <small>{PHARMA_DOMESTIC_PEER_WEIGHTING_GATE.contractVersion}</small>
              <p>No canonical PE-vs-EV/EBITDA weight exists yet. Both normalized inputs may be structurally ready, but any weighting rule must be explicitly versioned and owner-approved before a combined Domestic peer score can exist.</p>
              <span>PE weight: NONE · EV/EBITDA weight: NONE · Explicit approval: REQUIRED</span>
            </article>
            <article>
              <strong>G6.14 · No implicit 50/50 rule</strong>
              <small>Equal weighting is a methodology decision, not a default</small>
              <p>A candidate pair such as 50/50 may be structurally valid because the weights sum to one, but it remains unapproved. Hidden defaults, single-metric fallback and unversioned weighting are prohibited.</p>
              <span>Equal-weight default: NO · Hidden default: NO · Combined peer score: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.15 · Peer combined score — 50/50 approved</strong>
              <small>{PHARMA_DOMESTIC_PEER_COMBINED_SCORE.contractVersion}</small>
              <p>The owner-approved starting methodology combines normalized PE_TTM and EV_EBITDA peer-relative scores at 50% each. Both inputs remain mandatory; missing or invalid input fails closed and no single-metric fallback is allowed.</p>
              <span>PE: 50% · EV/EBITDA: 50% · Hidden reweighting: NO · Active scoring: NO</span>
            </article>
            <article>
              <strong>G6.15 · Mandatory weighting revisit triggers</strong>
              <small>50/50 is approved as a starting methodology, not a silent permanent default</small>
              <p>Revisit the weighting if backtesting later shows material PE-vs-EV/EBITDA score divergence, or if meaningfully different peer leverage enters the Domestic cohort, such as an M&amp;A-funded entrant or materially different net-debt profile.</p>
              <span>Backtest divergence: REVIEW · Leverage heterogeneity: REVIEW · Numeric divergence threshold: NOT APPROVED</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.16 · Valuation component weighting gate</strong>
              <small>{PHARMA_DOMESTIC_VALUATION_WEIGHTING_GATE.contractVersion}</small>
              <p>The three Domestic Valuation components are now methodology-ready, but no canonical split exists across self-history, peer-relative and FCF-yield corroboration. Any final component weighting must be explicitly versioned and owner-approved.</p>
              <span>Self-history: NONE · Peer-relative: NONE · FCF corroboration: NONE · Approval: REQUIRED</span>
            </article>
            <article>
              <strong>G6.16 · No implicit equal-thirds rule</strong>
              <small>Missing evidence must not silently rewrite the Valuation methodology</small>
              <p>Equal thirds are not assumed, and missing-component renormalization is prohibited. A candidate such as 40/40/20 may be structurally valid, but it remains unapproved until an explicit methodology decision is made.</p>
              <span>Equal-thirds default: NO · Missing-component renormalization: NO · Whole dimension ready: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.17 · Domestic Valuation combined score — 40/40/20 approved</strong>
              <small>{PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE.contractVersion}</small>
              <p>The owner-approved Domestic Formulations Valuation methodology weights self-history at 40%, peer-relative at 40%, and FCF-yield corroboration at 20%. All three components are mandatory; missing input fails closed with no renormalization.</p>
              <span>Self-history: 40% · Peer-relative: 40% · FCF corroboration: 20% · Active scoring: NO</span>
            </article>
            <article>
              <strong>G6.17 · Valuation revisit & upstream dependency</strong>
              <small>Peer-relative 40% inherits the G6.15 PE/EV-EBITDA 50/50 contract</small>
              <p>Revisit 40/40/20 if the three components persistently disagree, FCF becomes structurally distorted by capex/M&amp;A cycles, or peer comparability materially becomes weaker or stronger. No automatic disagreement threshold is approved yet.</p>
              <span>G6.15 inheritance: YES · Three revisit triggers: YES · Hidden reweighting: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.18 · Global Generics US price-erosion curve</strong>
              <small>{PHARMA_GLOBAL_GENERIC_PRICE_EROSION_CURVE.proposalVersion}</small>
              <p>Global Generics now has a proposal-only price-pressure curve for disclosed US generic ASP/price erosion. Level carries 70% and trend 30%; lower erosion is better and residual inference from revenue/volume is prohibited.</p>
              <span>Level: 70% · Trend: 30% · Minimum history: 4 quarters · Activation: NO</span>
            </article>
            <article>
              <strong>G6.18 · Global-only evidence boundary</strong>
              <small>Mandatory Global Generics Growth evidence · no Domestic threshold reuse</small>
              <p>Price erosion remains separate from Export/US Revenue Growth. Strong growth cannot erase severe pricing pressure, and improved pricing cannot substitute for missing growth evidence.</p>
              <span>Disclosed ASP/price evidence: REQUIRED · Residual derivation: NO · Cross-subprofile reuse: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.19 · Global Generics pipeline evidence contract</strong>
              <small>{PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE.contractVersion}</small>
              <p>Mandatory Global Generics durability evidence must identify the product or molecule, geography, dated stage, materiality, economic relevance and source. Filing, tentative approval, final approval, launch and commercial traction remain distinct states.</p>
              <span>Minimum material events: 1 · Preferred: 4 · Materiality: REQUIRED · Numeric curve: NO</span>
            </article>
            <article>
              <strong>G6.19 · Count-only scoring blocker</strong>
              <small>Approval and launch counts are evidence, not automatic durability scores</small>
              <p>More approvals or launches do not automatically mean a stronger score. Delayed, blocked, withdrawn and discontinued events remain in the evidence history, and regulatory-site penalties stay outside this contract to avoid double-counting.</p>
              <span>Approval count auto-positive: NO · Launch count auto-positive: NO · Regulatory double-counting: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.20 · Global Generics pipeline stage normalization</strong>
              <small>{PHARMA_GLOBAL_GENERICS_PIPELINE_STAGE_NORMALIZATION.contractVersion}</small>
              <p>Each sufficiently identified material pipeline event now has a proposal-only stage normalization. Filing, tentative approval, final approval, launch, confirmed commercial traction and adverse states remain economically distinct.</p>
              <span>Filed: 40 · Tentative: 55 · Final: 70 · Launched: 85 · Traction: 100</span>
            </article>
            <article>
              <strong>G6.20 · Multi-event aggregation blocker</strong>
              <small>Materiality is a gate, not an invented multiplier</small>
              <p>Delayed/blocked scores 20 and withdrawn/discontinued scores 0, but multiple event scores are not yet averaged, medianed or recency-weighted. Unrelated successes cannot silently cancel adverse material events.</p>
              <span>Materiality multiplier: NO · Event-count bonus: NO · Combined pipeline score: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.21 · Multi-event pipeline aggregation approval gate</strong>
              <small>{PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_GATE.contractVersion}</small>
              <p>All material events may be individually normalized, but no combined pipeline method is approved yet. Median, weighted mean, adverse floor/cap and any alternative remain candidate decisions rather than defaults.</p>
              <span>Approved aggregation method: NONE · Combined pipeline score: NO · Activation: NO</span>
            </article>
            <article>
              <strong>G6.21 · Adverse visibility & offset boundary</strong>
              <small>Five methodology decisions remain explicitly approval-gated</small>
              <p>Every adverse event must remain visible. Event-count bonuses, simple averaging, recency weighting, materiality weighting and numeric economic-relevance multipliers remain unapproved, and unrelated positive events cannot silently offset adverse events.</p>
              <span>Adverse visibility: REQUIRED · Hidden offset: NO · Methodology approval: REQUIRED</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.22 · Pipeline aggregation method proposal</strong>
              <small>{PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL.proposalVersion}</small>
              <p>Proposed method: keep the latest reviewed state for each product/molecule + geography identity, then use the median only when every latest state is non-adverse. Older lifecycle stages remain visible for audit but do not get counted repeatedly.</p>
              <span>Latest state per identity: YES · Non-adverse statistic: MEDIAN · Owner approval: PENDING</span>
            </article>
            <article>
              <strong>G6.22 · Adverse-state review rule</strong>
              <small>Delayed/blocked or withdrawn/discontinued latest state blocks numeric aggregation</small>
              <p>If any distinct pipeline identity has an adverse latest material state, the proposal returns REVIEW REQUIRED rather than applying an invented numeric cap or allowing other successes to offset it. Recency has no age-based weight, and materiality/economic relevance remain eligibility-only.</p>
              <span>Adverse latest state: REVIEW REQUIRED · Recency weight: NO · Executable combiner: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.23 · Combined pipeline score contract</strong>
              <small>{PHARMA_GLOBAL_GENERICS_PIPELINE_COMBINED_SCORE.contractVersion}</small>
              <p>The owner-approved G6.22 method is now encoded deterministically: collapse each product/molecule + geography history to its latest reviewed state and take the median only when all latest states are non-adverse.</p>
              <span>Methodology: OWNER APPROVED · Combined score function: PRESENT · Activation: NO</span>
            </article>
            <article>
              <strong>G6.23 · Fail-closed combined-score boundary</strong>
              <small>Contradictory or adverse latest states produce no numeric aggregate</small>
              <p>Any ineligible event, same-date contradictory latest state, or latest delayed/blocked/withdrawn/discontinued identity returns REVIEW REQUIRED with a null combined score. Historical lifecycle states remain auditable and are not repeatedly counted.</p>
              <span>Adverse offset: NO · Persisted score run: NO · Recommendation impact: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.24 · Global Generics regulatory-site treatment lock</strong>
              <small>{PHARMA_GLOBAL_GENERICS_REGULATORY_SITE_TREATMENT.contractVersion}</small>
              <p>Regulatory-site evidence remains mandatory where regulated export exposure exists, but G4 stays authoritative for block, review and high-risk states. The Risk dimension may surface that context without applying a second hidden deduction.</p>
              <span>G4 authority: PRESERVED · Regulatory numeric score: NO · Double-counting: NO</span>
            </article>
            <article>
              <strong>G6.24 · Risk-dimension separation boundary</strong>
              <small>Regulatory context visible · market drawdown/volatility methodology still incomplete</small>
              <p>Official facility/product/geography evidence and remediation history remain required. Single-site closeout cannot imply company-wide clearance, missing regulatory evidence cannot become neutral, and the whole Global Generics Risk dimension remains not ready.</p>
              <span>Whole Risk dimension ready: NO · Market-risk bands: PENDING · Activation: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.25 · Global Generics market-risk normalization gate</strong>
              <small>{PHARMA_GLOBAL_GENERICS_MARKET_RISK_NORMALIZATION_GATE.contractVersion}</small>
              <p>Trailing 1-year drawdown and annualized 1-year volatility now have explicit evidence identities and authority contracts, but no Pharma numeric bands are approved. BANK/NBFC thresholds are not inherited.</p>
              <span>Drawdown bands: NO · Volatility bands: NO · BANK thresholds inherited: NO</span>
            </article>
            <article>
              <strong>G6.25 · Benchmark & weighting blocker</strong>
              <small>Structurally valid evidence can become methodology-ready without becoming score-ready</small>
              <p>Volatility still requires an approved Pharma peer/benchmark context, no benchmark has been selected, component weights remain unapproved, and missing market-risk evidence cannot become neutral.</p>
              <span>Benchmark: PENDING · Component weights: PENDING · Whole Risk dimension ready: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.26 · Global Generics drawdown method approval gate</strong>
              <small>{PHARMA_GLOBAL_GENERICS_DRAWDOWN_METHOD_GATE.contractVersion}</small>
              <p>Five drawdown-normalization approaches are now explicitly reviewable—absolute bands, same-subprofile peer-relative, benchmark-relative, self-history-relative, or a versioned hybrid—but none is approved by default.</p>
              <span>Approved method: NONE · Owner approval: REQUIRED · Numeric drawdown curve: NO</span>
            </article>
            <article>
              <strong>G6.26 · No silent market-risk default</strong>
              <small>Each candidate method has an evidence prerequisite</small>
              <p>Absolute bands require empirical Pharma evidence, peer-relative requires a reviewed Global Generics cohort, benchmark-relative requires an approved Pharma benchmark, and hybrid weighting must be explicit and versioned.</p>
              <span>BANK bands inherited: NO · Silent benchmark: NO · Hidden hybrid weighting: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.27 · Drawdown evidence sufficiency / deferral gate</strong>
              <small>{PHARMA_GLOBAL_GENERICS_DRAWDOWN_EVIDENCE_SUFFICIENCY.contractVersion}</small>
              <p>Current repository evidence does not yet satisfy the prerequisite for any G6.26 drawdown method. Numeric drawdown normalization is therefore deferred rather than forced.</p>
              <span>Eligible methods now: NONE · Approved method: NONE · Numeric curve: NO</span>
            </article>
            <article>
              <strong>G6.27 · Explicit drawdown blockers</strong>
              <small>Each candidate remains blocked for a named evidence reason</small>
              <p>Empirical Pharma bands, a reviewed Global Generics cohort, an approved Pharma benchmark and sufficient comparable self-history are all still missing; a hybrid cannot exist until at least two methods become eligible.</p>
              <span>Deferral required: YES · BANK fallback: NO · Whole Risk dimension ready: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.28 · Global Generics volatility context method gate</strong>
              <small>{PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_METHOD_GATE.contractVersion}</small>
              <p>Volatility requires context by contract, so standalone absolute bands are excluded. Candidate approaches are reviewed same-subprofile peers, an approved Pharma benchmark, self-history with external corroboration, or an explicitly versioned hybrid.</p>
              <span>Absolute-only scoring: NO · Approved method: NONE · Owner approval: REQUIRED</span>
            </article>
            <article>
              <strong>G6.28 · Context prerequisite blocker</strong>
              <small>No generic peer set or silent benchmark selection</small>
              <p>Peer-relative normalization requires a reviewed Global Generics cohort, benchmark-relative requires an approved Pharma benchmark, and self-history cannot stand alone without external context.</p>
              <span>BANK thresholds inherited: NO · Silent benchmark: NO · Numeric volatility curve: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.29 · Volatility context evidence sufficiency / deferral gate</strong>
              <small>{PHARMA_GLOBAL_GENERICS_VOLATILITY_CONTEXT_EVIDENCE_SUFFICIENCY.contractVersion}</small>
              <p>Current repository evidence does not satisfy any G6.28 context prerequisite. Numeric volatility normalization is therefore deferred rather than assigned an arbitrary peer set or benchmark.</p>
              <span>Eligible context methods: NONE · Approved method: NONE · Numeric curve: NO</span>
            </article>
            <article>
              <strong>G6.29 · Explicit volatility blockers</strong>
              <small>Context remains insufficient by contract</small>
              <p>No reviewed Global Generics peer cohort, approved Pharma benchmark, or sufficient self-history plus external context is established; a hybrid also remains unavailable.</p>
              <span>Deferral required: YES · Silent fallback: NO · Whole Risk dimension ready: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.30 · Global Generics operating-margin methodology boundary</strong>
              <small>{PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_METHOD_GATE.contractVersion}</small>
              <p>The parent Pharma methodology shape may be reused—8 comparable quarters minimum with level, stability and trend—but Domestic Formulations weights and score bands remain explicitly out of scope.</p>
              <span>Parent shape: REUSABLE · Domestic weights: NO · Domestic bands: NO</span>
            </article>
            <article>
              <strong>G6.30 · Global-specific calibration blocker</strong>
              <small>Structurally valid history can become method-ready without becoming score-ready</small>
              <p>Global Generics still needs its own component weights, level/stability/trend bands and final aggregation contract. Missing or unmatched operating-margin history continues to fail closed.</p>
              <span>Global weights: PENDING · Global bands: PENDING · Numeric curve ready: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.31 · Operating-margin calibration evidence sufficiency</strong>
              <small>{PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_CALIBRATION_EVIDENCE.contractVersion}</small>
              <p>The Global Generics methodology shape remains valid, but the repository does not yet contain a reviewed calibration set or evidence-backed weights/bands. Numeric calibration is therefore deferred.</p>
              <span>Calibration set: MISSING · Domestic fallback: NO · Numeric curve: NO</span>
            </article>
            <article>
              <strong>G6.31 · Explicit calibration blockers</strong>
              <small>No fabricated Global Generics thresholds</small>
              <p>A reviewed same-primary cohort, level/stability/trend band evidence and component-weight evidence are all still absent. The slice remains intentionally fail-closed rather than importing Domestic Formulations calibration.</p>
              <span>Deferral required: YES · Score execution: NO · Activation: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.32 · Global Generics ROCE methodology boundary</strong>
              <small>{PHARMA_GLOBAL_GENERICS_ROCE_METHOD_GATE.contractVersion}</small>
              <p>The parent ROCE evidence shape is reusable—3 annual periods minimum, 5 preferred, with level, stability and trend—but Global Generics still has no approved weights or numeric bands.</p>
              <span>Parent shape: REUSABLE · Global weights: PENDING · Global bands: PENDING</span>
            </article>
            <article>
              <strong>G6.32 · Capital-efficiency alignment blocker</strong>
              <small>Parent dimension reconciliation is still required</small>
              <p>The existing ROCE parent proposal still flags a versioned dimension-alignment reconciliation requirement. G6.32 preserves that blocker and does not silently inherit universal or other-subprofile thresholds.</p>
              <span>Parent reconciliation: REQUIRED · Numeric ROCE curve: NO · Score execution: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.33 · ROCE calibration evidence sufficiency</strong>
              <small>{PHARMA_GLOBAL_GENERICS_ROCE_CALIBRATION_EVIDENCE.contractVersion}</small>
              <p>No reviewed Global Generics ROCE calibration set, same-primary peer cohort or evidence-backed level/stability/trend bands and weights are established. Numeric calibration is therefore deferred.</p>
              <span>Calibration available: NO · Other-subprofile fallback: NO · Numeric curve: NO</span>
            </article>
            <article>
              <strong>G6.33 · Parent ROCE dimension alignment blocker</strong>
              <small>Current parent metric dimension: QUALITY · canonical ROCE dimension: CAPITAL EFFICIENCY</small>
              <p>The mismatch remains explicit and unresolved. A separate versioned parent-contract reconciliation is required before ROCE may contribute a numeric Capital Efficiency score.</p>
              <span>Parent reconciliation performed: NO · Deferral required: YES · Score execution: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.34 · Global Generics cash-conversion methodology boundary</strong>
              <small>{PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_METHOD_GATE.contractVersion}</small>
              <p>The parent Cash Conversion evidence shape is reusable—3 annual periods minimum, 5 preferred, matched CFO/PAT/capex-FCF periods, and capex-intensity context—but Global Generics still has no approved weights or numeric bands.</p>
              <span>Parent shape: REUSABLE · Global weights: PENDING · Global bands: PENDING</span>
            </article>
            <article>
              <strong>G6.34 · Cash-flow alignment blocker</strong>
              <small>Parent dimension reconciliation remains required</small>
              <p>The parent metric still sits in Earnings & Cash Quality while the canonical methodology targets Cash Flow. G6.34 preserves that mismatch and rejects universal or other-subprofile threshold fallback.</p>
              <span>Parent reconciliation: REQUIRED · Numeric cash-conversion curve: NO · Score execution: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.35 · Cash-conversion calibration evidence sufficiency</strong>
              <small>{PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_CALIBRATION_EVIDENCE.contractVersion}</small>
              <p>No reviewed Global Generics Cash Conversion calibration set, same-primary cohort or evidence-backed CFO-to-PAT / FCF / consistency bands and weights are established. Numeric calibration is therefore deferred.</p>
              <span>Calibration available: NO · Other-subprofile fallback: NO · Numeric curve: NO</span>
            </article>
            <article>
              <strong>G6.35 · Parent Cash Flow dimension alignment blocker</strong>
              <small>Current parent metric dimension: EARNINGS CASH QUALITY · canonical dimension: CASH FLOW</small>
              <p>The mismatch remains explicit and unresolved. A separate versioned parent-contract reconciliation is required before Cash Conversion may contribute a numeric Cash Flow score.</p>
              <span>Parent reconciliation performed: NO · Deferral required: YES · Score execution: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.36 · Global Generics balance-sheet methodology boundary</strong>
              <small>{PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_METHOD_GATE.contractVersion}</small>
              <p>The parent leverage evidence shape is reusable—3 annual periods minimum, 5 preferred, matched debt/cash/operating-earnings evidence, explicit net-cash treatment and acquisition context—but Global Generics still has no approved weights or bands.</p>
              <span>Parent shape: REUSABLE · Global weights: PENDING · Global bands: PENDING</span>
            </article>
            <article>
              <strong>G6.36 · Balance-sheet dimension alignment blocker</strong>
              <small>Parent dimension reconciliation remains required</small>
              <p>The parent metric remains in Financial Strength while the canonical leverage methodology targets Balance Sheet / Credit. G6.36 preserves that mismatch and rejects universal or other-subprofile threshold fallback.</p>
              <span>Parent reconciliation: REQUIRED · Numeric balance-sheet curve: NO · Score execution: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.37 · Balance-sheet calibration evidence sufficiency</strong>
              <small>{PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_CALIBRATION_EVIDENCE.contractVersion}</small>
              <p>No reviewed Global Generics Balance Sheet calibration set, same-primary cohort or evidence-backed leverage, interest-coverage, trend/resilience bands and weights are established. Numeric calibration is therefore deferred.</p>
              <span>Calibration available: NO · Other-subprofile fallback: NO · Numeric curve: NO</span>
            </article>
            <article>
              <strong>G6.37 · Parent Balance Sheet / Credit alignment blocker</strong>
              <small>Current parent metric dimension: FINANCIAL STRENGTH · canonical dimension: BALANCE SHEET / CREDIT</small>
              <p>The mismatch remains explicit and unresolved. A separate versioned parent-contract reconciliation is required before leverage may contribute a numeric Balance Sheet / Credit score.</p>
              <span>Parent reconciliation performed: NO · Deferral required: YES · Score execution: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.38 · Global Generics valuation methodology boundary</strong>
              <small>{PHARMA_GLOBAL_GENERICS_VALUATION_METHOD_GATE.contractVersion}</small>
              <p>The parent valuation shape is reusable—self-history, peer-relative and FCF corroboration using PE, EV/EBITDA and FCF yield—but Domestic Formulations calibration does not transfer.</p>
              <span>Parent dimension: ALIGNED · Domestic 40/40/20: NO · Domestic peer 50/50: NO</span>
            </article>
            <article>
              <strong>G6.38 · Global-specific valuation calibration blocker</strong>
              <small>No hidden reweighting or missing-component renormalization</small>
              <p>Global Generics still requires its own component weights, self-history bands, peer metric mix, peer-relative bands, FCF corroboration method and final aggregation contract.</p>
              <span>Global weights: PENDING · Global bands: PENDING · Numeric valuation curve: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.39 · Valuation calibration evidence sufficiency</strong>
              <small>{PHARMA_GLOBAL_GENERICS_VALUATION_CALIBRATION_EVIDENCE.contractVersion}</small>
              <p>No reviewed Global Generics valuation calibration set, same-primary peer cohort, self-history basis, FCF corroboration method, component weights or final aggregation are established. Numeric valuation is therefore deferred.</p>
              <span>Calibration available: NO · Domestic fallback: NO · Numeric curve: NO</span>
            </article>
            <article>
              <strong>G6.39 · Explicit valuation blockers</strong>
              <small>Parent methodology valid · Global calibration missing</small>
              <p>The parent Valuation dimension is aligned, but Global Generics still lacks an approved peer metric mix, peer-relative bands and component aggregation. Missing-component renormalization and hidden reweighting remain prohibited.</p>
              <span>Deferral required: YES · Hidden fallback: NO · Score execution: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.40 · Global Generics ownership / governance methodology boundary</strong>
              <small>{PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_METHOD_GATE.contractVersion}</small>
              <p>The parent evidence shape is reusable—4 shareholding quarters minimum, 8 preferred, latest ownership data plus current material governance-event review—but Global Generics has no approved weights or numeric bands.</p>
              <span>Parent shape: REUSABLE · Mechanical ownership shortcuts: NO · Numeric curve: NO</span>
            </article>
            <article>
              <strong>G6.40 · Governance alignment and anti-double-counting blocker</strong>
              <small>Parent dimension reconciliation required · G4 remains authoritative for blocking/high-risk events</small>
              <p>The parent metric still sits in Governance while the methodology targets Ownership / Governance. G4 events may remain visible as context, but no second hidden penalty or additional gate cap is allowed inside this dimension.</p>
              <span>Parent reconciliation: REQUIRED · Hidden G4 penalty: NO · Score execution: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.41 · Ownership / governance calibration evidence sufficiency</strong>
              <small>{PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_CALIBRATION_EVIDENCE.contractVersion}</small>
              <p>No reviewed Global Generics ownership/governance calibration set, same-primary ownership cohort, evidence-backed ownership/pledge/event bands, component weights or final aggregation are established. Numeric calibration is therefore deferred.</p>
              <span>Calibration available: NO · Mechanical shortcuts: NO · Numeric curve: NO</span>
            </article>
            <article>
              <strong>G6.41 · Parent alignment and G4 double-counting lock</strong>
              <small>Current parent dimension: GOVERNANCE · canonical dimension: OWNERSHIP / GOVERNANCE</small>
              <p>The parent mismatch remains unresolved and G4 remains authoritative for blocked/high-risk governance or regulatory events. No second hidden penalty or extra gate cap may be introduced here.</p>
              <span>Parent reconciliation performed: NO · G4 anti-double-counting: LOCKED · Score execution: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.42 · Global Generics momentum methodology boundary</strong>
              <small>{PHARMA_GLOBAL_GENERICS_MOMENTUM_METHOD_GATE.contractVersion}</small>
              <p>The evidence identity is defined for 12-month momentum, 6-month momentum and 12-month relative strength, but a dedicated Pharma parent Momentum contract and approved Pharma benchmark are still missing.</p>
              <span>Parent contract: MISSING · Pharma benchmark: UNAPPROVED · Numeric curve: NO</span>
            </article>
            <article>
              <strong>G6.42 · BANK pilot separation</strong>
              <small>No BANK_NBFC weights, NIFTY BANK benchmark or provider technical score may leak into Pharma</small>
              <p>Global Generics still requires its own component weights, momentum bands, relative-strength bands, approved benchmark and final aggregation. Missing relative strength cannot silently become neutral.</p>
              <span>BANK inheritance: NO · Global calibration: PENDING · Score execution: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.43 · Momentum parent-contract / benchmark evidence sufficiency</strong>
              <small>{PHARMA_GLOBAL_GENERICS_MOMENTUM_EVIDENCE_SUFFICIENCY.contractVersion}</small>
              <p>The Momentum evidence identity is valid, but the repository still lacks a dedicated Pharma parent Momentum contract, an approved Pharma benchmark, Global-specific calibration bands, weights and final aggregation.</p>
              <span>Parent contract: NO · Approved benchmark: NO · Whole Momentum dimension: NOT READY</span>
            </article>
            <article>
              <strong>G6.43 · Explicit Momentum deferral</strong>
              <small>No benchmark-by-analogy and no hidden BANK fallback</small>
              <p>NIFTY BANK, BANK_NBFC momentum weights and provider technical scores remain ineligible for Pharma. Relative strength cannot be scored until a Pharma benchmark is explicitly approved.</p>
              <span>Deferral required: YES · BANK fallback: NO · Score execution: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.44 · Global Generics G6 coverage closure audit</strong>
              <small>{PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW.contractVersion}</small>
              <p>All 10 canonical Global Generics G6 families now have an explicit methodology outcome. Two have validated numeric curves not active; the other eight remain validated fail-closed.</p>
              <span>Canonical families: 10/10 · G6 methodology coverage: COMPLETE · Score execution: NO</span>
            </article>
            <article>
              <strong>G6.44 · Applicability registry reconciliation required</strong>
              <small>Seven Global Generics registry entries still show threshold work as pending</small>
              <p>The shared pending-parent-family representation now lags the validated Global Generics outcomes. G7 remains blocked until a narrow registry-only reconciliation is validated without changing other Pharma subprofiles.</p>
              <span>Stale registry families: 7 · Registry reconciliation: REQUIRED · G7 eligible: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G6.45 · Global Generics applicability registry reconciliation</strong>
              <small>{PHARMA_GLOBAL_GENERICS_APPLICABILITY_REGISTRY_RECONCILIATION.contractVersion}</small>
              <p>The registry now has an explicit VALIDATED_FAIL_CLOSED state for Global Generics methodology outcomes that are validated but intentionally lack an approved numeric curve. The change is scoped to Global Generics only.</p>
              <span>Validated not active: 2 · Validated fail-closed: 8 · Other primaries changed: NO</span>
            </article>
            <article>
              <strong>G6.45 · Validation and G7 boundary</strong>
              <small>Registry aligned by proposal · Owner validation still required</small>
              <p>VALIDATED_FAIL_CLOSED never creates a score, zero, neutral value or hidden reweighting. G7 remains blocked until this reconciliation passes focused tests, lint, typecheck, build and visual inspection.</p>
              <span>Score execution: NO · Owner validation: PENDING · G7 eligible now: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G7-P1 · Material Overlay numeric modifier proposal</strong>
              <small>{PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.version}</small>
              <p>Candidate formula scales the one combined per-dimension cap by reviewed economic share, evidence completeness, confidence and normalized overlay signal. Only READY Material Overlays may produce a proposed numeric modifier.</p>
              <span>Combined cap candidate: ±{PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.combinedPerDimensionCapPoints} points · Empirically calibrated: NO</span>
            </article>
            <article>
              <strong>G7-P1 · Validation & consumption boundary</strong>
              <small>Proposal only · G7.1 consumption remains blocked</small>
              <p>PARTIAL, insufficient, blocked or Emerging Watch states stay non-numeric. Independent cap stacking remains prohibited, and the proposal cannot be consumed by the G7.1 adapter until owner validation is recorded.</p>
              <span>Owner validation: REQUIRED · G7.1 consumption approved: NO · Score execution: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G7-P2 · Governance high-risk constraint</strong>
              <small>{PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT.version}</small>
              <p>G4 blocking behavior is preserved. HIGH_RISK remains non-blocking and Interpretation-only because no defensible Pharma numeric cap is established; no extra Quality, Risk or overall score penalty is invented.</p>
              <span>HIGH_RISK numeric cap: NONE · Hidden double counting: NO</span>
            </article>
            <article>
              <strong>G7-P2 · Blocking & anti-double-counting boundary</strong>
              <small>Proposal only · G7.1 consumption remains blocked</small>
              <p>BLOCKED_REVIEW and CRITICAL states still block the overall preview. REVIEW_REQUIRED stays non-numeric. The same governance/regulatory event cannot simultaneously create multiple hidden deductions.</p>
              <span>Owner validation: REQUIRED · G7.1 consumption approved: NO · Score execution: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G7.1 · Read-only scoring adapter</strong>
              <small>{PHARMA_G7_READ_ONLY_SCORING_ADAPTER.version}</small>
              <p>The pure adapter calculates only from approved numeric dimension results, applies validated overlay/governance contracts, preserves fixed Pharma weights and never persists a score.</p>
              <span>Read-only: YES · Persistence: NO · Hidden reweighting: NO</span>
            </article>
            <article>
              <strong>G7.1 · Fail-closed aggregation boundary</strong>
              <small>60% readiness is a gate, not a missing-component formula</small>
              <p>A readiness-passing dimension still needs a versioned numeric dimension-score contract. Missing methodology never becomes zero or neutral, and any unavailable weighted dimension blocks the overall preview instead of renormalizing the rest.</p>
              <span>Overall score with missing weighted dimension: NO · G7.2 wiring: NOT STARTED</span>
            </article>
          </div>
          {g7TorntpharmPreview ? <div className="pharma-g7-preview">
            <div className="pharma-g7-preview-head">
              <div>
                <strong>G7.2 · TORNTPHARM explainable read-only preview</strong>
                <small>{g7TorntpharmPreview.contractVersion}</small>
              </div>
              <span>Overall Pharma score: Not currently computable</span>
            </div>
            <div className="pharma-g7-preview-meta">
              <span>Primary: Domestic Formulations</span>
              <span>Material Overlay: Global Generics</span>
              <span>Emerging Watch: CDMO / CRAMS</span>
              <span>Governance runtime input: UNRESOLVED</span>
            </div>
            <div className="pharma-g7-preview-table-wrap">
              <table className="pharma-g7-preview-table">
                <thead>
                  <tr>
                    <th>Dimension</th>
                    <th>Primary evidence</th>
                    <th>Methodology</th>
                    <th>Overlay</th>
                    <th>Final state</th>
                  </tr>
                </thead>
                <tbody>
                  {g7TorntpharmPreview.rows.map((row) => <tr key={row.dimensionCode}>
                    <td>{titleCase(row.dimensionCode)}</td>
                    <td>{row.primaryEvidenceTotal > 0 ? `${row.primaryEvidenceVerified}/${row.primaryEvidenceTotal} verified` : "No dimension evidence set"}</td>
                    <td>{titleCase(row.methodologyState)}</td>
                    <td>{row.overlayState === "NONE" ? "Not applicable" : titleCase(row.overlayState)}</td>
                    <td>{row.finalScore === null ? titleCase(row.calculationState) : `${row.finalScore.toFixed(1)} / 100`}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
            <p className="pharma-g7-preview-note">No score is manufactured from evidence coverage alone. Missing methodology, missing dimension aggregation, unresolved overlay inputs or unresolved governance runtime state remain explicit blockers; no hidden reweighting is used.</p>
          </div> : null}
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>G7.3 · Validation & leakage boundary</strong>
              <small>{PHARMA_G7_VALIDATION_INVARIANTS.version}</small>
              <p>Final G7 validation locks the read-only isolation rules: no hidden reweighting, no BANK_NBFC fallback, no Domestic threshold transfer, no Emerging Watch score leakage, no independent overlay-cap stacking and no hidden governance double counting.</p>
              <span>Score persistence: NO · Second overlay stock score: NO · Hidden reweighting: NO</span>
            </article>
            <article>
              <strong>G7.3 · Outstanding research register</strong>
              <small>{PHARMA_G7_RESEARCH_GAP_REGISTER.version}</small>
              <p>Unresolved scoring dependencies are registered instead of being hidden. TORNTPHARM blockers remain explicit; API/Bulk, CDMO/CRAMS and Biopharma/Biosimilars unresolved Primary methodology moves to controlled expansion.</p>
              <span>TORNTPHARM blockers: {PHARMA_G7_RESEARCH_GAP_REGISTER.torntpharmGaps.length} · Controlled-expansion gaps: {PHARMA_G7_RESEARCH_GAP_REGISTER.controlledExpansionGaps.length}</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>First proposed curve family</strong>
              <small>{PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL.proposalVersion}</small>
              <p>Segment growth uses 60% four-quarter median growth level, 25% positive-quarter consistency and 15% latest-versus-prior-three trend. The same methodology is proposed for Domestic Revenue Growth and Export / US Revenue Growth.</p>
              <span>Proposal only · Activation approved: NO</span>
            </article>
            <article>
              <strong>History & fail-closed boundary</strong>
              <small>Minimum 4 comparable reviewed quarters · preferred 8</small>
              <p>Latest period is mandatory. Rejected or scope-incompatible claims are excluded before normalization; a broken comparable series produces no score rather than a substituted value.</p>
              <span>Score execution: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>Second proposed curve family</strong>
              <small>{PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL.proposalVersion}</small>
              <p>Operating Margin Quality for Domestic Formulations V1 uses 50% eight-quarter median margin level, 30% margin stability and 20% four-quarter trend. It requires matched operating-revenue and operating-profit periods.</p>
              <span>Domestic Formulations only · Activation approved: NO</span>
            </article>
            <article>
              <strong>Margin curve fail-closed boundary</strong>
              <small>Minimum 8 comparable quarters · preferred 12</small>
              <p>Other primary Pharma subprofiles do not inherit these level bands. Unsupported subprofiles remain unscored until their own margin-level contract is versioned.</p>
              <span>Unsupported subprofiles: NO SCORE · Execution: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>Dimension weights</strong>
              <small>{gateGScoringProposal.proposalVersion}</small>
              <p>{gateGScoringProposal.dimensionWeights.map((item) => `${titleCase(item.dimensionCode)} ${item.weight}%`).join(" · ")}</p>
              <span>Existing PHARMA_V1 parent weights preserved</span>
            </article>
            <article>
              <strong>Execution boundary</strong>
              <small>Score execution remains disabled</small>
              <p>Numeric normalization curves, score-run persistence, recommendation logic and position sizing all remain outside this design checkpoint.</p>
              <span>Score run: NO · Recommendation: NO · Position sizing: NO</span>
            </article>
          </div>
        </section>
      </div>
    </details>

    <details className="pharma-deep-layer">
      <summary>
        <div><span>Business model & exposure map</span><small>Primary evidence lanes, material overlays and emerging watches</small></div>
        <b>Open details</b>
      </summary>
      <div className="pharma-workspace-grid">
      <article className="pharma-primary-card">
        <div className="pharma-primary-card-head">
          <div>
            <p className="eyebrow">Primary evidence lanes</p>
            <h3>{model.primary.displayName}</h3>
          </div>
          <span className="pharma-primary-pill">Primary · Reviewed</span>
        </div>
        <p className="pharma-workspace-intro">These are the business-model-specific requirements added or strengthened by the reviewed primary subprofile. They remain evidence requirements only; Gate G will define any future scoring curves.</p>
        <RequirementList items={model.primary.requirements} empty="No business-model-specific requirements are defined for this subprofile." />
      </article>

      <aside className="pharma-secondary-stack" aria-label="Reviewed secondary exposure overlays">
        <div className="pharma-secondary-heading">
          <p className="eyebrow">Secondary exposure overlays</p>
          <h3>What changes because of the reviewed exposures</h3>
        </div>
        {model.secondaries.length ? model.secondaries.map((exposure) => <SecondaryExposureCard key={exposure.exposureCode} exposure={exposure} />) : <p className="pharma-workspace-empty">No active reviewed secondary exposures.</p>}
      </aside>
      </div>
    </details>

    <details className="pharma-deep-layer pharma-evidence-operations">
      <summary>
        <div><span>Evidence operations & review controls</span><small>Ingestion dry-run, acquisition contract, source discovery, document planning and read-only review</small></div>
        <b>Open details</b>
      </summary>
      <div className="pharma-deep-layer-body">
    {evidencePilot ? <section className="pharma-evidence-pilot" aria-labelledby="pharma-evidence-pilot-title">
      <div className="pharma-evidence-pilot-head">
        <div>
          <p className="eyebrow">Gate F · Official evidence pilot</p>
          <h3 id="pharma-evidence-pilot-title">Evidence ingestion dry-run</h3>
          <p>Validated candidate observations are projected against the reviewed business-model requirements before any database write. Canonical financial-history evidence does not automatically satisfy subprofile-specific evidence contracts.</p>
        </div>
        <span className="pharma-workspace-lock">Dry-run · No write</span>
      </div>
      <div className="pharma-evidence-pilot-summary">
        <div><span>Candidate observations</span><strong>{evidencePilot.candidateCount}</strong><small>{evidencePilot.acceptedCount} validation-ready</small></div>
        <div><span>Direct official</span><strong>{evidencePilot.directOfficialCount}</strong><small>Issuer / official lineage</small></div>
        <div><span>PortfolioAI derived</span><strong>{evidencePilot.derivedCount}</strong><small>Formula + direct-input lineage required</small></div>
        <div><span>Quarantined</span><strong>{evidencePilot.quarantinedCount}</strong><small>Must be zero before an ingestion proposal</small></div>
      </div>
      <div className="pharma-evidence-impact">
        <div>
          <span>Projected subprofile completeness</span>
          <strong>{evidencePilot.countedRequirementReady}/{evidencePilot.countedRequirementTotal}</strong>
          <small>would meet minimum observation requirements from this manifest alone</small>
        </div>
        <div className="pharma-evidence-scope-list">
          {evidencePilot.scopes.map((scope) => <span key={scope.label}><strong>{scope.label}</strong>{scope.ready}/{scope.total} projected</span>)}
        </div>
      </div>
      <p className="pharma-evidence-pilot-note"><strong>Interpretation:</strong> this 42-row pilot is currently useful for canonical financial-history evidence, but it does not directly fulfill the 14 counted Domestic Formulations + Global Generics business-model requirements. Those requirements need their own approved evidence contracts and source observations.</p>
    </section> : null}
    {acquisitionPlan ? <section className="pharma-acquisition-plan" aria-labelledby="pharma-acquisition-plan-title">
      <div className="pharma-evidence-pilot-head">
        <div>
          <p className="eyebrow">Gate F · Business-model evidence contract</p>
          <h3 id="pharma-acquisition-plan-title">Evidence acquisition plan</h3>
          <p>The 14 unmet requirements now have explicit source, history, acquisition and fail-closed contracts. This is a planning manifest only: it does not fetch a source, call a licensed provider, or authorize ingestion.</p>
        </div>
        <span className="pharma-workspace-lock">Planned · No ingestion</span>
      </div>
      <div className="pharma-acquisition-summary">
        <div><span>Planned requirements</span><strong>{acquisitionPlan.summary.total}</strong><small>{acquisitionPlan.summary.mandatory} mandatory · {acquisitionPlan.summary.important} important · {acquisitionPlan.summary.supplementary} supplementary</small></div>
        <div><span>Public / official first</span><strong>{acquisitionPlan.summary.publicOfficialFirst}</strong><small>No paid provider required as the first acquisition lane</small></div>
        <div><span>Licensed-source gates</span><strong>{acquisitionPlan.summary.licensedRequired + acquisitionPlan.summary.publicOrLicensed}</strong><small>{acquisitionPlan.summary.licensedRequired} required · {acquisitionPlan.summary.publicOrLicensed} optional fallback</small></div>
        <div><span>Controlled derivations</span><strong>{acquisitionPlan.summary.derivedFromDisclosedInputs}</strong><small>Only from explicitly disclosed compatible inputs</small></div>
      </div>
      <div className="pharma-acquisition-grid">
        <section>
          <div className="pharma-secondary-heading"><p className="eyebrow">Primary model</p><h3>Domestic Formulations · 8 requirements</h3></div>
          <AcquisitionRequirementList items={acquisitionPlan.items.filter((item) => item.scope === "PRIMARY_MODEL")} />
        </section>
        <section>
          <div className="pharma-secondary-heading"><p className="eyebrow">Material overlay</p><h3>Global Generics · 6 requirements</h3></div>
          <AcquisitionRequirementList items={acquisitionPlan.items.filter((item) => item.scope === "MATERIAL_OVERLAY")} />
        </section>
      </div>
      <p className="pharma-evidence-pilot-note"><strong>Access boundary:</strong> Brand & Therapy Leadership requires an approved licensed market source. Chronic / Acute Mix may use issuer disclosure first and an approved licensed source only if needed. No licensed-source call is authorized by this contract.</p>
    </section> : null}

    {publicSourceDiscovery ? <section className="pharma-source-discovery" aria-labelledby="pharma-source-discovery-title">
      <div className="pharma-evidence-pilot-head">
        <div>
          <p className="eyebrow">Gate F · Public / official discovery</p>
          <h3 id="pharma-source-discovery-title">Public / official source discovery</h3>
          <p>Candidate issuer, listed-company and regulator artifacts are mapped to the 12 public/official-first requirements. Discovery is not evidence review: every requirement remains NOT REVIEWED until source content and history are examined.</p>
        </div>
        <span className="pharma-workspace-lock">Discovery only · No fetch</span>
      </div>
      <div className="pharma-source-discovery-summary">
        <div><span>Requirements in scope</span><strong>{publicSourceDiscovery.summary.scopedRequirements}</strong><small>{publicSourceDiscovery.summary.mappedRequirements} mapped to candidate sources</small></div>
        <div><span>Official artifacts</span><strong>{publicSourceDiscovery.summary.discoveredArtifacts}</strong><small>{publicSourceDiscovery.summary.issuerArtifacts} issuer/listed-company · {publicSourceDiscovery.summary.regulatorArtifacts} regulator</small></div>
        <div><span>Source hubs</span><strong>{publicSourceDiscovery.summary.sourceHubs}</strong><small>Used to enumerate history in the next review step</small></div>
        <div><span>Evidence reviewed</span><strong>0</strong><small>Discovery does not promote evidence state</small></div>
      </div>
      <div className="pharma-source-artifacts">
        {publicSourceDiscovery.artifacts.map((artifact) => <article key={artifact.code}>
          <div><strong>{artifact.title}</strong><small>{titleCase(artifact.sourceLane)} · {titleCase(artifact.kind)}</small></div>
          <span>{artifact.periodOrDate}</span>
        </article>)}
      </div>
      <div className="pharma-source-requirements">
        {publicSourceDiscovery.requirements.map((item) => <article key={item.metricCode}>
          <div className="pharma-source-requirement-head">
            <div><strong>{item.label}</strong><small>{item.scopeLabel} · {titleCase(item.requirementLevel)} · minimum {item.minimumObservations} / preferred {item.preferredObservations} {titleCase(item.historyUnit).toLocaleLowerCase()}</small></div>
            <span>Candidate source found</span>
          </div>
          <p>{item.candidateArtifactCodes.join(" · ")}</p>
          <small><strong>Gap:</strong> {item.gap}</small>
        </article>)}
      </div>
      <p className="pharma-evidence-pilot-note"><strong>Boundary:</strong> Brand & Therapy Leadership and Chronic / Acute Mix are intentionally excluded from this 12-row public/official-first dry run because their licensed-source gates remain separately controlled.</p>
    </section> : null}

    {artifactReviewPlan ? <section className="pharma-artifact-review-plan" aria-labelledby="pharma-artifact-review-title">
      <div className="pharma-evidence-pilot-head">
        <div>
          <p className="eyebrow">Gate F · Artifact-level review planning</p>
          <h3 id="pharma-artifact-review-title">Exact document review plan</h3>
          <p>Exact annual, quarterly, regulator and exchange documents are lined up for content review. Planning coverage is kept separate from reviewed evidence: no document has been reviewed into an evidence state yet.</p>
        </div>
        <span className="pharma-workspace-lock">Planning only · 0 reviewed</span>
      </div>
      <div className="pharma-artifact-review-summary">
        <div><span>Exact artifacts planned</span><strong>{artifactReviewPlan.summary.exactArtifactsPlanned}</strong><small>{artifactReviewPlan.summary.annualReports} annual · {artifactReviewPlan.summary.quarterlyReleases} quarterly · {artifactReviewPlan.summary.regulatorDocuments} regulator · {artifactReviewPlan.summary.exchangeFilings} exchange</small></div>
        <div><span>Requirements planned</span><strong>{artifactReviewPlan.summary.requirementsPlanned}</strong><small>{artifactReviewPlan.summary.minimumPlanningCovered} cover minimum planning horizon</small></div>
        <div><span>Preferred horizon covered</span><strong>{artifactReviewPlan.summary.preferredPlanningCovered}</strong><small>Candidate-document planning only</small></div>
        <div><span>Evidence reviewed</span><strong>{artifactReviewPlan.summary.evidenceReviewed}</strong><small>All rows remain NOT REVIEWED</small></div>
      </div>
      <div className="pharma-artifact-targets">
        {artifactReviewPlan.artifacts.map((artifact) => <article key={artifact.code}>
          <div><strong>{artifact.title}</strong><small>{titleCase(artifact.documentType)}</small></div>
          <span>{artifact.period}</span>
        </article>)}
      </div>
      <div className="pharma-artifact-requirements">
        {artifactReviewPlan.requirements.map((item) => <article key={item.metricCode}>
          <div className="pharma-source-requirement-head">
            <div>
              <strong>{item.label}</strong>
              <small>{item.scopeLabel} · minimum {item.minimumObservations} / preferred {item.preferredObservations} {titleCase(item.historyUnit).toLocaleLowerCase()}</small>
            </div>
            <span>{item.evidenceState.replaceAll("_", " ")}</span>
          </div>
          <div className="pharma-artifact-gap-grid">
            <span><strong>{item.planningCoverageCount}</strong> candidate docs</span>
            <span><strong>{item.minimumPlanningGap}</strong> minimum planning gap</span>
            <span><strong>{item.preferredPlanningGap}</strong> preferred planning gap</span>
            <span><strong>{item.minimumReviewedEvidenceGap}</strong> reviewed-evidence gap</span>
          </div>
          <p>{item.artifactReviews.map((review) => `${review.artifactCode} · ${review.relevance === "LIKELY_RELEVANT" ? "Likely" : "Possible"}`).join(" | ")}</p>
        </article>)}
      </div>
      <p className="pharma-evidence-pilot-note"><strong>Interpretation:</strong> 12/12 public/official-first requirements now have enough exact candidate documents to cover their minimum planning horizon, but that does not satisfy any evidence requirement. Content review, compatibility checks and freshness review remain outstanding for every row.</p>
    </section> : null}

    {contentReviewDryRun ? <section className="pharma-content-review-dry-run" aria-labelledby="pharma-content-review-title">
      <div className="pharma-evidence-pilot-head">
        <div>
          <p className="eyebrow">Gate F · Read-only content review</p>
          <h3 id="pharma-content-review-title">Public document content-review dry-run</h3>
          <p>Six public/official artifacts have been inspected in read-only mode. Proposed candidates and rejected claims remain outside canonical evidence storage and no ingestion write is authorized.</p>
        </div>
        <span className="pharma-workspace-lock">Read-only · No ingestion</span>
      </div>
      <div className="pharma-content-review-summary">
        <div><span>Artifacts reviewed</span><strong>{contentReviewDryRun.summary.reviewedArtifacts}</strong><small>4 issuer quarterlies · 2 FDA regulator documents</small></div>
        <div><span>Proposed candidates</span><strong>{contentReviewDryRun.summary.proposedCandidates}</strong><small>4 US-growth observations · 2 Indrad regulator events</small></div>
        <div><span>Rejected claims</span><strong>{contentReviewDryRun.summary.rejectedClaims}</strong><small>Scope-incompatible claim kept out of candidate history</small></div>
        <div><span>Ingestion writes</span><strong>{contentReviewDryRun.summary.ingestionWrites}</strong><small>Nothing promoted to canonical evidence</small></div>
      </div>

      <div className="pharma-content-review-grid">
        {contentReviewDryRun.requirementResults.map((result) => <article key={result.metricCode}>
          <div className="pharma-source-requirement-head">
            <div>
              <strong>{result.metricCode === "PHARMA_EXPORT_US_REVENUE_GROWTH" ? "Export / US Revenue Growth" : "Regulatory Site Status"}</strong>
              <small>{result.proposedObservationCount} proposed observations · minimum {result.minimumRequired}</small>
            </div>
            <span>{titleCase(result.proposalState)}</span>
          </div>
          <p>{result.remainingGap}</p>
        </article>)}
      </div>

      <div className="pharma-content-review-candidates">
        {contentReviewDryRun.proposedCandidates.map((candidate) => <article key={candidate.artifactCode + candidate.observationDate + candidate.value}>
          <div>
            <strong>{candidate.metricCode === "PHARMA_EXPORT_US_REVENUE_GROWTH" ? "US revenue growth" : "Indrad regulator event"}</strong>
            <small>{candidate.observationDate} · {candidate.artifactCode}</small>
          </div>
          <span>{candidate.unit === "PERCENT" ? `${candidate.value}%` : titleCase(candidate.value)}</span>
          <p>{candidate.basis}</p>
          <small>{candidate.provenanceSummary}</small>
        </article>)}
      </div>

      {contentReviewDryRun.rejectedClaims.map((rejected) => <article className="pharma-content-review-rejection" key={rejected.artifactCode + rejected.claim}>
        <div><strong>Rejected from comparable series</strong><span>{rejected.claim}</span></div>
        <p>{rejected.reason}</p>
      </article>)}

      <p className="pharma-evidence-pilot-note"><strong>Boundary:</strong> proposed candidates are review outputs only. Regulatory Site Status remains partial-scope because only the Indrad warning/closeout chain has been reviewed, and no company-wide current regulatory-clearance claim is made.</p>
    </section> : null}


    {ingestionProposal ? <section className="pharma-ingestion-proposal" aria-labelledby="pharma-ingestion-proposal-title">
      <div className="pharma-evidence-pilot-head">
        <div>
          <p className="eyebrow">Gate F · Candidate-to-ingestion proposal</p>
          <h3 id="pharma-ingestion-proposal-title">Ingestion eligibility proposal</h3>
          <p>Reviewed candidates are projected against the current canonical ingestion contracts. This section identifies schema and validator blockers only; it does not authorize or perform a write.</p>
        </div>
        <span className="pharma-workspace-lock">Proposal only · 0 writes</span>
      </div>
      <div className="pharma-ingestion-proposal-summary">
        <div><span>Reviewed candidates</span><strong>{ingestionProposal.summary.reviewedCandidates}</strong><small>{ingestionProposal.summary.numericCandidates} numeric · {ingestionProposal.summary.eventCandidates} event-state</small></div>
        <div><span>Numeric validator accepted</span><strong>{ingestionProposal.summary.validatorAccepted}</strong><small>{ingestionProposal.summary.validatorQuarantined} numeric candidates quarantined</small></div>
        <div><span>Event contract accepted</span><strong>{ingestionProposal.summary.eventContractAccepted}</strong><small>{ingestionProposal.summary.eventStorageBlocked} accepted events still blocked by missing canonical storage/write path</small></div>
        <div><span>Proposed writes</span><strong>{ingestionProposal.summary.proposedWrites}</strong><small>{ingestionProposal.summary.rejectedClaimsExcluded} rejected claim excluded · {ingestionProposal.summary.eventContractQuarantined} event-contract quarantined</small></div>
      </div>
      <div className="pharma-ingestion-proposal-items">
        {ingestionProposal.items.map((item) => <article key={item.artifactCode + item.observationDate + item.value}>
          <div className="pharma-source-requirement-head">
            <div><strong>{item.metricCode === "PHARMA_EXPORT_US_REVENUE_GROWTH" ? "Export / US Revenue Growth" : "Regulatory Site Status"}</strong><small>{item.observationDate} · {item.artifactCode} · {item.value}{item.unit === "PERCENT" ? "%" : ""}</small></div>
            <span>{titleCase(item.disposition)}</span>
          </div>
          {item.validatorIssueCodes.length ? <p><strong>Current validator:</strong> {item.validatorIssueCodes.join(" · ")}</p> : null}
          <small>{item.rationale}</small>
        </article>)}
      </div>
      <p className="pharma-evidence-pilot-note"><strong>Decision gate:</strong> the four US-growth candidates are now structurally accepted by numeric validator V2, and both FDA events are valid under the versioned regulatory event-evidence contract. Writes remain blocked: numeric ingestion still requires separate approval, regulatory event storage/write infrastructure is not implemented, and the rejected Q4 31% claim remains excluded.</p>
    </section> : null}


    {localNumericPackage && eventPersistenceProposal ? <section className="pharma-persistence-package" aria-labelledby="pharma-persistence-package-title">
      <div className="pharma-evidence-pilot-head">
        <div>
          <p className="eyebrow">Gate F · Prepared persistence packages</p>
          <h3 id="pharma-persistence-package-title">Local write package & event-schema proposal</h3>
          <p>The next persistence artifacts are prepared for review only. Neither the numeric package nor the regulatory-event schema proposal can write or migrate anything yet.</p>
        </div>
        <span className="pharma-workspace-lock">Prepared only · 0 writes</span>
      </div>
      <div className="pharma-persistence-package-summary">
        <div><span>Numeric rows prepared</span><strong>{localNumericPackage.summary.observationRowsPrepared}</strong><small>Target: {localNumericPackage.rows[0]?.canonicalTarget ?? "fundamental_observations"}</small></div>
        <div><span>Metric registry needed</span><strong>{localNumericPackage.summary.metricDefinitionRegistrationRequired}</strong><small>{localNumericPackage.metricDefinitionProposal.code} · PERCENT</small></div>
        <div><span>Source records needed</span><strong>{localNumericPackage.summary.sourceRecordsRequired}</strong><small>Immutable issuer provenance rows required before insert</small></div>
        <div><span>Event persistence</span><strong>Proposed</strong><small>{eventPersistenceProposal.proposedTable} · not applied</small></div>
      </div>
      <div className="pharma-persistence-package-grid">
        <article>
          <strong>Local numeric ingestion package</strong>
          <small>{localNumericPackage.packageVersion}</small>
          <p>Four validator-accepted US-growth rows are mapped to the existing canonical fundamental-observation store. Metric registration, source-record materialization, conflict preflight and separate write approval remain required.</p>
          <span>Write authorized: NO</span>
        </article>
        <article>
          <strong>Regulatory event persistence proposal</strong>
          <small>{eventPersistenceProposal.proposalVersion}</small>
          <p>Append-only site-specific event storage, held-security RLS and service-role-only mutation are proposed. FDA source registration remains inactive and rights-unverified.</p>
          <span>Schema apply authorized: NO · Event write authorized: NO</span>
        </article>
      </div>
      <p className="pharma-evidence-pilot-note"><strong>Safety:</strong> the SQL proposal lives under docs/sql, not supabase/migrations, and is not an executable migration. The local numeric package also contains no database writer.</p>
      {localNumericPreflight && eventMigrationReplay ? <div className="pharma-persistence-package-grid">
        <article>
          <strong>Local numeric preflight</strong>
          <small>{localNumericPreflight.preflightVersion}</small>
          <p>{localNumericPreflight.requiredLookups.length} canonical local lookups were executed against local Supabase. After prerequisite materialization, all 4 reviewed US-growth rows resolve to immutable source records with 0 existing facts, 0 conflicts and 0 blockers.</p>
          <span>Status: EXECUTED · READY FOR SEPARATE WRITE APPROVAL · 4 INSERT CANDIDATES · 0 BLOCKED · 0 CONFLICTS</span>
        </article>
        <article>
          <strong>Regulatory migration replay</strong>
          <small>{eventMigrationReplay.planVersion}</small>
          <p>{eventMigrationReplay.assertions.length} replay assertions were exercised against local Supabase. The proposal completed and rolled back cleanly with migration history unchanged and no proposed objects left behind.</p>
          <span>Status: EXECUTED · PASS · 0 PERSISTENT CHANGES</span>
        </article>
      </div> : null}
      {canonicalPrerequisitePackage ? <div className="pharma-persistence-package-grid">
        <article>
          <strong>Canonical prerequisite package</strong>
          <small>{canonicalPrerequisitePackage.packageVersion}</small>
          <p>{canonicalPrerequisitePackage.summary.metricDefinitionsPrepared} metric-definition row and {canonicalPrerequisitePackage.summary.sourceRecordsPrepared} immutable issuer source-record envelopes are prepared. Payload hashes are intentionally deferred until a separately approved materialization step.</p>
          <span>Status: PREPARED · NOT EXECUTED · 0 WRITES</span>
        </article>
        <article>
          <strong>Prerequisite mutation boundary</strong>
          <small>{canonicalPrerequisitePackage.sourceRegistryPrecondition.sourceCode}</small>
          <p>Existing source registry must remain active, entitlement-verified and retention-rights-verified. Metric registration, SHA-256 payload hashing and source-record inserts are still separately approval-gated.</p>
          <span>Mutation authorized: NO</span>
        </article>
      </div> : null}
      {canonicalPrerequisitePackage ? <div className="pharma-persistence-package-grid">
        <article>
          <strong>Prerequisite materialization dry-run</strong>
          <small>TORNTPHARM_PREREQUISITE_MATERIALIZATION_DRY_RUN_V1</small>
          <p>One non-writing local executor is prepared to deterministically serialize the 4 canonical source payloads, compute 4 SHA-256 hashes, and print the exact metric-definition and source-record SQL that would be inserted.</p>
          <span>Status: PREPARED · NOT EXECUTED · 0 WRITES</span>
        </article>
        <article>
          <strong>Dry-run execution boundary</strong>
          <small>npm run r4n:dry-run:prerequisites</small>
          <p>The executor contains no database connection and no database writer. Its output is review material only; any local prerequisite mutation requires a later separate approval gate.</p>
          <span>Database connection: NO · Mutation authorized: NO</span>
        </article>
      </div> : null}
      {localPrerequisiteMutationProposal ? <div className="pharma-persistence-package-grid">
        <article>
          <strong>Local prerequisite mutation proposal</strong>
          <small>{localPrerequisiteMutationProposal.proposalVersion}</small>
          <p>Prepared to insert at most {localPrerequisiteMutationProposal.metricDefinitionRowsMaximum} metric definition and {localPrerequisiteMutationProposal.sourceRecordRowsMaximum} immutable source records into local Supabase only. Fundamental observation writes remain zero.</p>
          <span>Status: PREPARED · NOT APPROVED · NOT EXECUTED</span>
        </article>
        <article>
          <strong>Mutation execution boundary</strong>
          <small>npm run r4n:mutate:prerequisites</small>
          <p>The runner refuses execution unless the explicit approval flag is present before database discovery, then enforces local-only DB, source-registry, conflict, idempotency and postcondition guards.</p>
          <span>Execution approved: NO · Fundamental observations: 0</span>
        </article>
      </div> : null}
      {localObservationMutationProposal ? <div className="pharma-persistence-package-grid">
        <article>
          <strong>Local evidence observation proposal</strong>
          <small>{localObservationMutationProposal.proposalVersion}</small>
          <p>Prepared to insert at most {localObservationMutationProposal.observationRowsMaximum} reviewed PHARMA_EXPORT_US_REVENUE_GROWTH observations into local Supabase only: Q1 19%, Q2 26%, Q3 19% and Q4 16%.</p>
          <span>Status: PREPARED · NOT APPROVED · NOT EXECUTED</span>
        </article>
        <article>
          <strong>Observation execution boundary</strong>
          <small>npm run r4n:mutate:observations</small>
          <p>The runner requires a separate approval flag before DB discovery and then rechecks security identity, reviewed assignment, metric contract, immutable source records, conflicts, idempotency and postconditions.</p>
          <span>Execution approved: NO · Production writes: 0</span>
        </article>
      </div> : null}


    </section> : null}

      </div>
    </details>
  </section>
}
