# PortfolioAI Results R5 — Historical Exceptions Remediation (17 October 2026)

**Environment:** Development only; **status:** R5 partial, with historical grading significantly advanced; R4 original-source acquisition and source-selection changes remain independently governed.

## Real engineering changes (completed)

- Built an exact **company-quarter-level read-only R5 engine diagnostic ledger**, using source-selected original issuer financial observations already stored in Development Supabase. The 60 currently actionable historical cases are included in the `historical-grade-census.json` artifact. No external-provider calls or DB writes were performed in this diagnostic.
- Updated `src/features/results/quarterlyR5Classification.ts` to `R5_ROLLING_HISTORICAL_20261017_V5`: if calibrated industry-peer percentage comparisons cannot be made, the model may **only** substitute its already approved same-original, same-scope issuer-only *company trend* assessment, requiring at least two independently source-coherent comparisons including the selected quarter. It must never label such a result an industry percentile. Missing or incompatible source histories still fail closed.
- Six additionally rated historical company-quarter slots: ONESOURCE March 2025 (Mixed) and September 2025 (Strong); SOLARA June 2025 (Mixed); WOCKPHARMA June 2025 (Weak) and September 2025 (Mixed); PPLPHARMA September 2025 (Weak). Ten more later-window company-quarter grades also became valid.
- New script `scripts/results/r5-historical-scope-audit.py` independently reads original-source observations and produces candidate alternative same-scope original filings, without promoting any source.
- The seven-quarter R5 source-grade acceptance pipeline now retains `historical-grade-census.json` and `alternate-scope-reconciliation.json` as derived-only GitHub Actions artifacts, never raw financial source input.

## Independently verified live evidence

[GitHub Actions PASS 39008405878](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/39008405878): 30 focused tests PASS, architecture, TypeScript, ESLint, Vite build, actual Development R5 engine and read-only DB reconciliation PASS.

- **580** historically rated issuer-quarter slots across March, June and September 2025 (previously 574).
- **60** further source-qualified/model-supported slots remain Not Rated in those three quarters (baseline 63 was only snapshot subtraction; current independently enumerated 60).
- 110 *other* source-qualified historical slots have unsupported or missing industry methodology; they are not part of this 60-company-quarter queue.
- Detailed initial R5 reason counts: 32 missing earlier source/selection history, 23 insufficient industry-peer or own-history comparisons, 5 incompatible peer percentage/evidence checks.
- More informative independent source-file diagnoses: **24 direct adjacent-accounting-scope mismatches; 21 immediately missing prior-quarter selections; 15 needing the second comparison or other evidence review.** These are all included in the same 60 cases.
- **23/24** immediate accounting-scope mismatches have potential complete same-original, same-scope three-field trios in both quarters already stored; **one exception is ICEMAKE September 2025**.
- None of the **21** checked directly missing preceding-quarter sources has a complete eligible original already stored in Development. Acquisition is necessary where applicable; first verify issuer existed and the comparison period is legitimately reportable.
- These alternative-scope originals are **potential R4 admission candidates only**. The R4 verifier protects previously selected source identities. Do NOT automatically select unselected originals or rewrite consolidated selections without proving original R2-byte hashes, issuer identity, publication/period, scope, numeric consistency and nonconflicting accounting lineage.

## R4 evidence-remediation handoff

1. First validate the 23 stored sibling-scope alternatives through the existing original-filing verification and canonical source admission process. A new, separately accepted source-selection contract may be needed because the current selector prefers exactly one scope per quarter and the R5 comparison requires consistent scope across adjacent quarters.
2. Inspect the 15 second-comparison/other cases for absent older source quarters, scope continuity across the prior two comparisons, negative baselines and unavailable exact-industry calibrations. Never manufacture comparable percentages.
3. Investigate the 21 missing immediate baselines, prioritizing true originally reported quarters, using existing R2 source inventory first and BSE/NSE issuer originals only for gaps. Rule out pre-IPO, newly demerged and unlisted financial quarters before spending calls.
4. Maintain R5-F's Supabase readback refresh; rerun the exact live historical exceptions and source scope diagnostic after each verified R4 recovery batch. Do not rely on the stale initial "63" as the active denominator.
5. Keep main/production, the Results reference design, V1-4 investment score and immutable R2 source evidence untouched.

## Acceptance

**R5 historical grading is functioning and its 580 accepted historical grades are backed by the real engine.** Overall R5-G remains partial pending resolution of legitimately recoverable exceptions, full repository-wide verification, authenticated browser UI comparison and live refresh proof. No automatic admission of unselected observations has occurred.

**Links:** [current Development Results preview](https://portfiolio-7x5fleh8d-dibyendu-dutta.vercel.app/app/results), [R5 diagnostic action and artifacts](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/39008405878).
