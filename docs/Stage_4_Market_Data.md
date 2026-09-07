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

## Deployment gate (not yet executed)

After review and explicit approval:

1. Apply `20260907120000_create_market_data_foundation.sql` and regenerate `supabase/types/database.types.ts` from the applied schema.
2. Configure Edge Function secrets (never `VITE_` variables):
   - `ANGEL_ONE_API_KEY`
   - `ANGEL_ONE_CLIENT_CODE`
   - `ANGEL_ONE_PIN`
   - `ANGEL_ONE_TOTP_SECRET`
   - `ANGEL_ONE_CLIENT_LOCAL_IP`
   - `ANGEL_ONE_CLIENT_PUBLIC_IP`
   - `ANGEL_ONE_MAC_ADDRESS`
3. Deploy `refresh-market-data` with normal Supabase JWT verification enabled.
4. Invoke `SYNC_MAPPINGS`, review all `AMBIGUOUS`, `UNRESOLVED`, and unsupported securities, and manually verify exceptions with recorded evidence rather than guessing.
5. Invoke `REFRESH`, verify counts and sampled quotes, then set `VITE_MARKET_DATA_ENABLED=true` in the deployed frontend configuration.

No migration, function deployment, secret write, mapping sync, or provider login is performed by the Stage 4 local preparation itself.

## Credential and session safety

Provider response bodies are never propagated to clients, logs, or refresh audit rows. The client receives allowlisted messages and stable internal codes; `error_summary` stores only those codes. Defensive redaction covers configured secrets, credential fields, bearer tokens, and JWT-shaped strings. The function has no credential-bearing logging.

TOTP is generated only inside the Edge Function from `ANGEL_ONE_TOTP_SECRET`. JWTs stay in module memory and expire at the earliest of their `exp` claim, the 20-minute cache TTL, or the next Asia/Kolkata midnight. A recognized session-expiry response clears the cache and permits exactly one reauthentication attempt.

## Recovery

The unapplied migration is additive and PostgreSQL DDL is transactional. If it is later applied successfully, rollback must be a new compensating migration rather than editing this file. Export any mapping, price, review, and refresh provenance first, then remove Stage 4 objects in reverse dependency order. Existing Stage 1–3 ledger objects are not modified by this migration.

## Historical foundation

`market_price_history` stores provider-independent daily OHLCV observations with exact numerics, interval, period, retrieval time, and provenance. Stage 4 deliberately does not calculate momentum, technical indicators, relative strength, volatility, drawdown, or portfolio risk.
