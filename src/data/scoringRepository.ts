import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"
import { assessPharmaV1Evidence } from "../features/research/pharmaScoringEvidence"
import { resolveScoringProfile, type ScoringProfileResolution } from "../features/research/scoringProfileResolution"
import { loadP7CurrentEvidenceSnapshot, type P7CurrentEvidenceSnapshot } from "./p7CurrentIntelligenceRepository"
import { loadPharmaV1ScoringSnapshot } from "./pharmaScoringRepository"
import type { DimensionScore, ExternalRatingObservation, HeatState, MetricScoreSignal, ScoringProfileSource, SecurityScoringSnapshot } from "../features/research/scoringTypes"

// Stage 8 tables were added after the last generated Database snapshot. Keep this
// adapter isolated until database.types.ts is regenerated from the linked project.
const scoringDb = supabase as unknown as SupabaseClient

const MIN_DIMENSION_COVERAGE = 0.60

// Narrow the newer scoring tables at this isolated compatibility boundary.
function nullableScoringRow<T>(value: unknown): T | null {
  return value as T | null
}

type RuleRow = {
  dimension_code: string
  input_code: string
  input_kind: string
  metric_code: string | null
  metric_weight: number | string
  rule_state: string
  normalization_rule: unknown
}
type ObservationRow = {
  metric_code: string
  numeric_value: number | string | null
  evidence_status: string
  period_end: string | null
  retrieved_at: string
  fresh_until: string
}
type MarketObservationRow = {
  metric_code: string
  numeric_value: number | string | null
  evidence_status: string
  as_of_date: string
  retrieved_at: string
  fresh_until: string
}
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
type DimensionWeightRow = { dimension_code: string; weight: number | string }
type ProfileOverrideRow = { dimension_code: string; weight: number | string }
type MetricOverrideRow = { dimension_code: string; input_code: string; applicability: string; weight_multiplier: number | string }

type PiecewiseBand = { score?: unknown; gte?: unknown; gt?: unknown; lte?: unknown; lt?: unknown }
type RatingOrdinalRule = {
  type?: unknown
  scale?: unknown
  outlook_modifier?: unknown
  clamp?: unknown
  eligible_instrument_types?: unknown
  selection_policy?: unknown
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function normalizeBands(value: number, rule: unknown, allowedTypes: readonly string[]): number | null {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) return null
  const typed = rule as { type?: unknown; bands?: unknown }
  if (typeof typed.type !== "string" || !allowedTypes.includes(typed.type) || !Array.isArray(typed.bands)) return null
  for (const rawBand of typed.bands) {
    if (!rawBand || typeof rawBand !== "object" || Array.isArray(rawBand)) continue
    const band = rawBand as PiecewiseBand
    const score = asNumber(band.score)
    if (score === null) continue
    const gte = asNumber(band.gte); const gt = asNumber(band.gt); const lte = asNumber(band.lte); const lt = asNumber(band.lt)
    const matches = (gte === null || value >= gte) && (gt === null || value > gt) && (lte === null || value <= lte) && (lt === null || value < lt)
    if (matches) return score
  }
  return null
}

function normalizePiecewise(value: number, rule: unknown): number | null {
  return normalizeBands(value, rule, ["piecewise"])
}

function normalizeRating(row: RatingRow, rule: unknown): number | null {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) return null
  const typed = rule as RatingOrdinalRule
  if (typed.type !== "rating_ordinal" || !typed.scale || typeof typed.scale !== "object" || Array.isArray(typed.scale)) return null
  const scale = typed.scale as Record<string, unknown>
  const base = asNumber(scale[row.rating_symbol.toUpperCase()])
  if (base === null) return null
  const modifiers = typed.outlook_modifier && typeof typed.outlook_modifier === "object" && !Array.isArray(typed.outlook_modifier)
    ? typed.outlook_modifier as Record<string, unknown> : {}
  const modifier = row.outlook ? asNumber(modifiers[row.outlook.toUpperCase()]) ?? 0 : 0
  const clamp = Array.isArray(typed.clamp) && typed.clamp.length === 2 ? typed.clamp.map(asNumber) : [0, 100]
  const min = clamp[0] ?? 0; const max = clamp[1] ?? 100
  return Math.max(min, Math.min(max, base + modifier))
}

