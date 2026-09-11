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
  readonly notes: string | null
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
    .select("profile_code,policy_version,status,min_score_ready_coverage,core_min_score,satellite_min_score,watch_min_score,mandatory_dimension_floors,caution_rules,sector_focus,notes")
    .eq("profile_code", profileCode)
    .in("status", ["ACTIVE", "REVIEWED", "DRAFT"])
    .order("policy_version", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (result.error) throw result.error
  if (!result.data) return null
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
    notes: typeof result.data.notes === "string" ? result.data.notes : null,
  }
}
