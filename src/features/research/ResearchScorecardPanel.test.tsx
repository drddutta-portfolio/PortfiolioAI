import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import type { DimensionScore, SecurityScoringSnapshot } from "./scoringTypes"
import { ResearchScorecardPanel } from "./ResearchScorecardPanel"

const dimension = (dimensionCode: string, rawScore: number | null, evidenceCoverage: number, dimensionWeight = 1): DimensionScore => ({
  dimensionCode,
  dimensionWeight,
  rawScore,
  weightedContribution: rawScore,
  evidenceCoverage,
  scoreReadyCoverage: rawScore === null ? 0 : evidenceCoverage,
  confidence: evidenceCoverage,
  heatState: rawScore === null ? "INSUFFICIENT" : rawScore >= 80 ? "STRONG" : "NEUTRAL",
  signals: [],
})

const snapshot = (profileCode: string, dimensions: readonly DimensionScore[]): SecurityScoringSnapshot => ({
  profileCode,
  profileName: profileCode === "BANK_NBFC" ? "Banks / NBFCs" : "Pharmaceuticals · PHARMA_V1",
  profileSource: "REVIEWED_ASSIGNMENT",
  modelName: "PortfolioAI Stock Score V1",
  modelStatus: "DRAFT",
  runState: null,
  overallScore: null,
  evidenceCoverage: dimensions.reduce((sum, item) => sum + item.evidenceCoverage, 0) / Math.max(dimensions.length, 1),
  scoreReadyCoverage: dimensions.reduce((sum, item) => sum + item.scoreReadyCoverage, 0) / Math.max(dimensions.length, 1),
  evidenceConfidence: 12,
  asOfDate: null,
  dimensions,
  ratings: [],
})

describe("ResearchScorecardPanel shared score states", () => {
  afterEach(cleanup)

  it("retains numeric scored cards for BANK_NBFC", () => {
    render(<ResearchScorecardPanel snapshot={snapshot("BANK_NBFC", [dimension("QUALITY", 87, .81)])} isLoading={false} error={null} />)
    const quality = screen.getByText("Quality").closest("summary")
    expect(quality).not.toBeNull()
    expect(within(quality!).getByText("87")).toBeInTheDocument()
    expect(within(quality!).getByText("Why this score?", { exact: false })).toBeInTheDocument()
  })

  it("uses evidence-only and no-evidence states without inventing Pharma scores", () => {
    render(<ResearchScorecardPanel snapshot={snapshot("PHARMA_V1", [dimension("QUALITY", null, .34), dimension("GROWTH", null, 0)])} isLoading={false} error={null} />)
    expect(screen.getAllByText("Not score-ready").length).toBeGreaterThan(0)
    expect(screen.getByText("34% evidence reviewed")).toBeInTheDocument()
    expect(screen.getAllByText("No validated evidence yet").length).toBeGreaterThan(0)
    expect(screen.getAllByText("View evidence", { exact: false }).length).toBeGreaterThan(0)
    const growth = screen.getByText("Growth").closest("summary")
    expect(growth).not.toBeNull()
    expect(within(growth!).getByText("Evidence unavailable")).toHaveAttribute("aria-disabled", "true")
    expect(screen.queryByText("—")).not.toBeInTheDocument()
  })

  it("keeps not-applicable distinct from missing evidence", () => {
    render(<ResearchScorecardPanel snapshot={snapshot("BANK_NBFC", [dimension("CASH_FLOW", null, 0, 0)])} isLoading={false} error={null} />)
    const cashFlow = screen.getByText("Cash Flow").closest("summary")
    expect(cashFlow).not.toBeNull()
    expect(within(cashFlow!).getByText("N/A")).toBeInTheDocument()
    expect(within(cashFlow!).getByText("Not applicable to this scoring profile")).toBeInTheDocument()
    expect(within(cashFlow!).getByText("Not applicable")).toHaveAttribute("aria-disabled", "true")
  })

  it("uses one external ratings shell title for empty and populated states", () => {
    const empty = snapshot("PHARMA_V1", [])
    const { rerender } = render(<ResearchScorecardPanel snapshot={empty} isLoading={false} error={null} />)
    expect(screen.getByRole("heading", { name: "External ratings" })).toBeInTheDocument()
    rerender(<ResearchScorecardPanel snapshot={{ ...snapshot("BANK_NBFC", []), ratings: [{ id: "rating-1", agencyCode: "CARE", ratingSymbol: "AAA", outlook: "STABLE", ratingDate: null, ratingAction: null, instrumentType: null, instrumentDescription: null, sourceUrl: "https://example.test/rating", retrievedAt: "2026-09-15T00:00:00Z", freshUntil: "2026-10-15T00:00:00Z", evidenceStatus: "VERIFIED" }] }} isLoading={false} error={null} />)
    expect(screen.getByRole("heading", { name: "External ratings" })).toBeInTheDocument()
  })
})
