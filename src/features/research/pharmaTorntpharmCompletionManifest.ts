import { parseTrendlyneStoredResults } from "./pharmaStoredDiscoveryParser"

export const TORNTPHARM_SECURITY_ID = "da69b3eb-0343-44f8-912c-288b826118cc" as const
export const TORNTPHARM_V3_SOURCE_RECORD_ID = "2ba94f8c-d34e-4658-926c-5694c21cc9e5" as const
export const TORNTPHARM_COMPLETION_MANIFEST_VERSION = "TORNTPHARM_PHARMA_V1_COMPLETION_V1" as const

export type CompletionCandidateState = "ELIGIBLE_RETAINED" | "BLOCKED_SEMANTIC" | "OFFICIAL_SOURCE_REQUIRED" | "MARKET_SOURCE_REQUIRED"

export interface TorntpharmCompletionCandidate {
  readonly state: CompletionCandidateState
  readonly domain: string
  readonly metricCode: string | null
  readonly periodEnd: string | null
  readonly providerLabel: string | null
  readonly value: string | null
  readonly sourceRecordId: string | null
  readonly metricDefinitionRequired: boolean
  readonly reason: string
}

interface ExactRetainedMapping {
  readonly providerLabel: string
  readonly metricCode: string
  readonly periodEnd: string
  readonly domain: string
  readonly metricDefinitionRequired: boolean
  readonly reason: string
}

const RETAINED_EXACT_MAPPINGS: readonly ExactRetainedMapping[] = [
  {
    providerLabel: "Net Profit Ann. 2Y ago",
    metricCode: "NET_PROFIT_ANNUAL",
    periodEnd: "2024-03-31",
    domain: "PAT / EPS history",
    metricDefinitionRequired: true,
    reason: "Exact annual net-profit point under the previously validated Torrent annual period identity.",
  },
  {
    providerLabel: "Net Profit Ann. 3Y Ago",
    metricCode: "NET_PROFIT_ANNUAL",
    periodEnd: "2023-03-31",
    domain: "PAT / EPS history",
    metricDefinitionRequired: true,
    reason: "Exact annual net-profit point under the previously validated Torrent annual period identity.",
  },
  {
    providerLabel: "Net Profit Ann. 4Y Ago",
    metricCode: "NET_PROFIT_ANNUAL",
    periodEnd: "2022-03-31",
    domain: "PAT / EPS history",
    metricDefinitionRequired: true,
    reason: "Exact annual net-profit point under the previously validated Torrent annual period identity.",
  },
  {
    providerLabel: "Net Profit Ann. 5Y Ago",
    metricCode: "NET_PROFIT_ANNUAL",
    periodEnd: "2021-03-31",
    domain: "PAT / EPS history",
    metricDefinitionRequired: true,
    reason: "Exact annual net-profit point under the previously validated Torrent annual period identity.",
  },
  {
    providerLabel: "ROCE Ann. %",
    metricCode: "ROCE_ANNUAL",
    periodEnd: "2026-03-31",
    domain: "ROCE history",
    metricDefinitionRequired: false,
    reason: "Current annual ROCE point; period identity is the completed FY ended 31 March 2026.",
  },
  {
    providerLabel: "ROCE Ann. 1Y Ago %",
    metricCode: "ROCE_ANNUAL",
    periodEnd: "2025-03-31",
    domain: "ROCE history",
    metricDefinitionRequired: false,
    reason: "Prior annual ROCE point under the validated annual-period mapping.",
  },
  {
    providerLabel: "Interest Coverage Ratio Ann. 1Y Ago",
    metricCode: "INTEREST_COVERAGE_ANNUAL",
    periodEnd: "2025-03-31",
    domain: "Financial strength / leverage",
    metricDefinitionRequired: true,
    reason: "Exact annual interest-coverage point; useful but insufficient alone for the leverage contract.",
  },
  {
    providerLabel: "Short Term Debt Ann. 1Y ago",
    metricCode: "SHORT_TERM_DEBT_ANNUAL",
    periodEnd: "2025-03-31",
    domain: "Financial strength / leverage",
    metricDefinitionRequired: true,
    reason: "Exact short-term-debt point. It must never be substituted for total debt.",
  },
] as const

