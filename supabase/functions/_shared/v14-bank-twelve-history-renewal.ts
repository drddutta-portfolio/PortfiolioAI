import {parseHistoryContractProof,validateStockHistoryReadiness,type HistoryContractProof} from "./v14-history-readiness.ts"
import {sameQualifiedHistoryNumeric} from "./v14-history-numeric-equality.ts"
import type {HistoryRow} from "./p7-ic-input-validation.ts"
type Json=Readonly<Record<string,unknown>>
export interface RenewalSource{readonly id:string;readonly source_code:string;readonly record_kind:string;readonly retrieved_at:string;readonly payload_hash:string;readonly raw_payload:Json;readonly terms_snapshot?:Json}
export interface RenewalHistoryRow extends HistoryRow{readonly open:string|number;readonly high:string|number;readonly low:string|number;readonly volume:string|number;readonly provider_code:string}
export interface RenewalAccounting{readonly run:Json;readonly reservation:Json;readonly usageEvents:readonly Json[]}
export const BANK_TWELVE_HISTORY_TAIL_HASH="4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
const FEDERAL="63889b52-85da-4a1b-9046-c1e975819f99"
const obj=(v:unknown):Json|null=>v!==null&&typeof v==="object"&&!Array.isArray(v)?v as Json:null
const date=(v:string)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(v))
const validTime=(v:unknown,at:number)=>typeof v==="string"&&Number.isFinite(Date.parse(v))&&Date.parse(v)<=at
const hash=/^[a-f0-9]{64}$/
function lessEqual(a:string|number,b:string|number){const [ai,af=""]=String(a).split("."),[bi,bf=""]=String(b).split("."),scale=Math.max(af.length,bf.length);return BigInt(ai+af.padEnd(scale,"0"))<=BigInt(bi+bf.padEnd(scale,"0"))}
/** Requalify stored inputs against settled daily acquisition and an exact CA tail.
 * This returns an append-only candidate, not an admission or database write. */
