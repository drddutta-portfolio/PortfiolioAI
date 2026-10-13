import type {OpenSessionRecord,OrdinaryTimingAuthority} from './v14-bank-open-session-status.ts'
import type {SupabaseClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {qualifyKvbHistoryRenewal,KVB_HISTORY_SECURITY_ID,KVB_HISTORY_TAIL_HASH,type RenewalSource,type RenewalHistoryRow} from "./v14-kvb-history-renewal.ts"
import {kvbPbHash,kvbPbStableId} from "./v14-kvb-pb-admission.ts"
import {inspectStoredHistory} from "./p7-ic-input-validation.ts"
import tailPin from "./v14-kvb-history-renewal-tail-pin.json" with {type:"json"}
import sourcePins from "./v14-kvb-history-renewal-source-pins.json" with {type:"json"}
import calendarPins from "./v14-kvb-history-renewal-calendar-pins.json" with {type:"json"}
const sourceColumns="id,source_code,record_kind,retrieved_at,payload_hash,raw_payload,terms_snapshot"
const bucket="portfolioai-history-dev",prefix="portfolioai-history/development/v1-4/banking/pit-originals/"
export function kvbHistoryTailReadUrl(raw:string){try{const u=new URL(raw);return u.protocol==="https:"&&u.hostname==="ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com"&&!u.username&&!u.password&&!u.port&&!u.hash&&decodeURIComponent(u.pathname)===`/${bucket}/${prefix}${KVB_HISTORY_TAIL_HASH}.json`&&u.searchParams.get("X-Amz-Algorithm")==="AWS4-HMAC-SHA256"&&Number(u.searchParams.get("X-Amz-Expires"))>0&&Number(u.searchParams.get("X-Amz-Expires"))<=300}catch{return false}}
const sessionOf=(r:RenewalHistoryRow)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(r.period_start))
/** Read-only, fixed KVB source requalification. No provider calls, writes,
 * materialization, grants, basis changes or evidence approvals occur here.
 * An already-authorized caller may append these immutable source candidates. */
