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

## Actual canonical result

- Immutable-source qualification: **38682164484 SUCCESS**, two original byte/hash/issuer checks, 24 source cells, zero original reacquisitions or R2 writes.
- Stable three-period cash admission/re-admission: **38683167649 SUCCESS**, all three IDs reused idempotently after the first handler admission.
- Append-only IST session-clock correction: **38707912148 SUCCESS**, retained BEL capture `6d7c7e10-9c95-4a79-ae80-e1322a1c07ba`, no grant issuance for provider acquisition, no new history/candle requests. Successor proofs: BEL `34aff802-b0e5-5d6c-aedc-f3783f8645f1`, Capital Goods `e2c01a02-ff80-5af4-a713-d271e2979b5b`, Defence `f3137627-f0bd-5a3d-adfa-d23234d2371d`. Each explicitly links its old proof and preserves original values. The corrected 14 October day-end is `2026-10-14T23:59:59+05:30`; this is earlier than the old UTC-labelled instant, not an extended grace.
- Guarded prospective validation and BEL-only save: **38708158722 SUCCESS**. Current-session status qualification is separate public-source acquisition, not a paid provider call or a canonical-READY write. The canonical validator itself remains provider-free.
- Snapshot `be479b64-95c7-4ad1-8349-724d9d7bc729`; selection `c53c753c-3af3-41dd-b001-d20e51257adf`; run `462ef06f-c5ff-44b7-8bb7-569271017590`; grant `65093659-ad99-414b-a9e4-ba964096d1da`. Evaluation `2026-10-15T08:47:24.965256Z` (**14:17 IST**). One snapshot and one selection appended. Duplicate grant issuance idempotent; grant replay rejected.
- Independent seven-stock readback: BEL **4 → 3 mandatory blockers**, cash conversion FRESH, all six previously cleared substantive requirements still FRESH at evaluation; other six selected snapshots unchanged. BEL remains REVIEW_REQUIRED; no READY frozen value is claimed.
- Original UTC-clock proof hashes remain preserved. No provider usage event for BEL since `2026-10-15T04:24:00Z`; no metric-registry mutation, migration, Production/main or scheduler change. Total BEL reviews now 12.

### Remaining work under the already approved contract

1. **OPERATING_MARGIN_HISTORY:** qualify eight dated, same-scope profit/revenue pairs and use the existing deterministic margin owner. Existing retained evidence has only four admitted standalone revenue quarters and no admitted operating-profit-quarter observations. Additional official PDFs provide raw cells but do not yet establish eight margin observations or the precise profit basis. Raw operating profit, EBITDA percent and undated OPM remain unqualified.
2. **NET_DEBT_AND_INTEREST_COVERAGE:** qualify three annual borrowings/leases, unrestricted cash, compatible EBIT/EBITDA and finance-cost records. The current annual report prints borrowings as dashes and pledges cash as security; neither proves numerical zero borrowings or unrestricted cash. Debt-service coverage and generic provider ratios are not replacements.
3. **VALUATION:** qualify three distinct dated PE/EV-EBITDA/FCF-yield observations, publication availability, equity/share basis and compatible enterprise-value components. The newly cleared cash series can supply its reviewed cash leg; current generic PE and three metrics on one date still cannot supply this history. No BANK 60-month standard is introduced.

These are source/component qualification boundaries, not an outstanding owner decision or a reason to repeat the completed cash admission. Source publication remains UNKNOWN where it is not proven; historical point-in-time availability is not inferred.

## Final executable verification

Implementation **5b1f1e51** passed both hosted workflows: **G02 Full Repository Verification 38707916368 SUCCESS** and **PortfolioAI Architecture Guard 38707920958 SUCCESS**. **2,381 application tests and 441 Edge tests passed.** This covers installation, architecture guards, TypeScript, application/Edge lint, application and Edge tests, Deno financial-admission checks, production build, Python extraction checks and whitespace. Targeted preserved-live tests additionally passed **22** cash/ROCE/order/document cases; all three preserved-live Edge bundles passed Deno checks after restoring unchanged type-only closure files omitted by function readback packaging.

Active Development readback: canonical materializer **v73** (`66b2b58195d384eba86c870692908310969fb892a1f66dcc6bfd18ed55108b2b`), reviewer **v15** (`482c30432df01fb7e558f3661dae0302a4a361cf4304db97c730deafa996f895`), scoped grant **v8** (`69001d7a4dcfa9c82bf9f42c84e7df93a5457a085ff885c09727a9ba459ff1ff`). JWT/custom-auth settings are unchanged. Only the reviewed source/validation/clock helpers and protected actions changed; unrelated live BANK code was retained.

The final documentation/ledger handoff follows that verified implementation; no additional executable change is represented as independently tested merely because documentation was committed.
