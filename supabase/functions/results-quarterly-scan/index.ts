import { createClient } from "https://esm.sh/@supabase/supabase-js@2.115.0"

/**
 * Results R3 incremental scanner. An authenticated owner starts a complete
 * transaction-derived equity run, then processes bounded, resumable batches.
 * It never infers missing quarters or changes V1-4 research selections.
 *
 * No database migration: existing data_ingestion_runs/run_items,
 * research_documents/sources, data_source_records and fundamental_observations.
 */
const SOURCE = "COMPANY_EXCHANGE_FILING"
const OPERATION = "RESULTS_QUARTERLY_SCAN"
const DOMAIN = "QUARTERLY_RESULTS"
const MAX_BATCH = 12
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info",
  "Content-Type": "application/json",
}
type Db = ReturnType<typeof createClient>
type Body = { action?: string; portfolioId?: string; runId?: string }
type Item = { id: string; security_id: string }
type SourceLink = { research_document_id: string; source_url: string | null; source_code: string; source_title: string | null; source_record_id: string }
type Candidate = { code: string; value: string; unit: string; end: string; scope: "STANDALONE" | "CONSOLIDATED" }
const reply = (status: number, result: Record<string, unknown>) => new Response(JSON.stringify(result), { status, headers })
const digest = async (bytes: Uint8Array) =>
  Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map((b) => b.toString(16).padStart(2, "0")).join("")
