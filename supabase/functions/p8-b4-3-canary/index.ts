import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SOURCE_CODE = "TRENDLYNE_MCP"
const PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2"
const REQUESTED_BY = "f9e48c4c-d796-424b-95f7-2a4a97149543"
const OPERATION = "P8_B4_3_CANARY"
const CONFIRMATION = "P8_B4_3_OWNER_AUTH_2026_10_03"
const RESERVED_UNITS = 6
const MAX_CAPTURE_BYTES = 512 * 1024

const COHORT = [
  {
    symbol: "MGL",
    securityId: "fbc6ce5f-afd3-460f-9d4d-cdbaf4737eff",
    historicalIdentityId: "499b6a54-c8c4-5f15-9019-75b665f3c09c",
    isin: "INE002S01010",
    providerId: "4581",
    cacheState: "ABSENT_BOTH",
  },
  {
    symbol: "RELIANCE",
    securityId: "04dd96b3-6772-4871-b52d-60c4a162efe8",
    historicalIdentityId: "4620072a-b43a-5b0f-a090-f96c5561bed8",
    isin: "INE002A01018",
    providerId: "1127",
    cacheState: "FUNDAMENTALS_UNDATED_DOCUMENT_METADATA_PRESENT",
  },
  {
    symbol: "HDFCBANK",
    securityId: "b47b007d-1990-4504-a5a2-4391c07687c5",
    historicalIdentityId: "1b6c3a3c-f749-53bf-8a32-bcbda02f0559",
    isin: "INE040A01034",
    providerId: "533",
    cacheState: "PARTIAL_PUBLICATION_DATED_FUNDAMENTALS",
  },
] as const
type CohortMember = (typeof COHORT)[number]

