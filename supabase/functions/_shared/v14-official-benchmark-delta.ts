export interface OfficialBenchmarkDeltaPoint{session:string;close:string;officialIdentity:string}
export function officialBenchmarkDeltaPoints(raw:Readonly<Record<string,unknown>>,lastSession:string):OfficialBenchmarkDeltaPoint[]{
 const rows:unknown=raw.sessions??[{session:raw.session,close:raw.close,official_identity:raw.official_identity}]
 if(!Array.isArray(rows)||!rows.length||rows.length>14)throw Error('OFFICIAL_BENCHMARK_DELTA_COUNT_INVALID')
 let previous=lastSession
 return rows.map(row=>{
  if(!row||typeof row!=='object')throw Error('OFFICIAL_BENCHMARK_DELTA_FACT_INVALID')
  const x=row as Record<string,unknown>,session=String(x.session??''),close=String(x.close??''),officialIdentity=String(x.official_identity??'')
  if(!/^\d{4}-\d{2}-\d{2}$/.test(session)||!Number.isFinite(Date.parse(session))||new Date(session).toISOString().slice(0,10)!==session||!/^\d+(?:\.\d+)?$/.test(close)||BigInt(close.replace('.',''))<=0n||!officialIdentity||officialIdentity!==String(raw.official_identity??''))throw Error('OFFICIAL_BENCHMARK_DELTA_FACT_INVALID')
  if(session<=previous)throw Error('OFFICIAL_BENCHMARK_DELTA_NOT_APPEND_ONLY');previous=session
  return {session,close,officialIdentity}
 })
}
