import type { ResearchMetricContract } from "./researchProfileContract"
import type { TorntpharmOfficialManifestRow } from "./torntpharmOfficialManifestFixture"

export type ManifestRowClassification = "PARENT_REQUIREMENT_EVIDENCE" | "SUBPROFILE_REQUIREMENT_EVIDENCE" | "CONDITION_ACTIVATION_EVIDENCE" | "CONTEXTUAL_NON_READINESS_EVIDENCE" | "DUPLICATE_OR_CONFLICTING_EVIDENCE" | "UNSUPPORTED_FOR_PROMOTION"

export interface ManifestDryRunRow extends TorntpharmOfficialManifestRow {
  readonly targetRequirementCode: string | null
  readonly classification: ManifestRowClassification
  readonly promotionEligible: boolean
  readonly note: string
}

const TARGET_BY_METRIC: Readonly<Record<string, string>> = {
  REVENUE_ANNUAL: "PHARMA_REVENUE_GROWTH_HISTORY",
  OPERATING_REVENUE_QUARTER: "PHARMA_OPERATING_MARGIN_HISTORY",
  OPERATING_PROFIT_QUARTER: "PHARMA_OPERATING_MARGIN_HISTORY",
  PAT_ATTRIBUTABLE_ANNUAL: "PHARMA_PAT_EPS_HISTORY",
  EPS_DILUTED_ANNUAL: "PHARMA_PAT_EPS_HISTORY",
  CFO_ANNUAL: "PHARMA_CASH_CONVERSION_HISTORY",
  CAPEX_ANNUAL: "PHARMA_CASH_CONVERSION_HISTORY",
  FREE_CASH_FLOW_ANNUAL: "PHARMA_CASH_CONVERSION_HISTORY",
  ROCE_MANAGEMENT_ANNUAL: "PHARMA_ROCE_HISTORY",
  NET_DEBT_EBITDA_ANNUAL: "PHARMA_BALANCE_SHEET_LEVERAGE",
  INTEREST_COVERAGE_ANNUAL: "PHARMA_BALANCE_SHEET_LEVERAGE",
  TOTAL_DEBT_ANNUAL: "PHARMA_BALANCE_SHEET_LEVERAGE",
  CASH_EQUIVALENTS_ANNUAL: "PHARMA_BALANCE_SHEET_LEVERAGE",
  EBITDA_ANNUAL: "PHARMA_BALANCE_SHEET_LEVERAGE",
  RND_EXPENSE_ANNUAL: "PHARMA_RND_INTENSITY",
  RND_INTENSITY_PERCENT: "PHARMA_RND_INTENSITY",
}

export interface PharmaManifestDryRunReport {
  readonly rows: readonly ManifestDryRunRow[]
  readonly counts: Readonly<Record<ManifestRowClassification, number>>
  readonly supportedRequirementCodes: readonly string[]
  readonly missingMandatoryRequirementCodes: readonly string[]
  readonly expectedMandatoryReadiness: { readonly ready: number; readonly total: number; readonly ratio: number }
}

export function dryRunPharmaManifest(rows: readonly TorntpharmOfficialManifestRow[], effectiveMetrics: readonly ResearchMetricContract[]): PharmaManifestDryRunReport {
  const effective = new Map(effectiveMetrics.map((metric) => [metric.metricCode, metric]))
  const identities = new Set<string>()
  const mapped = rows.map((row): ManifestDryRunRow => {
    const targetRequirementCode = TARGET_BY_METRIC[row.metricCode] ?? null
    const identity = `${row.metricCode}:${row.periodEnd}`
    const duplicate = identities.has(identity)
    identities.add(identity)
    if (duplicate) return { ...row, targetRequirementCode, classification: "DUPLICATE_OR_CONFLICTING_EVIDENCE", promotionEligible: false, note: "Duplicate metric-period identity in candidate manifest." }
    if (!targetRequirementCode || !effective.has(targetRequirementCode)) return { ...row, targetRequirementCode, classification: "UNSUPPORTED_FOR_PROMOTION", promotionEligible: false, note: "No active effective-contract target." }
    const contextual = targetRequirementCode === "PHARMA_RND_INTENSITY"
    return { ...row, targetRequirementCode, classification: contextual ? "CONTEXTUAL_NON_READINESS_EVIDENCE" : "PARENT_REQUIREMENT_EVIDENCE", promotionEligible: true, note: row.lineage === "PORTFOLIOAI_DERIVED" ? "Requires verified input linkage and derived-source lineage." : "Requires execution-time source validation." }
  })
  const supportedRequirementCodes = [...new Set(mapped.filter((row) => row.promotionEligible && row.classification === "PARENT_REQUIREMENT_EVIDENCE").flatMap((row) => row.targetRequirementCode ? [row.targetRequirementCode] : []))].sort()
  const mandatory = effectiveMetrics.filter((metric) => metric.applicability === "APPLICABLE" && metric.requirementLevel === "MANDATORY")
  const ready = mandatory.filter((metric) => supportedRequirementCodes.includes(metric.metricCode)).length
  const classifications: readonly ManifestRowClassification[] = ["PARENT_REQUIREMENT_EVIDENCE", "SUBPROFILE_REQUIREMENT_EVIDENCE", "CONDITION_ACTIVATION_EVIDENCE", "CONTEXTUAL_NON_READINESS_EVIDENCE", "DUPLICATE_OR_CONFLICTING_EVIDENCE", "UNSUPPORTED_FOR_PROMOTION"]
  return {
    rows: mapped,
    counts: Object.fromEntries(classifications.map((classification) => [classification, mapped.filter((row) => row.classification === classification).length])) as Readonly<Record<ManifestRowClassification, number>>,
    supportedRequirementCodes,
    missingMandatoryRequirementCodes: mandatory.filter((metric) => !supportedRequirementCodes.includes(metric.metricCode)).map((metric) => metric.metricCode),
    expectedMandatoryReadiness: { ready, total: mandatory.length, ratio: mandatory.length ? ready / mandatory.length : 0 },
  }
}
