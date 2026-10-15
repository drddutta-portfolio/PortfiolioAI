import pins from './v14-g03-market-renewal-pins.json' with {type:'json'}
import {readG02Original} from './v14-g02-source-import.ts'
export {pins as G03_MARKET_RENEWAL_PINS}
export async function verifyBelMarketOriginal(index:number,bytes:Uint8Array){
 const p=pins.sources[index];if(!p||bytes.length!==p.bytes)throw Error('G03_MARKET_ORIGINAL_LENGTH_INVALID')
 const copy=new Uint8Array(bytes.length);copy.set(bytes)
 const h=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',copy.buffer))).map(x=>x.toString(16).padStart(2,'0')).join('')
 if(h!==p.hash)throw Error('G03_MARKET_ORIGINAL_HASH_INVALID')
 const body=new TextDecoder().decode(bytes)
 if(p.extension==='json'){
  const rows:unknown=JSON.parse(body);if(!Array.isArray(rows)||rows.length!==12)throw Error('G03_CORPORATE_TAIL_SCHEMA_INVALID')
  for(const r of rows){if(!r||typeof r!=='object'||!('symbol' in r)||!('isin' in r)||!('exDate' in r)||!('subject' in r))throw Error('G03_CORPORATE_TAIL_SCHEMA_INVALID');if(r.symbol===pins.symbol||r.isin===pins.isin)throw Error('G03_BEL_CORPORATE_ACTION_REQUIRES_REVIEW');const d=String(r.exDate).match(/^(\d{2})-(\w{3})-(\d{4})$/);if(!d)throw Error('G03_CORPORATE_TAIL_DATE_INVALID');const ms=Date.parse(String(r.exDate));if(ms<Date.parse('2026-10-08')||ms>Date.parse(pins.through))throw Error('G03_CORPORATE_TAIL_DATE_OUTSIDE_WINDOW')}
 }else{
  const lines=body.trim().split(/\r?\n/).map(x=>x.split(',')),header=lines[0],identity=header.indexOf('Index Name'),date=header.indexOf('Index Date'),close=header.indexOf('Closing Index Value')
  if(Math.min(identity,date,close)<0)throw Error('G03_OFFICIAL_INDEX_SCHEMA_INVALID')
  for(const b of pins.benchmarks){const rows=lines.slice(1).filter(x=>x[identity]===b.identity),pinned=p as typeof pins.sources[0];if(rows.length!==1||rows[0][date]!==pinned.session?.split('-').reverse().join('-')||rows[0][close]!==pinned.closes?.[b.code as keyof typeof pinned.closes])throw Error('G03_OFFICIAL_INDEX_IDENTITY_DATE_VALUE_INVALID')}
 }
 return p
}
export async function readBelMarketOriginal(index:number,url:string){
 const p=pins.sources[index],u=new URL(url)
 if(!p||u.protocol!=='https:'||u.hostname!=='ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com'||u.pathname!=='/portfolioai-history-dev/'+p.r2_key)throw Error('G03_MARKET_R2_SCOPE_INVALID')
 const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('G03_MARKET_ORIGINAL_READ_FAILED')
 await verifyBelMarketOriginal(index,await readG02Original(r,p.bytes));return p
}

/** NSE completed-session end is an IST date, never UTC midnight of the next IST day.
 * This corrects the timestamp representation; no grace interval is extended. */
export function belCompletedSessionFreshness(sessionDate:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)||new Date(sessionDate+'T00:00:00Z').toISOString().slice(0,10)!==sessionDate)throw Error('G03_COMPLETED_SESSION_DATE_INVALID')
 return sessionDate+'T23:59:59+05:30'
}
