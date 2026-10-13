import {kvbPbHash,kvbPbStableId} from './v14-kvb-pb-admission.ts'
import type {OrdinaryTimingAuthority} from './v14-bank-open-session-status.ts'
export const KVB_NSE_TIMING_PIN={url:'https://www.nseindia.com/market-data/market-timings',sha256:'9b138c51ef3e05cef9fdc05746614f7919d8c8018e0fede788b228672b044067',bytes:330721,retrievedAt:'2026-10-13T05:22:27.329269Z'}
const key=`portfolioai-history/development/v1-4/banking/pit-originals/${KVB_NSE_TIMING_PIN.sha256}.html`
export function kvbTimingReadUrl(raw:string){try{const u=new URL(raw);return u.protocol==='https:'&&u.hostname==='ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com'&&!u.username&&!u.password&&!u.port&&!u.hash&&decodeURIComponent(u.pathname)===`/portfolioai-history-dev/${key}`&&u.searchParams.get('X-Amz-Algorithm')==='AWS4-HMAC-SHA256'&&Number(u.searchParams.get('X-Amz-Expires'))>0&&Number(u.searchParams.get('X-Amz-Expires'))<=300}catch{return false}}
export async function prepareKvbTimingRegistration(readUrl:string){
 if(!kvbTimingReadUrl(readUrl))throw Error('KVB_PINNED_NSE_TIMING_READ_URL_REQUIRED')
 const response=await fetch(readUrl,{redirect:'error',signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('KVB_NSE_TIMING_ORIGINAL_READ_FAILED')
 const bytes=new Uint8Array(await response.arrayBuffer()),sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('')
 if(bytes.length!==KVB_NSE_TIMING_PIN.bytes||sha!==KVB_NSE_TIMING_PIN.sha256)throw Error('KVB_NSE_TIMING_ORIGINAL_BYTES_CONFLICT')
 const originalText=new TextDecoder('utf-8',{fatal:true}).decode(bytes),plain=originalText.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ')
 const opening='Normal / Odd lot market Open 09:15 hrs',closing='Normal / Odd lot market Close 15:30 hrs'
 if(!plain.includes(opening)||!plain.includes(closing))throw Error('KVB_NSE_CASH_TIMING_EXACT_TABLE_NOT_FOUND')
 const openRow=originalText.match(/<tr>\s*<td>Normal \/ Odd lot market Open<\/td>\s*<td>09:15 hrs<\/td>\s*<\/tr>/)?.[0],closeRow=originalText.match(/<tr>\s*<td>Normal \/ Odd lot market Close<\/td>\s*<td>15:30 hrs<\/td>\s*<\/tr>/)?.[0]
 if(!openRow||!closeRow||!originalText.includes('>Equities</a>'))throw Error('KVB_NSE_NORMAL_CASH_ROWS_MISSING')
 const openIndex=originalText.indexOf(openRow),closeIndex=originalText.indexOf(closeRow),equitiesContext=originalText.lastIndexOf('>Equities</a>',openIndex)
 if(equitiesContext<0||closeIndex<openIndex)throw Error('KVB_NSE_EQUITIES_TIMING_CONTEXT_MISSING')
 const cashFragment=originalText.slice(equitiesContext+1,closeIndex+closeRow.length)
 const raw={source_url:KVB_NSE_TIMING_PIN.url,original_sha256:sha,original_bytes:bytes.length,cash_table_fragment:cashFragment,opening_quote:opening,closing_quote:closing,market:'CAPITAL_MARKET',normal_open:'09:15',normal_close:'15:30',publication_precision:'UNKNOWN',r2_bucket:'portfolioai-history-dev',r2_object_key:key,r2_verified_sha256:sha,first_verified_available_at:KVB_NSE_TIMING_PIN.retrievedAt,canonical_promotion:false}
 const id=await kvbPbStableId({kind:'V1_4_NSE_NORMAL_CASH_SESSION_TIMING',sha}),candidate={id,source_code:'NSE_OFFICIAL',record_kind:'V1_4_NSE_NORMAL_CASH_SESSION_TIMING',external_record_id:sha,retrieved_at:KVB_NSE_TIMING_PIN.retrievedAt,published_at:null,source_url:KVB_NSE_TIMING_PIN.url,payload_hash:await kvbPbHash(raw),raw_payload:raw}
 const timing:OrdinaryTimingAuthority={sourceRecordId:id,verifiedOriginalSha256:sha,market:'CAPITAL_MARKET',normalOpen:'09:15',normalClose:'15:30',sourceVerified:true}
 return {candidate,timing}
}
