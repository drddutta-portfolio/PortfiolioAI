/** Provider-free canonical adapter replay; not an authenticated handler invocation. */
import {validateReviewedRequirementEvidence,type RequirementReview,type ReviewedSourceRecord} from "../_shared/v14-reviewed-evidence.ts"
import type {MetricDefinition} from "../_shared/p7-ic-input-validation.ts"
import {BANK_DELEGATION_POLICY as policy} from "../_shared/v14-bank-approved-delegation.ts"
const candidates=JSON.parse(await Deno.readTextFile(Deno.args[0]!)) as {sources:ReviewedSourceRecord[];reviews:RequirementReview[]}
const definitions=JSON.parse(await Deno.readTextFile(Deno.args[1]!)) as MetricDefinition[]
const evaluatedAt=new Date().toISOString(),results=[]
for(const securityId of Object.keys(policy.securities))for(const requirementCode of ["GROSS_NPA","NET_NPA"]){
 const result=await validateReviewedRequirementEvidence({portfolioId:policy.portfolioId,portfolioOwnerId:policy.ownerId,securityId,requirementCode,family:"NUMERIC_SERIES",metricCodes:[requirementCode+"_PERCENT"],minimum:1,reviews:candidates.reviews,sources:candidates.sources,documents:[],documentSources:[],definitions,evaluationAsOfMs:Date.parse(evaluatedAt),sourceCutoffAtMs:Date.parse(evaluatedAt),freshnessPolicy:"90_DAYS"})
 results.push({symbol:policy.securities[securityId as keyof typeof policy.securities],securityId,requirementCode,result})
}
await Deno.writeTextFile(Deno.args[2]!,JSON.stringify({version:"BANK_DELEGATED_NPA_ADAPTER_REPLAY_V1",evaluatedAt,boundary:"ACTUAL_SOURCE_FACTS_AND_REVIEW_CANDIDATES; EXISTING_CANONICAL_ADAPTER; NOT_OWNER_AUTHENTICATED_HANDLER",results},null,2)+"\n")
console.log(JSON.stringify({items:results.length,fresh:results.filter(x=>x.result?.state==="FRESH").length,blocked:results.filter(x=>x.result?.state!=="FRESH").map(x=>({symbol:x.symbol,requirement:x.requirementCode,reason:x.result?.reason}))}))
if(results.some(x=>x.result?.state!=="FRESH"))Deno.exit(1)
