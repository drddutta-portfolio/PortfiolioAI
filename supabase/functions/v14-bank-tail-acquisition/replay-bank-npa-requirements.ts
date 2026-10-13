/** Existing requirement evaluator over database readback. Suppress server startup
 * only; do not invoke/authenticate the deployed HTTP handler or write anything. */
import {BANK_DELEGATION_POLICY as policy} from "../_shared/v14-bank-approved-delegation.ts"
import type {RequirementReview,ReviewedSourceRecord} from "../_shared/v14-reviewed-evidence.ts"
import type {MetricDefinition,InputObservation} from "../_shared/p7-ic-input-validation.ts"
const serve=Deno.serve
let evaluate:typeof import("../p7-ic2-materialize-readiness/index.ts").requirementItem
try{Deno.serve=(()=>({})) as unknown as typeof Deno.serve;evaluate=(await import("../p7-ic2-materialize-readiness/index.ts")).requirementItem}finally{Deno.serve=serve}
const evidence=JSON.parse(await Deno.readTextFile(Deno.args[0]!)) as {sources:ReviewedSourceRecord[];reviews:RequirementReview[]}
const definitions=JSON.parse(await Deno.readTextFile(Deno.args[1]!)) as MetricDefinition[]
const observations=JSON.parse(await Deno.readTextFile(Deno.args[2]!)) as (InputObservation&{security_id:string})[]
const evaluatedAt=new Date().toISOString(),results=[]
for(const securityId of Object.keys(policy.securities))for(const code of ["GROSS_NPA","NET_NPA"]){
 const result=await evaluate({code,family:"NUMERIC_SERIES",minimum:1,freshness:"90_DAYS",benchmarks:[],portfolioId:policy.portfolioId,portfolioOwnerId:policy.ownerId,securityId,observations,definitions,records:[],reviews:evidence.reviews,reviewSources:evidence.sources,researchDocuments:[],documentSources:[],benchmarkByCode:new Map(),historyProofs:new Map(),evaluationAsOfMs:Date.parse(evaluatedAt),sourceCutoffAtMs:Date.parse(evaluatedAt)})
 results.push({symbol:policy.securities[securityId as keyof typeof policy.securities],securityId,result})
}
await Deno.writeTextFile(Deno.args[3]!,JSON.stringify({version:"BANK_NPA_ACTUAL_CANONICAL_REQUIREMENT_REPLAY_V1",evaluatedAt,boundary:"EXISTING_REQUIREMENT_EVALUATOR_OVER_DATABASE_READBACK; NOT_AUTHENTICATED_HTTP_HANDLER_OR_MATERIALIZATION",retainedObservationCount:observations.length,results},null,2)+"\n")
console.log(JSON.stringify({items:results.length,fresh:results.filter(x=>x.result.evidence_state==="FRESH").length,blocked:results.filter(x=>x.result.evidence_state!=="FRESH").map(x=>({symbol:x.symbol,code:x.result.requirement_code,reason:x.result.reason_code}))}))
if(results.some(x=>x.result.evidence_state!=="FRESH"))Deno.exit(1)
