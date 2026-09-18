import type { PharmaSubprofileCode } from "./pharmaSubprofileAssignment"

export const PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT_VERSION =
  "PHARMA_V1_ADAPTIVE_CLASSIFICATION_V1_PROPOSAL" as const

export const PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT = {
  version: PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT_VERSION,
  state: "PROPOSAL_ONLY",
  annualPeriodsRequired: 2,
  materialOverlayThresholdPercent: 15,
  emergingWatchLowerBoundPercent: 5,
  primaryRequiresStableLeadershipPeriods: 2,
  primaryReassignmentRequiresStructuralChange: true,
  effectiveDatingRequired: true,
  unreviewedEvidenceMayClassify: false,
  scoreExecutionEnabled: false,
} as const

export type PharmaClassificationEvidenceTier =
  | "AUDITED_SEGMENT"
  | "ANNUAL_REPORT_BUSINESS_MIX"
  | "ISSUER_RESULTS_PRESENTATION"
  | "OFFICIAL_SUBSIDIARY_PRODUCT_FACILITY"
  | "OTHER_OFFICIAL_EXCHANGE"

export interface PharmaAnnualExposureObservation {
  readonly exposureCode: PharmaSubprofileCode
  readonly periodEnd: string
  readonly revenueSharePercent: number | null
  readonly profitSharePercent: number | null
  readonly growingTowardMaterialityReviewed: boolean
  readonly evidenceTier: PharmaClassificationEvidenceTier
  readonly sourceReference: string
  readonly reviewState: "REVIEWED" | "PROVISIONAL" | "DISPUTED"
}

export type PharmaAdaptiveExposureRole =
  | "PRIMARY_CANDIDATE"
  | "MATERIAL_OVERLAY"
  | "EMERGING_WATCH"
  | "BELOW_SCORING_MATERIALITY"
  | "REVIEW_REQUIRED"

export interface PharmaAdaptiveExposureClassification {
  readonly exposureCode: PharmaSubprofileCode
  readonly role: PharmaAdaptiveExposureRole
  readonly materialityBasis: "REVENUE" | "PROFIT" | "BOTH" | "NONE"
  readonly latestEconomicSharePercent: number | null
  readonly consecutiveMaterialPeriods: number
  readonly reasonCodes: readonly string[]
}

export interface PharmaAdaptiveClassificationProposal {
  readonly contractVersion: typeof PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly classificationState: "READY_FOR_REVIEW" | "REVIEW_REQUIRED" | "INSUFFICIENT_EVIDENCE"
  readonly primaryCandidate: PharmaSubprofileCode | null
  readonly exposures: readonly PharmaAdaptiveExposureClassification[]
  readonly effectiveDatingRequired: true
  readonly scoreExecutionEnabled: false
  readonly reasonCodes: readonly string[]
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u

function checkedShare(value: number | null, label: string) {
  if (value === null) return null
  if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error(`${label} must be between 0 and 100`)
  return value
}

function reviewedRows(rows: readonly PharmaAnnualExposureObservation[]) {
  return rows
    .filter((row) => row.reviewState === "REVIEWED")
    .map((row) => {
      if (!ISO_DATE.test(row.periodEnd)) throw new Error("Classification periodEnd must use YYYY-MM-DD")
      if (!row.sourceReference.trim()) throw new Error("Classification evidence requires sourceReference")
      return {
        ...row,
        revenueSharePercent: checkedShare(row.revenueSharePercent, "revenueSharePercent"),
        profitSharePercent: checkedShare(row.profitSharePercent, "profitSharePercent"),
      }
    })
    .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd))
}

function economicShare(row: PharmaAnnualExposureObservation) {
  const available = [row.revenueSharePercent, row.profitSharePercent].filter((value): value is number => value !== null)
  return available.length ? Math.max(...available) : null
}

function materialityBasis(row: PharmaAnnualExposureObservation): PharmaAdaptiveExposureClassification["materialityBasis"] {
  const revenue = row.revenueSharePercent !== null && row.revenueSharePercent >= PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT.materialOverlayThresholdPercent
  const profit = row.profitSharePercent !== null && row.profitSharePercent >= PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT.materialOverlayThresholdPercent
  if (revenue && profit) return "BOTH"
  if (revenue) return "REVENUE"
  if (profit) return "PROFIT"
  return "NONE"
}

