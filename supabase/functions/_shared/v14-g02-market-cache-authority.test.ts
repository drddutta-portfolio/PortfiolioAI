import {describe,it,expect} from 'vitest'
import {g02MarketCacheAuthorityQualified} from './v14-g02-market-cache-authority'
describe('existing Angel owner-private EOD cache authority',()=>{
 it('honours the approved market cache without claiming licensed-content retention',()=>{const source={is_active:true,entitlement_verified:true,retention_rights_verified:false,capabilities:{identity:true,eod_prices:true}};expect(g02MarketCacheAuthorityQualified(source)).toBe(true);expect(source.retention_rights_verified).toBe(false)})
 it('refuses unverified access, disabled sources and unsupported price capability',()=>{expect(g02MarketCacheAuthorityQualified({is_active:true,entitlement_verified:false,capabilities:{eod_prices:true}})).toBe(false);expect(g02MarketCacheAuthorityQualified({is_active:false,entitlement_verified:true,capabilities:{eod_prices:true}})).toBe(false);expect(g02MarketCacheAuthorityQualified({is_active:true,entitlement_verified:true,capabilities:{fundamentals:true}})).toBe(false)})
})
