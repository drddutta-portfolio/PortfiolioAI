# PortfolioAI Results R5 — parallel R4 continuation and incremental source qualification (17 October 2026)

**Environment:** `PortfolioAI-Development` only; Supabase Dev `lrgpjimipfkyoqbpsqzz`. **Current gate:** R5 PARTIAL; R5-G NOT accepted. The R4 sources continue independently.

## Existing R5 implementation preserved

The project already has `quarterlyR5.ts` (exact source-selected decimal QoQ/YoY and explanations), `quarterlyR5Classification.ts` (reviewed exact-industry calibrated or explicitly labelled company-trend Strong/Mixed/Weak; unsupported models remain Not Rated), and the approved Results reference UI with positions, clickable quarters, tooltips, selected-source financial charts, evidence and insights. Previous accepted R5 A–E contracts remain unchanged. Do not treat unqualified quarters or provider review captures as investment evidence. R5 grading does not modify V1-4 scoring.

## R5-F integration committed

- `src/features/results/resultsR5LiveRefresh.ts`: versioned-bound projection refresh mechanism checks every **10 minutes while the Results tab is visible** and on foreground return (bounded to at most one check per minute). No BSE, NSE or Trendlyne provider call is initiated; this reads only existing Supabase source observations and decisions.
- `ResultsReferenceLivePage.tsx`: reloads current source evidence after those checks. Its existing `useMemo` derived comparisons and industry calibrations recompute only when material observation properties / source selection flags change, preserving the previous object on an unchanged result. No visual layout rework.
- Results detail defaults to the company's latest **stored** quarter even when selection is review-pending; a new rolling quarter must not hide genuinely available previous observations in the default analysis.
- `resultsR5LiveRefresh.test.ts` guards visibility, refresh throttling, newly selected/corrected financial facts, original scope/identity integrity, and unchanged-source deduplication.
- `scripts/results/r5-f-live-coverage.py` imports the authoritative R4 eight-quarter readback to produce an independent immutable-in-artifact, **read-only** R5 source-eligibility census of the complete 262-equity cohort. No duplicate source authority or DB migration is introduced.
- `test_r5_f_live_coverage.py` enforces source/period cardinality and YoY acceptance limitations.
- `.github/workflows/results-r5-f-live-acceptance.yml` validates architecture, TypeScript, 27 focused comparisons/grading/refresh tests, Python audit tests, ESLint, live Development R4 readback, build, and publishes the derived evidence artifact.

## Independent live Development coverage proof

[Results R5-F Live Evidence Recalculation Acceptance run 38997183935](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38997183935) **PASS** (source/architecture checks, 27 Vitest, Python tests, lint, source-selected readback, production client compilation).

The artifact's actual October 17 Development readback (not cached provider figures):

| Measure | Selected source-qualified | Unqualified |
| --- | ---: | ---: |
| Historical four quarters (Sep 2024–Jun 2025) | 966 / 1048 | 82 |
| Current four quarters (Sep 2025–Jun 2026) | 1030 / 1048 | 18 |
| Full eight-quarter universe | **1996 / 2096** | **100** |

- **249 / 262** companies have all four current quarters source-qualified. That number is an evidence census, not a grade or a live authenticated browser acceptance.
- **953** potential prior-year comparison pairs have both quarters' source qualification; **737** are same-scope and not explicitly flagged for split adjustment. These are **potential YoY pairs, not fully publication-/share-basis-approved YoY results**.
- Full eight-quarter status counts: **1996 QUALIFIED, 89 MISSING, 10 CONFLICT, 1 REVIEW_REQUIRED**.
- R4 continues separately; its recovered historical facts are automatically eligible for R5 only on selection. Frontend tests are bounded; source evidence must never be silently promoted.

## Remaining R5-G acceptance gates

1. Re-run the comprehensive Results/architecture CI on final Development HEAD; fix current rolling-period test mismatches without suppressing real failures. The special R5-F workflow has independently passed, but it is not a substitute for the whole repository's test suite.
2. Produce exact **live 262-equity** Strong/Mixed/Weak/Not Rated counts from the existing R5 grade engine and reviewed classification; preserve issuer/industry samples and explicitly label company-trend vs peer rankings.
3. Independently verify UI and loaded data at 100% zoom against the owner's screenshot with authenticated Development preview access. CI rendering/test compilation is not pixel-level proof.
4. Confirm automatic evidence refresh in a real authenticated browser session while R4 selects more source facts, including successful update without running a new provider scan.
5. Complete all applicable source/quarter acceptance and outstanding historical exceptions as appropriate; R4 incompleteness must not invent grades.

**Do not claim overall R5 PASS, production deployment, complete company grades or investment actions solely on these source coverage figures.**
