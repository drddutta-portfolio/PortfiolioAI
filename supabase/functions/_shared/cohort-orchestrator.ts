export type RefreshDomain="IDENTITY"|"FUNDAMENTALS"|"OWNERSHIP"|"DOCUMENTS"
export type PlannedOperation="OVERVIEW"|"IDENTITY_SEARCH"|"OWNERSHIP"|"DOCUMENT_SEARCH"

export const APPROVED_COHORT_A_SYMBOLS=["HDFCBANK","M&M","BHARTIARTL","MOTHERSON","BBOX","AVALON","ASTRAMICRO","WABAG","WAAREEENER","ZAGGLE","ICICIBANK","SBIN","FEDERALBNK","INFY","TITAN","TORNTPHARM","LAURUSLABS","TVSMOTOR","IREDA","HUDCO","TDPOWERSYS","MTARTECH","PIIND","VBL","NETWEB"] as const

export function isApprovedCohortA(symbols:readonly string[]):boolean{
  const approved=new Set<string>(APPROVED_COHORT_A_SYMBOLS)
  return symbols.length===approved.size&&new Set(symbols).size===approved.size&&symbols.every(symbol=>approved.has(symbol))
}

export interface CohortSecurityState{
  readonly securityId:string
  readonly symbol:string
  readonly isOpenEquity:boolean
  readonly verifiedIdentityFresh:boolean
  readonly fundamentalsFresh:boolean
  readonly ownershipFresh:boolean
  readonly documentsFresh:boolean
  readonly documentsApproved:boolean
}

export interface CachedCohortEvidence{
  readonly securityId:string
  readonly identityFreshUntil:string|null
  readonly fundamentalFreshUntil:string|null
  readonly ownershipFreshUntil:string|null
  readonly documentsFreshUntil:string|null
}

const fresh=(value:string|null,now:Date)=>value!==null&&Number.isFinite(Date.parse(value))&&Date.parse(value)>now.getTime()
export function cohortSecurityState(security:{readonly id:string;readonly symbol:string;readonly assetClass:string},cached:CachedCohortEvidence|undefined,documentsApproved:boolean,now:Date):CohortSecurityState{
  return {securityId:security.id,symbol:security.symbol,isOpenEquity:security.assetClass==="EQUITY",verifiedIdentityFresh:fresh(cached?.identityFreshUntil??null,now),fundamentalsFresh:fresh(cached?.fundamentalFreshUntil??null,now),ownershipFresh:fresh(cached?.ownershipFreshUntil??null,now),documentsFresh:fresh(cached?.documentsFreshUntil??null,now),documentsApproved}
}

export interface SecurityRefreshPlan{
  readonly securityId:string
  readonly symbol:string
  readonly domains:Readonly<Record<RefreshDomain,"REQUIRED"|"SKIPPED_FRESH"|"NOT_APPROVED">>
  readonly operations:readonly PlannedOperation[]
  readonly baseCalls:number
}

export interface CohortBatchPlan{
  readonly batchNumber:number
  readonly securities:readonly SecurityRefreshPlan[]
  readonly baseCalls:number
  readonly retryReserve:number
  readonly reservedAttempts:number
}

export interface CohortRefreshPlan{
  readonly securities:readonly SecurityRefreshPlan[]
  readonly batches:readonly CohortBatchPlan[]
  readonly baseCalls:number
  readonly retryReserve:number
  readonly worstCaseAttempts:number
}

export interface PlannerPolicy{
  readonly dailyLimit:number
  readonly perRunLimit:number
  readonly retryReservePercent:number
  readonly maxRetryReserve:number
  readonly identitySearchCalls:number
}

const required=(fresh:boolean)=>fresh?"SKIPPED_FRESH" as const:"REQUIRED" as const

const retryableCodes=new Set(["PROVIDER_TIMEOUT","PROVIDER_NETWORK_ERROR","PROVIDER_HTTP_408","PROVIDER_HTTP_429","PROVIDER_HTTP_500","PROVIDER_HTTP_502","PROVIDER_HTTP_503","PROVIDER_HTTP_504"])
export const isRetryableProviderFailure=(safeCode:string)=>retryableCodes.has(safeCode)

export function planSecurity(state:CohortSecurityState,identitySearchCalls:number):SecurityRefreshPlan{
  if(!state.isOpenEquity)throw new Error(`INELIGIBLE_SECURITY:${state.symbol}`)
  const identity=required(state.verifiedIdentityFresh)
  const fundamentals=required(state.fundamentalsFresh)
  const ownership=required(state.ownershipFresh)
  const documents=state.documentsApproved?required(state.documentsFresh):"NOT_APPROVED" as const
  const needsOverview=identity==="REQUIRED"||fundamentals==="REQUIRED"||ownership==="REQUIRED"
  const operations:PlannedOperation[]=[]
  if(needsOverview)operations.push("OVERVIEW")
  if(identity==="REQUIRED")for(let index=0;index<identitySearchCalls;index++)operations.push("IDENTITY_SEARCH")
  if(ownership==="REQUIRED")operations.push("OWNERSHIP")
  if(documents==="REQUIRED")operations.push("DOCUMENT_SEARCH")
  return {securityId:state.securityId,symbol:state.symbol,domains:{IDENTITY:identity,FUNDAMENTALS:fundamentals,OWNERSHIP:ownership,DOCUMENTS:documents},operations,baseCalls:operations.length}
}

