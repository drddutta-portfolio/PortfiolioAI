import {describe,expect,it,vi} from "vitest"
import {executePlannedBatch,isApprovedCohortA,isRetryableProviderFailure,planCohort,SecurityExecutionError,type CohortSecurityState} from "./cohort-orchestrator.ts"

const pilot=["HDFCBANK","M&M","BHARTIARTL","MOTHERSON","BBOX","AVALON","ASTRAMICRO","WABAG","WAAREEENER","ZAGGLE"]
const additions=["ICICIBANK","SBIN","FEDERALBNK","INFY","TITAN","TORNTPHARM","LAURUSLABS","TVSMOTOR","IREDA","HUDCO","TDPOWERSYS","MTARTECH","PIIND","VBL","NETWEB"]
const state=(symbol:string,pilotSecurity:boolean,index:number):CohortSecurityState=>({securityId:`security-${index}`,symbol,isOpenEquity:true,verifiedIdentityFresh:pilotSecurity,fundamentalsFresh:pilotSecurity,ownershipFresh:pilotSecurity,documentsFresh:pilotSecurity,documentsApproved:pilotSecurity&&index<3})
const cohort=[...pilot.map((symbol,index)=>state(symbol,true,index)),...additions.map((symbol,index)=>state(symbol,false,index+10))]
const policy={dailyLimit:100,perRunLimit:40,retryReservePercent:.2,maxRetryReserve:12,identitySearchCalls:2}

describe("Stage 7.2B1 cohort planner",()=>{
  it("accepts only the exact owner-approved Cohort A symbols",()=>{
    expect(isApprovedCohortA([...pilot,...additions])).toBe(true)
    expect(isApprovedCohortA([...pilot,...additions.slice(0,-1),"REPLACEMENT"])).toBe(false)
  })
  it("skips fresh pilot evidence and shares one overview for required domains",()=>{
    const plan=planCohort(cohort,policy)
    expect(plan.securities.slice(0,10).every(item=>item.baseCalls===0)).toBe(true)
    expect(plan.securities[10].operations).toEqual(["OVERVIEW","IDENTITY_SEARCH","IDENTITY_SEARCH","OWNERSHIP"])
    expect(plan.securities[10].operations.filter(operation=>operation==="OVERVIEW")).toHaveLength(1)
  })
  it("fits the exact cohort and bounded retries into two sub-40 batches",()=>{
    const plan=planCohort(cohort,policy)
    expect(plan.baseCalls).toBe(60);expect(plan.retryReserve).toBe(12);expect(plan.worstCaseAttempts).toBe(72)
    expect(plan.batches.map(batch=>batch.reservedAttempts)).toEqual([39,33])
    expect(plan.batches.every(batch=>batch.reservedAttempts<=40)).toBe(true)
  })
  it("rejects ineligible assets and document expansion",()=>{
    expect(()=>planCohort([{...cohort[0],isOpenEquity:false}],policy)).toThrow("INELIGIBLE_SECURITY")
    expect(()=>planCohort(cohort.map((item,index)=>({...item,documentsApproved:index<4})),policy)).toThrow("DOCUMENT_SCOPE_EXCEEDED")
  })
  it("reserves retries only for approved transient classes",()=>{
    expect(isRetryableProviderFailure("PROVIDER_TIMEOUT")).toBe(true)
    expect(isRetryableProviderFailure("PROVIDER_HTTP_429")).toBe(true)
    expect(isRetryableProviderFailure("UNEXPECTED_PROVIDER_SECURITY")).toBe(false)
    expect(isRetryableProviderFailure("CONFLICTING_PROVIDER_IDENTITY")).toBe(false)
    expect(isRetryableProviderFailure("PROVIDER_HTTP_400")).toBe(false)
  })
})

describe("Stage 7.2B1 cleanup",()=>{
  const batch=planCohort(cohort,policy).batches[0]
  const dependencies=(failure?:"reserve"|"lease"|"execute"|"settle"|"release"|"complete")=>({
    reserve:vi.fn(async()=>{if(failure==="reserve")throw new Error("reserve");return{id:"reservation"}}),
    acquireLease:vi.fn(async()=>{if(failure==="lease")throw new Error("lease")}),
    executeSecurity:vi.fn(async()=>{if(failure==="execute")throw new SecurityExecutionError("execute",2,1);return{attempted:4,failed:0}}),
    settle:vi.fn(async()=>{if(failure==="settle")throw new Error("settle")}),
    releaseLease:vi.fn(async()=>{if(failure==="release")throw new Error("release")}),
    complete:vi.fn(async()=>{if(failure==="complete")throw new Error("complete")}),
  })
  it.each(["lease","execute","settle","release","complete"] as const)("settles and releases safely after %s failure",async failure=>{
    const deps=dependencies(failure);await expect(executePlannedBatch(batch,deps)).rejects.toThrow()
    expect(deps.settle).toHaveBeenCalledTimes(1)
    expect(deps.releaseLease).toHaveBeenCalledTimes(failure==="lease"?0:1)
    expect(deps.complete).toHaveBeenCalledTimes(1)
  })
  it("does not acquire or release after reservation failure",async()=>{
    const deps=dependencies("reserve");await expect(executePlannedBatch(batch,deps)).rejects.toThrow("reserve")
    expect(deps.acquireLease).not.toHaveBeenCalled();expect(deps.settle).not.toHaveBeenCalled();expect(deps.releaseLease).not.toHaveBeenCalled();expect(deps.complete).toHaveBeenCalled()
  })
  it.each(["after identity","after overview","during evidence persistence","during usage accounting","during refresh-state update"])("preserves cleanup when execution fails %s",async()=>{
    const deps=dependencies("execute");await expect(executePlannedBatch(batch,deps)).rejects.toThrow("execute")
    expect(deps.settle).toHaveBeenCalledWith("reservation",1,1,batch.reservedAttempts-2);expect(deps.releaseLease).toHaveBeenCalledTimes(1);expect(deps.complete).toHaveBeenCalledWith("PARTIAL",2,1)
  })
})
