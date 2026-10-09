import type {RequirementReview,ReviewedSourceRecord} from "../_shared/v14-reviewed-evidence.ts"
const stable=(v:unknown):string=>Array.isArray(v)?"["+v.map(stable).join(",")+"]":v!==null&&typeof v==="object"?"{"+Object.entries(v as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>JSON.stringify(k)+":"+stable(x)).join(",")+"}":JSON.stringify(v)??"null"
const sign=async(r:RequirementReview)=>{
 const payload=Object.fromEntries(Object.entries(r).filter(([key])=>key!=="id"&&key!=="review_hash"))
 r={...r,review_hash:Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(stable(payload))))).map(x=>x.toString(16).padStart(2,"0")).join("")};return r
}
Deno.test("canonical ownership requirement admits qualified reviews and keeps wrong series/basis, raw charts and governance blocked",async()=>{
 const serve=Deno.serve
 try{
  Deno.serve=((_fn:(request:Request)=>Promise<Response>)=>({})) as typeof Deno.serve
  const {requirementItem}=await import("./index.ts")
  const now="2026-10-09T03:00:00Z",retrieved="2026-10-09T02:00:00Z",security="33333333-3333-4333-8333-333333333333",owner="11111111-1111-4111-8111-111111111111",portfolio="22222222-2222-4222-8222-222222222222"
  const periods=["2025-09-30","2025-12-31","2026-03-31","2026-06-30"]
  const sources:ReviewedSourceRecord[]=periods.map((p,i)=>({id:"source"+i,source_code:"TRENDLYNE_MCP",retrieved_at:retrieved,published_at:null,payload_hash:"a".repeat(64),raw_payload:{security_id:security,body:`Institutional 12.50% of total equity at ${p}`}}))
  const reviews=await Promise.all(periods.map((p,i)=>sign({id:"review"+i,portfolio_id:portfolio,security_id:security,requirement_code:"INSTITUTIONAL_OWNERSHIP_TREND_4Q",review_kind:"OWNER_OWNERSHIP_REVIEW",decision:"ACCEPTED",source_record_id:sources[i]!.id,research_document_id:null,provider_document_id:null,source_payload_hash:"a".repeat(64),supporting_quote:`Institutional 12.50% of total equity at ${p}`,period_start:null,period_end:p,period_type:"QUARTER",unit:"PERCENT",currency:null,consolidation_scope:null,published_at:null,retrieved_at:retrieved,fresh_through:"2026-10-30T00:00:00Z",review_version:"V1_4_REQUIREMENT_REVIEW_V2",reviewed_by:owner,reviewed_at:"2026-10-09T02:30:00Z",review_hash:"",supersedes_review_id:null,metadata:{numeric_value:"12.50",ownership_series:"INSTITUTIONAL",ownership_basis:"TOTAL_EQUITY",ownership_series_anchor:"Institutional",ownership_basis_anchor:"total equity",period_anchor:p}})))
  const input:Parameters<typeof requirementItem>[0]={code:"INSTITUTIONAL_OWNERSHIP_TREND_4Q",family:"OWNERSHIP_4Q",minimum:4,freshness:"150_DAYS",benchmarks:[],portfolioId:portfolio,portfolioOwnerId:owner,securityId:security,observations:[],definitions:[],records:[],reviews,reviewSources:sources,researchDocuments:[],documentSources:[],benchmarkByCode:new Map(),historyProofs:new Map(),evaluationAsOfMs:Date.parse(now),sourceCutoffAtMs:Date.parse(now)}
  const ready=await requirementItem(input)
  if(ready.evidence_state!=="FRESH"||ready.validation_state!=="VALIDATED_REVIEW_LEDGER")throw new Error("Qualified ownership review path unreachable")
  const short=await requirementItem({...input,minimum:1,reviews:reviews.slice(0,3)});if(short.evidence_state!=="INSUFFICIENT")throw new Error("Four-quarter ownership minimum weakened")
  const mixed=await requirementItem({...input,reviewSources:sources.map((s,i)=>i===3?{...s,source_code:"NSE_OFFICIAL"}:s)});if(mixed.reason_code!=="OWNERSHIP_SOURCE_AUTHORITY_MIXED")throw new Error("Mixed-provider ownership series admitted")
  for(const patch of [{ownership_series:"FII"},{ownership_basis:"VOTING_RIGHTS"}]){
   const wrong=await Promise.all(reviews.map(r=>sign({...r,metadata:{...r.metadata,...patch}})))
   const result=await requirementItem({...input,reviews:wrong})
   if(result.evidence_state!=="REVIEW_REQUIRED"||result.reason_code!=="OWNERSHIP_SELECTED_SERIES_OR_BASIS_NOT_PROVEN")throw new Error("Wrong ownership selection admitted")
  }
  const raw=await requirementItem({...input,reviews:[]});if(raw.evidence_state!=="REVIEW_REQUIRED")throw new Error("Unreviewed ownership became ready")
  const governance=await requirementItem({...input,code:"OWNERSHIP_GOVERNANCE"});if(governance.evidence_state!=="REVIEW_REQUIRED"||governance.reason_code!=="OWNERSHIP_GOVERNANCE_DOCUMENT_REVIEW_REQUIRED")throw new Error("Ownership percentages admitted as governance evidence")
  for(const [code,metric] of [["GROSS_NPA","GROSS_NPA_PERCENT"],["NET_NPA","NET_NPA_PERCENT"]]){
   const observation={id:"npa-observation",security_id:security,metric_code:metric!,numeric_value:"1.17",text_value:null,boolean_value:null,date_value:null,unit:"PERCENT",currency:null,consolidation_scope:"STANDALONE",period_start:"2026-04-01",period_end:"2026-06-30",period_type:"QUARTER",retrieved_at:retrieved,fresh_until:"2026-10-30T00:00:00Z",published_at:null,evidence_status:"AVAILABLE",source_code:"TRENDLYNE_MCP",source_record_id:"original-source"}
   const numeric={...input,code:code!,family:"NUMERIC_SERIES" as const,minimum:1,reviews:[],observations:[observation],definitions:[{code:metric!,canonical_unit:"PERCENT",value_kind:"NUMERIC",is_active:true,freshness_seconds:7776000,definition:{selection:"REVIEWED",period_type:"QUARTER",provider:"TRENDLYNE_MCP"}}]}
   if((await requirementItem(numeric)).evidence_state!=="FRESH")throw new Error("Approved NPA requirement did not find its canonical percentage primitive")
   if((await requirementItem({...numeric,observations:[{...observation,unit:"RATIO"}]})).evidence_state==="FRESH")throw new Error("NPA alias weakened percentage-unit proof")
   if((await requirementItem({...numeric,observations:[{...observation,consolidation_scope:"UNKNOWN"}]})).evidence_state==="FRESH")throw new Error("NPA alias weakened reporting-scope proof")
  }
 }finally{Deno.serve=serve}
})
