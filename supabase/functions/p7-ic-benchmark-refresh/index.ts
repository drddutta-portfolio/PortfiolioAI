
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { AngelOneProvider, loadAngelOneConfig } from "../_shared/angel-one.ts"
import { consumeP4ExecutionGrant } from "../_shared/p4-execution-grant.ts"
import { P7_IC_BENCHMARK_REGISTRY } from "../_shared/p7-ic-benchmark-adapter.ts"
import {
  V1_4_BATCH_B_CODES,
  V1_4_BATCH_B_CONTRACT_VERSION,
  V1_4_BATCH_B_MAX_ROWS_PER_BENCHMARK,
  V1_4_BATCH_B_MAX_TOTAL_ROWS,
  batchBRequestWindow,
  emptyBatchBCounters,
  exactOriginalBatchBOrder,
  preflightAllBenchmarkIdentities,
  validateBatchBHistoryResponse,
  type BatchBCounters,
  type MasterRow,
} from "../_shared/v14-batch-b-contract.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })

const DEV_REF = "lrgpjimipfkyoqbpsqzz"
const PROD_REF = "uxiyufbsbgzzdujzcdxe"
const PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2"
const MASTER_URL = "https://margincalculator.angelone.in/OpenAPI_File/files/OpenAPIScripMaster.json"
const MASTER_CONFIRMATION = "OWNER_CONFIRMED_V1_4_BATCH_B_MASTER_PREFLIGHT"
const EXECUTE_CONFIRMATION = "OWNER_CONFIRMED_V1_4_BATCH_B_RESUME"
const MASTER_KIND = "V1_4_ANGEL_INSTRUMENT_MASTER"
const MASTER_SENTINEL = "P7_IC2_BATCH_B_MASTER_PREFLIGHT"
const EXECUTE_SENTINEL = "P7_IC2_BENCHMARKS:" + V1_4_BATCH_B_CODES.join(",")

type Action = "P7_IC2_PLAN" | "P7_IC2_PREFLIGHT_EXISTING_MASTER" | "P7_IC2_CAPTURE_MASTER" | "P7_IC2_EXECUTE_BATCH_B_V1"
type Body = {
  readonly action?: unknown
  readonly portfolioId?: unknown
  readonly benchmarkCodes?: unknown
  readonly cutoffDate?: unknown
  readonly masterSourceRecordId?: unknown
  readonly confirmation?: unknown
  readonly grantId?: unknown
}

