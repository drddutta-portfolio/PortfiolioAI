import {
  resolveK5PortfolioMethodState,
  K5_SAFETY_BOUNDARY,
} from "./k5CrossSectorValidation"
import { K5_CURRENT_PORTFOLIO_ROUTING_ROWS } from "./k5CurrentPortfolioRoutingSnapshot"

export const K_FINAL_COVERAGE_VERSION = "GATE_K_FINAL_PORTFOLIO_COVERAGE_V1" as const

export type KFinalMethodStatus =
  | "ARCHITECTURE_READY"
  | "METHODOLOGY_NOT_AVAILABLE"
  | "REVIEW_REQUIRED"
  | "NOT_APPLICABLE"

export type KFinalScoreState =
  | "EVIDENCE_DEPENDENT"
  | "SCORE_NOT_COMPUTABLE"
  | "REVIEW_REQUIRED"
  | "NOT_APPLICABLE"

export type KFinalRecommendationState =
  | "POLICY_AND_EVIDENCE_DEPENDENT"
  | "RECOMMENDATION_NOT_COMPUTABLE"
  | "REVIEW_REQUIRED"
  | "NOT_APPLICABLE"

export interface KFinalPortfolioCoverageRow {
  readonly symbol: string
  readonly sector: string | null
  readonly industry: string | null
  readonly engineCode: string | null
  readonly profileCode: string | null
  readonly methodStatus: KFinalMethodStatus
  readonly scoreState: KFinalScoreState
  readonly recommendationState: KFinalRecommendationState
  readonly reasonCode: string
}

export function buildKFinalPortfolioCoverageMatrix(): readonly KFinalPortfolioCoverageRow[] {
  return K5_CURRENT_PORTFOLIO_ROUTING_ROWS.map((holding) => {
    const resolved = resolveK5PortfolioMethodState({
      assetClass: holding.assetClass,
      sector: holding.sector,
      industry: holding.industry,
    })

    if (resolved.state === "SUPPORTED_ENGINE") {
      return {
        symbol: holding.symbol,
        sector: holding.sector,
        industry: holding.industry,
        engineCode: resolved.engineCode,
        profileCode: resolved.profileCode,
        methodStatus: "ARCHITECTURE_READY",
        scoreState: "EVIDENCE_DEPENDENT",
        recommendationState: "POLICY_AND_EVIDENCE_DEPENDENT",
        reasonCode: resolved.reasonCode,
      }
    }

    if (resolved.state === "REVIEW_REQUIRED") {
      return {
        symbol: holding.symbol,
        sector: holding.sector,
        industry: holding.industry,
        engineCode: resolved.engineCode,
        profileCode: resolved.profileCode,
        methodStatus: "REVIEW_REQUIRED",
        scoreState: "REVIEW_REQUIRED",
        recommendationState: "REVIEW_REQUIRED",
        reasonCode: resolved.reasonCode,
      }
    }

    if (resolved.state === "NOT_APPLICABLE") {
      return {
        symbol: holding.symbol,
        sector: holding.sector,
        industry: holding.industry,
        engineCode: resolved.engineCode,
        profileCode: resolved.profileCode,
        methodStatus: "NOT_APPLICABLE",
        scoreState: "NOT_APPLICABLE",
        recommendationState: "NOT_APPLICABLE",
        reasonCode: resolved.reasonCode,
      }
    }

    return {
      symbol: holding.symbol,
      sector: holding.sector,
      industry: holding.industry,
      engineCode: resolved.engineCode,
      profileCode: resolved.profileCode,
      methodStatus: "METHODOLOGY_NOT_AVAILABLE",
      scoreState: "SCORE_NOT_COMPUTABLE",
      recommendationState: "RECOMMENDATION_NOT_COMPUTABLE",
      reasonCode: resolved.reasonCode,
    }
  })
}

export const K_FINAL_SAFETY_BOUNDARY = {
  ...K5_SAFETY_BOUNDARY,
  aiInterpretationActivation: false,
  portfolioMutation: false,
} as const
