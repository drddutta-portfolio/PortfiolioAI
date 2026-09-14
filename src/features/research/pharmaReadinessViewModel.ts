import { PHARMA_RESEARCH_PROFILE_V1 } from "./pharmaResearchProfile"
import { PHARMA_V1_SOURCE_READINESS, type PharmaSourceReadinessState } from "./pharmaSourceReadiness"
import type { ResearchMetric, SecurityResearch } from "./types"

export const PHARMA_READINESS_VIEW_VERSION = "PHARMA_READINESS_VIEW_V5" as const

export type PharmaReadinessDisplayState = "NORMALIZATION_READY" | "VALIDATED_SOURCE" | "PARTIAL" | "PENDING" | "OFFICIAL_SOURCE_PENDING"

type CorePharmaMetricCode =
  | "PHARMA_REVENUE_GROWTH_HISTORY"
  | "PHARMA_OPERATING_MARGIN_HISTORY"
  | "PHARMA_ROCE_HISTORY"
  | "PHARMA_PAT_EPS_HISTORY"
  | "PHARMA_CASH_CONVERSION_HISTORY"
  | "PHARMA_BALANCE_SHEET_LEVERAGE"
  | "PHARMA_REGULATORY_SITE_STATUS"

export interface PharmaReadinessDomain {
  readonly metricCode: CorePharmaMetricCode
  readonly label: string
  readonly requirement: "MANDATORY" | "IMPORTANT"
  readonly state: PharmaReadinessDisplayState
  readonly sourceState: PharmaSourceReadinessState
  readonly canonicalObservationCount: number
  readonly minimumObservations: number
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
  readonly blockers: readonly string[]
  readonly notice: string
}

const DOMAIN_LABELS: Readonly<Record<CorePharmaMetricCode, string>> = {
  PHARMA_REVENUE_GROWTH_HISTORY: "Revenue history",
  PHARMA_OPERATING_MARGIN_HISTORY: "Operating margin history",
  PHARMA_ROCE_HISTORY: "ROCE history",
  PHARMA_PAT_EPS_HISTORY: "PAT / EPS history",
  PHARMA_CASH_CONVERSION_HISTORY: "Cash conversion",
  PHARMA_BALANCE_SHEET_LEVERAGE: "Balance-sheet strength",
  PHARMA_REGULATORY_SITE_STATUS: "Regulatory site evidence",
}

const CORE_CODES: readonly CorePharmaMetricCode[] = [
  "PHARMA_REVENUE_GROWTH_HISTORY",
  "PHARMA_OPERATING_MARGIN_HISTORY",
  "PHARMA_ROCE_HISTORY",
  "PHARMA_PAT_EPS_HISTORY",
  "PHARMA_CASH_CONVERSION_HISTORY",
  "PHARMA_BALANCE_SHEET_LEVERAGE",
  "PHARMA_REGULATORY_SITE_STATUS",
]

function countCanonicalObservations(metrics: readonly ResearchMetric[], codes: readonly string[]) {
  if (!codes.length) return 0
  const distinct = new Set<string>()
  for (const metric of metrics) {
    if (!codes.includes(metric.code) || metric.status !== "VERIFIED") continue
    distinct.add(`${metric.code}:${metric.periodEnd ?? metric.id}`)
  }
  return distinct.size
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
  const domains = CORE_CODES.flatMap((metricCode): PharmaReadinessDomain[] => {
    const contract = metricsByCode.get(metricCode)
    const source = readinessByCode.get(metricCode)
    if (!contract || !source) return []
    return [{
      metricCode,
      label: DOMAIN_LABELS[metricCode],
      requirement: contract.requirementLevel,
      state: displayState(source.state),
      sourceState: source.state,
      canonicalObservationCount: countCanonicalObservations(research.metrics, source.canonicalEvidenceCodes),
      minimumObservations: contract.history.minimumObservations,
      detail: source.reason,
    }]
  })

  const blockers = domains.filter((domain) => domain.state !== "VALIDATED_SOURCE").map((domain) => domain.label)
  return {
    profileCode: "PHARMA",
    profileVersion: "PHARMA_V1",
    normalizationVersion: "PHARMA_HISTORY_NORMALIZATION_V2",
    state: "INSUFFICIENT_EVIDENCE",
    canonicalSector: "Pharma",
    domains,
    validatedSourceDomains: domains.filter((domain) => domain.state === "VALIDATED_SOURCE").length,
    normalizationReadyDomains: 0,
    mandatoryDomainCount: domains.length,
    blockers,
    notice: "R4H canonical history is now stored and visible below, but PHARMA_V1 remains fail-closed. Annual operating-revenue history is still semantically incomplete, quarterly operating history has missing/conflicting periods, and CFO alone does not satisfy cash conversion. No PHARMA_V1 score or recommendation is generated until the remaining mandatory evidence contracts are satisfied.",
  }
}
