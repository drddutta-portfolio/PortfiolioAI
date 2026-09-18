import { describe, expect, it } from "vitest"
import { researchProfileUiContract } from "./researchProfileUiContract"

describe("PHARMA_V1 canonical US-growth presentation", () => {
  it("surfaces PHARMA_EXPORT_US_REVENUE_GROWTH in the overview growth snapshot", () => {
    const ui = researchProfileUiContract("PHARMA_V1")
    const growth = ui.snapshotGroups.find((group) => group.title === "Growth at a glance")
    expect(growth?.codes).toContain("PHARMA_EXPORT_US_REVENUE_GROWTH")
  })

  it("surfaces PHARMA_EXPORT_US_REVENUE_GROWTH in the Quality & Growth workspace", () => {
    const ui = researchProfileUiContract("PHARMA_V1")
    const growth = ui.qualityGrowthWorkspaceSections.find((section) => section.title === "Growth & earnings")
    expect(growth?.codes).toContain("PHARMA_EXPORT_US_REVENUE_GROWTH")
  })
})
