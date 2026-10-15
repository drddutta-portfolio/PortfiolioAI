import type {SupabaseClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import {G03_FINANCIAL_POLICY as p} from './v14-g03-cash-components.ts'
import {g02StableId,hashG02} from './v14-g02-source-import.ts'
import {g02PostgresTimestamp} from './v14-g02-document-review.ts'
import {loadVerifiedNseCashTimingAuthority} from './v14-bank-open-session-timing.ts'
import {loadVerifiedOpenSessionStatus} from './v14-bank-open-session-status-runtime.ts'
import {verifiedOrdinaryCompletedSessionCalendar,type CalendarRecord} from './v14-bank-pre-open-calendar.ts'
import {verifiedOpenSessionStatus,NSE_OPEN_STATUS_KIND,type OpenSessionRecord} from './v14-bank-open-session-status.ts'
/** Bounded transport hook; the existing NSE/BANK authority helpers own every
 * calendar/timing/status decision. No candle fetch, grace extension or inference.
 * Only the exact signed G03 validation workflow can call this hook. */
export async function refreshG03CurrentSessionStatus(db:SupabaseClient,body:Record<string,unknown>,fetcher:typeof fetch=fetch,now:()=>string=()=>new Date().toISOString(),execution?:Readonly<Record<string,unknown>>){
 if(body.action!=='QUALIFY_G03_BEL_CURRENT_SESSION'||body.authorizationHash!==p.contractSha256||body.portfolioId!==p.portfolioId||body.securityId!==p.securityId)throw Error('G03_CURRENT_SESSION_EXACT_SCOPE_REQUIRED')
 const at=now(),owner=await db.from('portfolios').select('user_id').eq('id',p.portfolioId).single()
 if(owner.error||owner.data?.user_id!==p.ownerId)throw Error('G03_CURRENT_SESSION_OWNER_NOT_PROVEN')
 const cached=await loadVerifiedOpenSessionStatus(db,at)
 if(cached&&Date.parse(cached.proof.validBefore)>Date.parse(at)+120000)return {code:'G03_CURRENT_OPEN_SESSION_QUALIFIED',recordId:cached.record.id,proof:cached.proof,reused:true,publicSourceRequests:0,providerApiCalls:0,canonicalMaterialization:false}
 const timing=await loadVerifiedNseCashTimingAuthority(db,at)
 if(!timing)throw Error('G03_CURRENT_SESSION_TIMING_NOT_PROVEN')
 const result=await db.from('data_source_records').select('id,record_kind,retrieved_at,raw_payload').eq('source_code','NSE_OFFICIAL').in('record_kind',['V1_4_NSE_TRADING_CALENDAR_2026_BASE','V1_4_NSE_CALENDAR_APPROVED_BASELINE','V1_4_NSE_CALENDAR_REFRESH_CAPTURE']).lte('retrieved_at',at).order('retrieved_at',{ascending:false}).limit(100)
 if(result.error)throw Error('G03_CURRENT_SESSION_CALENDAR_READ_FAILED')
 const calendar=result.data as CalendarRecord[],ordinary=verifiedOrdinaryCompletedSessionCalendar(calendar,at),day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date(at))
 if(!ordinary||Date.parse(at)<Date.parse(day+'T09:15:00+05:30')||Date.parse(at)>=Date.parse(day+'T15:30:00+05:30'))return {code:'G03_ORDINARY_OPEN_SESSION_NOT_ELIGIBLE',publicSourceRequests:0,providerApiCalls:0,canonicalMaterialization:false}
 const url='https://www.nseindia.com/api/marketStatus'
 const response=await fetcher(url,{redirect:'error',headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json','Referer':'https://www.nseindia.com/'},signal:AbortSignal.timeout(15000)})
 if(response.status!==200)throw Error('G03_CURRENT_SESSION_HTTP_'+response.status)
 const text=await response.text(),bytes=new TextEncoder().encode(text)
 if(bytes.length>65536)throw Error('G03_CURRENT_SESSION_RESPONSE_TOO_LARGE')
 const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join(''),retrieved=g02PostgresTimestamp(now())
 const raw={source_url:url,status_code:200,original_text:text,original_sha256:sha,original_bytes:bytes.length,timing_source_record_id:timing.sourceRecordId},id=await g02StableId({kind:NSE_OPEN_STATUS_KIND,raw,retrievedAt:retrieved})
 const record:OpenSessionRecord={id,source_code:'NSE_OFFICIAL',record_kind:NSE_OPEN_STATUS_KIND,retrieved_at:retrieved,payload_hash:await hashG02(raw),raw_payload:raw}
 const proof=await verifiedOpenSessionStatus(record,calendar,retrieved,timing)
 if(!proof)throw Error('G03_CURRENT_OPEN_SESSION_NOT_QUALIFIED')
 const existing=await db.from('data_source_records').select('payload_hash').eq('id',id).maybeSingle();if(existing.error)throw Error('G03_CURRENT_SESSION_LOOKUP_FAILED')
 if(existing.data&&existing.data.payload_hash!==record.payload_hash)throw Error('G03_CURRENT_SESSION_IMMUTABLE_CONFLICT')
 if(!existing.data){const w=await db.from('data_source_records').insert({...record,published_at:null,external_record_id:id,source_url:url,terms_snapshot:{mode:'SOURCE_QUALIFICATION_NO_OWNER_REVIEW',public_source_requests:1,paid_provider_calls:0,retries:0,canonical_promotion:false,g03_bel_preservation:true,execution_sha:execution?.sha??null,execution_run_id:execution?.run_id??null}});if(w.error&&w.error.code!=='23505')throw Error('G03_CURRENT_SESSION_APPEND_FAILED')}
 const check=await db.from('data_source_records').select('payload_hash,raw_payload').eq('id',id).single();if(check.error||check.data.payload_hash!==record.payload_hash||await hashG02(check.data.raw_payload)!==record.payload_hash)throw Error('G03_CURRENT_SESSION_READBACK_FAILED')
 return {code:'G03_CURRENT_OPEN_SESSION_QUALIFIED',recordId:id,proof,reused:Boolean(existing.data),publicSourceRequests:1,providerApiCalls:0,canonicalMaterialization:false}
}
