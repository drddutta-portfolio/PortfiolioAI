import {describe,it,expect} from 'vitest'
import {officialBenchmarkDeltaPoints} from './v14-official-benchmark-delta'
const raw={official_identity:'NIFTY CAPITAL GOODS',sessions:[{session:'2026-10-07',close:'16000.01',official_identity:'NIFTY CAPITAL GOODS'},{session:'2026-10-08',close:'16137.42',official_identity:'NIFTY CAPITAL GOODS'}]}
describe('bounded official benchmark delta',()=>{
 it('appends every verified session and preserves exact decimals',()=>expect(officialBenchmarkDeltaPoints(raw,'2026-10-06').map(x=>x.close)).toEqual(['16000.01','16137.42']))
 it('preserves legacy scalar delta',()=>expect(officialBenchmarkDeltaPoints({session:'2026-10-07',close:'1.01',official_identity:'Nifty Bank'},'2026-10-06')).toHaveLength(1))
 it('rejects overlap, duplicates, order inversion, malformed dates, zero and identity mixing',()=>{
  for(const r of [{...raw,sessions:[raw.sessions[0],raw.sessions[0]]},{...raw,sessions:[raw.sessions[1],raw.sessions[0]]},{...raw,sessions:[{...raw.sessions[0],session:'2026-02-30'}]},{...raw,sessions:[{...raw.sessions[0],close:'0'}]},{...raw,sessions:[{...raw.sessions[0],official_identity:'NIFTY BANK'}]}])expect(()=>officialBenchmarkDeltaPoints(r,'2026-10-06')).toThrow()
  expect(()=>officialBenchmarkDeltaPoints(raw,'2026-10-07')).toThrow()
 })
})
