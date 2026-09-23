import { describe, expect, it } from "vitest"
import { isBankBenchmarkEligibleClassification } from "./bank-benchmark-authority"

describe("BANK benchmark classification authority", () => {
  it("accepts the legacy generic bank classification", () => {
    expect(isBankBenchmarkEligibleClassification("Banking", "Banks")).toBe(true)
  })

  it("accepts the reviewed canonical private-sector bank classification", () => {
    expect(isBankBenchmarkEligibleClassification("Banking", "Private Sector Bank")).toBe(true)
  })

  it("keeps NBFC lending outside NIFTY Bank benchmark authority", () => {
    expect(isBankBenchmarkEligibleClassification("Banking", "NBFC Lending")).toBe(false)
  })

  it("rejects unsupported banking industries and non-banking sectors", () => {
    expect(isBankBenchmarkEligibleClassification("Banking", "Financial Services")).toBe(false)
    expect(isBankBenchmarkEligibleClassification("Financial Services", "Banks")).toBe(false)
  })

  it("fails closed when classification is missing", () => {
    expect(isBankBenchmarkEligibleClassification(null, null)).toBe(false)
    expect(isBankBenchmarkEligibleClassification("Banking", null)).toBe(false)
  })
})
