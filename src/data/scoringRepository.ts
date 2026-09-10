import { supabase } from "../lib/supabase"
import type { DimensionScore, ExternalRatingObservation, SecurityScoringSnapshot } from "../features/research/scoringTypes"

function profileForSector(sector: string | null, industry: string | null) {
  const haystack = `${sector ?? ""} ${industry ?? ""}`.toUpperCase()
  if (/\bBANK\b|NBFC|LENDING/.test(haystack)) return "BANK_NBFC"
  if (/IT|TECHNOLOGY|SOFTWARE/.test(haystack)) return "IT_TECH"
  if (/INDUSTRIAL|CAPITAL GOODS|ENGINEERING/.test(haystack)) return "INDUSTRIALS_CAPITAL_GOODS"
  if (/FMCG|CONSUMER/.test(haystack)) return "CONSUMER_FMCG"
  if (/PHARMA|HEALTHCARE/.test(haystack)) return "PHARMA_HEALTHCARE"
  if (/AUTO|AUTOMOBILE/.test(haystack)) return "AUTO_COMPONENTS"
  if (/POWER|ENERGY|UTILIT|OIL|GAS/.test(haystack)) return "ENERGY_UTILITIES"
  if (/METAL|MINING|COMMODIT/.test(haystack)) return "METALS_COMMODITIES"
  if (/INFRA|CONSTRUCTION|EPC/.test(haystack)) return "INFRA_CONSTRUCTION"
  if (/REAL ESTATE|REALTY/.test(haystack)) return "REAL_ESTATE"
  if (/FINANCIAL SERVICES|INSURANCE|ASSET MANAGEMENT/.test(haystack)) return "FIN_SERVICES_NON_LENDER"
  return "GENERAL"
}

export async function loadSecurityScoringSnapshot(securityId: string, sector: string | null, industry: string | null): Promise<SecurityScoringSnapshot> {
  const profileCode = profileForSector(sector, industry)
  const [modelResult, profileResult, ratingsResult] = await Promise.all([
    supabase.from("scoring_models").select("id,name,status").eq("code", "PAI_STOCK_SCORE").eq("version", 1).maybeSingle(),
    supabase.from("scoring_profiles").select("code,name").eq("code", profileCode).maybeSingle(),
    supabase.from("external_rating_observations").select("id,agency_code,instrument_type,instrument_description,rating_symbol,outlook,rating_action,rating_date,source_url,retrieved_at,fresh_until,evidence_status").eq("security_id", securityId).order("rating_date", { ascending: false, nullsFirst: false }).order("retrieved_at", { ascending: false }),
  ])
  const failure = [modelResult, profileResult, ratingsResult].find((result) => result.error)
  if (failure?.error) throw failure.error
  const model = modelResult.data
  const profile = profileResult.data
  if (!model) throw new Error("Scoring model is unavailable.")

  const runResult = await supabase.from("stock_score_runs")
    .select("id,run_state,overall_score,evidence_coverage,evidence_confidence,as_of_date")
    .eq("security_id", securityId).eq("scoring_model_id", model.id).eq("scoring_profile", profileCode)
    .order("as_of_date", { ascending: false }).order("created_at", { ascending: false }).limit(1).maybeSingle()
  if (runResult.error) throw runResult.error

  let dimensions: DimensionScore[] = []
  if (runResult.data?.id) {
    const dimensionResult = await supabase.from("stock_dimension_scores")
      .select("dimension_code,dimension_weight,raw_score,weighted_contribution,evidence_coverage,confidence,heat_state")
      .eq("score_run_id", runResult.data.id)
    if (dimensionResult.error) throw dimensionResult.error
    dimensions = (dimensionResult.data ?? []).map((row) => ({
      dimensionCode: row.dimension_code,
      dimensionWeight: Number(row.dimension_weight),
      rawScore: row.raw_score === null ? null : Number(row.raw_score),
      weightedContribution: row.weighted_contribution === null ? null : Number(row.weighted_contribution),
      evidenceCoverage: Number(row.evidence_coverage),
      confidence: Number(row.confidence),
      heatState: row.heat_state,
    }))
  }

  const ratings: ExternalRatingObservation[] = (ratingsResult.data ?? []).map((row) => ({
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

  return {
    profileCode,
    profileName: profile?.name ?? profileCode.replaceAll("_", " "),
    modelName: model.name,
    modelStatus: model.status,
    runState: runResult.data?.run_state ?? null,
    overallScore: runResult.data?.overall_score === null || runResult.data?.overall_score === undefined ? null : Number(runResult.data.overall_score),
    evidenceCoverage: runResult.data?.evidence_coverage === undefined ? null : Number(runResult.data.evidence_coverage),
    evidenceConfidence: runResult.data?.evidence_confidence === undefined ? null : Number(runResult.data.evidence_confidence),
    asOfDate: runResult.data?.as_of_date ?? null,
    dimensions,
    ratings,
  }
}
