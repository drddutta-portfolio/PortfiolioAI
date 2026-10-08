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

async function detailedFunctionError(error: unknown): Promise<Error> {
  if (error && typeof error === "object" && "context" in error) {
    const context = (error as { context?: unknown }).context
    if (context instanceof Response) {
      try {
        const payload = await context.clone().json() as Record<string, unknown>
        const message = typeof payload.error === "string" ? payload.error : null
        const detail = typeof payload.detail === "string" ? payload.detail : null
        const code = typeof payload.code === "string" ? payload.code : null
        if (message || detail || code) {
          return new Error([message, detail, code ? `[${code}]` : null].filter(Boolean).join(" "))
        }
      } catch {
        try {
          const text = await context.clone().text()
          if (text.trim()) return new Error(text.trim())
        } catch {
          // fall through to the original error below
        }
      }
    }
  }
  return error instanceof Error ? error : new Error(String(error))
}

const invoke = async <T>(body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke<unknown>("generate-recommendation-interpretation", { body })
  if (error) throw await detailedFunctionError(error)
  if (!data || typeof data !== "object") throw new Error("AI interpretation returned no result.")
  if ("error" in data && typeof data.error === "string") {
    const detail = "detail" in data && typeof data.detail === "string" ? data.detail : null
    const code = "code" in data && typeof data.code === "string" ? data.code : null
    throw new Error([data.error, detail, code ? `[${code}]` : null].filter(Boolean).join(" "))
  }
  return data as T
}

export const planRecommendationInterpretation = (portfolioId: string, securityId: string) =>
  invoke<RecommendationInterpretationPlan>({ action: "PLAN", portfolioId, securityId })

export const generateRecommendationInterpretation = (portfolioId: string, securityId: string) =>
  invoke<RecommendationInterpretationResult>({ action: "GENERATE", portfolioId, securityId })
