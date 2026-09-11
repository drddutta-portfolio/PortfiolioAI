import { supabase } from "../lib/supabase"

export interface RecommendationInterpretation {
  readonly headline: string
  readonly summary: string
  readonly why_role: string
  readonly why_action: string
  readonly weight_guidance: string
  readonly strengths: readonly { readonly title: string; readonly detail: string }[]
  readonly cautions: readonly { readonly title: string; readonly detail: string }[]
  readonly upgrade_triggers: readonly string[]
  readonly downgrade_triggers: readonly string[]
  readonly evidence_limits: readonly string[]
}

export interface RecommendationInterpretationPlan {
  readonly mode: "AI_INTERPRETATION_PLAN"
  readonly configured: boolean
  readonly model: string
  readonly recommendationRunId: string
  readonly cached: boolean
  readonly generatedAt: string | null
  readonly interpretation: RecommendationInterpretation | null
  readonly note: string
}

export interface RecommendationInterpretationResult {
  readonly mode: "AI_INTERPRETATION"
  readonly cached: boolean
  readonly model: string
  readonly recommendationRunId: string
  readonly generatedAt: string
  readonly interpretation: RecommendationInterpretation
}

const invoke = async <T>(body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke("generate-recommendation-interpretation", { body })
  if (error) throw error
  if (!data || typeof data !== "object") throw new Error("AI interpretation returned no result.")
  if ("error" in data && typeof data.error === "string") throw new Error(data.error)
  return data as T
}

export const planRecommendationInterpretation = (portfolioId: string, securityId: string) =>
  invoke<RecommendationInterpretationPlan>({ action: "PLAN", portfolioId, securityId })

export const generateRecommendationInterpretation = (portfolioId: string, securityId: string) =>
  invoke<RecommendationInterpretationResult>({ action: "GENERATE", portfolioId, securityId })
