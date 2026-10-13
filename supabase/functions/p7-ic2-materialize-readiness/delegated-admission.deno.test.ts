import {BANK_DELEGATION_POLICY as policy} from "../_shared/v14-bank-approved-delegation.ts"
import {validateReviewedRequirementEvidence,reconcileCanonicalAndReviewed,type RequirementReview,type ReviewedSourceRecord} from "../_shared/v14-reviewed-evidence.ts"

const stable=(v:unknown):string=>Array.isArray(v)?"["+v.map(stable).join(",")+"]":v!==null&&typeof v==="object"?"{"+Object.entries(v as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>JSON.stringify(k)+":"+stable(x)).join(",")+"}":JSON.stringify(v)??"null"
const sign=async(r:RequirementReview)=>({...r,review_hash:Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(stable(Object.fromEntries(Object.entries(r).filter(([k])=>k!=="id"&&k!=="review_hash"))))))).map(x=>x.toString(16).padStart(2,"0")).join("")})

Deno.test("bank delegated official filing admission keeps attribution and rejects scope, policy, units, dates and source substitutions",async()=>{
 const security=Object.keys(policy.securities)[0]!,symbol=policy.securities[security as keyof typeof policy.securities]
 const retrieved="2026-10-09T05:00:00Z",now="2026-10-09T05:10:00Z"
 const quote="NSE Symbol: "+symbol+" | Standalone | % of gross NPAs: 2.10 | 01-04-2026 | 30-06-2026"
 const source:ReviewedSourceRecord={id:"fixture-source",source_code:"COMPANY_EXCHANGE_FILING",retrieved_at:retrieved,published_at:null,payload_hash:"a".repeat(64),raw_payload:{security_id:security,symbol,policy_id:policy.id,original_url:"https://nsearchives.nseindia.com/corporate/ixbrl/fixture.html",original_sha256:"b".repeat(64),excerpt:quote}}
 const review:RequirementReview={id:"fixture-review",portfolio_id:policy.portfolioId,security_id:security,requirement_code:"GROSS_NPA",review_kind:"DELEGATED_NUMERIC_REVIEW",decision:"ACCEPTED",source_record_id:source.id,research_document_id:null,provider_document_id:null,source_payload_hash:source.payload_hash,supporting_quote:quote,period_start:"2026-04-01",period_end:"2026-06-30",period_type:"QUARTER",unit:"PERCENT",currency:null,consolidation_scope:"STANDALONE",published_at:null,retrieved_at:retrieved,fresh_through:"2026-11-01T00:00:00Z",review_version:"V1_4_REQUIREMENT_REVIEW_V2",reviewed_by:null,reviewed_at:now,review_hash:"",supersedes_review_id:null,metadata:{metric_code:"GROSS_NPA_PERCENT",numeric_value:"2.10",review_authorization:{policy_id:policy.id,authorizing_owner_id:policy.ownerId,executor:policy.executor,authorization:policy.authorization,recorded_at:policy.recordedAt},source_binding:{kind:"TABLE_CELL",fragment:quote,metric_label:"% of gross NPAs",period_label:"30-06-2026",exact_value:"2.10",entity_id:symbol,period_start:"2026-04-01",period_end:"2026-06-30",period_type:"QUARTER",period_start_anchor:"01-04-2026",period_end_anchor:"30-06-2026",scale:"1",conversion:"IDENTITY"}}}
 const input={portfolioId:policy.portfolioId,portfolioOwnerId:policy.ownerId,securityId:security,requirementCode:"GROSS_NPA",family:"NUMERIC_SERIES" as const,metricCodes:["GROSS_NPA_PERCENT"],minimum:1,reviews:[await sign(review)],sources:[source],documents:[],documentSources:[],definitions:[{code:"GROSS_NPA_PERCENT",canonical_unit:"PERCENT",value_kind:"NUMERIC",is_active:true,freshness_seconds:7776000,definition:{selection:"REVIEWED",period_type:"QUARTER",provider:"TRENDLYNE_MCP"}}],evaluationAsOfMs:Date.parse(now),sourceCutoffAtMs:Date.parse(now),freshnessPolicy:"90_DAYS"}
 const ok=await validateReviewedRequirementEvidence(input);if(ok?.state!=="FRESH"||ok.sourceCode!=="COMPANY_EXCHANGE_FILING")throw Error("Qualified delegated fallback not admitted with actual source identity")
 const reconcile=(rows:typeof ok.observations)=>reconcileCanonicalAndReviewed({canonicalRows:rows,reviewed:ok,definitions:input.definitions,minimum:1,evaluationAsOfMs:input.evaluationAsOfMs,sourceCutoffAtMs:input.sourceCutoffAtMs,family:"NUMERIC_SERIES"})
 if(reconcile([]).authority!=="REVIEW")throw Error("Fallback blocked by original provider definition during reconciliation")
 const primary={...ok.observations[0]!,source_code:"TRENDLYNE_MCP",numeric_value:"2.100"}
 if(reconcile([primary]).authority!=="CANONICAL")throw Error("Fresh primary provider displaced or equivalent decimals contradicted")
 if(reconcile([{...primary,consolidation_scope:"UNKNOWN"}]).authority!=="REVIEW")throw Error("Qualified fallback cannot replace unqualified retained metadata")
 if(reconcile([{...primary,numeric_value:"2.20"}]).validation.state!=="CONFLICTING")throw Error("Comparable numeric conflict ignored")
 if(reconcile([{...primary,evidence_status:"CONFLICTING"}]).validation.state!=="CONFLICTING")throw Error("Prior canonical conflict erased")
 for(const patch of [{unit:"RATIO"},{period_type:"YEAR"},{consolidation_scope:"UNKNOWN"},{reviewed_by:policy.ownerId},{reviewed_at:"2026-10-08T05:00:00Z"},{metadata:{...review.metadata,review_authorization:{}}}]){
  const result=await validateReviewedRequirementEvidence({...input,reviews:[await sign({...review,...patch})]});if(result?.state==="FRESH")throw Error("Invalid delegated review admitted: "+JSON.stringify(patch))
 }
 if((await validateReviewedRequirementEvidence({...input,portfolioOwnerId:"another-owner"}))?.state==="FRESH")throw Error("Wrong authorizing owner admitted")
 for(const patch of [{source_code:"UNAPPROVED_PROVIDER"},{raw_payload:{...source.raw_payload,original_url:"https://example.org/fake"}},{raw_payload:{...source.raw_payload,policy_id:"unapproved"}}]){
  if((await validateReviewedRequirementEvidence({...input,sources:[{...source,...patch}]}))?.state==="FRESH")throw Error("Source substitution admitted")
 }
 const other="33333333-3333-4333-8333-333333333333"
 if((await validateReviewedRequirementEvidence({...input,securityId:other,reviews:[await sign({...review,security_id:other})]}))?.state==="FRESH")throw Error("Other security admitted")
})
