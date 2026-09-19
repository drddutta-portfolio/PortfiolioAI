import {
  PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION,
  pharmaG6CurveContractForPrimary,
} from "./pharmaG6SubprofileCurveApplicability"
import { PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW } from "./pharmaGlobalGenericsG6CoverageReview"

export const PHARMA_GLOBAL_GENERICS_APPLICABILITY_REGISTRY_RECONCILIATION_VERSION =
  "PHARMA_GLOBAL_GENERICS_APPLICABILITY_REGISTRY_RECONCILIATION_V1_PROPOSAL" as const

const globalContract = pharmaG6CurveContractForPrimary("GLOBAL_GENERICS")

export const PHARMA_GLOBAL_GENERICS_APPLICABILITY_REGISTRY_RECONCILIATION = {
  contractVersion: PHARMA_GLOBAL_GENERICS_APPLICABILITY_REGISTRY_RECONCILIATION_VERSION,
  state: "PROPOSAL_ONLY",
  supportedPrimarySubprofile: "GLOBAL_GENERICS",
  applicabilityRegistryVersion: PHARMA_G6_SUBPROFILE_CURVE_APPLICABILITY_VERSION,
  methodologyCoverageSourceVersion: PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW.contractVersion,
  validatedNotActiveFamilies: globalContract.entries
    .filter((entry) => entry.state === "VALIDATED_NOT_ACTIVE")
    .map((entry) => entry.family),
  validatedFailClosedFamilies: globalContract.entries
    .filter((entry) => entry.state === "VALIDATED_FAIL_CLOSED")
    .map((entry) => entry.family),
  unresolvedThresholdFamilies: globalContract.entries
    .filter((entry) => entry.state === "SUBPROFILE_THRESHOLDS_REQUIRED")
    .map((entry) => entry.family),
  unsupportedFamilies: globalContract.entries
    .filter((entry) => entry.state === "UNSUPPORTED_FAIL_CLOSED")
    .map((entry) => entry.family),
  globalRegistryRepresentationAlignedByProposal: true,
  otherPrimarySubprofilesChanged: false,
  validatedFailClosedCreatesNumericCurve: false,
  scoreExecutionEnabled: false,
  activationApproved: false,
  ownerValidationRequired: true,
  g7ReadOnlyAdapterEligibleNow: false,
  g7MayBeReconsideredAfterValidation: true,
} as const
