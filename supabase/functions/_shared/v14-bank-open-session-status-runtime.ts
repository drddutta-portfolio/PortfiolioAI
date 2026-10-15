import {loadVerifiedNseCashTimingAuthority} from './v14-bank-open-session-timing.ts'
import type {SupabaseClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import {NSE_OPEN_STATUS_KIND,verifiedOpenSessionStatus,type OpenSessionRecord,type OrdinaryTimingAuthority} from './v14-bank-open-session-status.ts'
import type {CalendarRecord} from './v14-bank-pre-open-calendar.ts'
/** Read-only cache interpretation. The API collector is elsewhere; no network
 * acquisition, grants, admission or timestamp modification is permitted here. */
export async function loadVerifiedOpenSessionStatus(db:SupabaseClient,at:string,timing?:OrdinaryTimingAuthority){
 const authority=timing??await loadVerifiedNseCashTimingAuthority(db,at)
 if(!authority)return null
 const [status,calendar]=await Promise.all([
  db.from('data_source_records').select('id,source_code,record_kind,retrieved_at,payload_hash,raw_payload').eq('source_code','NSE_OFFICIAL').eq('record_kind',NSE_OPEN_STATUS_KIND).lte('retrieved_at',at).order('retrieved_at',{ascending:false}).limit(2),
  db.from('data_source_records').select('id,record_kind,retrieved_at,raw_payload').eq('source_code','NSE_OFFICIAL').in('record_kind',['V1_4_NSE_TRADING_CALENDAR_2026_BASE','V1_4_NSE_CALENDAR_APPROVED_BASELINE','V1_4_NSE_CALENDAR_REFRESH_CAPTURE']).lte('retrieved_at',at).order('retrieved_at',{ascending:false}).limit(100)
 ])
 if(status.error||calendar.error)throw Error('NSE_OPEN_SESSION_CACHE_READ_FAILED')
 if(!status.data?.length)return null
 const latest=status.data[0] as OpenSessionRecord
 if(status.data.some(s=>s.retrieved_at===latest.retrieved_at&&s.payload_hash!==latest.payload_hash))throw Error('NSE_OPEN_SESSION_CAPTURE_CONFLICT')
 const proof=await verifiedOpenSessionStatus(latest,calendar.data as CalendarRecord[],at,authority)
 return proof?{record:latest,proof}:null
}
