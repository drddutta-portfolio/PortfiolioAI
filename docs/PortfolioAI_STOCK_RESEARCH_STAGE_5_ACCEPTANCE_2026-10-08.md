# PortfolioAI stock research — Stage 5 acceptance

Date: 8 October 2026

**Decision: Stage 5.1–5.4 page-design acceptance PASS; joint Development release HELD.**

## Scope and changes

Stage 5 validates the two-part Industry-first design: the common shell and the
selected stock/business-model research contract. The design plan now records four
acceptance sub-stages: 5.1 cross-profile integration, 5.2 resilience/safeguards,
5.3 hosted usability and 5.4 acceptance evidence/handoff.

Six new regressions verify that contextual Sector-label changes cannot replace
the selected methodology, and stale, missing, insufficient, conflicting or
review-required observations retain their value/source without becoming scores
or Core/Satellite recommendations. No application runtime changes were needed.

Canonical authorities remain the shared portfolio projection/owner settings,
selected P7 current snapshot lineage and immutable requirement items, the scoring
route supplied through `useStockResearchContext`, and the approved Pharma primary
contracts. No new authority, query, financial formula, classification/methodology
assignment, provider execution, migration, database write or Auth/RLS change is
introduced. No migrations were created or applied.

## Verification

- Expanded stock-page regression: **199 tests / 13 files PASS**, covering context reload/ownership, selected lineage, route/scoring safeguards, page composition, all 47 registered profile presentations, all five Pharma primary labels, retained values and canonical normalization.
- Pharma assignment, composed subprofile contracts and UI contract: **25 tests / 3 files PASS**, including effective-date/review and unsupported-profile behavior.
- Production TypeScript/build and architecture boundary guard: **PASS**. Existing bundle-size warnings remain; this stage does not assert a performance-budget pass.
- Full application lint: **PASS**.
- Hosted resilience/first-glance/keyboard disclosure run: **32 checks PASS**, with zero runtime errors, provider refresh attempts and research writes. Loading, empty, HTTP failure and cross-snapshot rejection were simulated in browser response interception only; no stored evidence changed.
- The attempted full repository suite was interrupted after stalling and emitting one Dashboard test failure. Both Dashboard tests passed in isolation. The interrupted run is not counted as full-suite acceptance. Stock-page checks used a bounded 20-second test timeout for this shared execution environment; assertions and isolation remain intact.
- Deno integration was not rerun: Deno is unavailable. Existing shared normalization was tested in Vitest; Stage 5 changes no Edge runtime code.

The authenticated browser checks use the READY Vercel review deployment
`dpl_FdYvpLHHFLjP4C9ZcmCdG5Rrqspo`, application revision
`20d47fd82fde6fd16b2d6f3754334089a81d83a8`, at
https://portfiolio-cn9k0ebe0-dibyendu-dutta.vercel.app.
Stage 5 differs from that revision only in tests and documentation, so the hosted
artifact is the exact unchanged application under review. No localhost app or
local rendered screenshot is used. Private screenshots/authentication are not
committed; sanitized check results record the tested revision and scope.

Final cross-profile run: **1,392 checks PASS across 55 stocks and 45 live
methodology profiles**. Desktop width 1440 covered all 55 cases, including all five
Pharma primaries, finance/healthcare and non-financial profiles, BLUEJET and
SKYGOLD. Tablet width 1024 covered eight representative stocks, including keyboard
activation of all three result tabs and Summary navigation. Mobile width 390
covered HDFCBANK, TORNTPHARM and AKUMS, expanded specialist grids, all three result
tabs, containment and sticky navigation. The separate 32-check run verified
1440×900 first-glance layout and keyboard lineage disclosures, as well as simulated
failure states. Together **1,424 hosted checks PASS**. Ordinary browsing produced
zero REST read failures, runtime errors, provider refresh attempts or research
writes; the failure-injection run's four expected HTTP 503 responses are recorded
separately as simulated failures.

HDFCBANK/TORNTPHARM first-glance, BLUEJET/SKYGOLD identity, tablet and mobile
screenshots were inspected privately. BLUEJET shows reviewed assignment pending
and its assessment engine blocked. SKYGOLD retains the supplied Textiles context
and Gems & Jewellery Industry with its separate JEWELLERY method; classification
verification remains unavailable. Missing cached prices/current values stay
unavailable rather than initiating a provider refresh.

[Sanitized Stage 5 evidence](research-ui-sector-review-evidence/stock-research-stage-5-verification-2026-10-08.json)
records all checks, observed lineage, application revision and omitted checks.
SPECIALTY_CHEMICALS and UPSTREAM_E_AND_P were not represented in the hosted
sample. They are covered by the 47-profile contract tests/Stage 4 manifest, not
claimed as live visual cases.

## Stage 1 contract proof and upstream limits

| Contract case | Stage 5 consumer proof | Remaining upstream proof |
|---|---|---|
| S1-A official hierarchy | Industry, contextual Sector, unavailable Basic Industry and verification remain distinct from methodology. | Official four-level node identities/source/version/parentage are not supplied by the shared projection; not certified. |
| S1-B distinct businesses | Finance and healthcare business cases consume distinct approved frameworks; sector-label changes retain the selected method. | Creation/reassignment through exact versioned Industry nodes belongs to C1/C8, not this consumer stage. |
| S1-C required refinement | Required unresolved Pharma primary remains blocked; no guessed model. | Basic Industry/business-model mapping campaign is not complete or certified here. |
| S1-D one assignment | Header, framework, result tabs, deep Pharma and Evidence share snapshot/assignment lineage; live navigation does not select legacy assignments. | No new selection authority is added. |
| S1-E Pharma models | All five approved contracts remain distinct; exact specialised result binding is required and missing binding remains unproven. | Specialised numeric evidence and secondary-exposure review must be supplied/qualified upstream. |
| S1-F unresolved/review states | Existing effective-date/review assignment tests and consumer error/empty/loading safeguards pass. | Classification revalidation dispositions are not supplied or certified. |
| S1-G hierarchy conflict | SKYGOLD retains its supplied descriptive labels separately from its JEWELLERY assignment; no local correction or verified claim. | Canonical hierarchy validation/review state is unavailable; C1 must supply it. |
| S1-H history preservation | No assignments, source records, owner plans or research are mutated; retained disclosures remain accessible. | No C8 reassignment campaign or owner checkpoint is completed by this stage. |
| S1-I independent readiness | Assignment, evidence, engine, scores/advice and owner role remain separate; ordinary browsing is read-only. | Qualified scoring/advice needs its own validated evidence/engine gates. |

This is consumer design acceptance, not portfolio-wide taxonomy certification or
approval of every stock's methodology, evidence, score or recommendation. Missing
contract dimensions remain in Overview/Evidence rather than borrowing bank
sections; missing exact Pharma metric bindings remain explicitly unproven.
Unavailable quotes/current values remain unavailable and do not trigger refresh.

## Release boundary

Draft review: https://github.com/drddutta-portfolio/PortfiolioAI/pull/117.
Both stages remain on `research-stage-4-specialist-results`, unmerged, as requested.

GitHub job `113284738232` failed before a runner started (`runner_id: 0`, empty
steps): account payments/spending-limit restriction. The latest documentation-only
Vercel status points to a build-rate limit. Neither is a code-check pass. Billing,
protection settings and deployment limits were not changed or bypassed. The
previous READY application artifact remains available for verification. A joint
Development merge and post-merge hosted verification must follow the requested
release decision and an acceptable CI result; Stage 5 does not perform that merge.
