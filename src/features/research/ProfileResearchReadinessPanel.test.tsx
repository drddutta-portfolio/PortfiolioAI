import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { ProfileResearchReadinessPanel } from "./ProfileResearchReadinessPanel"
import type { SecurityScoringSnapshot } from "./scoringTypes"
import type { SecurityResearch } from "./types"

const research: SecurityResearch = { securityId: "security-1", companyName: "Bank", sector: "Banks", industry: "Banks", marketCapCategory: "LARGE_CAP", freshUntil: null, state: "VERIFIED", metrics: [], documents: [] }
const snapshot: SecurityScoringSnapshot = { profileCode: "BANK_NBFC", profileName: "Banks / NBFCs", profileSource: "REVIEWED_ASSIGNMENT", modelName: "Model", modelStatus: "DRAFT", runState: null, overallScore: null, evidenceCoverage: .72, scoreReadyCoverage: .72, evidenceConfidence: .72, asOfDate: null, ratings: [], dimensions: [{ dimensionCode: "QUALITY", dimensionWeight: 1, rawScore: 88, weightedContribution: 88, evidenceCoverage: .65, scoreReadyCoverage: .65, confidence: .65, heatState: "STRONG" }] }

describe("ProfileResearchReadinessPanel", () => {
  afterEach(cleanup)

  it("uses the shared readiness shell for BANK_NBFC", () => {
    render(<ProfileResearchReadinessPanel profileCode="BANK_NBFC" research={research} snapshot={snapshot} />)
    expect(screen.getByText("Banks / NBFCs Research Readiness")).toBeInTheDocument()
    expect(screen.getByText("1/9")).toBeInTheDocument()
    expect(screen.getByText("readiness requirements ready")).toBeInTheDocument()
    expect(screen.getByText("A compact view of profile readiness requirements. BANK_NBFC requirements are satisfied by validated, score-ready dimensions.")).toBeInTheDocument()
  })
})
