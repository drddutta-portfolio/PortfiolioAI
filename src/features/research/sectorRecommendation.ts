import type { RecommendationPolicy } from "../../data/recommendationPolicyRepository"
import type { SecurityScoringSnapshot } from "./scoringTypes"

export type SuggestedRole = "CORE_CANDIDATE" | "SATELLITE_CANDIDATE" | "WATCH" | "AVOID" | "INSUFFICIENT"

export interface RecommendationPreview {
  readonly suggestedRole: SuggestedRole
  readonly overallScore: number | null
  readonly scoreReadyCoverage: number
  readonly cautions: readonly string[]
  readonly sectorProfile: string
  readonly policyStatus: RecommendationPolicy["status"]
  readonly reason: string
}

function previewOverall(snapshot: SecurityScoringSnapshot) {
  if (snapshot.overallScore !== null) return snapshot.overallScore
  const applicable = snapshot.dimensions.filter((dimension) => dimension.dimensionWeight > 0)
  if (!applicable.length || applicable.some((dimension) => dimension.rawScore === null)) return null
  const totalWeight = applicable.reduce((sum, dimension) => sum + dimension.dimensionWeight, 0)
  if (totalWeight <= 0) return null
  return applicable.reduce((sum, dimension) => sum + (dimension.rawScore ?? 0) * dimension.dimensionWeight, 0) / totalWeight
}

function floorsPass(snapshot: SecurityScoringSnapshot, floors: Readonly<Record<string, number>> | undefined) {
  if (!floors) return true
  return Object.entries(floors).every(([code, minimum]) => {
    const dimension = snapshot.dimensions.find((item) => item.dimensionCode === code)
    return dimension?.rawScore !== null && dimension?.rawScore !== undefined && dimension.rawScore >= minimum
  })
}

export function buildRecommendationPreview(snapshot: SecurityScoringSnapshot, policy: RecommendationPolicy): RecommendationPreview {
  const scoreReadyCoverage = snapshot.scoreReadyCoverage ?? 0
  const overallScore = previewOverall(snapshot)
  const cautions = Object.entries(policy.cautionRules).flatMap(([dimensionCode, rule]) => {
    if (typeof rule.below !== "number") return []
    const dimension = snapshot.dimensions.find((item) => item.dimensionCode === dimensionCode)
    if (dimension?.rawScore === null || dimension?.rawScore === undefined || dimension.rawScore >= rule.below) return []
    return [rule.label ?? `${dimensionCode.replaceAll("_", " ")} caution`]
  })

  if (scoreReadyCoverage < policy.minScoreReadyCoverage || overallScore === null) {
    return {
      suggestedRole: "INSUFFICIENT",
      overallScore,
      scoreReadyCoverage,
      cautions,
      sectorProfile: snapshot.profileName,
      policyStatus: policy.status,
      reason: "Sector-specific evidence gate is not yet complete.",
    }
  }

  if (policy.coreMinScore !== null && overallScore >= policy.coreMinScore && floorsPass(snapshot, policy.mandatoryDimensionFloors.CORE_CANDIDATE)) {
    return {
      suggestedRole: "CORE_CANDIDATE",
      overallScore,
      scoreReadyCoverage,
      cautions,
      sectorProfile: snapshot.profileName,
      policyStatus: policy.status,
      reason: cautions.length ? "Core-quality profile with sector-specific cautions." : "Core-quality profile passes the current sector-specific pilot gates.",
    }
  }

  if (policy.satelliteMinScore !== null && overallScore >= policy.satelliteMinScore && floorsPass(snapshot, policy.mandatoryDimensionFloors.SATELLITE_CANDIDATE)) {
    return {
      suggestedRole: "SATELLITE_CANDIDATE",
      overallScore,
      scoreReadyCoverage,
      cautions,
      sectorProfile: snapshot.profileName,
      policyStatus: policy.status,
      reason: "Meets the current sector-specific Satellite pilot gates but not the Core gates.",
    }
  }

  if (policy.watchMinScore !== null && overallScore >= policy.watchMinScore) {
    return {
      suggestedRole: "WATCH",
      overallScore,
      scoreReadyCoverage,
      cautions,
      sectorProfile: snapshot.profileName,
      policyStatus: policy.status,
      reason: "Evidence is sufficient, but current sector-specific strength is below investable-role pilot gates.",
    }
  }

  return {
    suggestedRole: "AVOID",
    overallScore,
    scoreReadyCoverage,
    cautions,
    sectorProfile: snapshot.profileName,
    policyStatus: policy.status,
    reason: "Current evidence is below the sector-specific watch threshold.",
  }
}

export function recommendationLabel(role: SuggestedRole) {
  switch (role) {
    case "CORE_CANDIDATE": return "Core candidate"
    case "SATELLITE_CANDIDATE": return "Satellite candidate"
    case "WATCH": return "Watch"
    case "AVOID": return "Avoid / do not add"
    default: return "Pending"
  }
}
