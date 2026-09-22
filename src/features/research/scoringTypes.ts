export type HeatState = "STRONG" | "POSITIVE" | "NEUTRAL" | "WEAK" | "RISK" | "INSUFFICIENT"
export type ScoringProfileSource = "REVIEWED_ASSIGNMENT" | "SECTOR_RULE" | "METHODOLOGY_UNAVAILABLE"
export type ScoringMethodologyState = "AVAILABLE" | "METHODOLOGY_NOT_AVAILABLE" | "REVIEW_REQUIRED"
export type ScoringExecutionState = "AVAILABLE" | "PENDING_ADAPTER" | "BLOCKED"

export interface ExternalRatingObservation {
  readonly id: string
  readonly agencyCode: string
  readonly instrumentType: string | null
  readonly instrumentDescription: string | null
  readonly ratingSymbol: string
  readonly outlook: string | null
  readonly ratingAction: string | null
  readonly ratingDate: string | null
  readonly sourceUrl: string
  readonly retrievedAt: string
  readonly freshUntil: string
  readonly evidenceStatus: string
}

export interface MetricScoreSignal {
  readonly inputCode: string
  readonly label: string
  readonly weight: number
  readonly state: "SCORED" | "AVAILABLE_UNSCORED" | "MISSING" | "PENDING_SOURCE"
  readonly value: number | null
  readonly normalizedScore: number | null
}

export interface DimensionScore {
  readonly dimensionCode: string
  readonly dimensionWeight: number
  readonly rawScore: number | null
  readonly weightedContribution: number | null
  /** Reviewed, fresh evidence present for the configured metric contract. */
  readonly evidenceCoverage: number
  /** Share of the dimension with a reviewed normalization rule and usable score. */
  readonly scoreReadyCoverage: number
  readonly confidence: number
  readonly heatState: HeatState
  readonly signals?: readonly MetricScoreSignal[]
  readonly preview?: boolean
}

export interface SecurityScoringSnapshot {
  readonly profileCode: string
  readonly profileName: string
  readonly profileSource: ScoringProfileSource
  readonly methodologyState?: ScoringMethodologyState
  readonly methodologyReasonCode?: string | null
  readonly scoringExecutionState?: ScoringExecutionState
  readonly scoringExecutionReasonCode?: string | null
  readonly modelName: string
  readonly modelStatus: string
  readonly runState: string | null
  readonly overallScore: number | null
  readonly evidenceCoverage: number | null
  readonly scoreReadyCoverage: number | null
  readonly evidenceConfidence: number | null
  readonly asOfDate: string | null
  readonly dimensions: readonly DimensionScore[]
  readonly ratings: readonly ExternalRatingObservation[]
  readonly previewMode?: boolean
}