const errCode = (e: unknown) => e instanceof Error ? e.message.slice(0, 70) : "UNKNOWN_FAILURE"
function rejectUrl(raw: string): string | null {
  try {
    const u = new URL(raw)
    if (u.protocol !== "https:" || u.username || u.password || u.port) return null
    if (/^(localhost|.*\.local|.*\.internal|\d+(\.\d+){3}|\[)/i.test(u.hostname)) return null
    // Only issuer links already registered and verified as source identities
    // are fetched; never follow redirects into internal networks.
    return u.toString()
  } catch { return null }
}
function period(text: string): string | null {
  // The source text, not its URL or retrieval date, must name its quarter.
  const m = /\b(?:quarter|three months)\s+ended\s+(?:on\s+)?(30[/.-\s](?:jun|june|06)[/.-\s]20\d\d|30[/.-\s](?:sep|september|09)[/.-\s]20\d\d|31[/.-\s](?:dec|december|12)[/.-\s]20\d\d|31[/.-\s](?:mar|march|03)[/.-\s]20\d\d)\b/i.exec(text)
  if (!m) return null
  const v=m[1].toLowerCase(), y=/20\d\d/.exec(v)?.[0]
  const mon=/jun|june|06/.test(v)?"06":/sep|september|09/.test(v)?"09":/dec|december|12/.test(v)?"12":/mar|march|03/.test(v)?"03":null
  if (!y || !mon) return null
  return y+"-"+mon+"-"+(mon==="06"||mon==="09"?"30":"31")
}
function extract(text: string): Candidate[] {
  const end = period(text)
  // Do not confuse consolidated amounts with standalone values.
  const scopes = ["STANDALONE","CONSOLIDATED"].filter((s) => new RegExp("\\b"+s+"\\b","i").test(text))
  if (!end || scopes.length !== 1) return []
  // A conservative parser for explicitly labelled single-value issuer facts
  // in text / HTML filings. Multicolumn unaudited statement tables are not
  // admitted without a later column-aware parser.
  const rows = text.split(/\r?\n/).map((s) => s.replace(/\s+/g," ").trim())
  const codes: readonly [RegExp,string][] = [
    [/^(?:revenue from operations|income from operations)\s*[:=-]\s*/, "OPERATING_REVENUE_QUARTER"],
    [/^(?:net profit after tax|profit after tax)\s*[:=-]\s*/, "NET_PROFIT_QUARTER"],
    [/^diluted (?:earnings per share|eps)\s*[:=-]\s*/, "EPS_DILUTED"],
  ]
  const unitMatch = /\b(?:in|amounts in|rs\.?\s*in|₹)\s+(crore|crores|lakh|lakhs)\b/i.exec(text)
  const moneyUnit = unitMatch?.[1].toLowerCase().startsWith("lakh") ? "LAKH" : unitMatch ? "CRORE" : null
  const candidates: Candidate[] = []
  for (const [pattern,code] of codes) {
    const matches = rows.flatMap((line) => {
      const m=pattern.exec(line)
      if(!m) return []
      const remainder=line.slice(m[0].length)
      const n=/^\(?-?[\d,]+(?:\.\d+)?\)?$/.exec(remainder)
      if(!n) return []
      return [n[0]]
    })
    if (matches.length !== 1) continue
    const raw = matches[0].replace(/,/g,"")
    const value = raw.startsWith("(") ? "-"+raw.slice(1,-1) : raw
    if (!/^-?\d+(?:\.\d+)?$/.test(value)) continue
    if (code!=="EPS_DILUTED" && !moneyUnit) continue
    candidates.push({code,value,unit:code==="EPS_DILUTED"?"INR_PER_SHARE":moneyUnit!,end,scope:scopes[0] as Candidate["scope"]})
  }
  return candidates
}
function asText(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?</script>/gi,"")
    .replace(/<style\b[^>]*>[\s\S]*?</style>/gi,"")
    .replace(/</(?:tr|p|div|h\d|table|section)>/gi,"\n")
    .replace(/<[^>]*>/g," ").replace(/&nbsp;|&#160;/gi," ")
    .replace(/&amp;/gi,"&").replace(/&#8377;/g,"₹")
}
async function sourceText(url: string): Promise<{ text: string; hash: string } | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 7500)
  try {
    const response = await fetch(url, { redirect: "manual", signal: controller.signal, headers: {Accept:"text/html,text/plain,application/json,application/pdf"} })
    if (!response.ok || response.status >=300) return null
    const length = Number(response.headers.get("content-length")??"0")
    if (length>2_000_000) return null
    const contentType = (response.headers.get("content-type")??"").toLowerCase()
    if (contentType.includes("pdf")) return null // no unvalidated PDF numeric parser
    if (!/text|json|xml|html/.test(contentType)) return null
    const buffer=new Uint8Array(await response.arrayBuffer())
    if (buffer.length>2_000_000) return null
    const hash=await digest(buffer)
    return {text:asText(new TextDecoder().decode(buffer)),hash}
  } finally { clearTimeout(timeout) }
}
async function checkOwner(admin: Db, jwt: string, id: string): Promise<string | null> {
  const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!
  const u=createClient(url,anon,{global:{headers:{Authorization:jwt}}})
  const auth=await u.auth.getUser()
  if(auth.error||!auth.data.user) return null
  const p=await admin.from("portfolios").select("id").eq("id",id).eq("user_id",auth.data.user.id).maybeSingle()
  if(p.error||!p.data) return null
  return auth.data.user.id
}
async function status(admin: Db, portfolioId: string) {
  const latest=await admin.from("data_ingestion_runs").select("id,status,started_at,completed_at,requested_count,cached_count,fetched_count,failed_count,accepted_count,unchanged_count,error_summary")
    .eq("portfolio_id",portfolioId).eq("operation",OPERATION).order("started_at",{ascending:false}).limit(1).maybeSingle()
  if(latest.error) throw latest.error
  if(!latest.data) return {lastScan:null,newResults:0,run:null}
  const items=await admin.from("data_ingestion_run_items").select("status").eq("ingestion_run_id",latest.data.id)
  if(items.error) throw items.error
  const pending=items.data.filter((r)=>r.status==="PLANNED").length
  return {lastScan:latest.data.completed_at, newResults:latest.data.accepted_count??0, run:{...latest.data,pending,processed:items.data.length-pending}}
}
async function start(admin: Db, portfolioId: string, userId: string) {
  const prior=await status(admin,portfolioId)
  if(prior.run?.status==="RUNNING") return prior
  const transactions: {security_id: string}[]=[]
  for(let offset=0;;offset+=700){
    const q=await admin.from("transactions").select("security_id").eq("portfolio_id",portfolioId).range(offset,offset+699)
    if(q.error) throw q.error
    transactions.push(...q.data)
    if(q.data.length<700) break
  }
  const ids=[...new Set(transactions.map((t)=>t.security_id))]
  const equities:string[]=[]
  for(let i=0;i<ids.length;i+=100){
    const q=await admin.from("securities").select("id").eq("asset_class","EQUITY").in("id",ids.slice(i,i+100))
    if(q.error) throw q.error
    equities.push(...q.data.map((s)=>s.id))
  }
  const run=await admin.from("data_ingestion_runs").insert({
    portfolio_id:portfolioId,source_code:SOURCE,operation:OPERATION,status:"RUNNING",
    trigger_source:"OWNER",orchestration_type:"BOUNDED_REFRESH",requested_by:userId,requested_count:equities.length,
    metadata:{contract:"R3_REUSE_FIRST_V1",provider_calls:0,quarter_reporting_proof_required:true},
  }).select("id").single()
  if(run.error) throw run.error
  for(let i=0;i<equities.length;i+=80){
    const batch=equities.slice(i,i+80).map((security_id)=>({ingestion_run_id:run.data.id,security_id,data_domain:DOMAIN,status:"PLANNED"}))
    const saved=await admin.from("data_ingestion_run_items").insert(batch)
    if(saved.error) throw saved.error
  }
  return status(admin,portfolioId)
}
async function checkStock(admin: Db, securityId: string, runId: string):Promise<{added:number; reason:string; checked:number}> {
  const existing=await admin.from("fundamental_observations").select("metric_code,period_end").eq("security_id",securityId).eq("period_type","QUARTER").not("period_end","is",null).in("metric_code",["OPERATING_REVENUE_QUARTER","OPERATING_PROFIT_QUARTER","NET_INTEREST_INCOME_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"])
  if(existing.error) throw existing.error
  const known=new Set(existing.data.map((r)=>r.period_end+":"+r.metric_code))
  const docs=await admin.from("research_documents").select("id,identity_status,document_type").eq("security_id",securityId).eq("document_type","QUARTERLY_RESULT").limit(30)
  if(docs.error) throw docs.error
  const qualified=docs.data.filter((d)=>d.identity_status==="VERIFIED").map((d)=>d.id)
  if(!qualified.length) return {added:0,checked:0,reason:known.size?"HAVE_PARTIAL_QUARTERS":"NO_VERIFIED_SOURCE"}
  const links=await admin.from("research_document_sources").select("research_document_id,source_url,source_code,source_title,source_record_id").in("research_document_id",qualified).limit(50)
  if(links.error) throw links.error
  const candidates=(links.data as SourceLink[]).filter((r)=>r.source_code===SOURCE && r.source_url && rejectUrl(r.source_url))
  if(!candidates.length) return {added:0,checked:0,reason:"NO_FETCHABLE_ORIGINAL"}
  let added=0,checked=0
  for(const link of candidates.slice(0,4)){
    const url=rejectUrl(link.source_url!)
    if(!url) continue
    const already=await admin.from("data_source_records").select("id").eq("source_code",SOURCE).eq("record_kind","RESULTS_QUARTERLY_SCAN_EXTRACT").eq("external_record_id",link.research_document_id).limit(1)
    if(already.error) throw already.error
    if(already.data.length) continue
    checked++
    const source=await sourceText(url).catch(()=>null)
    if(!source) continue
    const parsed=extract(source.text).filter((v)=>!known.has(v.end+":"+v.code))
    if(!parsed.length) continue
    const manifest={security_id:securityId,source_document_id:link.research_document_id,original_sha256:source.hash,source_url:url,quarter_candidates:parsed,original_bytes_stored:false,publication_timestamp_known:false,extraction_version:"R3_STRICT_TEXT_V1"}
    const payload=new TextEncoder().encode(JSON.stringify(manifest))
    const payloadHash=await digest(payload)
    const record=await admin.from("data_source_records").upsert({
      source_code:SOURCE,ingestion_run_id:runId,record_kind:"RESULTS_QUARTERLY_SCAN_EXTRACT",
      external_record_id:link.research_document_id,payload_hash:payloadHash,raw_payload:manifest,source_url:url,
      terms_snapshot:{retention:"COMPACT_FACTS_ONLY",source_qualification:"REVIEW_PENDING"},
    },{onConflict:"source_code,record_kind,external_record_id,payload_hash",ignoreDuplicates:true}).select("id").maybeSingle()
    if(record.error) throw record.error
    let recordId=record.data?.id
    if(!recordId){
      const r=await admin.from("data_source_records").select("id").eq("source_code",SOURCE).eq("record_kind","RESULTS_QUARTERLY_SCAN_EXTRACT").eq("external_record_id",link.research_document_id).eq("payload_hash",payloadHash).single()
      if(r.error) throw r.error
      recordId=r.data.id
    }
    const now=new Date().toISOString(),freshUntil=new Date(Date.now()+120*86400000).toISOString()
    const observations=parsed.map((v)=>({
      security_id:securityId,metric_code:v.code,source_record_id:recordId,source_code:SOURCE,
      numeric_value:v.value,unit:v.unit==="LAKH"? "Cr" :v.unit==="CRORE"?"Cr":"INR_PER_SHARE",
      currency:"INR",period_type:"QUARTER",period_end:v.end,consolidation_scope:v.scope,
      retrieved_at:now,fresh_until:freshUntil,evidence_status:"AVAILABLE",
    }))
    // Precise lakh/crore scaling is mandatory. Do not import rows whose
    // declared units require conversion absent an exact decimal adapter.
    const safe=observations.filter((_v,i)=>parsed[i].unit!=="LAKH")
    if(!safe.length) continue
    const saved=await admin.from("fundamental_observations").upsert(safe,{
      onConflict:"security_id,metric_code,source_code,period_end,period_type,consolidation_scope,source_record_id",ignoreDuplicates:true,
    }).select("id")
    if(saved.error) throw saved.error
    added+=(saved.data??[]).length
  }
  return {added,checked,reason:added?"RECOVERED":checked?"SOURCE_UNSTRUCTURED":"NO_NEW_SOURCE"}
}
async function step(admin: Db, portfolioId: string, runId: string) {
  const run=await admin.from("data_ingestion_runs").select("id,status,requested_count").eq("id",runId).eq("portfolio_id",portfolioId).eq("operation",OPERATION).single()
  if(run.error||run.data.status!=="RUNNING") throw new Error("SCAN_NOT_ACTIVE")
  const pending=await admin.from("data_ingestion_run_items").select("id,security_id").eq("ingestion_run_id",runId).eq("data_domain",DOMAIN).eq("status","PLANNED").order("security_id").limit(MAX_BATCH)
  if(pending.error) throw pending.error
  for(const item of pending.data as Item[]){
    const lock=await admin.from("data_ingestion_run_items").update({status:"ATTEMPTED",started_at:new Date().toISOString()}).eq("id",item.id).eq("status","PLANNED").select("id")
    if(lock.error) throw lock.error
    if(!lock.data.length) continue
    let reason: string,added=0,checked=0,statusCode="FAILED"
    try{
      const result=await checkStock(admin,item.security_id,runId)
      added=result.added;checked=result.checked;reason=result.reason
      statusCode=added?"ACCEPTED":reason==="HAVE_PARTIAL_QUARTERS"?"UNCHANGED":"REJECTED"
    }catch(error){reason="SOURCE_READ_FAILED";console.error("Results scan item failed",item.security_id,errCode(error))}
    const stored=await admin.from("data_ingestion_run_items").update({
      status:statusCode,safe_reason_code:reason,accepted_record_count:added,attempted_call_count:0,
      completed_at:new Date().toISOString(),metadata:{documents_checked:checked,provider_calls:0},
    }).eq("id",item.id)
    if(stored.error) throw stored.error
  }
  const states=await admin.from("data_ingestion_run_items").select("status,accepted_record_count").eq("ingestion_run_id",runId)
  if(states.error) throw states.error
  const rows=states.data
  const left=rows.filter((r)=>r.status==="PLANNED"||r.status==="ATTEMPTED").length
  const accepted=rows.reduce((n,r)=>n+(r.accepted_record_count??0),0)
  const failed=rows.filter((r)=>r.status==="FAILED").length
  const rejected=rows.filter((r)=>r.status==="REJECTED").length
  const done=left===0
  const upd=await admin.from("data_ingestion_runs").update({
    status:done?(failed||rejected?"PARTIAL":"SUCCEEDED"):"RUNNING",
    completed_at:done?new Date().toISOString():null,accepted_count:accepted,
    failed_count:failed,rejected_count:rejected,unchanged_count:rows.filter((r)=>r.status==="UNCHANGED").length,
    cached_count:rows.length-rejected-failed,
    metadata:{contract:"R3_REUSE_FIRST_V1",processed:rows.length-left,not_qualified:rejected,provider_calls:0},
  }).eq("id",runId)
  if(upd.error) throw upd.error
  return status(admin,portfolioId)
}

