# PortfolioAI Results R4 — Owner-directed resumption with R3 deferred

**Date:** 16 October 2026
**Environment:** `PortfolioAI-Development` / Dev Supabase `lrgpjimipfkyoqbpsqzz` / Dev Cloudflare R2 `portfolioai-history-dev`
**Status:** R4 IMPLEMENTATION AND LIVE SOURCE-VALIDATION JOB STARTED; full R4 source/eligibility PASS not claimed.

## Controlling owner decision

The owner explicitly instructed: "**Leave R3 as of now, proceed to R4.**" Freeze R3 acquisition and remediation: do **not** require the last 13 companies / 18 current-quarter slots to be resolved before continuing source verification, status classification, comparison availability and reproducible R4 audits. Do not describe R3 as PASS or erase its exception list. The 26 Trendlyne MCP captures are stored as **review-only evidence**, not authority for canonical original-source selection.

The owner-approved eight-quarter scope in `PortfolioAI_RESULTS_262_EQUITY_EIGHT_QUARTER_PLAN_AMENDMENT_2026-10-15.md` remains controlling: 262 transaction-linked open and closed equities, 4 displayed quarters (2025 Sep/Dec, 2026 Mar/Jun), 4 prior-year baselines (2024 Sep/Dec, 2025 Mar/Jun). Do not add columns to the Results UI. Historical changes require same original-filing, metric, scope, identity, declared units and admissible source manifest.

## Independently measured Development baseline (16 October)

| Period end | Window | 262-company slots with qualified, same-filing, same-scope selected core financial facts | Not qualified |
|---|---|---:|---:|
| 2024-09-30 | Historical YoY | 160 | 102 |
| 2024-12-31 | Historical YoY | 163 | 99 |
| 2025-03-31 | Historical YoY | 220 | 42 |
| 2025-06-30 | Historical YoY | 229 | 33 |
| 2025-09-30 | Displayed | 255 | 7 |
| 2025-12-31 | Displayed | 258 | 4 |
| 2026-03-31 | Displayed | 256 | 6 |
| 2026-06-30 | Displayed | 261 | 1 |
| **Total** | 8 periods | **1,802 / 2,096** | **294** |

**249/262** current-display equities have all four qualified quarterly trios. The count is **not** 262 complete. An earlier simple metric count was independently cross-checked against the stronger same-source same-scope qualification and agrees with the period counts listed here.

Potential available YoY baseline pair count (both original source-selected metric trios, BEFORE full currency/share-basis/publication comparability): Sep-2025 **159**, Dec-2025 **162**, Mar-2026 **215**, Jun-2026 **229**. With explicit pre-split EPS guards removed, the corresponding **candidate** pairs are 156, 159, 210, 224. **These are not approved comparison values or publishable YoY percentages.**

294 unresolved slots require status categories, not forced zeros, substitutions or invented histories. Particularly, missing prelisting/demerger quarters must not be auto-declared NOT_APPLICABLE without verified issuer chronology.

## R4 work started

- Added `scripts/results/r4-eight-quarter-readback.py`, an independent read-only 262×8 reconciliation that demands matching issuer-original selections, reporting period, currency, original numeric units, one source and one scope, with separate bank-NII and insurer-net-premium contracts. Statuses `QUALIFIED`, `PARTIAL_SELECTED`, `CONFLICT`, `REVIEW_REQUIRED` and `MISSING` are evidence-derived. Unknown non-applicability remains unknown.
- Added `scripts/results/test_r4_eight_quarter_readback.py` covering 8-quarter matrix, source/scope/unit mixing, insurer metrics, conflicting reported values, unavailable pre-listing and split EPS guards.
- Added explicit Development-only `RESULTS_R4_EIGHT_QUARTER_SELECTION=1` option to existing immutable R2 original-source verifier `scripts/results/r4-verify-quarterly.py`, without changing the original four-quarter mode or older isolated comparison modes.
- Added `.github/workflows/results-r4-eight-quarter-qualification.yml`, with Development-only DB/R2 guards, deterministic R4 tests, original R2 source-verification, protected `fundamental_observation_decisions` selection, read-only 262×8 acceptance classification and retained artifact. Original issuer source collection is **not** part of this job and no R3 acquisition is resumed.
- Initiated live GitHub Actions run **[38869795361](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38869795361)**; early run steps passed isolation, installation and both R4 deterministic regression suites. Final immutable-R2 readback/exception artifact must be independently verified before asserting live execution PASS.

## Boundaries and acceptance

- Historical issuer source alone is insufficient for point-in-time trading decisions: original filing publication precision, amended versions, old/new ISIN, accounting scope and EPS share basis require separate proof.
- R4 may deliver verified partial history and company/quarter-specific reasons while R3 remains deferred. Full R4 **is not PASS** until all eight-quarter slots are either qualified or are justified as unavailable / inapplicable by issuer-specific documented evidence and the protected selection gate has no regressions.
- R5/A-I insight classifications and V1-4 investment-readiness scores are separate; no silent score modifications.
- No UI redesign, extra result columns, Production/main writes, or artificial completion counts.

This record freezes the actual latest measured state and stage transition. Subsequent jobs must append their observed run IDs, invalid manifest reasons, selection conflicts, new decisions and post-run database source readback before closing R4.
