import {describe,it,expect,vi} from 'vitest'
import {readFileSync} from 'node:fs'
import {G03_MARKET_RENEWAL_PINS as pins,verifyBelMarketOriginal,readBelMarketOriginal,belCompletedSessionFreshness} from './v14-g03-market-renewal'
import {renewBelMarketHistory} from './v14-g03-market-renewal-runtime'
const fixture=(name:string)=>new Uint8Array(readFileSync('scripts/v1-4/fixtures/g03-market-tail/'+name))
describe('BEL official market tail qualification',()=>{
 it('keeps the completed-session proof on the NSE session date in IST without extending freshness',()=>{const t=belCompletedSessionFreshness('2026-10-14');expect(t).toBe('2026-10-14T23:59:59+05:30');expect(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date(t))).toBe('2026-10-14');expect(Date.parse(t)).toBeLessThan(Date.parse('2026-10-14T23:59:59Z'));expect(()=>belCompletedSessionFreshness('2026-02-30')).toThrow('DATE_INVALID')})
 it('verifies exact original bytes and both exact benchmark identities/cells',async()=>{const p=await verifyBelMarketOriginal(5,fixture('ind_close_all_14102026.csv'));expect(p.hash).toBe(pins.sources[5].hash);expect(p.closes).toEqual({NIFTY_INDIA_DEFENCE:'9294.1',NIFTY_CAPITAL_GOODS:'16556.69'})})
 it('checks BEL symbol and ISIN against the complete pinned action window',async()=>{expect((await verifyBelMarketOriginal(6,fixture('corporate-actions-08-14.json'))).hash).toBe(pins.sources[6].hash)})
 it('rejects altered, truncated and unpinned original bodies',async()=>{const b=fixture('ind_close_all_14102026.csv');b[100]^=1;await expect(verifyBelMarketOriginal(5,b)).rejects.toThrow('HASH_INVALID');await expect(verifyBelMarketOriginal(5,b.slice(1))).rejects.toThrow('LENGTH_INVALID');await expect(verifyBelMarketOriginal(20,b)).rejects.toThrow('LENGTH_INVALID')})
 it('rejects another R2 object, redirect origin or local URL before network access',async()=>{const fetchSpy=vi.spyOn(globalThis,'fetch');for(const url of ['https://evil.example/a','http://localhost/a','https://ced17d24f4b380721e58a08c9e9273e4.r2.cloudflarestorage.com/portfolioai-history-dev/other'])await expect(readBelMarketOriginal(5,url)).rejects.toThrow('R2_SCOPE_INVALID');expect(fetchSpy).not.toHaveBeenCalled();fetchSpy.mockRestore()})
 it('cannot renew arbitrary scope or accept a price-less freshness declaration',async()=>{await expect(renewBelMarketHistory({} as never,{authorizationHash:'wrong',readUrls:[]})).rejects.toThrow('EXACT_G03_BEL_HISTORY_RENEWAL_REQUIRED')})
})
