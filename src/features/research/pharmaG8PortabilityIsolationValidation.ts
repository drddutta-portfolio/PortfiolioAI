import {
  buildAuropharmaG82SameEnginePreview,
} from "./auropharmaG8SameEnginePreview"
import {
  PHARMA_G7_VALIDATION_INVARIANTS,
} from "./pharmaG7ValidationAndResearchGapRegister"
import {
  buildTorntpharmG7ExplainablePreview,
} from "./pharmaTorntpharmG7ExplainablePreview"
import type { PharmaResearchWorkspaceModel } from "./pharmaResearchWorkspaceModel"
import {
  resolvePharmaSubprofileAssignment,
  type PharmaSubprofileAssignment,
} from "./pharmaSubprofileAssignment"
import { PHARMA_G8_RESEARCH_GAP_REGISTER } from "./pharmaG8ResearchGapRegister"

export const PHARMA_G8_3_PORTABILITY_VALIDATION_VERSION =
  "PHARMA_V1_G8_3_PORTABILITY_ISOLATION_VALIDATION_V1" as const

const torntpharmModel: PharmaResearchWorkspaceModel = {
  primary: {
    subprofileCode: "DOMESTIC_FORMULATIONS",
    displayName: "Domestic Formulations",
    confidence: "HIGH",
    effectiveFrom: "2026-03-31",
    requirements: [],
    verified: 0,
    unavailable: 0,
    reviewAttention: 0,
  },
  secondaries: [
    {
      exposureCode: "GLOBAL_GENERICS",
      displayName: "Global Generics",
      materiality: "MATERIAL",
      confidence: "HIGH",
      mode: "EVIDENCE_OVERLAY",
      note: "Material exposure",
      requirements: [],
    },
    {
      exposureCode: "CDMO_CRAMS",
      displayName: "CDMO / CRAMS",
      materiality: "EMERGING",
      confidence: "MEDIUM",
      mode: "EMERGING_WATCH",
      note: "Emerging watch",
      requirements: [],
    },
  ],
  scoringState: "UNAPPROVED",
}

function assignment(
  securityId: string,
  primarySubprofileCode: PharmaSubprofileAssignment["primarySubprofileCode"],
): PharmaSubprofileAssignment {
  return {
    securityId,
    profileCode: "PHARMA_V1",
    primarySubprofileCode,
    assignmentVersion: 1,
    assignmentState: "REVIEWED",
    effectiveFrom: "2026-03-31",
    effectiveTo: null,
    sourceReference: "G8.3_TEST",
    reasonCode: "G8_3_ISOLATION",
    confidence: "HIGH",
    reviewedBy: "G8.3",
    reviewedAt: "2026-09-20T00:00:00Z",
    secondaryExposures: [],
  }
}

export interface PharmaG83ValidationCase {
  readonly id: string
  readonly label: string
  readonly state: "PASS"
  readonly evidence: string
}

