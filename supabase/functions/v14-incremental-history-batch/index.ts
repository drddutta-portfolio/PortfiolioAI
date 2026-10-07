import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {AngelOneProvider,loadAngelOneConfig,type AngelTransportObserver} from "../_shared/angel-one.ts"
import {consumeP4ExecutionGrant} from "../_shared/p4-execution-grant.ts"
import type {ProviderInstrument} from "../_shared/market-data.ts"

const DEV_REF="lrgpjimipfkyoqbpsqzz"
const PORTFOLIO_ID="6193a4aa-3235-4057-bddc-209fcf443fc2"
const ACTION="V1_4_INCREMENTAL_HISTORY_BATCH"
const CONFIRMATION="OWNER_APPROVED_V1_4_INCREMENTAL_HISTORY_2026_10_07"
const CUTOFF="2026-10-06"
const MAX_ITEMS=20
const reply=(s:number,b:unknown)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}})
const localDate=(iso:string)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(iso))
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms))
Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,{code:"METHOD_NOT_ALLOWED"})
 const url=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
 let ref:string|null=null;try{ref=new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1]??null}catch{}
 if(ref!==DEV_REF||!key)return reply(409,{code:"UNAPPROVED_DEVELOPMENT_TARGET"})
 try{
  const body=await req.json() as Record<string,unknown>
  if(body.action!==ACTION||body.confirmation!==CONFIRMATION||body.portfolioId!==PORTFOLIO_ID)return reply(409,{code:"V1_4_BATCH_SCOPE_MISMATCH"})
  if(!Array.isArray(body.items)||body.items.length<1||body.items.length>MAX_ITEMS)return reply(400,{code:"V1_4_BATCH_ITEM_COUNT_INVALID"})
  const items=body.items.map(x=>x as Record<string,unknown>)
  if(items.some(x=>typeof x.securityId!=="string"||typeof x.grantId!=="string"))return reply(400,{code:"V1_4_BATCH_ITEM_INVALID"})
  const securityIds=[...new Set(items.map(x=>String(x.securityId)))]
  if(securityIds.length!==items.length)return reply(400,{code:"V1_4_BATCH_DUPLICATE_SECURITY"})
  const admin=createClient(url,key,{auth:{persistSession:false}})
  const [holdings,securities,mappings]=await Promise.all([
   admin.from("current_holdings").select("security_id,current_quantity").eq("portfolio_id",PORTFOLIO_ID).in("security_id",securityIds),
   admin.from("securities").select("id,symbol,asset_class").in("id",securityIds),
   admin.from("market_data_instrument_mappings").select("id,security_id,provider_instrument_id,exchange,trading_symbol,mapping_status").eq("provider_code","ANGEL_ONE").in("security_id",securityIds)
  ])
  if(holdings.error||securities.error||mappings.error)throw new Error("V1_4_BATCH_SCOPE_READ_FAILED")
  const held=new Set((holdings.data??[]).filter(x=>Number(x.current_quantity)>0).map(x=>String(x.security_id)))
  const sec=new Map((securities.data??[]).map(x=>[String(x.id),x]))
  const map=new Map((mappings.data??[]).map(x=>[String(x.security_id),x]))
  if(securityIds.some(id=>!held.has(id)||sec.get(id)?.asset_class!=="EQUITY"||map.get(id)?.mapping_status!=="VERIFIED"))return reply(409,{code:"V1_4_BATCH_SECURITY_SCOPE_NOT_PROVEN"})
  const latest=await admin.from("market_price_history").select("security_id,period_start").eq("provider_code","ANGEL_ONE").eq("interval","ONE_DAY").in("security_id",securityIds).order("period_start",{ascending:false})
  if(latest.error)throw latest.error
  const latestBy=new Map<string,string>()
  for(const row of latest.data??[]){const id=String(row.security_id);if(!latestBy.has(id))latestBy.set(id,String(row.period_start))}
  const transport={authenticationRequests:0,historyRequests:0,successfulResponses:0}
  const observer:AngelTransportObserver={
   onAttempt(kind){if(kind==="AUTHENTICATE")transport.authenticationRequests++;else if(kind==="HISTORY")transport.historyRequests++},
   onResponse(kind,ok){if(ok&&(kind==="AUTHENTICATE"||kind==="HISTORY"))transport.successfulResponses++}
  }
  const provider=new AngelOneProvider(loadAngelOneConfig(),observer)
  const run=await admin.from("market_data_refresh_runs").insert({
   portfolio_id:PORTFOLIO_ID,provider_code:"ANGEL_ONE",requested_by:(await admin.from("portfolios").select("user_id").eq("id",PORTFOLIO_ID).single()).data?.user_id,
   status:"RUNNING",requested_security_count:items.length,metadata:{operation:"V1_4_INCREMENTAL_HISTORY_BATCH",cutoff:CUTOFF}
  }).select("id").single()
  if(run.error)throw run.error
  const results:Array<Record<string,unknown>>=[]
  let fetched=0,failed=0,skipped=0
  for(const item of items){
   const securityId=String(item.securityId),grantId=String(item.grantId),s=sec.get(securityId)!,mp=map.get(securityId)!
   const latestIso=latestBy.get(securityId)??null,latestDay=latestIso?localDate(latestIso):null
   if(latestDay&&latestDay>=CUTOFF){results.push({securityId,symbol:s.symbol,state:"SKIPPED_ALREADY_CURRENT",latestSession:latestDay});skipped++;continue}
   const grant=await consumeP4ExecutionGrant(admin,{grantId,action:ACTION,portfolioId:PORTFOLIO_ID,securityId})
   if(!grant.ok){results.push({securityId,symbol:s.symbol,state:"FAILED",code:grant.code});failed++;continue}
   const instrument:ProviderInstrument={mappingId:String(mp.id),securityId,providerInstrumentId:String(mp.provider_instrument_id),exchange:String(mp.exchange),tradingSymbol:String(mp.trading_symbol)}
   const from=(latestDay??"2025-09-01")+" 00:00",to=CUTOFF+" 23:59"
   try{
    const candles=await provider.getDailyHistoryNoRetry(instrument,from,to)
    const bounded=candles.filter(x=>{const d=localDate(x.periodStart);return (!latestDay||d>=latestDay)&&d<=CUTOFF})
    if(!bounded.length)throw new Error("ANGEL_HISTORY_EMPTY")
    const rows=bounded.map(c=>({security_id:securityId,provider_code:"ANGEL_ONE",mapping_id:instrument.mappingId,interval:"ONE_DAY",period_start:c.periodStart,open:c.open,high:c.high,low:c.low,close:c.close,adjusted_close:null,volume:c.volume,retrieved_at:c.retrievedAt,provenance:{endpoint:"/rest/secure/angelbroking/historical/v1/getCandleData",interval:"ONE_DAY",exchange:instrument.exchange,trading_symbol:instrument.tradingSymbol,symbol_token:instrument.providerInstrumentId,requested_from:from,requested_to:to,v1_4_incremental:true,retry_policy:"ZERO"}}))
    const wr=await admin.from("market_price_history").upsert(rows,{onConflict:"security_id,provider_code,interval,period_start"})
    if(wr.error)throw wr.error
    const end=localDate(bounded.at(-1)!.periodStart)
    results.push({securityId,symbol:s.symbol,state:"SUCCEEDED",candlesStored:rows.length,historyStart:localDate(bounded[0]!.periodStart),historyEnd:end})
    fetched++
   }catch(e){
    results.push({securityId,symbol:s.symbol,state:"FAILED",code:e instanceof Error?e.message:"HISTORY_FAILED"})
    failed++
   }
   await sleep(1100)
  }
  await admin.from("market_data_refresh_runs").update({status:failed?"PARTIAL":"SUCCEEDED",completed_at:new Date().toISOString(),fetched_security_count:fetched,failed_security_count:failed,metadata:{operation:"V1_4_INCREMENTAL_HISTORY_BATCH",cutoff:CUTOFF,skipped,transport,results}}).eq("id",run.data.id)
  return reply(failed?207:200,{mode:"V1_4_INCREMENTAL_HISTORY_BATCH",runId:run.data.id,requested:items.length,fetched,failed,skipped,transport,results})
 }catch(e){return reply(500,{code:e instanceof Error?e.message:"V1_4_BATCH_FAILED"})}
})