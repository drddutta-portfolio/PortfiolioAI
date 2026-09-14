import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { ResearchReadinessPanel } from "./ResearchReadinessPanel"

describe("ResearchReadinessPanel", () => {
  afterEach(cleanup)

  it("keeps a compact summary and all contract details accessible", () => {
    render(<ResearchReadinessPanel
      title="Example Research Readiness"
      detail="Profile-specific evidence in a shared shell."
      ready={0}
      total={13}
      groups={[
        { code: "CORE", label: "Core evidence", ready: 0, total: 6 },
        { code: "OTHER", label: "Other evidence", ready: 0, total: 7 },
      ]}
      detailsLabel="View all research contracts"
      details={<div>Thirteen detailed contracts remain available</div>}
    />)
    expect(screen.getByText("0/13")).toBeInTheDocument()
    expect(screen.getByLabelText("Example Research Readiness summary")).toHaveTextContent("Core evidence0/6 readyOther evidence0/7 ready")
    const disclosure = screen.getByText("View all research contracts").closest("summary")
    expect(disclosure).not.toBeNull()
    fireEvent.click(disclosure!)
    expect(screen.getByText("Thirteen detailed contracts remain available")).toBeVisible()
  })
})
