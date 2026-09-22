import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { RecommendationInterpretationPanel } from "./RecommendationInterpretationPanel"

const repository = vi.hoisted(() => ({ planRecommendationInterpretation: vi.fn(), generateRecommendationInterpretation: vi.fn() }))
vi.mock("../../data/recommendationInterpretationRepository", () => repository)

describe("RecommendationInterpretationPanel", () => {
  afterEach(() => { cleanup(); repository.planRecommendationInterpretation.mockReset(); repository.generateRecommendationInterpretation.mockReset() })

  it("preserves the shared interpretation region without planning when recommendation is unavailable", () => {
    render(<RecommendationInterpretationPanel portfolioId="portfolio-1" securityId="security-1" enabled={false} />)
    expect(screen.getByText("PortfolioAI interpretation")).toBeInTheDocument()
    expect(screen.getByText("Available after a validated recommendation")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Generate AI interpretation" })).toBeDisabled()
    expect(repository.planRecommendationInterpretation).not.toHaveBeenCalled()
  })

  it("enables generation when a validated recommendation is available", async () => {
    repository.planRecommendationInterpretation.mockResolvedValue({ configured: true, cached: false, generatedAt: null, interpretation: null, model: null })
    render(<RecommendationInterpretationPanel portfolioId="portfolio-1" securityId="security-1" enabled />)
    await waitFor(() => expect(screen.getByRole("button", { name: "Generate AI interpretation" })).toBeEnabled())
    expect(repository.planRecommendationInterpretation).toHaveBeenCalledWith("portfolio-1", "security-1")
  })
})
