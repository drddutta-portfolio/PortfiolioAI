import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PositionDecisionControls } from "./PositionDecisionControls"

const repository = vi.hoisted(() => ({
  loadPositionDecisionSettings: vi.fn(),
  savePositionDecisionSettings: vi.fn(),
}))

vi.mock("../../data/positionDecisionRepository", () => ({
  loadPositionDecisionSettings: repository.loadPositionDecisionSettings,
  savePositionDecisionSettings: repository.savePositionDecisionSettings,
}))

describe("PositionDecisionControls owner authority", () => {
  afterEach(() => {
    cleanup()
    repository.loadPositionDecisionSettings.mockReset()
    repository.savePositionDecisionSettings.mockReset()
  })

  it("shows only owner-controlled settings and no legacy recommendation preview", async () => {
    repository.loadPositionDecisionSettings.mockResolvedValue(null)

    render(<PositionDecisionControls
      portfolioId="portfolio-1"
      securityId="security-1"
      currentRole="OTHER"
      currentWeight="1.32"
      fallbackTargetWeight="2.5"
      fallbackInvestmentHorizon={null}
      currency="INR"
    />)

    await waitFor(() => expect(screen.getByText("Owner-controlled")).toBeInTheDocument())

    expect(screen.getByText("Current weight").closest("article")).toHaveTextContent("1.32%")
    expect(screen.getByText("Your target weight").closest("article")).toHaveTextContent("2.5%")
    expect(screen.getByText("Portfolio role").closest("article")).toHaveTextContent("Other")
    expect(screen.getByText(/Historical previews are not used/i)).toBeInTheDocument()

    expect(screen.queryByText("PortfolioAI suggestion")).not.toBeInTheDocument()
    expect(screen.queryByText("Action bias")).not.toBeInTheDocument()
    expect(screen.queryByText("Suggested weight range")).not.toBeInTheDocument()
  })

  it("loads saved owner settings and keeps them distinct from current portfolio weight", async () => {
    repository.loadPositionDecisionSettings.mockResolvedValue({
      id: "setting-1",
      portfolioRole: "CORE",
      targetWeight: "3.5",
      targetPrice: "420",
      stopLossPrice: "300",
      investmentHorizon: "3–5 years",
      targetPriceAlertEnabled: true,
      stopLossAlertEnabled: true,
      updatedAt: "2026-09-27T00:00:00Z",
    })

    render(<PositionDecisionControls
      portfolioId="portfolio-1"
      securityId="security-1"
      currentRole="OTHER"
      currentWeight="1.32"
      fallbackTargetWeight="2.5"
      fallbackInvestmentHorizon={null}
      currency="INR"
    />)

    await waitFor(() => expect(screen.getByText("Portfolio role").closest("article")).toHaveTextContent("Core"))
    expect(screen.getByText("Current weight").closest("article")).toHaveTextContent("1.32%")
    expect(screen.getByText("Your target weight").closest("article")).toHaveTextContent("3.5%")
    expect(screen.getByText("Your target price").closest("article")).toHaveTextContent("₹420")
    expect(screen.getByText("Your stop-loss reference").closest("article")).toHaveTextContent("₹300")
    expect(screen.getByText("Investment horizon").closest("article")).toHaveTextContent("3–5 years")
  })

  it("saves only owner-controlled position settings", async () => {
    repository.loadPositionDecisionSettings.mockResolvedValue(null)
    repository.savePositionDecisionSettings.mockResolvedValue({
      id: "setting-1",
      portfolioRole: "CORE",
      targetWeight: "4",
      targetPrice: "500",
      stopLossPrice: "350",
      investmentHorizon: "5 years",
      targetPriceAlertEnabled: true,
      stopLossAlertEnabled: true,
      updatedAt: "2026-09-27T00:00:00Z",
    })

    render(<PositionDecisionControls
      portfolioId="portfolio-1"
      securityId="security-1"
      currentRole="OTHER"
      currentWeight="1.32"
      fallbackTargetWeight="2.5"
      fallbackInvestmentHorizon={null}
      currency="INR"
    />)

    await waitFor(() => expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument())
    fireEvent.click(screen.getByRole("button", { name: "Edit" }))

    fireEvent.change(screen.getByLabelText("Portfolio role"), { target: { value: "CORE" } })
    fireEvent.change(screen.getByLabelText("Target weight (%)"), { target: { value: "4" } })
    fireEvent.change(screen.getByLabelText("Target price"), { target: { value: "500" } })
    fireEvent.change(screen.getByLabelText("Stop-loss reference"), { target: { value: "350" } })
    fireEvent.change(screen.getByLabelText("Investment horizon"), { target: { value: "5 years" } })

    fireEvent.click(screen.getByRole("button", { name: "Save owner settings" }))

    await waitFor(() => expect(repository.savePositionDecisionSettings).toHaveBeenCalledWith(
      "portfolio-1",
      "security-1",
      expect.objectContaining({
        portfolioRole: "CORE",
        targetWeight: "4",
        targetPrice: "500",
        stopLossPrice: "350",
        investmentHorizon: "5 years",
      }),
    ))
  })
})
