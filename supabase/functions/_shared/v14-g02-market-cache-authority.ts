/** Stage 8.6E authorizes the owner-private normalized daily OHLCV cache.
 * The Stage 7 licensed-content retention flag is not evidence of this separate
 * market-cache contract. Never change that flag or retain full API responses. */
export function g02MarketCacheAuthorityQualified(source:{is_active:unknown;entitlement_verified:unknown;capabilities:unknown}){
 const capabilities=source.capabilities&&typeof source.capabilities==='object'?source.capabilities as Record<string,unknown>:null
 return source.is_active===true&&source.entitlement_verified===true&&capabilities?.eod_prices===true
}
