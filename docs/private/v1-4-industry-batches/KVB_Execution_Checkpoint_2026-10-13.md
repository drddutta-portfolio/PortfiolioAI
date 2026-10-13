# KVB execution checkpoint — 13 October 2026

Implementation head: `4de68f5613efbe0cc94b18338966ae1f5a4d523c` on PR #124.

## Executed

Stable financial approval is separate from current market-price freshness. The genuine owner can admit 52 historical P/B and 46 historical P/E observations while current prices are pending. Only unchanged approved financial facts may be reused for signed current-price recomputation; new financial periods require genuine review. Signed executors cannot add missing historical admissions or impersonate the owner.

Development `v14-kvb-pb-admission` version 4 is ACTIVE, bundle SHA-256 `a4c9066ccaa04162bcac655efa83d5f6141014ba0386db8cdc990255bf3fd2dc`.

Signed credentialed workflow run `38444105531`, second attempt, succeeded on the exact implementation head. All 36 archive receipts were checked. Result `KVB_STORED_SOURCE_BATCH_VERIFIED_NO_NEW_ADMISSIONS`; zero provider calls, zero admissions, no freshness claim. Artifact ID `11837537566`.

Vercel deployment `dpl_DWBw4wc82sbNEjNTGHLkvRXUR2Sg` is READY for the same implementation head. The approved branch alias points to it. The valuation review route returns HTTP 200; genuine owner interaction has not been executed by this executor.

559 local Edge tests, 15 focused application tests, TypeScript, targeted lint and Deno checks passed. Numeric Admission Guard and Architecture Guard passed on the exact head. Full Banking Verification run 38444111162 also passed on that exact implementation head.

## Independently observed maintenance failure

The October 13 18:55/19:00 IST cron jobs executed, but ingestion `65cd163c-9f95-446c-a9c1-91a9f7649f20` failed `ROLLING_LIMIT` before provider attempts. A cron submission success is not an acquisition success.

Angel One controls are daily 14, rolling 14 over one day, per-run 14. October 12's paid usage occurred 13:30:05.013–13:30:27.257 UTC; October 13 reservation failed 13:30:03.468 UTC. The previous 14 calls were still inside the rolling window. No limit was relaxed and no automatic retry was performed.

KVB canonical prices still end October 12, close 342.30. A current financial-source approval cannot repair missing fresh prices or a missing source-bound history proof. No October 13 FRESH assertion is supported.

## Remaining boundaries

1. Genuine owner source approval through `/app/settings/diagnostics/kvb-valuations`, preserving prior ROA approval. No credential sharing.
2. Restore governed daily acquisition without breaking the rolling cap or zero-retry policy, then renew history proof from actual capture, settlement, calendar and corporate-action coverage. Existing fixed renewal is bounded through October 12 and cannot be stamped forward.
3. Direct NIM_TTM is still unproven. The retained 4.26% is an adjusted June-quarter margin, not TTM. A financial-methodology amendment requires a separately concrete, versioned owner decision; no amendment was activated.
4. Admit current valuations only when valid, then canonical validation/materialization and independent selected-snapshot readback.

A tested bounded pre-reservation wait is added for the next authorized scheduled invocation; it waits at most 60 seconds before the first atomic reservation, rereads usage, and never retries a rejected reservation. It is not a live recovery of the failed October 13 run. Daily drift beyond 60 seconds still fails closed and requires a separately reviewed operating-policy resolution.

KVB is NOT READY. Last confirmed selected baseline has NIM_TTM, PE_TTM_RELATIVE and PB_RELATIVE outstanding. New source verification or a successful build does not reduce that count.
