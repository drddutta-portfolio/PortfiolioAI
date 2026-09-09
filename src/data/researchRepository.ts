import { evidenceStatus, metricLabel } from "../features/research/researchPolicy"
import type { ResearchDocument, ResearchMetric, SecurityResearch } from "../features/research/types"
import { supabase } from "../lib/supabase"

const exact = (value: unknown) => typeof value === "number" || typeof value === "string" ? String(value) : null
function sourceField(definition: unknown) {
  if (!definition || typeof definition !== "object" || Array.isArray(definition)) return null
  const field = (definition as { readonly trendlyne_field?: unknown }).trendlyne_field
  return typeof field === "string" && field.trim() ? field : null
}

export async function loadSecurityResearch(securityId: string): Promise<SecurityResearch> {
  const [enrichment, observations, definitions, decisions, documents] = await Promise.all([
    supabase.from("current_security_enrichment_v1").select("security_id,company_name,sector,industry,market_cap_category,fresh_until,enrichment_state").eq("security_id", securityId).maybeSingle(),
    supabase.from("fundamental_observations").select("id,metric_code,numeric_value,text_value,boolean_value,date_value,currency,unit,period_start,period_end,period_type,consolidation_scope,retrieved_at,fresh_until,evidence_status,source_code").eq("security_id", securityId).order("period_end", { ascending: false, nullsFirst: false }).order("retrieved_at", { ascending: false }),
    supabase.from("fundamental_metric_definitions").select("code,name,definition"),
    supabase.from("fundamental_observation_decisions").select("selected_observation_id").eq("security_id", securityId),
    supabase.from("research_documents").select("id,document_type,published_at,reporting_period_start,reporting_period_end,reporting_period_type,identity_status,external_storage_reference,research_document_sources(source_title,source_code,retrieved_at,source_status)").eq("security_id", securityId).order("published_at", { ascending: false, nullsFirst: false }),
  ])
  const failure = [enrichment, observations, definitions, decisions, documents].find((result) => result.error)
  if (failure?.error) throw failure.error
  const names = new Map((definitions.data ?? []).map((definition) => [definition.code, definition.name]))
  const sourceFields = new Map((definitions.data ?? []).map((definition) => [definition.code, sourceField(definition.definition)]))
  const selected = new Set((decisions.data ?? []).map((decision) => decision.selected_observation_id))
  const metrics: ResearchMetric[] = (observations.data ?? []).map((row) => {
    const isSelected = selected.has(row.id)
    const value = exact(row.numeric_value) ?? row.text_value ?? (row.boolean_value === null ? row.date_value : String(row.boolean_value))
    return {
      id: row.id, code: row.metric_code, label: metricLabel(row.metric_code, names.get(row.metric_code)), value,
      numericValue: exact(row.numeric_value), provider: row.source_code, sourceField: sourceFields.get(row.metric_code) ?? null,
      periodStart: row.period_start, periodEnd: row.period_end, periodType: row.period_type,
      scope: row.consolidation_scope, unit: row.unit, currency: row.currency, retrievedAt: row.retrieved_at,
      freshUntil: row.fresh_until, status: evidenceStatus(row.evidence_status, row.fresh_until, isSelected), selected: isSelected,
    }
  })
  const researchDocuments: ResearchDocument[] = (documents.data ?? []).flatMap((document) => {
    const sources = document.research_document_sources ?? []
    if (!sources.length) return [{
      id: document.id, type: document.document_type, title: null, publishedAt: document.published_at,
      periodStart: document.reporting_period_start, periodEnd: document.reporting_period_end, periodType: document.reporting_period_type,
      provider: "Unavailable", retrievedAt: document.published_at ?? "", status: evidenceStatus(document.identity_status, null),
      externalReference: document.external_storage_reference,
    }]
    return sources.map((source) => ({
      id: `${document.id}:${source.retrieved_at}`, type: document.document_type, title: source.source_title,
      publishedAt: document.published_at, periodStart: document.reporting_period_start, periodEnd: document.reporting_period_end,
      periodType: document.reporting_period_type, provider: source.source_code, retrievedAt: source.retrieved_at,
      status: evidenceStatus(source.source_status, null), externalReference: document.external_storage_reference,
    }))
  })
  const row = enrichment.data
  return {
    securityId, companyName: row?.company_name ?? null, sector: row?.sector ?? null, industry: row?.industry ?? null,
    marketCapCategory: row?.market_cap_category ?? null, freshUntil: row?.fresh_until ?? null,
    state: row ? evidenceStatus(row.enrichment_state, row.fresh_until, row.enrichment_state === "AVAILABLE") : "UNAVAILABLE",
    metrics, documents: researchDocuments,
  }
}
