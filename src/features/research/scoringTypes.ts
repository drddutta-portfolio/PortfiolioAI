export type HeatState = "STRONG" | "POSITIVE" | "NEUTRAL" | "WEAK" | "RISK" | "INSUFFICIENT"

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

export interface DimensionScore {
  readonly dimensionCode: string
  readonly dimensionWeight: number
  readonly rawScore: number | null
  readonly weightedContribution: number | null
  readonly evidenceCoverage: number
  readonly confidence: number
  readonly heatState: HeatState
}

export interface SecurityScoringSnapshot {
  readonly profileCode: string
  readonly profileName: string
  readonly modelName: string
  readonly modelStatus: string
  readonly runState: string | null
  readonly overallScore: number | null
  readonly evidenceCoverage: number | null
  readonly evidenceConfidence: number | null
  readonly asOfDate: string | null
  readonly dimensions: readonly DimensionScore[]
  readonly ratings: readonly ExternalRatingObservation[]
}
