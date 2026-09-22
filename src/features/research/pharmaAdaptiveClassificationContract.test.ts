import { describe, expect, it } from "vitest"
import {
  buildPharmaAdaptiveClassificationProposal,
  PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT,
  type PharmaAnnualExposureObservation,
} from "./pharmaAdaptiveClassificationContract"

const row = (
  exposureCode: PharmaAnnualExposureObservation["exposureCode"],
  periodEnd: string,
  revenueSharePercent: number | null,
  profitSharePercent: number | null = null,
  growingTowardMaterialityReviewed = false,
): PharmaAnnualExposureObservation => ({
  exposureCode,
  periodEnd,
  revenueSharePercent,
  profitSharePercent,
  growingTowardMaterialityReviewed,
  evidenceTier: "AUDITED_SEGMENT",
  sourceReference: `issuer:${exposureCode}:${periodEnd}`,
  reviewState: "REVIEWED",
})

describe("PHARMA adaptive classification contract", () => {
  it("keeps the contract proposal-only and non-executable", () => {
    expect(PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT.state).toBe("PROPOSAL_ONLY")
    expect(PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT.scoreExecutionEnabled).toBe(false)
    expect(PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT.materialOverlayThresholdPercent).toBe(15)
    expect(PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT.emergingWatchLowerBoundPercent).toBe(5)
    expect(PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT.primaryRequiresStableLeadershipPeriods).toBe(2)
  })

  it("resolves a stable two-period primary and sustained material overlay", () => {
    const proposal = buildPharmaAdaptiveClassificationProposal([
      row("DOMESTIC_FORMULATIONS", "2026-03-31", 62, 68),
      row("GLOBAL_GENERICS", "2026-03-31", 27, 22),
      row("CDMO_CRAMS", "2026-03-31", 11, 8),
      row("DOMESTIC_FORMULATIONS", "2025-03-31", 64, 69),
      row("GLOBAL_GENERICS", "2025-03-31", 25, 21),
      row("CDMO_CRAMS", "2025-03-31", 9, 7),
    ])

    expect(proposal.classificationState).toBe("READY_FOR_REVIEW")
    expect(proposal.primaryCandidate).toBe("DOMESTIC_FORMULATIONS")
    expect(proposal.exposures.find((item) => item.exposureCode === "GLOBAL_GENERICS")?.role).toBe("MATERIAL_OVERLAY")
    expect(proposal.exposures.find((item) => item.exposureCode === "CDMO_CRAMS")?.role).toBe("EMERGING_WATCH")
  })

  it("does not promote one-year materiality into a Material Overlay", () => {
    const proposal = buildPharmaAdaptiveClassificationProposal([
      row("DOMESTIC_FORMULATIONS", "2026-03-31", 70, 72),
      row("GLOBAL_GENERICS", "2026-03-31", 18, 17),
      row("DOMESTIC_FORMULATIONS", "2025-03-31", 80, 82),
      row("GLOBAL_GENERICS", "2025-03-31", 10, 9),
    ])
    expect(proposal.exposures.find((item) => item.exposureCode === "GLOBAL_GENERICS")?.role).toBe("EMERGING_WATCH")
    expect(proposal.exposures.find((item) => item.exposureCode === "GLOBAL_GENERICS")?.reasonCodes).toContain("MATERIAL_THRESHOLD_NOT_YET_SUSTAINED")
  })

  it("allows reviewed growth-toward-materiality to create an Emerging Watch below 5%", () => {
    const proposal = buildPharmaAdaptiveClassificationProposal([
      row("DOMESTIC_FORMULATIONS", "2026-03-31", 95, 96),
      row("CDMO_CRAMS", "2026-03-31", 4, 3, true),
      row("DOMESTIC_FORMULATIONS", "2025-03-31", 96, 97),
      row("CDMO_CRAMS", "2025-03-31", 3, 2, false),
    ])
    expect(proposal.exposures.find((item) => item.exposureCode === "CDMO_CRAMS")?.role).toBe("EMERGING_WATCH")
  })

  it("fails closed when revenue and profit imply different Primary leaders", () => {
    const proposal = buildPharmaAdaptiveClassificationProposal([
      row("DOMESTIC_FORMULATIONS", "2026-03-31", 60, 35),
      row("GLOBAL_GENERICS", "2026-03-31", 40, 65),
      row("DOMESTIC_FORMULATIONS", "2025-03-31", 61, 36),
      row("GLOBAL_GENERICS", "2025-03-31", 39, 64),
    ])
    expect(proposal.classificationState).toBe("REVIEW_REQUIRED")
    expect(proposal.primaryCandidate).toBeNull()
    expect(proposal.reasonCodes).toContain("REVENUE_PROFIT_PRIMARY_LEADERSHIP_CONFLICT")
  })

  it("requires consecutive annual periods for stable Primary classification", () => {
    const proposal = buildPharmaAdaptiveClassificationProposal([
      row("DOMESTIC_FORMULATIONS", "2026-03-31", 75, 75),
      row("GLOBAL_GENERICS", "2026-03-31", 25, 25),
      row("DOMESTIC_FORMULATIONS", "2024-03-31", 76, 76),
      row("GLOBAL_GENERICS", "2024-03-31", 24, 24),
    ])
    expect(proposal.classificationState).toBe("INSUFFICIENT_EVIDENCE")
    expect(proposal.reasonCodes).toContain("PRIMARY_REQUIRES_CONSECUTIVE_ANNUAL_PERIODS")
  })

  it("requires structural-change evidence before changing an existing Primary", () => {
    const observations = [
      row("GLOBAL_GENERICS", "2026-03-31", 58, 60),
      row("DOMESTIC_FORMULATIONS", "2026-03-31", 42, 40),
      row("GLOBAL_GENERICS", "2025-03-31", 55, 57),
      row("DOMESTIC_FORMULATIONS", "2025-03-31", 45, 43),
    ]
    const blocked = buildPharmaAdaptiveClassificationProposal(observations, "DOMESTIC_FORMULATIONS")
    expect(blocked.classificationState).toBe("REVIEW_REQUIRED")
    expect(blocked.reasonCodes).toContain("PRIMARY_REASSIGNMENT_REQUIRES_STRUCTURAL_CHANGE_EVIDENCE")

    const confirmed = buildPharmaAdaptiveClassificationProposal(
      observations,
      "DOMESTIC_FORMULATIONS",
      "GLOBAL_GENERICS",
    )
    expect(confirmed.classificationState).toBe("READY_FOR_REVIEW")
    expect(confirmed.primaryCandidate).toBe("GLOBAL_GENERICS")
    expect(confirmed.reasonCodes).toContain("STRUCTURAL_PRIMARY_REASSIGNMENT_CONFIRMED")
  })

  it("ignores provisional evidence for classification", () => {
    const provisional: PharmaAnnualExposureObservation = {
      ...row("DOMESTIC_FORMULATIONS", "2026-03-31", 80, 80),
      reviewState: "PROVISIONAL",
    }
    const proposal = buildPharmaAdaptiveClassificationProposal([provisional])
    expect(proposal.classificationState).toBe("INSUFFICIENT_EVIDENCE")
    expect(proposal.reasonCodes).toContain("NO_REVIEWED_CLASSIFICATION_EVIDENCE")
  })
})
