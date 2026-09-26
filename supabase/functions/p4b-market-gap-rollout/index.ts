import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { AngelOneProvider, loadAngelOneConfig } from "../_shared/angel-one.ts"
import { MARKET_DATA_PROVIDER, type ProviderInstrument } from "../_shared/market-data.ts"
import { mapAngelInstruments } from "../_shared/instrument-mapping.ts"
import { verifiedIdentityChanged, type StoredMappingIdentity } from "../_shared/mapping-transition.ts"
import { consumeP4ExecutionGrant } from "../_shared/p4-execution-grant.ts"

const DEV_REF="lrgpjimipfkyoqbpsqzz"
const PROD_REF="uxiyufbsbgzzdujzcdxe"
const PORTFOLIO_ID="6193a4aa-3235-4057-bddc-209fcf443fc2"
const TARGET_IDS=new Set([
  "cbdbea24-eb1d-489f-ab6f-7800f04f28ca",
  "fcdef75b-3a97-4c04-976c-a6d01d8ea64e",
  "d0d65431-4c9a-4efd-9f0e-e57a58cad2da",
])
const GRANT_SENTINEL="P4B_MARKET_GAPS:CHOLAFIN,PINELABS,V2RETAIL"

const reply=(status:number,body:Record<string,unknown>)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}})
function projectRef(value:string){try{return new URL(value).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1]??null}catch{return null}}

