# PortfolioAI Results R5 — Historical Rolling Grade Extension (17 October 2026)

**Branch:** `PortfolioAI-Development` only. **Status:** Source-graded historical extension verified; overall R5-G browser/design acceptance remains pending.

## Approved request and implementation

Extended Strong/Mixed/Weak/Not Rated grading from the original three quarters (Dec 2025 / Mar 2026 / Jun 2026) to all displayed historical Results columns beginning **Mar 2025**, plus newly available future rolling quarters from Sep 2026. Uses existing reviewed source-selected fundamental observations; **zero additional Trendlyne, BSE or NSE provider requests are required** for this analysis.

Implemented in:
- `src/features/results/quarterlyR5Classification.ts`: version `R5_ROLLING_HISTORICAL_20261017_V4`, canonical quarter arithmetic, rolling window of at most three adjacent-quarter comparisons ending at or before the graded quarter, independent historical exact-industry calibration per grade quarter, unranked company-only fallback requiring at least two coherent comparisons including the selected quarter.
- `src/features/results/ResultsReferenceLivePage.tsx`: one memoized `buildRollingIndustryR5Calibrations` for all visible quarter ends, used by grid, preview, metric details and evidence panels.
- `quarterlyR5Classification.test.ts`: historical 2025 grades, pre-2025 boundaries, missing/unselected/incompatible original-source quarters, and **no future-quarter threshold leakage**.
- `resultsR5HistoricalCensus.test.ts`: a live, read-only 262-stock/7-quarter census with the actual application engine.
- `.github/workflows/results-r5-g-live-census.yml`: runs the existing June 2026 acceptance together with new historical audit and stores only derived grade summaries.

The policy remains exactly-industry-calibrated where at least four independent issuers and 12 qualified prior/current quarter pairs exist; otherwise it uses the issuer's own supported coherent trend only when at least two comparisons exist. For March 2025, comparisons can use December and September 2024 issuer observations already stored. For June 2026, the original December 2025 / March 2026 / June 2026 calibration window is preserved, yielding unchanged existing grades.

No future quarter financial values or empirical peer thresholds feed an older result. Retrospective financial grading does NOT establish original publication timing, historical investability, valuation quality or ADD/BUY/HOLD/WATCH/EXIT recommendations. No source selections were modified or promoted.

## Actual GitHub Action acceptance

**PASS:** [Results R5-G Live 262-Equity Grade Census run 39000263495](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/39000263495). All 28 tests passed, including isolated historical calibration, previous baseline, identity mismatches, zero provider calls, architecture, TypeScript, lint, build and Development live selected-source readback.

The live seven-quarter audit found these figures at execution time (they may move as independent R4 recovery runs continue):

| Quarter (ending) | Source-qualified core results | Strong | Mixed | Weak | All rated |
| --- | ---: | ---: | ---: | ---: | ---: |
| Mar 2025 | 242 | 47 | 126 | 16 | **189** |
| Jun 2025 | 252 | 32 | 125 | 36 | **193** |
| Sep 2025 | 255 | 60 | 114 | 18 | **192** |
| Dec 2025 | 258 | 58 | 108 | 28 | 194 |
| Mar 2026 | 256 | 73 | 106 | 18 | 197 |
| Jun 2026 | 261 | 40 | 139 | 26 | 205 |
| Sep 2026 | 0 | 0 | 0 | 0 | 0 |
| **Total** | **1,524** | **310** | **718** | **142** | **1,170** |

**574 historical stock-quarter cells are newly rated** in March, June and September 2025 (189 + 193 + 192). The previous static "637" referred to qualified data and supported business-model slots, **not 637 guaranteed grades**. Some still fail two valid adjacent quarter comparisons or other source/coherence requirements. Overall current 262-company June 2026 grading remains 40 Strong / 139 Mixed / 26 Weak / 57 Not Rated, with four-current-quarter-complete census unchanged at 249.

The Sep 2026 rolling quarter will grade automatically once sufficient historical/quarter original financial evidence is actually selected; the strict core trio qualification currently finds zero September 2026 records. This is distinct from mere publication/listing of results.

## Follow-up gates

1. Verify the updated Development Vercel Preview build points at a commit containing the extension, and authenticate to the Results page. Ensure older cells now show Strong/Mixed/Weak for qualified and coherent older quarters; note virtualized rows/scroll.
2. Compare with owner reference design at 100% zoom, tooltips, horizontal slider, position/current/closed filters and analysis panels.
3. Confirm R4 additions produce recalculated historical classifications via existing R5-F refresh without provider calls.
4. R5-G final full-repository acceptance at a fixed Development commit, with R4 recovering independently.
5. Do not imply R5 results are investment recommendations or backtested point-in-time decisions.

**No Production/main changes.**
