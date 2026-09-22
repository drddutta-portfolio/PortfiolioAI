import type { ReadOnlyResearchRecommendationAddon } from "./researchRecommendationAddon"
import type { PharmaGateI3ReadOnlyRecommendationResult } from "./pharmaGateI3ReadOnlyRecommendation"

function roleLabel(
  role: PharmaGateI3ReadOnlyRecommendationResult["suggestedRole"],
) {
  if (role === "CORE_CANDIDATE") return "Core candidate"
  if (role === "SATELLITE_CANDIDATE") return "Satellite candidate"
  if (role === "WATCH") return "Watch"
  if (role === "AVOID") return "Avoid"
  return "Insufficient"
}

function cautionLabel(code: string) {
  if (code === "VALUATION_BELOW_NEUTRAL_ANCHOR") {
    return "Valuation is below the PHARMA_V1 neutral anchor."
  }
  if (code === "MOMENTUM_BELOW_NEUTRAL_ANCHOR") {
    return "Momentum is below the PHARMA_V1 neutral anchor."
  }
  if (code === "REGULATORY_HIGH_RISK_INTERPRETATION_ONLY") {
    return "Regulatory high-risk context remains visible without a second numeric penalty."
  }
  return code.replaceAll("_", " ").toLocaleLowerCase()
}

export function buildPharmaGateI3RecommendationAddon(
  result: PharmaGateI3ReadOnlyRecommendationResult,
): ReadOnlyResearchRecommendationAddon {
  const ready =
    result.deterministicCalculationState === "READY_READ_ONLY_RECOMMENDATION"

  return {
    contractVersion: result.version,
    profileCode: result.profileCode,
    profileLabel: "Pharmaceuticals · PHARMA_V1",
    suggestedRole: result.suggestedRole,
    roleLabel: roleLabel(result.suggestedRole),
    state: ready ? "READY" : "INSUFFICIENT",
    statusLabel: ready ? "Read-only" : "Insufficient",
    detail: ready
      ? `Gate I3 deterministic recommendation · authoritative score ${result.overallScore?.toFixed(4) ?? "unavailable"} · non-persisting`
      : "Gate I3 fail-closed recommendation · no score reconstruction · non-persisting",
    cautions: result.cautions.map(cautionLabel),
    overallScore: result.overallScore,
    policyVersion: result.policyVersion,
    actionUnavailableReason:
      "Read-only sector recommendation only. Action bias remains outside Gate I.",
    weightUnavailableReason:
      "Read-only sector recommendation only. Allocation guidance remains outside Gate I.",
    trackingUnavailableReason:
      "Recommendation persistence and transition tracking remain disabled for this read-only sector result.",
    persistenceEnabled: false,
    actionBiasEnabled: false,
    weightGuidanceEnabled: false,
    aiInterpretationEnabled: false,
  }
}
