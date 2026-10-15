# PortfolioAI R5 — A and B Final Acceptance
**Date:** 15 October 2026, Asia/Kolkata  
**Branch:** PortfolioAI-Development only  
**Owner-approved release window:** quarter ends 2025-09-30, 2025-12-31, 2026-03-31 and 2026-06-30.

## R5-A — PASS, COMPLETED
A fresh read-only independent Development Supabase readback confirms:
- 231 current-and-closed issuer-filing equities in the selected Results cohort; 924 quarter slots required.
- 915 source-coherent selected financial quarter slots, **223 of 231 securities with all four**, and **eight equities / nine explicit unavailable slot exceptions**.
- 2,797 selected fundamental financial observations linked to original issuer exchange sources, **zero decision identity/scope conflicts**.
- The exceptions remain Not Available, not silently admitted or substituted; no source metadata was changed.

R5-A is **COMPLETED and accepted** within the owner-approved nine-exception release policy, without requiring earlier historical 2024 evidence.

## R5-B — PASS, COMPLETED
The existing production R5-B calculation engine at `src/features/results/quarterlyR5.ts` was audited and **unchanged**; no defects requiring runtime modifications were identified. New acceptance tests at `src/features/results/quarterlyR5.test.ts` verify:
- Four distinct official date-ended reporting quarters and exact date-only preceding-quarter boundaries, including March/June, never arbitrary calendar substitutions.
- Decimal.js exact numerator, denominator and HALF_UP two-place rounding for qualified QoQ and YoY.
- YoY only when the independently selected prior-year quarter exists; unavailable baselines produce explicit null / reason rather than fabricated growth, consistent with the four-quarter release scope.
- Unique selected original issuer filing, source identity, reporting period, same scope and units/currency, no foreign-stock crossover, no duplicate canonical selection.
- No zero-or-negative percentage baseline inference; permitted negative *current* PAT versus positive previous PAT is correctly reported as a decline.
- EPS split share-basis prohibition, and bank NII/PAT versus operating Revenue/PAT explanation rules.
- No V1-4 score, investment recommendation, historical PIT valuation or Thesis Impact was inserted.

Dedicated isolated Development workflow **Results R5-B Comparison Acceptance** at [run 38699157519](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/38699157519): **PASS** (architecture isolation, TypeScript, all R5-B calculation tests, ESLint, production-build compilation, Git diff integrity). Runtime calculation module and Results UI were NOT changed.

R5-B is **COMPLETED and accepted** for safely calculable comparisons on the owner-approved cohort. A complete YoY series for every security is explicitly NOT promised or required without validated prior-year source selection.

## Protected scope / next gate
- No Results UI, CSS, R5-C/D/E/F/G logic, Supabase schema/data, Cloudflare R2 records or V1-4 research score changes were made for this A/B closeout.
- No production deployment or main branch changes. This is a Development-only code/test acceptance.
- R5-C, D, E, F and G retain their previous individual statuses; **this report does not automatically mark them PASSED**.
