import pins from './v14-g02-history-renewal-pins.json' with {type:'json'}
import {hashG02,readG02Original} from './v14-g02-source-import.ts'
export {pins as G02_HISTORY_RENEWAL_PINS}
export const G02_HISTORY_TAIL_PREFIX='portfolioai-history/development/v1-4/g02/history-tail/'
export async function verifyG02HistoryTail(hash:string,bytes:Uint8Array){
 const pin=pins.sources.find(x=>x.hash===hash)
 if(!pin||bytes.length!==pin.bytes)throw Error('G02_TAIL_PIN_LENGTH_INVALID')
 const copied=new Uint8Array(bytes.length);copied.set(bytes)
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',copied.buffer))).map(x=>x.toString(16).padStart(2,'0')).join('')
 if(digest!==hash)throw Error('G02_TAIL_ORIGINAL_HASH_INVALID')
 const body=new TextDecoder().decode(bytes)
 if(pin.extension==='json'){
  const rows:unknown=JSON.parse(body)
  if(!Array.isArray(rows)||rows.length!==10)throw Error('G02_CORPORATE_TAIL_SCHEMA_INVALID')
  for(const row of rows){if(!row||typeof row!=='object'||!('symbol' in row)||!('isin' in row)||!('exDate' in row)||!('subject' in row))throw Error('G02_CORPORATE_TAIL_SCHEMA_INVALID');if(pins.stocks.some(s=>s.symbol===row.symbol)||['INE067A01029','INE0LCL01028','INE419M01035'].includes(String(row.isin)))throw Error('G02_CORPORATE_TAIL_ACTION_REQUIRES_REVIEW')}
 }else if(!body.includes('Nifty Capital Goods')&&!body.includes('NIFTY CAPITAL GOODS'))throw Error('G02_EXACT_INDEX_IDENTITY_MISSING')
 return pin
}
export async function readG02HistoryTail(hash:string,readUrl:string){
 const pin=pins.sources.find(x=>x.hash===hash);if(!pin)throw Error('G02_TAIL_PIN_INVALID')
 const u=new URL(readUrl),key=G02_HISTORY_TAIL_PREFIX+hash+'.'+pin.extension
 if(u.protocol!=='https:'||u.hostname!=='ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com'||u.pathname!=='/portfolioai-history-dev/'+key)throw Error('G02_TAIL_R2_SCOPE_INVALID')
 const response=await fetch(readUrl,{redirect:'error',signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('G02_TAIL_READ_FAILED')
 await verifyG02HistoryTail(hash,await readG02Original(response,pin.bytes));return {pin,key}
}
export async function g02RenewalPayload(parent:Record<string,unknown>,input:{sourceIds:string[];captureId:string;calendarId:string;dailyId:string;count:number}){
 const proof=parent.proof as Record<string,unknown>
 if(parent.target_type!=='SECURITY'||!pins.stocks.some(x=>x.id===parent.target_id)||proof.sourceAuthority!=='ANGEL_ONE'||proof.returnBasis!=='PRICE_RETURN_RAW_CLOSE'||proof.corporateActionState!=='COMPLETE'||proof.exchangeCalendarState!=='VERIFIED'||proof.unresolvedCorporateActionCount!==0||!Array.isArray(proof.corporateActionSourceRecordIds)||!Array.isArray(proof.exchangeCalendarSourceRecordIds)||!Array.isArray(proof.lineageSourceRecordIds)||input.count<252)throw Error('G02_ACCEPTED_PARENT_HISTORY_REQUIRED')
 return { ...parent, proof:{...proof,freshnessThrough:pins.through+'T23:59:59Z',dailySessionState:'LATEST_COMPLETED_SESSION_POST_CLOSE',dailySessionProofRecordIds:[input.dailyId],corporateActionSourceRecordIds:[...proof.corporateActionSourceRecordIds,input.sourceIds.at(-1)],exchangeCalendarSourceRecordIds:[...proof.exchangeCalendarSourceRecordIds,input.calendarId],lineageSourceRecordIds:[...proof.lineageSourceRecordIds,...input.sourceIds,input.captureId]},validation:{...(parent.validation as Record<string,unknown>),latest_session:pins.through,distinct_sessions:input.count,renewal_version:pins.version,renewal_inputs_sha256:await hashG02(input),prior_validated_window_preserved:true}}
}
