export type ResearchMetricApplicability = "APPLICABLE" | "CONDITIONAL" | "NOT_APPLICABLE"
export type ResearchMetricRequirement = "MANDATORY" | "IMPORTANT" | "SUPPLEMENTARY"
export type ResearchMetricDirection = "HIGHER_BETTER" | "LOWER_BETTER" | "RANGE" | "CUSTOM" | "INFORMATIONAL"
export type ResearchEvidenceState = "FRESH" | "STALE" | "MISSING" | "CONFLICTING" | "REVIEW_REQUIRED"
export type ResearchProfileReadinessState = "READY" | "PARTIAL" | "INSUFFICIENT_EVIDENCE" | "BLOCKED_REVIEW"

export interface ResearchMetricHistoryRequirement {
  readonly minimumObservations: number
  readonly preferredObservations: number
  readonly historyUnit: "QUARTER" | "YEAR" | "POINT_IN_TIME" | "EVENT"
}

export interface ResearchMetricContract {
  readonly metricCode: string
  readonly dimension: "QUALITY" | "GROWTH" | "FINANCIAL_STRENGTH" | "EARNINGS_CASH_QUALITY" | "BUSINESS_DURABILITY" | "VALUATION" | "RISK" | "GOVERNANCE"
  readonly applicability: ResearchMetricApplicability
  readonly requirementLevel: ResearchMetricRequirement
  readonly periodTypes: readonly string[]
  readonly history: ResearchMetricHistoryRequirement
  readonly direction: ResearchMetricDirection
  readonly normalizationMethod: string
  readonly calculationOwner: "PORTFOLIOAI" | "CANONICAL_PROVIDER_EVIDENCE" | "OFFICIAL_EVIDENCE"
  readonly sourceContract: string
  readonly freshnessPolicy: string
  readonly scoreCurveVersion: string | null
  readonly reasonCodeNamespace: string
  readonly conditionCode: string | null
}

export interface ResearchProfileContract {
  readonly profileCode: string
  readonly profileVersion: string
  readonly displayName: string
  readonly metrics: readonly ResearchMetricContract[]
}

export interface ResearchMetricEvidence {
  readonly metricCode: string
  readonly state: ResearchEvidenceState
  readonly observationCount: number
}

export interface ResearchProfileEvaluationInput {
  readonly evidence: readonly ResearchMetricEvidence[]
  readonly activeConditions?: readonly string[]
}

export interface ResearchProfileEvaluation {
  readonly state: ResearchProfileReadinessState
  readonly missingMandatory: readonly string[]
  readonly staleMandatory: readonly string[]
  readonly reviewBlocked: readonly string[]
  readonly missingImportant: readonly string[]
  readonly insufficientHistory: readonly string[]
  readonly evidenceCoverage: number
}

function isActiveMetric(metric: ResearchMetricContract, conditions: ReadonlySet<string>) {
  if (metric.applicability === "NOT_APPLICABLE") return false
  if (metric.applicability === "APPLICABLE") return true
  return metric.conditionCode !== null && conditions.has(metric.conditionCode)
}

export function evaluateResearchProfileContract(
  contract: ResearchProfileContract,
  input: ResearchProfileEvaluationInput,
): ResearchProfileEvaluation {
  const conditions = new Set(input.activeConditions ?? [])
  const evidence = new Map(input.evidence.map((item) => [item.metricCode, item]))
  const activeMetrics = contract.metrics.filter((metric) => isActiveMetric(metric, conditions))

  const missingMandatory: string[] = []
  const staleMandatory: string[] = []
  const reviewBlocked: string[] = []
  const missingImportant: string[] = []
  const insufficientHistory: string[] = []
  let satisfied = 0

  for (const metric of activeMetrics) {
    const item = evidence.get(metric.metricCode)
    const reviewState = item?.state === "CONFLICTING" || item?.state === "REVIEW_REQUIRED"
    if (reviewState) {
      if (metric.requirementLevel === "MANDATORY") reviewBlocked.push(metric.metricCode)
      continue
    }

    if (!item || item.state === "MISSING") {
      if (metric.requirementLevel === "MANDATORY") missingMandatory.push(metric.metricCode)
      else if (metric.requirementLevel === "IMPORTANT") missingImportant.push(metric.metricCode)
      continue
    }

    if (item.state === "STALE") {
      if (metric.requirementLevel === "MANDATORY") staleMandatory.push(metric.metricCode)
      else if (metric.requirementLevel === "IMPORTANT") missingImportant.push(metric.metricCode)
      continue
    }

    if (item.observationCount < metric.history.minimumObservations) {
      if (metric.requirementLevel === "MANDATORY") insufficientHistory.push(metric.metricCode)
      else if (metric.requirementLevel === "IMPORTANT") missingImportant.push(metric.metricCode)
      continue
    }

    satisfied += 1
  }

  const evidenceCoverage = activeMetrics.length === 0 ? 0 : satisfied / activeMetrics.length
  const state: ResearchProfileReadinessState = reviewBlocked.length > 0
    ? "BLOCKED_REVIEW"
    : missingMandatory.length > 0 || staleMandatory.length > 0 || insufficientHistory.length > 0
      ? "INSUFFICIENT_EVIDENCE"
      : missingImportant.length > 0
        ? "PARTIAL"
        : "READY"

  return {
    state,
    missingMandatory,
    staleMandatory,
    reviewBlocked,
    missingImportant,
    insufficientHistory,
    evidenceCoverage,
  }
}
