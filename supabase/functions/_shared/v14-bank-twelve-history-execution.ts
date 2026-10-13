import type {SupabaseClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {BANK_TWELVE_POLICY as policy} from "./v14-bank-twelve-delegation.ts"
import {BANK_TWELVE_HISTORY_TAIL_HASH,qualifyTwelveHistoryRenewal,type RenewalSource,type RenewalHistoryRow} from "./v14-bank-twelve-history-renewal.ts"
import {bankValueHash} from "./v14-bank-twelve-capital-review.ts"
import {inspectStoredHistory} from "./p7-ic-input-validation.ts"
import {parseHistoryContractProof,validateBenchmarkPairReadiness} from "./v14-history-readiness.ts"
import integrityPins from "./v14-bank-twelve-history-integrity-pins.json" with {type:"json"}
import tailPin from "./v14-bank-twelve-history-tail-manifest.json" with {type:"json"}
const FEDERAL="63889b52-85da-4a1b-9046-c1e975819f99"
const sourceColumns="id,source_code,record_kind,retrieved_at,payload_hash,raw_payload,terms_snapshot"
function tailReadUrl(raw:string){try{const u=new URL(raw);return u.protocol==="https:"&&u.hostname==="ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com"&&!u.username&&!u.password&&!u.port&&!u.hash&&decodeURIComponent(u.pathname)===`/${policy.storageBucket}/${policy.storageKeyPrefix}${BANK_TWELVE_HISTORY_TAIL_HASH}.json`&&u.searchParams.get("X-Amz-Algorithm")==="AWS4-HMAC-SHA256"&&Number(u.searchParams.get("X-Amz-Expires"))>0&&Number(u.searchParams.get("X-Amz-Expires"))<=300}catch{return false}}
export async function verifyTwelveRenewalSourceIntegrity(s:RenewalSource){const pin=integrityPins.find(p=>p.id===s.id),actual=await bankValueHash(s.raw_payload);if(pin?(s.payload_hash!==pin.original_ledger_hash||actual!==pin.canonical_raw_hash):actual!==s.payload_hash)throw Error("HISTORY_SOURCE_PAYLOAD_HASH_INVALID")}
export function twelveLatestPrior(rows:readonly RenewalSource[]):RenewalSource{if(!rows.length)throw Error("PRIOR_HISTORY_PROOF_MISSING");const latest=rows[0]!;if(rows.some(r=>Date.parse(r.retrieved_at)===Date.parse(latest.retrieved_at)&&JSON.stringify(r.raw_payload.proof)!==JSON.stringify(latest.raw_payload.proof)))throw Error("HISTORY_CONTRACT_PROOF_CONFLICT");return latest}
export function twelveRenewalCutoffQualified(proofRetrievedAt:readonly string[],cutoff:string){const at=Date.parse(cutoff);return Number.isFinite(at)&&proofRetrievedAt.length===2&&proofRetrievedAt.every(v=>Number.isFinite(Date.parse(v))&&Date.parse(v)<=at)}
async function identity(v:string){const hash=await bankValueHash(v);return hash.slice(0,8)+"-"+hash.slice(8,12)+"-5"+hash.slice(13,16)+"-a"+hash.slice(17,20)+"-"+hash.slice(20,32)}
/** Signed fixed-scope caller only. Append fresh qualification, never change old
 * sources/rows/selections. All source inputs are read from canonical storage. */
export async function renewTwelveStoredHistory(db:SupabaseClient,readUrl:string){
 if(!tailReadUrl(readUrl))throw Error("PINNED_CA_TAIL_READ_URL_REQUIRED")
 const response=await fetch(readUrl,{redirect:"error",signal:AbortSignal.timeout(20000)})
 if(!response.ok)throw Error("PINNED_CA_TAIL_R2_READ_FAILED")
 const bytes=new Uint8Array(await response.arrayBuffer()),hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))).map(x=>x.toString(16).padStart(2,"0")).join("")
 if(bytes.length!==2||new TextDecoder().decode(bytes)!=="[]"||hash!==BANK_TWELVE_HISTORY_TAIL_HASH)throw Error("PINNED_CA_TAIL_ORIGINAL_MISMATCH")
 const at=new Date().toISOString(),session=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata"}).format(new Date(at))
 if(session!==tailPin.through_date)throw Error("PINNED_CA_TAIL_SESSION_NOT_CURRENT")
 const tailRaw={symbol:"FEDERALBNK",from_date:tailPin.from_date,through_date:tailPin.through_date,official_response:tailPin.response,original_sha256:tailPin.sha256,original_bytes:tailPin.bytes,original_url:tailPin.url,first_verified_available_at:tailPin.available_at,r2_bucket:policy.storageBucket,r2_object_key:policy.storageKeyPrefix+hash+".json"}
 const tail:RenewalSource={id:await identity("FEDERAL_CA_TAIL:"+tailPin.from_date+":"+session+":"+hash),source_code:"NSE_OFFICIAL",record_kind:"V1_4_BANK_OFFICIAL_CORPORATE_ACTION_TAIL",retrieved_at:tailPin.available_at,payload_hash:await bankValueHash(tailRaw),raw_payload:tailRaw}
 const calRead=await db.from("data_source_records").select(sourceColumns).eq("record_kind","V1_4_NSE_SESSION_CALENDAR_DECISION").eq("source_code","NSE_OFFICIAL").eq("raw_payload->>session_date",session).lte("retrieved_at",at).order("retrieved_at",{ascending:false}).limit(2)
 if(calRead.error||!calRead.data?.length||calRead.data.length>1&&calRead.data[0].payload_hash!==calRead.data[1].payload_hash)throw Error("HISTORY_CALENDAR_NOT_UNIQUE")
 const calendar=calRead.data[0] as RenewalSource;await verifyTwelveRenewalSourceIntegrity(calendar)
 const captures=await db.from("data_source_records").select(sourceColumns).eq("record_kind","V1_4_BANK_MAINTENANCE_DAILY_CAPTURE").eq("raw_payload->>session_date",session).in("raw_payload->>target",[FEDERAL,"NIFTY_BANK"])
 if(captures.error||captures.data?.length!==2)throw Error("HISTORY_CAPTURE_PAIR_NOT_UNIQUE")
 const pair=[]
 for(const target of [FEDERAL,"NIFTY_BANK"]){
  const capture=captures.data.find(x=>x.raw_payload.target===target) as RenewalSource|undefined;if(!capture)throw Error("TARGET_HISTORY_CAPTURE_MISSING");await verifyTwelveRenewalSourceIntegrity(capture)
  const runId=String(capture.terms_snapshot?.ingestion_run_id??""),reservationId=String(capture.terms_snapshot?.reservation_id??"")
  const [run,reservation,usage,priorRead,rowsRead]=await Promise.all([
   db.from("data_ingestion_runs").select("*").eq("id",runId).single(),db.from("provider_budget_reservations").select("*").eq("id",reservationId).single(),
   db.from("provider_usage_events").select("*").eq("ingestion_run_id",runId).eq("data_domain","MARKET_HISTORY"),
   db.from("data_source_records").select(sourceColumns).eq("record_kind","V1_4_HISTORY_CONTRACT_VALIDATION").eq("raw_payload->>target_id",target).lte("retrieved_at",at).order("retrieved_at",{ascending:false}).limit(2),
   db.from(target===FEDERAL?"market_price_history":"market_benchmark_price_history").select("period_start,retrieved_at,open::text,high::text,low::text,close::text,volume::text,provider_code,provenance").eq(target===FEDERAL?"security_id":"benchmark_code",target).eq("provider_code","ANGEL_ONE").eq("interval","ONE_DAY").lte("retrieved_at",at).order("period_start",{ascending:false}).limit(400)
  ])
  if(run.error||reservation.error||usage.error||priorRead.error||rowsRead.error||!priorRead.data?.length)throw Error("HISTORY_CANONICAL_INPUT_READ_FAILED")
  const prior=twelveLatestPrior(priorRead.data as RenewalSource[]);await verifyTwelveRenewalSourceIntegrity(prior)
  const allRows=rowsRead.data as RenewalHistoryRow[],inspection=inspectStoredHistory(allRows,252,Date.parse(at))
  if(["CONFLICTING","INSUFFICIENT"].includes(inspection.state)||inspection.reason==="HISTORY_INPUT_INVALID")throw Error("HISTORY_ALL_RETAINED_ROWS_INVALID:"+inspection.reason)
  const sessionOf=(r:RenewalHistoryRow)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata"}).format(new Date(r.period_start))
  const selectedDates=[...new Set(allRows.map(sessionOf))].sort().slice(-252),selectedSet=new Set(selectedDates),selectedRows=allRows.filter(r=>selectedSet.has(sessionOf(r)))
  const qualified=qualifyTwelveHistoryRenewal({target,prior,capture,calendar,corporateActionTail:tail,accounting:{run:run.data,reservation:reservation.data,usageEvents:usage.data},rows:selectedRows,verifiedAt:at})
  if(!qualified.qualified)throw Error(qualified.reason)
  const existing=prior.raw_payload.validation as Record<string,unknown>|null
  const reusable=existing?.version==="BANK_TWELVE_SETTLED_SESSION_REQUALIFICATION_V1"&&existing.daily_capture_id===capture.id&&existing.calendar_decision_id===calendar.id
  const candidate=reusable?prior:{id:await identity("HISTORY_RENEWAL:"+target+":"+capture.id+":"+calendar.id+":"+tail.id),source_code:"ANGEL_ONE",record_kind:"V1_4_HISTORY_CONTRACT_VALIDATION",retrieved_at:at,payload_hash:await bankValueHash(qualified.rawPayload),raw_payload:qualified.rawPayload} as RenewalSource
  pair.push({target,candidate,rows:selectedRows,proof:reusable?parseHistoryContractProof(prior.raw_payload.proof)!:qualified.proof})
 }
 const mapping=await db.from("market_benchmarks").select("code,mapping_status,provider_code,provider_instrument_id,verified_at").eq("code","NIFTY_BANK").single()
 if(mapping.error)throw Error("HISTORY_BENCHMARK_MAPPING_MISSING")
 const aligned=validateBenchmarkPairReadiness({stockRows:pair[0]!.rows,benchmarkRows:pair[1]!.rows,minimum:252,evaluationAsOfMs:Date.parse(at),sourceCutoffAtMs:Date.parse(at),freshnessPolicy:"MARKET_5_TRADING_DAYS",stockProof:pair[0]!.proof,benchmarkProof:pair[1]!.proof,benchmark:mapping.data})
 if(aligned.state!=="FRESH")throw Error("HISTORY_RENEWAL_PAIR_NOT_READY:"+aligned.reason)
 for(const s of [tail,...pair.map(x=>x.candidate)]){
  const previous=await db.from("data_source_records").select("id,payload_hash").eq("id",s.id).maybeSingle()
  if(previous.error)throw Error("HISTORY_RENEWAL_ID_READ_FAILED")
  if(previous.data&&previous.data.payload_hash!==s.payload_hash)throw Error("HISTORY_RENEWAL_ID_CONFLICT")
  if(!previous.data){const saved=await db.from("data_source_records").insert({...s,source_url:tailPin.url,external_record_id:policy.id+":HISTORY_RENEWAL:"+s.id,terms_snapshot:{mode:"SIGNED_SOURCE_BOUND_HISTORY_REQUALIFICATION",directive_sha256:policy.directiveSha256,kvb_writes:0}});if(saved.error)throw Error("HISTORY_RENEWAL_APPEND_FAILED")}
 }
 return {revision:await bankValueHash(pair.map(p=>({id:p.candidate.id,hash:p.candidate.payload_hash}))),proofIds:pair.map(p=>p.candidate.id),proofRetrievedAt:pair.map(p=>p.candidate.retrieved_at),corporateActionTailSourceId:tail.id,session,verifiedAt:at,pairState:aligned.state}
}
