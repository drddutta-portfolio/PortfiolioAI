export type ResearchEvidenceStatus = "VERIFIED" | "PROVISIONAL" | "CONFLICTING" | "AMBIGUOUS" | "REVIEW_REQUIRED" | "STALE" | "UNAVAILABLE"

export interface ResearchMetric {
  readonly id: string
  readonly code: string
  readonly label: string
  readonly value: string | null
  readonly numericValue: string | null
  readonly provider: string
  readonly sourceField: string | null
  readonly periodStart: string | null
  readonly periodEnd: string | null
  readonly periodType: string | null
  readonly scope: string | null
  readonly unit: string | null
  readonly currency: string | null
  readonly retrievedAt: string
  readonly freshUntil: string
  readonly status: ResearchEvidenceStatus
  readonly selected: boolean
}

export interface ResearchDocument {
  readonly id: string
  readonly type: string
  readonly title: string | null
  readonly publishedAt: string | null
  readonly periodStart: string | null
  readonly periodEnd: string | null
  readonly periodType: string | null
  readonly provider: string
  readonly retrievedAt: string
  readonly status: ResearchEvidenceStatus
  readonly externalReference: string | null
}

export interface SecurityResearch {
  readonly securityId: string
  readonly companyName: string | null
  readonly sector: string | null
  readonly industry: string | null
  readonly marketCapCategory: string | null
  readonly freshUntil: string | null
  readonly state: ResearchEvidenceStatus
  readonly metrics: readonly ResearchMetric[]
  readonly documents: readonly ResearchDocument[]
}
