import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PositionDecisionControls } from "./PositionDecisionControls"

const repository = vi.hoisted(() => ({
  recordRecommendationPreview: vi.fn(),
  savePositionDecisionSettings: vi.fn(),
}))

vi.mock("../../data/positionDecisionRepository", () => ({
  loadPositionDecisionSettings: vi.fn().mockResolvedValue(null),
  savePositionDecisionSettings: repository.savePositionDecisionSettings,
}))
vi.mock("../../data/recommendationPolicyRepository", () => ({
  loadPortfolioProfileExposure: vi.fn().mockResolvedValue(null),
  loadRecommendationHistory: vi.fn().mockResolvedValue([]),
  loadRecommendationPolicy: vi.fn().mockResolvedValue(null),
  recordRecommendationPreview: repository.recordRecommendationPreview,
}))
vi.mock("./RecommendationInterpretationPanel", () => ({ RecommendationInterpretationPanel: () => null }))
vi.mock("./useSecurityScoring", () => ({
  useSecurityScoring: () => ({
    data: {
      profileCode: "PHARMA_V1",
      profileName: "Pharmaceuticals · PHARMA_V1",
      profileSource: "REVIEWED_ASSIGNMENT",
      modelName: "PortfolioAI Stock Score V1",
      modelStatus: "DRAFT",
      runState: null,
      overallScore: null,
      evidenceCoverage: .12,
      scoreReadyCoverage: 0,
      evidenceConfidence: 12,
      asOfDate: null,
      dimensions: [],
      ratings: [],
    },
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
}))

describe("PositionDecisionControls recommendation availability", () => {
  afterEach(() => { cleanup(); repository.recordRecommendationPreview.mockClear() })

  it("uses the shared unavailable state and never records a recommendation while rendering", () => {
    render(<PositionDecisionControls
      portfolioId="portfolio-1"
      securityId="security-1"
      currentRole="UNCLASSIFIED"
      currentWeight="1.32"
      fallbackTargetWeight={null}
      fallbackInvestmentHorizon={null}
      currency="INR"
    />)
    expect(screen.getAllByText("Not yet available").length).toBeGreaterThan(0)
    expect(screen.getByLabelText("Recommendation readiness")).toHaveTextContent("Evidence12%Score-ready0%RecommendationNot available")
    expect(screen.getByText("PortfolioAI suggestion").closest("section")).toHaveClass("advisory-is-unavailable")
    expect(screen.getByText("Awaiting recommendation policy.")).toBeInTheDocument()
    expect(screen.getByText("Awaiting allocation policy.")).toBeInTheDocument()
    expect(repository.recordRecommendationPreview).not.toHaveBeenCalled()
  })
})