function projectRef(value: string) {
  try { return new URL(value).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1] ?? null } catch { return null }
}
function kolkataDateTime(date: Date) {
  const local = new Date(date.getTime() + 5.5 * 60 * 60_000)
  return local.toISOString().slice(0, 10) + " " + local.toISOString().slice(11, 16)
}
async function sha256Text(value:string) {
  const bytes=new TextEncoder().encode(value)
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))).map(x=>x.toString(16).padStart(2,"0")).join("")
}
function safeCode(error:unknown) {
  return error instanceof Error && /^P7_IC_[A-Z0-9_]+$/u.test(error.message) ? error.message : "P7_IC_BENCHMARK_REFRESH_FAILED"
}
function actionCounters(counters:BatchBCounters) {
  return { ...counters, providerCalls: counters.instrumentMasterRequests + counters.attemptedHistoryRequests }
}
function requestedCodes(body:Body) {
  return Array.isArray(body.benchmarkCodes) && body.benchmarkCodes.every(x=>typeof x==="string") ? body.benchmarkCodes as string[] : []
}
function definitionsForBatchB() {
  return P7_IC_BENCHMARK_REGISTRY.filter(x=>V1_4_BATCH_B_CODES.includes(x.code as typeof V1_4_BATCH_B_CODES[number]))
}
async function loadRetainedMaster(admin:ReturnType<typeof createClient>,id:unknown) {
  if (typeof id!=="string" || !/^[0-9a-f-]{36}$/iu.test(id)) throw new Error("P7_IC_BENCHMARK_MASTER_ARTIFACT_REQUIRED")
  const r=await admin.from("data_source_records")
    .select("id,source_code,record_kind,source_url,retrieved_at,payload_hash,raw_payload")
    .eq("id",id).eq("source_code","ANGEL_ONE").eq("record_kind",MASTER_KIND).maybeSingle()
  if(r.error||!r.data)throw new Error("P7_IC_BENCHMARK_MASTER_ARTIFACT_NOT_FOUND")
  const body=(r.data.raw_payload as Record<string,unknown>)?.body_text
  if(typeof body!=="string")throw new Error("P7_IC_BENCHMARK_MASTER_BODY_MISSING")
  if(await sha256Text(body)!==r.data.payload_hash)throw new Error("P7_IC_BENCHMARK_MASTER_HASH_MISMATCH")
  let parsed:unknown
  try{parsed=JSON.parse(body)}catch{throw new Error("P7_IC_BENCHMARK_MASTER_JSON_INVALID")}
  if(!Array.isArray(parsed))throw new Error("P7_IC_BENCHMARK_MASTER_SCHEMA_INVALID")
  return {
    recordId:r.data.id as string,
    sourceUrl:r.data.source_url as string|null,
    retrievedAt:r.data.retrieved_at as string,
    payloadHash:r.data.payload_hash as string,
    rows:parsed as readonly MasterRow[],
  }
}
async function persistUsage(admin:ReturnType<typeof createClient>,input:{
  idempotencyKey:string; operationClass:string; attemptedAt:string; completedAt:string; outcome:string; units:number; safeErrorCode?:string|null
}) {
  const r=await admin.from("provider_usage_events").upsert({
    source_code:"ANGEL_ONE",
    ingestion_run_id:null,
    run_item_id:null,
    security_id:null,
    data_domain:"BENCHMARK_HISTORY",
    operation_class:input.operationClass,
    accounting_class:"EXTERNAL_REQUEST",
    estimated_internal_units:1,
    actual_internal_units:input.units,
    provider_reported_units:null,
    attempted_at:input.attemptedAt,
    completed_at:input.completedAt,
    outcome:input.outcome,
    safe_error_code:input.safeErrorCode??null,
    retry_attempt:0,
    idempotency_key:input.idempotencyKey,
  },{onConflict:"idempotency_key"})
  if(r.error)throw new Error("P7_IC_PROVIDER_USAGE_PERSIST_FAILED")
}
async function consumeGrant(admin:ReturnType<typeof createClient>,body:Body,action:Action,sentinel:string) {
  const grant=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action,portfolioId:PORTFOLIO_ID,securityId:sentinel})
  if(!grant.ok)throw new Error(grant.code)
}
function validateBody(body:Body,action:Action) {
  if(body.portfolioId!==PORTFOLIO_ID)throw new Error("P7_IC_FROZEN_PORTFOLIO_REQUIRED")
  const codes=requestedCodes(body)
  if(!exactOriginalBatchBOrder(codes))throw new Error("P7_IC_BATCH_B_EXACT_ORDER_REQUIRED")
  if(typeof body.cutoffDate!=="string"||!/^\d{4}-\d{2}-\d{2}$/u.test(body.cutoffDate))throw new Error("P7_IC_BENCHMARK_CUTOFF_INVALID")
  if(action==="P7_IC2_CAPTURE_MASTER"&&body.confirmation!==MASTER_CONFIRMATION)throw new Error("P7_IC_BATCH_B_MASTER_CONFIRMATION_REQUIRED")
  if(action==="P7_IC2_EXECUTE_BATCH_B_V1"&&body.confirmation!==EXECUTE_CONFIRMATION)throw new Error("P7_IC_BATCH_B_EXECUTE_CONFIRMATION_REQUIRED")
  return {codes,cutoffDate:body.cutoffDate}
}