Deno.serve(async request=>{
  if(request.method!=="POST") return reply(405,{error:"Method not allowed."})
  const supabaseUrl=Deno.env.get("SUPABASE_URL")??""
  const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
  const ref=projectRef(supabaseUrl)
  if(ref===PROD_REF) return reply(409,{error:"P4B market gap rollout refuses Production.",code:"UNEXPECTED_PRODUCTION_DB_TARGET"})
  if(ref!==DEV_REF||!serviceKey) return reply(500,{error:"Development runtime configuration is incomplete."})

  try{
    const body=await request.json() as {action?:unknown,grantId?:unknown}
    if(body.action!=="P4B_RESOLVE_MARKET_GAPS") return reply(400,{error:"Unknown action."})
    const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false}})
    const grant=await consumeP4ExecutionGrant(admin,{
      grantId:body.grantId,action:"P4B_RESOLVE_MARKET_GAPS",portfolioId:PORTFOLIO_ID,securityId:GRANT_SENTINEL,
    })
    if(!grant.ok) return reply(401,{error:grant.message,code:grant.code})

    const holdings=await admin.from("current_holdings").select("security_id,current_quantity").eq("portfolio_id",PORTFOLIO_ID)
    if(holdings.error) throw holdings.error
    const openIds=new Set((holdings.data??[]).filter(row=>!/^[-+]?0(?:\.0+)?$/u.test(String(row.current_quantity))).map(row=>row.security_id))
    const targetIds=[...TARGET_IDS].filter(id=>openIds.has(id))
    if(targetIds.length!==TARGET_IDS.size) return reply(409,{error:"Exact P4B market-gap cohort is no longer fully open.",code:"PORTFOLIO_SCOPE_MISMATCH"})

    const securities=await admin.from("securities").select("id,symbol,exchange,asset_class").in("id",targetIds)
    if(securities.error) throw securities.error
    if((securities.data??[]).some(row=>row.asset_class!=="EQUITY")) return reply(409,{error:"Market-gap cohort must contain held equities only."})

    const masterRetrievedAt=new Date().toISOString()
    const masterResponse=await fetch("https://margincalculator.angelone.in/OpenAPI_File/files/OpenAPIScripMaster.json")
    if(!masterResponse.ok) return reply(502,{error:`Angel One instrument master failed (${masterResponse.status}).`})
    const master=await masterResponse.json() as readonly Readonly<Record<string,unknown>>[]
    const resolved=mapAngelInstruments((securities.data??[]).map(row=>({id:row.id,symbol:row.symbol,exchange:row.exchange,assetClass:row.asset_class})),master,masterRetrievedAt)

    const existing=await admin.from("market_data_instrument_mappings")
      .select("id,security_id,mapping_status,provider_instrument_id,exchange,trading_symbol")
      .eq("provider_code",MARKET_DATA_PROVIDER).in("security_id",targetIds)
    if(existing.error) throw existing.error
    const existingBySecurity=new Map((existing.data??[]).map(row=>[row.security_id,row as StoredMappingIdentity & {security_id:string}]))
    const quarantined=resolved.filter(candidate=>verifiedIdentityChanged(existingBySecurity.get(candidate.securityId),candidate))
    const accepted=resolved.filter(candidate=>!quarantined.includes(candidate))

    if(quarantined.length){
      const review=await admin.from("market_data_mapping_reviews").upsert(quarantined.map(candidate=>{
        const old=existingBySecurity.get(candidate.securityId)!
        return {
          mapping_id:old.id,security_id:candidate.securityId,provider_code:MARKET_DATA_PROVIDER,
          proposed_provider_instrument_id:candidate.providerInstrumentId,proposed_exchange:candidate.exchange,
          proposed_trading_symbol:candidate.tradingSymbol,proposed_provider_instrument_type:candidate.providerInstrumentType,
          proposed_mapping_status:candidate.mappingStatus,proposed_match_basis:candidate.matchBasis,
          evidence:candidate.evidence,detected_at:masterRetrievedAt,review_status:"PENDING",
        }
      }),{onConflict:"mapping_id,review_status",ignoreDuplicates:true})
      if(review.error) throw review.error
    }

    if(accepted.length){
      const upsert=await admin.from("market_data_instrument_mappings").upsert(accepted.map(mapping=>({
        security_id:mapping.securityId,provider_code:MARKET_DATA_PROVIDER,
        provider_instrument_id:mapping.providerInstrumentId,exchange:mapping.exchange,trading_symbol:mapping.tradingSymbol,
        provider_instrument_type:mapping.providerInstrumentType,mapping_status:mapping.mappingStatus,match_basis:mapping.matchBasis,
        evidence:mapping.evidence,instrument_master_as_of:masterRetrievedAt.slice(0,10),
        verified_at:mapping.mappingStatus==="VERIFIED"?masterRetrievedAt:null,
      })),{onConflict:"security_id,provider_code"})
      if(upsert.error) throw upsert.error
    }

    const verified:ProviderInstrument[]=accepted.flatMap(mapping=>
      mapping.mappingStatus==="VERIFIED"&&mapping.providerInstrumentId&&mapping.exchange&&mapping.tradingSymbol
        ? [{mappingId:existingBySecurity.get(mapping.securityId)?.id??mapping.securityId,securityId:mapping.securityId,providerInstrumentId:mapping.providerInstrumentId,exchange:mapping.exchange,tradingSymbol:mapping.tradingSymbol}]
        : []
    )

    const mappingRows=await admin.from("market_data_instrument_mappings")
      .select("id,security_id,provider_instrument_id,exchange,trading_symbol,mapping_status")
      .eq("provider_code",MARKET_DATA_PROVIDER).in("security_id",targetIds)
    if(mappingRows.error) throw mappingRows.error
    const instruments:ProviderInstrument[]=(mappingRows.data??[]).flatMap(mapping=>
      mapping.mapping_status==="VERIFIED"&&mapping.provider_instrument_id&&mapping.exchange&&mapping.trading_symbol
        ? [{mappingId:mapping.id,securityId:mapping.security_id,providerInstrumentId:mapping.provider_instrument_id,exchange:mapping.exchange,tradingSymbol:mapping.trading_symbol}]
        : []
    )

    let fetched=0
    let failed=0
    if(instruments.length){
      const observations=await new AngelOneProvider(loadAngelOneConfig()).getLatestPrices(instruments)
      fetched=observations.length
      failed=instruments.length-observations.length
      if(observations.length){
        const prices=await admin.from("market_price_latest").upsert(observations.map(item=>({
          security_id:item.securityId,provider_code:item.providerCode,mapping_id:item.mappingId,
          price:item.price,currency:"INR",price_timestamp:item.priceTimestamp,retrieved_at:item.retrievedAt,
          market_session_status:item.marketSessionStatus,previous_close:item.previousClose,
          day_open:item.dayOpen,day_high:item.dayHigh,day_low:item.dayLow,provenance:item.provenance,
        })),{onConflict:"security_id,provider_code"})
        if(prices.error) throw prices.error
      }
    }

    return reply(200,{
      status:"COMPLETE",
      mapped:accepted.filter(x=>x.mappingStatus==="VERIFIED").length,
      ambiguous:accepted.filter(x=>x.mappingStatus==="AMBIGUOUS").length,
      unresolved:accepted.filter(x=>x.mappingStatus==="UNRESOLVED").length,
      quarantined:quarantined.length,
      verifiedAfter:instruments.length,
      pricesFetched:fetched,
      priceFailures:failed,
      results:(securities.data??[]).map(row=>{
        const a=accepted.find(x=>x.securityId===row.id)
        return {symbol:row.symbol,mappingStatus:a?.mappingStatus??(quarantined.some(x=>x.securityId===row.id)?"QUARANTINED":"NO_RESULT")}
      }),
    })
  }catch(error){
    return reply(500,{error:"P4B market-gap rollout failed safely.",code:error instanceof Error?error.message:"P4B_MARKET_GAP_FAILED"})
  }
})
