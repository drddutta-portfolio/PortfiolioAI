# PortfolioAI Results R5-C — 223-stock evaluation and UI closeout
**Date:** 15 October 2026 (IST)  
**Release scope:** Development `PortfolioAI-Development` only; 231 original-filing Results equities, four selected periods Sep 2025 / Dec 2025 / Mar 2026 / Jun 2026; 223 companies with all four financial-result slots.

## Delivery summary
- The existing 231-company and 924-slot R5-A inventory remains intact: **223 four-quarter complete, eight incomplete (nine slots)**, source evidence selected only under canonical R4 gates.
- Introduced `R5_INDUSTRY_AND_COMPANY_TREND_20261015_V3`: **82 exact-industry peer-grading candidates**, **123 independent company-trend candidates**, and **18 genuinely Not Rated**, from independent read-only Development SQL applied to the 223 four-quarter-complete cohort.
- **Every one of the 223 is evaluated** into Strong, Mixed, Weak or Not Rated; **205/223 (91.9%) have potentially gradeable current-quarter source evidence**. The remaining 18 cannot defensibly receive a Strong/Mixed/Weak grade without a source/classification issue being resolved. Do not advertise "223/223 graded".
- The two grade bases are NOT interchangeable: `INDUSTRY_PEER` uses qualified p25/p75 relative peer percentiles from >=4 issuers and >=12 comparisons within an exact reviewed industry; `COMPANY_TREND` is explicitly **not peer ranked**, requires two independent coherent consecutive comparisons including the current one, and grades the signs of the issuer's own topline and PAT direction. This permits directional loss-to-profit recovery WITHOUT misreporting percentage growth on a negative baseline.
- Bank model: NET_INTEREST_INCOME_QUARTER + NET_PROFIT_QUARTER. Other operating companies: OPERATING_REVENUE_QUARTER + NET_PROFIT_QUARTER. Canonical exact industry is still required, and financial operating platforms are whitelisted explicitly (fee-based fintech/depository/broking, not NBFC/insurance underwriting). Energy Power Generation is company-trend eligible, never oil/gas peer ranked. No unreviewed sector crosswalking or fabricated peer calibration.
- All metrics must be selected and source/quarter/scope/currency/unit compatible. Ineligible/unsupported inputs always remain Not Rated. Industry grading is operational only, not an investment score, V1-4 requirement, buy/sell signal, or historical PIT inference.

## Six blockers to classification for otherwise reviewed industries
BHARTIARTL, E2E, FEDERALBNK, IRMENERGY, KOTAKBANK, UTLSOLAR. These lack enough qualified adjacent original-source comparisons or an admitted business contract under the V3 policy. A company with four individually selected quarterly results does not necessarily have comparable periods.

## Twelve securities without current reviewed industry/sector
ADANIPORTS, ASTERDM, CARBORUNIV, CDSL, COFORGE, DRREDDY, ENGINERSIN, HINDPETRO, IRB, JWL, LODHA, TECHM.

Those 18 are neither assigned arbitrary percentile ranks nor silently removed. They remain visible with a specific Not Rated reason.

## Development UI changes
Existing owner-approved R2 grid layout, two-axis matrix, quarterly hover details, real current/closed positions and four analysis cards are preserved. New additions are:
1. A compact June-2026 R5 cohort census for **four-quarter-complete stocks** with Strong/Mixed/Weak/Not Rated and **peer-ranked versus own-trend** counts. The wider 262-stock portfolio membership and original 231-company scope remain unchanged.
2. Quarter pills now display a readable grade alongside revenue/NII and use accessible, evidence-specific explanations (including which grading basis was used).
3. Detailed evidence-based insight identifies `Industry peer percentile`, `Company trend — not peer-ranked`, or `Not rated`. Missing source history is never presented as Weak.
4. Filter by grade continues to work with the four-quarter release window. September 2026 is NOT automatically promoted.
5. A 223-stock synthetic UI regression validates coverage census accounting and virtualization independently from the actual Supabase SQL cohort readback; it does not fabricate real portfolio test data.

## Verification and deployment boundary
- Focused Development GitHub Actions `Results R5-A and R5-C Focused Verification` checks architecture, TypeScript, isolated algorithm regressions, approved R2/R5 UI tests, lint, build and Git diff. Confirm its green conclusion at final source commit before calling *engineering* PASS.
- The independent **SQL-derived grading totals are candidates**, not a browser-rendered/reconciled live authenticated count. R5-G still requires authenticated browser census and pixel-by-pixel reference comparison, separate from source or code verification.
- **Vercel Preview deployment is BLOCKED by the free-team 100-deployments-per-day API quota**. A preview build request for Development returned HTTP 402 `api-deployments-free-per-day`. Do not claim these UI changes were deployed to Vercel or visually confirmed in a live session while the quota blocker remains.
- No Supabase table/score migrations, Trendlyne/NSE refetches, main-branch, Production, or V1-4 research score edits are made.

**Status:** R5-C code and UI implementation ready for focused engineering acceptance; **the R5-C live preview UI and authenticated acceptance cannot be marked PASS while Vercel is rejecting deployments**. All 223 eligible stock identities have explicit evaluation outcomes, but 18 are Not Rated for sound evidence reasons.