export function planCohort(states:readonly CohortSecurityState[],policy:PlannerPolicy):CohortRefreshPlan{
  if(policy.dailyLimit<1||policy.perRunLimit<1||policy.retryReservePercent<0||policy.maxRetryReserve<0||policy.identitySearchCalls<0)throw new Error("INVALID_PLANNER_POLICY")
  if(states.filter(state=>state.documentsApproved).length>3)throw new Error("DOCUMENT_SCOPE_EXCEEDED")
  const securities=states.map(state=>planSecurity(state,policy.identitySearchCalls))
  const callable=securities.filter(item=>item.baseCalls>0)
  const batches:SecurityRefreshPlan[][]=[]
  const baseBatchLimit=Math.max(1,Math.floor(policy.perRunLimit/(1+policy.retryReservePercent)))
  for(const item of callable){
    if(item.baseCalls>baseBatchLimit)throw new Error(`SECURITY_EXCEEDS_RUN_LIMIT:${item.symbol}`)
    const current=batches.at(-1)
    if(!current||current.reduce((sum,value)=>sum+value.baseCalls,0)+item.baseCalls>baseBatchLimit)batches.push([item]);else current.push(item)
  }
  const desiredRetry=Math.min(policy.maxRetryReserve,Math.ceil(callable.reduce((sum,item)=>sum+item.baseCalls,0)*policy.retryReservePercent))
  let retriesRemaining=desiredRetry
  const plannedBatches=batches.map((items,index)=>{
    const baseCalls=items.reduce((sum,item)=>sum+item.baseCalls,0)
    const proportional=Math.ceil(baseCalls*policy.retryReservePercent)
    const retryReserve=Math.min(retriesRemaining,proportional,policy.perRunLimit-baseCalls)
    retriesRemaining-=retryReserve
    return {batchNumber:index+1,securities:items,baseCalls,retryReserve,reservedAttempts:baseCalls+retryReserve}
  })
  if(retriesRemaining>0)throw new Error("RETRY_RESERVE_DOES_NOT_FIT_BATCHES")
  const baseCalls=securities.reduce((sum,item)=>sum+item.baseCalls,0),retryReserve=plannedBatches.reduce((sum,batch)=>sum+batch.retryReserve,0),worstCaseAttempts=baseCalls+retryReserve
  if(worstCaseAttempts>policy.dailyLimit)throw new Error("DAILY_LIMIT_EXCEEDED")
  return {securities,batches:plannedBatches,baseCalls,retryReserve,worstCaseAttempts}
}

export interface Reservation{readonly id:string}
export class SecurityExecutionError extends Error{
  constructor(message:string,readonly attempted:number,readonly failed:number){super(message);this.name="SecurityExecutionError"}
}
export interface BatchExecutionDependencies{
  reserve(attempts:number):Promise<Reservation>
  acquireLease():Promise<void>
  executeSecurity(plan:SecurityRefreshPlan):Promise<{attempted:number;failed:number}>
  settle(reservationId:string,attempted:number,failed:number,released:number):Promise<void>
  releaseLease():Promise<void>
  complete(status:"SUCCEEDED"|"PARTIAL"|"FAILED",attempted:number,failed:number):Promise<void>
}

export async function executePlannedBatch(batch:CohortBatchPlan,deps:BatchExecutionDependencies):Promise<void>{
  let reservation:Reservation|undefined,leaseAcquired=false,attempted=0,failed=0,fatal:unknown
  try{
    reservation=await deps.reserve(batch.reservedAttempts)
    await deps.acquireLease();leaseAcquired=true
    for(const security of batch.securities){
      try{const result=await deps.executeSecurity(security);attempted+=result.attempted;failed+=result.failed}catch(error){if(error instanceof SecurityExecutionError){attempted+=error.attempted;failed+=error.failed}fatal=error;break}
    }
  }catch(error){fatal=error
  }finally{
    if(reservation){
      const released=Math.max(0,batch.reservedAttempts-attempted)
      try{await deps.settle(reservation.id,attempted-failed,failed,released)}catch(error){fatal??=error}
    }
    if(leaseAcquired)try{await deps.releaseLease()}catch(error){fatal??=error}
    const status=fatal?(attempted>failed?"PARTIAL":"FAILED"):"SUCCEEDED"
    try{await deps.complete(status,attempted,failed)}catch(error){fatal??=error}
  }
  if(fatal)throw fatal
}
