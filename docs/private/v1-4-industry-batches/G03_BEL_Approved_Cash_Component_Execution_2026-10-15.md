# BEL approved cash-component execution — 15 October 2026

The owner approved the consolidated financial contract on 15 October. Its exact approved bytes are bound by `v14-g03-financial-authorization.json`. This continuation implements cash conversion first, within the existing reviewed-evidence adapter and protected admission function. It does not replace or relax the remaining operating-margin, debt/coverage or valuation contracts.

Two retained original annual reports provide 24 pinned source cells: annual CFO, cash capex, PAT, investing cash flow and classification components. Actual locally retained page extraction verifies all labelled paired-year cells. Protected execution re-reads the immutable originals from Development R2 and verifies their complete byte counts, hashes, identity and page tables; original files are not reacquired or rewritten.

The FY2025 bridge is exact: original CFO 48,041 lakh minus rental income 263 and mutual-fund gain 2,053 equals the FY2026 comparative CFO 45,725. CFO plus investing cash flow remains 122,882 lakh. FY2024's 464,801 lakh CFO is normalized by the approved analogous P&L-component exclusions of 219 and 1,939 lakh, to 462,643 lakh. This is explicitly a PortfolioAI classification normalization, not an issuer restatement or an assertion of individual rental cash-receipt timing. The unmodified source cells remain preserved. FY2024 standalone PAT is **402,000 lakh**, verified in the original P&L, rather than an assumed or rounded figure.

| Year | CFO ₹ crore, comparable basis | PAT ₹ crore | Cash capex ₹ crore | Derived FCF ₹ crore | Derived CFO/PAT |
|---|---:|---:|---:|---:|---:|
| FY2024 | 4,626.43 | 4,020.00 | 647.14 | 3,979.29 | 1.150853 |
| FY2025 | 457.25 | 5,288.25 | 1,004.07 | -546.82 | 0.086465 |
| FY2026 | 1,494.34 | 6,048.48 | 983.12 | 511.22 | 0.247060 |

`decimal.js` already belongs to the application dependency set. The Edge path pins that same existing library at 10.6.0; no new library is introduced. Calculations use a local Decimal constructor with 40 significant digits. Source integer-lakh amounts convert exactly to two-decimal crore amounts; the ratio rounds half-up at six decimals. No FCF or CFO/PAT calculation occurs in Python or UI admission code; Python only verifies literal source bindings and the integer cash-neutral reconciliation.

Scope: BEL-only delegated reviews with `reviewed_by = NULL`, exact approved owner/portfolio, immutable period/source IDs, protected GitHub workflow identity, no owner impersonation, no direct SQL ACCEPT writes, no migration and zero provider calls. The global CFO metric registry and previous ROCE authority are unchanged. Both live function bundles are retrieved and patched surgically, preserving later BANK runtime changes absent from this branch.

Before live execution, new guards and full repository verification must pass. Review admission alone is not canonical FRESH: prospective validation, the existing BEL-only one-use grant/save and independent selected-snapshot readback remain mandatory. At preparation time BEL still has four blockers and is not READY. Actual execution evidence will be appended below.

## Executed admission and intraday preservation correction

The first signed admission call persisted all three stable delegated review/source identities. Its workflow subsequently failed because the response lacked the existing helper's `providerApiCalls` field; this was corrected without deleting/recreating accepted reviews. Repeated admission run **38683167649 SUCCESS** confirms idempotent reuse. Read-only canonical **38683196065 SUCCESS** proves CFO_FCF_CONVERSION FRESH.

That prospective run also found both market requirements STALE after the prior-close grace expired. The guarded save was stopped; no stale result was promoted as current and no grace interval was lengthened. The existing deployed ordinary-session NSE status/calendar/timing authority is reused by a narrowly scoped signed-workflow transport hook. It requests at most one public NSE market-status response, verifies its original bytes and prior settled-close timestamp, appends qualified provenance and immediately runs canonical validation. It never fetches a new candle or infers that today's unfinished candle is final. A valid cached status is reused without another request. This hook changes no Banking validator, financial methodology, cron schedule or paid-provider budget.
