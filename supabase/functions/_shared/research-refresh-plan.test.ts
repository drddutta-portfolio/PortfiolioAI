import {describe,expect,it} from "vitest"
import {buildResearchRefreshPlan} from "./research-refresh-plan.ts"

const policy={dailyLimit:100,perRunLimit:40,retryReservePercent:.2,maxRetryReserve:12,identitySearchCalls:2}
const now=new Date("2026-09-09T18:00:00.000Z")
const security=(id:string,symbol:string,assetClass="EQUITY")=>({id,symbol,assetClass})
const fresh=(id:string)=>({securityId:id,identityFreshUntil:"2027-01-01T00:00:00.000Z",fundamentalFreshUntil:"2026-10-01T00:00:00.000Z",ownershipFreshUntil:"2026-10-01T00:00:00.000Z",documentsFreshUntil:"2026-10-01T00:00:00.000Z"})

describe("Stage 7.2D.2A research refresh planner",()=>{
  it("plans zero provider work when selected domains are fresh",()=>{
    const result=buildResearchRefreshPlan({securities:[security("a","AAA")],evidence:[fresh("a")],documentSecurityIds:[],dailyObservedUsage:10,providerQuotaStatus:"UNKNOWN",policy,now})
    expect(result.plan.baseCalls).toBe(0)
    expect(result.plan.worstCaseAttempts).toBe(0)
    expect(result.providerCalls).toBe(0)
    expect(result.budgetConsumed).toBe(0)
    expect(result.executionAllowed).toBe(false)
  })

  it("reuses one overview while planning missing identity fundamentals and ownership",()=>{
    const result=buildResearchRefreshPlan({securities:[security("a","AAA")],evidence:[],documentSecurityIds:[],dailyObservedUsage:0,providerQuotaStatus:"UNKNOWN",policy,now})
    expect(result.plan.securities[0]?.operations).toEqual(["OVERVIEW","IDENTITY_SEARCH","IDENTITY_SEARCH","OWNERSHIP"])
    expect(result.plan.baseCalls).toBe(4)
    expect(result.plan.worstCaseAttempts).toBe(5)
  })

  it("adds document discovery only when explicitly approved",()=>{
    const result=buildResearchRefreshPlan({securities:[security("a","AAA")],evidence:[{...fresh("a"),documentsFreshUntil:null}],documentSecurityIds:["a"],dailyObservedUsage:0,providerQuotaStatus:"UNKNOWN",policy,now})
    expect(result.plan.securities[0]?.operations).toEqual(["DOCUMENT_SEARCH"])
  })

  it("rejects document scope above three",()=>{
    const securities=[security("a","AAA"),security("b","BBB"),security("c","CCC"),security("d","DDD")]
    expect(()=>buildResearchRefreshPlan({securities,evidence:[],documentSecurityIds:["a","b","c","d"],dailyObservedUsage:0,providerQuotaStatus:"UNKNOWN",policy,now})).toThrow("DOCUMENT_SCOPE_EXCEEDED")
  })

  it("rejects non-equity planning",()=>{
    expect(()=>buildResearchRefreshPlan({securities:[security("a","ETF1","ETF")],evidence:[],documentSecurityIds:[],dailyObservedUsage:0,providerQuotaStatus:"UNKNOWN",policy,now})).toThrow("INELIGIBLE_SECURITY")
  })
})
