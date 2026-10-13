import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
// A pinned JOSE implementation verifies GitHub's signed OIDC identity. This avoids
// exporting Supabase service credentials to the acquisition runner.
import {createRemoteJWKSet,jwtVerify} from "https://esm.sh/jose@6.1.0"
import {approvedOriginalReadUrl,githubImportClaimsQualified,KVB_ORIGINAL_KIND,KVB_ORIGINAL_PROOF as proof,
 KVB_ROA_SECURITY,kvbOriginalKey} from "../_shared/v14-kvb-roa-original-proof.ts"
const PROJECT="lrgpjimipfkyoqbpsqzz",ACTION="REGISTER_KVB_ROA_PINNED_ORIGINALS_V1"
const AUD=`https://${PROJECT}.supabase.co/functions/v1/v14-bank-kvb-original-import`
const jwks=createRemoteJWKSet(new URL("https://token.actions.githubusercontent.com/.well-known/jwks"))
const reply=(status:number,code:string,extra:Record<string,unknown>={})=>new Response(JSON.stringify({code,...extra}),{
 status,headers:{"content-type":"application/json","cache-control":"no-store"}})
const stable=(v:unknown):string=>Array.isArray(v)?"["+v.map(stable).join(",")+"]":v!==null&&typeof v==="object"
 ?"{"+Object.entries(v as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>JSON.stringify(k)+":"+stable(x)).join(",")+"}":JSON.stringify(v)??"null"
