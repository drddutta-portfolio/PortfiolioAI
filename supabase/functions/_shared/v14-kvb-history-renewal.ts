import {verifiedOpenSessionStatus,type OpenSessionRecord,type OrdinaryTimingAuthority} from './v14-bank-open-session-status.ts'
import {parseHistoryContractProof,validateStockHistoryReadiness,type HistoryContractProof,type CurrentSessionDecision} from "./v14-history-readiness.ts"
import {sameQualifiedHistoryNumeric} from "./v14-history-numeric-equality.ts"
import type {HistoryRow} from "./p7-ic-input-validation.ts"
import {verifiedPreOpenCalendar} from "./v14-bank-pre-open-calendar.ts"
import {kvbPbHash} from "./v14-kvb-pb-admission.ts"
import sourcePins from "./v14-kvb-history-renewal-source-pins.json" with {type:"json"}
import calendarPins from "./v14-kvb-history-renewal-calendar-pins.json" with {type:"json"}
type Json=Readonly<Record<string,unknown>>
export interface RenewalSource{readonly id:string;readonly source_code:string;readonly record_kind:string;readonly retrieved_at:string;readonly payload_hash:string;readonly raw_payload:Json;readonly terms_snapshot?:Json}
export interface RenewalHistoryRow extends HistoryRow{readonly open:string|number;readonly high:string|number;readonly low:string|number;readonly volume:string|number;readonly provider_code:string}
export interface RenewalAccounting{readonly run:Json;readonly reservation:Json;readonly usageEvents:readonly Json[]}
export const KVB_HISTORY_TAIL_HASH="4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"
export const KVB_HISTORY_SECURITY_ID="be55b3cc-0400-45af-84aa-2a95e2c361c5"
const KVB=KVB_HISTORY_SECURITY_ID
const obj=(v:unknown):Json|null=>v!==null&&typeof v==="object"&&!Array.isArray(v)?v as Json:null
const date=(v:string)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(v))
const validTime=(v:unknown,at:number)=>typeof v==="string"&&Number.isFinite(Date.parse(v))&&Date.parse(v)<=at
const hash=/^[a-f0-9]{64}$/
function lessEqual(a:string|number,b:string|number){const [ai,af=""]=String(a).split("."),[bi,bf=""]=String(b).split("."),scale=Math.max(af.length,bf.length);return BigInt(ai+af.padEnd(scale,"0"))<=BigInt(bi+bf.padEnd(scale,"0"))}
/** Requalify stored inputs against settled daily acquisition and an exact CA tail.
 * This returns an append-only candidate, not an admission or database write. */
