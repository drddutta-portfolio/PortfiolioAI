import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import type { PortfolioPosition, PortfolioViewModel } from "../portfolio/types"
import type { ResultsSourceObservation } from "./resultsSourceRepository"
import { ResultsLivePage } from "./ResultsLivePage"

const mock = vi.hoisted(() => ({ load: vi.fn(), usePortfolio: vi.fn(), status: vi.fn(), start: vi.fn(), step: vi.fn() }))
vi.mock("./resultsSourceRepository", () => ({ loadResultsSourceInventory: mock.load }))
vi.mock("./resultsScanRepository", () => ({ getResultsScanStatus: mock.status, startResultsScan: mock.start, stepResultsScan: mock.step }))
vi.mock("../portfolio/usePortfolioView", () => ({ usePortfolioView: mock.usePortfolio }))

const bank = {
  securityId:"bank", symbol:"BANKTEST", company:"Bank Example",
  sector:"Banking",industry:"Banks",assetClass:"EQUITY",
  quantity:"10",averageCost:"50",currentPrice:"70",currentValue:"700",
  unrealisedPnl:"200",realisedPnl:null,
} as PortfolioPosition
const closed = {
  ...bank,securityId:"closed",symbol:"CLOSEDTEST", company:"Closed Example",
  sector:"Information Technology",industry:"IT Services",
  quantity:"0",realisedPnl:"100",currentValue:null,
} as PortfolioPosition
const portfolio = {
  portfolio:{id:"portfolio",currency:"INR"},
  openPositions:[bank],closedPositions:[closed],
} as unknown as PortfolioViewModel
function fact(end: string, code: string, value: string):ResultsSourceObservation {
  const [year, month] = end.split("-").map(Number)
  return { id:end+code,securityId:"bank",code,value,periodEnd:end,
    periodStart:new Date(Date.UTC(year!,month!-3,1)).toISOString().slice(0,10),
    currency:"INR",sourceRecordId:end+"-issuer",unit:"INR_CRORE",
    scope:"CONSOLIDATED",source:"COMPANY_EXCHANGE_FILING",
    retrievedAt:"2026-10-15T00:00:00Z",publishedAt:null,selected:true }
}
beforeAll(() => {
  Object.defineProperty(Element.prototype,"scrollIntoView",{value:vi.fn(),configurable:true})
})
afterEach(() => { cleanup(); vi.clearAllMocks() })

describe("Results R5 approved visual shell with qualified evidence", () => {
  it("keeps filters, four analysis panels and real open/closed equities while showing calibrated quarter growth", async () => {
    mock.usePortfolio.mockReturnValue({portfolio,isLoading:false,error:null})
    mock.status.mockResolvedValue({lastScan:null,newResults:0,run:null})
    mock.load.mockResolvedValue([
      fact("2026-06-30","NET_INTEREST_INCOME_QUARTER","110"),
      fact("2026-03-31","NET_INTEREST_INCOME_QUARTER","100"),
      fact("2026-06-30","NET_PROFIT_QUARTER","125"),
      fact("2026-03-31","NET_PROFIT_QUARTER","100"),
    ])
    render(<ResultsLivePage />)
    expect(await screen.findByText("2 stocks")).toBeInTheDocument()
    expect(screen.getByRole("tab",{name:"Quarterly Results"})).toHaveAttribute("aria-selected","true")
    expect(screen.getByRole("columnheader",{name:/Q1 FY27/})).toBeInTheDocument()
    expect(screen.getByRole("columnheader",{name:"Q2 FY26"})).toBeInTheDocument()
    expect(screen.queryByRole("columnheader",{name:/Q2 FY27/})).not.toBeInTheDocument()
    expect(screen.queryByRole("columnheader",{name:"Q1 FY26"})).not.toBeInTheDocument()
    expect(screen.getByRole("tab",{name:/Annual Results/})).toBeDisabled()
    expect(screen.getByRole("button",{name:"Current Holdings"})).toBeInTheDocument()
    expect(screen.getByRole("button",{name:"Closed Positions"})).toBeInTheDocument()
    expect(screen.getByRole("button",{name:"Strong"})).toBeInTheDocument()
    const headings=["Portfolio Position","Net Interest Income — Last 4 Quarters","Key Metrics (Q1 FY27)","AI Insight"]
    for (const title of headings) expect(screen.getByRole("heading",{name:title})).toBeInTheDocument()
    const bankRow=screen.getByText("BANKTEST").closest("tr")
    expect(bankRow).not.toBeNull()
    const q1=bankRow?.querySelector('button[aria-label*="Q1 FY27"]')
    expect(q1?.textContent).toContain("NII +10.00% QoQ")
    // A single bank lacks four independently qualified industry peers; never invent a Strong grade.
    expect(q1).toHaveClass("ref-unavailable")
    const table=screen.getByRole("heading",{name:"Key Metrics (Q1 FY27)"}).closest("section")
    if(!table) throw new Error("Missing result metrics card")
    expect(within(table).getAllByText("10.00%").length).toBeGreaterThan(0)
    expect(within(table).getAllByText("—").length).toBeGreaterThan(0)
    expect(screen.getByText("CLOSEDTEST")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button",{name:"Closed Positions"}))
    expect(screen.queryByText("BANKTEST")).not.toBeInTheDocument()
    expect(screen.getByText("CLOSEDTEST")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button",{name:"Clear Filters"}))
    await waitFor(()=>expect(screen.getByText("BANKTEST")).toBeInTheDocument())
  })
  it("shows the R5 eligible-stock coverage and explicitly labels a sparse-peer bank as company trend", async () => {
    mock.usePortfolio.mockReturnValue({portfolio,isLoading:false,error:null})
    mock.status.mockResolvedValue({lastScan:null,newResults:0,run:null})
    const quarters=["2025-09-30","2025-12-31","2026-03-31","2026-06-30"]
    mock.load.mockResolvedValue(quarters.flatMap((q,i)=>[
      fact(q,"NET_INTEREST_INCOME_QUARTER",String(100+i*10)),
      fact(q,"NET_PROFIT_QUARTER",String(20+i*5)),
      { ...fact(q,"EPS_DILUTED",String(5+i)),unit:"INR_PER_SHARE" },
    ]))
    render(<ResultsLivePage />)
    expect(await screen.findByText("1 stocks with four qualified quarters")).toBeInTheDocument()
    const coverage=screen.getByRole("region",{name:"R5 quarterly grade coverage"})
    expect(within(coverage).getByText("Strong 1")).toBeInTheDocument()
    expect(within(coverage).getByText(/0 peer-ranked · 1 own-trend/)).toBeInTheDocument()
    const row=screen.getByText("BANKTEST").closest("tr")
    const cell=row?.querySelector('button[aria-label*="Q1 FY27"]')
    expect(cell).toHaveClass("ref-strong")
    expect(cell?.getAttribute("aria-label")).toContain("COMPANY_TREND")
    expect(screen.getByText(/Method: Company trend/)).toBeInTheDocument()
    expect(screen.getAllByText("Strong").length).toBeGreaterThan(0)
  })

})
