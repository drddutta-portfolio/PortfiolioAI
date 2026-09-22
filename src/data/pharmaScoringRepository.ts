import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"
import { assessPharmaV1Evidence, type PharmaScoringObservation } from "../features/research/pharmaScoringEvidence"
import type { DimensionScore, ExternalRatingObservation, MetricScoreSignal, ScoringProfileSource, SecurityScoringSnapshot } from "../features/research/scoringTypes"

const db = supabase as unknown as SupabaseClient

type RuleRow = {
  dimension_code: string
  input_code: string
  input_kind: string
  metric_code: string | null
  metric_weight: number | string
  rule_state: string
}
type DimensionRow = { dimension_code: string; weight: number | string }
type ScoreRunRow = { id: string; run_state: string; overall_score: number | string | null; evidence_coverage: number | string; evidence_confidence: number | string; as_of_date: string }
type RatingRow = {
  id: string
  agency_code: string
  instrument_type: string | null
  instrument_description: string | null
  rating_symbol: string
  outlook: string | null
  rating_action: string | null
  rating_date: string | null
  source_url: string
  retrieved_at: string
  fresh_until: string
  evidence_status: string
}

function label(inputCode: string) {
  return inputCode.replaceAll("_", " ").toLocaleLowerCase().replace(/(^|\s)\S/gu, (match) => match.toLocaleUpperCase())
}

function previewDimensions(rules: readonly RuleRow[], observations: readonly PharmaScoringObservation[], dimensions: readonly DimensionRow[]): DimensionScore[] {
  const weights = new Map(dimensions.map((row) => [row.dimension_code, Number(row.weight)]))
  const dimensionCodes = [...new Set(rules.map((row) => row.dimension_code))]
  return dimensionCodes.map((dimensionCode) => {
    const dimensionRules = rules.filter((rule) => rule.dimension_code === dimensionCode)
    const totalWeight = dimensionRules.reduce((sum, rule) => sum + Number(rule.metric_weight), 0)
    let evidenceWeight = 0
    const signals: MetricScoreSignal[] = dimensionRules.map((rule) => {
      const weight = Number(rule.metric_weight)
      if (rule.rule_state === "PENDING_SOURCE") {
        return { inputCode: rule.input_code, label: label(rule.input_code), weight, state: "PENDING_SOURCE", value: null, normalizedScore: null }
      }
      const evidence = assessPharmaV1Evidence(rule.input_code, observations)
      if (!evidence) {
        return { inputCode: rule.input_code, label: label(rule.input_code), weight, state: "PENDING_SOURCE", value: null, normalizedScore: null }
      }
      evidenceWeight += weight * evidence.evidenceFraction
      return {
        inputCode: rule.input_code,
        label: evidence.label,
        weight,
        state: evidence.observedCount > 0 || evidence.evidenceFraction > 0 ? "AVAILABLE_UNSCORED" : "MISSING",
        value: evidence.observedCount,
        normalizedScore: null,
      }
    })
    const evidenceCoverage = totalWeight > 0 ? evidenceWeight / totalWeight : 0
    return {
      dimensionCode,
      dimensionWeight: weights.get(dimensionCode) ?? 0,
      rawScore: null,
      weightedContribution: null,
      evidenceCoverage,
      scoreReadyCoverage: 0,
      confidence: Math.round(evidenceCoverage * 100),
      heatState: "INSUFFICIENT",
      signals,
      preview: true,
    }
  })
}

function ratings(rows: readonly RatingRow[]): ExternalRatingObservation[] {
  return rows.map((row) => ({
    id: row.id,
    agencyCode: row.agency_code,
    instrumentType: row.instrument_type,
    instrumentDescription: row.instrument_description,
    ratingSymbol: row.rating_symbol,
    outlook: row.outlook,
    ratingAction: row.rating_action,
    ratingDate: row.rating_date,
    sourceUrl: row.source_url,
    retrievedAt: row.retrieved_at,
    freshUntil: row.fresh_until,
    evidenceStatus: row.evidence_status,
  }))
}

