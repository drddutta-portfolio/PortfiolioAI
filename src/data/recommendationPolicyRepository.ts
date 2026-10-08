import { supabase } from "../lib/supabase"

const db = supabase

export interface RecommendationWeightPolicy {
  readonly singleStockMax: number | null
  readonly core?: { readonly high?: readonly [number, number]; readonly standard?: readonly [number, number]; readonly cautious?: readonly [number, number] }
  readonly satellite?: { readonly standard?: readonly [number, number]; readonly cautious?: readonly [number, number] }
  readonly watch?: readonly [number, number]
  readonly avoid?: readonly [number, number]
  readonly highConvictionScore: number | null
  readonly cautionScore: number | null
  readonly momentumCautionBelow: number | null
  readonly riskCautionBelow: number | null
  readonly momentumCap: number | null
  readonly riskCap: number | null
  readonly profileConcentrationSoftCap: number | null
  readonly profileConcentrationHardCap: number | null
  readonly minProfileCoverageForConcentration: number
}

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
  readonly sectorFocus: { readonly primary?: readonly string[]; readonly context?: readonly string[]; readonly not_applicable?: readonly string[] }
  readonly persistenceRules: { readonly upgradeConfirmations: number; readonly downgradeConfirmations: number }
  readonly weightPolicy: RecommendationWeightPolicy
  readonly notes: string | null
}

export type RecommendationTransitionStatus = "INITIAL" | "STABLE" | "EVIDENCE_PENDING" | "PENDING_UPGRADE" | "CONFIRMED_UPGRADE" | "PENDING_DOWNGRADE" | "CONFIRMED_DOWNGRADE"

export interface RecommendationTrackingRecord {
  readonly id: string
  readonly suggestedRole: string
  readonly actionBias: string | null
  readonly suggestedWeightMin: number | null
  readonly suggestedWeightMax: number | null
  readonly changeSignal: string | null
  readonly transitionStatus: RecommendationTransitionStatus
  readonly persistenceCount: number
  readonly createdAt: string
}

export interface PortfolioProfileExposure {
  readonly profileCode: string
  readonly currentWeight: number
  readonly sameProfileWeight: number
  readonly reviewedAssignmentCoverage: number
  readonly reviewedAssignmentCount: number
  readonly totalPositionCount: number
}

function numberOrNull(value: unknown) {
  if (typeof value === "number") return value
  if (typeof value === "string" && value.trim() !== "") { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null }
  return null
}
function tuple(value: unknown): readonly [number, number] | undefined {
  if (!Array.isArray(value) || value.length !== 2) return undefined
  const first = Number(value[0]); const second = Number(value[1])
  return Number.isFinite(first) && Number.isFinite(second) ? [first, second] : undefined
}
function weightPolicy(value: unknown): RecommendationWeightPolicy {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {}
  const core = raw.core && typeof raw.core === "object" ? raw.core as Record<string, unknown> : {}
  const satellite = raw.satellite && typeof raw.satellite === "object" ? raw.satellite as Record<string, unknown> : {}
  return {
    singleStockMax: numberOrNull(raw.single_stock_max), core: { high: tuple(core.high), standard: tuple(core.standard), cautious: tuple(core.cautious) },
    satellite: { standard: tuple(satellite.standard), cautious: tuple(satellite.cautious) }, watch: tuple(raw.watch), avoid: tuple(raw.avoid),
    highConvictionScore: numberOrNull(raw.high_conviction_score), cautionScore: numberOrNull(raw.caution_score), momentumCautionBelow: numberOrNull(raw.momentum_caution_below),
    riskCautionBelow: numberOrNull(raw.risk_caution_below), momentumCap: numberOrNull(raw.momentum_cap), riskCap: numberOrNull(raw.risk_cap),
    profileConcentrationSoftCap: numberOrNull(raw.profile_concentration_soft_cap), profileConcentrationHardCap: numberOrNull(raw.profile_concentration_hard_cap),
    minProfileCoverageForConcentration: Number(raw.min_profile_coverage_for_concentration ?? 70),
  }
}

export async function loadRecommendationPolicy(profileCode: string): Promise<RecommendationPolicy | null> {
  const result = await db.from("recommendation_profile_policies").select("profile_code,policy_version,status,min_score_ready_coverage,core_min_score,satellite_min_score,watch_min_score,mandatory_dimension_floors,caution_rules,sector_focus,persistence_rules,weight_policy,notes").eq("profile_code", profileCode).in("status", ["ACTIVE", "REVIEWED", "DRAFT"]).order("policy_version", { ascending: false }).limit(1).maybeSingle()
  if (result.error) throw result.error
  if (!result.data) return null
  const persistence = (result.data.persistence_rules ?? {}) as Record<string, unknown>
  return {
    profileCode: String(result.data.profile_code), policyVersion: Number(result.data.policy_version), status: result.data.status as RecommendationPolicy["status"],
    minScoreReadyCoverage: Number(result.data.min_score_ready_coverage ?? 0.7), coreMinScore: numberOrNull(result.data.core_min_score), satelliteMinScore: numberOrNull(result.data.satellite_min_score), watchMinScore: numberOrNull(result.data.watch_min_score),
    mandatoryDimensionFloors: (result.data.mandatory_dimension_floors ?? {}) as RecommendationPolicy["mandatoryDimensionFloors"], cautionRules: (result.data.caution_rules ?? {}) as RecommendationPolicy["cautionRules"], sectorFocus: (result.data.sector_focus ?? {}) as RecommendationPolicy["sectorFocus"],
    persistenceRules: { upgradeConfirmations: Number(persistence.upgrade_confirmations ?? 2), downgradeConfirmations: Number(persistence.downgrade_confirmations ?? 2) },
    weightPolicy: weightPolicy(result.data.weight_policy), notes: typeof result.data.notes === "string" ? result.data.notes : null,
  }
}