function selectedExternalRating(rows: readonly RatingRow[], rule: unknown): { readonly row: RatingRow; readonly score: number } | null {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) return null
  const typed = rule as RatingOrdinalRule
  const eligible = Array.isArray(typed.eligible_instrument_types)
    ? new Set(typed.eligible_instrument_types.filter((value): value is string => typeof value === "string"))
    : new Set<string>()
  if (!eligible.size) return null
  const now = Date.now()
  const candidates = rows.filter((row) => row.evidence_status === "AVAILABLE" && Date.parse(row.fresh_until) > now && row.instrument_type && eligible.has(row.instrument_type))
  if (!candidates.length) return null
  const latestDate = candidates.map((row) => row.rating_date ?? "").sort((a, b) => b.localeCompare(a))[0]
  const latest = candidates.filter((row) => (row.rating_date ?? "") === latestDate)
    .flatMap((row) => { const score = normalizeRating(row, rule); return score === null ? [] : [{ row, score }] })
    .sort((a, b) => a.score - b.score || a.row.instrument_type!.localeCompare(b.row.instrument_type!))
  return latest[0] ?? null
}

function heatState(score: number | null): HeatState {
  if (score === null) return "INSUFFICIENT"
  if (score >= 80) return "STRONG"
  if (score >= 65) return "POSITIVE"
  if (score >= 50) return "NEUTRAL"
  if (score >= 35) return "WEAK"
  return "RISK"
}

function latestUsableObservation(rows: readonly ObservationRow[], metricCode: string) {
  const now = Date.now()
  return rows
    .filter((row) => row.metric_code === metricCode && row.evidence_status === "AVAILABLE" && Date.parse(row.fresh_until) > now && asNumber(row.numeric_value) !== null)
    .sort((a, b) => b.retrieved_at.localeCompare(a.retrieved_at))[0] ?? null
}

function latestUsableMarketObservation(rows: readonly MarketObservationRow[], metricCode: string) {
  const now = Date.now()
  return rows
    .filter((row) => row.metric_code === metricCode && row.evidence_status === "AVAILABLE" && Date.parse(row.fresh_until) > now && asNumber(row.numeric_value) !== null)
    .sort((a, b) => b.as_of_date.localeCompare(a.as_of_date) || b.retrieved_at.localeCompare(a.retrieved_at))[0] ?? null
}

function latestByQuarter(rows: readonly ObservationRow[], metricCode: string): ReadonlyMap<string, number> {
  const now = Date.now()
  const candidates = rows
    .filter((row) => row.metric_code === metricCode && row.period_end && row.evidence_status === "AVAILABLE" && Date.parse(row.fresh_until) > now && asNumber(row.numeric_value) !== null)
    .sort((a, b) => b.retrieved_at.localeCompare(a.retrieved_at))
  const result = new Map<string, number>()
  for (const row of candidates) {
    if (!row.period_end || result.has(row.period_end)) continue
    const value = asNumber(row.numeric_value)
    if (value !== null) result.set(row.period_end, value)
  }
  return result
}

function institutionalOwnershipTrend4Q(rows: readonly ObservationRow[]): number | null {
  const fii = latestByQuarter(rows, "SHAREHOLDING_FII_FPI_PERCENT")
  const dii = latestByQuarter(rows, "SHAREHOLDING_DII_PERCENT")
  const sharedPeriods = [...fii.keys()].filter((period) => dii.has(period)).sort((a, b) => b.localeCompare(a))
  if (sharedPeriods.length < 5) return null
  const latest = sharedPeriods[0]
  const priorYear = sharedPeriods[4]
  if (!latest || !priorYear) return null
  const latestCombined = (fii.get(latest) ?? 0) + (dii.get(latest) ?? 0)
  const priorCombined = (fii.get(priorYear) ?? 0) + (dii.get(priorYear) ?? 0)
  return latestCombined - priorCombined
}

