import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import { StockResearchRoute } from "./StockResearchRoute"

vi.mock("./ResearchPage", () => ({ ResearchPage: () => <p>Shared stock workspace</p> }))
afterEach(cleanup)
function open(security: string) {
  render(<MemoryRouter initialEntries={[`/app/research/${security}`]}><Routes><Route path="/app/research/:security" element={<StockResearchRoute />} /></Routes></MemoryRouter>)
}
describe("universal stock presentation", () => {
  it.each(["b47b007d-1990-4504-a5a2-4391c07687c5", "HDFCBANK", "hdfcbank", "da69b3eb-0343-44f8-912c-288b826118cc", "TORNTPHARM", "ABCAPITAL", "other-security-id"])("uses the same shell for %s", async (security) => {
    open(security)
    expect(await screen.findByText("Shared stock workspace")).toBeInTheDocument()
    expect(document.querySelector(".research-workspace-shell")).not.toBeNull()
  })
})
