import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { useState } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { StockSectionNavigator, type StockResearchTab } from "./StockSectionNavigator"

function Workspace({ hasResearch = true }: { hasResearch?: boolean }) {
  const [tab, setTab] = useState<StockResearchTab>("Overview")
  return <><StockSectionNavigator activeTab={tab} onTabChange={setTab} hasResearch={hasResearch} hasSpecialist />
    <div id="stock-summary" tabIndex={-1}>Summary block</div>
    <div id="stock-workspace" tabIndex={-1}>{tab} content</div>
    {tab === "Overview" && hasResearch ? <div id="stock-health" tabIndex={-1}>Health block</div> : null}
  </>
}
const scrollTo = vi.fn()
beforeEach(() => {
  scrollTo.mockClear()
  vi.stubGlobal("scrollTo", scrollTo)
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })))
  window.history.replaceState({ key: "router-state" }, "", "/app/research/example")
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
describe("shared stock section navigation", () => {
  it("switches tabs before jumping and restores an Overview block", () => {
    render(<Workspace />)
    const menu = within(screen.getByRole("navigation", { name: "Stock page sections" }))
    fireEvent.click(menu.getByRole("link", { name: "Documents" }))
    expect(screen.getByText("Documents content")).toBeInTheDocument()
    expect(document.activeElement?.id).toBe("stock-workspace")
    expect(window.history.state).toEqual({ key: "router-state" })
    fireEvent.click(menu.getByRole("link", { name: "Research health" }))
    expect(screen.getByText("Overview content")).toBeInTheDocument()
    expect(document.activeElement?.id).toBe("stock-health")
    expect(window.location.hash).toBe("#stock-health")
    fireEvent.click(menu.getByRole("link", { name: "Evidence" }))
    expect(screen.getByText("Evidence content")).toBeInTheDocument()
  })
  it("offsets the target by the sticky menu height and focuses the block", () => {
    render(<Workspace />)
    const menu = screen.getByRole("navigation", { name: "Stock page sections" })
    const target = document.getElementById("stock-summary")!
    vi.spyOn(menu, "getBoundingClientRect").mockReturnValue({ height: 50 } as DOMRect)
    vi.spyOn(target, "getBoundingClientRect").mockReturnValue({ top: 300 } as DOMRect)
    fireEvent.click(within(menu).getByRole("link", { name: "Summary" }))
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 238, behavior: "smooth" })
    expect(document.activeElement).toBe(target)
  })
  it("keeps basic navigation available and omits absent research blocks", () => {
    render(<Workspace hasResearch={false} />)
    expect(screen.getByRole("link", { name: "Owner plan & suggestion" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Evidence" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Research health" })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Stock research" })).not.toBeInTheDocument()
  })
  it("respects reduced motion and supports return to top", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })))
    render(<Workspace />)
    fireEvent.click(screen.getByRole("link", { name: "Summary" }))
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: "instant" })
    fireEvent.click(screen.getByRole("link", { name: "Back to page top" }))
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: "instant" })
    expect(window.location.hash).toBe("#app-top")
  })
})
