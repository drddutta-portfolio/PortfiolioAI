# R4 issuer-restated current-display policy — 4 November 2026

## Owner decision and scope

The owner authorized engineering judgment: “Proceed as you think it is correct and make the app work properly.” This resolves the previously pending reporting-basis question. Policy identifier: `ISSUER_RESTATED_CURRENT_DISPLAY_20261104_V1`.

For current display, accept explicitly dated quarterly figures published by the exact issuer in an official filing, including issuer-restated or recast comparatives and reported split/bonus adjustments. The existing exact issuer, original hash, quarter, consolidation scope, unit and complete revenue/PAT/diluted-EPS evidence requirements remain mandatory. Financial amounts come from the filing; PortfolioAI does not infer adjustments, reconstruct quarters from annual/YTD totals, copy predecessor segment results or invent missing data. Original observations and protected selections remain immutable. Conflicting versions still require source-specific correction evidence; this is not a latest-filing-wins rule.

Proforma and carveout figures remain review-only. The closed Lenskart filing format may supply only statutory Annexure I results when both native text and independent full-original OCR identify the same Annexure II divider, the cover identifies both annexures, and the statutory section contains the exact legal issuer and independent auditor without proforma/carveout text. All other mixed formats remain rejected. Prelisting or demerger status alone does not prove that a quarter is inapplicable. Missing or unproven histories remain explicit.

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

## Verified issuer discovery and section boundaries

The collector recognizes Groww's quarterly-results and announcements pages, Lenskart's assets.lenskart.com, Pine Labs' plcorp-cdn.pinelabs.com and Vedanta Aluminium's exact d1rbiogke1jwo5.cloudfront.net distribution linked by its own investor page. Exact official filing seeds are recorded in the issuer registry. These are closed host additions; every redirect still requires issuer-specific approval.

Issuer-reported demerger/common-control comparatives also retain the comparison-basis guard under the authorized policy. No predecessor segment is copied. Statutory section page boundaries enter the independently replayed manifest; proforma pages cannot supply accepted figures. Local validation now passes 91 Python regressions, including rejection of an uncorroborated annexure divider and of a proforma page within the same retained original.

## Adjacent statutory table continuation

Under the authorized policy, Tata Capital native statements may supply an explicit revenue/PAT page followed immediately by an explicit diluted-EPS page. Both pages must independently establish the exact legal issuer, financial reporting scope, printed quarter column sequence, selected column and units. Each numeric row retains its actual original page and coordinates. Missing headers, other issuers, different quarters/scopes and nonadjacent pages remain rejected. No missing financial number is reconstructed. Legacy replay does not enable this path. The complete retained original and both page proofs are replayed by the same independent qualifier. Local validation passes 93 Python regressions, including negative cross-period, cross-scope and cross-issuer continuation cases.

## Independently rendered continuation — 5 November 2026 (IST)

The same closed Tata Capital adjacent-page contract now supports scanned statements: two approved independent render resolutions must each recover the complete financial trio across independently matching page headers. Both renders must also prove PBT minus tax equals PAT. Any differing financial cell, quarter sequence, issuer, scope or unit is rejected. Native/full-audit text locates candidate adjacent pages and supplies no rendered financial values. The source collector tries both approved render pairs within its existing per-original timeout. Canonical qualification reopens the retained original and repeats the same extraction; legacy manifests retain their previous replay behavior.

All 94 focused Python regressions pass. The new regression proves exact EPS agreement and rejection when independent profit/tax reconciliation is absent. No UI or database schema change.
