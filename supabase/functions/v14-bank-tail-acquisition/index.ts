import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {AngelOneProvider,AngelProviderError,loadAngelOneConfig} from "../_shared/angel-one.ts"
import {consumeP4ExecutionGrant} from "../_shared/p4-execution-grant.ts"
import {validateBankTail,bankTailDay} from "../_shared/v14-bank-tail-validation.ts"
import scope from "./scope.json" with {type:"json"}
const PROJECT="lrgpjimipfkyoqbpsqzz",PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2"
const ACTION="V1_4_BANK_TAIL_2026_10_08",SENTINEL="BANKING_13_PLUS_NIFTY_BANK:2026-10-08"
const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store"}})
const hash=async(value:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(value))))).map(x=>x.toString(16).padStart(2,"0")).join("")
Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,{code:"METHOD_NOT_ALLOWED"})
 const url=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
 if(url!==`https://${PROJECT}.supabase.co`||!key)return reply(409,{code:"DEVELOPMENT_TARGET_REQUIRED"})
 try{
  const body=await req.json() as Record<string,unknown>
  if(body.action!==ACTION||body.portfolioId!==PORTFOLIO)return reply(400,{code:"BANK_TAIL_SCOPE_INVALID"})
  const admin=createClient(url,key,{auth:{persistSession:false}})
  const provider=new AngelOneProvider(loadAngelOneConfig(),{onAttempt(kind){
   if(kind==="AUTHENTICATE"&&++transport.authenticationRequests>1)throw new Error("BANK_TAIL_AUTH_LIMIT")
   if(kind==="HISTORY"&&++transport.historyRequests>14)throw new Error("BANK_TAIL_REQUEST_LIMIT")
  }})
  const transport={authenticationRequests:0,historyRequests:0}
  const grant=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action:ACTION,portfolioId:PORTFOLIO,securityId:SENTINEL})
  if(!grant.ok)return reply(401,{code:grant.code})
  const results:Array<Record<string,unknown>>=[]
  for(const target of scope){
   const stock=target.kind==="STOCK",table=stock?"market_price_history":"market_benchmark_price_history",identity=stock?"security_id":"benchmark_code"
   try{
    if(stock){
     const held=await admin.from("current_holdings").select("security_id").eq("portfolio_id",PORTFOLIO).eq("security_id",target.target).gt("current_quantity",0).maybeSingle()
     if(held.error||!held.data)throw new Error("BANK_TAIL_OPEN_HOLDING_REQUIRED")
     const mapping=await admin.from("market_data_instrument_mappings").select("id,provider_instrument_id,exchange,trading_symbol,mapping_status").eq("id",target.mappingId).eq("security_id",target.target).eq("provider_code","ANGEL_ONE").single()
     if(mapping.error||mapping.data.mapping_status!=="VERIFIED"||mapping.data.provider_instrument_id!==target.token||mapping.data.exchange!==target.exchange||mapping.data.trading_symbol!==target.tradingSymbol)throw new Error("BANK_TAIL_MAPPING_CHANGED")
    }else{
     const mapping=await admin.from("market_benchmarks").select("provider_code,provider_instrument_id,exchange,trading_symbol,mapping_status").eq("code",target.target).single()
     if(mapping.error||mapping.data.mapping_status!=="VERIFIED"||mapping.data.provider_code!=="ANGEL_ONE"||mapping.data.provider_instrument_id!==target.token||mapping.data.exchange!==target.exchange||mapping.data.trading_symbol!==target.tradingSymbol)throw new Error("BANK_TAIL_BENCHMARK_MAPPING_CHANGED")
    }
    const retained=await admin.from(table).select("period_start").eq(identity,target.target).eq("provider_code","ANGEL_ONE").eq("interval","ONE_DAY").gte("period_start",target.from+"T00:00:00+05:30").lte("period_start",target.to+"T23:59:59+05:30")
    if(retained.error)throw new Error("BANK_TAIL_EXISTING_READ_FAILED")
    const existing=new Set((retained.data??[]).map(x=>bankTailDay(String(x.period_start))))
    if(existing.has(target.to)&&existing.has(target.from)){results.push({target:target.target,status:"SKIPPED_CURRENT"});continue}
    const candles=await provider.getDailyHistoryNoRetry({mappingId:target.mappingId,securityId:stock?target.target:scope[0].target,providerInstrumentId:target.token,exchange:target.exchange,tradingSymbol:target.tradingSymbol},target.from+" 00:00",target.to+" 23:59")
    validateBankTail(candles,target.from,target.to)
    if(!candles.some(c=>bankTailDay(c.periodStart)===target.from))throw new Error("BANK_TAIL_START_SESSION_MISSING")
    if(candles.some(c=>existing.has(bankTailDay(c.periodStart))))throw new Error("BANK_TAIL_OVERLAP_REQUIRES_REVIEW")
    const retrievedAt=new Date().toISOString(),payload={version:ACTION,target:target.target,kind:target.kind,from:target.from,to:target.to,token:target.token,candles}
    const raw=await admin.from("data_source_records").insert({source_code:"ANGEL_ONE",record_kind:"V1_4_BANK_TAIL_CAPTURE",external_record_id:`${body.grantId}:${target.target}`,retrieved_at:retrievedAt,payload_hash:await hash(payload),raw_payload:payload,terms_snapshot:{operation:ACTION,retry_policy:"ZERO",owner_approved:true}}).select("id").single()
    if(raw.error)throw new Error("BANK_TAIL_RAW_WRITE_FAILED")
    const rows=candles.map(c=>({[identity]:target.target,provider_code:"ANGEL_ONE",interval:"ONE_DAY",period_start:c.periodStart,open:c.open,high:c.high,low:c.low,close:c.close,volume:c.volume,retrieved_at:c.retrievedAt,...(stock?{mapping_id:target.mappingId,adjusted_close:null}:{}),provenance:{source_record_id:raw.data.id,operation:ACTION,requested_from:target.from,requested_to:target.to,exchange:target.exchange,symbol_token:target.token,trading_symbol:target.tradingSymbol}}))
    const written=await admin.from(table).insert(rows)
    if(written.error)throw new Error("BANK_TAIL_INSERT_FAILED_RAW_RETAINED")
    results.push({target:target.target,status:"INGESTED_NOT_QUALIFIED",rows:rows.length,sourceRecordId:raw.data.id})
   }catch(error){
    const code=error instanceof AngelProviderError?error.code:error instanceof Error&&error.message.startsWith("BANK_TAIL_")?error.message:"BANK_TAIL_PROVIDER_OR_RUNTIME_FAILURE"
    results.push({target:target.target,status:"FAILED",code})
    if(error instanceof AngelProviderError&&error.sessionExpired||transport.authenticationRequests===0||code==="BANK_TAIL_AUTH_LIMIT")break
   }
   await new Promise(resolve=>setTimeout(resolve,1100))
  }
  return reply(200,{action:ACTION,transport,results,canonicalMaterialization:false})
 }catch{return reply(500,{code:"BANK_TAIL_RUNTIME_CONFIGURATION_OR_CONTROL_FAILURE"})}
})
