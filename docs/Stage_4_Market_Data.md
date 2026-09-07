# PortfolioAI Stage 4 — Market Data and Valuation

## Architecture

The browser never connects to Angel One. It reads cached observations and requests refreshes through the authenticated `refresh-market-data` Supabase Edge Function. The function verifies portfolio ownership, reads only open transaction-derived holdings, authenticates to SmartAPI with Supabase secrets, requests quotes in provider-supported batches, and writes observations with the service role.

The application calculation layer depends on `MarketPriceProvider`, not Angel One. Provider tokens, exchanges, and trading symbols live in `market_data_instrument_mappings`; they never replace `securities.id`, ISIN, exchange, or canonical symbol.

## Deterministic mapping

`SYNC_MAPPINGS` downloads Angel One's official daily instrument master. Automatic verification is allowed only when exactly one cash-market instrument has exact equality between:

- PortfolioAI `securities.exchange` and Angel One `exch_seg`; and
- PortfolioAI `securities.symbol` and Angel One `name`.

The provider's `symbol` and `token` are then stored as provider identity. Zero candidates are `UNRESOLVED`; multiple candidates are `AMBIGUOUS`. Neither state is quoted. Equities and ETFs are eligible; other asset classes are reported as unsupported and are not forced through the equity mapping rule. Mapping evidence retains the master retrieval time and candidate identities.

An automatic sync never changes or downgrades an existing `VERIFIED` identity. Any token, exchange, trading-symbol, or resolution-status difference is written to `market_data_mapping_reviews` as `PENDING`; the verified mapping remains unchanged until separately reviewed. Composite foreign keys require every latest/history row's `mapping_id`, `security_id`, and `provider_code` to identify the same mapping.

## Price and valuation policy

- Current quotes use SmartAPI `FULL` mode, at most 50 tokens per request.
- Cache TTL is 5 minutes server-side. A refresh fetches only absent/expired mappings. Browser `force` input is ignored and cannot bypass cache, leases, or cooldowns.
- Database-backed provider-wide leases serialize each operation across all portfolios using the same Angel One account. Price refresh has a 60-second server cooldown; mapping synchronization has a one-hour cooldown. Leases expire after five minutes so an interrupted function cannot block permanently.
- The UI marks cached observations stale after 15 minutes based on `retrieved_at`. `price_timestamp` and `retrieved_at` remain distinct; missing provider timestamps stay null rather than borrowing retrieval time.
- Angel One does not provide an authoritative session-state field in the quote contract used here, so session status remains `UNKNOWN`; PortfolioAI does not infer exchange holidays or live state.
- Exact decimal strings cross the provider boundary. Decimal.js performs market value, unrealised P&L, P&L percentage, totals, and weights.
- Portfolio current value, total unrealised P&L, and weights remain unavailable unless every open holding is priced. Individual positions may still show supported values.
- Existing Stage 3 cost-basis limitations remain: sell/non-purchase histories do not receive an invented lot basis.

## Deployment status

Stage 4 is remotely applied, deployed and operational:

- `20260907120000_create_market_data_foundation.sql`,
  `20260907123000_fix_market_data_lease_retry_after.sql` and
  `20260907130000_verify_motherson_angel_mapping.sql` are applied.
- `refresh-market-data` is deployed with normal Supabase JWT verification, and the
  Angel One integration operates only server-side with credentials held in
  Supabase secrets.
- All 248 open holdings have `VERIFIED` mappings and latest-price cache coverage.
- MOTHERSON is verified as `ANGEL_ONE / NSE / MOTHERSON-EQ / 4204` from separately
  reviewed identity evidence.
- The Dashboard and Holdings Stage 4 frontend activation is complete and verified.
- Price evidence exposes provider provenance, provider timestamp, retrieval
  timestamp and fresh/stale status without exposing provider credentials.

## Credential and session safety

Provider response bodies are never propagated to clients, logs, or refresh audit rows. The client receives allowlisted messages and stable internal codes; `error_summary` stores only those codes. Defensive redaction covers configured secrets, credential fields, bearer tokens, and JWT-shaped strings. The function has no credential-bearing logging.

TOTP is generated only inside the Edge Function from `ANGEL_ONE_TOTP_SECRET`. JWTs stay in module memory and expire at the earliest of their `exp` claim, the 20-minute cache TTL, or the next Asia/Kolkata midnight. A recognized session-expiry response clears the cache and permits exactly one reauthentication attempt.

## Recovery

The applied migrations are additive and must never be edited. Any rollback requires
a new compensating migration. Export mapping, price, review and refresh provenance
first, then remove Stage 4 objects in reverse dependency order. Existing Stage 1–3
ledger objects were not modified by the Stage 4 foundation.

## Historical foundation

`market_price_history` stores provider-independent daily OHLCV observations with exact numerics, interval, period, retrieval time, and provenance. Stage 4 deliberately does not calculate momentum, technical indicators, relative strength, volatility, drawdown, or portfolio risk.

Historical OHLCV population remains future work. Cached prices may become stale
between refreshes. Separately, 28 partial-sale holdings still lack deterministic
remaining cost basis pending FIFO/lot accounting, and trusted sector classifications
are not yet populated; neither limitation indicates missing current-price coverage.
