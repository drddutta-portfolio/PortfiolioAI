import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {createRemoteJWKSet,jwtVerify} from "https://esm.sh/jose@6.1.0"
import {BANK_TWELVE_POLICY as directive} from "../_shared/v14-bank-twelve-delegation.ts"
import {BANK_DELEGATION_POLICY as policy} from "../_shared/v14-bank-approved-delegation.ts"
import {BANK_TWELVE_GROWTH_MANIFEST as manifest,BANK_TWELVE_GROWTH_ACTION as ACTION,prepareTwelveGrowthReviews,twelveGrowthClaimsQualified,twelveGrowthReadUrl} from "../_shared/v14-bank-twelve-growth-review.ts"
import {bankValueHash} from "../_shared/v14-bank-twelve-capital-review.ts"
import {validateReviewedRequirementEvidence,type RequirementReview,type ReviewedSourceRecord} from "../_shared/v14-reviewed-evidence.ts"
import type {MetricDefinition} from "../_shared/p7-ic-input-validation.ts"
const name="v14-bank-twelve-growth-admission",aud=`https://${directive.developmentProject}.supabase.co/functions/v1/${name}`
const jwks=createRemoteJWKSet(new URL("https://token.actions.githubusercontent.com/.well-known/jwks"))
const reply=(status:number,code:string,extra:Record<string,unknown>={})=>new Response(JSON.stringify({code,...extra}),{status,headers:{"content-type":"application/json","cache-control":"no-store"}})
const hashBytes=async(b:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new Uint8Array(b).buffer))).map(x=>x.toString(16).padStart(2,"0")).join("")
Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,"METHOD_NOT_ALLOWED")
 const url=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
 if(url!==`https://${directive.developmentProject}.supabase.co`||!key)return reply(409,"DEVELOPMENT_ONLY")
 let claims:Record<string,unknown>
 try{const token=(req.headers.get("authorization")??"").replace(/^Bearer\s+/i,"")
  const verified=await jwtVerify(token,jwks,{issuer:"https://token.actions.githubusercontent.com",audience:aud,algorithms:["RS256"],maxTokenAge:"5m"});claims=verified.payload
  if(!twelveGrowthClaimsQualified(claims))return reply(403,"TWELVE_BANK_EXECUTOR_SCOPE_INVALID")
 }catch{return reply(401,"SIGNED_TWELVE_BANK_EXECUTOR_REQUIRED")}
 const body=await req.json().catch(()=>null)
 if(!body||body.action!==ACTION||body.approvalHash!==directive.directiveSha256||!body.readUrls||typeof body.readUrls!=="object"
  ||Object.keys(body.readUrls).length!==manifest.sources.length||manifest.sources.some(s=>typeof body.readUrls[s.symbol]!=="string"||!twelveGrowthReadUrl(s.symbol,body.readUrls[s.symbol])))return reply(400,"EXACT_PINNED_SOURCES_AND_APPROVAL_REQUIRED")
 const db=createClient(url,key,{auth:{persistSession:false}}),holder=crypto.randomUUID(),operation="V14_TWELVE_BOB_BANDHAN_GROWTH_ADMISSION"
 let leased=false
 const run=async()=>{
  const owner=await db.from("portfolios").select("user_id").eq("id",policy.portfolioId).single()
  if(owner.error||owner.data?.user_id!==policy.ownerId)return reply(403,"APPROVED_PORTFOLIO_OWNER_NOT_VERIFIED")
  const lease=await db.rpc("acquire_data_ingestion_lease_v1",{p_source_code:"OWNER_REVIEWED_CLASSIFICATION",p_operation:operation,p_lease_holder:holder,p_lease_seconds:120})
  if(lease.error||!Array.isArray(lease.data)||lease.data[0]?.acquired!==true)return reply(409,"GROWTH_ADMISSION_LEASE_BUSY");leased=true
  const definitionRead=await db.from("fundamental_metric_definitions").select("code,canonical_unit,value_kind,is_active,freshness_seconds,definition").in("code",["ADVANCES_GROWTH_YOY","DEPOSITS_GROWTH_YOY"])
  if(definitionRead.error)return reply(503,"GROWTH_DEFINITIONS_UNAVAILABLE")
  const definitions=definitionRead.data as MetricDefinition[],plans=[]
  // Verify every original and every canonical result before any insert.
  for(const pin of manifest.sources){
   const response=await fetch(body.readUrls[pin.symbol],{redirect:"error",signal:AbortSignal.timeout(20000)})
   if(!response.ok)return reply(503,"PINNED_R2_READ_FAILED",{symbol:pin.symbol})
   const bytes=new Uint8Array(await response.arrayBuffer())
   if(bytes.length!==pin.original_bytes||new TextDecoder().decode(bytes.slice(0,5))!=="%PDF-"||await hashBytes(bytes)!==pin.original_sha256)return reply(409,"PINNED_ORIGINAL_BYTES_MISMATCH",{symbol:pin.symbol})
   const existing=await db.from("data_source_records").select("id,source_code,record_kind,published_at,retrieved_at,payload_hash,raw_payload").eq("id",pin.source_id).maybeSingle()
   if(existing.error)return reply(503,"GROWTH_SOURCE_LOOKUP_FAILED")
   const verifiedAt=existing.data?.raw_payload?.original_bytes_verified_at??new Date().toISOString()
   const prepared=await prepareTwelveGrowthReviews(pin.symbol,verifiedAt)
   if(existing.data&&(existing.data.payload_hash!==prepared.source.payload_hash||await bankValueHash(existing.data.raw_payload)!==prepared.source.payload_hash))return reply(409,"GROWTH_SOURCE_IDENTITY_CONFLICT")
   for(const r of prepared.reviews){const now=Date.now();const out=await validateReviewedRequirementEvidence({portfolioId:policy.portfolioId,portfolioOwnerId:policy.ownerId,
    securityId:pin.security_id,requirementCode:r.requirement_code,family:"NUMERIC_SERIES",metricCodes:[r.requirement_code],minimum:1,reviews:prepared.reviews,sources:[prepared.source],documents:[],documentSources:[],definitions,evaluationAsOfMs:now,sourceCutoffAtMs:now,freshnessPolicy:null})
    if(out?.state!=="FRESH")return reply(409,"CANONICAL_GROWTH_QUALIFICATION_FAILED",{symbol:pin.symbol,requirement:r.requirement_code,reason:out?.reason??"NO_RESULT"})}
   plans.push({pin,prepared,exists:Boolean(existing.data)})
  }
  let newAcceptedReviews=0
  const result=[]
  for(const {pin,prepared,exists} of plans){
   if(!exists){const inserted=await db.from("data_source_records").insert({...prepared.source,source_url:pin.original_url,external_record_id:policy.id+":"+pin.original_sha256,
    terms_snapshot:{mode:"OWNER_DELEGATED_SOURCE_BOUND_NUMERIC_REVIEW",directive_sha256:directive.directiveSha256,executor:"CODEX_GITHUB_ACTIONS_OIDC",execution_sha:claims.sha,execution_run_id:claims.run_id,canonical_materialization:false}})
    if(inserted.error)return reply(409,"GROWTH_SOURCE_INSERT_REJECTED",{postgresCode:inserted.error.code})}
   for(const r of prepared.reviews){const existing=await db.from("research_evidence_requirement_reviews").select("id,review_hash").eq("id",r.id).maybeSingle()
    if(existing.error)return reply(503,"GROWTH_REVIEW_LOOKUP_FAILED")
    if(existing.data&&existing.data.review_hash!==r.review_hash)return reply(409,"GROWTH_REVIEW_IDENTITY_CONFLICT")
    if(!existing.data){const inserted=await db.from("research_evidence_requirement_reviews").insert(r);if(inserted.error)return reply(409,"GROWTH_REVIEW_INSERT_REJECTED",{postgresCode:inserted.error.code});newAcceptedReviews++}}
   const sourceRead=await db.from("data_source_records").select("id,source_code,record_kind,published_at,retrieved_at,payload_hash,raw_payload").eq("id",pin.source_id).single()
   const reviewRead=await db.from("research_evidence_requirement_reviews").select("*").in("id",prepared.reviews.map(r=>r.id))
   if(sourceRead.error||reviewRead.error||reviewRead.data.length!==prepared.reviews.length||sourceRead.data.payload_hash!==await bankValueHash(sourceRead.data.raw_payload))return reply(503,"GROWTH_ADMISSION_READBACK_FAILED")
   for(const r of prepared.reviews){const now=Date.now();const out=await validateReviewedRequirementEvidence({portfolioId:policy.portfolioId,portfolioOwnerId:policy.ownerId,
    securityId:pin.security_id,requirementCode:r.requirement_code,family:"NUMERIC_SERIES",metricCodes:[r.requirement_code],minimum:1,reviews:reviewRead.data as RequirementReview[],sources:[sourceRead.data as ReviewedSourceRecord],documents:[],documentSources:[],definitions,evaluationAsOfMs:now,sourceCutoffAtMs:now,freshnessPolicy:null})
    if(out?.state!=="FRESH")return reply(409,"GROWTH_READBACK_NOT_FRESH",{symbol:pin.symbol,requirement:r.requirement_code,reason:out?.reason})
    result.push({symbol:pin.symbol,requirementCode:r.requirement_code,reviewId:r.id,state:out.state})}
  }
  return reply(200,"GROWTH_SOURCE_REVIEWS_ACCEPTED_READBACK_VERIFIED",{newAcceptedReviews,results:result,providerCalls:0,canonicalMaterializations:0,persistedSelectedSnapshotChanged:false})
 }
 let response:Response
 try{response=await run()}catch{response=reply(503,"GROWTH_ADMISSION_FAILED")}
 finally{if(leased){const release=await db.rpc("release_data_ingestion_lease_v1",{p_source_code:"OWNER_REVIEWED_CLASSIFICATION",p_operation:operation,p_lease_holder:holder,p_cooldown_seconds:0});if(release.error||release.data!==true)response=reply(503,"GROWTH_ADMISSION_LEASE_RELEASE_FAILED")}}
 return response
})