export async function qualifyKvbHistoryRenewal(input:{target:string;prior:RenewalSource;capture:RenewalSource;calendar:RenewalSource;corporateActionTail?:RenewalSource;rows:readonly RenewalHistoryRow[];accounting:RenewalAccounting;verifiedAt:string;preOpenCalendarRecords:readonly RenewalSource[];openSessionRecord?:OpenSessionRecord;timingAuthority?:OrdinaryTimingAuthority}){
 const reject=(reason:string)=>({qualified:false as const,reason})
 if(![KVB,"NIFTY_BANK"].includes(input.target))return reject("KVB_HISTORY_TARGET_NOT_ALLOWED")
 for(const record of [input.prior,input.capture,input.calendar,...input.preOpenCalendarRecords]){
  const pin=[...sourcePins,...calendarPins].find(p=>p.id===record.id)
  if(!pin||record.payload_hash!==pin.ledger_hash||await kvbPbHash(record.raw_payload)!==pin.canonical_raw_hash)return reject("KVB_HISTORY_PINNED_SOURCE_HASH_INVALID")
 }
 if(input.preOpenCalendarRecords.some(r=>r.source_code!=="NSE_OFFICIAL"))return reject("KVB_PRE_OPEN_SOURCE_AUTHORITY_INVALID")
 const preOpen=verifiedPreOpenCalendar(input.preOpenCalendarRecords,input.verifiedAt)
 const open=input.openSessionRecord&&input.timingAuthority?await verifiedOpenSessionStatus(input.openSessionRecord,input.preOpenCalendarRecords,input.verifiedAt,input.timingAuthority):null
 const at=Date.parse(input.verifiedAt),priorProof=parseHistoryContractProof(input.prior.raw_payload.proof)
 if(!Number.isFinite(at)||!validTime(input.prior.retrieved_at,at)||!priorProof||input.prior.record_kind!=="V1_4_HISTORY_CONTRACT_VALIDATION"||input.prior.raw_payload.target_id!==input.target)return reject("PRIOR_STRUCTURAL_PROOF_INVALID")
 if(priorProof.returnBasis!==(input.target===KVB?"PRICE_RETURN_CORPORATE_ACTION_ADJUSTED":"PRICE_RETURN_RAW_CLOSE")||priorProof.corporateActionState!=="COMPLETE"||priorProof.unresolvedCorporateActionCount!==0||priorProof.exchangeCalendarState!=="VERIFIED")return reject("PRIOR_STRUCTURAL_CONTRACT_NOT_COMPLETE")
 const c=input.capture,raw=c.raw_payload,cal=input.calendar,session=String(raw.session_date??""),terms=c.terms_snapshot??{}
 if(c.source_code!=="ANGEL_ONE"||c.record_kind!=="V1_4_BANK_MAINTENANCE_DAILY_CAPTURE"||raw.target!==input.target||raw.version!=="V1_4_BANK_MAINTENANCE_DAILY_V1"||!hash.test(c.payload_hash)||!validTime(c.retrieved_at,at)||Date.parse(input.prior.retrieved_at)>Date.parse(c.retrieved_at)&&obj(input.prior.raw_payload.validation)?.daily_capture_id!==c.id)return reject("SETTLED_CAPTURE_SCOPE_INVALID")
 if(cal.source_code!=="NSE_OFFICIAL"||cal.record_kind!=="V1_4_NSE_SESSION_CALENDAR_DECISION"||cal.raw_payload.decision!=="OPEN"||cal.raw_payload.session_date!==session||raw.calendar_decision_id!==cal.id||!validTime(cal.retrieved_at,at)||!validTime(cal.raw_payload.evaluated_at,at)||Date.parse(cal.retrieved_at)>Date.parse(c.retrieved_at)||cal.raw_payload.version!=="V1_4_NSE_SESSION_CALENDAR_DECISION_V2"||cal.raw_payload.annual_calendar_source_url!=="https://nsearchives.nseindia.com/content/circulars/CMTR71775.pdf"||!hash.test(String(cal.raw_payload.live_semantic_fingerprint_sha256))||cal.raw_payload.live_semantic_fingerprint_sha256!==cal.raw_payload.approved_semantic_fingerprint_sha256||!(date(input.verifiedAt)===session||preOpen?.latestCompletedSession===session||open?.latestCompletedSession===session))return reject("OPEN_SESSION_CALENDAR_NOT_BOUND")
 const run=input.accounting.run,res=input.accounting.reservation,metadata=obj(run.metadata)
 if(run.id!==terms.ingestion_run_id||run.source_code!=="ANGEL_ONE"||run.status!=="SUCCEEDED"||metadata?.session!==session||metadata.retry_policy!=="ZERO"||metadata.calendar_decision_id!==cal.id||metadata.reservation_id!==terms.reservation_id||res.id!==terms.reservation_id||res.status!=="SETTLED"||res.ingestion_run_id!==run.id||Number(metadata.consumed_units)<1||Number(metadata.consumed_units)>14||metadata.failed_units!==0||res.failed_units!==0||res.consumed_units!==metadata.consumed_units||!Number.isInteger(metadata.consumed_units)||Number(run.failed_count)!==0||metadata.scheduler!==true||run.operation!=="V1_4_BANK_MAINTENANCE_DAILY_V1"||Date.parse(String(run.completed_at))>at||!Number.isFinite(Date.parse(String(run.completed_at)))||Date.parse(String(res.settled_at))>at||!Number.isFinite(Date.parse(String(res.settled_at))))return reject("CAPTURE_BUDGET_SETTLEMENT_NOT_BOUND")
 const runStart=Date.parse(String(run.started_at)),runEnd=Date.parse(String(run.completed_at)),captureAt=Date.parse(String(c.retrieved_at)),reservedAt=Date.parse(String(res.reserved_at)),settledAt=Date.parse(String(res.settled_at)),expiresAt=Date.parse(String(res.expires_at)),transport=obj(metadata.transport)
 if(![runStart,runEnd,captureAt,reservedAt,settledAt,expiresAt].every(Number.isFinite)||runStart>reservedAt||reservedAt>captureAt||captureAt>settledAt||settledAt>runEnd||runEnd>at||settledAt>expiresAt||res.reservation_key!==`V1_4_BANK_MAINTENANCE_DAILY_V1:${metadata.grant_id}`||!metadata.grant_id||run.estimated_call_count!==res.estimated_units||run.attempted_call_count!==metadata.consumed_units||transport?.historyRequests!==metadata.consumed_units||metadata.released_units!==0||res.released_units!==0)return reject("CAPTURE_RUN_SETTLEMENT_WINDOW_NOT_BOUND")
 const events=input.accounting.usageEvents
 if(events.length!==metadata.consumed_units||new Set(events.map(e=>e.idempotency_key)).size!==events.length||events.some(e=>e.ingestion_run_id!==run.id||e.source_code!=="ANGEL_ONE"||e.data_domain!=="MARKET_HISTORY"||e.accounting_class!=="PROVIDER_TOOL_ATTEMPT"||e.outcome!=="SUCCEEDED"||e.retry_attempt!==0||e.actual_internal_units!==1||!validTime(e.attempted_at,at)||!validTime(e.completed_at,at))||!events.some(e=>e.idempotency_key===`V1_4_BANK_MAINTENANCE_DAILY_V1:${session}:${input.target}:HISTORY`))return reject("ACTUAL_USAGE_LEDGER_NOT_BOUND")
 let tailId:string|null=null
 if(input.target===KVB){
  const tail=input.corporateActionTail,t=tail?.raw_payload
  if(!tail||tail.source_code!=="NSE_OFFICIAL"||tail.record_kind!=="V1_4_BANK_OFFICIAL_CORPORATE_ACTION_TAIL"||t?.symbol!=="KARURVYSYA"||t.from_date!=="2026-10-09"||t.through_date!==session||!Array.isArray(t.official_response)||t.official_response.length!==0||t.original_sha256!=="4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945"||t.original_bytes!==2||!validTime(tail.retrieved_at,at)||t.original_url!=="https://www.nseindia.com/api/corporates-corporateActions?index=equities&symbol=KARURVYSYA&from_date=09-10-2026&to_date=12-10-2026"||await kvbPbHash(t)!==tail.payload_hash||!priorProof.corporateActionSourceRecordIds.includes("80883e0f-a0b8-4752-8aad-3a4b3017838a"))return reject("EXACT_CORPORATE_ACTION_TAIL_NOT_BOUND")
  tailId=tail.id
 }
 const candles=raw.candles
 if(!Array.isArray(candles)||candles.length!==1)return reject("EXACT_DAILY_CANDLE_REQUIRED")
 const candle=obj(candles[0]);if(!candle||!validTime(candle.periodStart,at)||!validTime(candle.retrievedAt,at)||Date.parse(c.retrieved_at)<Date.parse(String(candle.retrievedAt))||Date.parse(c.retrieved_at)-Date.parse(String(candle.retrievedAt))>60000||date(String(candle.periodStart))!==session)return reject("DAILY_CANDLE_SESSION_MISMATCH")
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
 const ids=[...new Set([...priorProof.lineageSourceRecordIds,input.prior.id,c.id,cal.id,...(preOpen?.sourceRecordIds??open?.sourceRecordIds.slice(2)??[]),...(tailId?[tailId]:[])])]
 const currentSessionDecision:CurrentSessionDecision=date(input.verifiedAt)===session
  ?{sessionDate:session,decision:"OPEN",recordId:cal.id,reason:String(cal.raw_payload.reason)}
  :open?{sessionDate:open.sessionDate,decision:"OPEN",recordId:open.sourceRecordIds[0]!,reason:"OFFICIAL_OPEN_LATEST_COMPLETED_SESSION_VERIFIED",openSessionStatus:open}
  :{sessionDate:date(input.verifiedAt),decision:"UNKNOWN",recordId:preOpen!.sourceRecordIds.at(-1)!,reason:"PRE_OPEN_LATEST_COMPLETED_SESSION_VERIFIED",preOpenCalendar:preOpen!}
 const proof:HistoryContractProof={...priorProof,freshnessThrough:new Date(c.retrieved_at).toISOString(),dailySessionState:"LATEST_COMPLETED_SESSION_POST_CLOSE",dailySessionProofRecordIds:[c.id],exchangeCalendarSourceRecordIds:[...new Set([...priorProof.exchangeCalendarSourceRecordIds,cal.id,...(preOpen?.sourceRecordIds??open?.sourceRecordIds.slice(2)??[])])],corporateActionSourceRecordIds:[...priorProof.corporateActionSourceRecordIds,...(tailId?[tailId]:[])],lineageSourceRecordIds:ids}
 const validation=validateStockHistoryReadiness({rows:input.rows,minimum:252,evaluationAsOfMs:at,sourceCutoffAtMs:at,freshnessPolicy:"LATEST_COMPLETED_SESSION_POST_CLOSE",proof,currentSessionDecision})
 if(validation.state!=="FRESH"||validation.latestSession!==session)return reject("RENEWED_STORED_HISTORY_NOT_QUALIFIED:"+validation.reason)
 return {qualified:true as const,proof,validation,currentSessionDecision,revisionSources:[input.prior.id,c.id,cal.id,...(tailId?[tailId]:[])],rawPayload:{target_type:input.target===KVB?"SECURITY":"BENCHMARK",target_id:input.target,symbol:input.target===KVB?"KARURVYSYA":"NIFTY_BANK",proof,validation:{version:"KVB_SETTLED_SESSION_REQUALIFICATION_V1",supersedes_history_proof_id:input.prior.id,latest_completed_session:session,selected_sessions:validation.selectedSessions,retained_session_inventory:[...new Set(input.rows.map(r=>date(r.period_start)))].sort(),distinct_sessions:validation.distinctSessions,daily_capture_id:c.id,calendar_decision_id:cal.id,settled_ingestion_run_id:run.id,reservation_id:res.id}}}
}
