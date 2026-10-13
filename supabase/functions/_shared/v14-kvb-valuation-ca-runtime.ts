import type {SupabaseClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import pin from './v14-kvb-valuation-ca-late-pin.json' with {type:'json'}
import {kvbPbHash,kvbPbStableId,KVB_PB_SECURITY} from './v14-kvb-pb-admission.ts'
import historicalPins from './v14-kvb-valuation-historical-source-pins.json' with {type:'json'}
const historic=[{id:'89044ed1-131b-4103-8473-5626bce8a6c0',hash:'1d76985787ff71de5acfe4398f98ae3c020342b40eca04aa8b1b87f079d498f5',from:'2021-10-01',to:'2022-03-31'},{id:'3be53e80-b257-444c-b11a-0df12820653c',hash:'6a47173c70f5499dc05005b7ef9f633a773dd8c13793ab859cd2dc15f4313c15',from:'2022-04-01',to:'2022-09-30'},{id:'6c4f2e4c-7267-45cf-91fb-9b205a83fec7',hash:'3c4678bd65c3de97f3ebad17eb435f948a51ba56055805be6ab5b59bdcff6022',from:'2022-10-01',to:'2023-03-31'},{id:'72427cb0-0a98-454b-9112-c1cd4244b553',hash:'638967f06c9ab0c9ffba09225ae4365f927cf1c89a5fb62d1b6757e62d24899e',from:'2023-04-01',to:'2023-09-30'}]
const key=`portfolioai-history/development/v1-4/banking/pit-originals/${pin.original_sha256}.json`
export function kvbLateCaReadUrl(value:string){try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com'&&!u.username&&!u.password&&!u.port&&!u.hash&&decodeURIComponent(u.pathname)===`/portfolioai-history-dev/${key}`&&u.searchParams.get('X-Amz-Algorithm')==='AWS4-HMAC-SHA256'&&Number(u.searchParams.get('X-Amz-Expires'))>0&&Number(u.searchParams.get('X-Amz-Expires'))<=300}catch{return false}}
export async function prepareKvbValuationCaSources(db:SupabaseClient,readUrl:string){
 if(!kvbLateCaReadUrl(readUrl))throw Error('KVB_EXACT_LATE_CA_ORIGINAL_URL_REQUIRED')
 const read=await db.from('data_source_records').select('id,source_code,record_kind,payload_hash,raw_payload').in('id',historic.map(p=>p.id))
 if(read.error||read.data?.length!==4)throw Error('KVB_HISTORICAL_CA_SOURCE_SET_INCOMPLETE')
 for(const p of historic){const row=read.data.find(x=>x.id===p.id),integrity=historicalPins.find(x=>x.id===p.id);if(!row||!integrity||row.source_code!==integrity.source_code||row.record_kind!==integrity.record_kind||row.payload_hash!==integrity.ledger_hash||await kvbPbHash(row.raw_payload)!==integrity.canonical_raw_hash||row.source_code!=='NSE_OFFICIAL'||row.record_kind!=='V1_4_BANK_VALUATION_CORPORATE_ACTION_CAPTURE'||row.payload_hash!==p.hash||row.raw_payload.from!==p.from||row.raw_payload.to!==p.to||!Array.isArray(row.raw_payload.bank_rows))throw Error('KVB_HISTORICAL_CA_PIN_CONFLICT')}
 const response=await fetch(readUrl,{redirect:'error',signal:AbortSignal.timeout(20000)})
 if(!response.ok)throw Error('KVB_LATE_CA_ORIGINAL_READ_FAILED')
 const bytes=new Uint8Array(await response.arrayBuffer());const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('')
 if(bytes.length!==pin.original_bytes||hash!==pin.original_sha256)throw Error('KVB_LATE_CA_ORIGINAL_BYTES_MISMATCH')
 const events:unknown=JSON.parse(new TextDecoder().decode(bytes))
 if(!Array.isArray(events)||events.length!==4||events.some(e=>!e||e.symbol!=='KARURVYSYA'||e.isin!=='INE036D01010'||e.series!=='EQ'))throw Error('KVB_LATE_CA_ORIGINAL_IDENTITY_INVALID')
 const subjects=events.map(e=>`${e.exDate}|${e.subject}`).sort();const expected=['01-Aug-2024|Dividend - Rs 2.40 Per Share','07-Aug-2025|Dividend - Rs 2.60 Per Share','26-Aug-2025|Bonus 1:5','24-Jul-2026|Dividend - Rs 2.60 Per Share'].sort()
 if(JSON.stringify(subjects)!==JSON.stringify(expected))throw Error('KVB_LATE_CA_SHARE_EVENTS_CHANGED')
 const raw={version:'KVB_VALUATION_ORIGINAL_CA_FULL_RANGE_V1',security_id:KVB_PB_SECURITY,symbol:'KARURVYSYA',native_api_isin:'INE036D01010',price_security_isin:'INE036D01028',from_date:'2023-10-01',through_date:'2026-10-12',original_url:pin.original_url,original_sha256:hash,original_bytes:bytes.length,official_response:events,r2_bucket:'portfolioai-history-dev',r2_object_key:key,first_verified_available_at:pin.retrieved_at,publication_precision:'UNKNOWN',historical_publication_not_inferred:true,canonical_promotion:false}
 const id=await kvbPbStableId(raw),candidate={id,source_code:'NSE_OFFICIAL',record_kind:'V1_4_KVB_VALUATION_OFFICIAL_CORPORATE_ACTION_RANGE',external_record_id:hash,retrieved_at:pin.retrieved_at,published_at:null,payload_hash:await kvbPbHash(raw),raw_payload:raw,source_url:pin.original_url}
 return {sourceRecordIds:[...historic.map(p=>p.id),id],candidate}
}
