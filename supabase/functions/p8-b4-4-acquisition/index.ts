import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SOURCE="TRENDLYNE_MCP"
const PORTFOLIO_ID="6193a4aa-3235-4057-bddc-209fcf443fc2"
const REQUESTED_BY="f9e48c4c-d796-424b-95f7-2a4a97149543"
const CONFIRMATION="P8_B4_4_OWNER_AUTH_2026_10_03"
const MAX_BATCH=10
const MAX_BYTES=512*1024
const FUND_KINDS=["P8_B4_3_CANARY_FUNDAMENTALS","P8_B4_4_FUNDAMENTALS"]
const DOC_KINDS=["P8_B4_3_CANARY_DOCUMENTS","P8_B4_4_DOCUMENTS"]

type HistoricalIdentityRow = {
  readonly id: string
  readonly historical_isin: string
  readonly canonical_security_id: string
}
type ProviderIdentityRow = {
  readonly security_id: string
  readonly provider_instrument_id: string
  readonly observed_isin: string
  readonly evidence_status: string
}
type SecurityRow = { readonly id: string; readonly symbol: string }
type ExistingCaptureRow = { readonly record_kind: string; readonly raw_payload: unknown }

const reply=(status:number,body:Record<string,unknown>)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json"}})
const sha256=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,"0")).join("")

const decode=(body:string)=>{
  const events=body.split(/\r?\n/).map(x=>x.trim()).filter(x=>x.startsWith("data:")).map(x=>x.slice(5).trim()).filter(x=>x&&x!=="[DONE]")
  const p=(events.length?events.map(JSON.parse).at(-1):JSON.parse(body)) as Record<string,unknown>
  if(!p||p.error) throw new Error("PROVIDER_RPC_ERROR")
  return p.result
}
class MCP {
  session:string|null=null; next=1
  constructor(private endpoint:string){}
  async post(payload:unknown){
    const h:Record<string,string>={"content-type":"application/json","accept":"application/json, text/event-stream","user-agent":"PortfolioAI-B4/1.0"}
    if(this.session) h["mcp-session-id"]=this.session
    const r=await fetch(this.endpoint,{method:"POST",headers:h,body:JSON.stringify(payload)})
    if(!r.ok) throw new Error("PROVIDER_HTTP_"+r.status)
    this.session=r.headers.get("mcp-session-id")??this.session
    const t=await r.text(); return t.trim()?decode(t):null
  }
  async init(){
    await this.post({jsonrpc:"2.0",id:this.next++,method:"initialize",params:{protocolVersion:"2025-03-26",capabilities:{},clientInfo:{name:"PortfolioAI-B4",version:"1"}}})
    await this.post({jsonrpc:"2.0",method:"notifications/initialized",params:{}})
  }
  async call(name:string,args:Record<string,unknown>){
    if(!this.session) await this.init()
    const r=await this.post({jsonrpc:"2.0",id:this.next++,method:"tools/call",params:{name,arguments:args}}) as {content?:{type:string;text?:string}[],structuredContent?:{result?:string}}
    const t=r?.structuredContent?.result??r?.content?.find(x=>x.type==="text")?.text
    if(typeof t!=="string") throw new Error("PROVIDER_RESULT_MISSING")
    const n=t.toLowerCase()
    if(n.startsWith("unknown tool:")||n.includes("tool not found")||n.includes("method not found")) throw new Error("PROVIDER_TOOL_CONTRACT_ERROR")
    return t
  }
}

