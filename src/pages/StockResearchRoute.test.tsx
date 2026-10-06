import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import { StockResearchRoute } from "./StockResearchRoute"

vi.mock("./ResearchPage", () => ({ ResearchPage: () => <p>Redesigned sample</p> }))
vi.mock("./ExistingResearchPage", () => ({ ExistingResearchPage: () => <p>Existing stock page</p> }))
afterEach(cleanup)
function open(security: string) {
  render(<MemoryRouter initialEntries={[`/app/research/${security}`]}><Routes><Route path="/app/research/:security" element={<StockResearchRoute />} /></Routes></MemoryRouter>)
}
describe("sample presentation rollout", () => {
  it.each(["b47b007d-1990-4504-a5a2-4391c07687c5", "HDFCBANK", "hdfcbank"])("enables the HDFCBANK sample for %s", async (security) => {
    open(security)
    expect(await screen.findByText("Redesigned sample")).toBeInTheDocument()
    expect(document.querySelector(".research-sample-shell")).not.toBeNull()
    expect(screen.queryByText("Existing stock page")).not.toBeInTheDocument()
  })
  it.each(["TORNTPHARM", "ABCAPITAL", "other-security-id"])("preserves the existing composition for %s", async (security) => {
    open(security)
    expect(await screen.findByText("Existing stock page")).toBeInTheDocument()
    expect(document.querySelector(".research-sample-shell")).toBeNull()
    expect(screen.queryByText("Redesigned sample")).not.toBeInTheDocument()
  })
})