export function qualifyTwelveHistoryRenewal(input:{target:string;prior:RenewalSource;capture:RenewalSource;calendar:RenewalSource;corporateActionTail?:RenewalSource;rows:readonly RenewalHistoryRow[];accounting:RenewalAccounting;verifiedAt:string}){
 const reject=(reason:string)=>({qualified:false as const,reason})
 if(![FEDERAL,"NIFTY_BANK"].includes(input.target))return reject("TWELVE_HISTORY_TARGET_NOT_ALLOWED")
 const at=Date.parse(input.verifiedAt),priorProof=parseHistoryContractProof(input.prior.raw_payload.proof)
 if(!Number.isFinite(at)||!validTime(input.prior.retrieved_at,at)||!priorProof||input.prior.record_kind!=="V1_4_HISTORY_CONTRACT_VALIDATION"||input.prior.raw_payload.target_id!==input.target)return reject("PRIOR_STRUCTURAL_PROOF_INVALID")
 if(priorProof.returnBasis!=="PRICE_RETURN_RAW_CLOSE"||priorProof.corporateActionState!=="COMPLETE"||priorProof.unresolvedCorporateActionCount!==0||priorProof.exchangeCalendarState!=="VERIFIED")return reject("PRIOR_STRUCTURAL_CONTRACT_NOT_COMPLETE")
 const c=input.capture,raw=c.raw_payload,cal=input.calendar,session=String(raw.session_date??""),terms=c.terms_snapshot??{}
 if(c.source_code!=="ANGEL_ONE"||c.record_kind!=="V1_4_BANK_MAINTENANCE_DAILY_CAPTURE"||raw.target!==input.target||raw.version!=="V1_4_BANK_MAINTENANCE_DAILY_V1"||!hash.test(c.payload_hash)||!validTime(c.retrieved_at,at)||Date.parse(input.prior.retrieved_at)>Date.parse(c.retrieved_at)&&obj(input.prior.raw_payload.validation)?.daily_capture_id!==c.id)return reject("SETTLED_CAPTURE_SCOPE_INVALID")
 if(cal.source_code!=="NSE_OFFICIAL"||cal.record_kind!=="V1_4_NSE_SESSION_CALENDAR_DECISION"||cal.raw_payload.decision!=="OPEN"||cal.raw_payload.session_date!==session||raw.calendar_decision_id!==cal.id||!validTime(cal.retrieved_at,at)||!validTime(cal.raw_payload.evaluated_at,at)||Date.parse(cal.retrieved_at)>Date.parse(c.retrieved_at)||cal.raw_payload.version!=="V1_4_NSE_SESSION_CALENDAR_DECISION_V2"||cal.raw_payload.annual_calendar_source_url!=="https://nsearchives.nseindia.com/content/circulars/CMTR71775.pdf"||!hash.test(String(cal.raw_payload.live_semantic_fingerprint_sha256))||cal.raw_payload.live_semantic_fingerprint_sha256!==cal.raw_payload.approved_semantic_fingerprint_sha256||date(input.verifiedAt)!==session)return reject("OPEN_SESSION_CALENDAR_NOT_BOUND")
 const run=input.accounting.run,res=input.accounting.reservation,metadata=obj(run.metadata)
 if(run.id!==terms.ingestion_run_id||run.source_code!=="ANGEL_ONE"||run.status!=="SUCCEEDED"||metadata?.session!==session||metadata.retry_policy!=="ZERO"||metadata.calendar_decision_id!==cal.id||metadata.reservation_id!==terms.reservation_id||res.id!==terms.reservation_id||res.status!=="SETTLED"||res.ingestion_run_id!==run.id||Number(metadata.consumed_units)<1||Number(metadata.consumed_units)>14||metadata.failed_units!==0||res.failed_units!==0||res.consumed_units!==metadata.consumed_units||!Number.isInteger(metadata.consumed_units)||Number(run.failed_count)!==0||metadata.scheduler!==true||run.operation!=="V1_4_BANK_MAINTENANCE_DAILY_V1"||Date.parse(String(run.completed_at))>at||!Number.isFinite(Date.parse(String(run.completed_at)))||Date.parse(String(res.settled_at))>at||!Number.isFinite(Date.parse(String(res.settled_at))))return reject("CAPTURE_BUDGET_SETTLEMENT_NOT_BOUND")
 const events=input.accounting.usageEvents
 if(events.length!==metadata.consumed_units||new Set(events.map(e=>e.idempotency_key)).size!==events.length||events.some(e=>e.ingestion_run_id!==run.id||e.source_code!=="ANGEL_ONE"||e.data_domain!=="MARKET_HISTORY"||e.accounting_class!=="PROVIDER_TOOL_ATTEMPT"||e.outcome!=="SUCCEEDED"||e.retry_attempt!==0||e.actual_internal_units!==1||!validTime(e.attempted_at,at)||!validTime(e.completed_at,at))||!events.some(e=>e.idempotency_key===`V1_4_BANK_MAINTENANCE_DAILY_V1:${session}:${input.target}:HISTORY`))return reject("ACTUAL_USAGE_LEDGER_NOT_BOUND")
 let tailId:string|null=null
 if(input.target===FEDERAL){
  const tail=input.corporateActionTail,t=tail?.raw_payload
  if(!tail||tail.source_code!=="NSE_OFFICIAL"||tail.record_kind!=="V1_4_BANK_OFFICIAL_CORPORATE_ACTION_TAIL"||t?.symbol!=="FEDERALBNK"||t.from_date!=="2026-10-09"||t.through_date!==session||!Array.isArray(t.official_response)||t.official_response.length!==0||t.original_sha256!=="4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"||t.original_bytes!==2||!validTime(tail.retrieved_at,at)||!priorProof.corporateActionSourceRecordIds.includes("0387d455-649e-4afb-baaf-78bdf9c3ff91"))return reject("EXACT_CORPORATE_ACTION_TAIL_NOT_BOUND")
  tailId=tail.id
 }
 const candles=raw.candles
 if(!Array.isArray(candles)||candles.length!==1)return reject("EXACT_DAILY_CANDLE_REQUIRED")
 const candle=obj(candles[0]);if(!candle||!validTime(candle.periodStart,at)||date(String(candle.periodStart))!==session)return reject("DAILY_CANDLE_SESSION_MISMATCH")
 if(input.rows.some(row=>!validTime(row.period_start,at)||!validTime(row.retrieved_at,at)))return reject("HISTORY_TIMESTAMP_INVALID")
 const latest=input.rows.filter(r=>date(r.period_start)===session)
 if(latest.length!==1||latest[0]!.provenance?.source_record_id!==c.id)return reject("PERSISTED_DAILY_CAPTURE_NOT_BOUND")
 const priorValidation=obj(input.prior.raw_payload.validation),known=priorValidation?.retained_session_inventory??priorValidation?.selected_sessions
 if(!Array.isArray(known)||!known.every(x=>typeof x==="string")||typeof priorValidation?.latest_completed_session!=="string")return reject("PRIOR_SESSION_LINEAGE_MISSING")
 const allowed=new Set([...known,priorValidation.latest_completed_session,session])
 for(const row of input.rows){
  if(row.provider_code!=="ANGEL_ONE"||![row.open,row.high,row.low,row.close,row.volume].every(v=>/^\d+(?:\.\d+)?$/.test(String(v)))||!validTime(row.retrieved_at,at)||!validTime(row.period_start,at))return reject("HISTORY_OHLCV_SCOPE_INVALID")
  if(!allowed.has(date(row.period_start))||!lessEqual(row.low,row.open)||!lessEqual(row.low,row.close!)||!lessEqual(row.open,row.high)||!lessEqual(row.close!,row.high))return reject("HISTORY_SESSION_OR_OHLC_RANGE_INVALID")
 }
 const row=latest[0]!
 for(const field of ["open","high","low","close","volume"] as const)if(!sameQualifiedHistoryNumeric(row[field],candle[field]))return reject("PERSISTED_CANDLE_CONTENT_MISMATCH")
 const ids=[...new Set([...priorProof.lineageSourceRecordIds,input.prior.id,c.id,cal.id,...(tailId?[tailId]:[])])]
 const proof:HistoryContractProof={...priorProof,freshnessThrough:input.verifiedAt,dailySessionState:"LATEST_COMPLETED_SESSION_POST_CLOSE",dailySessionProofRecordIds:[c.id],exchangeCalendarSourceRecordIds:[...new Set([...priorProof.exchangeCalendarSourceRecordIds,cal.id])],corporateActionSourceRecordIds:[...priorProof.corporateActionSourceRecordIds,...(tailId?[tailId]:[])],lineageSourceRecordIds:ids}
 const validation=validateStockHistoryReadiness({rows:input.rows,minimum:252,evaluationAsOfMs:at,sourceCutoffAtMs:at,freshnessPolicy:"MARKET_5_TRADING_DAYS",proof})
 if(validation.state!=="FRESH"||validation.latestSession!==session)return reject("RENEWED_STORED_HISTORY_NOT_QUALIFIED:"+validation.reason)
 return {qualified:true as const,proof,validation,revisionSources:[input.prior.id,c.id,cal.id,...(tailId?[tailId]:[])],rawPayload:{target_type:input.target===FEDERAL?"SECURITY":"BENCHMARK",target_id:input.target,symbol:input.target===FEDERAL?"FEDERALBNK":"NIFTY_BANK",proof,validation:{version:"BANK_TWELVE_SETTLED_SESSION_REQUALIFICATION_V1",supersedes_history_proof_id:input.prior.id,latest_completed_session:session,selected_sessions:validation.selectedSessions,retained_session_inventory:[...new Set(input.rows.map(r=>date(r.period_start)))].sort(),distinct_sessions:validation.distinctSessions,daily_capture_id:c.id,calendar_decision_id:cal.id,settled_ingestion_run_id:run.id,reservation_id:res.id}}}
}
