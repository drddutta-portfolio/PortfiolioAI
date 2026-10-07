import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {AngelOneProvider,loadAngelOneConfig,type AngelTransportObserver} from "../_shared/angel-one.ts"
import {consumeP4ExecutionGrant} from "../_shared/p4-execution-grant.ts"
import type {ProviderInstrument} from "../_shared/market-data.ts"

const DEV_REF="lrgpjimipfkyoqbpsqzz"
const PORTFOLIO_ID="6193a4aa-3235-4057-bddc-209fcf443fc2"
const ACTION="V1_4_INCREMENTAL_BENCHMARK_HISTORY_BATCH"
const CONFIRMATION="OWNER_APPROVED_V1_4_INCREMENTAL_BENCHMARK_HISTORY_2026_10_07"
const CODES=[
 "NIFTY_500","NIFTY_AUTO","NIFTY_BANK","NIFTY_FINANCIAL_SERVICES","NIFTY_FMCG",
 "NIFTY_INFRASTRUCTURE","NIFTY_IT","NIFTY_METAL","NIFTY_PHARMA","NIFTY_REALTY"
] as const
const SENTINEL="V1_4_EXISTING_ANGEL_BENCHMARKS:"+CODES.join(",")
const FROM="2026-09-29",TO="2026-10-06"
const reply=(s:number,b:unknown)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}})
const day=(iso:string)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(iso))
const safe=(e:unknown)=>e instanceof Error?e.message.replace(/[^A-Z0-9_]/giu,"_").toUpperCase().slice(0,80):"BENCHMARK_HISTORY_FAILED"

Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,{code:"METHOD_NOT_ALLOWED"})
 const url=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
 let ref:string|null=null;try{ref=new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1]??null}catch{}
 if(ref!==DEV_REF||!key)return reply(409,{code:"UNAPPROVED_DEVELOPMENT_TARGET"})
 try{
  const body=await req.json() as Record<string,unknown>
  if(body.action!==ACTION||body.confirmation!==CONFIRMATION||body.portfolioId!==PORTFOLIO_ID)return reply(409,{code:"V1_4_BENCHMARK_BATCH_SCOPE_MISMATCH"})
  const admin=createClient(url,key,{auth:{persistSession:false}})
  const grant=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action:ACTION,portfolioId:PORTFOLIO_ID,securityId:SENTINEL})
  if(!grant.ok)return reply(401,{code:grant.code,error:grant.message})

  const maps=await admin.from("market_benchmarks")
   .select("code,provider_code,provider_instrument_id,exchange,trading_symbol,mapping_status,verified_at")
   .in("code",[...CODES]).eq("provider_code","ANGEL_ONE").eq("mapping_status","VERIFIED")
  if(maps.error)throw maps.error
  if((maps.data??[]).length!==CODES.length)return reply(409,{code:"VERIFIED_BENCHMARK_MAPPING_SET_INCOMPLETE",found:(maps.data??[]).length})
  const byCode=new Map((maps.data??[]).map(x=>[String(x.code),x]))
  if(CODES.some(code=>!byCode.get(code)?.provider_instrument_id||!byCode.get(code)?.trading_symbol||!byCode.get(code)?.exchange))
    return reply(409,{code:"VERIFIED_BENCHMARK_MAPPING_FIELDS_INCOMPLETE"})

  const anchor=await admin.from("current_holdings").select("security_id").eq("portfolio_id",PORTFOLIO_ID).gt("current_quantity",0).limit(1).single()
  if(anchor.error||!anchor.data)return reply(409,{code:"BENCHMARK_HISTORY_ANCHOR_MISSING"})

  const run=await admin.from("data_ingestion_runs").insert({
    source_code:"ANGEL_ONE",operation:"V1_4_INCREMENTAL_BENCHMARK_HISTORY",portfolio_id:PORTFOLIO_ID,status:"RUNNING",
    requested_count:CODES.length,estimated_call_count:CODES.length+1,reserved_call_count:CODES.length+1,
    attempted_call_count:0,accepted_count:0,orchestration_type:"V1_4_INCREMENTAL_BENCHMARK_HISTORY",trigger_source:"OWNER",
    metadata:{codes:[...CODES],from:FROM,to:TO,retry_policy:"ZERO",grant_id:String(body.grantId)}
  }).select("id").single()
  if(run.error)throw run.error

  const transport={authenticationRequests:0,historyRequests:0,successfulAuthenticationResponses:0,successfulHistoryResponses:0}
  const observer:AngelTransportObserver={
   onAttempt(kind){if(kind==="AUTHENTICATE")transport.authenticationRequests++;else if(kind==="HISTORY")transport.historyRequests++},
   onResponse(kind,ok){if(kind==="AUTHENTICATE"&&ok)transport.successfulAuthenticationResponses++;if(kind==="HISTORY"&&ok)transport.successfulHistoryResponses++}
  }
  const provider=new AngelOneProvider(loadAngelOneConfig(),observer)
  const results:Array<Record<string,unknown>>=[]
  let persistedRows=0,acceptedRows=0,failed=0

  for(const code of CODES){
   const m=byCode.get(code)!
   const attemptedAt=new Date().toISOString()
   let outcome="UNKNOWN",safeErrorCode:string|null=null,rowsStored=0
   try{
    const instrument:ProviderInstrument={
      mappingId:"BENCHMARK:"+code,securityId:String(anchor.data.security_id),
      providerInstrumentId:String(m.provider_instrument_id),exchange:String(m.exchange),tradingSymbol:String(m.trading_symbol)
    }
    const candles=await provider.getDailyHistoryNoRetry(instrument,FROM+" 00:00",TO+" 23:59")
    const bounded=candles.filter(x=>{const d=day(x.periodStart);return d>=FROM&&d<=TO})
    const sessions=[...new Set(bounded.map(x=>day(x.periodStart)))]
    if(!bounded.length||sessions.length!==bounded.length)throw new Error("BENCHMARK_HISTORY_WINDOW_INVALID")
    const rows=bounded.map(c=>({
      benchmark_code:code,provider_code:"ANGEL_ONE",interval:"ONE_DAY",period_start:c.periodStart,
      open:c.open,high:c.high,low:c.low,close:c.close,volume:c.volume,retrieved_at:c.retrievedAt,
      provenance:{endpoint:"/rest/secure/angelbroking/historical/v1/getCandleData",exchange:instrument.exchange,
       trading_symbol:instrument.tradingSymbol,symbol_token:instrument.providerInstrumentId,
       requested_from:FROM,requested_to:TO,v1_4_incremental:true,retry_policy:"ZERO",
       mapping_verified_at:m.verified_at}
    }))
    const wr=await admin.from("market_benchmark_price_history").upsert(rows,{onConflict:"benchmark_code,provider_code,interval,period_start"})
    if(wr.error)throw wr.error
    rowsStored=rows.length;persistedRows+=rows.length;acceptedRows+=rows.length;outcome="SUCCEEDED"
    results.push({code,state:"SUCCEEDED",rowsStored,firstSession:sessions[0],lastSession:sessions.at(-1)})
   }catch(e){
    failed++;outcome="FAILED";safeErrorCode=safe(e)
    results.push({code,state:"FAILED",codeSafe:safeErrorCode})
   }
   const usage=await admin.from("provider_usage_events").upsert({
     source_code:"ANGEL_ONE",ingestion_run_id:run.data.id,run_item_id:null,security_id:null,
     data_domain:"BENCHMARK_HISTORY",operation_class:"BENCHMARK_HISTORY",accounting_class:"PROVIDER_TOOL_ATTEMPT",
     estimated_internal_units:1,actual_internal_units:1,provider_reported_units:null,
     attempted_at:attemptedAt,completed_at:new Date().toISOString(),outcome,safe_error_code:safeErrorCode,retry_attempt:0,
     idempotency_key:"V1_4_EXISTING_BENCHMARK_"+String(body.grantId)+"_"+code
   },{onConflict:"source_code,idempotency_key"})
   if(usage.error)throw usage.error
  }

  await admin.from("data_ingestion_runs").update({
   status:failed?"PARTIAL":"SUCCEEDED",completed_at:new Date().toISOString(),
   attempted_call_count:transport.authenticationRequests+transport.historyRequests,
   fetched_count:transport.successfulAuthenticationResponses+transport.successfulHistoryResponses,
   accepted_count:acceptedRows,failed_count:failed,error_summary:failed?"PARTIAL_BENCHMARK_HISTORY_FAILURE":null,
   metadata:{codes:[...CODES],from:FROM,to:TO,retry_policy:"ZERO",transport,persistedRows,results}
  }).eq("id",run.data.id)

  return reply(failed?207:200,{mode:ACTION,runId:run.data.id,transport,acceptedRows,persistedRows,failed,results})
 }catch(e){return reply(500,{code:safe(e)})}
})