import { describe, expect, it } from "vitest"
import { researchProfileDisplayName } from "./researchProfileUiContract"
import type { SecurityScoringSnapshot } from "./scoringTypes"
const snapshot = { profileCode: "FINANCIAL_HOLDING_COMPANY", profileName: "FINANCIAL HOLDING COMPANY", profileSource: "CANONICAL_ASSIGNMENT", methodologyState: "AVAILABLE", scoringExecutionState: "PENDING_ADAPTER" } as SecurityScoringSnapshot
describe("canonical profile labels across Research surfaces", () => {
  it("preserves canonical identity when its engine is pending", () => {
    expect(researchProfileDisplayName(snapshot)).toBe("FINANCIAL HOLDING COMPANY")
    expect(researchProfileDisplayName({ ...snapshot, profileCode: "RETAIL_COMMERCE", profileName: "RETAIL COMMERCE" })).toBe("RETAIL COMMERCE")
  })
  it("does not replace a reviewed canonical name with General Research", () => {
    expect(researchProfileDisplayName({ ...snapshot, scoringExecutionState: "AVAILABLE" })).toBe("FINANCIAL HOLDING COMPANY")
  })
  it("keeps loading and unresolved methodology explicit", () => {
    expect(researchProfileDisplayName(null)).toBe("Loading…")
    expect(researchProfileDisplayName({ ...snapshot, profileName: "UNRESOLVED", methodologyState: "METHODOLOGY_NOT_AVAILABLE" })).toBe("UNRESOLVED")
  })
})
