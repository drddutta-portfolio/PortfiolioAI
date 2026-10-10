import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {consumeP4ExecutionGrant} from "../_shared/p4-execution-grant.ts"
import scope from "./scope.json" with {type:"json"}

const SOURCE="TRENDLYNE_MCP"
const PROJECT="lrgpjimipfkyoqbpsqzz"
const PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2"
const ACTION="V1_4_BANK_VALUATION_HISTORY_ACQUISITION_2021_2026"
const SENTINEL="BANKING_13_VALUATION_HISTORY:2021-2026"
const PLANNED=26
const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store"}})
const sha=async(v:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(v))))).map(x=>x.toString(16).padStart(2,"0")).join("")
const decode=(body:string)=>{
 const events=body.split(/\r?\n/).map(x=>x.trim()).filter(x=>x.startsWith("data:")).map(x=>x.slice(5).trim()).filter(x=>x&&x!=="[DONE]")
 const p=(events.length?events.map(JSON.parse).at(-1):JSON.parse(body)) as Record<string,unknown>
 if(!p||p.error)throw new Error("PROVIDER_RPC_ERROR")
 return p.result
}
class MCP{
 session:string|null=null;next=1
 constructor(private endpoint:string){}
 async post(payload:unknown){
  const h:Record<string,string>={"content-type":"application/json","accept":"application/json, text/event-stream","user-agent":"PortfolioAI-V14-BANK-VALUATION/1.0"}
  if(this.session)h["mcp-session-id"]=this.session
  const r=await fetch(this.endpoint,{method:"POST",headers:h,body:JSON.stringify(payload)})
  if(!r.ok)throw new Error("PROVIDER_HTTP_"+r.status)
  this.session=r.headers.get("mcp-session-id")??this.session
  const t=await r.text();return t.trim()?decode(t):null
 }
 async init(){await this.post({jsonrpc:"2.0",id:this.next++,method:"initialize",params:{protocolVersion:"2025-03-26",capabilities:{},clientInfo:{name:"PortfolioAI-V14-BANK-VALUATION",version:"1"}}});await this.post({jsonrpc:"2.0",method:"notifications/initialized",params:{}})}
 async call(name:string,args:Record<string,unknown>){
  if(!this.session)await this.init()
  const r=await this.post({jsonrpc:"2.0",id:this.next++,method:"tools/call",params:{name,arguments:args}}) as {content?:{type:string;text?:string}[],structuredContent?:{result?:string}}
  const t=r?.structuredContent?.result??r?.content?.find(x=>x.type==="text")?.text
  if(typeof t!=="string")throw new Error("PROVIDER_RESULT_MISSING")
  return t
 }
}
Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,{code:"METHOD_NOT_ALLOWED"})
 const url=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"",mcpUrl=Deno.env.get("TRENDLYNE_MCP_URL")??""
 if(url!==`https://${PROJECT}.supabase.co`||!key||!mcpUrl)return reply(409,{code:"DEVELOPMENT_CONFIGURATION_REQUIRED"})
 try{
  const body=await req.json() as Record<string,unknown>
  if(body.action!==ACTION||body.portfolioId!==PORTFOLIO)return reply(400,{code:"VALUATION_HISTORY_SCOPE_INVALID"})
  const admin=createClient(url,key,{auth:{persistSession:false}})
  const grant=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action:ACTION,portfolioId:PORTFOLIO,securityId:SENTINEL})
  if(!grant.ok)return reply(401,{code:grant.code})
  const ctl=await admin.from("provider_ingestion_controls").select("*").eq("source_code",SOURCE).single()
  if(ctl.error||!ctl.data.ingestion_enabled||ctl.data.actual_provider_quota_status!=="VERIFIED"||Number(ctl.data.per_run_internal_attempt_limit)<PLANNED)return reply(409,{code:"PROVIDER_CONTROLS_BLOCK"})
  const run=await admin.from("data_ingestion_runs").insert({
   source_code:SOURCE,portfolio_id:PORTFOLIO,operation:ACTION,orchestration_type:"V1_4_BANK_VALUATION_HISTORY_ACQUISITION",
   trigger_source:"OWNER_GRANTED",status:"RUNNING",requested_count:scope.length,estimated_call_count:PLANNED,reserved_call_count:PLANNED,
   attempted_call_count:0,policy_version:ctl.data.policy_version,metadata:{grant_id:body.grantId,years:"2021-2026",retry_policy:"ZERO",canonical_promotion:false}
  }).select("id").single()
  if(run.error)throw new Error("RUN_CREATE_FAILED")
  const runId=String(run.data.id)
  const reservation=await admin.rpc("reserve_provider_budget_v1",{p_source_code:SOURCE,p_ingestion_run_id:runId,p_reservation_key:`${ACTION}:${body.grantId}`,p_estimated_units:PLANNED,p_reservation_seconds:3600})
  const rr=reservation.data?.[0]
  if(reservation.error||!rr?.reserved){
   await admin.from("data_ingestion_runs").update({status:"FAILED",completed_at:new Date().toISOString(),error_summary:rr?.reason_code??"BUDGET_RESERVATION_FAILED"}).eq("id",runId)
   return reply(409,{code:"BUDGET_RESERVATION_FAILED",reason:rr?.reason_code??null,runId})
  }
  const reservationId=String(rr.reservation_id)
  const client=new MCP(mcpUrl)
  let attempted=0,succeeded=0,failed=0,completed=0;const captures:Record<string,unknown>[]=[]
  const usage=async(securityId:string,op:string,outcome:"SUCCEEDED"|"FAILED",code:string|null)=>{
   const u=await admin.rpc("record_provider_usage_event_v1",{p_source_code:SOURCE,p_ingestion_run_id:runId,p_run_item_id:null,p_security_id:securityId,
    p_data_domain:"BANK_VALUATION_HISTORY_2021_2026",p_operation_class:op,p_accounting_class:"PROVIDER_TOOL_ATTEMPT",p_estimated_internal_units:1,p_actual_internal_units:1,
    p_attempted_at:new Date().toISOString(),p_completed_at:new Date().toISOString(),p_outcome:outcome,p_safe_error_code:code,p_retry_attempt:0,
    p_idempotency_key:`${ACTION}:${body.grantId}:${securityId}:${op}`})
   if(u.error)throw new Error("USAGE_ACCOUNTING_FAILED")
  }
  const capture=async(target:{symbol:string;securityId:string},kind:string,tool:string,query:string,result:string)=>{
   const payload={version:ACTION,security_id:target.securityId,symbol:target.symbol,provider_tool:tool,query,years:"2021-2026",result}
   const ins=await admin.from("data_source_records").insert({source_code:SOURCE,ingestion_run_id:runId,record_kind:kind,
    external_record_id:`${body.grantId}:${target.securityId}:${kind}`,retrieved_at:new Date().toISOString(),payload_hash:await sha(payload),raw_payload:payload,
    terms_snapshot:{operation:ACTION,reservation_id:reservationId,retry_policy:"ZERO",canonical_promotion:false}}).select("id,payload_hash").single()
   if(ins.error)throw new Error("CAPTURE_WRITE_FAILED")
   captures.push({symbol:target.symbol,kind,recordId:ins.data.id,payloadHash:ins.data.payload_hash,resultLength:result.length})
  }
  let terminal:string|null=null
  for(const target of scope){
   if(terminal)break
   const queries=[
    {op:"GET_PARAMETER_VALUES_MULTI_STOCK",tool:"get_parameter_values_multi_stock",kind:"V1_4_BANK_VALUATION_HISTORY_FUNDAMENTALS_CAPTURE",
     query:`${target.symbol} historical quarterly and annual book value per share BVPS basic and diluted EPS TTM EPS PE PB 2021 2022 2023 2024 2025 2026 with reporting period end and publication date`,args:(q:string)=>({query:q,type:"stock"})},
    {op:"GET_DOCUMENT_SEARCH_RESULTS",tool:"get_document_search_results",kind:"V1_4_BANK_VALUATION_HISTORY_DOCUMENTS_CAPTURE",
     query:`${target.symbol} annual report quarterly result investor presentation book value per share EPS 2021 2022 2023 2024 2025 2026 publication date`,args:(q:string)=>({query:q})}
   ]
   try{
    for(const q of queries){
     attempted++
     try{
      const result=await client.call(q.tool,q.args(q.query));succeeded++;await usage(target.securityId,q.op,"SUCCEEDED",null);await capture(target,q.kind,q.tool,q.query,result)
     }catch(e){
      failed++;const code=e instanceof Error?e.message:"PROVIDER_REQUEST_FAILED";await usage(target.securityId,q.op,"FAILED",code);throw e
     }
    }
    completed++
   }catch(e){terminal=e instanceof Error?e.message:"ACQUISITION_FAILED"}
  }
  const released=Math.max(0,PLANNED-attempted)
  await admin.rpc("settle_provider_budget_v1",{p_reservation_id:reservationId,p_consumed_units:succeeded,p_failed_units:failed,p_released_units:released})
  await admin.from("data_ingestion_runs").update({status:terminal?"FAILED":"SUCCEEDED",completed_at:new Date().toISOString(),attempted_call_count:attempted,
   fetched_count:captures.length,accepted_count:completed,failed_count:failed,error_summary:terminal,
   metadata:{grant_id:body.grantId,years:"2021-2026",retry_policy:"ZERO",reservation_id:reservationId,consumed_units:succeeded,failed_units:failed,released_units:released,captures,canonical_promotion:false}}).eq("id",runId)
  return reply(terminal?502:200,{state:terminal?"FAILED_SAFE":"PASS",runId,reservationId,providerCalls:attempted,succeeded,failed,released,completed,captures,canonicalPromotion:false})
 }catch(e){return reply(500,{code:e instanceof Error?e.message:"VALUATION_HISTORY_ACQUISITION_FAILED"})}
})