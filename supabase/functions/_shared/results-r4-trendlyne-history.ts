import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const REF="lrgpjimipfkyoqbpsqzz"
const SOURCE="TRENDLYNE_MCP"
const PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2"
const AUD="portfolioai-results-r4"
const WORKFLOW="drddutta-portfolio/PortfiolioAI/.github/workflows/results-r4-trendlyne-history.yml@refs/heads/PortfolioAI-Development"
const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json"}})
const decode=(value:string)=>Uint8Array.from(atob(value.replace(/-/g,"+").replace(/_/g,"/")),x=>x.charCodeAt(0))

// Authenticate the exact Development workflow using GitHub's signed OIDC JWT.
// No shared credential, URL secret, or public confirmation phrase is accepted.
async function workflowIdentity(req:Request):Promise<Record<string,unknown>>{
  const token=req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1]
  if(!token)throw new Error("AUTH_REQUIRED")
  const parts=token.split(".")
  if(parts.length!==3)throw new Error("AUTH_INVALID")
  const header=JSON.parse(new TextDecoder().decode(decode(parts[0])))
  const claims=JSON.parse(new TextDecoder().decode(decode(parts[1])))
  const now=Date.now()/1000
  if(header.alg!=="RS256"||claims.iss!=="https://token.actions.githubusercontent.com"
     ||claims.aud!==AUD||claims.repository_id!=="1357024254"
     ||claims.repository!=="drddutta-portfolio/PortfiolioAI"
     ||claims.ref!=="refs/heads/PortfolioAI-Development"
     ||claims.workflow_ref!==WORKFLOW||claims.event_name!=="push"
     ||typeof claims.exp!=="number"||claims.exp<=now
     ||typeof claims.nbf!=="number"||claims.nbf>now+30)throw new Error("AUTH_INVALID")
  const response=await fetch("https://token.actions.githubusercontent.com/.well-known/jwks")
  if(!response.ok)throw new Error("AUTH_KEYS_UNAVAILABLE")
  const jwks=await response.json() as {keys:(JsonWebKey & {kid?:string})[]}
  const jwk=jwks.keys.find(k=>k.kid===header.kid)
  if(!jwk)throw new Error("AUTH_INVALID")
  const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"])
  if(!await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,decode(parts[2]),new TextEncoder().encode(parts[0]+"."+parts[1])))
    throw new Error("AUTH_INVALID")
  return claims
}

const decodeMcpResult = (body:string): unknown => {
  const events = body.split(/\r?\n/).map(x=>x.trim()).filter(x=>x.startsWith("data:"))
    .map(x=>x.slice(5).trim()).filter(x=>x && x!=="[DONE]")
  const payload = (events.length ? events.map(JSON.parse).at(-1) : JSON.parse(body)) as Record<string,unknown>
  if (!payload || payload.error) throw new Error("PROVIDER_RPC_ERROR")
  return payload.result
}

class Client {
  session:string|null=null
  next=1
  constructor(private endpoint:string){}
  async post(payload:unknown){
    const headers:Record<string,string>={
      "content-type":"application/json",
      "accept":"application/json, text/event-stream",
      "user-agent":"PortfolioAI/1.0",
    }
    if(this.session) headers["mcp-session-id"]=this.session
    const r=await fetch(this.endpoint,{method:"POST",headers,body:JSON.stringify(payload)})
    if(!r.ok) throw new Error("PROVIDER_HTTP_"+r.status)
    this.session=r.headers.get("mcp-session-id")??this.session
    const body=await r.text()
    return body.trim()?decodeMcpResult(body):null
  }
  async init(){
    await this.post({jsonrpc:"2.0",id:this.next++,method:"initialize",params:{
      protocolVersion:"2025-03-26",capabilities:{},clientInfo:{name:"PortfolioAI-B4",version:"1"}
    }})
    await this.post({jsonrpc:"2.0",method:"notifications/initialized",params:{}})
  }
  async call(name:string,args:Record<string,unknown>){
    if(!this.session) await this.init()
    const result=await this.post({jsonrpc:"2.0",id:this.next++,method:"tools/call",params:{name,arguments:args}}) as {
      content?:{type:string;text?:string}[], structuredContent?:{result?:string}
    }
    const text=result?.structuredContent?.result??result?.content?.find(x=>x.type==="text")?.text
    if(typeof text!=="string") throw new Error("PROVIDER_RESULT_MISSING")
    const n=text.trim().toLowerCase()
    if(n.startsWith("unknown tool:")||n.includes("tool not found")||n.includes("method not found")) {
      throw new Error("PROVIDER_TOOL_CONTRACT_ERROR")
    }
    return text
  }
}