function previewDimensions(
  rules: readonly RuleRow[], observations: readonly ObservationRow[], marketObservations: readonly MarketObservationRow[], ratings: readonly RatingRow[], dimensionWeights: ReadonlyMap<string, number>, metricOverrides: readonly MetricOverrideRow[],
): DimensionScore[] {
  const overrides = new Map(metricOverrides.map((row) => [`${row.dimension_code}:${row.input_code}`, row]))
  const dimensions = [...new Set(rules.map((rule) => rule.dimension_code))]
  return dimensions.map((dimensionCode) => {
    const dimensionRules = rules.filter((rule) => rule.dimension_code === dimensionCode)
      .filter((rule) => overrides.get(`${rule.dimension_code}:${rule.input_code}`)?.applicability !== "NOT_APPLICABLE")
    const effectiveWeight = (rule: RuleRow) => Number(rule.metric_weight) * Number(overrides.get(`${rule.dimension_code}:${rule.input_code}`)?.weight_multiplier ?? 1)
    const totalWeight = dimensionRules.reduce((sum, rule) => sum + effectiveWeight(rule), 0)
    let evidenceWeight = 0
    let scoreReadyWeight = 0
    let scoredContribution = 0
    const signals: MetricScoreSignal[] = dimensionRules.map((rule) => {
      const weight = effectiveWeight(rule)

      if (rule.input_kind === "DERIVED" && rule.input_code.startsWith("PHARMA_") && rule.rule_state === "REVIEWED") {
        const assessed = assessPharmaV1Evidence(rule.input_code, observations)
        if (assessed) {
          evidenceWeight += weight * assessed.evidenceFraction
          return {
            inputCode: rule.input_code,
            label: assessed.label,
            weight,
            state: assessed.evidenceFraction > 0 ? "AVAILABLE_UNSCORED" : "MISSING",
            value: assessed.observedCount,
            normalizedScore: null,
          }
        }
      }

      if (rule.rule_state === "PENDING_SOURCE") return { inputCode: rule.input_code, label: rule.input_code.replaceAll("_", " "), weight, state: "PENDING_SOURCE", value: null, normalizedScore: null }

      if (rule.input_kind === "DERIVED" && rule.input_code === "INSTITUTIONAL_OWNERSHIP_TREND") {
        const value = institutionalOwnershipTrend4Q(observations)
        if (value === null) return { inputCode: rule.input_code, label: "Institutional ownership trend (4Q)", weight, state: "MISSING", value: null, normalizedScore: null }
        if (rule.rule_state === "REVIEWED") evidenceWeight += weight
        const normalizedScore = rule.rule_state === "REVIEWED" ? normalizeBands(value, rule.normalization_rule, ["ownership_trend_4q"]) : null
        if (normalizedScore === null) return { inputCode: rule.input_code, label: "Institutional ownership trend (4Q)", weight, state: "AVAILABLE_UNSCORED", value, normalizedScore: null }
        scoreReadyWeight += weight
        scoredContribution += normalizedScore * weight
        return { inputCode: rule.input_code, label: "Institutional ownership trend (4Q)", weight, state: "SCORED", value, normalizedScore }
      }

      if (rule.input_kind === "EXTERNAL_RATING" && rule.input_code === "EXTERNAL_LONG_TERM_RATING") {
        const selected = selectedExternalRating(ratings, rule.normalization_rule)
        if (!selected) return { inputCode: rule.input_code, label: "External long-term rating", weight, state: "MISSING", value: null, normalizedScore: null }
        if (rule.rule_state === "REVIEWED") evidenceWeight += weight
        const normalizedScore = rule.rule_state === "REVIEWED" ? selected.score : null
        if (normalizedScore === null) return { inputCode: rule.input_code, label: `External rating ${selected.row.rating_symbol}`, weight, state: "AVAILABLE_UNSCORED", value: selected.score, normalizedScore: null }
        scoreReadyWeight += weight
        scoredContribution += normalizedScore * weight
        const outlook = selected.row.outlook ? ` / ${selected.row.outlook}` : ""
        return { inputCode: rule.input_code, label: `External rating ${selected.row.rating_symbol}${outlook}`, weight, state: "SCORED", value: selected.score, normalizedScore }
      }

      if ((rule.input_kind !== "FUNDAMENTAL" && rule.input_kind !== "MARKET") || !rule.metric_code) {
        return { inputCode: rule.input_code, label: rule.input_code.replaceAll("_", " "), weight, state: "AVAILABLE_UNSCORED", value: null, normalizedScore: null }
      }
      const observation = rule.input_kind === "MARKET"
        ? latestUsableMarketObservation(marketObservations, rule.metric_code)
        : latestUsableObservation(observations, rule.metric_code)
      if (!observation) return { inputCode: rule.input_code, label: rule.input_code.replaceAll("_", " "), weight, state: "MISSING", value: null, normalizedScore: null }
      const value = asNumber(observation.numeric_value)
      if (value !== null && rule.rule_state === "REVIEWED") evidenceWeight += weight
      const normalizedScore = value === null || rule.rule_state !== "REVIEWED" ? null : normalizePiecewise(value, rule.normalization_rule)
      if (normalizedScore === null) return { inputCode: rule.input_code, label: rule.input_code.replaceAll("_", " "), weight, state: "AVAILABLE_UNSCORED", value, normalizedScore: null }
      scoreReadyWeight += weight
      scoredContribution += normalizedScore * weight
      return { inputCode: rule.input_code, label: rule.input_code.replaceAll("_", " "), weight, state: "SCORED", value, normalizedScore }
    })
    const evidenceCoverage = totalWeight > 0 ? evidenceWeight / totalWeight : 0
    const scoreReadyCoverage = totalWeight > 0 ? scoreReadyWeight / totalWeight : 0
    const rawScore = scoreReadyCoverage >= MIN_DIMENSION_COVERAGE && scoreReadyWeight > 0 ? scoredContribution / scoreReadyWeight : null
    const dimensionWeight = dimensionWeights.get(dimensionCode) ?? 0
    return {
      dimensionCode,
      dimensionWeight,
      rawScore,
      weightedContribution: rawScore === null ? null : rawScore * dimensionWeight / 100,
      evidenceCoverage,
      scoreReadyCoverage,
      confidence: Math.round(evidenceCoverage * 100),
      heatState: heatState(rawScore),
      signals,
      preview: true,
    }
  })
}

