import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CompleteResearchRefreshPanel } from "./CompleteResearchRefreshPanel"

afterEach(cleanup)

describe("CompleteResearchRefreshPanel", () => {
  it("renders the HDFCBANK pilot controls from refresh capability metadata", () => {
    render(<CompleteResearchRefreshPanel portfolioId="portfolio-1" securityId="security-1" symbol="HDFCBANK" profileCode="BANK_NBFC" onCompleted={vi.fn()} />)

    expect(screen.getByRole("heading", { name: "Refresh stale valuation evidence" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Build Momentum & Risk from Angel One" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Add NIFTY Bank Relative Strength" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Discover missing bank growth fields" })).toBeInTheDocument()
  })

  it("does not expose reference-security controls to another BANK_NBFC security", () => {
    render(<CompleteResearchRefreshPanel portfolioId="portfolio-1" securityId="security-2" symbol="ICICIBANK" profileCode="BANK_NBFC" onCompleted={vi.fn()} />)

    expect(screen.queryByRole("heading", { name: "Refresh stale valuation evidence" })).not.toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Add NIFTY Bank Relative Strength" })).not.toBeInTheDocument()
  })

  it("keeps PHARMA_V1 modules profile-wide and fail-closed", () => {
    render(<CompleteResearchRefreshPanel portfolioId="portfolio-1" securityId="security-3" symbol="TORNTPHARM" profileCode="PHARMA_V1" onCompleted={vi.fn()} />)

    expect(screen.getByRole("heading", { name: "Pharma Fundamentals" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Market & Valuation" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Plan complete refresh" })).toBeDisabled()
    expect(screen.queryByRole("heading", { name: "Add NIFTY Bank Relative Strength" })).not.toBeInTheDocument()
  })
})
