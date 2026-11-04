# R4 issuer-restated current-display policy — 4 November 2026

## Owner decision and scope

The owner authorized engineering judgment: “Proceed as you think it is correct and make the app work properly.” This resolves the previously pending reporting-basis question. Policy identifier: `ISSUER_RESTATED_CURRENT_DISPLAY_20261104_V1`.

For current display, accept explicitly dated quarterly figures published by the exact issuer in an official filing, including issuer-restated or recast comparatives and reported split/bonus adjustments. The existing exact issuer, original hash, quarter, consolidation scope, unit and complete revenue/PAT/diluted-EPS evidence requirements remain mandatory. Financial amounts come from the filing; PortfolioAI does not infer adjustments, reconstruct quarters from annual/YTD totals, copy predecessor segment results or invent missing data. Original observations and protected selections remain immutable. Conflicting versions still require source-specific correction evidence; this is not a latest-filing-wins rule.

Proforma and carveout documents remain review-only under this adapter. Prelisting or demerger status alone does not prove that a quarter is inapplicable. Missing or unproven histories remain explicit.

## Provenance and compatibility

New manifests opt into the versioned policy; legacy manifests independently replay with their original conservative rules. A restated comparative is labeled `ISSUER_RESTATED_COMPARATIVE`, never as its original-period filing. Full-document audit, exact source bytes and parsed values are independently replayed before canonical selection.

An admitted filing containing restatement, retrospective share-basis or operating-revenue reclassification warnings carries `comparison_basis_unproven`. Canonical decision notes include `ISSUER_RESTATED_BASIS_COMPARABILITY_UNPROVEN`. This metadata propagates through the shared Results source repository, the R5 census input and the independent eight-quarter readback.

Reported values remain available. Percentage growth, industry-peer grading and company-only directional fallback all reject a pair involving this guard. A later, separately verified comparison contract can establish a common basis; display qualification alone never does so. No historical point-in-time or V1-4 authority is inferred.

## Rollout

Deploy and verify the Development app's comparison guards first. Until then, the collector retains legacy behavior. Enable `RESULTS_R4_RESTATED_DISPLAY_READY=1` in the Development official-issuer workflow only after the matching Vercel preview is READY. The active policy enters the replay-cache fingerprint, so legacy negative proofs cannot suppress policy-enabled retries.

Changes use existing data source records, fundamental observations, protected selection decisions and shared Results access/comparison modules. No schema, migration, RLS, holdings, transactions, Production/main, visual layout, component or CSS changes.

## Validation and completion

Local validation: 88 Python regressions; 34 focused TypeScript tests; strict targeted TypeScript and ESLint checks; Python compilation; whitespace checks. Full repository CI, Development deployment and live independent source qualification are required after rollout.

R4 is not declared complete by this policy change. The last confirmed inventory has 56 historical R4 gaps and 18 separately deferred R3 gaps. Collection success is not financial completeness; only an independent full-cohort readback may establish the resulting coverage.
