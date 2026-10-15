import pins from './v14-g03-market-append-pins.json' with {type:'json'}
import {bytesHashG02} from './v14-g02-source-import.ts'
export {pins as G03_APPEND_PINS}
export function qualifiedBelAppendOriginal(index:number,text:string){
 const p=pins.sources[index];if(!p)throw Error('G03_APPEND_ORIGINAL_SCOPE_INVALID')
 if(p.extension==='json'){
  const data:unknown=JSON.parse(text);if(!Array.isArray(data))throw Error('G03_APPEND_CORPORATE_ACTION_SCHEMA_INVALID')
  for(const row of data){if(!row||typeof row!=='object'||!['symbol','isin','exDate','subject'].every(k=>k in row))throw Error('G03_APPEND_CORPORATE_ACTION_SCHEMA_INVALID');if(row.symbol===pins.symbol||row.isin===pins.isin)throw Error('G03_APPEND_BEL_CORPORATE_ACTION_REQUIRES_REVIEW');if(row.exDate!=='15-Oct-2026')throw Error('G03_APPEND_CORPORATE_ACTION_DATE_INVALID')}
  return {corporateActionRows:data.length,matchingBelRows:0}
 }
 const rows=text.trim().split(/\r?\n/).map(x=>x.split(',')),headers=rows[0],ix=headers.indexOf('Index Name'),dx=headers.indexOf('Index Date'),cx=headers.indexOf('Closing Index Value')
 if(Math.min(ix,dx,cx)<0)throw Error('G03_APPEND_BENCHMARK_SCHEMA_INVALID')
 for(const b of pins.benchmarks){const matches=rows.slice(1).filter(r=>r[ix]===b.identity);if(matches.length!==1||matches[0][dx]!=='15-10-2026'||!/^\d+(?:\.\d+)?$/.test(matches[0][cx]))throw Error('G03_APPEND_BENCHMARK_IDENTITY_DATE_INVALID')}
 return Object.fromEntries(pins.benchmarks.map(b=>[b.code,rows.find(r=>r[ix]===b.identity)![cx]]))
}
export async function verifyBelAppendOriginal(index:number,data:Uint8Array){const p=pins.sources[index];if(!p||data.byteLength!==p.bytes||await bytesHashG02(data)!==p.hash)throw Error('G03_APPEND_ORIGINAL_HASH_OR_LENGTH_INVALID');return qualifiedBelAppendOriginal(index,new TextDecoder().decode(data))}