Deno.serve(async request=>{
  if(request.method==="OPTIONS")return new Response("ok",{headers:cors})
  if(request.method!=="POST")return json(405,{error:"Method not allowed.",...actionCounters(emptyBatchBCounters())})
  const supabaseUrl=Deno.env.get("SUPABASE_URL"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if(!supabaseUrl||!serviceKey)return json(500,{error:"Supabase server configuration is incomplete.",...actionCounters(emptyBatchBCounters())})
  const ref=projectRef(supabaseUrl)
  if(ref===PROD_REF)return json(409,{error:"Refuses Production.",code:"UNEXPECTED_PRODUCTION_DB_TARGET",...actionCounters(emptyBatchBCounters())})
  if(ref!==DEV_REF)return json(409,{error:"Requires PortfolioAI Dev.",code:"UNAPPROVED_DEVELOPMENT_DB_TARGET",...actionCounters(emptyBatchBCounters())})

  const counters=emptyBatchBCounters()
  const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false}})
  let leaseHolder:string|null=null
  try{
    const body=await request.json() as Body
    const action=body.action as Action
    if(!["P7_IC2_PLAN","P7_IC2_PREFLIGHT_EXISTING_MASTER","P7_IC2_CAPTURE_MASTER","P7_IC2_EXECUTE_BATCH_B_V1"].includes(action))
      return json(400,{error:"Unknown action.",code:"P7_IC_UNKNOWN_ACTION",...actionCounters(counters)})
    const {codes,cutoffDate}=validateBody(body,action)
    const window=batchBRequestWindow(cutoffDate)

    if(action==="P7_IC2_PLAN"){
      const existing=await admin.from("data_source_records").select("id,retrieved_at,payload_hash,source_url")
        .eq("source_code","ANGEL_ONE").eq("record_kind",MASTER_KIND).order("retrieved_at",{ascending:false}).limit(10)
      if(existing.error)throw new Error("P7_IC_BENCHMARK_MASTER_SEARCH_FAILED")
      return json(200,{
        mode:"P7_IC2_BATCH_B_PLAN",version:V1_4_BATCH_B_CONTRACT_VERSION,codes,window,
        retainedMasterArtifacts:existing.data??[],masterReplacementRequired:(existing.data?.length??0)===0,
        freshGrantRequired:true,oldGrantReusable:false,
        rowCeilings:{perBenchmark:V1_4_BATCH_B_MAX_ROWS_PER_BENCHMARK,total:V1_4_BATCH_B_MAX_TOTAL_ROWS},
        ...actionCounters(counters),
      })
    }

    if(action==="P7_IC2_CAPTURE_MASTER"){
      await consumeGrant(admin,body,action,MASTER_SENTINEL)
      const attemptedAt=new Date().toISOString()
      counters.instrumentMasterRequests+=1
      let response:Response
      try{response=await fetch(MASTER_URL,{headers:{Accept:"application/json"}})}
      catch(error){
        await persistUsage(admin,{idempotencyKey:"V1_4_BATCH_B_MASTER_"+String(body.grantId),operationClass:"INSTRUMENT_MASTER",attemptedAt,completedAt:new Date().toISOString(),outcome:"FAILED",units:1,safeErrorCode:"P7_IC_BENCHMARK_MASTER_FETCH_FAILED"})
        throw error
      }
      const bodyText=await response.text()
      const completedAt=new Date().toISOString()
      if(!response.ok) {
        await persistUsage(admin,{idempotencyKey:"V1_4_BATCH_B_MASTER_"+String(body.grantId),operationClass:"INSTRUMENT_MASTER",attemptedAt,completedAt,outcome:"FAILED",units:1,safeErrorCode:"P7_IC_BENCHMARK_MASTER_HTTP_FAILED"})
        throw new Error("P7_IC_BENCHMARK_MASTER_HTTP_FAILED")
      }
      let parsed:unknown
      try{parsed=JSON.parse(bodyText)}catch{throw new Error("P7_IC_BENCHMARK_MASTER_JSON_INVALID")}
      if(!Array.isArray(parsed))throw new Error("P7_IC_BENCHMARK_MASTER_SCHEMA_INVALID")
      const hash=await sha256Text(bodyText)
      const record=await admin.from("data_source_records").insert({
        source_code:"ANGEL_ONE",record_kind:MASTER_KIND,external_record_id:"V1_4_BATCH_B_MASTER_"+completedAt,
        source_observed_at:completedAt,retrieved_at:completedAt,payload_hash:hash,source_url:MASTER_URL,
        raw_payload:{http_status:response.status,content_type:response.headers.get("content-type"),byte_length:new TextEncoder().encode(bodyText).length,body_text:bodyText,row_count:parsed.length,semantic_validation:"PASS"},
        terms_snapshot:{mode:"V1_4_BATCH_B_MASTER_PREFLIGHT",retry_attempt:0,history_calls:0},
      }).select("id").single()
      if(record.error)throw new Error("P7_IC_BENCHMARK_MASTER_PERSIST_FAILED")
      await persistUsage(admin,{idempotencyKey:"V1_4_BATCH_B_MASTER_"+String(body.grantId),operationClass:"INSTRUMENT_MASTER",attemptedAt,completedAt,outcome:"SUCCEEDED",units:1})
      const preflight=preflightAllBenchmarkIdentities(definitionsForBatchB(),codes,parsed as readonly MasterRow[])
      return json(200,{mode:"P7_IC2_BATCH_B_MASTER_PREFLIGHT",masterSourceRecordId:record.data.id,master:{sourceUrl:MASTER_URL,retrievedAt:completedAt,payloadHash:hash,rowCount:parsed.length},preflight,allExact:preflight.every(x=>x.status==="EXACT_MATCH"),...actionCounters(counters)})
    }

    const retained=await loadRetainedMaster(admin,body.masterSourceRecordId)
    const preflight=preflightAllBenchmarkIdentities(definitionsForBatchB(),codes,retained.rows)
    if(action==="P7_IC2_PREFLIGHT_EXISTING_MASTER"){
      return json(200,{mode:"P7_IC2_BATCH_B_EXISTING_MASTER_PREFLIGHT",master:{recordId:retained.recordId,sourceUrl:retained.sourceUrl,retrievedAt:retained.retrievedAt,payloadHash:retained.payloadHash},preflight,allExact:preflight.every(x=>x.status==="EXACT_MATCH"),...actionCounters(counters)})
    }

    await consumeGrant(admin,body,action,EXECUTE_SENTINEL)
    if(!preflight.every(x=>x.status==="EXACT_MATCH"))
      return json(409,{error:"All twelve exact benchmark identities must pass before history acquisition.",code:"P7_IC_BATCH_B_PREFLIGHT_NOT_ALL_EXACT",masterSourceRecordId:retained.recordId,preflight,...actionCounters(counters)})

    const lease=await admin.rpc("acquire_market_data_operation_lease",{p_portfolio_id:PORTFOLIO_ID,p_provider_code:"ANGEL_ONE",p_operation:"REFRESH_HISTORY",p_lease_holder:crypto.randomUUID(),p_lease_seconds:900})
    if(lease.error||lease.data?.[0]?.acquired!==true)throw new Error("P7_IC_BENCHMARK_LEASE_UNAVAILABLE")
    leaseHolder=String(lease.data[0].lease_holder??"")
    const anchor=await admin.from("current_holdings").select("security_id").eq("portfolio_id",PORTFOLIO_ID).limit(1).single()
    if(anchor.error)throw new Error("P7_IC_BENCHMARK_ANCHOR_MISSING")
    const provider=new AngelOneProvider(loadAngelOneConfig())
    const results:Record<string,unknown>[]=[]

    for(const code of codes){
      const identity=preflight.find(x=>x.code===code)?.identity
      if(!identity)throw new Error("P7_IC_BENCHMARK_MAPPING_MISSING")
      const attemptedAt=new Date().toISOString()
      counters.attemptedHistoryRequests+=1
      let candles
      try{
        const from=new Date(window.requestFrom+"T00:00:00Z")
        const to=new Date(window.requestTo+"T00:00:00Z")
        candles=await provider.getDailyHistory({
          mappingId:code,securityId:String(anchor.data.security_id),providerInstrumentId:identity.token,
          exchange:identity.exchange,tradingSymbol:identity.symbol,
        },kolkataDateTime(from),kolkataDateTime(new Date(to.getTime()+86400000-1)))
        counters.successfulHistoryResponses+=1
      }catch(error){
        await persistUsage(admin,{idempotencyKey:"V1_4_BATCH_B_HISTORY_"+String(body.grantId)+"_"+code,operationClass:"HISTORY",attemptedAt,completedAt:new Date().toISOString(),outcome:"FAILED",units:1,safeErrorCode:safeCode(error)})
        throw error
      }
      const validated=validateBatchBHistoryResponse({candles,requestFrom:window.requestFrom,requestTo:window.requestTo,cutoffDate:window.cutoffDate,alreadyAcceptedTotal:counters.acceptedRows})
      counters.acceptedRows+=validated.rows.length

      const mappingWrite=await admin.from("market_benchmarks").upsert({
        code,name:P7_IC_BENCHMARK_REGISTRY.find(x=>x.code===code)!.displayName,provider_code:"ANGEL_ONE",
        provider_instrument_id:identity.token,exchange:identity.exchange,trading_symbol:identity.symbol,mapping_status:"VERIFIED",
        mapping_evidence:{method:identity.resolutionBasis,matched_alias:identity.matchedAlias,matched_field:identity.matchedField,master_source_record_id:retained.recordId,master_payload_hash:retained.payloadHash,contract_version:V1_4_BATCH_B_CONTRACT_VERSION},
        verified_at:new Date().toISOString(),updated_at:new Date().toISOString(),
      },{onConflict:"code"})
      if(mappingWrite.error)throw new Error("P7_IC_BENCHMARK_MAPPING_WRITE_FAILED")

      const payload=validated.rows.map(candle=>({
        benchmark_code:code,provider_code:"ANGEL_ONE",interval:"ONE_DAY",period_start:candle.periodStart,
        open:candle.open,high:candle.high,low:candle.low,close:candle.close,volume:candle.volume,retrieved_at:candle.retrievedAt,
        provenance:{contract_version:V1_4_BATCH_B_CONTRACT_VERSION,master_source_record_id:retained.recordId,master_payload_hash:retained.payloadHash,requested_from:window.requestFrom,requested_to:window.requestTo,cutoff_date:window.cutoffDate,identity_token:identity.token,identity_symbol:identity.symbol},
      }))
      if(payload.length>V1_4_BATCH_B_MAX_ROWS_PER_BENCHMARK||counters.persistedRows+payload.length>V1_4_BATCH_B_MAX_TOTAL_ROWS)throw new Error("P7_IC_BENCHMARK_WRITE_CEILING_EXCEEDED")
      const write=await admin.from("market_benchmark_price_history").upsert(payload,{onConflict:"benchmark_code,provider_code,interval,period_start"}).select("benchmark_code")
      if(write.error)throw new Error("P7_IC_BENCHMARK_HISTORY_WRITE_FAILED")
      const persisted=write.data?.length??0
      if(persisted!==payload.length)throw new Error("P7_IC_BENCHMARK_PERSIST_COUNT_MISMATCH")
      counters.persistedRows+=persisted
      const completedAt=new Date().toISOString()
      await persistUsage(admin,{idempotencyKey:"V1_4_BATCH_B_HISTORY_"+String(body.grantId)+"_"+code,operationClass:"HISTORY",attemptedAt,completedAt,outcome:"SUCCEEDED",units:1})
      results.push({code,status:"REFRESHED",identity,requestWindow:window,distinctSessions:validated.distinctSessions,firstSession:validated.firstSession,lastSession:validated.lastSession,acceptedRows:validated.rows.length,persistedRows:persisted})
    }
    return json(200,{mode:"P7_IC2_BATCH_B_EXECUTED",contractVersion:V1_4_BATCH_B_CONTRACT_VERSION,masterSourceRecordId:retained.recordId,preflight,results,...actionCounters(counters)})
  }catch(error){
    return json(409,{error:"P7-IC Batch B failed safely.",code:safeCode(error),...actionCounters(counters)})
  }finally{
    if(leaseHolder){
      await admin.rpc("release_market_data_operation_lease",{p_portfolio_id:PORTFOLIO_ID,p_provider_code:"ANGEL_ONE",p_operation:"REFRESH_HISTORY",p_lease_holder:leaseHolder}).catch(()=>undefined)
    }
  }
})
