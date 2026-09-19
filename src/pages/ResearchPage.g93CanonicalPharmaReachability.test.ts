import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const source = readFileSync(
  resolve(process.cwd(), "src/pages/ResearchPage.tsx"),
  "utf8",
)

describe("G9.3 canonical Pharma research reachability", () => {
  it("renders normalized Pharma research from canonical subprofile resolution, not legacy scoring-profile identity", () => {
    expect(source).toContain('const pharmaResolution = usePharmaSubprofileResolution(position?.securityId ?? null)')
    expect(source).toContain('pharmaResolved={pharmaResolution.data?.status === "RESOLVED"}')
    expect(source).toContain('{pharmaResolved ? <>')
    expect(source).toContain('<PharmaG93NormalizedResearchPanel')
    expect(source).not.toContain('{scoring.data?.profileCode === "PHARMA_V1" ? <>\n      <PharmaG93NormalizedResearchPanel')
  })

  it("keeps scoring identity and canonical research identity visibly separate", () => {
    expect(source).toContain("<strong>Scoring profile:</strong>")
    expect(source).toContain("<strong>Research profile:</strong> Pharmaceuticals · PHARMA_V1 · Canonical assignment")
    expect(source).toContain('enabled={pharmaResolved || scoring.data?.profileCode === "PHARMA_V1"}')
  })
})
