import { describe, expect, it } from "vitest"
import { RESEARCH_DATASET_V1, researchDatasetContract, researchUnavailableReason } from "./researchDatasetPolicy"

describe("production research dataset v1", () => {
  it("keeps every verified provider field tied to an explicit provider field or reviewed identity/document contract", () => {
    for (const contract of RESEARCH_DATASET_V1.filter((item) => item.status === "VERIFIED_PROVIDER_FIELD")) {
      expect(contract.notes.length).toBeGreaterThan(0)
      if (!["COMPANY_IDENTITY"].includes(contract.code)) expect(contract.providerField).not.toBeNull()
    }
  })

  it("preserves provider adjusted P/B as distinct from generic P/B", () => {
    expect(researchDatasetContract("PBV_ADJUSTED_PROVIDER")).toMatchObject({
      status: "VERIFIED_PROVIDER_FIELD",
      providerField: "PBV_A",
    })
    expect(researchDatasetContract("PBV_GENERIC")).toMatchObject({
      status: "REQUIRES_PROVIDER_CONTRACT",
      providerField: null,
    })
  })

  it("does not silently promote EBITDA, ROCE or diluted EPS", () => {
    for (const code of ["EBITDA", "ROCE_ANNUAL", "EPS_DILUTED"]) {
      expect(researchDatasetContract(code)?.status).toBe("REQUIRES_PROVIDER_CONTRACT")
      expect(researchDatasetContract(code)?.providerField).toBeNull()
    }
  })

  it("keeps CAGR, free cash flow and net debt as deterministic later calculations", () => {
    for (const code of ["REVENUE_CAGR", "PAT_CAGR", "EPS_CAGR", "FREE_CASH_FLOW", "NET_DEBT"]) {
      expect(researchDatasetContract(code)?.status).toBe("DERIVED_LATER")
    }
  })

  it("returns an explicit reason instead of treating every unavailable field as the same condition", () => {
    expect(researchUnavailableReason("ROCE_ANNUAL")).toContain("not yet verified")
    expect(researchUnavailableReason("REVENUE_TTM")).toContain("No usable cached provider observation")
    expect(researchUnavailableReason("REVENUE_CAGR")).toContain("calculated later")
    expect(researchUnavailableReason("UNKNOWN_FIELD")).toContain("No production research contract")
  })
})
