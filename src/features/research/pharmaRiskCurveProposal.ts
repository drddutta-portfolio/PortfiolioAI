import { PHARMA_RESEARCH_PROFILE_V1 } from "./pharmaResearchProfile"

export const PHARMA_RISK_CURVE_PROPOSAL_VERSION =
  "PHARMA_REGULATORY_MARKET_RISK_CURVE_V1_PROPOSAL" as const

const REGULATORY_RISK_METRIC_CODE = "PHARMA_REGULATORY_SITE_STATUS" as const
const regulatoryRiskMetric = PHARMA_RESEARCH_PROFILE_V1.metrics.find(
  (metric) => metric.metricCode === REGULATORY_RISK_METRIC_CODE,
)

if (!regulatoryRiskMetric) {
  throw new Error("PHARMA_REGULATORY_SITE_STATUS is missing from PHARMA_V1 parent contract")
}

export interface PharmaRiskCurveProposal {
  readonly proposalVersion: typeof PHARMA_RISK_CURVE_PROPOSAL_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly parentMetricCode: typeof REGULATORY_RISK_METRIC_CODE
  readonly canonicalDimension: "RISK"
  readonly currentParentContractDimension: typeof regulatoryRiskMetric.dimension
  readonly dimensionAlignmentState: "ALIGNED"
  readonly regulatoryEvidence: {
    readonly conditionalOnRegulatedExportExposure: true
    readonly officialEvidenceRequired: true
    readonly currentUnresolvedActionsRequired: true
    readonly latestMaterialInspectionOrRemediationStateRequired: true
    readonly companyWideClearanceMayBeInferredFromSingleSiteCloseout: false
  }
  readonly marketRiskEvidence: {
    readonly candidateMetrics: readonly ["MAX_DRAWDOWN_1Y", "VOLATILITY_1Y"]
    readonly rawAuthority: "MARKET_PRICE_HISTORY"
    readonly derivedEvidenceStore: "MARKET_METRIC_OBSERVATIONS"
    readonly maxDrawdownDefinition: "TRAILING_1Y_MAX_PEAK_TO_TROUGH_DAILY_CLOSE"
    readonly volatilityDefinition: "ANNUALIZED_SAMPLE_STDDEV_DAILY_LOG_RETURNS_SQRT_252"
    readonly pharmaScoreRuleState: "UNAPPROVED"
    readonly volatilityPeerOrBenchmarkContextRequired: true
  }
  readonly methodologyShape: {
    readonly components: readonly [
      "REGULATORY_RISK_CONTEXT",
      "MARKET_DRAWDOWN",
      "MARKET_VOLATILITY_CONTEXT",
    ]
    readonly componentWeightsState: "UNAPPROVED"
    readonly regulatoryBandsState: "UNAPPROVED"
    readonly drawdownBandsState: "UNAPPROVED"
    readonly volatilityBandsState: "UNAPPROVED"
  }
  readonly governanceGateSeparation: {
    readonly g4BlockedOrCriticalEventMayReceiveSecondHiddenPenalty: false
    readonly g4HighRiskMayReceiveSecondHiddenPenalty: false
    readonly regulatoryEventContextMayRemainVisible: true
    readonly additionalRegulatoryCapInsideRiskDimensionAllowed: false
  }
  readonly missingRegulatoryExposureMayBecomeNeutral: false
  readonly missingMarketRiskEvidenceMayBecomeNeutral: false
  readonly numericCurveReady: false
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_RISK_CURVE_PROPOSAL: PharmaRiskCurveProposal = {
  proposalVersion: PHARMA_RISK_CURVE_PROPOSAL_VERSION,
  state: "PROPOSAL_ONLY",
  parentMetricCode: REGULATORY_RISK_METRIC_CODE,
  canonicalDimension: "RISK",
  currentParentContractDimension: regulatoryRiskMetric.dimension,
  dimensionAlignmentState: "ALIGNED",
  regulatoryEvidence: {
    conditionalOnRegulatedExportExposure: true,
    officialEvidenceRequired: true,
    currentUnresolvedActionsRequired: true,
    latestMaterialInspectionOrRemediationStateRequired: true,
    companyWideClearanceMayBeInferredFromSingleSiteCloseout: false,
  },
  marketRiskEvidence: {
    candidateMetrics: ["MAX_DRAWDOWN_1Y", "VOLATILITY_1Y"],
    rawAuthority: "MARKET_PRICE_HISTORY",
    derivedEvidenceStore: "MARKET_METRIC_OBSERVATIONS",
    maxDrawdownDefinition: "TRAILING_1Y_MAX_PEAK_TO_TROUGH_DAILY_CLOSE",
    volatilityDefinition: "ANNUALIZED_SAMPLE_STDDEV_DAILY_LOG_RETURNS_SQRT_252",
    pharmaScoreRuleState: "UNAPPROVED",
    volatilityPeerOrBenchmarkContextRequired: true,
  },
  methodologyShape: {
    components: [
      "REGULATORY_RISK_CONTEXT",
      "MARKET_DRAWDOWN",
      "MARKET_VOLATILITY_CONTEXT",
    ],
    componentWeightsState: "UNAPPROVED",
    regulatoryBandsState: "UNAPPROVED",
    drawdownBandsState: "UNAPPROVED",
    volatilityBandsState: "UNAPPROVED",
  },
  governanceGateSeparation: {
    g4BlockedOrCriticalEventMayReceiveSecondHiddenPenalty: false,
    g4HighRiskMayReceiveSecondHiddenPenalty: false,
    regulatoryEventContextMayRemainVisible: true,
    additionalRegulatoryCapInsideRiskDimensionAllowed: false,
  },
  missingRegulatoryExposureMayBecomeNeutral: false,
  missingMarketRiskEvidenceMayBecomeNeutral: false,
  numericCurveReady: false,
  activationApproved: false,
  scoreExecutionEnabled: false,
}
