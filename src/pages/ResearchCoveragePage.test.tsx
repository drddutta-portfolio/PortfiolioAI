import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ResearchRefreshPlan } from "../data/researchCoverageRepository"
import type { PortfolioViewModel } from "../features/portfolio/types"
import type { ResearchCoverageRow } from "../features/research/researchCoverage"
import { ResearchCoveragePage } from "./ResearchCoveragePage"

const { estimateResearchRefresh } = vi.hoisted(() => ({
  estimateResearchRefresh: vi.fn<(portfolioId: string, securityIds: readonly string[], documentSecurityIds?: readonly string[]) => Promise<ResearchRefreshPlan>>(),
}))
const equityPosition={securityId:"e1",symbol:"BEL",company:"Bharat Electronics",assetClass:"EQUITY"} as const
const etfPosition={securityId:"f1",symbol:"NIFTYBEES",company:"Nifty ETF",assetClass:"ETF"} as const
const portfolio={portfolio:{id:"p1",name:"Portfolio",currency:"INR"},openPositions:[equityPosition,etfPosition]} as unknown as PortfolioViewModel
const row=(securityId:string,symbol:string,assetClass:string,equityEligible:boolean):ResearchCoverageRow=>({securityId,symbol,company:symbol,assetClass,role:equityEligible?"CORE":"ETF",themes:[],sector:null,marketCapCategory:null,equityEligible,providerIdentity:equityEligible?"STALE":"NOT_APPLICABLE",fundamentals:equityEligible?"MISSING":"NOT_APPLICABLE",ownership:equityEligible?"MISSING":"NOT_APPLICABLE",valuation:equityEligible?"CONFLICTING":"NOT_APPLICABLE",documents:equityEligible?"MISSING":"NOT_APPLICABLE",overall:equityEligible?"CONFLICTING":"NOT_APPLICABLE",conflictCount:equityEligible?1:0,reviewRequiredCount:0,latestEvidenceAt:null})
const coverage=[row("e1","BEL","EQUITY",true),row("f1","NIFTYBEES","ETF",false)]

vi.mock("../features/portfolio/usePortfolioView",()=>({usePortfolioView:()=>({portfolio,error:null,isLoading:false})}))
vi.mock("../features/research/useResearchCoverage",()=>({useResearchCoverage:()=>({data:coverage,error:null,isLoading:false})}))
vi.mock("../data/researchCoverageRepository",async(importOriginal)=>{
  const actual=await importOriginal<typeof import("../data/researchCoverageRepository")>()
  return {...actual,estimateResearchRefresh}
})

describe("ResearchCoveragePage refresh planning",()=>{
  afterEach(()=>{cleanup();estimateResearchRefresh.mockReset()})
  it("does not plan on render filtering or selection and keeps ETF ineligible",()=>{
    render(<MemoryRouter><ResearchCoveragePage /></MemoryRouter>)
    expect(screen.getByLabelText("Select BEL for refresh planning")).toBeInTheDocument()
    expect(screen.queryByLabelText("Select NIFTYBEES for refresh planning")).not.toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText("Ticker or company"),{target:{value:"BEL"}})
    fireEvent.click(screen.getByLabelText("Select BEL for refresh planning"))
    expect(estimateResearchRefresh).not.toHaveBeenCalled()
  })

  it("calls the planning endpoint only after explicit estimate action and never exposes execution",async()=>{
    estimateResearchRefresh.mockResolvedValue({selectedSecurityCount:1,plan:{securities:[{securityId:"e1",symbol:"BEL",domains:{IDENTITY:"REQUIRED",FUNDAMENTALS:"REQUIRED",OWNERSHIP:"REQUIRED",DOCUMENTS:"NOT_APPROVED"},operations:["OVERVIEW","IDENTITY_SEARCH","IDENTITY_SEARCH","OWNERSHIP"],baseCalls:4}],batches:[{batchNumber:1,baseCalls:4,retryReserve:1,reservedAttempts:5}],baseCalls:4,retryReserve:1,worstCaseAttempts:5},projectedDailyUsage:15,dailyRemaining:90,fitsDailyBudget:true,providerQuotaStatus:"UNKNOWN",providerCalls:0,budgetConsumed:0,executionAllowed:false,executionGateReason:"STAGE_7_2D_2A_EXECUTION_DISABLED",perRunInternalAttemptLimit:40,dailyInternalAttemptLimit:100,dailyObservedUsage:10})
    render(<MemoryRouter><ResearchCoveragePage /></MemoryRouter>)
    fireEvent.click(screen.getByLabelText("Select BEL for refresh planning"))
    fireEvent.click(screen.getByRole("button",{name:"Estimate refresh (1)"}))
    await waitFor(()=>expect(estimateResearchRefresh).toHaveBeenCalledWith("p1",["e1"],[]))
    expect(screen.getByText("0 provider calls")).toBeInTheDocument()
    expect(screen.getByText("Unknown")).toBeInTheDocument()
    expect(screen.getByRole("button",{name:/Review and acknowledge estimate/})).toBeDisabled()
    fireEvent.click(screen.getByLabelText(/I reviewed this estimate/))
    expect(screen.getByRole("button",{name:/Estimate reviewed · execution remains separate/})).toBeDisabled()
  })
})