export async function handleR4History(req:Request){
  if(req.method!=="POST")return reply(405,{error:"METHOD_NOT_ALLOWED"})
  let claims:Record<string,unknown>
  try{claims=await workflowIdentity(req)}catch{return reply(401,{error:"WORKFLOW_AUTH_FAILED"})}
  const body=await req.json().catch(()=>null) as {tool?:string;args?:Record<string,unknown>;securityId?:string;requestId?:string}|null
  const allowed=["LIST_TOOLS","search_parameters","get_parameter_values_multi_stock","get_document_search_results","get_parameter_values"]
  if(!body||!body.tool||!allowed.includes(body.tool)||!body.requestId||!/^[a-zA-Z0-9_-]{1,80}$/.test(body.requestId)
     ||JSON.stringify(body.args??{}).length>5000)return reply(400,{error:"INVALID_REQUEST"})
  const url=Deno.env.get("SUPABASE_URL"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),endpoint=Deno.env.get("TRENDLYNE_MCP_URL")
  if(!url?.includes(REF)||!service||!endpoint)return reply(500,{error:"DEV_CONFIGURATION_MISSING"})
  const db=createClient(url,service,{auth:{persistSession:false}})
  if(body.securityId){
    const s=await db.from("security_identity_observations").select("id").eq("security_id",body.securityId)
      .eq("source_code",SOURCE).eq("evidence_status","MATCHED").limit(1)
    if(s.error||!s.data?.length)return reply(409,{error:"EXACT_PROVIDER_IDENTITY_REQUIRED"})
  }else if(body.tool!=="LIST_TOOLS"&&body.tool!=="search_parameters")return reply(400,{error:"SECURITY_REQUIRED"})
  const control=await db.from("provider_ingestion_controls").select("*").eq("source_code",SOURCE).single()
  const source=await db.from("data_sources").select("is_active,entitlement_verified,retention_rights_verified").eq("code",SOURCE).single()
  if(control.error||source.error||!control.data.ingestion_enabled||control.data.actual_provider_quota_status!=="VERIFIED"
     ||!source.data.is_active||!source.data.entitlement_verified||!source.data.retention_rights_verified)
    return reply(409,{error:"PROVIDER_CONTROLS_BLOCKED"})
  const quota=control.data.actual_provider_quota as {monthly_limit?:number}
  const monthStart=new Date();monthStart.setUTCDate(1);monthStart.setUTCHours(0,0,0,0)
  const usage=await db.from("provider_usage_events").select("id",{count:"exact",head:true}).eq("source_code",SOURCE).gte("attempted_at",monthStart.toISOString())
  if(usage.error||!quota.monthly_limit||(usage.count??quota.monthly_limit)>=quota.monthly_limit)
    return reply(429,{error:"MONTHLY_BUDGET_BLOCKED"})
  const operation="RESULTS_R4_HISTORY_"+String(claims.run_id)+"_"+body.requestId.toUpperCase().replace(/-/g,"_")
  const prior=await db.from("data_ingestion_runs").select("id").eq("source_code",SOURCE).eq("operation",operation).limit(1)
  if(prior.error)return reply(500,{error:"IDEMPOTENCY_CHECK_FAILED"})
  if(prior.data?.length)return reply(409,{error:"ALREADY_ATTEMPTED",runId:prior.data[0].id})
  const run=await db.from("data_ingestion_runs").insert({source_code:SOURCE,portfolio_id:PORTFOLIO,
    operation,orchestration_type:"RESULTS_R4_HISTORICAL",trigger_source:"OWNER",
    requested_by:"f9e48c4c-d796-424b-95f7-2a4a97149543",status:"RUNNING",requested_count:1,
    estimated_call_count:1,reserved_call_count:1,attempted_call_count:0,policy_version:control.data.policy_version,
    metadata:{github_run_id:claims.run_id,canonical_promotion_performed:false}}).select("id").single()
  if(run.error)return reply(500,{error:"RUN_ACCOUNTING_FAILED"})
  const runId=run.data.id
  const reserved=await db.rpc("reserve_provider_budget_v1",{p_source_code:SOURCE,p_ingestion_run_id:runId,
    p_reservation_key:operation,p_estimated_units:1,p_reservation_seconds:180})
  const reservation=reserved.data?.[0]
  if(reserved.error||!reservation?.reserved){await db.from("data_ingestion_runs").update({status:"FAILED",completed_at:new Date().toISOString(),error_summary:"BUDGET_RESERVATION_FAILED"}).eq("id",runId);return reply(429,{error:"BUDGET_RESERVATION_FAILED",runId})}
  let result:unknown=null,error:string|null=null
  try{
    const client=new Client(endpoint)
    await client.init()
    result=body.tool==="LIST_TOOLS"
      ?await client.post({jsonrpc:"2.0",id:client.next++,method:"tools/list",params:{}})
      :await client.call(body.tool,body.args??{})
  }catch(e){error=e instanceof Error&&/^PROVIDER_[A-Z0-9_]+$/.test(e.message)?e.message:"PROVIDER_REQUEST_FAILED"}
  const recorded=await db.rpc("record_provider_usage_event_v1",{p_source_code:SOURCE,p_ingestion_run_id:runId,
    p_run_item_id:null,p_security_id:body.securityId??null,p_data_domain:"RESULTS_R4_HISTORICAL",
    p_operation_class:body.tool.toUpperCase(),p_accounting_class:"PROVIDER_TOOL_ATTEMPT",
    p_estimated_internal_units:1,p_actual_internal_units:1,p_attempted_at:new Date().toISOString(),
    p_completed_at:new Date().toISOString(),p_outcome:error?"FAILED":"SUCCEEDED",
    p_safe_error_code:error,p_retry_attempt:0,p_idempotency_key:operation})
  const settled=await db.rpc("settle_provider_budget_v1",{p_reservation_id:reservation.reservation_id,
    p_consumed_units:error?0:1,p_failed_units:error?1:0,p_released_units:0})
  if(recorded.error||settled.error)error="USAGE_ACCOUNTING_FAILED"
  await db.from("data_ingestion_runs").update({status:error?"FAILED":"SUCCEEDED",completed_at:new Date().toISOString(),
    attempted_call_count:1,accepted_count:0,failed_count:error?1:0,error_summary:error,
    metadata:{github_run_id:claims.run_id,canonical_promotion_performed:false}}).eq("id",runId)
  return reply(error?502:200,{runId,tool:body.tool,result,error,providerCalls:1,canonicalPromotionPerformed:false})
}
