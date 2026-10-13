import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {consumeP4ExecutionGrant} from "../_shared/p4-execution-grant.ts"

const PROJECT="lrgpjimipfkyoqbpsqzz",PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2"
const ACTION="V1_4_BANK_VALUATION_CORPORATE_ACTION_BACKFILL_2021_2023"
const symbols=new Set(["AUBANK","AXISBANK","BANDHANBNK","BANKBARODA","FEDERALBNK","HDFCBANK","ICICIBANK","IDBI","IDFCFIRSTB","INDIANB","KARURVYSYA","KOTAKBANK","SBIN"])
const iso=/^\d{4}-\d{2}-\d{2}$/
const reply=(s:number,b:unknown)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}})
const sha=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,"0")).join("")
const d=(x:string)=>Date.parse(x+"T00:00:00Z")
const fmt=(x:string)=>x.slice(8,10)+"-"+x.slice(5,7)+"-"+x.slice(0,4)
export function validWindow(from:string,to:string){
 if(!iso.test(from)||!iso.test(to)||!Number.isFinite(d(from))||!Number.isFinite(d(to))||d(from)>d(to))return false
 if(from<"2021-10-01"||to>"2023-09-30")return false
 return d(to)-d(from)<=184*86400000
}
export function candidateShareBasis(subject:string){
 return /(split|sub[- ]?division|bonus|rights|consolidation of|face value)/i.test(subject)
}
Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,{code:"METHOD_NOT_ALLOWED"})
 const url=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
 if(url!==`https://${PROJECT}.supabase.co`||!key)return reply(409,{code:"DEVELOPMENT_TARGET_REQUIRED"})
 try{
  const body=await req.json() as Record<string,unknown>,from=String(body.from??""),to=String(body.to??"")
  if(body.action!==ACTION||body.portfolioId!==PORTFOLIO||!validWindow(from,to))return reply(400,{code:"BANK_CA_BACKFILL_SCOPE_INVALID"})
  const admin=createClient(url,key,{auth:{persistSession:false}})
  const sentinel=`BANKING_13_CORPORATE_ACTIONS:${from}:${to}`
  const grant=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action:ACTION,portfolioId:PORTFOLIO,securityId:sentinel})
  if(!grant.ok)return reply(401,{code:grant.code})
  const endpoint=`https://www.nseindia.com/api/corporates-corporateActions?index=equities&from_date=${fmt(from)}&to_date=${fmt(to)}`
  const res=await fetch(endpoint,{headers:{"user-agent":"Mozilla/5.0 PortfolioAI/1.0","accept":"application/json,text/plain,*/*"}})
  if(!res.ok)return reply(502,{code:"NSE_CA_HTTP_"+res.status})
  const text=await res.text(),payloadHash=await sha(text)
  let parsed:unknown
  try{parsed=JSON.parse(text)}catch{return reply(409,{code:"NSE_CA_JSON_INVALID"})}
  if(!Array.isArray(parsed))return reply(409,{code:"NSE_CA_ARRAY_REQUIRED"})
  const bankRows=(parsed as Record<string,unknown>[]).filter(x=>symbols.has(String(x.symbol??""))).map(x=>({
    symbol:String(x.symbol??""),isin:String(x.isin??""),exDate:String(x.exDate??""),recDate:String(x.recDate??""),
    faceVal:String(x.faceVal??""),subject:String(x.subject??""),candidateShareBasisEvent:candidateShareBasis(String(x.subject??"")),
  }))
  const candidates=bankRows.filter(x=>x.candidateShareBasisEvent)
  const capturedAt=new Date().toISOString()
  const payload={version:"V1_4_BANK_VALUATION_CORPORATE_ACTION_BACKFILL_V1",from,to,source_url:endpoint,
    response_sha256:payloadHash,response_row_count:parsed.length,bank_rows:bankRows,candidate_share_basis_events:candidates,
    adjustment_state:"CAPTURED_PENDING_SHARE_BASIS_QUALIFICATION",canonical_promotion:false}
  const external=`${from}:${to}:${payloadHash}`
  const existing=await admin.from("data_source_records").select("id,payload_hash,retrieved_at")
    .eq("source_code","NSE_OFFICIAL").eq("record_kind","V1_4_BANK_VALUATION_CORPORATE_ACTION_CAPTURE").eq("external_record_id",external).maybeSingle()
  if(existing.error)throw existing.error
  if(existing.data)return reply(200,{state:"REUSED",sourceRecordId:existing.data.id,from,to,bankRows:bankRows.length,candidateShareBasisEvents:candidates.length,canonicalPromotion:false})
  const ins=await admin.from("data_source_records").insert({
    source_code:"NSE_OFFICIAL",record_kind:"V1_4_BANK_VALUATION_CORPORATE_ACTION_CAPTURE",external_record_id:external,
    retrieved_at:capturedAt,payload_hash:await sha(JSON.stringify(payload)),raw_payload:payload,source_url:endpoint,
    terms_snapshot:{action:ACTION,grant_id:body.grantId,environment:"PortfolioAI Dev",canonical_promotion:false},
  }).select("id,payload_hash,retrieved_at").single()
  if(ins.error)throw ins.error
  return reply(200,{state:"PASS",sourceRecordId:ins.data.id,from,to,responseSha256:payloadHash,
    responseRows:parsed.length,bankRows:bankRows.length,candidateShareBasisEvents:candidates.length,canonicalPromotion:false})
 }catch(e){return reply(500,{code:e instanceof Error?e.message:"BANK_CA_BACKFILL_FAILED"})}
})