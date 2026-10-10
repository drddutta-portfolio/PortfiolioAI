import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {AngelOneProvider,AngelProviderError,loadAngelOneConfig} from "../_shared/angel-one.ts"
import {consumeP4ExecutionGrant} from "../_shared/p4-execution-grant.ts"
import {validateBankTail,bankTailDay} from "../_shared/v14-bank-tail-validation.ts"
import scope from "./scope.json" with {type:"json"}

const PROJECT="lrgpjimipfkyoqbpsqzz"
const PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2"
const ACTION="V1_4_BANK_MAINTENANCE_DAILY_V1"
const SOURCE="ANGEL_ONE"
const HISTORY_LIMIT=14
const SESSION_RE=/^\d{4}-\d{2}-\d{2}$/

const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{
 status,headers:{"content-type":"application/json","cache-control":"no-store"},
})
const hash=async(value:unknown)=>Array.from(
 new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(value)))),
).map(x=>x.toString(16).padStart(2,"0")).join("")
const safe=(error:unknown)=>{
 if(error instanceof AngelProviderError)return error.code
 if(error instanceof Error&&/^BANK_MAINTENANCE_[A-Z0-9_]+$/u.test(error.message))return error.message
 return "BANK_MAINTENANCE_PROVIDER_OR_RUNTIME_FAILURE"
}

Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,{code:"METHOD_NOT_ALLOWED"})
 const url=Deno.env.get("SUPABASE_URL")??""
 const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
 if(url!==`https://${PROJECT}.supabase.co`||!key)return reply(409,{code:"DEVELOPMENT_TARGET_REQUIRED"})
 try{
  const body=await req.json() as Record<string,unknown>
  const sessionDate=String(body.sessionDate??"")
  const calendarDecisionId=String(body.calendarDecisionId??"")
  if(body.action!==ACTION||body.portfolioId!==PORTFOLIO||!SESSION_RE.test(sessionDate)||!calendarDecisionId)
    return reply(400,{code:"BANK_MAINTENANCE_SCOPE_INVALID"})
  const admin=createClient(url,key,{auth:{persistSession:false}})

  const decision=await admin.from("data_source_records")
   .select("id,source_code,record_kind,raw_payload,payload_hash")
   .eq("id",calendarDecisionId)
   .eq("source_code","NSE_OFFICIAL")
   .eq("record_kind","V1_4_NSE_SESSION_CALENDAR_DECISION")
   .single()
  if(decision.error||decision.data?.raw_payload?.session_date!==sessionDate||decision.data?.raw_payload?.decision!=="OPEN")
    return reply(409,{code:"BANK_MAINTENANCE_CALENDAR_NOT_OPEN"})

  const sentinel=`BANKING_13_PLUS_NIFTY_BANK:${sessionDate}`
  const grant=await consumeP4ExecutionGrant(admin,{
   grantId:body.grantId,action:ACTION,portfolioId:PORTFOLIO,securityId:sentinel,
  })
  if(!grant.ok)return reply(401,{code:grant.code})

  const run=await admin.from("data_ingestion_runs").insert({
   source_code:SOURCE,operation:ACTION,portfolio_id:PORTFOLIO,
   orchestration_type:"V1_4_BANK_MAINTENANCE_DAILY",trigger_source:"SCHEDULED",
   status:"RUNNING",requested_count:HISTORY_LIMIT,estimated_call_count:HISTORY_LIMIT,
   reserved_call_count:HISTORY_LIMIT,attempted_call_count:0,
   metadata:{grant_id:body.grantId,session:sessionDate,retry_policy:"ZERO",scheduler:true,calendar_decision_id:calendarDecisionId},
  }).select("id").single()
  if(run.error||!run.data?.id)throw new Error("BANK_MAINTENANCE_RUN_CREATE_FAILED")
  const runId=String(run.data.id)

  const reservation=await admin.rpc("reserve_provider_budget_v1",{
   p_source_code:SOURCE,p_ingestion_run_id:runId,
   p_reservation_key:`${ACTION}:${body.grantId}`,p_estimated_units:HISTORY_LIMIT,p_reservation_seconds:1800,
  })
  const reserved=Array.isArray(reservation.data)?reservation.data[0]:null
  if(reservation.error||!reserved?.reserved||!reserved.reservation_id){
   await admin.from("data_ingestion_runs").update({
    status:"FAILED",completed_at:new Date().toISOString(),
    error_summary:String(reserved?.reason_code??"BANK_MAINTENANCE_BUDGET_RESERVATION_FAILED"),
   }).eq("id",runId)
   return reply(409,{code:"BANK_MAINTENANCE_BUDGET_RESERVATION_FAILED",reason:reserved?.reason_code??null,runId})
  }
  const reservationId=String(reserved.reservation_id)

  const transport={authenticationRequests:0,authenticationResponses:0,historyRequests:0}
  const provider=new AngelOneProvider(loadAngelOneConfig(),{
   onAttempt(kind){
    if(kind==="AUTHENTICATE"&&++transport.authenticationRequests>1)throw new Error("BANK_MAINTENANCE_AUTH_LIMIT")
    if(kind==="HISTORY"&&++transport.historyRequests>HISTORY_LIMIT)throw new Error("BANK_MAINTENANCE_REQUEST_LIMIT")
   },
   onResponse(kind,ok){if(kind==="AUTHENTICATE"&&ok)transport.authenticationResponses+=1},
  })

  const results:Array<Record<string,unknown>>=[]
  let consumed=0,failed=0
  try{
   for(const target of scope){
    const stock=target.kind==="STOCK"
    const table=stock?"market_price_history":"market_benchmark_price_history"
    const identity=stock?"security_id":"benchmark_code"
    try{
     if(stock){
      const held=await admin.from("current_holdings").select("security_id")
       .eq("portfolio_id",PORTFOLIO).eq("security_id",target.target).gt("current_quantity",0).maybeSingle()
      if(held.error||!held.data)throw new Error("BANK_MAINTENANCE_OPEN_HOLDING_REQUIRED")
      const mapping=await admin.from("market_data_instrument_mappings")
       .select("id,provider_instrument_id,exchange,trading_symbol,mapping_status")
       .eq("id",target.mappingId).eq("security_id",target.target).eq("provider_code",SOURCE).single()
      if(mapping.error||mapping.data.mapping_status!=="VERIFIED"||mapping.data.provider_instrument_id!==target.token
       ||mapping.data.exchange!==target.exchange||mapping.data.trading_symbol!==target.tradingSymbol)
        throw new Error("BANK_MAINTENANCE_MAPPING_CHANGED")
     }else{
      const mapping=await admin.from("market_benchmarks")
       .select("provider_code,provider_instrument_id,exchange,trading_symbol,mapping_status")
       .eq("code",target.target).single()
      if(mapping.error||mapping.data.mapping_status!=="VERIFIED"||mapping.data.provider_code!==SOURCE
       ||mapping.data.provider_instrument_id!==target.token||mapping.data.exchange!==target.exchange
       ||mapping.data.trading_symbol!==target.tradingSymbol)
        throw new Error("BANK_MAINTENANCE_BENCHMARK_MAPPING_CHANGED")
     }

     const retained=await admin.from(table).select("period_start")
      .eq(identity,target.target).eq("provider_code",SOURCE).eq("interval","ONE_DAY")
      .gte("period_start",sessionDate+"T00:00:00+05:30").lte("period_start",sessionDate+"T23:59:59+05:30")
     if(retained.error)throw new Error("BANK_MAINTENANCE_EXISTING_READ_FAILED")
     const existing=new Set((retained.data??[]).map(x=>bankTailDay(String(x.period_start))))
     if(existing.has(sessionDate)){results.push({target:target.target,status:"SKIPPED_CURRENT"});continue}

     const before=transport.historyRequests
     const attemptedAt=new Date().toISOString()
     try{
      const candles=await provider.getDailyHistoryNoRetry({
       mappingId:target.mappingId,securityId:stock?target.target:scope[0].target,
       providerInstrumentId:target.token,exchange:target.exchange,tradingSymbol:target.tradingSymbol,
      },sessionDate+" 00:00",sessionDate+" 23:59")
      if(transport.historyRequests<=before)throw new Error("BANK_MAINTENANCE_HISTORY_ATTEMPT_NOT_OBSERVED")
      consumed+=1
      await admin.rpc("record_provider_usage_event_v1",{
       p_source_code:SOURCE,p_ingestion_run_id:runId,p_run_item_id:null,p_security_id:stock?target.target:null,
       p_data_domain:"MARKET_HISTORY",p_operation_class:stock?"BANK_HISTORY":"BENCHMARK_HISTORY",
       p_accounting_class:"PROVIDER_TOOL_ATTEMPT",p_estimated_internal_units:1,p_actual_internal_units:1,
       p_attempted_at:attemptedAt,p_completed_at:new Date().toISOString(),p_outcome:"SUCCEEDED",
       p_safe_error_code:null,p_retry_attempt:0,p_idempotency_key:`${ACTION}:${sessionDate}:${target.target}:HISTORY`,
      })
      validateBankTail(candles,sessionDate,sessionDate)
      if(!candles.some(c=>bankTailDay(c.periodStart)===sessionDate))throw new Error("BANK_MAINTENANCE_FINAL_SESSION_MISSING")
      if(candles.some(c=>existing.has(bankTailDay(c.periodStart))))throw new Error("BANK_MAINTENANCE_OVERLAP_REQUIRES_REVIEW")

      const retrievedAt=new Date().toISOString()
      const payload={version:ACTION,target:target.target,kind:target.kind,session_date:sessionDate,token:target.token,candles,
        calendar_decision_id:calendarDecisionId}
      const raw=await admin.from("data_source_records").insert({
       source_code:SOURCE,record_kind:"V1_4_BANK_MAINTENANCE_DAILY_CAPTURE",
       external_record_id:`${sessionDate}:${target.target}`,retrieved_at:retrievedAt,
       payload_hash:await hash(payload),raw_payload:payload,
       terms_snapshot:{operation:ACTION,retry_policy:"ZERO",owner_approved:true,reservation_id:reservationId,
        ingestion_run_id:runId,calendar_decision_id:calendarDecisionId},
      }).select("id").single()
      if(raw.error)throw new Error("BANK_MAINTENANCE_RAW_WRITE_FAILED")

      const rows=candles.map(c=>({
       [identity]:target.target,provider_code:SOURCE,interval:"ONE_DAY",period_start:c.periodStart,
       open:c.open,high:c.high,low:c.low,close:c.close,volume:c.volume,retrieved_at:c.retrievedAt,
       ...(stock?{mapping_id:target.mappingId,adjusted_close:null}:{}),
       provenance:{source_record_id:raw.data.id,operation:ACTION,requested_from:sessionDate,requested_to:sessionDate,
        exchange:target.exchange,symbol_token:target.token,trading_symbol:target.tradingSymbol,
        ingestion_run_id:runId,reservation_id:reservationId,calendar_decision_id:calendarDecisionId},
      }))
      const written=await admin.from(table).insert(rows)
      if(written.error)throw new Error("BANK_MAINTENANCE_INSERT_FAILED_RAW_RETAINED")
      results.push({target:target.target,status:"INGESTED_NOT_QUALIFIED",rows:rows.length,sourceRecordId:raw.data.id})
     }catch(error){
      const attempted=transport.historyRequests>before
      if(attempted&&consumed+failed<transport.historyRequests){
       failed+=1
       await admin.rpc("record_provider_usage_event_v1",{
        p_source_code:SOURCE,p_ingestion_run_id:runId,p_run_item_id:null,p_security_id:stock?target.target:null,
        p_data_domain:"MARKET_HISTORY",p_operation_class:stock?"BANK_HISTORY":"BENCHMARK_HISTORY",
        p_accounting_class:"PROVIDER_TOOL_ATTEMPT",p_estimated_internal_units:1,p_actual_internal_units:1,
        p_attempted_at:attemptedAt,p_completed_at:new Date().toISOString(),p_outcome:"FAILED",
        p_safe_error_code:safe(error),p_retry_attempt:0,p_idempotency_key:`${ACTION}:${sessionDate}:${target.target}:HISTORY`,
       })
      }
      throw error
     }
    }catch(error){
     const code=safe(error);results.push({target:target.target,status:"FAILED",code})
     if((error instanceof AngelProviderError&&error.sessionExpired)||transport.authenticationRequests===0||code==="BANK_MAINTENANCE_AUTH_LIMIT")break
    }
    await new Promise(resolve=>setTimeout(resolve,1100))
   }
  }finally{
   const accounted=consumed+failed,released=Math.max(0,HISTORY_LIMIT-accounted)
   await admin.rpc("settle_provider_budget_v1",{p_reservation_id:reservationId,p_consumed_units:consumed,p_failed_units:failed,p_released_units:released})
   if(transport.authenticationRequests>0){
    await admin.rpc("record_provider_usage_event_v1",{
     p_source_code:SOURCE,p_ingestion_run_id:runId,p_run_item_id:null,p_security_id:null,p_data_domain:"AUTH",
     p_operation_class:"AUTHENTICATE",p_accounting_class:"TRANSPORT_BOOTSTRAP",p_estimated_internal_units:0,p_actual_internal_units:0,
     p_attempted_at:new Date().toISOString(),p_completed_at:new Date().toISOString(),
     p_outcome:transport.authenticationResponses>0?"SUCCEEDED":"FAILED",
     p_safe_error_code:transport.authenticationResponses>0?null:"BANK_MAINTENANCE_AUTHENTICATION_FAILED",
     p_retry_attempt:0,p_idempotency_key:`${ACTION}:${sessionDate}:AUTH`,
    })
   }
   const failures=results.filter(x=>x.status==="FAILED").length
   const ingested=results.filter(x=>x.status==="INGESTED_NOT_QUALIFIED").length
   await admin.from("data_ingestion_runs").update({
    status:failures===0?"SUCCEEDED":ingested>0?"PARTIAL":"FAILED",completed_at:new Date().toISOString(),
    fetched_count:ingested,failed_count:failures,attempted_call_count:accounted,accepted_count:ingested,
    error_summary:failures?results.filter(x=>x.status==="FAILED").map(x=>String(x.code)).join(",").slice(0,1000):null,
    metadata:{grant_id:body.grantId,session:sessionDate,retry_policy:"ZERO",scheduler:true,transport,
     reservation_id:reservationId,consumed_units:consumed,failed_units:failed,released_units:released,
     calendar_decision_id:calendarDecisionId},
   }).eq("id",runId)
  }
  return reply(200,{action:ACTION,sessionDate,runId,reservationId,transport,results,canonicalMaterialization:false})
 }catch(error){return reply(500,{code:safe(error)})}
})