Deno.serve(async req=>{
  if(req.method!=="POST") return reply(405,{error:"Method not allowed"})
  const b=await req.json().catch(()=>({})) as Record<string,unknown>
  if(b.confirmation!==CONFIRMATION) return reply(401,{error:"Exact B4-4 owner confirmation required",providerCalls:0})
  const batchSize=Math.max(1,Math.min(MAX_BATCH,Number(b.batchSize??10)))
  const url=Deno.env.get("SUPABASE_URL"), service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), mcpUrl=Deno.env.get("TRENDLYNE_MCP_URL")
  if(!url||!service||!mcpUrl||!url.includes("lrgpjimipfkyoqbpsqzz")) return reply(409,{error:"Development configuration mismatch",providerCalls:0})
  const admin=createClient(url,service,{auth:{persistSession:false}})

  const control=await admin.from("provider_ingestion_controls").select("ingestion_enabled,daily_internal_attempt_limit,per_run_internal_attempt_limit,actual_provider_quota_status,policy_version").eq("source_code",SOURCE).single()
  if(control.error||!control.data.ingestion_enabled||control.data.actual_provider_quota_status!=="VERIFIED") return reply(409,{error:"PROVIDER_CONTROLS_BLOCK",providerCalls:0})

  const since=new Date(); since.setUTCHours(0,0,0,0)
  const usage=await admin.from("provider_usage_events").select("actual_internal_units").eq("source_code",SOURCE).eq("accounting_class","PROVIDER_TOOL_ATTEMPT").gte("attempted_at",since.toISOString())
  const usedToday=(usage.data??[]).reduce((sum,row)=>sum+Number(row.actual_internal_units??0),0)
  const frozenRemaining=Math.max(0,1000-usedToday)
  if(frozenRemaining<1) return reply(200,{state:"DAILY_PLANNED_CEILING_REACHED",providerCalls:0,usedToday,frozenRemaining})

  const hist=await admin.from("p8_historical_security_identities").select("id,historical_isin,canonical_security_id").not("canonical_security_id","is",null).range(0,4999)
  const pid=await admin.from("security_identity_observations").select("security_id,provider_instrument_id,observed_isin,evidence_status").eq("source_code",SOURCE).eq("evidence_status","MATCHED").not("provider_instrument_id","is",null).range(0,999)
  if(hist.error||pid.error) return reply(500,{error:"IDENTITY_READ_FAILED",providerCalls:0})
  const identityRows=(pid.data??[]) as ProviderIdentityRow[]
  const pmap=new Map(identityRows.map((row)=>[row.security_id,row] as const))
  const historicalRows=(hist.data??[]) as HistoricalIdentityRow[]
  const exact=historicalRows.filter((row)=>pmap.get(row.canonical_security_id)?.observed_isin===row.historical_isin)
    .sort((a,b)=>a.historical_isin.localeCompare(b.historical_isin)||a.id.localeCompare(b.id))
  const secIds=exact.map((row)=>row.canonical_security_id)
  const sec=await admin.from("securities").select("id,symbol").in("id",secIds)
  if(sec.error) return reply(500,{error:"SECURITY_READ_FAILED",providerCalls:0})
  const securityRows=(sec.data??[]) as SecurityRow[]
  const smap=new Map(securityRows.map((row)=>[row.id,row.symbol] as const))

  const haveFund=new Set<string>(),haveDoc=new Set<string>()
  for(let from=0;;from+=500){
    const existing=await admin.from("data_source_records")
      .select("record_kind,raw_payload")
      .in("record_kind",[...FUND_KINDS,...DOC_KINDS])
      .range(from,from+499)
    if(existing.error) return reply(500,{error:"CAPTURE_READ_FAILED",providerCalls:0})
    const rows=existing.data??[]
    for(const r of rows){
      const payload=r.raw_payload&&typeof r.raw_payload==="object"&&!Array.isArray(r.raw_payload)
        ? r.raw_payload as Record<string,unknown>
        : {}
      const id=String(payload.historical_identity_id??"")
      if(FUND_KINDS.includes(r.record_kind))haveFund.add(id)
      if(DOC_KINDS.includes(r.record_kind))haveDoc.add(id)
    }
    if(rows.length<500) break
  }
  const completeBefore=exact.filter((row)=>haveFund.has(row.id)&&haveDoc.has(row.id)).length
  if(completeBefore<160) return reply(409,{error:"CAPTURE_LEDGER_UNDERCOUNT",providerCalls:0,completeBefore,totalExact:exact.length})
  const todo=exact.filter((row)=>!(haveFund.has(row.id)&&haveDoc.has(row.id))).slice(0,batchSize)
  if(!todo.length) return reply(200,{state:"CAMPAIGN_COMPLETE",providerCalls:0,completeBefore,totalExact:exact.length})

  let planned=0
  for(const x of todo){if(!haveFund.has(x.id))planned++;if(!haveDoc.has(x.id))planned++}
  planned=Math.min(planned,frozenRemaining,control.data.per_run_internal_attempt_limit)
  if(planned<1) return reply(200,{state:"NO_PLANNED_CAPACITY",providerCalls:0,completeBefore,totalExact:exact.length,usedToday})
  const selected:HistoricalIdentityRow[]=[]; let capacity=planned
  for(const x of todo){const need=(haveFund.has(x.id)?0:1)+(haveDoc.has(x.id)?0:1);if(need<=capacity){selected.push(x);capacity-=need}else break}
  const reserve=planned-capacity

  const run=await admin.from("data_ingestion_runs").insert({source_code:SOURCE,portfolio_id:PORTFOLIO_ID,operation:"P8_B4_4_ACQUISITION",orchestration_type:"P8_B4_4_ACQUISITION",trigger_source:"OWNER",requested_by:REQUESTED_BY,status:"RUNNING",requested_count:selected.length,estimated_call_count:reserve,reserved_call_count:reserve,attempted_call_count:0,policy_version:control.data.policy_version,metadata:{mode:"P8_B4_4",complete_before:completeBefore,selected:selected.map((row)=>({id:row.id,isin:row.historical_isin,symbol:smap.get(row.canonical_security_id)})),canonical_promotion_performed:false,b4_schema_write_performed:false}}).select("id").single()
  if(run.error) return reply(500,{error:"RUN_ACCOUNTING_FAILED",providerCalls:0})
  const runId=run.data.id
  const reservation=await admin.rpc("reserve_provider_budget_v1",{p_source_code:SOURCE,p_ingestion_run_id:runId,p_reservation_key:`${runId}:P8_B4_4`,p_estimated_units:reserve,p_reservation_seconds:1800})
  const rr=reservation.data?.[0]
  if(reservation.error||!rr?.reserved){await admin.from("data_ingestion_runs").update({status:"FAILED",completed_at:new Date().toISOString(),error_summary:rr?.reason_code??"BUDGET_RESERVATION_FAILED"}).eq("id",runId);return reply(429,{error:"BUDGET_RESERVATION_FAILED",providerCalls:0,runId})}

  const client=new MCP(mcpUrl); let attempted=0,succeeded=0,failed=0,terminal:string|null=null,completed=0
  const captures:Record<string,unknown>[]=[]
  const use=async(itemId:string,securityId:string,op:string,outcome:"SUCCEEDED"|"FAILED",code:string|null)=>{
    const r=await admin.rpc("record_provider_usage_event_v1",{p_source_code:SOURCE,p_ingestion_run_id:runId,p_run_item_id:itemId,p_security_id:securityId,p_data_domain:"P8_B4_POINT_IN_TIME_EVIDENCE",p_operation_class:op,p_accounting_class:"PROVIDER_TOOL_ATTEMPT",p_estimated_internal_units:1,p_actual_internal_units:1,p_attempted_at:new Date().toISOString(),p_completed_at:new Date().toISOString(),p_outcome:outcome,p_safe_error_code:code,p_retry_attempt:0,p_idempotency_key:`${runId}:${op}:${attempted}`})
    if(r.error) throw new Error("USAGE_ACCOUNTING_FAILED")
  }
  const cap=async(x:HistoricalIdentityRow,kind:string,tool:string,query:string,result:string)=>{
    const raw={mode:"P8_B4_4",run_id:runId,historical_identity_id:x.id,historical_isin:x.historical_isin,security_id:x.canonical_security_id,security_symbol:smap.get(x.canonical_security_id),provider_instrument_id:pmap.get(x.canonical_security_id)?.provider_instrument_id??null,provider_tool:tool,query,result}
    const ser=JSON.stringify(raw);if(new TextEncoder().encode(ser).byteLength>MAX_BYTES)throw new Error("CAPTURE_PAYLOAD_TOO_LARGE")
    const hash=await sha256(ser);const ins=await admin.from("data_source_records").insert({source_code:SOURCE,ingestion_run_id:runId,record_kind:kind,external_record_id:`${raw.provider_instrument_id}:${kind}:${runId}`,retrieved_at:new Date().toISOString(),payload_hash:hash,raw_payload:raw,terms_snapshot:{mode:"P8_B4_4",historical_identity_id:x.id,historical_isin:x.historical_isin,canonical_promotion_performed:false,b4_schema_write_performed:false}}).select("id").single()
    if(ins.error)throw new Error("CAPTURE_PERSISTENCE_FAILED");captures.push({historicalIdentityId:x.id,symbol:raw.security_symbol,kind,recordId:ins.data.id,payloadHash:hash,resultLength:result.length})
  }

  for(const x of selected){
    if(terminal)break
    const securityId=x.canonical_security_id, symbol=String(smap.get(securityId)??""), p=pmap.get(securityId)
    if(!symbol||!p||p.observed_isin!==x.historical_isin){terminal="IDENTITY_DIVERGENCE";break}
    const item=await admin.from("data_ingestion_run_items").insert({ingestion_run_id:runId,security_id:securityId,data_domain:"P8_B4_POINT_IN_TIME_EVIDENCE",status:"PLANNED",metadata:{historical_identity_id:x.id,historical_isin:x.historical_isin}}).select("id").single()
    if(item.error){terminal="RUN_ITEM_ACCOUNTING_FAILED";break}
    let itemCalls=0
    try{
      if(!haveFund.has(x.id)){
        const q=`${symbol} historical quarterly and annual fundamentals 2023 2024 2025 2026 revenue EBITDA diluted EPS ROCE operating margin with reporting period and publication date`
        attempted++;itemCalls++;let r:string
        try{r=await client.call("get_parameter_values_multi_stock",{query:q,type:"stock"});succeeded++;await use(item.data.id,securityId,"GET_PARAMETER_VALUES_MULTI_STOCK","SUCCEEDED",null)}catch(e){failed++;const c=e instanceof Error?e.message:"PROVIDER_REQUEST_FAILED";await use(item.data.id,securityId,"GET_PARAMETER_VALUES_MULTI_STOCK","FAILED",c);throw e}
        await cap(x,"P8_B4_4_FUNDAMENTALS","get_parameter_values_multi_stock",q,r);haveFund.add(x.id)
      }
      if(!haveDoc.has(x.id)){
        const q=`${symbol} annual report quarterly results investor presentation exchange filing 2023 2024 2025 2026 publication date`
        attempted++;itemCalls++;let r:string
        try{r=await client.call("get_document_search_results",{query:q});succeeded++;await use(item.data.id,securityId,"GET_DOCUMENT_SEARCH_RESULTS","SUCCEEDED",null)}catch(e){failed++;const c=e instanceof Error?e.message:"PROVIDER_REQUEST_FAILED";await use(item.data.id,securityId,"GET_DOCUMENT_SEARCH_RESULTS","FAILED",c);throw e}
        await cap(x,"P8_B4_4_DOCUMENTS","get_document_search_results",q,r);haveDoc.add(x.id)
      }
      completed++;await admin.rpc("record_refresh_item_result_v1",{p_run_item_id:item.data.id,p_status:"ACCEPTED",p_safe_reason_code:null,p_attempted_call_count:itemCalls,p_accepted_record_count:0,p_metadata:{mode:"P8_B4_4",raw_captures:itemCalls,canonical_promotion_performed:false}})
    }catch(e){terminal=e instanceof Error?e.message:"B4_4_FAILED";await admin.rpc("record_refresh_item_result_v1",{p_run_item_id:item.data.id,p_status:"FAILED",p_safe_reason_code:terminal,p_attempted_call_count:itemCalls,p_accepted_record_count:0,p_metadata:{mode:"P8_B4_4"}});break}
  }

  const released=reserve-attempted
  const settle=await admin.rpc("settle_provider_budget_v1",{p_reservation_id:rr.reservation_id,p_consumed_units:succeeded,p_failed_units:failed,p_released_units:released})
  if(settle.error&&!terminal)terminal="BUDGET_SETTLEMENT_FAILED"
  const completeAfter=completeBefore+completed
  await admin.from("data_ingestion_runs").update({status:terminal?"FAILED":"SUCCEEDED",completed_at:new Date().toISOString(),attempted_call_count:attempted,accepted_count:completed,failed_count:terminal?1:0,error_summary:terminal,metadata:{mode:"P8_B4_4",complete_before:completeBefore,complete_after:completeAfter,total_exact:exact.length,consumed_units:succeeded,failed_units:failed,released_units:released,captures,canonical_promotion_performed:false,b4_schema_write_performed:false}}).eq("id",runId)
  return reply(terminal?502:200,{state:terminal?"FAILED_SAFE":"PASS",runId,providerCalls:attempted,budgetConsumed:succeeded,budgetFailed:failed,budgetReleased:released,completedThisRun:completed,completeAfter,totalExact:exact.length,remaining:exact.length-completeAfter,usedTodayBefore:usedToday,usedTodayAfter:usedToday+attempted,terminalError:terminal,canonicalPromotionPerformed:false,b4SchemaWritePerformed:false})
})
