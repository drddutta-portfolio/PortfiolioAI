import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {createRemoteJWKSet,jwtVerify} from "https://esm.sh/jose@6.1.0"
import {bankResearchExecutorQualified,bankResearchGrantExternalId,BANK_RESEARCH_TARGETS,BANK_RESEARCH_BATCH,BANK_RESEARCH_PROJECT as PROJECT,BANK_RESEARCH_PORTFOLIO as PORTFOLIO,BANK_RESEARCH_OWNER as OWNER,BANK_RESEARCH_DIRECTIVE_HASH as APPROVAL} from "../_shared/v14-bank-approved-research-executor.ts"
const AUD=`https://${PROJECT}.supabase.co/functions/v1/v14-bank-authorized-research-grants`
const jwks=createRemoteJWKSet(new URL("https://token.actions.githubusercontent.com/.well-known/jwks"))
const reply=(status:number,code:string,extra:Record<string,unknown>={})=>new Response(JSON.stringify({code,...extra}),{status,headers:{"content-type":"application/json","cache-control":"no-store"}})
const sha=async(v:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(v))))).map(x=>x.toString(16).padStart(2,"0")).join("")
Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,"METHOD_NOT_ALLOWED")
 const url=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
 if(url!==`https://${PROJECT}.supabase.co`||!key)return reply(409,"DEVELOPMENT_ONLY")
 let claims:Record<string,unknown>
 try{
  const token=(req.headers.get("authorization")??"").replace(/^Bearer\s+/i,"")
  const verified=await jwtVerify(token,jwks,{issuer:"https://token.actions.githubusercontent.com",audience:AUD,algorithms:["RS256"],maxTokenAge:"5m"})
  claims=verified.payload
  if(!bankResearchExecutorQualified(claims))return reply(403,"RESEARCH_EXECUTOR_SCOPE_INVALID")
 }catch{return reply(401,"SIGNED_RESEARCH_EXECUTOR_REQUIRED")}
 const body=await req.json().catch(()=>null)
 if(!body||body.action!==BANK_RESEARCH_BATCH||body.approvalHash!==APPROVAL)return reply(400,"EXACT_RESEARCH_APPROVAL_REQUIRED")
 const db=createClient(url,key,{auth:{persistSession:false}})
 const lease:{release:(()=>Promise<boolean>)|null}={release:null}
 const execute=async():Promise<Response>=>{
 try{
  const owner=await db.from("portfolios").select("user_id").eq("id",PORTFOLIO).single()
  if(owner.error||owner.data?.user_id!==OWNER)return reply(403,"APPROVED_PORTFOLIO_OWNER_NOT_VERIFIED")
  const source=await db.from("data_sources").select("is_active,entitlement_verified,retention_rights_verified").eq("code","TRENDLYNE_MCP").single()
  const control=await db.from("provider_ingestion_controls").select("ingestion_enabled,daily_internal_attempt_limit,concurrency_limit,actual_provider_quota_status,actual_provider_quota").eq("source_code","TRENDLYNE_MCP").single()
  if(source.error||source.data?.is_active!==true||source.data.entitlement_verified!==true||source.data.retention_rights_verified!==true||control.error||control.data?.ingestion_enabled!==true||control.data.actual_provider_quota_status!=="VERIFIED")return reply(409,"VERIFIED_PROVIDER_ENTITLEMENT_REQUIRED")
  const day=new Date().toISOString().slice(0,10),grants=[]
  const holder=crypto.randomUUID(),operation="V14_BANK_RESEARCH_ISSUANCE_"+day.replaceAll("-","")
  const acquired=await db.rpc("acquire_data_ingestion_lease_v1",{p_source_code:"OWNER_REVIEWED_CLASSIFICATION",p_operation:operation,p_lease_holder:holder,p_lease_seconds:120})
  if(acquired.error||!Array.isArray(acquired.data)||acquired.data[0]?.acquired!==true)return reply(409,"RESEARCH_ISSUANCE_LEASE_BUSY")
  lease.release=async()=>{const r=await db.rpc("release_data_ingestion_lease_v1",{p_source_code:"OWNER_REVIEWED_CLASSIFICATION",p_operation:operation,p_lease_holder:holder,p_cooldown_seconds:0});return !r.error&&r.data===true}
  // Only grant existing source acquisition actions. No review, materialization,
  // history call, scheduler action or owner-session impersonation is supported.
  for(const target of BANK_RESEARCH_TARGETS){
   const external=bankResearchGrantExternalId(day,target)
   const existing=await db.from("data_source_records").select("id,raw_payload").eq("source_code","OWNER_REVIEWED_CLASSIFICATION").eq("record_kind","P4_EXECUTION_GRANT").eq("external_record_id",external).maybeSingle()
   if(existing.error)return reply(503,"RESEARCH_GRANT_LOOKUP_FAILED")
   if(existing.data){
    const id=String(existing.data.id),payload=existing.data.raw_payload
    if(payload.authorization_reference!==APPROVAL||payload.action!==target.action||payload.security_id!==target.scope||payload.portfolio_id!==PORTFOLIO)return reply(409,"RESEARCH_GRANT_IDENTITY_CONFLICT")
    const used=await db.from("data_source_records").select("id").eq("record_kind","P4_EXECUTION_GRANT_CONSUMED").eq("external_record_id",id).limit(1).maybeSingle()
    if(used.error)return reply(503,"RESEARCH_GRANT_USE_CHECK_FAILED")
    if(used.data){grants.push({...target,grantId:id,state:"ALREADY_CONSUMED_DO_NOT_RETRY"});continue}
    if(Date.parse(payload.expires_at)<=Date.now()){grants.push({...target,grantId:id,state:"EXPIRED_DO_NOT_REISSUE"});continue}
    grants.push({...target,grantId:id,state:"REUSED_UNCONSUMED"});continue
   }
   const id=crypto.randomUUID(),now=new Date(),payload={action:target.action,security_id:target.scope,portfolio_id:PORTFOLIO,
    environment:"PortfolioAI Dev",project_ref:PROJECT,expires_at:new Date(now.getTime()+15*60000).toISOString(),
    authorization:"OWNER_APPROVED_CODEX_RESEARCH_EXECUTION_DIRECTIVE_2026_10_12",
    authorization_reference:APPROVAL,authorizing_owner_id:OWNER,executor:"CODEX_GITHUB_ACTIONS_OIDC",
    issuance_day_utc:day,canonical_promotion:false,maximum_provider_attempts:1,
    issuance_workflow:claims.workflow_ref,issuance_run_id:claims.run_id,issuance_sha:claims.sha}
   const inserted=await db.from("data_source_records").insert({id,source_code:"OWNER_REVIEWED_CLASSIFICATION",record_kind:"P4_EXECUTION_GRANT",
    external_record_id:external,retrieved_at:now.toISOString(),payload_hash:await sha(payload),raw_payload:payload,
    terms_snapshot:{mode:"EXPLICIT_OWNER_DELEGATED_RESEARCH_ONLY",authorization_reference:APPROVAL,signed_executor:true,no_owner_review_attribution:true,canonical_promotion:false}}).select("id").single()
   // The source/day issuance lease serializes lookup + insertion; capability IDs stay unpredictable.
   if(inserted.error)return reply(409,"RESEARCH_GRANT_INSERT_REJECTED",{postgresCode:inserted.error.code})
   grants.push({...target,grantId:id,state:"ISSUED"})
  }
  return reply(200,"FIVE_SCOPED_RESEARCH_GRANTS",{portfolioId:PORTFOLIO,grants,canonicalPromotion:false,
   ownerDailyCeiling:1000,effectiveDailyControl:control.data.daily_internal_attempt_limit,concurrencyLimit:control.data.concurrency_limit,paidRetries:0})
 }catch{return reply(503,"RESEARCH_GRANT_ISSUANCE_FAILED")}
 }
 const response=await execute()
 try{if(lease.release&&!await lease.release())return reply(503,"RESEARCH_ISSUANCE_LEASE_RELEASE_FAILED")}
 catch{return reply(503,"RESEARCH_ISSUANCE_LEASE_RELEASE_FAILED")}
 return response
})
