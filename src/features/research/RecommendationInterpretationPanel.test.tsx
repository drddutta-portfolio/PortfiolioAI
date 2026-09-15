import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { RecommendationInterpretationPanel } from "./RecommendationInterpretationPanel"

const repository = vi.hoisted(() => ({ planRecommendationInterpretation: vi.fn(), generateRecommendationInterpretation: vi.fn() }))
vi.mock("../../data/recommendationInterpretationRepository", () => repository)

describe("RecommendationInterpretationPanel", () => {
  afterEach(() => { cleanup(); repository.planRecommendationInterpretation.mockClear() })

  it("preserves the shared interpretation region without planning when recommendation is unavailable", () => {
    render(<RecommendationInterpretationPanel portfolioId="portfolio-1" securityId="security-1" enabled={false} />)
    expect(screen.getByText("PortfolioAI interpretation")).toBeInTheDocument()
    expect(screen.getByText("Available after a validated recommendation")).toBeInTheDocument()
    expect(repository.planRecommendationInterpretation).not.toHaveBeenCalled()
  })
})
