import { ALIVUS_G10_1_READ_ONLY_SCORE_RESULT } from "./alivusG101ReadOnlyScore"
import { AUROPHARMA_G10_2_FINAL_RESULT } from "./auropharmaG102FinalResult"
import { BIOCON_G10_3_FINAL_RESULT } from "./bioconG103FinalResult"
import {
  PHARMA_GATE_J_METHOD_AUTHORITIES,
  PHARMA_GATE_J_FINAL_PORTABILITY_VERSION,
} from "./pharmaGateJFinalPortability"
import { SYNGENE_G10_4_FINAL_RESULT } from "./syngeneG104FinalResult"

export const PHARMA_GATE_J_FINAL_CLOSURE_VERSION =
  "PHARMA_GATE_J_FINAL_CLOSURE_V1_CANDIDATE" as const

export const PHARMA_GATE_J_FINAL_CLOSURE = {
  version: PHARMA_GATE_J_FINAL_CLOSURE_VERSION,
  portabilityVersion: PHARMA_GATE_J_FINAL_PORTABILITY_VERSION,
  state: "LOCAL_VALIDATION_PENDING" as const,
  controlledExpansionStages: [
    {
      stage: "G10.1",
      referenceSymbol: "ALIVUS",
      primarySubprofile: "API_BULK_DRUGS",
      resultState: "SCORE_COMPUTABLE_READ_ONLY",
      overallScore: ALIVUS_G10_1_READ_ONLY_SCORE_RESULT.overallScore,
    },
    {
      stage: "G10.2",
      referenceSymbol: "AUROPHARMA",
      primarySubprofile: "GLOBAL_GENERICS",
      resultState: AUROPHARMA_G10_2_FINAL_RESULT.state,
      overallScore: null,
    },
    {
      stage: "G10.3",
      referenceSymbol: "BIOCON",
      primarySubprofile: "BIOPHARMA_BIOSIMILARS",
      resultState: BIOCON_G10_3_FINAL_RESULT.state,
      overallScore: null,
    },
    {
      stage: "G10.4",
      referenceSymbol: "SYNGENE",
      primarySubprofile: "CDMO_CRAMS",
      resultState: SYNGENE_G10_4_FINAL_RESULT.state,
      overallScore: null,
    },
  ] as const,
  runtimePortability: {
    allFiveSubprofilesHaveMethodAuthority:
      Object.keys(PHARMA_GATE_J_METHOD_AUTHORITIES).length === 5,
    symbolSpecificMethodologyRoutingRequired:
      Object.values(PHARMA_GATE_J_METHOD_AUTHORITIES).some(
        (item) => item.symbolSpecificRuntimeRequired,
      ),
    newStockRequiresNewGateJMethodologyBuild: false,
    reviewedSubprofileAssignmentRequired: true,
  },
  isolation: {
    referenceStockIdentityIsValidationOnly: true,
    materialOverlaySecondIndependentScoreAllowed: false,
    emergingWatchNumericParticipationAllowed: false,
    unresolvedExposureAutoResolutionAllowed: false,
    crossSubprofileBandBorrowingAllowed: false,
    hiddenRenormalizationAllowed: false,
    missingMandatoryEvidenceFailsClosed: true,
  },
  gateI: {
    policyUnchanged: true,
    recommendationRequiresCompleteScoreAuthority: true,
  },
  safety: {
    scorePersistenceEnabled: false,
    recommendationPersistenceEnabled: false,
    positionSizingEnabled: false,
    aiInterpretationEnabled: false,
    productionMutationPerformed: false,
    deploymentPerformed: false,
    prMergePerformed: false,
    automaticTradingEnabled: false,
  },
} as const
