import {renewTwelveStoredHistory,twelveRenewalCutoffQualified} from "../_shared/v14-bank-twelve-history-execution.ts"
import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {createRemoteJWKSet,jwtVerify} from "https://esm.sh/jose@6.1.0"
import {BANK_TWELVE_POLICY as policy} from "../_shared/v14-bank-twelve-delegation.ts"
import {BANK_TWELVE_CAPITAL_MANIFEST as pin,BANK_TWELVE_CAPITAL_ACTION as ACTION,prepareTwelveCapitalReview,twelveCapitalClaimsQualified,twelveCapitalReadUrl,bankValueHash} from "../_shared/v14-bank-twelve-capital-review.ts"
import {validateReviewedRequirementEvidence,type RequirementReview,type ReviewedSourceRecord} from "../_shared/v14-reviewed-evidence.ts"
import type {MetricDefinition} from "../_shared/p7-ic-input-validation.ts"
const name="v14-bank-twelve-capital-admission",aud=`https://${policy.developmentProject}.supabase.co/functions/v1/${name}`
const jwks=createRemoteJWKSet(new URL("https://token.actions.githubusercontent.com/.well-known/jwks"))
const reply=(status:number,code:string,extra:Record<string,unknown>={})=>new Response(JSON.stringify({code,...extra}),{status,headers:{"content-type":"application/json","cache-control":"no-store"}})
const hashBytes=async(b:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new Uint8Array(b).buffer))).map(x=>x.toString(16).padStart(2,"0")).join("")
Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,"METHOD_NOT_ALLOWED")
 const url=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
 if(url!==`https://${policy.developmentProject}.supabase.co`||!key)return reply(409,"DEVELOPMENT_ONLY")
 let claims:Record<string,unknown>
 try{
  const token=(req.headers.get("authorization")??"").replace(/^Bearer\s+/i,"")
  const verified=await jwtVerify(token,jwks,{issuer:"https://token.actions.githubusercontent.com",audience:aud,algorithms:["RS256"],maxTokenAge:"5m"})
  claims=verified.payload
  if(!twelveCapitalClaimsQualified(claims))return reply(403,"TWELVE_BANK_EXECUTOR_SCOPE_INVALID")
 }catch{return reply(401,"SIGNED_TWELVE_BANK_EXECUTOR_REQUIRED")}
 const body=await req.json().catch(()=>null)
 if(!body||body.action!==ACTION||body.approvalHash!==policy.directiveSha256||typeof body.readUrl!=="string"
  ||!twelveCapitalReadUrl(body.readUrl))return reply(400,"EXACT_PINNED_SOURCE_AND_APPROVAL_REQUIRED")
 const db=createClient(url,key,{auth:{persistSession:false}}),holder=crypto.randomUUID(),operation="V14_TWELVE_FEDERAL_CAPITAL_ADMISSION"
 let leased=false
 const run=async()=>{
  const owner=await db.from("portfolios").select("user_id").eq("id",policy.portfolioId).single()
  if(owner.error||owner.data?.user_id!==policy.ownerId)return reply(403,"APPROVED_PORTFOLIO_OWNER_NOT_VERIFIED")
  const lease=await db.rpc("acquire_data_ingestion_lease_v1",{p_source_code:"OWNER_REVIEWED_CLASSIFICATION",p_operation:operation,p_lease_holder:holder,p_lease_seconds:120})
  if(lease.error||!Array.isArray(lease.data)||lease.data[0]?.acquired!==true)return reply(409,"CAPITAL_ADMISSION_LEASE_BUSY")
  leased=true
  const res=await fetch(body.readUrl,{redirect:"error",signal:AbortSignal.timeout(20000)})
  if(!res.ok)return reply(503,"PINNED_R2_READ_FAILED")
  const bytes=new Uint8Array(await res.arrayBuffer())
  if(bytes.length!==pin.original_bytes||new TextDecoder().decode(bytes.slice(0,5))!=="%PDF-"||await hashBytes(bytes)!==pin.original_sha256)return reply(409,"PINNED_ORIGINAL_BYTES_MISMATCH")
  const existing=await db.from("data_source_records").select("id,source_code,record_kind,published_at,retrieved_at,payload_hash,raw_payload").eq("id",pin.source_id).maybeSingle()
  if(existing.error)return reply(503,"CAPITAL_SOURCE_LOOKUP_FAILED")
  const verifiedAt=existing.data?.raw_payload?.original_bytes_verified_at??new Date().toISOString()
  const prepared=await prepareTwelveCapitalReview(verifiedAt)
  if(existing.data&&(existing.data.payload_hash!==prepared.source.payload_hash||await bankValueHash(existing.data.raw_payload)!==prepared.source.payload_hash))return reply(409,"CAPITAL_SOURCE_IDENTITY_CONFLICT")
  const definitions=await db.from("fundamental_metric_definitions").select("code,canonical_unit,value_kind,is_active,freshness_seconds,definition").in("code",prepared.reviews.map(r=>r.requirement_code))
  if(definitions.error)return reply(503,"CAPITAL_DEFINITIONS_UNAVAILABLE")
  const results=[]
  const now=Date.now()
  for(const review of prepared.reviews){
   const result=await validateReviewedRequirementEvidence({portfolioId:policy.portfolioId,portfolioOwnerId:policy.ownerId,securityId:pin.security_id,
    requirementCode:review.requirement_code,family:"NUMERIC_SERIES",metricCodes:[review.requirement_code],minimum:1,reviews:[review],
    sources:[prepared.source],documents:[],documentSources:[],definitions:definitions.data as MetricDefinition[],evaluationAsOfMs:now,sourceCutoffAtMs:now,freshnessPolicy:null})
   if(result?.state!=="FRESH")return reply(409,"CANONICAL_CAPITAL_QUALIFICATION_FAILED",{requirement:review.requirement_code,reason:result?.reason??"NO_RESULT"})
   results.push({requirementCode:review.requirement_code,state:result.state,reason:result.reason})
  }
  if(!existing.data){
   const inserted=await db.from("data_source_records").insert({...prepared.source,source_url:pin.original_url,
    external_record_id:policy.id+":"+pin.original_sha256,terms_snapshot:{mode:"OWNER_DELEGATED_SOURCE_BOUND_NUMERIC_REVIEW",directive_sha256:policy.directiveSha256,
     executor:"CODEX_GITHUB_ACTIONS_OIDC",execution_sha:claims.sha,execution_run_id:claims.run_id,canonical_materialization:false}})
   if(inserted.error)return reply(409,"CAPITAL_SOURCE_INSERT_REJECTED",{postgresCode:inserted.error.code})
  }
  let newAcceptedReviews=0
  for(const r of prepared.reviews){
   const previous=await db.from("research_evidence_requirement_reviews").select("id,review_hash,source_record_id,metadata").eq("id",r.id).maybeSingle()
   if(previous.error)return reply(503,"CAPITAL_REVIEW_LOOKUP_FAILED")
   if(previous.data&&previous.data.review_hash!==r.review_hash)return reply(409,"CAPITAL_REVIEW_IDENTITY_CONFLICT")
   if(!previous.data){const inserted=await db.from("research_evidence_requirement_reviews").insert(r);if(inserted.error)return reply(409,"CAPITAL_REVIEW_INSERT_REJECTED",{postgresCode:inserted.error.code});newAcceptedReviews++}
  }
  const sourceRead=await db.from("data_source_records").select("id,source_code,record_kind,published_at,retrieved_at,payload_hash,raw_payload").eq("id",pin.source_id).single()
  const reviewRead=await db.from("research_evidence_requirement_reviews").select("*").in("id",prepared.reviews.map(r=>r.id))
  if(sourceRead.error||reviewRead.error||reviewRead.data.length!==2)return reply(503,"CAPITAL_ADMISSION_READBACK_FAILED")
  for(const r of prepared.reviews){
   const read=await validateReviewedRequirementEvidence({portfolioId:policy.portfolioId,portfolioOwnerId:policy.ownerId,securityId:pin.security_id,
    requirementCode:r.requirement_code,family:"NUMERIC_SERIES",metricCodes:[r.requirement_code],minimum:1,reviews:reviewRead.data as RequirementReview[],
    sources:[sourceRead.data as ReviewedSourceRecord],documents:[],documentSources:[],definitions:definitions.data as MetricDefinition[],evaluationAsOfMs:Date.now(),sourceCutoffAtMs:Date.now(),freshnessPolicy:null})
   if(read?.state!=="FRESH")return reply(409,"PERSISTED_REVIEW_QUALIFICATION_FAILED",{requirement:r.requirement_code,reason:read?.reason})
  }
  if(body.materialize===true){
   const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23"}).formatToParts(new Date())
   const part=(name:Intl.DateTimeFormatPartTypes)=>parts.find(p=>p.type===name)?.value??""
   const session=`${part("year")}-${part("month")}-${part("day")}`
   if(Number(part("hour"))<19)return reply(409,"MATERIALIZATION_AWAITS_COMPLETED_SCHEDULED_SESSION",{newAcceptedReviews})
   const calendar=await db.from("data_source_records").select("id,raw_payload,payload_hash").eq("source_code","NSE_OFFICIAL")
    .eq("record_kind","V1_4_NSE_SESSION_CALENDAR_DECISION").eq("raw_payload->>session_date",session).order("retrieved_at",{ascending:false}).limit(2)
   if(calendar.error||!calendar.data?.length||calendar.data[0].raw_payload.decision!=="OPEN"
    ||calendar.data.length>1&&calendar.data[0].payload_hash!==calendar.data[1].payload_hash)return reply(409,"MATERIALIZATION_VERIFIED_OPEN_SESSION_REQUIRED",{newAcceptedReviews})
   const stock=await db.from("market_price_history").select("period_start").eq("security_id",pin.security_id).eq("provider_code","ANGEL_ONE")
    .gte("period_start",session+"T00:00:00+05:30").lte("period_start",session+"T23:59:59+05:30").limit(1)
   const benchmark=await db.from("market_benchmark_price_history").select("period_start").eq("benchmark_code","NIFTY_BANK")
    .gte("period_start",session+"T00:00:00+05:30").lte("period_start",session+"T23:59:59+05:30").limit(1)
   if(stock.error||benchmark.error||!stock.data?.length||!benchmark.data?.length)return reply(409,"MATERIALIZATION_AWAITS_FRESH_STOCK_AND_SHARED_BENCHMARK",{newAcceptedReviews})
   const historyRenewal=await renewTwelveStoredHistory(db,String(body.corporateActionTailReadUrl??""))
   const action="P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS",scope="SECURITY_IDS:"+pin.security_id
   const external=policy.id+":MATERIALIZE:"+session+":"+pin.security_id+":HISTORY_REVISION:"+historyRenewal.revision
   const lookup=await db.from("data_source_records").select("id,raw_payload").eq("source_code","OWNER_REVIEWED_CLASSIFICATION").eq("record_kind","P4_EXECUTION_GRANT").eq("external_record_id",external).maybeSingle()
   if(lookup.error)return reply(503,"TWELVE_BANK_MATERIALIZATION_GRANT_LOOKUP_FAILED")
   let grant=lookup.data
   if(!grant){
    const id=crypto.randomUUID(),at=new Date().toISOString(),raw={action,security_id:scope,portfolio_id:policy.portfolioId,
     environment:"PortfolioAI Dev",project_ref:policy.developmentProject,expires_at:new Date(Date.now()+10*60000).toISOString(),
     authorization:policy.authorization,authorization_reference:policy.directiveSha256,authorizing_owner_id:policy.ownerId,
     executor:"CODEX_GITHUB_ACTIONS_OIDC",selection_run_id:crypto.randomUUID(),evaluation_as_of:at,source_cutoff_at:at,
     approved_security_ids:[pin.security_id],qualified_review_ids:prepared.reviews.map(r=>r.id),calendar_decision_id:calendar.data[0].id,history_proof_revision:historyRenewal.revision,qualified_history_proof_ids:historyRenewal.proofIds}
    const inserted=await db.from("data_source_records").insert({id,source_code:"OWNER_REVIEWED_CLASSIFICATION",record_kind:"P4_EXECUTION_GRANT",
     external_record_id:external,retrieved_at:at,payload_hash:await bankValueHash(raw),raw_payload:raw,
     terms_snapshot:{mode:"EXPLICIT_OWNER_DELEGATED_TWELVE_BANK_CANONICAL_EXECUTION",directive_sha256:policy.directiveSha256,scope_excludes_kvb:true}}).select("id,raw_payload").single()
    if(inserted.error)return reply(409,"TWELVE_BANK_MATERIALIZATION_GRANT_INSERT_REJECTED",{postgresCode:inserted.error.code})
    grant=inserted.data
   }
   if(grant.raw_payload.authorization_reference!==policy.directiveSha256||grant.raw_payload.security_id!==scope||grant.raw_payload.action!==action||grant.raw_payload.history_proof_revision!==historyRenewal.revision)
    return reply(409,"TWELVE_BANK_MATERIALIZATION_GRANT_SCOPE_CONFLICT")
   if(!twelveRenewalCutoffQualified(historyRenewal.proofRetrievedAt,String(grant.raw_payload.source_cutoff_at)))return reply(409,"MATERIALIZATION_CUTOFF_PRECEDES_QUALIFIED_HISTORY")
   const consumed=await db.from("data_source_records").select("id").eq("source_code","OWNER_REVIEWED_CLASSIFICATION").eq("record_kind","P4_EXECUTION_GRANT_CONSUMED").eq("external_record_id",grant.id).limit(1)
   if(consumed.error)return reply(503,"TWELVE_BANK_MATERIALIZATION_CONSUMPTION_LOOKUP_FAILED")
   let materialization:Record<string,unknown>={reusedAlreadyConsumedGrant:consumed.data.length>0}
   if(!consumed.data.length){
    if(Date.parse(grant.raw_payload.expires_at)<=Date.now())return reply(409,"TWELVE_BANK_MATERIALIZATION_GRANT_EXPIRED")
    const result=await fetch(url+"/functions/v1/p7-ic2-materialize-readiness",{method:"POST",headers:{authorization:"Bearer "+key,apikey:key,"content-type":"application/json"},
     body:JSON.stringify({action,portfolioId:policy.portfolioId,securityIds:[pin.security_id],targetingMode:"P4_GRANT_SCOPED_SECURITY_IDS_V1",
      grantId:grant.id,selectionRunId:grant.raw_payload.selection_run_id,evaluationAsOf:grant.raw_payload.evaluation_as_of,sourceCutoffAt:grant.raw_payload.source_cutoff_at}),signal:AbortSignal.timeout(60000)})
    materialization=await result.json()
    if(!result.ok)return reply(409,"TWELVE_BANK_CANONICAL_MATERIALIZATION_FAILED",{backendCode:materialization.code??materialization.error??"UNREPORTED"})
    if(materialization.providerCalls!==0||materialization.processed!==1)return reply(409,"TWELVE_BANK_CANONICAL_RESPONSE_SCOPE_INVALID")
   }
   const selected=await db.from("current_research_evidence_snapshot_v1").select("id,snapshot_status").eq("portfolio_id",policy.portfolioId).eq("security_id",pin.security_id).single()
   if(selected.error)return reply(503,"TWELVE_BANK_SELECTED_SNAPSHOT_READBACK_FAILED")
   const items=await db.from("research_evidence_snapshot_items").select("requirement_code,evidence_state,reason_code,required").eq("snapshot_id",selected.data.id)
   if(items.error||prepared.reviews.some(r=>!items.data.some(i=>i.requirement_code===r.requirement_code&&i.evidence_state==="FRESH")))
    return reply(409,"TWELVE_BANK_CAPITAL_NOT_PERSISTED_FRESH",{snapshotId:selected.data.id})
   const requiredHistory=["PRICE_MOMENTUM_12M","PRICE_MOMENTUM_6M","RELATIVE_STRENGTH_12M","MAX_DRAWDOWN_1Y","VOLATILITY_RELATIVE"]
   if(requiredHistory.some(code=>!items.data.some(i=>i.requirement_code===code&&i.evidence_state==="FRESH")))return reply(409,"TWELVE_BANK_HISTORY_NOT_PERSISTED_FRESH",{snapshotId:selected.data.id,items:items.data,historyRenewal})
   return reply(200,"PINNED_CAPITAL_MATERIALIZED_AND_SELECTED_READ_BACK",{symbol:pin.symbol,securityId:pin.security_id,snapshotId:selected.data.id,
    snapshotStatus:selected.data.snapshot_status,items:items.data,mandatoryBlockers:items.data.filter(i=>i.required&&i.evidence_state!=="FRESH").length,
    reviewIds:prepared.reviews.map(r=>r.id),newAcceptedReviews,materialization,historyRenewal,providerCalls:0,kvbWrites:0})
  }
  return reply(200,"PINNED_CAPITAL_REVIEWS_ACCEPTED_AND_READ_BACK",{securityId:pin.security_id,symbol:pin.symbol,sourceRecordId:pin.source_id,
   reviewIds:prepared.reviews.map(r=>r.id),newAcceptedReviews,results,publicationPrecision:"UNKNOWN_DATE",publishedAt:null,
   historicalPitEligible:false,providerCalls:0,canonicalMaterializations:0,persistedSelectedSnapshotChanged:false})
 }
 let response:Response
 try{response=await run()}catch(error){const code=error instanceof Error?error.message:"CAPITAL_ADMISSION_FAILED";response=reply(503,/^[A-Z0-9_:]+$/.test(code)?code:"CAPITAL_ADMISSION_FAILED")}
 finally{
  if(leased){const released=await db.rpc("release_data_ingestion_lease_v1",{p_source_code:"OWNER_REVIEWED_CLASSIFICATION",p_operation:operation,p_lease_holder:holder,p_cooldown_seconds:0});if(released.error||released.data!==true)response=reply(503,"CAPITAL_ADMISSION_LEASE_RELEASE_FAILED")}
 }
 return response
})
