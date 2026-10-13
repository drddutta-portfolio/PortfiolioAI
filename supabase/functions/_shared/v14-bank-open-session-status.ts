import {verifiedOrdinaryCompletedSessionCalendar,type CalendarRecord} from './v14-bank-pre-open-calendar.ts'
export const NSE_OPEN_STATUS_KIND='V1_4_NSE_CURRENT_OPEN_SESSION_STATUS'
export interface OpenSessionStatusProof{sessionDate:string;latestCompletedSession:string;sourceRecordIds:readonly string[];verifiedAt:string;observedAt:string;validBefore:string}
export interface OpenSessionRecord extends CalendarRecord{source_code:string;payload_hash:string}
export interface OrdinaryTimingAuthority{sourceRecordId:string;verifiedOriginalSha256:string;market:'CAPITAL_MARKET';normalOpen:'09:15';normalClose:'15:30';sourceVerified:true}
const digest=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(n=>n.toString(16).padStart(2,'0')).join('')
const canonical=(v:unknown):string=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v!==null&&typeof v==='object'?'{'+Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>JSON.stringify(k)+':'+canonical(x)).join(',')+'}':JSON.stringify(v)??'null'
export const nseSourcePayloadHash=(v:unknown)=>digest(canonical(v))
function isoDate(ms:number){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date(ms))}
function nseTime(value:unknown){if(typeof value!=='string')return NaN;const m=/^(\d{2})-([A-Za-z]{3})-(\d{4}) (\d{2}):(\d{2})$/.exec(value);if(!m)return NaN;const month=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(m[2]!)+1;if(!month)return NaN;return Date.parse(`${m[3]}-${String(month).padStart(2,'0')}-${m[1]}T${m[4]}:${m[5]}:00+05:30`)}
/** Original bytes must be captured by the authorized collector; canonical callers
 * never acquire market data. This permits only yesterday's settled history while
 * the current ordinary session is independently observed OPEN, never today's candle. */
export async function verifiedOpenSessionStatus(record:OpenSessionRecord,calendar:readonly CalendarRecord[],at:string,timing:OrdinaryTimingAuthority):Promise<OpenSessionStatusProof|null>{
 const now=Date.parse(at),retrieved=Date.parse(record.retrieved_at),p=record.raw_payload
 if(!Number.isFinite(now)||!Number.isFinite(retrieved)||retrieved>now||now-retrieved>300000||record.source_code!=='NSE_OFFICIAL'||record.record_kind!==NSE_OPEN_STATUS_KIND||p.source_url!=='https://www.nseindia.com/api/marketStatus'||p.status_code!==200||typeof p.original_text!=='string'||typeof p.original_sha256!=='string'||!/^([a-f0-9]{64})$/.test(p.original_sha256)||await digest(p.original_text)!==p.original_sha256||new TextEncoder().encode(p.original_text).length!==p.original_bytes||!timing.sourceVerified||timing.market!=='CAPITAL_MARKET'||timing.normalOpen!=='09:15'||timing.normalClose!=='15:30'||!timing.sourceRecordId||!/^[a-f0-9]{64}$/.test(timing.verifiedOriginalSha256)||p.timing_source_record_id!==timing.sourceRecordId)return null
 let raw:Record<string,unknown>;try{raw=JSON.parse(p.original_text)}catch{return null}
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null
 if(await nseSourcePayloadHash(p)!==record.payload_hash)return null
 const states=raw.marketState;if(!Array.isArray(states))return null
 const capital=states.filter((s:unknown)=>s&&typeof s==='object'&&'market'in s&&s.market==='Capital Market')
 if(capital.length!==1||capital[0].marketStatus!=='Open'||capital[0].marketStatusMessage!=='Normal Market is Open')return null
 const observed=nseTime(capital[0].tradeDate),date=isoDate(now),open=Date.parse(date+'T09:15:00+05:30'),close=Date.parse(date+'T15:30:00+05:30')
 if(!Number.isFinite(observed)||isoDate(observed)!==date||observed<open||observed>retrieved||retrieved-observed>300000||now-observed>=300000||now<open||now>=close)return null
 const previous=verifiedOrdinaryCompletedSessionCalendar(calendar,at),last=raw.indicativenifty50
 if(!previous||!last||typeof last!=='object'||!('status'in last)||last.status!=='CLOSE'||!('dateTime'in last))return null
 const closed=nseTime(last.dateTime)
 if(!Number.isFinite(closed)||isoDate(closed)!==previous.latestCompletedSession||closed!==Date.parse(previous.latestCompletedSession+'T15:30:00+05:30'))return null
 return{sessionDate:date,latestCompletedSession:previous.latestCompletedSession,sourceRecordIds:[record.id,timing.sourceRecordId,...previous.sourceRecordIds],verifiedAt:at,observedAt:new Date(observed).toISOString(),validBefore:new Date(Math.min(retrieved+300000,observed+300000,close)).toISOString()}
}
