> **Historical scope notice (15 Oct 2026):** This 231-stock restriction has been replaced for final Results delivery by the owner's 262-equity, eight-quarter data plan. The dashboard still displays four quarters; four older periods are needed for YoY comparisons. See `PortfolioAI_RESULTS_262_EQUITY_EIGHT_QUARTER_PLAN_AMENDMENT_2026-10-15.md`. The earlier figures below remain preserved as historical acceptance evidence.

# PortfolioAI Results R5 — owner-approved 231-stock scope freeze
**Decision date:** 2026-10-15 (IST)  
**Branch/environment:** `PortfolioAI-Development`, Development Supabase `lrgpjimipfkyoqbpsqzz`, Development Cloudflare R2 `portfolioai-history-dev`  
**Decision:** R5 is to be finished using the existing **231 issuer-filing Results equities** and their **latest four selected quarterly results**, not blocked by acquiring older 2024/March–June 2025 source histories or filling the wider 262-equity universe. No change to `main` or V1-4 research.

## 1. Binding stock/period scope
- The R5 qualification **cohort is the 231 distinct portfolio equity identities** with issuer-filing financial evidence for 2025-09-30, 2025-12-31, 2026-03-31, 2026-06-30. Preserve historical security IDs, current holdings and closed positions; do not construct a synthetic ticker list.
- The four currently supported reporting quarters are **Sep 2025, Dec 2025, Mar 2026, Jun 2026**. Sep 2026 is a completed calendar quarter but must not become a current R5 displayed/graded quarter until issuer results are source-selected and an explicit rolling-period cutover is validated.
- The wider portfolio can still show all 262 current and closed equities for inventory continuity; the 31 outside this source-qualified R5 cohort must **never be counted as R5 graded or R5 four-quarter complete**. Keep R5 coverage denominators clearly labelled 231.
- Baseline Development DB readback on 2026-10-15: **223/231** companies have four source-selected quarter trios; **8 companies are incomplete, with 9 missing quarter slots**. These 8 stay in the R5 cohort and on the Results view; blank or incomplete quarters must show **Not Available / source qualification pending**, not invented data or assumed Poor/Weak scores.
- Missing: BDL (Sep 2025); COROMANDEL (Mar 2026); DATAPATTNS (Mar 2026); MGL (Mar 2026); VAML (Sep and Dec 2025); WELSPUNLIV (Dec 2025); YATRA (Mar 2026); ZAGGLE (Mar 2026). Seven companies have unresolved competing issuer sources, and VAML has pre-demerger/prelisting gaps: no fabricated history.
- Quarter level observed completeness from the same readback: 229 (Sep 2025), 229 (Dec 2025), 226 (Mar 2026), 231 (Jun 2026). All numbers refer to **complete selected core metric trios**, not mere stored observations.

## 2. What is and is not required for R5 acceptance
- **R5-A (re-scoped):** verify the existing four-quarter evidence ledger across 231; preserve gaps as explained exceptions. Do not require 231/231 × 4 to mark the source-readback scope adequate for R5 downstream work; do not mark all 231 financially complete.
- **R5-B:** use only source-selected, unit/period/issuer/scope-coherent metrics. Compute quarter-over-quarter comparisons only where a valid consecutive quarter exists. Mark earlier baselines missing without guessing; *historical YoY coverage is NOT an R5 acceptance blocker*. When an independently selected same-quarter prior-year baseline exists, show a separately labelled YoY number only if the original source rules prove comparability.
- **R5-C:** sector/industry-appropriate Strong/Mixed/Weak/Unavailable. Banks use NII/PAT (not a non-bank revenue formula); industry calibration and sample thresholds must be independently tested. Unclassified, non-comparable or insufficient rows remain Unavailable; no implicit scores.
- **R5-D/E:** retain the owner-approved reference Results grid, four analysis cards, hover, chart and actual portfolio positions, with selected-source metrics and evidence-based insights; do not redesign. Display no unselected or cross-scope data as verified.
- **R5-F:** reuse existing Supabase compact qualified observations, selections and source records; larger retained original evidence stays in Development R2. No redundant provider calls. Versioned derived signals must stay outside V1-4 research scoring.
- **R5-G:** independently read back the 231-cohort selected source coverage and eligible grade counts; verify typecheck, tests, lint, build, architecture guard, source/identity/scope regressions, zero selected-decision conflicts, and actual authenticated 100% zoom screenshot fidelity before claiming R5 PASS.
- Historical 2024 and March/June 2025 capture, complete six-quarter charts, historical point-in-time YoY and expansion to the remaining 31 equities are **deferred enhancements, not prerequisites** for this four-quarter R5 closure. Previously acquired genuine records remain preserved and are not deleted.
- No R5 completion claim is authorized merely by this scope decision. R5 is PASS only after the remaining current-scope engineering and acceptance gates finish with independent evidence.

## 3. Audit/rollback
- Changes may be committed only on `PortfolioAI-Development`; production and V1-4 research scores remain unchanged.
- Keep all 8 named data exceptions explicit. No source hash, identity, currency, accounting scope or original-filing evidence gate may be relaxed to improve coverage counts.
- The R5 scope cutover is fixed at June 2026 until a separate verified future-quarter policy is adopted. An operational daily scanner may discover newer results but must not silently rewrite the accepted R5 baseline.
- This owner decision **supersedes** prior R5 progress notes requiring full 2024 or early 2025 history or full 262-equity data as current R5 acceptance blockers; those earlier notes remain as historical execution records.
