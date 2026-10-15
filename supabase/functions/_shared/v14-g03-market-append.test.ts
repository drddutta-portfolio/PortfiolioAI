import {describe,it,expect,vi} from 'vitest'
import {readFileSync} from 'node:fs'
import {G03_APPEND_PINS as pins,qualifiedBelAppendOriginal,verifyBelAppendOriginal} from './v14-g03-market-append.ts'
import {appendBelCompletedSession} from './v14-g03-market-append-runtime.ts'
import {hashG02} from './v14-g02-source-import.ts'
import policy from './v14-g03-market-authorization.json'
const original=(index:number)=>readFileSync(new URL('../../../scripts/v1-4/fixtures/g03-market-tail/'+pins.sources[index].fixture,import.meta.url))
const body={action:'APPEND_FIXED_G03_BEL_COMPLETED_SESSION',authorizationHash:policy.directiveSha256,through:pins.through,captureId:'capture',readUrls:['one','two']}
describe('BEL completed-session append preserves valid history and requires actual new evidence',()=>{
 it('verifies the real NSE originals and exact benchmark identities and session date',async()=>{
  expect(await verifyBelAppendOriginal(0,original(0))).toEqual({NIFTY_INDIA_DEFENCE:'9196.25',NIFTY_CAPITAL_GOODS:'16200.41'})
  expect(await verifyBelAppendOriginal(1,original(1))).toEqual({corporateActionRows:3,matchingBelRows:0})
  const changed=Buffer.from(original(0));changed[0]^=1;await expect(verifyBelAppendOriginal(0,changed)).rejects.toThrow('HASH_OR_LENGTH')
 })
 it('rejects wrong dates, duplicate identities, TRI substitutions and a newly discovered BEL corporate action',()=>{
  const csv=original(0).toString(),line=csv.split(/\r?\n/).find(r=>r.startsWith('Nifty India Defence,'))!
  for(const text of [csv.replaceAll('15-10-2026','14-10-2026'),csv+'\n'+line,csv.replace('Nifty India Defence,','Nifty India Defence TRI,')])expect(()=>qualifiedBelAppendOriginal(0,text)).toThrow('IDENTITY_DATE')
  const action=JSON.parse(original(1).toString());action.push({symbol:'BEL',isin:pins.isin,exDate:'15-Oct-2026',subject:'Split'});expect(()=>qualifiedBelAppendOriginal(1,JSON.stringify(action))).toThrow('REQUIRES_REVIEW')
 })
 it('rejects an unauthorized or incomplete request before reading or writing data',async()=>{
  const db={from:vi.fn()} as unknown as Parameters<typeof appendBelCompletedSession>[0]
  for(const change of [{authorizationHash:'foreign'},{through:'2026-10-16'},{captureId:null},{readUrls:[]}])await expect(appendBelCompletedSession(db,{...body,...change})).rejects.toThrow('EXACT_COMPLETED_SCOPE')
  expect(db.from).not.toHaveBeenCalled()
 })
 it('never emits history proofs from a missing price capture, mismatched parent hash or wrong owner',async()=>{
  const parent={target_id:pins.securityId,proof:{sourceAuthority:'ANGEL_ONE',returnBasis:'PRICE_RETURN_RAW_CLOSE',corporateActionState:'COMPLETE',exchangeCalendarState:'VERIFIED',unresolvedCorporateActionCount:0,lineageSourceRecordIds:['one'],corporateActionSourceRecordIds:['two'],exchangeCalendarSourceRecordIds:['three'],freshnessThrough:'2026-10-14T23:59:59+05:30'},validation:{distinct_sessions:282}}
  for(const mode of ['owner','parent','capture']){
   const insert=vi.fn(),fetcher=vi.fn(),parentHash=await hashG02(parent)
   const db={from:(table:string)=>{let id='';const query={select:()=>query,eq:(key:string,v:string)=>{if(key==='id')id=v;return query},order:()=>Promise.resolve({error:null,data:[]}),single:async()=>table==='portfolios'?{error:null,data:{user_id:mode==='owner'?'foreign':policy.ownerId}}:id===pins.calendarDecisionId?{error:null,data:{id,raw_payload:{session_date:pins.through,decision:'OPEN'}}}:id===pins.stockParent?{error:null,data:{raw_payload:parent,payload_hash:mode==='parent'?'0'.repeat(64):parentHash}}:{error:{code:'MISSING'},data:null},insert};return query}} as unknown as Parameters<typeof appendBelCompletedSession>[0]
   vi.stubGlobal('fetch',fetcher)
   try{await expect(appendBelCompletedSession(db,body)).rejects.toThrow(mode==='owner'?'OWNER_OR_OPEN':mode==='parent'?'PARENT_HASH':'ACTUAL_CAPTURE');expect(insert).not.toHaveBeenCalled();expect(fetcher).not.toHaveBeenCalled()}finally{vi.unstubAllGlobals()}
  }
 })
})
