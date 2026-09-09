import {cohortSecurityState,planCohort,type CohortRefreshPlan,type CohortSecurityState,type PlannerPolicy} from "./cohort-orchestrator.ts"

export interface RefreshPlanningEvidence {
  readonly securityId:string
  readonly identityFreshUntil:string|null
  readonly fundamentalFreshUntil:string|null
  readonly ownershipFreshUntil:string|null
  readonly documentsFreshUntil:string|null
}

export interface RefreshPlanningSecurity {
  readonly id:string
  readonly symbol:string
  readonly assetClass:string
}

export interface RefreshPlanningInput {
  readonly securities:readonly RefreshPlanningSecurity[]
  readonly evidence:readonly RefreshPlanningEvidence[]
  readonly documentSecurityIds:readonly string[]
  readonly dailyObservedUsage:number
  readonly providerQuotaStatus:string
  readonly policy:PlannerPolicy
  readonly now:Date
}

export interface RefreshPlanningResult {
  readonly plan:CohortRefreshPlan
  readonly projectedDailyUsage:number
  readonly dailyRemaining:number
  readonly fitsDailyBudget:boolean
  readonly providerQuotaStatus:string
  readonly providerCalls:number
  readonly budgetConsumed:number
  readonly executionAllowed:false
  readonly executionGateReason:"STAGE_7_2D_2A_EXECUTION_DISABLED"
}

export function buildResearchRefreshPlan(input:RefreshPlanningInput):RefreshPlanningResult{
  const evidenceById=new Map(input.evidence.map(item=>[item.securityId,item]))
  const documentsApproved=new Set(input.documentSecurityIds)
  if(documentsApproved.size>3)throw new Error("DOCUMENT_SCOPE_EXCEEDED")
  if([...documentsApproved].some(id=>!input.securities.some(security=>security.id===id)))throw new Error("INVALID_DOCUMENT_SCOPE")
  const states:CohortSecurityState[]=input.securities.map(security=>cohortSecurityState(
    security,
    evidenceById.get(security.id),
    documentsApproved.has(security.id),
    input.now,
  ))
  const plan=planCohort(states,input.policy)
  const projectedDailyUsage=input.dailyObservedUsage+plan.worstCaseAttempts
  return {
    plan,
    projectedDailyUsage,
    dailyRemaining:Math.max(0,input.policy.dailyLimit-input.dailyObservedUsage),
    fitsDailyBudget:projectedDailyUsage<=input.policy.dailyLimit,
    providerQuotaStatus:input.providerQuotaStatus,
    providerCalls:0,
    budgetConsumed:0,
    executionAllowed:false,
    executionGateReason:"STAGE_7_2D_2A_EXECUTION_DISABLED",
  }
}
