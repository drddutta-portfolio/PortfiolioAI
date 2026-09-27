import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { mapAngelInstruments } from "../_shared/instrument-mapping.ts"
import { verifiedIdentityChanged, type StoredMappingIdentity } from "../_shared/mapping-transition.ts"
import { MARKET_DATA_PROVIDER } from "../_shared/market-data.ts"
import { consumeP4ExecutionGrant } from "../_shared/p4-execution-grant.ts"

const DEV_REF="lrgpjimipfkyoqbpsqzz"
const PROD_REF="uxiyufbsbgzzdujzcdxe"
const PORTFOLIO_ID="6193a4aa-3235-4057-bddc-209fcf443fc2"
const ALLOWED=new Set([
 "fcdef75b-3a97-4c04-976c-a6d01d8ea64e",
 "d0d65431-4c9a-4efd-9f0e-e57a58cad2da",
])
const ACTION="P4B_EXACT_MAPPING"
const reply=(s:number,b:Record<string,unknown>)=>new Response(JSON.stringify(b),{status:s,headers:{"Content-Type":"application/json"}})
const refOf=(v:string)=>{try{return new URL(v).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1]??null}catch{return null}}

Deno.serve(async req=>{
 if(req.method!=="POST") return reply(405,{error:"Method not allowed."})
 const supabaseUrl=Deno.env.get("SUPABASE_URL")??"",serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
 const ref=refOf(supabaseUrl)
 if(ref===PROD_REF) return reply(409,{error:"P4B exact mapping refuses Production.",code:"UNEXPECTED_PRODUCTION_DB_TARGET"})
 if(ref!==DEV_REF||!serviceKey) return reply(500,{error:"PortfolioAI Dev runtime configuration is incomplete."})
 try{
  const body=await req.json() as {action?:unknown,portfolioId?:unknown,securityId?:unknown,grantId?:unknown}
  if(body.action!==ACTION||body.portfolioId!==PORTFOLIO_ID||typeof body.securityId!=="string"||!ALLOWED.has(body.securityId)) return reply(409,{error:"Exact P4B mapping scope required.",code:"AUTH_OR_CONFIG_ERROR"})
  const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false}})
  const grant=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action:ACTION,portfolioId:PORTFOLIO_ID,securityId:body.securityId})
  if(!grant.ok) return reply(401,{error:grant.message,code:grant.code})
  const holding=await admin.from("current_holdings").select("security_id,current_quantity").eq("portfolio_id",PORTFOLIO_ID).eq("security_id",body.securityId).maybeSingle()
  if(holding.error||!holding.data||Number(holding.data.current_quantity)<=0) return reply(403,{error:"Target must be an open holding."})
  const security=await admin.from("securities").select("id,symbol,exchange,asset_class").eq("id",body.securityId).single()
  if(security.error||!security.data) return reply(404,{error:"Security not found."})
  const masterRetrievedAt=new Date().toISOString()
  const response=await fetch("https://margincalculator.angelone.in/OpenAPI_File/files/OpenAPIScripMaster.json")
  if(!response.ok) return reply(502,{error:"Angel One public instrument master unavailable.",code:`ANGEL_MASTER_HTTP_${response.status}`})
  const master=await response.json() as readonly Readonly<Record<string,unknown>>[]
  const resolved=mapAngelInstruments([{id:security.data.id,symbol:security.data.symbol,exchange:security.data.exchange,assetClass:security.data.asset_class}],master,masterRetrievedAt)
  if(resolved.length!==1) return reply(409,{error:"Exact mapping candidate unavailable.",code:"ANGEL_MAPPING_NOT_RESOLVED"})
  const candidate=resolved[0]
  const existing=await admin.from("market_data_instrument_mappings").select("id,security_id,mapping_status,provider_instrument_id,exchange,trading_symbol").eq("security_id",body.securityId).eq("provider_code",MARKET_DATA_PROVIDER).maybeSingle()
  if(existing.error) throw existing.error
  if(verifiedIdentityChanged(existing.data as (StoredMappingIdentity & {security_id:string})|null,candidate)){
    return reply(409,{error:"Mapping change requires review.",code:"ANGEL_MAPPING_CHANGE_REVIEW_REQUIRED",candidate})
  }
  const up=await admin.from("market_data_instrument_mappings").upsert({
    security_id:candidate.securityId,provider_code:MARKET_DATA_PROVIDER,
    provider_instrument_id:candidate.providerInstrumentId,exchange:candidate.exchange,trading_symbol:candidate.tradingSymbol,
    provider_instrument_type:candidate.providerInstrumentType,mapping_status:candidate.mappingStatus,match_basis:candidate.matchBasis,
    evidence:candidate.evidence,instrument_master_as_of:masterRetrievedAt.slice(0,10),
    verified_at:candidate.mappingStatus==="VERIFIED"?masterRetrievedAt:null,
  },{onConflict:"security_id,provider_code"})
  if(up.error) throw up.error
  return reply(200,{symbol:security.data.symbol,mappingStatus:candidate.mappingStatus,providerInstrumentId:candidate.providerInstrumentId,tradingSymbol:candidate.tradingSymbol,matchBasis:candidate.matchBasis})
 }catch(error){return reply(500,{error:"P4B exact mapping failed safely.",code:error instanceof Error?error.message:"P4B_EXACT_MAPPING_FAILED"})}
})