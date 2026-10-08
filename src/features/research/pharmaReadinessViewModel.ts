import { buildPharmaCanonicalHistoryView } from "./pharmaCanonicalHistoryView"
import { PHARMA_RESEARCH_PROFILE_V1 } from "./pharmaResearchProfile"
import { PHARMA_V1_SOURCE_READINESS, type PharmaSourceReadinessState } from "./pharmaSourceReadiness"
import type { ResearchMetric, SecurityResearch } from "./types"

export const PHARMA_READINESS_VIEW_VERSION = "PHARMA_READINESS_VIEW_V8" as const

export type PharmaReadinessDisplayState = "NORMALIZATION_READY" | "VALIDATED_SOURCE" | "PARTIAL" | "PENDING" | "OFFICIAL_SOURCE_PENDING"
export type PharmaCachedEvidenceState = "READY" | "PARTIAL" | "MISSING" | "CONFLICTING"

type PharmaMetricCode =
  | "PHARMA_REVENUE_GROWTH_HISTORY"
  | "PHARMA_OPERATING_MARGIN_HISTORY"
  | "PHARMA_ROCE_HISTORY"
  | "PHARMA_PAT_EPS_HISTORY"
  | "PHARMA_CASH_CONVERSION_HISTORY"
  | "PHARMA_BALANCE_SHEET_LEVERAGE"
  | "PHARMA_REGULATORY_SITE_STATUS"
  | "PHARMA_DOMESTIC_REVENUE_GROWTH"
  | "PHARMA_EXPORT_US_REVENUE_GROWTH"
  | "PHARMA_RND_INTENSITY"
  | "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE"
  | "PHARMA_OWNERSHIP_GOVERNANCE"
  | "PHARMA_VALUATION_CONTEXT"

export interface PharmaReadinessDomain {
  readonly metricCode: PharmaMetricCode
  readonly label: string
  readonly requirement: "MANDATORY" | "IMPORTANT"
  readonly applicability: "APPLICABLE" | "CONDITIONAL"
  readonly conditionCode: string | null
  readonly state: PharmaReadinessDisplayState
  readonly sourceState: PharmaSourceReadinessState
  readonly cachedEvidenceState: PharmaCachedEvidenceState
  readonly sourceContractDetail: string
  readonly canonicalObservationCount: number
  readonly observationCountLabel: string
  readonly minimumObservations: number
  readonly preferredObservations: number
  readonly detail: string
}

export interface PharmaReadinessViewModel {
  readonly profileCode: "PHARMA"
  readonly profileVersion: "PHARMA_V1"
  readonly normalizationVersion: "PHARMA_HISTORY_NORMALIZATION_V3"
  readonly state: "INSUFFICIENT_EVIDENCE"
  readonly canonicalSector: "Pharma"
  readonly domains: readonly PharmaReadinessDomain[]
  readonly validatedSourceDomains: number
  readonly normalizationReadyDomains: number
  readonly mandatoryDomainCount: number
  readonly totalDomainCount: number
  readonly blockers: readonly string[]
  readonly notice: string
}

export interface PharmaReadinessSummaryGroup {
  readonly code: string
  readonly label: string
  readonly ready: number
  readonly total: number
}

const READINESS_GROUPS = [
  { code: "CORE_FINANCIAL", label: "Core financial evidence", metrics: ["PHARMA_REVENUE_GROWTH_HISTORY", "PHARMA_OPERATING_MARGIN_HISTORY", "PHARMA_ROCE_HISTORY", "PHARMA_PAT_EPS_HISTORY", "PHARMA_CASH_CONVERSION_HISTORY", "PHARMA_BALANCE_SHEET_LEVERAGE"] },
  { code: "DURABILITY_GROWTH", label: "Durability & growth evidence", metrics: ["PHARMA_DOMESTIC_REVENUE_GROWTH", "PHARMA_EXPORT_US_REVENUE_GROWTH", "PHARMA_RND_INTENSITY", "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE"] },
  { code: "REGULATORY", label: "Regulatory evidence", metrics: ["PHARMA_REGULATORY_SITE_STATUS"] },
  { code: "OWNERSHIP_VALUATION", label: "Ownership & valuation", metrics: ["PHARMA_OWNERSHIP_GOVERNANCE", "PHARMA_VALUATION_CONTEXT"] },
] as const satisfies readonly { readonly code: string; readonly label: string; readonly metrics: readonly PharmaMetricCode[] }[]

