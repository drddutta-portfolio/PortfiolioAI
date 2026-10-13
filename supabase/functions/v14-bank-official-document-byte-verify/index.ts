import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {consumeP4ExecutionGrant} from "../_shared/p4-execution-grant.ts"

const PROJECT="lrgpjimipfkyoqbpsqzz"
const PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2"
const ACTION="V1_4_BANK_OFFICIAL_DOCUMENT_BYTE_VERIFY"
const securities:Record<string,string>={
 "f5c47463-3c6d-4db0-a815-e4301e990213":"AUBANK","b330c9fe-ae35-469a-9975-d5af26843b1c":"AXISBANK",
 "30ce066a-6410-4b11-9b85-e41324971261":"BANDHANBNK","6771f493-c29a-477e-8cc8-2bede0941e44":"BANKBARODA",
 "63889b52-85da-4a1b-9046-c1e975819f99":"FEDERALBNK","b47b007d-1990-4504-a5a2-4391c07687c5":"HDFCBANK",
 "5760ce4e-97ac-40ef-af3b-d2a5dce596cf":"ICICIBANK","a5639446-3238-4e08-9d02-59bc529982db":"IDBI",
 "ba340b06-fd44-4d80-9ce7-d280616354ed":"IDFCFIRSTB","5275dd14-35ba-4feb-94d8-f8d1facb19d3":"INDIANB",
 "be55b3cc-0400-45af-84aa-2a95e2c361c5":"KARURVYSYA","05744a34-415b-4084-b832-ce3436ba0694":"KOTAKBANK",
 "d77abadc-d171-49d9-bfee-0b34dd0281f4":"SBIN",
}
const reply=(s:number,b:unknown)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}})
const sha=async(bytes:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))).map(x=>x.toString(16).padStart(2,"0")).join("")
export function approvedNseCorporatePdf(raw:string){
 try{
  const u=new URL(raw)
  return u.protocol==="https:"&&u.username===""&&u.password===""&&u.hostname==="nsearchives.nseindia.com"&&
    u.port===""&&u.hash===""&&u.search===""&&u.pathname.startsWith("/corporate/")&&u.pathname.toLowerCase().endsWith(".pdf")
 }catch{return false}
}
Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,{code:"METHOD_NOT_ALLOWED"})
 const url=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
 if(url!==`https://${PROJECT}.supabase.co`||!key)return reply(409,{code:"DEVELOPMENT_TARGET_REQUIRED"})
 try{
  const body=await req.json() as Record<string,unknown>
  const securityId=String(body.securityId??""),symbol=String(body.symbol??""),originalUrl=String(body.originalUrl??"")
  if(body.action!==ACTION||body.portfolioId!==PORTFOLIO||securities[securityId]!==symbol||!approvedNseCorporatePdf(originalUrl))
    return reply(400,{code:"BANK_OFFICIAL_DOCUMENT_SCOPE_INVALID"})
  const admin=createClient(url,key,{auth:{persistSession:false}})
  const grant=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action:ACTION,portfolioId:PORTFOLIO,securityId})
  if(!grant.ok)return reply(401,{code:grant.code})
  const res=await fetch(originalUrl,{headers:{"user-agent":"PortfolioAI-V14-BANK-DOC/1.0","accept":"application/pdf"}})
  if(!res.ok)return reply(502,{code:"BANK_OFFICIAL_DOCUMENT_HTTP_"+res.status})
  const type=(res.headers.get("content-type")??"").toLowerCase()
  if(!type.includes("application/pdf"))return reply(409,{code:"BANK_OFFICIAL_DOCUMENT_CONTENT_TYPE_INVALID",contentType:type})
  const bytes=new Uint8Array(await res.arrayBuffer())
  if(bytes.length<1024||bytes.length>50*1024*1024)return reply(409,{code:"BANK_OFFICIAL_DOCUMENT_SIZE_INVALID",bytes:bytes.length})
  if(bytes[0]!==0x25||bytes[1]!==0x50||bytes[2]!==0x44||bytes[3]!==0x46)return reply(409,{code:"BANK_OFFICIAL_DOCUMENT_MAGIC_INVALID"})
  const digest=await sha(bytes),verifiedAt=new Date().toISOString()
  const payload={version:"V1_4_BANK_OFFICIAL_DOCUMENT_BYTE_CAPTURE_V1",security_id:securityId,symbol,
    original_url:originalUrl,original_sha256:digest,original_bytes:bytes.length,original_bytes_verified_at:verifiedAt,
    source_authority:"NSE_OFFICIAL",verification:"ORIGINAL_BYTES_SHA256_ONLY",canonical_promotion:false}
  const existing=await admin.from("data_source_records").select("id,payload_hash,retrieved_at")
   .eq("source_code","NSE_OFFICIAL").eq("record_kind","V1_4_BANK_OFFICIAL_DOCUMENT_BYTE_CAPTURE")
   .eq("external_record_id",digest).maybeSingle()
  if(existing.error)throw existing.error
  if(existing.data)return reply(200,{state:"REUSED",sourceRecordId:existing.data.id,originalSha256:digest,originalBytes:bytes.length,canonicalPromotion:false})
  const ins=await admin.from("data_source_records").insert({
    source_code:"NSE_OFFICIAL",record_kind:"V1_4_BANK_OFFICIAL_DOCUMENT_BYTE_CAPTURE",external_record_id:digest,
    retrieved_at:verifiedAt,payload_hash:digest,raw_payload:payload,source_url:originalUrl,
    terms_snapshot:{action:ACTION,grant_id:body.grantId,environment:"PortfolioAI Dev",canonical_promotion:false},
  }).select("id,payload_hash,retrieved_at").single()
  if(ins.error)throw ins.error
  return reply(200,{state:"PASS",sourceRecordId:ins.data.id,originalSha256:digest,originalBytes:bytes.length,retrievedAt:ins.data.retrieved_at,canonicalPromotion:false})
 }catch(e){return reply(500,{code:e instanceof Error?e.message:"BANK_OFFICIAL_DOCUMENT_VERIFY_FAILED"})}
})