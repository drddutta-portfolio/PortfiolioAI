import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { SecurityEnrichment } from "../features/enrichment/types"
import type { PortfolioPosition, PortfolioViewModel } from "../features/portfolio/types"
import { DashboardAllocationPerformance } from "./DashboardAllocationPerformance"

const { portfolioView, enrichmentView } = vi.hoisted(() => ({
  portfolioView: vi.fn(),
  enrichmentView: vi.fn(),
}))

vi.mock("../features/portfolio/usePortfolioView", () => ({ usePortfolioView: portfolioView }))
vi.mock("../features/enrichment/usePortfolioEnrichment", () => ({ usePortfolioEnrichment: enrichmentView }))
vi.mock("./DashboardScopeContext", async (importOriginal) => ({
  ...await importOriginal<typeof import("./DashboardScopeContext")>(),
  useDashboardScope: () => ({ scopeKey: "ALL" }),
}))

function position(overrides: Partial<PortfolioPosition>): PortfolioPosition {
  return {
    securityId: "security-1",
    symbol: "ONE",
    company: "One Limited",
    assetClass: "EQUITY",
    currentValue: "600",
    investedAmount: "500",
    unrealisedPnl: "100",
    ...overrides,
  } as PortfolioPosition
}

function renderAllocation(positions: readonly PortfolioPosition[], enrichment: ReadonlyMap<string, SecurityEnrichment>) {
  portfolioView.mockReturnValue({
    portfolio: {
      portfolio: { id: "portfolio-1", name: "Owner Portfolio", currency: "INR" },
      openPositions: positions,
      themes: [],
    } as unknown as PortfolioViewModel,
    isLoading: false,
    error: null,
  })
  enrichmentView.mockReturnValue({ bySecurityId: enrichment, state: "AVAILABLE", error: null })
  return render(<DashboardAllocationPerformance />)
}

describe("DashboardAllocationPerformance", () => {
  afterEach(() => {
    cleanup()
    portfolioView.mockReset()
    enrichmentView.mockReset()
  })

  it.each([
    ["100", "gain", "₹100.00"],
    ["-100", "loss", "-₹100.00"],
    ["0", "neutral", "₹0.00"],
    [null, "unavailable", "—"],
  ] as const)("preserves covered P/L %s and distinguishes zero from unavailable", (pnl, tone, text) => {
    renderAllocation([position({ unrealisedPnl: pnl })], new Map())
    const section = screen.getByRole("heading", { name: "Sector performance" }).closest("section")!
    const row = within(section).getAllByRole("row")[1]
    const cells = within(row).getAllByRole("cell")
    expect(cells[5]).toHaveTextContent(text)
    expect(cells[5]).toHaveClass(`financial-${tone}`)
  })

  it("renders the approved four-row structure while preserving partial classification", () => {
    const positions = [
      position({ securityId: "security-1" }),
      position({ securityId: "security-2", symbol: "TWO", company: "Two Limited", currentValue: "400", investedAmount: "400", unrealisedPnl: "0" }),
    ]
    const enrichment = new Map<string, SecurityEnrichment>([["security-1", {
      securityId: "security-1",
      sector: "Industrials",
      marketCapCategory: "LARGE_CAP",
    } as SecurityEnrichment]])

    renderAllocation(positions, enrichment)

    expect(screen.getByRole("heading", { name: "Allocation & Performance" })).toBeInTheDocument()
    const coverage = screen.getByLabelText("Classification coverage")
    expect(within(coverage).getAllByText("50%")).toHaveLength(2)
    const scope = screen.getByLabelText("Allocation scope")
    expect(within(scope).getByText("60.0%")).toBeInTheDocument()
    expect(within(scope).getByText("40.0%")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Sector allocation" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Market-cap allocation" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Sector performance" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Market-cap performance" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Where is sector exposure helping or lagging?" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "View all sectors →" })).toHaveAttribute("href", "#dap-sector-performance")
    expect(screen.getByRole("link", { name: "View all market-cap groups →" })).toHaveAttribute("href", "#dap-marketcap-performance")
  })

  it("does not fabricate allocation completeness when the selected scope has no priced value", () => {
    renderAllocation([
      position({ currentValue: null, investedAmount: null, unrealisedPnl: null }),
    ], new Map())

    const scope = screen.getByLabelText("Allocation scope")
    expect(within(scope).getAllByText("Unavailable")).toHaveLength(2)
    expect(screen.getAllByText("No priced data")).toHaveLength(2)
  })
})
