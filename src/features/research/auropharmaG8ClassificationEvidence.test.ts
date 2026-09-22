import { describe, expect, it } from "vitest"
import { PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT } from "./pharmaAdaptiveClassificationContract"
import {
  AUROPHARMA_G8_1_ANNUAL_BUSINESS_MIX,
  AUROPHARMA_G8_1_CLASSIFICATION_OBSERVATIONS,
  AUROPHARMA_G8_1_CLASSIFICATION_REVIEW,
  AUROPHARMA_G8_1_COMPARABILITY_CHECKS,
  AUROPHARMA_G8_1_IDENTITY,
  AUROPHARMA_G8_1_SOURCES,
  auropharmaApiRevenueSharePercent,
  auropharmaGlobalGenericsLowerBoundPercent,
  buildAuropharmaG81ClassificationReview,
} from "./auropharmaG8ClassificationEvidence"

describe("G8.1 AUROPHARMA classification and evidence lock", () => {
  it("keeps the fixture company-scoped and independent from TORNTPHARM evidence", () => {
    expect(AUROPHARMA_G8_1_IDENTITY.symbol).toBe("AUROPHARMA")
    expect(AUROPHARMA_G8_1_IDENTITY.isin).toBe("INE406A01037")
    expect(JSON.stringify(AUROPHARMA_G8_1_CLASSIFICATION_OBSERVATIONS)).not.toContain("TORNTPHARM")
  })

  it("uses exactly two consecutive reviewed annual periods", () => {
    expect(AUROPHARMA_G8_1_ANNUAL_BUSINESS_MIX.map((row) => row.periodEnd)).toEqual([
      "2025-03-31",
      "2026-03-31",
    ])
    expect(new Set(AUROPHARMA_G8_1_CLASSIFICATION_OBSERVATIONS.map((row) => row.periodEnd))).toEqual(
      new Set(["2025-03-31", "2026-03-31"]),
    )
    expect(AUROPHARMA_G8_1_CLASSIFICATION_OBSERVATIONS.every((row) => row.reviewState === "REVIEWED")).toBe(true)
  })

  it("uses conservative US plus Europe revenue to prove stable Global Generics leadership", () => {
    const [fy25, fy26] = AUROPHARMA_G8_1_ANNUAL_BUSINESS_MIX
    expect(auropharmaGlobalGenericsLowerBoundPercent(fy25!)).toBe(73.04)
    expect(auropharmaGlobalGenericsLowerBoundPercent(fy26!)).toBe(73.46)

    const review = buildAuropharmaG81ClassificationReview()
    expect(review.g1Proposal.classificationState).toBe("READY_FOR_REVIEW")
    expect(review.primary).toBe("GLOBAL_GENERICS")
  })

  it("treats the 15 percent overlay rule as economic share, not growth rate", () => {
    const [fy25, fy26] = AUROPHARMA_G8_1_ANNUAL_BUSINESS_MIX
    const shares = [
      auropharmaApiRevenueSharePercent(fy25!),
      auropharmaApiRevenueSharePercent(fy26!),
    ]
    expect(shares).toEqual([13.63, 12.03])
    expect(shares.every((share) => share < PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT.materialOverlayThresholdPercent)).toBe(true)
    expect(shares.every((share) => share >= PHARMA_ADAPTIVE_CLASSIFICATION_CONTRACT.emergingWatchLowerBoundPercent)).toBe(true)

    expect(AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.materialOverlays).toEqual([])
    expect(AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.emergingWatches).toEqual(["API_BULK_DRUGS"])
  })

  it("fails closed on Biosimilars because no comparable economic share is disclosed", () => {
    expect(AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.unresolvedExposures).toEqual([
      "BIOPHARMA_BIOSIMILARS",
    ])
    const biosimilar = AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.g1Proposal.exposures.find(
      (item) => item.exposureCode === "BIOPHARMA_BIOSIMILARS",
    )
    expect(biosimilar?.role).toBe("REVIEW_REQUIRED")
    expect(biosimilar?.reasonCodes).toContain("NO_REVENUE_OR_PROFIT_SHARE")
  })

  it("records explicit distortion and comparability scrutiny for role-determining figures", () => {
    const roleChecks = AUROPHARMA_G8_1_COMPARABILITY_CHECKS.filter(
      (item) => item.roleDetermining,
    )
    expect(roleChecks.map((item) => item.code)).toEqual([
      "CONSOLIDATED_DENOMINATOR_ALIGNMENT",
      "GLOBAL_GENERICS_CONSERVATIVE_LOWER_BOUND",
      "API_TRANSFER_CONSOLIDATED_SCOPE",
      "BUSINESS_PROFIT_SHARE_NOT_SEPARATELY_DISCLOSED",
      "ACQUISITION_AND_STRUCTURAL_CHANGE_EFFECTIVE_DATE",
    ])
    expect(roleChecks.every((item) => item.state !== undefined && item.sourceReference.length > 0)).toBe(true)
  })

  it("keeps all G8.1 official source references on the issuer domain", () => {
    expect(
      Object.values(AUROPHARMA_G8_1_SOURCES).every(
        (source) => new URL(source.url).hostname === "www.aurobindo.com",
      ),
    ).toBe(true)
  })

  it("creates neither a canonical assignment nor scoring state", () => {
    expect(AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.canonicalAssignmentPersisted).toBe(false)
    expect(AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.rawEvidencePersistenceCreated).toBe(false)
    expect(AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.scoreExecutionEnabled).toBe(false)
    expect(AUROPHARMA_G8_1_CLASSIFICATION_REVIEW.g1Proposal.scoreExecutionEnabled).toBe(false)
  })
})