function leadersForPeriod(rows: readonly PharmaAnnualExposureObservation[]) {
  const revenueRows = rows.filter((row) => row.revenueSharePercent !== null)
  const profitRows = rows.filter((row) => row.profitSharePercent !== null)
  const revenueLeader = revenueRows.length
    ? [...revenueRows].sort((a, b) => (b.revenueSharePercent ?? -1) - (a.revenueSharePercent ?? -1))[0]!.exposureCode
    : null
  const profitLeader = profitRows.length
    ? [...profitRows].sort((a, b) => (b.profitSharePercent ?? -1) - (a.profitSharePercent ?? -1))[0]!.exposureCode
    : null

  if (revenueLeader && profitLeader && revenueLeader !== profitLeader) {
    return { leader: null, conflict: true }
  }
  return { leader: revenueLeader ?? profitLeader, conflict: false }
}

function classifySecondary(rows: readonly PharmaAnnualExposureObservation[]): PharmaAdaptiveExposureClassification {
  const latest = rows[0]
  if (!latest) {
    throw new Error("classifySecondary requires reviewed exposure rows")
  }
  const latestShare = economicShare(latest)
  if (latestShare === null) {
    return {
      exposureCode: latest.exposureCode,
      role: "REVIEW_REQUIRED",
      materialityBasis: "NONE",
      latestEconomicSharePercent: null,
      consecutiveMaterialPeriods: 0,
      reasonCodes: ["NO_REVENUE_OR_PROFIT_SHARE"],
    }
  }

  let consecutiveMaterialPeriods = 0
  for (const row of rows) {
    const share = economicShare(row)
    if (share !== null && share >= PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT.materialOverlayThresholdPercent) consecutiveMaterialPeriods += 1
    else break
  }

  if (consecutiveMaterialPeriods >= PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT.annualPeriodsRequired) {
    return {
      exposureCode: latest.exposureCode,
      role: "MATERIAL_OVERLAY",
      materialityBasis: materialityBasis(latest),
      latestEconomicSharePercent: latestShare,
      consecutiveMaterialPeriods,
      reasonCodes: ["MATERIAL_THRESHOLD_SUSTAINED"],
    }
  }

  if (
    latestShare >= PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT.emergingWatchLowerBoundPercent
    || latest.growingTowardMaterialityReviewed
  ) {
    return {
      exposureCode: latest.exposureCode,
      role: "EMERGING_WATCH",
      materialityBasis: materialityBasis(latest),
      latestEconomicSharePercent: latestShare,
      consecutiveMaterialPeriods,
      reasonCodes: latestShare >= PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT.materialOverlayThresholdPercent
        ? ["MATERIAL_THRESHOLD_NOT_YET_SUSTAINED"]
        : latest.growingTowardMaterialityReviewed
          ? ["REVIEWED_GROWTH_TOWARD_MATERIALITY"]
          : ["EMERGING_MATERIALITY_BAND"],
    }
  }

  return {
    exposureCode: latest.exposureCode,
    role: "BELOW_SCORING_MATERIALITY",
    materialityBasis: "NONE",
    latestEconomicSharePercent: latestShare,
    consecutiveMaterialPeriods,
    reasonCodes: ["BELOW_FIVE_PERCENT_SCORING_THRESHOLD"],
  }
}

