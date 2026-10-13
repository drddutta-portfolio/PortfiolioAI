import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {createRemoteJWKSet,jwtVerify} from "https://esm.sh/jose@6.1.0"
import {BANK_PIT_ORIGINAL_MANIFEST as manifest,BANK_PIT_ORIGINAL_ACTION as ACTION,BANK_PIT_ORIGINAL_KIND as KIND,
 bankPitImportClaimsQualified,bankPitOriginalReadUrl,bankPitImportSafeError,bankPitOriginalFormatQualified} from "../_shared/v14-bank-pit-original-proof.ts"
const PROJECT="lrgpjimipfkyoqbpsqzz",NAME="v14-bank-pit-original-import"
const AUD=`https://${PROJECT}.supabase.co/functions/v1/${NAME}`
const jwks=createRemoteJWKSet(new URL("https://token.actions.githubusercontent.com/.well-known/jwks"))
const reply=(status:number,code:string,extra:Record<string,unknown>={})=>new Response(JSON.stringify({code,...extra}),{
 status,headers:{"content-type":"application/json","cache-control":"no-store"}})
const stable=(v:unknown):string=>Array.isArray(v)?"["+v.map(stable).join(",")+"]":v!==null&&typeof v==="object"
 ?"{"+Object.entries(v as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>JSON.stringify(k)+":"+stable(x)).join(",")+"}":JSON.stringify(v)??"null"
const sha=async(bytes:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new Uint8Array(bytes).buffer))).map(x=>x.toString(16).padStart(2,"0")).join("")
Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,"METHOD_NOT_ALLOWED")
 const url=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
 if(url!==`https://${PROJECT}.supabase.co`||!key)return reply(409,"DEVELOPMENT_ONLY")
 let claims:Record<string,unknown>
 try{
  const token=(req.headers.get("authorization")??"").replace(/^Bearer\s+/i,"")
  const verified=await jwtVerify(token,jwks,{issuer:"https://token.actions.githubusercontent.com",audience:AUD,algorithms:["RS256"],maxTokenAge:"5m"})
  claims=verified.payload
  if(!bankPitImportClaimsQualified(claims))return reply(403,"PIT_IMPORT_EXECUTOR_SCOPE_INVALID")
 }catch{return reply(401,"SIGNED_IMPORT_EXECUTOR_REQUIRED")}
 const body=await req.json().catch(()=>null) as Record<string,unknown>|null
 if(!body||body.action!==ACTION||!Array.isArray(body.originals)||body.originals.length!==manifest.length)
  return reply(400,"EXACT_PINNED_ORIGINAL_SET_REQUIRED")
 const reads=new Map<string,string>()
 for(const item of body.originals as Array<Record<string,unknown>>){
  const hash=typeof item.sha256==="string"?item.sha256:"",readUrl=typeof item.readUrl==="string"?item.readUrl:""
  const p=manifest.find(x=>x.original_sha256===hash)
  if(!p||reads.has(hash)||!bankPitOriginalReadUrl(readUrl,p.r2_object_key))return reply(400,"PIT_ORIGINAL_STORAGE_SCOPE_INVALID")
  reads.set(hash,readUrl)
 }
 const db=createClient(url,key,{auth:{persistSession:false}}),results:Record<string,unknown>[]=[]
 for(const p of manifest){
  try{
   const res=await fetch(reads.get(p.original_sha256)!,{redirect:"error",signal:AbortSignal.timeout(20000)})
   if(!res.ok)throw Error("PIT_ORIGINAL_READ_FAILED")
   const bytes=new Uint8Array(await res.arrayBuffer())
   const format="original_format" in p?p.original_format:"PDF"
   if(bytes.length!==p.original_bytes||!bankPitOriginalFormatQualified(bytes,String(format))||await sha(bytes)!==p.original_sha256)
    throw Error("PIT_ORIGINAL_BYTES_MISMATCH")
   const raw={version:KIND,...p,publication_precision:"EXACT",proven_availability_at:p.published_at,
    r2_bucket:"portfolioai-history-dev",r2_verified_sha256:p.original_sha256,canonical_promotion:false,
    extraction_status:"ORIGINAL_REGISTERED_NUMERIC_REVIEW_NOT_EXECUTED"}
   const payloadHash=await sha(new TextEncoder().encode(stable(raw)))
   const identity={source_code:"NSE_OFFICIAL",record_kind:KIND,external_record_id:`${p.symbol}:${p.original_sha256}`}
   const existing=await db.from("data_source_records").select("id,payload_hash").match(identity).maybeSingle()
   if(existing.error)throw Error("PIT_ORIGINAL_LOOKUP_FAILED")
   if(existing.data&&existing.data.payload_hash!==payloadHash)throw Error("PIT_ORIGINAL_IDEMPOTENCY_CONFLICT")
   if(!existing.data){
    const inserted=await db.from("data_source_records").insert({...identity,raw_payload:raw,payload_hash:payloadHash,
     source_url:p.original_url,published_at:p.published_at,retrieved_at:new Date().toISOString(),
     terms_snapshot:{environment:"PortfolioAI-Development",registration_action:ACTION,executor:"GITHUB_ACTIONS_OIDC",
      execution_sha:claims.sha,run_id:claims.run_id,durable_bytes_verified_at:new Date().toISOString(),canonical_promotion:false}
    }).select("id").single()
    if(inserted.error&&inserted.error.code!=="23505")throw Error("PIT_ORIGINAL_REGISTRATION_FAILED")
   }
   const readback=await db.from("data_source_records").select("id,payload_hash,raw_payload").match(identity).single()
   if(readback.error||!readback.data||readback.data.payload_hash!==payloadHash||await sha(new TextEncoder().encode(stable(readback.data.raw_payload)))!==payloadHash)
    throw Error("PIT_ORIGINAL_CANONICAL_SOURCE_READBACK_FAILED")
   results.push({sourceRecordId:readback.data.id,originalSha256:p.original_sha256,publishedAt:p.published_at,
    state:existing.data?"REUSED_HASH_VERIFIED_SOURCE":"REGISTERED_HASH_VERIFIED_SOURCE",canonicalAdmitted:false})
  }catch(error){
   results.push({originalSha256:p.original_sha256,state:"FAILED_NO_ADMISSION",code:bankPitImportSafeError(error)})
  }
 }
 const registered=results.filter(r=>r.sourceRecordId).length
 return reply(registered===manifest.length?200:503,registered===manifest.length?"PINNED_PIT_ORIGINALS_REGISTERED_NOT_ADMITTED":"PIT_ORIGINAL_BATCH_PARTIAL",{
  expected:manifest.length,registered,results,providerCalls:0,canonicalAdmissions:0,canonicalMaterializations:0})
})