export function buildPharmaReadinessSummaryGroups(view: PharmaReadinessViewModel): readonly PharmaReadinessSummaryGroup[] {
  const byCode = new Map(view.domains.map((domain) => [domain.metricCode, domain]))
  return READINESS_GROUPS.map((group) => {
    const domains = group.metrics.flatMap((metricCode) => {
      const domain = byCode.get(metricCode)
      return domain ? [domain] : []
    })
    return {
      code: group.code,
      label: group.label,
      ready: domains.filter((domain) => domain.state === "VALIDATED_SOURCE" || domain.state === "NORMALIZATION_READY").length,
      total: domains.length,
    }
  })
}

const DOMAIN_LABELS: Readonly<Record<PharmaMetricCode, string>> = {
  PHARMA_REVENUE_GROWTH_HISTORY: "Revenue history",
  PHARMA_OPERATING_MARGIN_HISTORY: "Operating margin history",
  PHARMA_ROCE_HISTORY: "ROCE history",
  PHARMA_PAT_EPS_HISTORY: "PAT / EPS history",
  PHARMA_CASH_CONVERSION_HISTORY: "Cash conversion",
  PHARMA_BALANCE_SHEET_LEVERAGE: "Financial strength / leverage",
  PHARMA_REGULATORY_SITE_STATUS: "Regulatory site evidence",
  PHARMA_DOMESTIC_REVENUE_GROWTH: "Domestic revenue growth",
  PHARMA_EXPORT_US_REVENUE_GROWTH: "Export / US revenue growth",
  PHARMA_RND_INTENSITY: "R&D intensity",
  PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE: "Pipeline / launches / approvals",
  PHARMA_OWNERSHIP_GOVERNANCE: "Ownership & governance",
  PHARMA_VALUATION_CONTEXT: "Valuation context",
}

const PROFILE_CODES: readonly PharmaMetricCode[] = [
  "PHARMA_REVENUE_GROWTH_HISTORY",
  "PHARMA_OPERATING_MARGIN_HISTORY",
  "PHARMA_ROCE_HISTORY",
  "PHARMA_PAT_EPS_HISTORY",
  "PHARMA_CASH_CONVERSION_HISTORY",
  "PHARMA_BALANCE_SHEET_LEVERAGE",
  "PHARMA_REGULATORY_SITE_STATUS",
  "PHARMA_DOMESTIC_REVENUE_GROWTH",
  "PHARMA_EXPORT_US_REVENUE_GROWTH",
  "PHARMA_RND_INTENSITY",
  "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE",
  "PHARMA_OWNERSHIP_GOVERNANCE",
  "PHARMA_VALUATION_CONTEXT",
]

const R4H_REVIEWED_HISTORY_CODES = new Set([
  "REVENUE_ANNUAL",
  "OPERATING_REVENUE_QUARTER",
  "OPERATING_PROFIT_QUARTER",
  "CFO_ANNUAL",
])

function countCanonicalObservations(metrics: readonly ResearchMetric[], codes: readonly string[]) {
  if (!codes.length) return 0
  const distinct = new Set<string>()
  for (const metric of metrics) {
    if (!codes.includes(metric.code)) continue
    const accepted = R4H_REVIEWED_HISTORY_CODES.has(metric.code)
      ? metric.status === "VERIFIED" && Boolean(metric.periodEnd)
      : metric.selected && metric.status !== "UNAVAILABLE"
    if (!accepted) continue
    distinct.add(`${metric.code}:${metric.periodEnd ?? metric.id}`)
  }
  return distinct.size
}

function domainObservationCount(research: SecurityResearch, metricCode: PharmaMetricCode, canonicalEvidenceCodes: readonly string[]) {
  const history = buildPharmaCanonicalHistoryView(research)
  if (metricCode === "PHARMA_OPERATING_MARGIN_HISTORY") {
    return {
      count: history?.quarterlyOpm.length ?? 0,
      label: "Matched evaluable periods",
    }
  }
  if (metricCode === "PHARMA_REVENUE_GROWTH_HISTORY") {
    return {
      count: history?.annualRevenue.length ?? 0,
      label: "Canonical reviewed periods",
    }
  }
  return {
    count: countCanonicalObservations(research.metrics, canonicalEvidenceCodes),
    label: "Canonical reviewed observations",
  }
}

