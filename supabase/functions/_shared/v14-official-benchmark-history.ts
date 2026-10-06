import {P7_IC_BENCHMARK_REGISTRY,normalizeBenchmarkAlias} from './p7-ic-benchmark-adapter.ts'
export type OfficialIndexBasis='PRICE_RETURN_RAW_CLOSE'|'TOTAL_RETURN_INDEX'
/** Close-only evidence adapter. No OHLC synthesis or readiness promotion. */
export function parseOfficialBenchmarkHistory(input:{body:string;code:string;basis:OfficialIndexBasis;from:string;to:string;minimum:number;maximum?:number}){
 const validDay=(day:string)=>{const ms=Date.parse(day+'T00:00:00Z');return /^\d{4}-\d{2}-\d{2}$/u.test(day)&&Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,10)===day}
 const definition=P7_IC_BENCHMARK_REGISTRY.find(x=>x.code===input.code)
 if(!definition)throw new Error('OFFICIAL_BENCHMARK_CODE_NOT_APPROVED')
 if(!['PRICE_RETURN_RAW_CLOSE','TOTAL_RETURN_INDEX'].includes(input.basis))throw new Error('OFFICIAL_BENCHMARK_BASIS_INVALID')
 if(!Number.isInteger(input.minimum)||input.minimum<1||!Number.isInteger(input.maximum??400)||(input.maximum??400)<input.minimum||!validDay(input.from)||!validDay(input.to)||input.from>input.to)throw new Error('OFFICIAL_BENCHMARK_WINDOW_INVALID')
 let raw:unknown=JSON.parse(input.body)
 if(raw&&typeof raw==='object'&&!Array.isArray(raw)&&'d' in raw){const d=(raw as {d:unknown}).d;raw=typeof d==='string'?JSON.parse(d):d}
 if(!Array.isArray(raw)||raw.length<input.minimum||raw.length>(input.maximum??400))throw new Error('OFFICIAL_BENCHMARK_SESSION_COUNT_INVALID')
 const aliases=new Set(definition.acceptedAliases.map(normalizeBenchmarkAlias))
 const seen=new Set<string>()
 const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
 const rows=raw.map(value=>{
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('OFFICIAL_BENCHMARK_ROW_INVALID')
  const row=value as Record<string,unknown>
  const identity=String(row['Index Name']||row.INDEX_NAME||'')
  if(!aliases.has(normalizeBenchmarkAlias(identity)))throw new Error('OFFICIAL_BENCHMARK_IDENTITY_MISMATCH')
  const date=String(row.Date??row.HistoricalDate??'')
  const match=/^(\d{2})[- ]([A-Za-z]{3})[- ](\d{4})$/u.exec(date)
  const month=match?months.findIndex(x=>x.toLowerCase()===match[2]!.toLowerCase()):-1
  const day=match&&month>=0?`${match[3]}-${String(month+1).padStart(2,'0')}-${match[1]}`:date
  const ms=Date.parse(day+'T00:00:00Z')
  if(!/^\d{4}-\d{2}-\d{2}$/u.test(day)||!Number.isFinite(ms)||new Date(ms).toISOString().slice(0,10)!==day||day<input.from||day>input.to)throw new Error('OFFICIAL_BENCHMARK_DATE_INVALID')
  if(seen.has(day))throw new Error('OFFICIAL_BENCHMARK_DUPLICATE_SESSION')
  seen.add(day)
  const close=row[input.basis==='TOTAL_RETURN_INDEX'?'TotalReturnsIndex':'CLOSE']
  if(typeof close!=='string'||!/^\d+(?:\.\d+)?$/u.test(close)||!/[1-9]/u.test(close))throw new Error('OFFICIAL_BENCHMARK_VALUE_INVALID')
  return{session:day,close,officialIdentity:identity}
 }).sort((a,b)=>a.session.localeCompare(b.session))
 return{code:input.code,sourceAuthority:'NIFTY_OFFICIAL' as const,returnBasis:input.basis,rows,ohlcAvailable:false as const,calendarState:'UNVERIFIED' as const,readinessPromoted:false as const}
}
