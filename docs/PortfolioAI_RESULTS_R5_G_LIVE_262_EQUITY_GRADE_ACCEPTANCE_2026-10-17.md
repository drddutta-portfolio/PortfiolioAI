# PortfolioAI Results R5-G — live 262-equity grading and NBFC correction
**Evidence date:** 17 October 2026 IST  
**Branch:** `PortfolioAI-Development` only  
**Status:** Grading/readback engineering **verified**; **R5 overall PARTIAL**, final authenticated UI visual acceptance still pending.

## What was executed (not a proposal)

1. Added `scripts/results/r5-g-live-input.py` to read the **actual 262-issuer portfolio cohort** and the same `current_security_enrichment_v1` classifications that the frontend consumes. It exports a transient, private GitHub-runner JSON file with actual canonical source-selected quarterly financial records. No provider calls, no writes, no production access and no raw financial input artifact.
2. Added `src/features/results/resultsR5GLiveCensus.test.ts` to run the **same `buildIndustryR5Calibrations`, `gradeQuarterR5` and `compareQuarterMetric` engine** used by the Results page. The grade result is deterministic, current-display only, and separate from V1-4 investment scoring. Only aggregate grade counts and limitation reasons are retained.
3. Added `.github/workflows/results-r5-g-live-census.yml` for live source readback, architecture, TypeScript, actual-engine grading tests, ESLint, Vite compilation and derived-only artifacts.
4. Found/fixed the **six-NBFC current-four-quarter discrepancy**: the UI incorrectly classified the industry `Non Banking Financial Company (NBFC)` as a bank using `/bank/i`, then demanded NII instead of the qualified Revenue/PAT/EPS trio. Changed bank UI routing to `/\bbanks?\b/i` with NII/NPA-specific fallback for true banks. Changed the independent grade audit to match. Added a regression test using a fully-qualified NBFC fixture. This **does not grade NBFCs with the unsupported bank model**, and does not promote or modify financial evidence.

## Live independent Development readback

[Successful post-fix R5-G job 38998302885](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38998302885) captured 262 equities and 6,047 source-selected eligible financial fact rows, with 239 of 262 equities having both current sector and industry labels.

**Quarter evaluated:** 30 June 2026 (R5's frozen grading window; rolling Q2 FY27 reports appear separately in the UI).

| Actual application-engine grade | All 262 equities | Among 249 four-quarter-complete equities |
| --- | ---: | ---: |
| STRONG | 40 | 40 |
| MIXED | 139 | 138 |
| WEAK | 26 | 26 |
| NOT RATED | 57 | 45 |
| **Total** | **262** | **249** |

| R5 grading method | All cohort | Four-quarter complete |
| --- | ---: | ---: |
| Exact-industry calibrated peers | 88 | 87 |
| Own-company trajectory, explicitly not peer-ranked | 117 | 117 |
| Not gradeable | 57 | 45 |

- Exact-industry calibrated groups: **13**.
- Unsupported or missing industry-grade model: **41** company outcomes; fewer than two coherent company comparisons and no calibrated peer group: **10**; missing/incompatible source-coherent pair despite calibrated peers: **6**.
- Potential metric comparisons from the existing **current-display-only** R5 arithmetic: Revenue/NII QoQ 244, Revenue/NII YoY 241, PAT QoQ 237, PAT YoY 235. Do not promote these to audited publication-bounded / fully corporate-action-comparable point-in-time results.
- Corrected **source-qualified four-current-quarter UI coverage: 249/262** (previous UI reported only 243/262 because six legitimate NBFC revenue series were misrouted to bank NII).
- The previous four-quarter-complete grade census (243 stocks) contained 40 Strong, 138 Mixed, 26 Weak, 39 Not Rated. After the correction, the six NBFCs are counted as four-quarter source-qualified and remain **Not Rated** under unsupported R5 NBFC investment methodology. No fabricated NII or financial score.

## Completed verification

- [R5-G live actual-engine grade audit 38998302885](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38998302885): **SUCCESS**, all focused tests, architecture checks, TypeScript, lint and client build.
- [R5-C/D post-fix grade and UI regression 38998332810](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38998332810): **SUCCESS**, including the bank/NBFC regression.
- [R5-A/C post-fix focused acceptance 38998332778](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38998332778): **SUCCESS**.
- No mutations of Supabase financial observations/decisions, R2 source bytes, R4 recovery, V1-4 scores, or Production/main.

## Remaining R5-G acceptance gates

1. Authenticate to the freshly deployed Development build and reproduce the **249/262** four-qualified-quarter UI census and **40 Strong / 138 Mixed / 26 Weak / 45 Not Rated** among those 249. A previously opened browser tab displayed the pre-fix 243-company value; do not call that a deployed post-fix verification.
2. Compare the live Results page at **100% zoom** against the owner's approved reference screenshot; cover bottom horizontal scroll, hover tooltip overlap, open/closed filters, charts and full analysis panel. CI tests alone are not pixel accuracy.
3. Prove a real selected R4 source change becomes visible without a BSE/Trendlyne rescan, using the R5-F 10-minute/foreground evidence refresh. Separate backend R4 collection continues independently.
4. Run final comprehensive repository-wide acceptance at a fixed Development HEAD. Other concurrent workflows may still be changing the branch; these focused PASSes are not a complete repository-wide gate.
5. Preserve 262-equity membership and all unqualified historical/current exceptions. R5 grade remains **quarterly performance**, not Add/Buy/Hold/Watch/Exit investment action.

**No claim of overall R5-G PASS, Production deploy, investment recommendation readiness or authenticated pixel comparison is made.**
