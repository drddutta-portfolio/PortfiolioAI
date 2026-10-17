# R5 insurance operating-trend contract — 17 October 2026

**Environment:** PortfolioAI-Development only. **Status:** Implementation committed; live census and R5-G acceptance not yet confirmed at this document revision. Do not infer the entire R5 is complete.

## Evidence and scope

The existing R5 engine includes quarterly source-selected metrics for the 262-equity portfolio, and the Results page already uses NET_PREMIUM_EARNED_QUARTER for STARHEALTH. The R5 comparator previously omitted that metric from its permitted quarterly metrics and unit dictionary. Independently inspected Development selections show STARHEALTH's March and June 2025 core trios include net earned premium, profit and EPS in STANDALONE scope, while MFSL's earlier consolidated quarterly results contain reported operating revenue, profit and EPS. The existing generic financial-services grading denied both insurers irrespective of coherent originals.

## Narrow correction

- Admit NET_PREMIUM_EARNED_QUARTER comparisons under the original-company filing, INR_CRORE, unique selected observation and same-scope eligibility checks used for other metrics.
- **General Insurance** selects NET_PREMIUM_EARNED_QUARTER + NET_PROFIT_QUARTER. Reported revenue alone cannot substitute for net earned premium.
- **Life Insurance** may report issuer-only OPERATING_REVENUE_QUARTER + NET_PROFIT_QUARTER movements from qualified originals, where such lines are actually present.
- Both insurance groups are excluded from industry percentile calibration; require **at least two independently source-coherent, sequential company comparisons including the graded quarter**, respecting the historical grade-date cutoff. Do not infer investment quality or insurance prudential strength.
- Keep insurer claims ratio, combined ratio, solvency, APE/VNB and underwriting assessment **unrated**; these measures are not established by revenue/premium + profit trends. No credit-quality, insurer-strength or Add/Buy/Hold/Watch/Exit recommendation.
- All R4 selected evidence remains canonical and immutable. No new provider calls or database/R2 writes; 262-equity cohort and old quarter calendar unchanged.

## Verification and release constraints

Added regression cases for company-trend insurance eligibility, rejected general-insurer revenue-only sources, incoherent original filings and life-insurance limits. GitHub Actions grading and repository CI must pass at the *latest* Development HEAD before counting new live grades. The grading census must be re-read from derived Actions artifacts and separately reconcile 41 historical source/comparison cases versus unsupported-methodology cases.

**Other outstanding gates:** Historic issuer source gaps, unsupported or missing canonical classifications, live full-cohort census, authenticated reference-UI test, actual automatic refresh demonstration and Development preview availability. These are not declared complete by this change.
