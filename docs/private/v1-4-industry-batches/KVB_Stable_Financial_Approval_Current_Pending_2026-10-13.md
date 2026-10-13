# KVB: stable financial approval and separate current-market qualification

The retained, executed source package has 52 qualified historical P/B candidates and 46 historical P/E candidates. Its original qualification occurred on 13 October 2026 at approximately 06:06 UTC, while the last completed price session was 12 October. That original source qualification is not a claim that 12 October prices remain current after the 13 October close.

## Owner approval scope

The financial-source fingerprint binds the historical observations, approved models, latest reviewed EPS/BVPS financial inputs, original source identities and corporate-action/share basis. CURRENT market price, date and capture are excluded. A new financial period, financial-source identity, amount, share basis or approved model changes the fingerprint and requires a new genuine owner review.

A genuine owner can approve the qualified financial sources even when today's prices are stale. Historical observations may then be admitted, but no CURRENT observation is written and the metric definitions remain inactive until both current valuations pass their real source and coverage checks. The interface reports CURRENT_PENDING and disables readiness materialization.

A later authorized current-price calculation can reuse the exact matching genuine financial audit. It invokes the existing Decimal P/B and P/E kernels against actual latest canonical prices, captures and a FRESH current-session history proof. Its actor is separately recorded as an authenticated approved calculation or SOURCE_EXECUTOR_WITH_PRIOR_OWNER_FINANCIAL_AUDIT. It does not impersonate the owner or create another financial review.

## Clock and normalization boundary

The already-qualified package remains reviewable after market close. Owner LOAD must not demand that its earlier illustrative CURRENT price still be FRESH. The SOURCE executor can verify the stored package and its 36 actual R2 archive receipts without a lease, writes, provider calls or a current-freshness claim.

The deployed market refresh writers persist prices/captures but do not themselves append V1_4_HISTORY_CONTRACT_VALIDATION records. Therefore a new 13 October capture alone cannot qualify an old proof covering 12 October. If no independently qualified current-session proof exists after the scheduled acquisition, current valuation admission remains pending. It needs an append-only source-bound proof renewal using the actual settled capture, calendar and corporate-action continuation. No timestamp extension, backdated evaluation or weakening of freshness is permitted.

## Implemented execution paths

- VERIFY_STORED_KVB_SOURCE_BATCH: signed, read-only verification of the immutable 52/46 package and 36 original archive receipts; no current-freshness claim.
- LOAD_KVB_PB_PE_OWNER_BATCH: displays exact financial sources regardless of current-market pending status.
- APPROVE_KVB_PB_PE_OWNER_BATCH: one genuine financial-source approval; historical admission can finish while current admission remains pending.
- REFRESH_KVB_APPROVED_CURRENT_VALUATIONS: reuses an existing matching genuine financial audit; current admission requires a real FRESH canonical proof and unchanged financial facts.

KVB NIM_TTM remains an independent direct-source requirement. Financial approval, historical admission or current calculation does not by itself establish KVB READY or Banking V1-4 completion. No Production or main changes are included.
