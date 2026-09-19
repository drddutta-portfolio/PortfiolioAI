import { describe, expect, it } from "vitest"
import {
  calculateDomesticPeerRelativeDiscount,
  PHARMA_DOMESTIC_PEER_PREMIUM_DISCOUNT,
  scoreDomesticPeerRelativeDiscount,
} from "./pharmaDomesticPeerPremiumDiscountProposal"

describe("Domestic Formulations peer premium/discount proposal", () => {
  it("uses positive values for a target discount and negative values for a premium", () => {
    expect(calculateDomesticPeerRelativeDiscount("PE_TTM", 20, 25)?.relativeDiscountPercent).toBe(25)
    expect(calculateDomesticPeerRelativeDiscount("PE_TTM", 25, 20)?.relativeDiscountPercent).toBe(-20)
    expect(calculateDomesticPeerRelativeDiscount("PE_TTM", 20, 20)?.relativeDiscountPercent).toBe(0)
  })

  it("uses the same convention for EV/EBITDA", () => {
    expect(
      calculateDomesticPeerRelativeDiscount("EV_EBITDA", 10, 12)?.relativeDiscountPercent,
    ).toBeCloseTo(20)
  })

  it("fails closed for invalid or non-positive multiples", () => {
    expect(calculateDomesticPeerRelativeDiscount("PE_TTM", 0, 20)).toBeNull()
    expect(calculateDomesticPeerRelativeDiscount("PE_TTM", -5, 20)).toBeNull()
    expect(calculateDomesticPeerRelativeDiscount("PE_TTM", 20, 0)).toBeNull()
    expect(calculateDomesticPeerRelativeDiscount("PE_TTM", 20, Number.NaN)).toBeNull()
  })

  it("defines a five-band monotonic normalization curve", () => {
    expect(scoreDomesticPeerRelativeDiscount(30)).toBe(100)
    expect(scoreDomesticPeerRelativeDiscount(15)).toBe(80)
    expect(scoreDomesticPeerRelativeDiscount(0)).toBe(60)
    expect(scoreDomesticPeerRelativeDiscount(-10)).toBe(40)
    expect(scoreDomesticPeerRelativeDiscount(-25)).toBe(20)
  })

  it("keeps exact band edges deterministic", () => {
    expect(scoreDomesticPeerRelativeDiscount(25)).toBe(100)
    expect(scoreDomesticPeerRelativeDiscount(10)).toBe(80)
    expect(scoreDomesticPeerRelativeDiscount(-5)).toBe(40)
    expect(scoreDomesticPeerRelativeDiscount(-20)).toBe(20)
  })

  it("keeps PE and EV/EBITDA combination unapproved", () => {
    expect(PHARMA_DOMESTIC_PEER_PREMIUM_DISCOUNT.sameBandsUsedForPeAndEvEbitda).toBe(true)
    expect(PHARMA_DOMESTIC_PEER_PREMIUM_DISCOUNT.crossMetricAveragingApproved).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_PREMIUM_DISCOUNT.peEvEbitdaWeightingApproved).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_PREMIUM_DISCOUNT.peerComponentScoreReady).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_PREMIUM_DISCOUNT.wholeValuationDimensionReady).toBe(false)
  })

  it("remains proposal-only and non-executable", () => {
    expect(PHARMA_DOMESTIC_PEER_PREMIUM_DISCOUNT.state).toBe("PROPOSAL_ONLY")
    expect(PHARMA_DOMESTIC_PEER_PREMIUM_DISCOUNT.activationApproved).toBe(false)
    expect(PHARMA_DOMESTIC_PEER_PREMIUM_DISCOUNT.scoreExecutionEnabled).toBe(false)
  })
})
