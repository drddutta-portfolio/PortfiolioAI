import {describe,it,expect,vi,afterEach} from 'vitest'
import type {SupabaseClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import {collectKvbCurrentSessionStatus,kvbIntradayOpenCarryNeeded} from './v14-kvb-session-status-collector.ts'
import fixture from './v14-kvb-history-renewal-fixture.json' with {type:'json'}
const timing={sourceRecordId:'verified-timing',verifiedOriginalSha256:'9b138c51ef3e05cef9fdc05746614f7919d8c8018e0fede788b228672b044067',market:'CAPITAL_MARKET' as const,normalOpen:'09:15' as const,normalClose:'15:30' as const,sourceVerified:true as const}
const calendar=fixture.preOpenCalendarRecords
function db(){const query={select:()=>query,eq:()=>query,in:()=>query,lte:()=>query,order:()=>query,limit:async()=>({data:calendar,error:null})};return {from:()=>query} as unknown as SupabaseClient}
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals()})
describe('authenticated-source endpoint session collector boundary',()=>{
 it('makes zero requests beforeopen and afterclose; ordinary cachedhistory remains authoritative',async()=>{const fetch=vi.fn();vi.stubGlobal('fetch',fetch);vi.useFakeTimers();for(const at of ['2026-10-13T02:00:00Z','2026-10-13T10:01:00Z']){vi.setSystemTime(new Date(at));expect(await collectKvbCurrentSessionStatus(db(),timing)).toBeNull()}expect(fetch).not.toHaveBeenCalled();expect(kvbIntradayOpenCarryNeeded(calendar,'2026-10-13T05:17:20Z')).toBe(true);expect(kvbIntradayOpenCarryNeeded(calendar,'2026-10-17T05:17:20Z')).toBe(false)})
 it('reports an actual failed OPEN response once without retry or fake evidence',async()=>{vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-13T05:17:20Z'));const fetch=vi.fn().mockResolvedValue(new Response('blocked',{status:403}));vi.stubGlobal('fetch',fetch);await expect(collectKvbCurrentSessionStatus(db(),timing)).rejects.toThrow('NSE_CURRENT_SESSION_HTTP_403');expect(fetch).toHaveBeenCalledTimes(1);expect(fetch.mock.calls[0]?.[0]).toBe('https://www.nseindia.com/api/marketStatus')})
})