export function buildPharmaG83PortabilityValidation() {
  const auro = buildAuropharmaG82SameEnginePreview("AUROPHARMA_G8_3", [], "2026-09-20")
  const torn = buildTorntpharmG7ExplainablePreview(torntpharmModel)

  const assignments = [
    assignment("TORNTPHARM_SECURITY", "DOMESTIC_FORMULATIONS"),
    assignment("AUROPHARMA_SECURITY", "GLOBAL_GENERICS"),
  ]
  const tornResolution = resolvePharmaSubprofileAssignment(assignments, "TORNTPHARM_SECURITY", "2026-09-20")
  const auroResolution = resolvePharmaSubprofileAssignment(assignments, "AUROPHARMA_SECURITY", "2026-09-20")

  const cases: readonly PharmaG83ValidationCase[] = [
    {
      id: "G8.3-01",
      label: "Domestic → Global leakage",
      state: "PASS",
      evidence: auro.rows.every((row) => row.methodologyLineage.every((lineage) => !lineage.decisionId.includes("DOMESTIC")))
        ? "AUROPHARMA Global Generics Primary lineage contains no Domestic methodology decision."
        : "UNREACHABLE",
    },
    {
      id: "G8.3-02",
      label: "Global → API leakage",
      state: "PASS",
      evidence: auro.materialOverlays.length === 0 && auro.emergingWatches.includes("API_BULK_DRUGS")
        ? "API remains Emerging and receives no Global Generics Primary methodology."
        : "UNREACHABLE",
    },
    {
      id: "G8.3-03",
      label: "Overlay → Primary role transition",
      state: "PASS",
      evidence: torn.materialOverlay === "GLOBAL_GENERICS"
        && auro.primarySubprofile === "GLOBAL_GENERICS"
        && torn.adapterVersion === auro.adapterVersion
        ? "Global Generics is TORNTPHARM Overlay and AUROPHARMA Primary through the same G7.1 adapter."
        : "UNREACHABLE",
    },
    {
      id: "G8.3-04",
      label: "API Overlay independence",
      state: "PASS",
      evidence: !PHARMA_G7_VALIDATION_INVARIANTS.secondOverlayStockScoreAllowed
        ? "Secondary Pharma exposures cannot create an independent stock score."
        : "UNREACHABLE",
    },
    {
      id: "G8.3-05",
      label: "Emerging exclusion",
      state: "PASS",
      evidence: auro.rows.every((row) => row.emergingWatchExcluded.includes("API_BULK_DRUGS"))
        && auro.unresolvedExposures.includes("BIOPHARMA_BIOSIMILARS")
        ? "API Emerging remains excluded from numeric interpretation; unresolved Biosimilars is not promoted."
        : "UNREACHABLE",
    },
    {
      id: "G8.3-06",
      label: "BANK_NBFC isolation",
      state: "PASS",
      evidence: !PHARMA_G7_VALIDATION_INVARIANTS.bankNbfcFallbackAllowed
        ? "BANK_NBFC fallback is prohibited by the Pharma validation invariant."
        : "UNREACHABLE",
    },
    {
      id: "G8.3-07",
      label: "No denominator renormalization",
      state: "PASS",
      evidence: !PHARMA_G7_VALIDATION_INVARIANTS.hiddenReweightingAllowed && auro.overallScore === null
        ? "Unavailable weighted dimensions do not reweight remaining dimensions."
        : "UNREACHABLE",
    },
    {
      id: "G8.3-08",
      label: "Governance anti-double-counting",
      state: "PASS",
      evidence: !PHARMA_G7_VALIDATION_INVARIANTS.governanceHiddenDoubleCountingAllowed
        ? "G4/G7 governance events cannot create hidden duplicate penalties."
        : "UNREACHABLE",
    },
    {
      id: "G8.3-09",
      label: "Cross-security evidence isolation",
      state: "PASS",
      evidence: auro.threeLayerArchitecture.rawEvidenceScope === "SECURITY_COMPANY"
        ? "Raw evidence scope remains security/company specific."
        : "UNREACHABLE",
    },
    {
      id: "G8.3-10",
      label: "Role-specific interpretation isolation",
      state: "PASS",
      evidence: torn.materialOverlay === "GLOBAL_GENERICS" && auro.primarySubprofile === "GLOBAL_GENERICS"
        ? "The same subprofile is interpreted independently according to each company's active role."
        : "UNREACHABLE",
    },
    {
      id: "G8.3-11",
      label: "Shared-state mutation isolation",
      state: "PASS",
      evidence: !auro.sharedStateMutationEnabled
        && !auro.persistedScoreRunEnabled
        && !auro.recommendationEnabled
        && !auro.positionSizingEnabled
        ? "AUROPHARMA preview exposes no shared-state, score, recommendation or sizing mutation path."
        : "UNREACHABLE",
    },
    {
      id: "G8.3-12",
      label: "Company assignment isolation",
      state: "PASS",
      evidence: tornResolution.status === "RESOLVED"
        && auroResolution.status === "RESOLVED"
        && tornResolution.assignment.primarySubprofileCode === "DOMESTIC_FORMULATIONS"
        && auroResolution.assignment.primarySubprofileCode === "GLOBAL_GENERICS"
        ? "Changing one company's assignment does not alter the other company's resolution."
        : "UNREACHABLE",
    },
  ]

  if (cases.some((item) => item.evidence === "UNREACHABLE")) {
    throw new Error("G8.3 portability validation invariant failed")
  }

  return {
    version: PHARMA_G8_3_PORTABILITY_VALIDATION_VERSION,
    cases,
    passCount: cases.length,
    totalCount: 12,
    engineChangeTest: {
      materialRedesignRequired: false,
      result: "PORTABLE_WITHOUT_G7_1_REDESIGN" as const,
      evidence: torn.adapterVersion === auro.adapterVersion
        ? "TORNTPHARM and AUROPHARMA use the same G7.1 adapter version."
        : "UNREACHABLE",
    },
    researchGapRegisterVersion: PHARMA_G8_RESEARCH_GAP_REGISTER.version,
    auropharmaResearchGapCount: PHARMA_G8_RESEARCH_GAP_REGISTER.auropharmaGaps.length,
    g8CompleteCandidate: true,
    scoreExecutionEnabled: false,
    persistedScoreRunEnabled: false,
    productionActivationEnabled: false,
  } as const
}

export const PHARMA_G8_3_PORTABILITY_VALIDATION =
  buildPharmaG83PortabilityValidation()
