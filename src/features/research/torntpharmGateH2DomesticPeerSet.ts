export const TORNTPHARM_GATE_H2_DOMESTIC_PEER_SET_VERSION =
  "TORNTPHARM_GATE_H2_DOMESTIC_PEER_SET_V1_OWNER_APPROVED" as const

export const TORNTPHARM_GATE_H2_DOMESTIC_PEER_SET = {
  version: TORNTPHARM_GATE_H2_DOMESTIC_PEER_SET_VERSION,
  state: "OWNER_APPROVED_READ_ONLY_H2" as const,
  targetSymbol: "TORNTPHARM" as const,
  evaluationDate: "2026-09-20" as const,
  minimumEligiblePeerCount: 3,
  preferredEligiblePeerCount: 5,
  aggregationStatistic: "MEDIAN" as const,
  requiredMetricFamilies: ["PE_TTM", "EV_EBITDA"] as const,
  peers: [
    {
      symbol: "MANKIND" as const,
      primarySubprofileCode: "DOMESTIC_FORMULATIONS" as const,
      confidence: "HIGH" as const,
      secondaryExposureNote: "NO_H2_MATERIAL_SECONDARY_EXPOSURE_REQUIRED_FOR_PEER_ELIGIBILITY" as const,
    },
    {
      symbol: "ERIS" as const,
      primarySubprofileCode: "DOMESTIC_FORMULATIONS" as const,
      confidence: "HIGH" as const,
      secondaryExposureNote: "NO_H2_MATERIAL_SECONDARY_EXPOSURE_REQUIRED_FOR_PEER_ELIGIBILITY" as const,
    },
    {
      symbol: "EMCURE" as const,
      primarySubprofileCode: "DOMESTIC_FORMULATIONS" as const,
      confidence: "MEDIUM" as const,
      secondaryExposureNote: "MATERIAL_GLOBAL_GENERICS_OR_INTERNATIONAL_EXPOSURE_RETAINED" as const,
    },
  ] as const,
  cohortMinimumSatisfiedByOwnerReview: true,
  productionAssignmentPersistenceApproved: false,
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
} as const
