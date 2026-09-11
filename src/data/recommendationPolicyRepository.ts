import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"

const db = supabase as unknown as SupabaseClient

export interface RecommendationPolicy {
  readonly profileCode: string
  readonly policyVersion: number
  readonly status: "DRAFT" | "REVIEWED" | "ACTIVE" | "RETIRED"
  readonly minScoreReadyCoverage: number
  readonly coreMinScore: number | null
  readonly satelliteMinScore: number | null
  readonly watchMinScore: number | null
  readonly mandatoryDimensionFloors: Readonly<Record<string, Readonly<Record<string, number>>>>
  readonly cautionRules: Readonly<Record<string, { readonly below?: number; readonly label?: string }>>
  readonly sectorFocus: {
    readonly primary?: readonly string[]
    readonly context?: readonly string[]
    readonly not_applicable?: readonly string[]
  }
  readonly persistenceRules: {
    readonly upgradeConfirmations: number
    readonly downgradeConfirmations: number
  }
  readonly notes: string | null
}

export type RecommendationTransitionStatus =
  | "INITIAL"
  | "STABLE"
  | "EVIDENCE_PENDING"
  | "PENDING_UPGRADE"
  | "CONFIRMED_UPGRADE"
  | "PENDING_DOWNGRADE"
  | "CONFIRMED_DOWNGRADE"

export interface RecommendationTrackingRecord {
  readonly id: string
  readonly suggestedRole: string
  readonly changeSignal: string | null
  readonly transitionStatus: RecommendationTransitionStatus
  readonly persistenceCount: number
  readonly createdAt: string
}

function numberOrNull(value: unknown) {
  if (typeof value === "number") return value
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export async function loadRecommendationPolicy(profileCode: string): Promise<RecommendationPolicy | null> {
  const result = await db
    .from("recommendation_profile_policies")
    .select("profile_code,policy_version,status,min_score_ready_coverage,core_min_score,satellite_min_score,watch_min_score,mandatory_dimension_floors,caution_rules,sector_focus,persistence_rules,notes")
    .eq("profile_code", profileCode)
    .in("status", ["ACTIVE", "REVIEWED", "DRAFT"])
    .order("policy_version", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (result.error) throw result.error
  if (!result.data) return null
  const persistence = (result.data.persistence_rules ?? {}) as Record<string, unknown>
  return {
    profileCode: String(result.data.profile_code),
    policyVersion: Number(result.data.policy_version),
    status: result.data.status as RecommendationPolicy["status"],
    minScoreReadyCoverage: Number(result.data.min_score_ready_coverage ?? 0.7),
    coreMinScore: numberOrNull(result.data.core_min_score),
    satelliteMinScore: numberOrNull(result.data.satellite_min_score),
    watchMinScore: numberOrNull(result.data.watch_min_score),
    mandatoryDimensionFloors: (result.data.mandatory_dimension_floors ?? {}) as RecommendationPolicy["mandatoryDimensionFloors"],
    cautionRules: (result.data.caution_rules ?? {}) as RecommendationPolicy["cautionRules"],
    sectorFocus: (result.data.sector_focus ?? {}) as RecommendationPolicy["sectorFocus"],
    persistenceRules: {
      upgradeConfirmations: Number(persistence.upgrade_confirmations ?? 2),
      downgradeConfirmations: Number(persistence.downgrade_confirmations ?? 2),
    },
    notes: typeof result.data.notes === "string" ? result.data.notes : null,
  }
}

export async function recordRecommendationPreview(input: {
  readonly portfolioId: string
  readonly securityId: string
  readonly profileCode: string
  readonly policyVersion: number
  readonly evaluationKey: string
  readonly overallScore: number | null
  readonly scoreReadyCoverage: number
  readonly evidenceConfidence: number | null
  readonly suggestedRole: string
  readonly currentUserRole: string
  readonly currentWeight: number | null
  readonly rationale: Readonly<Record<string, unknown>>
}): Promise<RecommendationTrackingRecord> {
  const result = await db.rpc("record_recommendation_preview_v1", {
    p_portfolio_id: input.portfolioId,
    p_security_id: input.securityId,
    p_scoring_profile_code: input.profileCode,
    p_policy_version: input.policyVersion,
    p_evaluation_key: input.evaluationKey,
    p_overall_score: input.overallScore,
    p_score_ready_coverage: input.scoreReadyCoverage,
    p_evidence_confidence: input.evidenceConfidence,
    p_suggested_role: input.suggestedRole,
    p_current_user_role: input.currentUserRole,
    p_current_weight: input.currentWeight,
    p_rationale: input.rationale,
  })
  if (result.error) throw result.error
  const row = Array.isArray(result.data) ? result.data[0] : result.data
  if (!row) throw new Error("Recommendation tracking result was empty")
  return {
    id: String(row.id),
    suggestedRole: String(row.suggested_role),
    changeSignal: typeof row.change_signal === "string" ? row.change_signal : null,
    transitionStatus: row.transition_status as RecommendationTransitionStatus,
    persistenceCount: Number(row.persistence_count ?? 1),
    createdAt: String(row.created_at),
  }
}

export async function loadRecommendationHistory(portfolioId: string, securityId: string, limit = 6): Promise<readonly RecommendationTrackingRecord[]> {
  const result = await db
    .from("stock_recommendation_runs")
    .select("id,suggested_role,change_signal,transition_status,persistence_count,created_at")
    .eq("portfolio_id", portfolioId)
    .eq("security_id", securityId)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (result.error) throw result.error
  return (result.data ?? []).map((row) => ({
    id: String(row.id),
    suggestedRole: String(row.suggested_role),
    changeSignal: typeof row.change_signal === "string" ? row.change_signal : null,
    transitionStatus: row.transition_status as RecommendationTransitionStatus,
    persistenceCount: Number(row.persistence_count ?? 1),
    createdAt: String(row.created_at),
  }))
}