export async function loadPharmaV1ScoringSnapshot(securityId: string): Promise<SecurityScoringSnapshot> {
  const [modelResult, profileResult, assignmentResult, rulesResult, dimensionsResult, observationsResult, ratingsResult] = await Promise.all([
    db.from("scoring_models").select("id,name,status").eq("code", "PAI_STOCK_SCORE").eq("version", 1).maybeSingle(),
    db.from("scoring_profiles").select("code,name").eq("code", "PHARMA_V1").maybeSingle(),
    db.from("security_scoring_profile_assignments").select("scoring_profile_code,assignment_status").eq("security_id", securityId).eq("assignment_status", "REVIEWED").maybeSingle(),
    db.from("scoring_model_metric_rules").select("dimension_code,input_code,input_kind,metric_code,metric_weight,rule_state").eq("scoring_profile", "PHARMA_V1"),
    db.from("scoring_model_dimensions").select("dimension_code,weight,scoring_model_id").eq("scoring_profile", "PHARMA_V1"),
    db.from("fundamental_observations").select("metric_code,numeric_value,evidence_status,period_end,fresh_until").eq("security_id", securityId),
    db.from("external_rating_observations").select("id,agency_code,instrument_type,instrument_description,rating_symbol,outlook,rating_action,rating_date,source_url,retrieved_at,fresh_until,evidence_status").eq("security_id", securityId).order("rating_date", { ascending: false, nullsFirst: false }).order("retrieved_at", { ascending: false }),
  ])
  const failure = [modelResult, profileResult, assignmentResult, rulesResult, dimensionsResult, observationsResult, ratingsResult].find((result) => result.error)
  if (failure?.error) throw failure.error

  const model = modelResult.data as { id: string; name: string; status: string } | null
  const profile = profileResult.data as { code: string; name: string } | null
  if (!model || !profile) throw new Error("PHARMA_V1 scoring contract is unavailable.")

  const rules = (rulesResult.data ?? []) as RuleRow[]
  const dimensionsForModel = ((dimensionsResult.data ?? []) as Array<DimensionRow & { scoring_model_id: string }>).filter((row) => row.scoring_model_id === model.id)
  if (!rules.length || !dimensionsForModel.length) throw new Error("PHARMA_V1 scoring rules are unavailable.")

  const runResult = await db.from("stock_score_runs")
    .select("id,run_state,overall_score,evidence_coverage,evidence_confidence,as_of_date")
    .eq("security_id", securityId).eq("scoring_model_id", model.id).eq("scoring_profile", "PHARMA_V1")
    .order("as_of_date", { ascending: false }).order("created_at", { ascending: false }).limit(1).maybeSingle()
  if (runResult.error) throw runResult.error
  const run = runResult.data as ScoreRunRow | null

  let dimensionScores: DimensionScore[]
  if (run) {
    const persisted = await db.from("stock_dimension_scores").select("dimension_code,dimension_weight,raw_score,weighted_contribution,evidence_coverage,confidence,heat_state").eq("score_run_id", run.id)
    if (persisted.error) throw persisted.error
    dimensionScores = (persisted.data ?? []).map((row) => ({
      dimensionCode: String(row.dimension_code),
      dimensionWeight: Number(row.dimension_weight),
      rawScore: row.raw_score === null ? null : Number(row.raw_score),
      weightedContribution: row.weighted_contribution === null ? null : Number(row.weighted_contribution),
      evidenceCoverage: Number(row.evidence_coverage),
      scoreReadyCoverage: Number(row.evidence_coverage),
      confidence: Number(row.confidence),
      heatState: row.heat_state as DimensionScore["heatState"],
    }))
  } else {
    dimensionScores = previewDimensions(rules, (observationsResult.data ?? []) as PharmaScoringObservation[], dimensionsForModel)
  }

  const weighted = dimensionScores.filter((dimension) => dimension.dimensionWeight > 0)
  const totalWeight = weighted.reduce((sum, dimension) => sum + dimension.dimensionWeight, 0)
  const previewEvidence = totalWeight > 0 ? weighted.reduce((sum, dimension) => sum + dimension.evidenceCoverage * dimension.dimensionWeight, 0) / totalWeight : 0
  const previewScoreReady = totalWeight > 0 ? weighted.reduce((sum, dimension) => sum + dimension.scoreReadyCoverage * dimension.dimensionWeight, 0) / totalWeight : 0
  const reviewedLegacyAssignment = assignmentResult.data?.scoring_profile_code === "PHARMA_HEALTHCARE"
  const profileSource: ScoringProfileSource = reviewedLegacyAssignment ? "REVIEWED_ASSIGNMENT" : "SECTOR_RULE"

  return {
    profileCode: "PHARMA_V1",
    profileName: profile.name,
    profileSource,
    methodologyState: "AVAILABLE",
    methodologyReasonCode: null,
    modelName: model.name,
    modelStatus: model.status,
    runState: run?.run_state ?? null,
    overallScore: run?.overall_score === null || run?.overall_score === undefined ? null : Number(run.overall_score),
    evidenceCoverage: run ? Number(run.evidence_coverage) : previewEvidence,
    scoreReadyCoverage: run ? Number(run.evidence_coverage) : previewScoreReady,
    evidenceConfidence: run ? Number(run.evidence_confidence) : Math.round(previewEvidence * 100),
    asOfDate: run?.as_of_date ?? null,
    dimensions: dimensionScores,
    ratings: ratings((ratingsResult.data ?? []) as RatingRow[]),
    previewMode: !run,
  }
}
