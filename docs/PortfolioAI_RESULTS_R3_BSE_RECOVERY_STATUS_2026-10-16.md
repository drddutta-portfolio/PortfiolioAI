# PortfolioAI Results R3 — BSE Recovery Progress & Acceptance Handoff
**Checked:** 2026-10-16. **Branch:** `PortfolioAI-Development` only. **Not R3 PASS.**

## Independent database readback
- Portfolio: `6193a4aa-3235-4057-bddc-209fcf443fc2`; Development Supabase: `lrgpjimipfkyoqbpsqzz`; Development R2: `portfolioai-history-dev`.
- **262 equities × eight quarterly periods = 2,096 theoretical slots. 1,727 qualified three-metric slots (82.4%).**
- 136 stocks have all eight quarters; 116 partial; 10 without a single three-metric quarter.
- Counts by period: Sep-2024 **160/262**, Dec-2024 **163/262**, Mar-2025 **220/262**, Jun-2025 **229/262**, Sep-2025 **237/262**, Dec-2025 **239/262**, Mar-2026 **237/262**, Jun-2026 **242/262**.
- **369 theoretical gaps remain:** 201 in Sep/Dec-2024 and 168 in Mar-2025 through Jun-2026. Do not claim each gap is an actual public original filing: IPO/prelisting, historical identity and corporate-action cases need individual proof.

## Real original BSE source admissions
- Source library `vendor/bseindiaapi` (3.3.3, pinned upstream), common adapter `scripts/portfolio_bse.py`. Use backend only.
- Sept/Dec 2024 **HDFCBANK**: bank consolidated net interest income, net profit, diluted EPS. Original SHA-locked BSE issuer financial statements, 6 observations/decisions. [R4 run](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38798205418).
- Sept/Dec 2024 **ASTRAL**: original consolidated operating revenue, profit after tax and diluted EPS. Original source hash and publisher identity checked; Dec filing begins with original independent auditor report, so accepted only if frozen SHA, exact quarter, official BSE scrip and issuer identity pass. 6 observations/decisions. [R4 run](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38801487616).
- Sept/Dec 2024 **ASHOKA**: original consolidated revenue, after-tax profit and diluted EPS from original BSE PDFs published 2024-11-12 / 2025-02-10. Full source hash, exact issuer CIN, BSE ISIN `INE442H01029`, crore conversions and share basis verified. 6 observations/decisions **rebound onto corrected V2 source**. [Correction readback](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38803516813).

## Important source correction, verified
The initial 2024 Ashoka parser accepted an Indian comma-grouping error. Its original `2,48,893.10` lakhs of Sept revenue was mistakenly interpreted as `48,893.10` lakhs, and Dec `2,38,788.80` lakhs as `38,788.80` lakhs. Both incorrect versions were detected during post-run checks and **superseded; do not consume or reselect them**.

The immutable earlier source records and observations were retained for audit. Corrected `parser_revision=INDIAN_GROUPING_V2` stored in separately versioned R2 original-source manifests and new source observations, with explicit R4 source and numeric first-quarter matching:
- **Sept 2024 Ashoka:** consolidated revenue **₹2,488.931 Cr**, profit **₹462.469 Cr**, diluted EPS **₹16.28**.
- **Dec 2024 Ashoka:** consolidated revenue **₹2,387.888 Cr**, profit **₹661.4923 Cr**, diluted EPS **₹23.32**.
- The six selected decision IDs were rebound atomically only after independent original source-manifest and per-fact R4 validation. Correction script: `scripts/results/r3-bse-ashoka-2024-rebind.py`. Strong grouped-number regression: `scripts/results/test_r3_ashoka_indian_numbers.py`. The current selected six decisions all point to the V2 observations, independently read back from Supabase.
- R4 now **rejects** the obsolete V1 Ashoka rows (`BSE_ASHOKA_2024_ISSUER_OR_QUARTER_NOT_PROVEN`). Six such exceptions in R4 verification logs represent quarantined **old** rows, not acceptance of bad financial data.
- No changes to V1-4 research scores, main, or deployed Results UI.

## Existing original filing discovery scope
The 2024 BSE index `scripts/results/r3-bse-2024-gap-source-index.py` checked **105 unresolved 2024 stock identities** and found **567 BSE filing candidates**. This is metadata only, not 567 financial results. [Read-only index run](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38798738361). Results R3 production data counts increase only on individual R4 selected, independently audited quarterly core trios.

## Next recovery sequence
1. Reuse the existing BSE original file index and existing Supabase/R2 selected data; do not repeat source discovery unnecessarily.
2. Prioritize 201 missing Sep/Dec 2024 slots and identify issuer-original single-quarter consolidated table candidates. Parse Indian comma groupings, handle lakh/million/crore units explicitly, require exact scope+period+first-quarter column, issuer and ISIN, published date, original source URL and SHA, and historical split basis. Avoid newspaper combination articles, scanned/rotated unparseable tables, unproven older ISINs and revision conflicts.
3. Extend bounded source-specific or demonstrably reliable industry-specific BSE adapters with regression fixtures. Apply one quarter only if its issuer original has a complete three-metric single-source set and R4 selects it.
4. Investigate 168 newer-quarter theoretical gaps, especially ten equities with zero selected quarters. Distinguish financial institution disclosures needing different ratios from newly listed companies and true unavailable periods. Do not label a whole company `READY` from source count alone.
5. Independently verify all eight periods, the per-stock source evidence, and all genuinely prelisting/unavailable exceptions for 262 holdings including closed positions. R3 PASS only after full readback; release-wide R1-R4 frontend test failures elsewhere remain a separate acceptance blocker.
6. Keep hourly conditional R3 completion watch enabled, but never claim a data item was collected without saved observations and independently qualified selection.

**This document records actual persisted progress and known shortcomings, not a declaration of completion.**