function blockedSnapshot(resolvedProfile: ScoringProfileResolution, canonical?: P7CurrentEvidenceSnapshot): SecurityScoringSnapshot {
    return {
      profileCode: resolvedProfile.profileCode ?? resolvedProfile.methodologyState,
      profileName: (resolvedProfile.canonicalRoute?.profileCode ?? resolvedProfile.profileCode ?? resolvedProfile.methodologyState).replaceAll("_", " "),
      profileSource: resolvedProfile.profileSource,
      canonicalRoute: resolvedProfile.canonicalRoute,
      routeState: resolvedProfile.routeState,
      engineState: resolvedProfile.engineState,
      canonicalEvidenceState: canonical ? evidenceState(canonical.snapshotStatus) : undefined,
      methodologyState: resolvedProfile.methodologyState,
      methodologyReasonCode: resolvedProfile.reasonCode,
      scoringExecutionState: resolvedProfile.scoringExecutionState,
      scoringExecutionReasonCode: resolvedProfile.reasonCode,
      modelName: "PortfolioAI scoring",
      modelStatus: "BLOCKED",
      runState: null,
      overallScore: null,
      evidenceCoverage: null,
      scoreReadyCoverage: null,
      evidenceConfidence: null,
      asOfDate: canonical?.asOfDate ?? null,
      dimensions: [],
      ratings: [],
      previewMode: false,
    }
}

function evidenceState(status: P7CurrentEvidenceSnapshot["snapshotStatus"]): SecurityScoringSnapshot["canonicalEvidenceState"] {
  return status === "READY" ? "FRESH" : status === "INSUFFICIENT" ? "MISSING" : status
}