const BLOCKED_SEMANTIC: readonly TorntpharmCompletionCandidate[] = [
  {
    state: "BLOCKED_SEMANTIC",
    domain: "PAT / EPS history",
    metricCode: "EPS_DILUTED_ANNUAL",
    periodEnd: null,
    providerLabel: "Cash EPS Ann. / historical Cash EPS labels",
    value: null,
    sourceRecordId: TORNTPHARM_V3_SOURCE_RECORD_ID,
    metricDefinitionRequired: true,
    reason: "Cash EPS is not diluted EPS and cannot satisfy the PHARMA_V1 diluted-EPS history contract.",
  },
  {
    state: "BLOCKED_SEMANTIC",
    domain: "Cash conversion",
    metricCode: "CAPEX_ANNUAL",
    periodEnd: null,
    providerLabel: "Cash from Investing Act. Ann. historical labels",
    value: null,
    sourceRecordId: TORNTPHARM_V3_SOURCE_RECORD_ID,
    metricDefinitionRequired: true,
    reason: "Investing cash flow is not capital expenditure; no implicit substitution is permitted.",
  },
  {
    state: "BLOCKED_SEMANTIC",
    domain: "Revenue history",
    metricCode: "REVENUE_ANNUAL",
    periodEnd: null,
    providerLabel: "Total Rev./Rev. Ann. historical labels",
    value: null,
    sourceRecordId: TORNTPHARM_V3_SOURCE_RECORD_ID,
    metricDefinitionRequired: false,
    reason: "R4H established that generic historical revenue labels are total income, not the operating-revenue concept used by the parent contract.",
  },
  {
    state: "BLOCKED_SEMANTIC",
    domain: "ROCE history",
    metricCode: "ROCE_ANNUAL",
    periodEnd: null,
    providerLabel: "ROCE Ann. 3Y Avg % / ROCE Ann. 5Y Avg %",
    value: null,
    sourceRecordId: TORNTPHARM_V3_SOURCE_RECORD_ID,
    metricDefinitionRequired: false,
    reason: "Multi-year averages cannot be substituted for missing period-by-period annual ROCE observations.",
  },
  {
    state: "BLOCKED_SEMANTIC",
    domain: "PAT / EPS history",
    metricCode: "NET_PROFIT_ANNUAL",
    periodEnd: "2026-03-31",
    providerLabel: "PAT Before ExtraOrdinary Items Ann.",
    value: null,
    sourceRecordId: TORNTPHARM_V3_SOURCE_RECORD_ID,
    metricDefinitionRequired: true,
    reason: "This label is not silently merged with the historical Net Profit Ann. lineage; issuer financial statements can resolve the current PAT semantics.",
  },
  {
    state: "BLOCKED_SEMANTIC",
    domain: "Operating margin history",
    metricCode: null,
    periodEnd: null,
    providerLabel: "Provider OPM percentages",
    value: null,
    sourceRecordId: TORNTPHARM_V3_SOURCE_RECORD_ID,
    metricDefinitionRequired: false,
    reason: "PHARMA_V1 uses matched raw operating revenue/profit as the canonical quarterly margin path. Direct provider percentages may corroborate but do not fabricate missing raw periods.",
  },
] as const

