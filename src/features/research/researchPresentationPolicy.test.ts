import { describe, expect, it } from "vitest"
import { researchSnapshotGroups } from "./researchPresentationPolicy"

function codes(profileCode: string) {
  return researchSnapshotGroups(profileCode).flatMap((group) => group.codes)
}

describe("researchSnapshotGroups", () => {
  it("removes BANK_NBFC-only operating metrics from PHARMA_V1 overview cards", () => {
    const pharmaCodes = codes("PHARMA_V1")
    expect(pharmaCodes).not.toContain("ADVANCES_GROWTH_YOY")
    expect(pharmaCodes).not.toContain("DEPOSITS_GROWTH_YOY")
    expect(pharmaCodes).not.toContain("GROSS_NPA_PERCENT")
    expect(pharmaCodes).not.toContain("NET_NPA_PERCENT")
    expect(pharmaCodes).not.toContain("PBV_ADJUSTED_PROVIDER")
    expect(pharmaCodes).toContain("OPM_TTM")
    expect(pharmaCodes).toContain("ROCE_MANAGEMENT_ANNUAL")
    expect(pharmaCodes).toContain("REVENUE_ANNUAL")
    expect(pharmaCodes).toContain("PE_TTM")
  })

  it("keeps the existing BANK_NBFC snapshot intact", () => {
    const bankCodes = codes("BANK_NBFC")
    expect(bankCodes).toContain("ADVANCES_GROWTH_YOY")
    expect(bankCodes).toContain("DEPOSITS_GROWTH_YOY")
    expect(bankCodes).toContain("GROSS_NPA_PERCENT")
    expect(bankCodes).toContain("NET_NPA_PERCENT")
    expect(bankCodes).toContain("PBV_ADJUSTED_PROVIDER")
  })
})