export async function loadPortfolioProfileExposure(portfolioId: string, securityId: string, profileCode: string): Promise<PortfolioProfileExposure> {
  const result = await db.rpc("get_portfolio_profile_weight_context_v1", { p_portfolio_id: portfolioId, p_security_id: securityId, p_profile_code: profileCode })
  if (result.error) throw result.error
  const row = Array.isArray(result.data) ? result.data[0] : result.data
  if (!row) return { profileCode, currentWeight: 0, sameProfileWeight: 0, reviewedAssignmentCoverage: 0, reviewedAssignmentCount: 0, totalPositionCount: 0 }
  return { profileCode, currentWeight: Number(row.current_weight ?? 0), sameProfileWeight: Number(row.same_profile_weight ?? 0), reviewedAssignmentCoverage: Number(row.reviewed_assignment_coverage ?? 0), reviewedAssignmentCount: Number(row.reviewed_assignment_count ?? 0), totalPositionCount: Number(row.total_position_count ?? 0) }
}

export async function recordRecommendationPreview(input: {
  readonly portfolioId: string; readonly securityId: string; readonly profileCode: string; readonly policyVersion: number; readonly evaluationKey: string
  readonly overallScore: number | null; readonly scoreReadyCoverage: number; readonly evidenceConfidence: number | null; readonly suggestedRole: string
  readonly actionBias: string; readonly currentUserRole: string; readonly currentWeight: number | null; readonly suggestedWeightMin: number | null; readonly suggestedWeightMax: number | null
  readonly rationale: Readonly<Record<string, unknown>>
}): Promise<RecommendationTrackingRecord> {
  const result = await db.rpc("record_recommendation_preview_v2", {
    p_portfolio_id: input.portfolioId, p_security_id: input.securityId, p_scoring_profile_code: input.profileCode, p_policy_version: input.policyVersion,
    p_evaluation_key: input.evaluationKey, p_overall_score: input.overallScore, p_score_ready_coverage: input.scoreReadyCoverage, p_evidence_confidence: input.evidenceConfidence,
    p_suggested_role: input.suggestedRole, p_action_bias: input.actionBias, p_current_user_role: input.currentUserRole, p_current_weight: input.currentWeight,
    p_suggested_weight_min: input.suggestedWeightMin, p_suggested_weight_max: input.suggestedWeightMax, p_rationale: input.rationale,
  })
  if (result.error) throw result.error
  const row = Array.isArray(result.data) ? result.data[0] : result.data
  if (!row) throw new Error("Recommendation tracking result was empty")
  return {
    id: String(row.id), suggestedRole: String(row.suggested_role), actionBias: typeof row.action_bias === "string" ? row.action_bias : null,
    suggestedWeightMin: numberOrNull(row.suggested_weight_min), suggestedWeightMax: numberOrNull(row.suggested_weight_max), changeSignal: typeof row.change_signal === "string" ? row.change_signal : null,
    transitionStatus: row.transition_status as RecommendationTransitionStatus, persistenceCount: Number(row.persistence_count ?? 1), createdAt: String(row.created_at),
  }
}

export async function loadRecommendationHistory(portfolioId: string, securityId: string, limit = 6): Promise<readonly RecommendationTrackingRecord[]> {
  const result = await db.from("stock_recommendation_runs").select("id,suggested_role,action_bias,suggested_weight_min,suggested_weight_max,change_signal,transition_status,persistence_count,created_at").eq("portfolio_id", portfolioId).eq("security_id", securityId).order("created_at", { ascending: false }).limit(limit)
  if (result.error) throw result.error
  return (result.data ?? []).map((row) => ({
    id: String(row.id), suggestedRole: String(row.suggested_role), actionBias: typeof row.action_bias === "string" ? row.action_bias : null,
    suggestedWeightMin: numberOrNull(row.suggested_weight_min), suggestedWeightMax: numberOrNull(row.suggested_weight_max), changeSignal: typeof row.change_signal === "string" ? row.change_signal : null,
    transitionStatus: row.transition_status as RecommendationTransitionStatus, persistenceCount: Number(row.persistence_count ?? 1), createdAt: String(row.created_at),
  }))
}