const json = (status:number, body:Record<string,unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type":"application/json" } })

const sha256Hex = async (value:string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join("")
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

Deno.serve(async (req)=>{
  if(req.method!=="POST") return json(405,{error:"Method not allowed"})
  const body=await req.json().catch(()=>({})) as Record<string,unknown>
  if(body.confirmation!==CONFIRMATION) return json(401,{error:"Exact B4-3 owner confirmation required",providerCalls:0})

  const url=Deno.env.get("SUPABASE_URL")
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const mcp=Deno.env.get("TRENDLYNE_MCP_URL")
  if(!url||!service||!mcp) return json(500,{error:"Development provider configuration incomplete",providerCalls:0})
  if(!url.includes("lrgpjimipfkyoqbpsqzz")) return json(409,{error:"Refusing non-Development project",providerCalls:0})

  const admin=createClient(url,service,{auth:{persistSession:false}})

  const prior=await admin.from("data_ingestion_runs")
    .select("id,status,attempted_call_count,error_summary,metadata")
    .eq("source_code",SOURCE_CODE).eq("operation",OPERATION)
    .order("started_at",{ascending:false}).limit(1).maybeSingle()
  if(prior.error) return json(500,{error:"CANARY_PRIOR_RUN_CHECK_FAILED",providerCalls:0})
  if(prior.data) return json(200,{state:"IDEMPOTENT_EXISTING",providerCalls:0,run:prior.data})

  const source=await admin.from("data_sources")
    .select("is_active,entitlement_verified,retention_rights_verified").eq("code",SOURCE_CODE).single()
  const control=await admin.from("provider_ingestion_controls")
    .select("ingestion_enabled,daily_internal_attempt_limit,per_run_internal_attempt_limit,actual_provider_quota_status,policy_version")
    .eq("source_code",SOURCE_CODE).single()
  if(source.error||control.error||!source.data.is_active||!source.data.entitlement_verified||!source.data.retention_rights_verified||
     !control.data.ingestion_enabled||control.data.actual_provider_quota_status!=="VERIFIED"||
     RESERVED_UNITS>control.data.per_run_internal_attempt_limit){
    return json(409,{error:"PROVIDER_CONTROLS_BLOCK_CANARY",providerCalls:0})
  }

  for(const c of COHORT){
    const hist=await admin.from("p8_historical_security_identities")
      .select("id,historical_isin,canonical_security_id").eq("id",c.historicalIdentityId).single()
    if(hist.error||hist.data.historical_isin!==c.isin||hist.data.canonical_security_id!==c.securityId)
      return json(409,{error:"HISTORICAL_IDENTITY_MISMATCH",symbol:c.symbol,providerCalls:0})
    const pid=await admin.from("security_identity_observations")
      .select("provider_instrument_id,observed_isin,evidence_status")
      .eq("security_id",c.securityId).eq("source_code",SOURCE_CODE)
      .eq("evidence_status","MATCHED").not("provider_instrument_id","is",null)
      .order("created_at",{ascending:false}).limit(1).maybeSingle()
    if(pid.error||pid.data?.provider_instrument_id!==c.providerId||pid.data?.observed_isin!==c.isin)
      return json(409,{error:"PROVIDER_IDENTITY_MISMATCH",symbol:c.symbol,providerCalls:0})
  }

  const run=await admin.from("data_ingestion_runs").insert({
    source_code:SOURCE_CODE,portfolio_id:PORTFOLIO_ID,operation:OPERATION,orchestration_type:OPERATION,
    trigger_source:"OWNER",requested_by:REQUESTED_BY,status:"RUNNING",requested_count:COHORT.length,
    estimated_call_count:RESERVED_UNITS,reserved_call_count:RESERVED_UNITS,attempted_call_count:0,
    policy_version:control.data.policy_version,
    metadata:{mode:"P8_B4_3_CANARY",cohort:COHORT.map(x=>({symbol:x.symbol,isin:x.isin,cache_state:x.cacheState})),
      canonical_promotion_performed:false,b4_schema_write_performed:false}
  }).select("id").single()
  if(run.error) return json(500,{error:"RUN_ACCOUNTING_FAILED",providerCalls:0})
  const runId=run.data.id as string

  const reservation=await admin.rpc("reserve_provider_budget_v1",{
    p_source_code:SOURCE_CODE,p_ingestion_run_id:runId,p_reservation_key:`${runId}:P8_B4_3_CANARY`,
    p_estimated_units:RESERVED_UNITS,p_reservation_seconds:900
  })
  const rr=reservation.data?.[0]
  if(reservation.error||!rr?.reserved||!rr.reservation_id){
    await admin.from("data_ingestion_runs").update({status:"FAILED",completed_at:new Date().toISOString(),
      reserved_call_count:0,error_summary:rr?.reason_code??"BUDGET_RESERVATION_FAILED"}).eq("id",runId)
    return json(429,{error:"BUDGET_RESERVATION_FAILED",code:rr?.reason_code,providerCalls:0,runId})
  }

  let attempted=0,succeeded=0,failed=0
  const captures:Record<string,unknown>[]=[]
  let terminal:string|null=null
  const client=new Client(mcp)

  const recordUsage=async(itemId:string,securityId:string,operationClass:string,outcome:"SUCCEEDED"|"FAILED",code:string|null)=>{
    const r=await admin.rpc("record_provider_usage_event_v1",{
      p_source_code:SOURCE_CODE,p_ingestion_run_id:runId,p_run_item_id:itemId,p_security_id:securityId,
      p_data_domain:"P8_B4_POINT_IN_TIME_EVIDENCE",p_operation_class:operationClass,
      p_accounting_class:"PROVIDER_TOOL_ATTEMPT",p_estimated_internal_units:1,p_actual_internal_units:1,
      p_attempted_at:new Date().toISOString(),p_completed_at:new Date().toISOString(),p_outcome:outcome,
      p_safe_error_code:code,p_retry_attempt:0,p_idempotency_key:`${runId}:${operationClass}:${attempted}`
    })
    if(r.error) throw new Error("USAGE_ACCOUNTING_FAILED")
  }

  const capture=async(c:CohortMember,kind:string,tool:string,query:string,result:string)=>{
    const raw={mode:"P8_B4_3_CANARY",run_id:runId,historical_identity_id:c.historicalIdentityId,
      historical_isin:c.isin,security_id:c.securityId,security_symbol:c.symbol,
      provider_instrument_id:c.providerId,provider_tool:tool,query,result}
    const serialized=JSON.stringify(raw)
    if(new TextEncoder().encode(serialized).byteLength>MAX_CAPTURE_BYTES) throw new Error("CAPTURE_PAYLOAD_TOO_LARGE")
    const hash=await sha256Hex(serialized)
    const ins=await admin.from("data_source_records").insert({
      source_code:SOURCE_CODE,ingestion_run_id:runId,record_kind:kind,
      external_record_id:`${c.providerId}:${kind}:${runId}`,retrieved_at:new Date().toISOString(),
      payload_hash:hash,raw_payload:raw,terms_snapshot:{
        mode:"P8_B4_3_CANARY",historical_identity_id:c.historicalIdentityId,historical_isin:c.isin,
        canonical_promotion_performed:false,b4_schema_write_performed:false
      }
    }).select("id").single()
    if(ins.error) throw new Error("CAPTURE_PERSISTENCE_FAILED")
    captures.push({symbol:c.symbol,kind,recordId:ins.data.id,payloadHash:hash,resultLength:result.length})
  }

  for(const c of COHORT){
    if(terminal) break
    const item=await admin.from("data_ingestion_run_items").insert({
      ingestion_run_id:runId,security_id:c.securityId,data_domain:"P8_B4_POINT_IN_TIME_EVIDENCE",
      status:"PLANNED",metadata:{historical_identity_id:c.historicalIdentityId,historical_isin:c.isin,
        cache_state:c.cacheState,planned_calls:2}
    }).select("id").single()
    if(item.error){terminal="RUN_ITEM_ACCOUNTING_FAILED";break}
    const itemId=item.data.id as string
    let itemAttempts=0
    try{
      const fq=`${c.symbol} historical quarterly and annual fundamentals 2023 2024 2025 2026 revenue EBITDA diluted EPS ROCE operating margin with reporting period and publication date`
      attempted++; itemAttempts++
      let fr:string
      try{
        fr=await client.call("get_parameter_values_multi_stock",{query:fq,type:"stock"})
        succeeded++; await recordUsage(itemId,c.securityId,"GET_PARAMETER_VALUES_MULTI_STOCK","SUCCEEDED",null)
      }catch(e){
        failed++; const code=e instanceof Error?e.message:"PROVIDER_REQUEST_FAILED"
        await recordUsage(itemId,c.securityId,"GET_PARAMETER_VALUES_MULTI_STOCK","FAILED",code)
        throw e
      }
      await capture(c,"P8_B4_3_CANARY_FUNDAMENTALS","get_parameter_values_multi_stock",fq,fr)

      const dq=`${c.symbol} annual report quarterly results investor presentation exchange filing 2023 2024 2025 2026 publication date`
      attempted++; itemAttempts++
      let dr:string
      try{
        dr=await client.call("get_document_search_results",{query:dq})
        succeeded++; await recordUsage(itemId,c.securityId,"GET_DOCUMENT_SEARCH_RESULTS","SUCCEEDED",null)
      }catch(e){
        failed++; const code=e instanceof Error?e.message:"PROVIDER_REQUEST_FAILED"
        await recordUsage(itemId,c.securityId,"GET_DOCUMENT_SEARCH_RESULTS","FAILED",code)
        throw e
      }
      await capture(c,"P8_B4_3_CANARY_DOCUMENTS","get_document_search_results",dq,dr)

      const fin=await admin.rpc("record_refresh_item_result_v1",{
        p_run_item_id:itemId,p_status:"ACCEPTED",p_safe_reason_code:null,p_attempted_call_count:itemAttempts,
        p_accepted_record_count:0,p_metadata:{mode:"P8_B4_3_CANARY",raw_captures:2,canonical_promotion_performed:false}
      })
      if(fin.error) throw new Error("RUN_ITEM_ACCOUNTING_FAILED")
    }catch(e){
      terminal=e instanceof Error?e.message:"CANARY_FAILED"
      await admin.rpc("record_refresh_item_result_v1",{
        p_run_item_id:itemId,p_status:"FAILED",p_safe_reason_code:terminal,p_attempted_call_count:itemAttempts,
        p_accepted_record_count:0,p_metadata:{mode:"P8_B4_3_CANARY",canonical_promotion_performed:false}
      })
      break
    }
  }

  const released=RESERVED_UNITS-attempted
  const settle=await admin.rpc("settle_provider_budget_v1",{
    p_reservation_id:rr.reservation_id,p_consumed_units:succeeded,p_failed_units:failed,p_released_units:released
  })
  if(settle.error && !terminal) terminal="BUDGET_SETTLEMENT_FAILED"

  await admin.from("data_ingestion_runs").update({
    status:terminal?"FAILED":"SUCCEEDED",completed_at:new Date().toISOString(),
    attempted_call_count:attempted,accepted_count:terminal?0:COHORT.length,
    failed_count:terminal?1:0,skipped_count:0,error_summary:terminal,
    metadata:{mode:"P8_B4_3_CANARY",consumed_units:succeeded,failed_units:failed,released_units:released,
      captures,canonical_promotion_performed:false,b4_schema_write_performed:false}
  }).eq("id",runId)

  return json(terminal?502:200,{
    state:terminal?"FAILED_SAFE":"PASS",runId,providerCalls:attempted,budgetConsumed:succeeded,
    budgetFailed:failed,budgetReleased:released,captures,terminalError:terminal,
    canonicalPromotionPerformed:false,b4SchemaWritePerformed:false
  })
})
