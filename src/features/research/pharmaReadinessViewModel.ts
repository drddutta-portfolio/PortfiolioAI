import { buildPharmaCanonicalHistoryView } from "./pharmaCanonicalHistoryView"
import { PHARMA_RESEARCH_PROFILE_V1 } from "./pharmaResearchProfile"
import { PHARMA_V1_SOURCE_READINESS, type PharmaSourceReadinessState } from "./pharmaSourceReadiness"
import type { ResearchMetric, SecurityResearch } from "./types"

export const PHARMA_READINESS_VIEW_VERSION = "PHARMA_READINESS_VIEW_V7" as const

export type PharmaReadinessDisplayState = "NORMALIZATION_READY" | "VALIDATED_SOURCE" | "PARTIAL" | "PENDING" | "OFFICIAL_SOURCE_PENDING"

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
  readonly canonicalObservationCount: number
  readonly observationCountLabel: string
  readonly minimumObservations: number
  readonly preferredObservations: number
  readonly detail: string
}

export interface PharmaReadinessViewModel {
  readonly profileCode: "PHARMA"
  readonly profileVersion: "PHARMA_V1"
  readonly normalizationVersion: "PHARMA_HISTORY_NORMALIZATION_V2"
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

export function buildPharmaReadinessView(research: SecurityResearch): PharmaReadinessViewModel | null {
  if (research.sector !== "Pharma") return null

  const metricsByCode = new Map(PHARMA_RESEARCH_PROFILE_V1.metrics.map((metric) => [metric.metricCode, metric]))
  const readinessByCode = new Map(PHARMA_V1_SOURCE_READINESS.map((item) => [item.metricCode, item]))
  const domains = PROFILE_CODES.flatMap((metricCode): PharmaReadinessDomain[] => {
    const contract = metricsByCode.get(metricCode)
    const source = readinessByCode.get(metricCode)
    if (!contract || !source) return []
    const observationCount = domainObservationCount(research, metricCode, source.canonicalEvidenceCodes)
    return [{
      metricCode,
      label: DOMAIN_LABELS[metricCode],
      requirement: contract.requirementLevel,
      applicability: contract.applicability,
      conditionCode: contract.conditionCode,
      state: displayState(source.state),
      sourceState: source.state,
      canonicalObservationCount: observationCount.count,
      observationCountLabel: observationCount.label,
      minimumObservations: contract.history.minimumObservations,
      preferredObservations: contract.history.preferredObservations,
      detail: source.reason,
    }]
  })

  const mandatoryDomains = domains.filter((domain) => domain.requirement === "MANDATORY")
  const blockers = mandatoryDomains.filter((domain) => domain.state !== "VALIDATED_SOURCE" && domain.state !== "NORMALIZATION_READY").map((domain) => domain.label)
  return {
    profileCode: "PHARMA",
    profileVersion: "PHARMA_V1",
    normalizationVersion: "PHARMA_HISTORY_NORMALIZATION_V2",
    state: "INSUFFICIENT_EVIDENCE",
    canonicalSector: "Pharma",
    domains,
    validatedSourceDomains: domains.filter((domain) => domain.state === "VALIDATED_SOURCE").length,
    normalizationReadyDomains: domains.filter((domain) => domain.state === "NORMALIZATION_READY").length,
    mandatoryDomainCount: mandatoryDomains.length,
    totalDomainCount: domains.length,
    blockers,
    notice: "PHARMA_V1 remains fail-closed until the mandatory evidence contracts are satisfied. Partial source capability, cached observations and profile-specific UI coverage do not by themselves create a score or recommendation.",
  }
}