const EXTERNAL_GAPS: readonly TorntpharmCompletionCandidate[] = [
  {
    state: "OFFICIAL_SOURCE_REQUIRED", domain: "Revenue history", metricCode: "REVENUE_ANNUAL", periodEnd: null, providerLabel: null, value: null, sourceRecordId: null, metricDefinitionRequired: false,
    reason: "Need at least two additional semantically consistent annual operating-revenue periods to reach the parent minimum of three.",
  },
  {
    state: "OFFICIAL_SOURCE_REQUIRED", domain: "Operating margin history", metricCode: "OPERATING_PROFIT_QUARTER", periodEnd: null, providerLabel: null, value: null, sourceRecordId: null, metricDefinitionRequired: false,
    reason: "Need at least three additional matched quarterly operating-profit/revenue periods to reach eight; existing Q6 conflict remains blocked.",
  },
  {
    state: "OFFICIAL_SOURCE_REQUIRED", domain: "ROCE history", metricCode: "ROCE_ANNUAL", periodEnd: null, providerLabel: null, value: null, sourceRecordId: null, metricDefinitionRequired: false,
    reason: "Retained V3 provides two annual ROCE points; at least one more period-resolvable annual point is required.",
  },
  {
    state: "OFFICIAL_SOURCE_REQUIRED", domain: "PAT / EPS history", metricCode: "EPS_DILUTED_ANNUAL", periodEnd: null, providerLabel: null, value: null, sourceRecordId: null, metricDefinitionRequired: true,
    reason: "Need at least three annual diluted-EPS periods matched to annual PAT; Cash EPS is not an acceptable substitute.",
  },
  {
    state: "OFFICIAL_SOURCE_REQUIRED", domain: "Cash conversion", metricCode: "CAPEX_ANNUAL", periodEnd: null, providerLabel: null, value: null, sourceRecordId: null, metricDefinitionRequired: true,
    reason: "Need reviewed capex/FCF plus matched PAT for at least three CFO periods.",
  },
  {
    state: "OFFICIAL_SOURCE_REQUIRED", domain: "Financial strength / leverage", metricCode: "TOTAL_DEBT_ANNUAL", periodEnd: null, providerLabel: null, value: null, sourceRecordId: null, metricDefinitionRequired: true,
    reason: "Need matched total debt, cash/net debt and EBITDA/operating-earnings history; short-term debt alone is not total debt.",
  },
  {
    state: "OFFICIAL_SOURCE_REQUIRED", domain: "Business durability", metricCode: "PHARMA_RND_INTENSITY", periodEnd: null, providerLabel: null, value: null, sourceRecordId: null, metricDefinitionRequired: true,
    reason: "Need issuer-reviewed R&D spend/intensity history plus launch/pipeline/approval evidence.",
  },
  {
    state: "OFFICIAL_SOURCE_REQUIRED", domain: "Regulatory & manufacturing-site risk", metricCode: "PHARMA_REGULATORY_SITE_STATUS", periodEnd: null, providerLabel: null, value: null, sourceRecordId: null, metricDefinitionRequired: true,
    reason: "Material regulated-market exposure requires issuer/regulator evidence; Trendlyne does not replace the official-source contract.",
  },
  {
    state: "OFFICIAL_SOURCE_REQUIRED", domain: "Ownership & governance", metricCode: "PHARMA_OWNERSHIP_GOVERNANCE", periodEnd: null, providerLabel: null, value: null, sourceRecordId: null, metricDefinitionRequired: false,
    reason: "Current canonical ownership is useful, but the parent contract needs a multi-quarter trend and governance-event overlay.",
  },
  {
    state: "OFFICIAL_SOURCE_REQUIRED", domain: "Valuation", metricCode: "PHARMA_VALUATION_CONTEXT", periodEnd: null, providerLabel: null, value: null, sourceRecordId: null, metricDefinitionRequired: false,
    reason: "Current P/E evidence is useful but self-history/peer context and cash-based valuation remain incomplete.",
  },
  {
    state: "MARKET_SOURCE_REQUIRED", domain: "Momentum / market risk", metricCode: null, periodEnd: null, providerLabel: null, value: null, sourceRecordId: null, metricDefinitionRequired: false,
    reason: "12M/6M momentum, relative strength, drawdown and volatility require the canonical Angel One market-history path.",
  },
] as const

function normalizeLabel(value: string) {
  return value.trim().replaceAll(/\s+/gu, " ").toLocaleLowerCase()
}

/**
 * Builds the exact zero-provider-call candidate manifest from the stored V3 raw
 * source record. The function never guesses missing values or maps semantically
 * similar labels. Cross-query parser conflicts are excluded automatically.
 */
export function buildTorntpharmRetainedCompletionManifest(rawPayload: unknown): readonly TorntpharmCompletionCandidate[] {
  const parsed = parseTrendlyneStoredResults(rawPayload, "TORNTPHARM")
  const byLabel = new Map(parsed.values.map((item) => [normalizeLabel(item.label), item]))
  const eligible = RETAINED_EXACT_MAPPINGS.flatMap((mapping): TorntpharmCompletionCandidate[] => {
    const item = byLabel.get(normalizeLabel(mapping.providerLabel))
    if (!item || item.value === null) return []
    return [{
      state: "ELIGIBLE_RETAINED",
      domain: mapping.domain,
      metricCode: mapping.metricCode,
      periodEnd: mapping.periodEnd,
      providerLabel: mapping.providerLabel,
      value: item.value,
      sourceRecordId: TORNTPHARM_V3_SOURCE_RECORD_ID,
      metricDefinitionRequired: mapping.metricDefinitionRequired,
      reason: mapping.reason,
    }]
  })
  return [...eligible, ...BLOCKED_SEMANTIC, ...EXTERNAL_GAPS]
}

export const TORNTPHARM_COMPLETION_BLOCKERS = Object.freeze([
  "Revenue history",
  "Operating margin history",
  "ROCE history",
  "PAT / EPS history",
  "Cash conversion",
  "Financial strength / leverage",
  "Business durability",
  "Regulatory & manufacturing-site risk",
  "Ownership & governance",
  "Valuation",
  "Momentum / market risk",
])