function displayState(sourceState: PharmaSourceReadinessState): PharmaReadinessDisplayState {
  if (sourceState === "PROVIDER_HISTORY_VALIDATED") return "VALIDATED_SOURCE"
  if (sourceState === "OFFICIAL_SOURCE_CONTRACT_PENDING") return "OFFICIAL_SOURCE_PENDING"
  if (sourceState === "CACHE_PARTIAL" || sourceState === "PROVIDER_CAPABILITY_OBSERVED") return "PARTIAL"
  return "PENDING"
}

function cachedEvidenceState(
  metricCode: PharmaMetricCode,
  count: number,
  minimum: number,
  research: SecurityResearch,
): PharmaCachedEvidenceState {
  const history = buildPharmaCanonicalHistoryView(research)
  const hasHistoryConflict = metricCode === "PHARMA_REVENUE_GROWTH_HISTORY"
    ? Boolean(history?.unresolvedIssues.some((issue) => issue.code === "REVENUE_ANNUAL"))
    : metricCode === "PHARMA_OPERATING_MARGIN_HISTORY"
      ? Boolean(
        history?.incompatibleOpmPeriods.length
        || history?.unresolvedIssues.some((issue) => issue.code === "OPERATING_REVENUE_QUARTER" || issue.code === "OPERATING_PROFIT_QUARTER"),
      )
      : false
  if (hasHistoryConflict) return "CONFLICTING"
  if (count === 0) return "MISSING"
  return count >= minimum ? "READY" : "PARTIAL"
}

function cachedEvidenceDetail(state: PharmaCachedEvidenceState, count: number, minimum: number) {
  if (state === "CONFLICTING") return `Current security cache has unresolved incompatible/conflicting evidence; ${count} evaluable observations remain usable outside the blocked periods.`
  if (state === "MISSING") return "No qualifying canonical evidence is cached for this security."
  if (state === "READY") return `Current security cache has ${count} qualifying canonical observations, meeting the minimum evidence count of ${minimum}.`
  return `Current security cache has ${count} qualifying canonical observations; minimum required is ${minimum}.`
}

export function buildPharmaReadinessView(research: SecurityResearch): PharmaReadinessViewModel | null {
  if (research.sector !== "Pharma") return null

  const metricsByCode = new Map(PHARMA_RESEARCH_PROFILE_V1.metrics.map((metric) => [metric.metricCode, metric]))
  const readinessByCode = new Map(PHARMA_V1_SOURCE_READINESS.map((item) => [item.metricCode, item]))
  const domains = PROFILE_CODES.flatMap((metricCode): PharmaReadinessDomain[] => {
    const contract = metricsByCode.get(metricCode)
    const source = readinessByCode.get(metricCode)
    if (!contract || !source) return []
    const observationCount = domainObservationCount(research, metricCode, source.canonicalEvidenceCodes)
    const evidenceState = cachedEvidenceState(metricCode, observationCount.count, contract.history.minimumObservations, research)
    return [{
      metricCode,
      label: DOMAIN_LABELS[metricCode],
      requirement: contract.requirementLevel,
      applicability: contract.applicability,
      conditionCode: contract.conditionCode,
      state: displayState(source.state),
      sourceState: source.state,
      cachedEvidenceState: evidenceState,
      sourceContractDetail: source.reason,
      canonicalObservationCount: observationCount.count,
      observationCountLabel: observationCount.label,
      minimumObservations: contract.history.minimumObservations,
      preferredObservations: contract.history.preferredObservations,
      detail: cachedEvidenceDetail(evidenceState, observationCount.count, contract.history.minimumObservations),
    }]
  })

  const mandatoryDomains = domains.filter((domain) => domain.requirement === "MANDATORY")
  const blockers = mandatoryDomains.filter((domain) => domain.state !== "VALIDATED_SOURCE" && domain.state !== "NORMALIZATION_READY").map((domain) => domain.label)
  return {
    profileCode: "PHARMA",
    profileVersion: "PHARMA_V1",
    normalizationVersion: "PHARMA_HISTORY_NORMALIZATION_V3",
    state: "INSUFFICIENT_EVIDENCE",
    canonicalSector: "Pharma",
    domains,
    validatedSourceDomains: domains.filter((domain) => domain.state === "VALIDATED_SOURCE").length,
    normalizationReadyDomains: domains.filter((domain) => domain.state === "NORMALIZATION_READY").length,
    mandatoryDomainCount: mandatoryDomains.length,
    totalDomainCount: domains.length,
    blockers,
    notice: "PHARMA_V1 remains fail-closed until mandatory evidence and source contracts are satisfied for this security. Cached evidence readiness and source-contract validation are shown separately; repository pilots or migration files do not prove that this security has production evidence.",
  }
}