const sha=async(bytes:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new Uint8Array(bytes).buffer))).map(x=>x.toString(16).padStart(2,"0")).join("")
const str=(x:unknown)=>typeof x==="string"?x:""

Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,"METHOD_NOT_ALLOWED")
 const url=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
 if(url!==`https://${PROJECT}.supabase.co`||!key)return reply(409,"DEVELOPMENT_ONLY")
 let claims:Record<string,unknown>
 try{
  const token=(req.headers.get("authorization")??"").replace(/^Bearer\s+/i,"")
  const verified=await jwtVerify(token,jwks,{issuer:"https://token.actions.githubusercontent.com",audience:AUD,algorithms:["RS256"],maxTokenAge:"5m"})
  claims=verified.payload
  if(!githubImportClaimsQualified(claims))return reply(403,"IMPORT_EXECUTOR_SCOPE_INVALID")
 }catch{return reply(401,"SIGNED_IMPORT_EXECUTOR_REQUIRED")}
 const body=await req.json().catch(()=>null) as Record<string,unknown>|null
 if(!body||body.action!==ACTION)return reply(400,"EXACT_IMPORT_ACTION_REQUIRED")
 const db=createClient(url,key,{auth:{persistSession:false}})
 const verifiedAt=new Date().toISOString()
 try{
  // Both original objects are rehashed before any database write. URLs are
  // ephemeral transport capabilities and are never persisted or logged.
  for(const kind of ["regulator","issuer"] as const){
   const readUrl=str(body[kind+"ReadUrl"])
   if(!approvedOriginalReadUrl(readUrl,kind))return reply(400,"ORIGINAL_STORAGE_SCOPE_INVALID")
   const res=await fetch(readUrl,{redirect:"error",signal:AbortSignal.timeout(20000)})
   if(!res.ok)return reply(502,"ORIGINAL_STORAGE_READ_FAILED",{kind,httpStatus:res.status})
   const data=new Uint8Array(await res.arrayBuffer()),p=proof[kind]
   if(data.length!==p.bytes||await sha(data)!==p.sha256)return reply(409,"ORIGINAL_BYTES_MISMATCH",{kind})
   if(kind==="issuer"&&new TextDecoder().decode(data.slice(0,5))!=="%PDF-")return reply(409,"PDF_FORMAT_INVALID")
   if(kind==="regulator"){
    const html=new TextDecoder().decode(data)
    if(!html.includes("Return on Assets")||!html.includes("Form X")||!html.includes("November 28, 2025"))return reply(409,"RBI_FORMAT_INVALID")
   }
  }
  async function register(kind:"issuer"|"regulator",regulatorId?:string){
   const p=proof[kind]
   const raw:Record<string,unknown>={version:KVB_ORIGINAL_KIND,source_role:kind,original_url:p.originalUrl,
    original_sha256:p.sha256,original_bytes:p.bytes,original_bytes_verified_at:p.firstVerifiedAt,
    first_verified_available_at:p.firstVerifiedAt,publication_precision:"UNKNOWN",published_at:null,
    r2_bucket:"portfolioai-history-dev",r2_object_key:kvbOriginalKey(kind),r2_verified_sha256:p.sha256,
    retained_artifact_id:p.artifactId,content_type:p.contentType,canonical_promotion:false}
   if(kind==="issuer")Object.assign(raw,{security_id:KVB_ROA_SECURITY,symbol:"KARURVYSYA",source_scope:"STANDALONE",
    table_fragment:proof.issuer.table,period_anchor:proof.issuer.periodAnchor,identity_anchor:proof.issuer.identityAnchor,
    extraction:{parser:"pdftotext -layout",pdf_page:68,original_sha256:p.sha256},
    roa_regulatory_proof:{source_record_id:regulatorId,original_sha256:proof.regulator.sha256,
     official_url:proof.regulator.originalUrl,denominator:proof.regulator.denominator,roa:proof.regulator.roa,
     commencement:proof.regulator.commencement,applicability_status:"OWNER_REVIEW_REQUIRED"}})
   else Object.assign(raw,{source_authority:"RBI_OFFICIAL",denominator:proof.regulator.denominator,
    roa:proof.regulator.roa,commencement:proof.regulator.commencement})
   const payloadHash=await sha(new TextEncoder().encode(stable(raw)))
   const sourceCode=kind==="issuer"?"COMPANY_EXCHANGE_FILING":"CONTROLLED_PUBLIC_WEB"
   const identity={source_code:sourceCode,record_kind:KVB_ORIGINAL_KIND,external_record_id:p.sha256,payload_hash:payloadHash}
   const found=await db.from("data_source_records").select("id,payload_hash,raw_payload").match(identity).maybeSingle()
   if(found.error)throw Error("SOURCE_LOOKUP_FAILED")
   if(found.data)return {id:found.data.id,payloadHash,state:"REUSED"}
   const inserted=await db.from("data_source_records").insert({...identity,raw_payload:raw,source_url:p.originalUrl,
    retrieved_at:p.firstVerifiedAt,published_at:null,terms_snapshot:{environment:"PortfolioAI Dev",
     registration_action:ACTION,executor:"GITHUB_ACTIONS_OIDC",repository:claims.repository,execution_sha:claims.sha,
     run_id:claims.run_id,durable_bytes_verified_at:verifiedAt,original_bytes_verified:true,canonical_promotion:false,
     applicability_decision:"NOT_AUTOMATICALLY_ACCEPTED"}}).select("id,payload_hash").single()
   if(inserted.error&&inserted.error.code!=="23505")throw Error("SOURCE_REGISTRATION_FAILED:"+inserted.error.code)
   const readback=await db.from("data_source_records").select("id,payload_hash,raw_payload").match(identity).single()
   if(readback.error||!readback.data||await sha(new TextEncoder().encode(stable(readback.data.raw_payload)))!==payloadHash)
    throw Error("SOURCE_READBACK_FAILED")
   return {id:readback.data.id,payloadHash,state:inserted.error?"REUSED":"REGISTERED"}
  }
  const regulator=await register("regulator"),issuer=await register("issuer",regulator.id)
  return reply(200,"PINNED_ORIGINALS_REGISTERED_NOT_REVIEWED",{regulator,issuer,verifiedAt,canonicalPromotion:false})
 }catch{return reply(503,"SOURCE_IMPORT_FAILED_NO_REVIEW_CREATED")}
})
