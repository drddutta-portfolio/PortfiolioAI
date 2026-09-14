import { describe, expect, it } from "vitest"
import { completeResearchRefreshRequest } from "./completeResearchRefreshContract"

describe("completeResearchRefreshRequest", () => {
  it("carries the selected profile through planning", () => {
    expect(completeResearchRefreshRequest("PLAN", "portfolio-1", "security-1", "PHARMA_V1")).toEqual({
      action: "PLAN",
      portfolioId: "portfolio-1",
      securityId: "security-1",
      profileCode: "PHARMA_V1",
    })
  })

  it("keeps execution owner-confirmed and profile-specific", () => {
    expect(completeResearchRefreshRequest("EXECUTE", "portfolio-1", "security-1", "BANK_NBFC")).toEqual({
      action: "EXECUTE",
      portfolioId: "portfolio-1",
      securityId: "security-1",
      profileCode: "BANK_NBFC",
      confirmation: "OWNER_CONFIRMED_COMPLETE_RESEARCH_REFRESH",
    })
  })
})
