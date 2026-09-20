import {
  TORNTPHARM_PROPOSED_EVIDENCE_CANDIDATES,
} from "./torntpharmReadOnlyContentReviewDryRun"
import {
  evaluateGateGFinal3GovernanceRuntimeCandidate,
} from "./pharmaGateGFinal3CrossCuttingCandidate"

export const TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING_VERSION =
  "TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING_V1_OWNER_APPROVED" as const

const warning = TORNTPHARM_PROPOSED_EVIDENCE_CANDIDATES.find(
  (item) =>
    item.metricCode === "PHARMA_REGULATORY_SITE_STATUS"
    && item.value === "WARNING_LETTER_ACTIVE",
)

const closeout = TORNTPHARM_PROPOSED_EVIDENCE_CANDIDATES.find(
  (item) =>
    item.metricCode === "PHARMA_REGULATORY_SITE_STATUS"
    && item.value === "WARNING_LETTER_CLOSED_OUT",
)

export const TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING = {
  version: TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING_VERSION,
  state: "OWNER_APPROVED_FAIL_CLOSED_RUNTIME" as const,
  securitySymbol: "TORNTPHARM" as const,
  reviewedChain: {
    warningLetterPresent: Boolean(warning),
    closeoutPresent: Boolean(closeout),
    facilityScope: "INDRAD_FINISHED_DOSAGE_SITE" as const,
    eventHistoryRetained: true,
  },
  companyWideCurrentRegulatoryScopeEstablished: true,
  runtimeInput: {
    eventClass: "REGULATORY" as const,
    severity: "MODERATE" as const,
    governanceBlockedReview: false,
    affectedFacilityProductGeographyEstablished: true,
    regulatoryMateriality: "KNOWN_MATERIAL" as const,
    remediationState: "CLOSED_OUT" as const,
    subsequentOutcomeEstablished: true,
  },
  reasonCodes: [
    "INDRAD_WARNING_TO_CLOSEOUT_CHAIN_REVIEWED",
    "SITE_SCOPE_ESTABLISHED",
    "INDRAD_AND_PITHAMPUR_FDA_CLEARANCE_AFTER_VAI_REVIEWED",
    "FY26_ALL_FOUR_US_FINISHED_PRODUCT_PLANTS_REPORTED_FDA_CLEARED",
    "DAHEJ_EIR_REVIEWED",
    "BILESHWARPURA_APRIL_2026_ZERO_OBSERVATION_INSPECTION_REVIEWED",
    "HISTORICAL_INDRAD_EVENT_RETAINED_AFTER_REMEDIATION",
  ] as const,
  methodologyApproved: true,
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
} as const

export const TORNTPHARM_GATE_G_FINAL_3_RUNTIME_RESULT =
  evaluateGateGFinal3GovernanceRuntimeCandidate(
    TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING.runtimeInput,
  )
