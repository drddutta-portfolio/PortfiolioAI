import assert from 'node:assert/strict'
import {parseOfficialBenchmarkHistory} from '../supabase/functions/_shared/v14-official-benchmark-history.ts'
const row={INDEX_NAME:'Nifty Capital Goods',HistoricalDate:'06 Oct 2026',CLOSE:'16756.0300',OPEN:'-',HIGH:'-',LOW:'-'}
const input={body:JSON.stringify([row]),code:'NIFTY_CAPITAL_GOODS',basis:'PRICE_RETURN_RAW_CLOSE',from:'2026-10-01',to:'2026-10-06',minimum:1}
const result=parseOfficialBenchmarkHistory(input)
assert.equal(result.rows[0].close,'16756.0300')
assert.equal(result.ohlcAvailable,false)
assert.equal(result.calendarState,'UNVERIFIED')
assert.equal(result.readinessPromoted,false)
assert.equal('open' in result.rows[0],false)
for(const change of [{INDEX_NAME:'Nifty Bank'},{HistoricalDate:'31 Feb 2026'},{CLOSE:'0'},{CLOSE:'-1'},{CLOSE:16756.03}])assert.throws(()=>parseOfficialBenchmarkHistory({...input,body:JSON.stringify([{...row,...change}])}))
assert.throws(()=>parseOfficialBenchmarkHistory({...input,body:JSON.stringify([row,row])}))
assert.throws(()=>parseOfficialBenchmarkHistory({...input,basis:'TOTAL_RETURN_INDEX'}))
assert.throws(()=>parseOfficialBenchmarkHistory({...input,code:'NIFTY_TELECOM',body:JSON.stringify([{...row,INDEX_NAME:'Nifty Telecommunications'}])}))
assert.throws(()=>parseOfficialBenchmarkHistory({...input,minimum:252}))
assert.equal(parseOfficialBenchmarkHistory({...input,body:JSON.stringify({d:JSON.stringify([row])})}).rows.length,1)
console.log('Official benchmark parser: exact identity, date, basis, decimal preservation, duplicate/count and fail-closed checks PASS')
