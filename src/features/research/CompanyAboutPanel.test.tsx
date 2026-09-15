import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CompanyAboutPanel } from "./CompanyAboutPanel"

vi.mock("../../data/companyProfileRepository", () => ({ companyLogoPublicUrl: () => null }))
vi.mock("./useCompanyProfile", () => ({
  useCompanyProfile: () => ({ data: null, isLoading: false, isDiscovering: false, error: null, reload: vi.fn(), discover: vi.fn() }),
}))

describe("CompanyAboutPanel", () => {
  afterEach(cleanup)

  it("uses the shared compact empty state for any uncached company", () => {
    render(<CompanyAboutPanel portfolioId="portfolio-1" securityId="security-1" symbol="LONGSECURITYSYMBOL" companyName="Example Company" />)
    expect(screen.getByText("About LONGSECURITYSYMBOL")).toBeInTheDocument()
    expect(screen.getByText("Company profile not cached yet.")).toBeInTheDocument()
    expect(screen.getByText("Profile information will appear after approved company-profile enrichment.")).toBeInTheDocument()
    expect(document.querySelector(".company-about-panel")).toHaveClass("company-about-empty")
    expect(screen.queryByRole("button", { name: /fetch company profile/i })).not.toBeInTheDocument()
  })
})