export async function prepareKvbStoredHistoryRenewal(db:SupabaseClient,readUrl:string,verifiedAt=new Date().toISOString(),openSession?:{record:OpenSessionRecord;timing:OrdinaryTimingAuthority}){
 if(!kvbHistoryTailReadUrl(readUrl))throw Error("KVB_PINNED_CA_TAIL_READ_URL_REQUIRED")
 if(!Number.isFinite(Date.parse(verifiedAt)))throw Error("KVB_RENEWAL_CUTOFF_INVALID")
 const response=await fetch(readUrl,{redirect:"error",signal:AbortSignal.timeout(20000)})
 if(!response.ok)throw Error("KVB_PINNED_CA_TAIL_R2_READ_FAILED")
 const bytes=new Uint8Array(await response.arrayBuffer()),hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))).map(x=>x.toString(16).padStart(2,"0")).join("")
 if(bytes.length!==2||new TextDecoder().decode(bytes)!=="[]"||hash!==tailPin.original_sha256||hash!==KVB_HISTORY_TAIL_HASH)throw Error("KVB_PINNED_CA_TAIL_ORIGINAL_MISMATCH")
 const tailRaw={symbol:"KARURVYSYA",from_date:"2026-10-09",through_date:"2026-10-12",official_response:[],original_sha256:hash,original_bytes:2,original_url:tailPin.original_url,
  first_verified_available_at:tailPin.retrieved_at,r2_bucket:bucket,r2_object_key:prefix+hash+".json"}
 const tail:RenewalSource={id:await kvbPbStableId({kind:"KVB_CA_TAIL",from:"2026-10-09",through:"2026-10-12",hash}),source_code:"NSE_OFFICIAL",record_kind:"V1_4_BANK_OFFICIAL_CORPORATE_ACTION_TAIL",retrieved_at:tailPin.retrieved_at,payload_hash:await kvbPbHash(tailRaw),raw_payload:tailRaw}
 const inputRead=await db.from("data_source_records").select(sourceColumns).in("id",[...sourcePins,...calendarPins].map(p=>p.id))
 if(inputRead.error||inputRead.data?.length!==sourcePins.length+calendarPins.length)throw Error("KVB_PINNED_RENEWAL_SOURCES_MISSING")
 const sources=inputRead.data as RenewalSource[],find=(id:string)=>{const found=sources.find(s=>s.id===id);if(!found)throw Error("KVB_PINNED_RENEWAL_SOURCE_MISSING");return found}
 const calendar=find("f692746f-27ae-4b84-8e72-e3aa3a10c41e"),preOpenCalendarRecords=calendarPins.map(p=>find(p.id))
 const candidates=[tail],pair=[]
 for(const target of [KVB_HISTORY_SECURITY_ID,"NIFTY_BANK"]){
  const stock=target===KVB_HISTORY_SECURITY_ID,prior=find(stock?"7e34dc00-00fb-4f0a-8bce-5dd91c8f61d3":"22838e70-4c95-4c75-ab3e-a513e1bad32c"),capture=find(stock?"fe6d1ea8-4244-4db4-bcbe-ac4e35b69e7a":"f211ba76-5cab-4d59-b21c-51a68ac0d8c6")
  const runId=String(capture.terms_snapshot?.ingestion_run_id??""),reservationId=String(capture.terms_snapshot?.reservation_id??"")
  const [run,reservation,usage,rowsRead]=await Promise.all([
   db.from("data_ingestion_runs").select("*").eq("id",runId).single(),db.from("provider_budget_reservations").select("*").eq("id",reservationId).single(),
   db.from("provider_usage_events").select("*").eq("ingestion_run_id",runId).eq("data_domain","MARKET_HISTORY"),
   db.from(stock?"market_price_history":"market_benchmark_price_history").select("period_start,retrieved_at,open::text,high::text,low::text,close::text,volume::text,provider_code,provenance").eq(stock?"security_id":"benchmark_code",target).eq("provider_code","ANGEL_ONE").eq("interval","ONE_DAY").lte("retrieved_at",verifiedAt).order("period_start",{ascending:false}).limit(400)
  ])
  if(run.error||reservation.error||usage.error||rowsRead.error)throw Error("KVB_RENEWAL_CANONICAL_INPUT_READ_FAILED")
  const allRows=rowsRead.data as RenewalHistoryRow[],inspection=inspectStoredHistory(allRows,252,Date.parse(verifiedAt))
  if(["CONFLICTING","INSUFFICIENT"].includes(inspection.state)||inspection.reason==="HISTORY_INPUT_INVALID")throw Error("KVB_RETAINED_HISTORY_INVALID:"+inspection.reason)
  const selectedDates=[...new Set(allRows.map(sessionOf))].sort().slice(-252),selectedSet=new Set(selectedDates),rows=allRows.filter(r=>selectedSet.has(sessionOf(r)))
  const qualified=await qualifyKvbHistoryRenewal({target,prior,capture,calendar,corporateActionTail:stock?tail:undefined,rows,
   accounting:{run:run.data,reservation:reservation.data,usageEvents:usage.data},verifiedAt,preOpenCalendarRecords,openSessionRecord:openSession?.record,timingAuthority:openSession?.timing})
  if(!qualified.qualified)throw Error(qualified.reason)
  let candidate:RenewalSource={id:await kvbPbStableId({kind:"KVB_HISTORY_RENEWAL",target,prior:prior.id,capture:capture.id,calendar:calendar.id,tail:stock?tail.id:null}),
   source_code:"OWNER_REVIEWED_CLASSIFICATION",record_kind:"V1_4_HISTORY_CONTRACT_VALIDATION",retrieved_at:verifiedAt,payload_hash:await kvbPbHash(qualified.rawPayload),raw_payload:qualified.rawPayload}
  const previous=await db.from("data_source_records").select(sourceColumns).eq("id",candidate.id).maybeSingle()
  if(previous.error)throw Error("KVB_RENEWAL_EXISTING_ID_LOOKUP_FAILED")
  if(previous.data){if(previous.data.payload_hash!==candidate.payload_hash||await kvbPbHash(previous.data.raw_payload)!==candidate.payload_hash)throw Error("KVB_RENEWAL_EXISTING_ID_CONFLICT");candidate={...candidate,retrieved_at:previous.data.retrieved_at}}
  candidates.push(candidate);pair.push({target,candidate,rows,proof:qualified.proof,currentSessionDecision:qualified.currentSessionDecision,state:qualified.validation.state})
 }
 return {revision:await kvbPbHash(pair.map(p=>({id:p.candidate.id,hash:p.candidate.payload_hash}))),sourceCandidates:candidates,
  stock:pair[0]!,benchmark:pair[1]!,latestCompletedSession:"2026-10-12",verifiedAt,
  benchmarkPairState:"REVIEW_REQUIRED" as const,benchmarkPairReason:"STOCK_BENCHMARK_RETURN_BASIS_MISMATCH",
  mixedReturnBasisApproved:false,providerCalls:0,writes:0}
}
