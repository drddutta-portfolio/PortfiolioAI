import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {consumeP4ExecutionGrant} from "../_shared/p4-execution-grant.ts"
import scope from "./scope.json" with {type:"json"}

const PROJECT="lrgpjimipfkyoqbpsqzz"
const PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2"
const ACTION="V1_4_BANK_OFFICIAL_NSE_DOCUMENT_CAPTURE"
const reply=(s:number,b:unknown)=>new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}})
const sha=async(bytes:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))).map(x=>x.toString(16).padStart(2,"0")).join("")
Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,{code:"METHOD_NOT_ALLOWED"})
 const url=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
 if(url!==`https://${PROJECT}.supabase.co`||!key)return reply(409,{code:"DEVELOPMENT_TARGET_REQUIRED"})
 try{
  const body=await req.json() as Record<string,unknown>,documentKey=String(body.documentKey??"")
  const target=scope.find(x=>x.key===documentKey)
  if(body.action!==ACTION||body.portfolioId!==PORTFOLIO||!target)return reply(400,{code:"BANK_OFFICIAL_DOCUMENT_SCOPE_INVALID"})
  const u=new URL(target.url)
  if(u.protocol!=="https:"||u.hostname!=="nsearchives.nseindia.com"||!u.pathname.startsWith("/corporate/")||!u.pathname.toLowerCase().endsWith(".pdf"))
    return reply(400,{code:"BANK_OFFICIAL_DOCUMENT_URL_INVALID"})
  const admin=createClient(url,key,{auth:{persistSession:false}})
  const sentinel=`${target.securityId}:${target.key}`
  const grant=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action:ACTION,portfolioId:PORTFOLIO,securityId:sentinel})
  if(!grant.ok)return reply(401,{code:grant.code})
  const response=await fetch(target.url,{headers:{"user-agent":"PortfolioAI-V14-BANK-DOCUMENT/1.0","accept":"application/pdf"}})
  if(!response.ok)return reply(502,{code:"BANK_OFFICIAL_DOCUMENT_HTTP_"+response.status})
  const bytes=new Uint8Array(await response.arrayBuffer())
  if(bytes.length<1024||new TextDecoder("latin1").decode(bytes.slice(0,5))!=="%PDF-")return reply(502,{code:"BANK_OFFICIAL_DOCUMENT_NOT_PDF"})
  const digest=await sha(bytes),retrievedAt=new Date().toISOString()
  const payload={
   version:"V1_4_BANK_OFFICIAL_NSE_BINARY_CAPTURE_V1",security_id:target.securityId,symbol:target.symbol,
   document_key:target.key,original_url:target.url,original_sha256:digest,original_bytes:bytes.length,
   publication_precision:"DATE_ONLY",publication_date:target.publicationDate,published_at:null,
   original_bytes_verified_at:retrievedAt,source_host:u.hostname,
   policy_id:"V1_4_BANK_PRIMARY_FILING_DELEGATION_V1",canonical_promotion:false
  }
  const existing=await admin.from("data_source_records").select("id,payload_hash,raw_payload")
   .eq("source_code","NSE_OFFICIAL").eq("record_kind","V1_4_BANK_OFFICIAL_DOCUMENT_BINARY_CAPTURE")
   .eq("external_record_id",target.key+":"+digest).maybeSingle()
  if(existing.error)throw new Error("BANK_OFFICIAL_DOCUMENT_EXISTING_READ_FAILED")
  if(existing.data)return reply(200,{state:"REUSED",recordId:existing.data.id,documentKey:target.key,sha256:digest,bytes:bytes.length})
  const ph=await sha(new TextEncoder().encode(JSON.stringify(payload)))
  const ins=await admin.from("data_source_records").insert({
   source_code:"NSE_OFFICIAL",record_kind:"V1_4_BANK_OFFICIAL_DOCUMENT_BINARY_CAPTURE",
   external_record_id:target.key+":"+digest,retrieved_at:retrievedAt,published_at:null,
   payload_hash:ph,raw_payload:payload,source_url:target.url,
   terms_snapshot:{environment:"PortfolioAI Dev",operation:ACTION,canonical_promotion:false,grant_id:body.grantId}
  }).select("id,payload_hash").single()
  if(ins.error)throw new Error("BANK_OFFICIAL_DOCUMENT_CAPTURE_WRITE_FAILED")
  return reply(200,{state:"PASS",recordId:ins.data.id,payloadHash:ins.data.payload_hash,documentKey:target.key,sha256:digest,bytes:bytes.length,canonicalPromotion:false})
 }catch(e){return reply(500,{code:e instanceof Error?e.message:"BANK_OFFICIAL_DOCUMENT_CAPTURE_FAILED"})}
})