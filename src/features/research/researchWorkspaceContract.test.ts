import { describe, expect, it } from "vitest"
import { RESEARCH_WORKSPACE_CONTRACT_VERSION, RESEARCH_WORKSPACE_EXTENSION_POLICY, RESEARCH_WORKSPACE_SECTION_ORDER } from "./researchWorkspaceContract"

describe("frozen universal Research workspace contract", () => {
  it("freezes the R4M shared section order", () => {
    expect(RESEARCH_WORKSPACE_CONTRACT_VERSION).toBe("R4M_V1")
    expect(RESEARCH_WORKSPACE_SECTION_ORDER).toEqual([
      "SECURITY_HEADER",
      "ABOUT_COMPANY",
      "PORTFOLIO_PRICE_SUMMARY",
      "DECISION_WORKSPACE",
      "PORTFOLIOAI_SUGGESTION",
      "AI_INTERPRETATION",
      "KEY_INSIGHTS",
      "RESEARCH_REFRESH",
      "RESEARCH_NAVIGATION",
      "RESEARCH_AT_A_GLANCE",
      "INVESTMENT_DECISION_COCKPIT",
      "DIMENSION_SCORE_SUMMARY",
      "INVESTMENT_HEATMAP",
      "EXTERNAL_RATINGS",
      "RESEARCH_READINESS",
      "DETAILED_RESEARCH",
    ])
  })

  it("permits profile configuration without permitting another Research application", () => {
    expect(RESEARCH_WORKSPACE_EXTENSION_POLICY.sharedPageTreeRequired).toBe(true)
    expect(RESEARCH_WORKSPACE_EXTENSION_POLICY.symbolSpecificLayoutAllowed).toBe(false)
    expect(RESEARCH_WORKSPACE_EXTENSION_POLICY.profileSpecificPageTreeAllowed).toBe(false)
  })
})
