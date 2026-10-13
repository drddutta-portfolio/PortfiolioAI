import type {SupabaseClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import {nseSourcePayloadHash,type OpenSessionRecord,type OrdinaryTimingAuthority} from './v14-bank-open-session-status.ts'
export const NSE_CASH_TIMING_KIND='V1_4_NSE_NORMAL_CASH_SESSION_TIMING'
export const NSE_CASH_TIMING_ORIGINAL='9b138c51ef3e05cef9fdc05746614f7919d8c8018e0fede788b228672b044067'
export async function qualifyNseCashTimingAuthority(record:OpenSessionRecord,at:string):Promise<OrdinaryTimingAuthority|null>{
 const p=record.raw_payload,now=Date.parse(at),retrieved=Date.parse(record.retrieved_at)
 if(!Number.isFinite(now)||!Number.isFinite(retrieved)||retrieved>now||record.source_code!=='NSE_OFFICIAL'||record.record_kind!==NSE_CASH_TIMING_KIND||await nseSourcePayloadHash(p)!==record.payload_hash||p.source_url!=='https://www.nseindia.com/market-data/market-timings'||p.original_sha256!==NSE_CASH_TIMING_ORIGINAL||p.original_bytes!==330721||p.market!=='CAPITAL_MARKET'||p.normal_open!=='09:15'||p.normal_close!=='15:30'||p.opening_quote!=='Normal / Odd lot market Open 09:15 hrs'||p.closing_quote!=='Normal / Odd lot market Close 15:30 hrs')return null
 let hash=NSE_CASH_TIMING_ORIGINAL
 if(typeof p.original_text==='string'){
  const bytes=new TextEncoder().encode(p.original_text);hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('')
  if(bytes.length!==330721||hash!==NSE_CASH_TIMING_ORIGINAL||!/<td>Normal \/ Odd lot market Open<\/td>\s*<td>09:15 hrs<\/td>/.test(p.original_text)||!/<td>Normal \/ Odd lot market Close<\/td>\s*<td>15:30 hrs<\/td>/.test(p.original_text))return null
 }else{
  // Only the authorized original-registration path can establish this immutable
  // R2 body binding. The read-only canonical path checks its exact pinned source
  // identity and verbatim cash rows; it does not download or relabel evidence.
  const fragment=p.cash_table_fragment
  if(p.r2_verified_sha256!==NSE_CASH_TIMING_ORIGINAL||p.r2_bucket!=='portfolioai-history-dev'||p.r2_object_key!==`portfolioai-history/development/v1-4/banking/pit-originals/${NSE_CASH_TIMING_ORIGINAL}.html`||typeof fragment!=='string'||!/<td>Normal \/ Odd lot market Open<\/td>\s*<td>09:15 hrs<\/td>/.test(fragment)||!/<td>Normal \/ Odd lot market Close<\/td>\s*<td>15:30 hrs<\/td>/.test(fragment))return null
 }
 return{sourceRecordId:record.id,verifiedOriginalSha256:hash,market:'CAPITAL_MARKET',normalOpen:'09:15',normalClose:'15:30',sourceVerified:true}
}
export async function loadVerifiedNseCashTimingAuthority(db:SupabaseClient,at:string){
 const result=await db.from('data_source_records').select('id,source_code,record_kind,retrieved_at,payload_hash,raw_payload').eq('source_code','NSE_OFFICIAL').eq('record_kind',NSE_CASH_TIMING_KIND).eq('raw_payload->>original_sha256',NSE_CASH_TIMING_ORIGINAL).lte('retrieved_at',at).limit(2)
 if(result.error)throw Error('NSE_CASH_TIMING_SOURCE_READ_FAILED')
 if(!result.data?.length)return null
 if(result.data.length!==1)throw Error('NSE_CASH_TIMING_SOURCE_NOT_UNIQUE')
 return qualifyNseCashTimingAuthority(result.data[0] as OpenSessionRecord,at)
}