export async function loadSecurityScoringSnapshot(
  securityId: string, sector: string | null, industry: string | null,
  context: { readonly portfolioId: string; readonly assetClass: string },
): Promise<SecurityScoringSnapshot> {
  if (context.assetClass !== "EQUITY") return blockedSnapshot({
    profileCode: null, ruleProfile: null, profileSource: "METHODOLOGY_UNAVAILABLE",
    methodologyState: "NOT_APPLICABLE", scoringExecutionState: "BLOCKED", engineState: "BLOCKED",
    routeState: "NOT_APPLICABLE", reasonCode: "NON_EQUITY_SCORING_NOT_APPLICABLE", legacyAssignmentCode: null,
  })

  const canonical = await loadP7CurrentEvidenceSnapshot(context.portfolioId, securityId)
  if (!canonical) return blockedSnapshot({
    profileCode: null, ruleProfile: null, profileSource: "METHODOLOGY_UNAVAILABLE",
    methodologyState: "REVIEW_REQUIRED", scoringExecutionState: "BLOCKED", engineState: "BLOCKED",
    routeState: "UNAVAILABLE", reasonCode: "CANONICAL_ROUTE_NOT_AVAILABLE", legacyAssignmentCode: null,
  })
  const resolvedProfile = resolveScoringProfile(sector, industry, null, canonical)
  if (resolvedProfile.methodologyState !== "AVAILABLE" || resolvedProfile.scoringExecutionState !== "AVAILABLE"
    || resolvedProfile.profileCode === null || resolvedProfile.ruleProfile === null) {
    return blockedSnapshot(resolvedProfile, canonical)
  }

  // A resolved route/available adapter is not evidence readiness. Do not expose
  // historical scores or fall back to GENERAL when the current snapshot is blocked.
  if (canonical.snapshotStatus !== "READY") return blockedSnapshot({ ...resolvedProfile,
    scoringExecutionState: "BLOCKED", reasonCode: `CANONICAL_EVIDENCE_${canonical.snapshotStatus}`,
  }, canonical)

  if (resolvedProfile.profileCode === "PHARMA_V1") return {
    ...await loadPharmaV1ScoringSnapshot(securityId), profileSource: "CANONICAL_ASSIGNMENT",
    canonicalRoute: resolvedProfile.canonicalRoute, routeState: resolvedProfile.routeState,
    engineState: resolvedProfile.engineState, scoringExecutionState: resolvedProfile.scoringExecutionState,
    canonicalEvidenceState: evidenceState(canonical.snapshotStatus),
  }
  const profileCode = resolvedProfile.profileCode
  const profileSource: ScoringProfileSource = resolvedProfile.profileSource
  const ruleProfile = resolvedProfile.ruleProfile

  const [modelResult, profileResult, ratingsResult, observationsResult, marketObservationsResult] = await Promise.all([
    scoringDb.from("scoring_models").select("id,name,status").eq("code", "PAI_STOCK_SCORE").eq("version", 1).maybeSingle(),
    scoringDb.from("scoring_profiles").select("code,name").eq("code", profileCode).maybeSingle(),
    scoringDb.from("external_rating_observations").select("id,agency_code,instrument_type,instrument_description,rating_symbol,outlook,rating_action,rating_date,source_url,retrieved_at,fresh_until,evidence_status").eq("security_id", securityId).order("rating_date", { ascending: false, nullsFirst: false }).order("retrieved_at", { ascending: false }),
    scoringDb.from("fundamental_observations").select("metric_code,numeric_value,evidence_status,period_end,retrieved_at,fresh_until").eq("security_id", securityId),
    scoringDb.from("market_metric_observations").select("metric_code,numeric_value,evidence_status,as_of_date,retrieved_at,fresh_until").eq("security_id", securityId),
  ])
  const failure = [modelResult, profileResult, ratingsResult, observationsResult, marketObservationsResult].find((result) => result.error)
  if (failure?.error) throw failure.error
  const model = nullableScoringRow<{ id: string; name: string; status: string }>(modelResult.data)
  const profile = nullableScoringRow<{ code: string; name: string }>(profileResult.data)
  if (!model) throw new Error("Scoring model is unavailable.")
  const ratingRows = (ratingsResult.data ?? []) as RatingRow[]
  const marketRows = (marketObservationsResult.data ?? []) as MarketObservationRow[]

  const [runResult, rulesResult, baseDimensionsResult, profileDimensionsResult, metricOverridesResult] = await Promise.all([
    scoringDb.from("stock_score_runs").select("id,run_state,overall_score,evidence_coverage,evidence_confidence,as_of_date").eq("security_id", securityId).eq("scoring_model_id", model.id).eq("scoring_profile", profileCode).order("as_of_date", { ascending: false }).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    scoringDb.from("scoring_model_metric_rules").select("dimension_code,input_code,input_kind,metric_code,metric_weight,rule_state,normalization_rule").eq("scoring_model_id", model.id).eq("scoring_profile", ruleProfile),
    scoringDb.from("scoring_model_dimensions").select("dimension_code,weight").eq("scoring_model_id", model.id).eq("scoring_profile", ruleProfile),
    scoringDb.from("scoring_profile_dimension_overrides").select("dimension_code,weight").eq("scoring_model_id", model.id).eq("scoring_profile_code", profileCode),
    scoringDb.from("scoring_profile_metric_overrides").select("dimension_code,input_code,applicability,weight_multiplier").eq("scoring_model_id", model.id).eq("scoring_profile_code", profileCode),
  ])
  const secondFailure = [runResult, rulesResult, baseDimensionsResult, profileDimensionsResult, metricOverridesResult].find((result) => result.error)
  if (secondFailure?.error) throw secondFailure.error

  const run = nullableScoringRow<{ id: string; run_state: string; overall_score: number | string | null; evidence_coverage: number | string; evidence_confidence: number | string; as_of_date: string }>(runResult.data)
  let dimensions: DimensionScore[]
  if (run?.id) {
    const dimensionResult = await scoringDb.from("stock_dimension_scores").select("dimension_code,dimension_weight,raw_score,weighted_contribution,evidence_coverage,confidence,heat_state").eq("score_run_id", run.id)
    if (dimensionResult.error) throw dimensionResult.error
    dimensions = (dimensionResult.data ?? []).map((row) => ({
      dimensionCode: String(row.dimension_code), dimensionWeight: Number(row.dimension_weight), rawScore: row.raw_score === null ? null : Number(row.raw_score),
      weightedContribution: row.weighted_contribution === null ? null : Number(row.weighted_contribution), evidenceCoverage: Number(row.evidence_coverage),
      scoreReadyCoverage: Number(row.evidence_coverage), confidence: Number(row.confidence), heatState: row.heat_state as HeatState,
    }))
  } else {
    const weights = new Map<string, number>()
    for (const row of (baseDimensionsResult.data ?? []) as DimensionWeightRow[]) weights.set(row.dimension_code, Number(row.weight))
    for (const row of (profileDimensionsResult.data ?? []) as ProfileOverrideRow[]) weights.set(row.dimension_code, Number(row.weight))
    dimensions = previewDimensions((rulesResult.data ?? []), (observationsResult.data ?? []), marketRows, ratingRows, weights, (metricOverridesResult.data ?? []))
  }

  const ratings: ExternalRatingObservation[] = ratingRows.map((row) => ({
    id: String(row.id), agencyCode: String(row.agency_code), instrumentType: row.instrument_type === null ? null : String(row.instrument_type),
    instrumentDescription: row.instrument_description === null ? null : String(row.instrument_description), ratingSymbol: String(row.rating_symbol),
    outlook: row.outlook === null ? null : String(row.outlook), ratingAction: row.rating_action === null ? null : String(row.rating_action),
    ratingDate: row.rating_date === null ? null : String(row.rating_date), sourceUrl: String(row.source_url), retrievedAt: String(row.retrieved_at),
    freshUntil: String(row.fresh_until), evidenceStatus: String(row.evidence_status),
  }))

  const weightedEligible = dimensions.filter((dimension) => dimension.dimensionWeight > 0)
  const totalDimensionWeight = weightedEligible.reduce((sum, dimension) => sum + dimension.dimensionWeight, 0)
  const previewEvidenceCoverage = totalDimensionWeight > 0 ? weightedEligible.reduce((sum, dimension) => sum + dimension.evidenceCoverage * dimension.dimensionWeight, 0) / totalDimensionWeight : 0
  const previewScoreReadyCoverage = totalDimensionWeight > 0 ? weightedEligible.reduce((sum, dimension) => sum + dimension.scoreReadyCoverage * dimension.dimensionWeight, 0) / totalDimensionWeight : 0

  return {
    scoreRunId: run?.id ?? null,
    canonicalRoute: resolvedProfile.canonicalRoute, routeState: resolvedProfile.routeState,
    engineState: resolvedProfile.engineState, canonicalEvidenceState: evidenceState(canonical.snapshotStatus),
    profileCode, profileName: profile?.name ?? profileCode.replaceAll("_", " "), profileSource,
    methodologyState: "AVAILABLE", methodologyReasonCode: null,
    scoringExecutionState: "AVAILABLE", scoringExecutionReasonCode: null,
    modelName: model.name, modelStatus: model.status, runState: run?.run_state ?? null,
    overallScore: run?.overall_score === null || run?.overall_score === undefined ? null : Number(run.overall_score),
    evidenceCoverage: run ? Number(run.evidence_coverage) : previewEvidenceCoverage,
    scoreReadyCoverage: run ? Number(run.evidence_coverage) : previewScoreReadyCoverage,
    evidenceConfidence: run ? Number(run.evidence_confidence) : Math.round(previewEvidenceCoverage * 100),
    asOfDate: run?.as_of_date ?? null, dimensions, ratings, previewMode: !run,
  }
}
