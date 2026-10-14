# G02 — Existing Angel private market-cache contract

The frozen Stage 8.6E foundation names Angel One as the market-price authority and `market_price_history` as the canonical raw daily OHLCV store. Its approved refresh requires authenticated owner authority, a verified Angel mapping, an open equity holding and a provider lease. The current G02 owner directive additionally authorizes execution without repeated approvals.

G02 uses this existing market-cache contract. It requires active Angel access, verified account entitlement and the catalog's EOD-price capability. The catalog's `retention_rights_verified=false` remains unchanged; G02 does not represent it as verified. The Stage 7 Trendlyne licensed-content activation gate is not applied as a newly invented prerequisite to the already approved Angel private OHLCV cache.

Only the SDK-normalized daily timestamps, OHLCV and retrieval timestamps are retained. No full HTTP response, credentials, tokens, account details, documents, new redistribution permission or R2 provider archive is admitted by this operation. The immutable source capture audits the same private OHLCV fields used by the canonical cache.

The G02 execution remains Development-only, three-stock scoped, one-time P4-granted, session-leased, globally budget-reserved and independently accounted. Maximum three history requests; zero provider retries. Existing candles and provenance are never overwritten. Captured data remains unqualified until the separate canonical history/source contracts pass. Banking and Production endpoints are unchanged.

Authority: [Stage 8.6E](../../Stage_8_6E_Angel_One_Momentum_and_Risk_Foundation.md); [source registration and owner directive](../../../supabase/functions/_shared/v14-g02-owner-authorization.json).
