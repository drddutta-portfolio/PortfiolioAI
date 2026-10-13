import type {SupabaseClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import {verifiedOpenSessionStatus,NSE_OPEN_STATUS_KIND,type OpenSessionRecord,type OrdinaryTimingAuthority} from './v14-bank-open-session-status.ts'
import {verifiedOrdinaryCompletedSessionCalendar,type CalendarRecord} from './v14-bank-pre-open-calendar.ts'
import {kvbPbHash,kvbPbStableId} from './v14-kvb-pb-admission.ts'
/** Only called after the endpoint verifies an actual owner or scoped signed CI
 * identity. One official public request; no paid provider calls or retries.
 * Canonical validators never invoke this collector. */
export function kvbIntradayOpenCarryNeeded(calendar:readonly CalendarRecord[],at:string){const ordinary=verifiedOrdinaryCompletedSessionCalendar(calendar,at);if(!ordinary)return false;const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date(at)),now=Date.parse(at);return now>=Date.parse(day+'T09:15:00+05:30')&&now<Date.parse(day+'T15:30:00+05:30')}
export async function collectKvbCurrentSessionStatus(db:SupabaseClient,timing:OrdinaryTimingAuthority){
 const at=new Date().toISOString(),calendarCheck=await db.from('data_source_records').select('id,record_kind,retrieved_at,raw_payload').eq('source_code','NSE_OFFICIAL').in('record_kind',['V1_4_NSE_TRADING_CALENDAR_2026_BASE','V1_4_NSE_CALENDAR_APPROVED_BASELINE','V1_4_NSE_CALENDAR_REFRESH_CAPTURE']).lte('retrieved_at',at).order('retrieved_at',{ascending:false}).limit(100)
 if(calendarCheck.error)throw Error('NSE_CURRENT_SESSION_CALENDAR_READ_FAILED')
 if(!kvbIntradayOpenCarryNeeded(calendarCheck.data as CalendarRecord[],at))return null
 const url='https://www.nseindia.com/api/marketStatus';let response:Response
 try{response=await fetch(url,{redirect:'error',headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json','Referer':'https://www.nseindia.com/'},signal:AbortSignal.timeout(15000)})}catch{throw Error('NSE_CURRENT_SESSION_PUBLIC_REQUEST_FAILED')}
 if(response.status!==200)throw Error('NSE_CURRENT_SESSION_HTTP_'+response.status)
 const originalText=await response.text(),bytes=new TextEncoder().encode(originalText)
 if(bytes.length>65536)throw Error('NSE_CURRENT_SESSION_ORIGINAL_TOO_LARGE')
 try{const json:unknown=JSON.parse(originalText);if(!json||typeof json!=='object'||Array.isArray(json))throw Error()}catch{throw Error('NSE_CURRENT_SESSION_ORIGINAL_NOT_JSON')}
 const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join(''),retrievedAt=new Date().toISOString()
 const raw={source_url:url,status_code:200,original_text:originalText,original_sha256:sha,original_bytes:bytes.length,timing_source_record_id:timing.sourceRecordId},id=await kvbPbStableId({kind:NSE_OPEN_STATUS_KIND,raw,retrievedAt})
 const record:OpenSessionRecord={id,source_code:'NSE_OFFICIAL',record_kind:NSE_OPEN_STATUS_KIND,retrieved_at:retrievedAt,payload_hash:await kvbPbHash(raw),raw_payload:raw}
 const existing=await db.from('data_source_records').select('payload_hash,raw_payload').eq('id',id).maybeSingle()
 if(existing.error)throw Error('NSE_CURRENT_SESSION_SOURCE_LOOKUP_FAILED')
 if(existing.data){if(existing.data.payload_hash!==record.payload_hash||await kvbPbHash(existing.data.raw_payload)!==record.payload_hash)throw Error('NSE_CURRENT_SESSION_IMMUTABLE_SOURCE_CONFLICT')}
 else{const inserted=await db.from('data_source_records').insert({...record,external_record_id:id,published_at:null,source_url:url,terms_snapshot:{mode:'SOURCE_QUALIFICATION_NO_OWNER_REVIEW',public_source_requests:1,paid_provider_calls:0,retries:0,canonical_promotion:false}});if(inserted.error)throw Error('NSE_CURRENT_SESSION_SOURCE_APPEND_FAILED')}
 const calendar=await db.from('data_source_records').select('id,record_kind,retrieved_at,raw_payload').eq('source_code','NSE_OFFICIAL').in('record_kind',['V1_4_NSE_TRADING_CALENDAR_2026_BASE','V1_4_NSE_CALENDAR_APPROVED_BASELINE','V1_4_NSE_CALENDAR_REFRESH_CAPTURE']).lte('retrieved_at',retrievedAt).order('retrieved_at',{ascending:false}).limit(100)
 if(calendar.error)throw Error('NSE_CURRENT_SESSION_CALENDAR_READ_FAILED')
 const proof=await verifiedOpenSessionStatus(record,calendar.data as CalendarRecord[],retrievedAt,timing)
 if(!proof)throw Error('NSE_CURRENT_OPEN_SESSION_STATUS_NOT_QUALIFIED')
 return {record,timing,proof,publicSourceRequests:1,paidProviderCalls:0,retries:0}
}
