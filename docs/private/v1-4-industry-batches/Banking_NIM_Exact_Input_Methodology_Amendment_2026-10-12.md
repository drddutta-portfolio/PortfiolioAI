# Exact-input TTM NIM amendment — decision-ready, inactive

This is the single narrowly scoped methodology decision required by section 4 of the owner's smart-research amendment. It does not change BANK V2 weights, the frozen cohort or READY acceptance. The current direct-only NIM contract remains active until explicit approval and verified implementation.

## Evidence and problem

The approved current contract requires a directly certified trailing-four-quarter NIM with an average-interest-earning-assets denominator. The fresh Trendlyne margin search on 12 October returned `nima` (annual NIM), net-profit margins and annual NII, but no certified TTM NIM. Net-profit margin is not NIM. The now-retained 22 KVB presentations provide quarterly NII and reported quarterly/annual NIM; verified exact daily-average earning assets for all four current quarters have not yet been established. The ratio cannot currently be calculated accurately merely by relabelling those disclosed quarterly percentages.

## Recommended amendment

Retain qualified direct TTM NIM as the preferred source. Permit a second, derived path only with four contiguous, same-perimeter calendar quarters of verified **raw, unadjusted net interest income** and source-certified daily-average interest-earning assets for each quarter. Monetary unit, currency, averaging definition, revisions and reporting scope must agree.

For quarter q, let NIIq be its net interest income, AEAq its daily-average interest-earning assets and dq its actual calendar-day count, inclusive of the start and end dates. Let D = sum(dq). Then:

`TTM NIM (%) = 100 × D × sum(NIIq) / sum(AEAq × dq)`

This is trailing-period income divided by daily-weighted average earning assets. D is the actual 365 or 366 days in the reported trailing period; there is no additional fixed-365 annualization. Net interest income means the approved banking interest-income-minus-interest-expense measure. Arbitrary normalizations of recoveries or tax-refund interest are excluded from this proposed raw basis. When an issuer's comparison ratio excludes such items, do not falsely claim reconciliation with that adjusted ratio.

Use exact Decimal arithmetic with at least 40 significant digits internally, no intermediate rounding, and ROUND_HALF_UP once to four percentage-point decimal places for storage. Display may round separately to two places. Preserve raw inputs, period dates, actual day counts and every source reference.

## Required validation

- Verify the latest disclosed reporting quarter and four exact contiguous quarter boundaries, with a total span of 365 or 366 days.
- Require a native or independently source-qualified daily-average earning-assets definition. Period-end assets and average total assets are not substitutes.
- Do not reverse-engineer earning assets from rounded reported NIM, average quarterly NIM percentages, mix scopes, manufacture missing quarters or interpolate missing assets.
- Verify raw NII amounts, unit/scale and the selected perimeter from the underlying filings. Keep adjusted and raw source series distinct.
- Reject missing/non-finite inputs, nonpositive earning assets, incompatible revisions and unresolved original-source conflicts. Preserve adverse source facts even if the positive-NIM recommendation requirement cannot pass.
- Reconcile with an independently reported same-period, same-basis ratio where available. Report any discrepancy and its rounding tolerance explicitly.
- Admit through the existing canonical calculation/review system, with a versioned derived-method lineage. No parallel scoring engine or direct READY assignment.

## Executed reference fixtures

Exact Decimal reference calculations are recorded in the adjacent fixture JSON. Four quarters of NII 100 and AEA 10,000 produce 4.0000%. NII 100/200/300/400, AEA 10,000/20,000/30,000/40,000 and day counts 90/91/92/92 produce 3.9847%. These are hand-verifiable synthetic method fixtures, not admitted financial evidence. Implementation must also test gaps, duplicate quarters, scope mismatch, leap-year boundaries, invalid denominators and source revisions before activation.

## Approval scope and honest limitation

Approve or retain the direct-only contract. Approval of this exact-input fallback does not certify missing earning-assets data, authorize estimated denominators or make a bank READY. If exact assets remain unavailable after bounded research, report that factual limitation once rather than repeatedly asserting that general permission or another download will resolve it.

No runtime formula, metric registration, evidence admission or financial-methodology change has been activated by this proposal.
