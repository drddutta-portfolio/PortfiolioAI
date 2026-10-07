import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"

const DEV="lrgpjimipfkyoqbpsqzz"
const PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2"
const REVIEW_VERSION="V1_4_REQUIREMENT_REVIEW_V2"
const PACKAGE_KIND="V1_4_OWNER_REVIEW_CANDIDATE_PACKAGE"
const CONFIRMATION="I_APPROVE_SELECTED_V1_4_REVIEW_CANDIDATES"
const HASH=/^[0-9a-f]{64}$/u
const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store"}})
const stable=(v:unknown):string=>Array.isArray(v)?"["+v.map(stable).join(",")+"]":v!==null&&typeof v==="object"?"{"+Object.entries(v as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>JSON.stringify(k)+":"+stable(x)).join(",")+"}":JSON.stringify(v)??"null"
const sha=async(v:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(typeof v==="string"?v:stable(v))))).map(x=>x.toString(16).padStart(2,"0")).join("")
const strings=(v:unknown,out:string[]=[]):string[]=>{if(typeof v==="string")out.push(v);else if(Array.isArray(v))v.forEach(x=>strings(x,out));else if(v&&typeof v==="object")Object.values(v as Record<string,unknown>).forEach(x=>strings(x,out));return out}
const exactFragment=(payload:unknown,fragment:string)=>fragment.length>0&&strings(payload).some(x=>x.includes(fragment))
const asString=(v:unknown)=>typeof v==="string"?v:null

Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,{code:"METHOD_NOT_ALLOWED"})
 const url=Deno.env.get("SUPABASE_URL")??"",service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??""
 let ref:string|null=null;try{ref=new URL(url).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1]??null}catch{}
 if(ref!==DEV||!service)return reply(409,{code:"UNAPPROVED_DEVELOPMENT_TARGET"})
 const token=(req.headers.get("authorization")??"").replace(/^Bearer\s+/iu,"").trim()
 if(!token)return reply(401,{code:"OWNER_AUTH_REQUIRED"})
 const admin=createClient(url,service,{auth:{persistSession:false}})
 const user=await admin.auth.getUser(token)
 if(user.error||!user.data.user)return reply(401,{code:"OWNER_AUTH_INVALID"})
 const portfolio=await admin.from("portfolios").select("user_id").eq("id",PORTFOLIO).single()
 if(portfolio.error||portfolio.data?.user_id!==user.data.user.id)return reply(403,{code:"PORTFOLIO_OWNER_REQUIRED"})
 const body=await req.json().catch(()=>({})) as Record<string,unknown>
 if(body.confirmation!==CONFIRMATION)return reply(409,{code:"EXPLICIT_CONFIRMATION_REQUIRED"})
 const packageRecordId=asString(body.packageRecordId),packageHash=asString(body.packageHash)
 const approved=Array.isArray(body.approvedCandidateIds)&&body.approvedCandidateIds.every(x=>typeof x==="string")?[...new Set(body.approvedCandidateIds as string[])]:null
 if(!packageRecordId||!packageHash||!HASH.test(packageHash)||!approved?.length)return reply(400,{code:"PACKAGE_OR_SELECTION_INVALID"})
 const pkgQ=await admin.from("data_source_records").select("id,record_kind,payload_hash,raw_payload").eq("id",packageRecordId).eq("record_kind",PACKAGE_KIND).single()
 if(pkgQ.error||!pkgQ.data||pkgQ.data.payload_hash!==packageHash)return reply(409,{code:"PACKAGE_INTEGRITY_INVALID"})
 const pkg=pkgQ.data.raw_payload as Record<string,unknown>
 const candidates=Array.isArray(pkg.candidates)?pkg.candidates as Record<string,unknown>[]:[]
 const byId=new Map(candidates.map(c=>[String(c.candidate_id),c]))
 if(approved.some(id=>!byId.has(id)))return reply(409,{code:"CANDIDATE_SELECTION_OUT_OF_PACKAGE"})
 const sourceIds=[...new Set(approved.map(id=>asString(byId.get(id)!.source_record_id)).filter((x):x is string=>Boolean(x)))]
 const docIds=[...new Set(approved.map(id=>asString(byId.get(id)!.research_document_id)).filter((x):x is string=>Boolean(x)))]
 const [sources,docs,links]=await Promise.all([
  admin.from("data_source_records").select("id,source_code,retrieved_at,published_at,payload_hash,raw_payload").in("id",sourceIds),
  admin.from("research_documents").select("id,security_id,identity_status,canonical_content_hash,published_at").in("id",docIds),
  admin.from("research_document_sources").select("id,research_document_id,source_record_id,provider_document_id,content_hash,source_url,source_status").in("research_document_id",docIds)
 ])
 if(sources.error||docs.error||links.error)return reply(500,{code:"SOURCE_BINDING_READ_FAILED"})
 const sourceBy=new Map((sources.data??[]).map(x=>[x.id,x])),docBy=new Map((docs.data??[]).map(x=>[x.id,x]))
 const now=new Date().toISOString(),rows:Record<string,unknown>[]=[]
 for(const id of approved){
  const c=byId.get(id)!,sourceId=asString(c.source_record_id),docId=asString(c.research_document_id)
  const source=sourceId?sourceBy.get(sourceId):null,doc=docId?docBy.get(docId):null
  if(!source||!doc)return reply(409,{code:"CANDIDATE_SOURCE_OR_DOCUMENT_MISSING",candidateId:id})
  if(source.payload_hash!==c.source_payload_hash||!HASH.test(source.payload_hash))return reply(409,{code:"CANDIDATE_SOURCE_HASH_MISMATCH",candidateId:id})
  if(doc.security_id!==c.security_id||doc.identity_status!=="VERIFIED"||doc.canonical_content_hash!==c.canonical_content_hash||!HASH.test(String(doc.canonical_content_hash??"")))return reply(409,{code:"CANDIDATE_DOCUMENT_IDENTITY_INVALID",candidateId:id})
  const matching=(links.data??[]).filter(x=>x.research_document_id===docId&&x.source_record_id===sourceId&&x.source_status==="VERIFIED")
  if(matching.length!==1||matching[0]!.content_hash!==doc.canonical_content_hash||matching[0]!.provider_document_id!==c.provider_document_id||matching[0]!.source_url!==c.source_url)return reply(409,{code:"CANDIDATE_DOCUMENT_SOURCE_INVALID",candidateId:id})
  const quote=asString(c.supporting_quote)??""
  if(!exactFragment(source.raw_payload,quote))return reply(409,{code:"CANDIDATE_QUOTE_NOT_BOUND",candidateId:id})
  const fresh=asString(c.fresh_through);if(!fresh||Date.parse(fresh)<Date.now())return reply(409,{code:"CANDIDATE_FRESHNESS_EXPIRED",candidateId:id})
  const metadata={...(c.metadata&&typeof c.metadata==="object"&&!Array.isArray(c.metadata)?c.metadata as Record<string,unknown>:{}),package_record_id:packageRecordId,package_hash:packageHash,candidate_id:id}
  const row={
   portfolio_id:PORTFOLIO,security_id:c.security_id,requirement_code:c.requirement_code,review_kind:"OWNER_DOCUMENT_REVIEW",decision:"SUPPORTS",
   source_record_id:sourceId,research_document_id:docId,provider_document_id:c.provider_document_id,source_payload_hash:source.payload_hash,
   supporting_quote:quote,period_start:null,period_end:null,period_type:null,unit:null,currency:null,consolidation_scope:null,
   published_at:source.published_at,retrieved_at:source.retrieved_at,fresh_through:fresh,review_version:REVIEW_VERSION,
   reviewed_by:user.data.user.id,reviewed_at:now,supersedes_review_id:null,metadata
  }
  rows.push({...row,review_hash:await sha(row)})
 }
 const ins=await admin.from("research_evidence_requirement_reviews").insert(rows).select("id,security_id,requirement_code,review_hash,reviewed_at")
 if(ins.error)return reply(409,{code:"REVIEW_LEDGER_INSERT_FAILED",detail:ins.error.code})
 return reply(200,{packageRecordId,packageHash,approvedCandidateIds:approved,inserted:ins.data??[],unapprovedCandidateIds:candidates.map(x=>String(x.candidate_id)).filter(x=>!approved.includes(x))})
})