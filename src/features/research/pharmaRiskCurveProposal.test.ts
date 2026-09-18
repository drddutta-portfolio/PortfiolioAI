import { describe, expect, it } from "vitest"
import { PHARMA_RISK_CURVE_PROPOSAL } from "./pharmaRiskCurveProposal"

describe("PHARMA Regulatory & Market Risk curve proposal", () => {
  it("remains proposal-only and non-executable", () => {
    expect(PHARMA_RISK_CURVE_PROPOSAL.state).toBe("PROPOSAL_ONLY")
    expect(PHARMA_RISK_CURVE_PROPOSAL.numericCurveReady).toBe(false)
    expect(PHARMA_RISK_CURVE_PROPOSAL.activationApproved).toBe(false)
    expect(PHARMA_RISK_CURVE_PROPOSAL.scoreExecutionEnabled).toBe(false)
  })

  it("already aligns with the canonical Risk dimension", () => {
    expect(PHARMA_RISK_CURVE_PROPOSAL.canonicalDimension).toBe("RISK")
    expect(PHARMA_RISK_CURVE_PROPOSAL.currentParentContractDimension).toBe("RISK")
    expect(PHARMA_RISK_CURVE_PROPOSAL.dimensionAlignmentState).toBe("ALIGNED")
  })

  it("preserves official and current regulatory evidence requirements", () => {
    expect(PHARMA_RISK_CURVE_PROPOSAL.regulatoryEvidence.conditionalOnRegulatedExportExposure).toBe(true)
    expect(PHARMA_RISK_CURVE_PROPOSAL.regulatoryEvidence.officialEvidenceRequired).toBe(true)
    expect(PHARMA_RISK_CURVE_PROPOSAL.regulatoryEvidence.currentUnresolvedActionsRequired).toBe(true)
    expect(PHARMA_RISK_CURVE_PROPOSAL.regulatoryEvidence.latestMaterialInspectionOrRemediationStateRequired).toBe(true)
    expect(PHARMA_RISK_CURVE_PROPOSAL.regulatoryEvidence.companyWideClearanceMayBeInferredFromSingleSiteCloseout).toBe(false)
  })

  it("uses the repository's existing deterministic market-risk evidence lanes", () => {
    expect(PHARMA_RISK_CURVE_PROPOSAL.marketRiskEvidence.candidateMetrics).toEqual([
      "MAX_DRAWDOWN_1Y",
      "VOLATILITY_1Y",
    ])
    expect(PHARMA_RISK_CURVE_PROPOSAL.marketRiskEvidence.rawAuthority).toBe("MARKET_PRICE_HISTORY")
    expect(PHARMA_RISK_CURVE_PROPOSAL.marketRiskEvidence.derivedEvidenceStore).toBe("MARKET_METRIC_OBSERVATIONS")
    expect(PHARMA_RISK_CURVE_PROPOSAL.marketRiskEvidence.pharmaScoreRuleState).toBe("UNAPPROVED")
  })

  it("requires peer or benchmark context before Pharma volatility normalization", () => {
    expect(PHARMA_RISK_CURVE_PROPOSAL.marketRiskEvidence.volatilityPeerOrBenchmarkContextRequired).toBe(true)
  })

  it("keeps the weighted Risk dimension distinct from G4 gate penalties", () => {
    const separation = PHARMA_RISK_CURVE_PROPOSAL.governanceGateSeparation
    expect(separation.g4BlockedOrCriticalEventMayReceiveSecondHiddenPenalty).toBe(false)
    expect(separation.g4HighRiskMayReceiveSecondHiddenPenalty).toBe(false)
    expect(separation.regulatoryEventContextMayRemainVisible).toBe(true)
    expect(separation.additionalRegulatoryCapInsideRiskDimensionAllowed).toBe(false)
  })

  it("does not invent component weights or numeric bands", () => {
    expect(PHARMA_RISK_CURVE_PROPOSAL.methodologyShape.componentWeightsState).toBe("UNAPPROVED")
    expect(PHARMA_RISK_CURVE_PROPOSAL.methodologyShape.regulatoryBandsState).toBe("UNAPPROVED")
    expect(PHARMA_RISK_CURVE_PROPOSAL.methodologyShape.drawdownBandsState).toBe("UNAPPROVED")
    expect(PHARMA_RISK_CURVE_PROPOSAL.methodologyShape.volatilityBandsState).toBe("UNAPPROVED")
  })

  it("never silently converts missing risk evidence to neutral", () => {
    expect(PHARMA_RISK_CURVE_PROPOSAL.missingRegulatoryExposureMayBecomeNeutral).toBe(false)
    expect(PHARMA_RISK_CURVE_PROPOSAL.missingMarketRiskEvidenceMayBecomeNeutral).toBe(false)
  })
})