Deno.serve(async (request:Request)=>{
  if(request.method==="OPTIONS") return new Response("ok",{headers})
  if(request.method!=="POST") return reply(405,{error:"METHOD_NOT_ALLOWED"})
  const jwt=request.headers.get("authorization")
  const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if(!jwt) return reply(401,{error:"AUTH_REQUIRED"})
  if(!url||!key||!Deno.env.get("SUPABASE_ANON_KEY")) return reply(503,{error:"CONFIGURATION_MISSING"})
  const admin=createClient(url,key,{auth:{persistSession:false}})
  try{
    const body=await request.json() as Body
    if(!body.portfolioId||!["STATUS","START","STEP"].includes(body.action??"")) return reply(400,{error:"INVALID_SCAN_REQUEST"})
    const userId=await checkOwner(admin,jwt,body.portfolioId)
    if(!userId) return reply(403,{error:"PORTFOLIO_FORBIDDEN"})
    if(body.action==="STATUS") return reply(200,await status(admin,body.portfolioId))
    if(body.action==="START") return reply(200,await start(admin,body.portfolioId,userId))
    if(!body.runId) return reply(400,{error:"RUN_ID_REQUIRED"})
    return reply(200,await step(admin,body.portfolioId,body.runId))
  }catch(error){console.error("Results quarterly scan",errCode(error));return reply(500,{error:"SCAN_OPERATION_FAILED",details:errCode(error)})}
})