export function buildPharmaAdaptiveClassificationProposal(
  observations: readonly PharmaAnnualExposureObservation[],
  currentPrimary: PharmaSubprofileCode | null = null,
  structurallyConfirmedReassignment: PharmaSubprofileCode | null = null,
): PharmaAdaptiveClassificationProposal {
  const reviewed = reviewedRows(observations)
  if (!reviewed.length) {
    return {
      contractVersion: PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT_VERSION,
      state: "PROPOSAL_ONLY",
      classificationState: "INSUFFICIENT_EVIDENCE",
      primaryCandidate: null,
      exposures: [],
      effectiveDatingRequired: true,
      scoreExecutionEnabled: false,
      reasonCodes: ["NO_REVIEWED_CLASSIFICATION_EVIDENCE"],
    }
  }

  const periods = [...new Set(reviewed.map((row) => row.periodEnd))].sort((a, b) => b.localeCompare(a))
  if (periods.length < PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT.primaryRequiresStableLeadershipPeriods) {
    return {
      contractVersion: PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT_VERSION,
      state: "PROPOSAL_ONLY",
      classificationState: "INSUFFICIENT_EVIDENCE",
      primaryCandidate: null,
      exposures: [],
      effectiveDatingRequired: true,
      scoreExecutionEnabled: false,
      reasonCodes: ["PRIMARY_REQUIRES_TWO_ANNUAL_PERIODS"],
    }
  }

  const trailingPeriods = periods.slice(0, PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT.primaryRequiresStableLeadershipPeriods)
  const leaders = trailingPeriods.map((period) => leadersForPeriod(reviewed.filter((row) => row.periodEnd === period)))
  if (leaders.some((item) => item.conflict)) {
    return {
      contractVersion: PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT_VERSION,
      state: "PROPOSAL_ONLY",
      classificationState: "REVIEW_REQUIRED",
      primaryCandidate: null,
      exposures: [],
      effectiveDatingRequired: true,
      scoreExecutionEnabled: false,
      reasonCodes: ["REVENUE_PROFIT_PRIMARY_LEADERSHIP_CONFLICT"],
    }
  }

  const primaryCandidate = leaders[0]?.leader ?? null
  if (!primaryCandidate || leaders.some((item) => item.leader !== primaryCandidate)) {
    return {
      contractVersion: PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT_VERSION,
      state: "PROPOSAL_ONLY",
      classificationState: "REVIEW_REQUIRED",
      primaryCandidate: null,
      exposures: [],
      effectiveDatingRequired: true,
      scoreExecutionEnabled: false,
      reasonCodes: ["PRIMARY_LEADERSHIP_NOT_STABLE_FOR_TWO_PERIODS"],
    }
  }

  if (
    currentPrimary
    && primaryCandidate !== currentPrimary
    && structurallyConfirmedReassignment !== primaryCandidate
  ) {
    return {
      contractVersion: PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT_VERSION,
      state: "PROPOSAL_ONLY",
      classificationState: "REVIEW_REQUIRED",
      primaryCandidate,
      exposures: [],
      effectiveDatingRequired: true,
      scoreExecutionEnabled: false,
      reasonCodes: ["PRIMARY_REASSIGNMENT_REQUIRES_STRUCTURAL_CHANGE_EVIDENCE"],
    }
  }

  const byExposure = new Map<PharmaSubprofileCode, PharmaAnnualExposureObservation[]>()
  for (const row of reviewed) {
    const existing = byExposure.get(row.exposureCode) ?? []
    existing.push(row)
    byExposure.set(row.exposureCode, existing)
  }

  const exposures = [...byExposure.entries()]
    .map(([exposureCode, rows]) => exposureCode === primaryCandidate
      ? {
          exposureCode,
          role: "PRIMARY_CANDIDATE" as const,
          materialityBasis: materialityBasis(rows[0]!),
          latestEconomicSharePercent: economicShare(rows[0]!),
          consecutiveMaterialPeriods: 0,
          reasonCodes: ["STABLE_PRIMARY_LEADERSHIP_TWO_PERIODS"],
        }
      : classifySecondary(rows))
    .sort((a, b) => a.exposureCode.localeCompare(b.exposureCode))

  return {
    contractVersion: PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT_VERSION,
    state: "PROPOSAL_ONLY",
    classificationState: "READY_FOR_REVIEW",
    primaryCandidate,
    exposures,
    effectiveDatingRequired: true,
    scoreExecutionEnabled: false,
    reasonCodes: currentPrimary && currentPrimary !== primaryCandidate
      ? ["STRUCTURAL_PRIMARY_REASSIGNMENT_CONFIRMED"]
      : ["STABLE_PRIMARY_CLASSIFICATION"],
  }
}
