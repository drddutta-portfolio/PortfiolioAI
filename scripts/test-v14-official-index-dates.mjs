import assert from 'node:assert/strict'
import {validateCapturedResponse} from '../supabase/functions/_shared/v14-source-validation.ts'
const validate=(date,index='Nifty Capital Goods',value='20952.83')=>validateCapturedResponse({status:200,contentType:'application/json',format:'NIFTY_TRI_JSON',expectedIndex:'NIFTY CAPITAL GOODS',requestedFrom:'2026-10-01',requestedTo:'2026-10-06',requiredDates:['2026-10-06'],bodyText:JSON.stringify([{'Index Name':index,Date:date,TotalReturnsIndex:value}])})
for(const date of ['06 Oct 2026','06-Oct-2026','2026-10-06'])assert.equal(validate(date).ok,true)
assert.equal(validate('31 Feb 2026').ok,false)
assert.equal(validate('2026-02-30').ok,false)
assert.equal(validate('06 Oct 2026','Nifty Bank').ok,false)
assert.equal(validate('06 Oct 2026','Nifty Capital Goods','0').ok,false)
assert.equal(validate('06 Oct 2026','Nifty Capital Goods','-1').ok,false)
assert.equal(validate('07 Oct 2026').ok,false)
console.log('V1-4 official index date regression: 9 checks PASS; zero provider requests')
