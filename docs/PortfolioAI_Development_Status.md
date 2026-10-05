## Bounded baseline closure and V1 proposal evidence — 5 October 2026

**Scope Freeze B: INCOMPLETE / OWNER REVIEW NOT READY. V1 implementation: NOT AUTHORIZED.**
This dated reconciliation supersedes earlier deployment and browser statements below. It completes the available bounded assessment; no additional general audit or build-repair campaign is proposed.

### Development runtime and browser evidence

Remote Development HEAD inspected: `3125f03ae91cddc33bcc3c0135fc005a50cb823f`. Stable alias https://portfiolio-ai-git-portfolioai-development-dibyendu-dutta.vercel.app resolves to READY Development Preview `dpl_CeFoJttcGwnfYwbRk78nqehr7HZM`, at that same Git SHA, in project `portfiolio-ai` / `prj_Vp1QUuF63cnfuAl8ULYuHW44EbXU`. Unique deployment: https://portfiolio-oto6ttuuh-dibyendu-dutta.vercel.app. The previous build/deployment mismatch is closed.

The owner confirmed that the emailed password-reset flow works following the authentication deep-link routing repair. The supplied authenticated Dashboard screenshot visibly shows the DEVELOPMENT marker, 248/248 priced open holdings, current value INR 2,217,451.55, cost basis INR 1,915,293.31, unrealised P&L INR 302,158.24, supported realised P&L INR 6,948.89 and canonical equity coverage 239/239, with zero scored/candidacy-ready/actions. This is owner-supplied visual evidence, not an agent-operated browser test. It does not establish navigation, interactions, Holdings, Portfolio Structure, Research or Intelligence workflow acceptance. Screenshot capture SHA/time is not independently attested; deployment mapping was separately verified.

Codex cannot control the owner's authenticated session in this environment: its browser runtime requires a platform-provisioned activation token. A separate unauthenticated browser is redirected to Vercel login. No login bypass, password/cookie extraction or protection change is authorized or attempted.

Use this READY application/configuration SHA as the baseline. A later documentation-only commit does not invalidate it; disclose and verify that comparison. Reverify deployment after any application/configuration change. Do not trigger deployments merely to align documentation.

### Read-only Development cohort findings

Inspection used only PortfolioAI Dev, project ref `lrgpjimipfkyoqbpsqzz`, and owner-scoped existing canonical snapshots/evidence. Snapshot as-of date is **2026-09-29**; these are stored snapshot classifications inspected on 5 October, not a newly refreshed readiness assessment.

The 239 equities reconcile to 128 INSUFFICIENT, 109 REVIEW_REQUIRED and 2 STALE. The proposed 111-member cohort spans **39 profile codes and 29 methodology authority identifiers**. Mandatory evidence rows within this cohort show:

| Condition | Affected equities | Planning consequence |
| --- | ---: | --- |
| Required evidence missing | 103 | Acquisition/input completeness must be proven; no providers executed |
| Document evidence requires review | 108 | Factual/document review remains mandatory |
| Required benchmark history not ready | 32 | Exact approved benchmark coverage must be established |
| Required evidence stale | 2 | Freshness remedy must be authorized and validated |
| Insufficient listing history | 1 | Time-dependent structural blocker; cannot manufacture history |
| Methodology factual review required | 1 | Resolve applicable methodology before counting usable output |

These counts overlap and must not be added. Eight cohort members lack the missing-evidence flag; this does not make them usable or prove they form a feasible smaller release cohort. The short-history case also has missing mandatory evidence.

The current methodology registry is byte-identical by Git blob SHA `a42da0465b2b06eae9a206e2210af620de7145f0` to the registry at recorded owner-approved IC1 commit `8bd8a971ae31812e503217d06c6c3cc9098d4061`. The IC1 completion document records COMPLETE / PASS / CLOSED after owner approval. Its preserved original candidate label must not be mistaken for absence of subsequent approval. Approval/assignment still does not prove implemented engines, mandatory evidence availability or downstream action readiness for all represented profiles.

The existing canonical current projection returns `actionState: null`. Preserve that fail-closed behavior and the zero-usable baseline until full deterministic lineage and downstream acceptance are demonstrated.

### Concrete proposal and owner decisions

Retain **111 equities / 46.44% count / INR 1,325,856.96 / 63.53% equity value** as a proposed all-or-fail minimum, with explicit delivery uncertainty. Values and denominators are the previously frozen audit valuation, not a newly remeasured SQL valuation. The cohort must be privately frozen before implementation; public documents contain aggregate evidence only.

Feasibility assumptions are now explicit: authorized sources can supply missing mandatory evidence for 103 members; 108 document reviews can be completed; 32 benchmark gaps can be closed under approved contracts; implemented engines can serve all represented authorities; stale inputs can be refreshed; and the one insufficient-listing-history member can legitimately satisfy the approved contract by the release date. **None of these outcomes is guaranteed.** The history requirement must not be shortened or waived to hit 111 without an explicit owner-approved methodology/scope amendment. Provider volume/budget and engineering estimates remain NOT PROVEN.

The proposal therefore needs three bounded owner decisions, rather than another open-ended audit:
1. Supply the remaining read-only browser smoke evidence (Holdings, Portfolio Structure, Research and Intelligence), or explicitly accept the limited Dashboard evidence as sufficient to enter Development and record that exception. Full hosted acceptance remains required before release.
2. Accept the 111 all-or-fail target with these feasibility risks, or choose a smaller preselected private cohort whose membership, count/value and methodology obligations are frozen before implementation. No arbitrary smaller target or retrospective denominator reduction is approved.
3. Accept isolated restore rehearsal deferral to V1-9, preserving Baseline Freeze as PARTIAL and restore proof as a release requirement.

After those decisions are recorded, amend this same Scope Freeze B to PROPOSED / OWNER REVIEW REQUIRED and obtain explicit owner approval. **V1-2 execution requires separate authorization after approval.** Preserve the sequence V1-2 → V1-3 → V1-4 → V1-5 → V1-6 → V1-7 → V1-8 → V1-9 and reuse existing PortfolioAI architecture, accounting, pilots and paused P8 work.

No application code, runtime configuration, Supabase data/Auth/schema, Production/main, provider execution, migration, scheduler, storage or restore change occurred in this evidence/planning pass. Full lint remains historical FAIL (84 errors, 4 warnings); it is not relabelled PASS.

---

## Development authentication deep-link recovery — 5 October 2026

A real owner recovery link reached the Development `/auth/update-password` route but Vercel returned 404 before React loaded. The existing deployment rewrites covered only `/app` paths. Development configuration now also rewrites `/login`, `/forgot-password` and `/auth/:path*` to `/index.html`, allowing the existing React login/recovery routes to load on direct navigation.

This is a narrowly authorized authentication recovery fix. Supabase users, ownership, RLS, passwords, provider controls and schedulers are not changed by this commit. No recovery tokens or account identities are committed. Hosted deployment verification and owner completion of the recovery flow remain separate checks. V1 implementation remains NOT AUTHORIZED.

---

## Codex Development verification reconciliation — 5 October 2026

**Build/runtime source equivalence = VERIFIED.** The stable Development alias serves READY Preview `dpl_DbjnpyyEYHg8bDWDYgJKuCaaFCwE` at SHA `10d740fb76f218ad8db04c4494714c998045c1d2`. Inspected remote HEAD `953575ebbfac4fd5c0c76157a6317531965a5057` differs only in this Development Status document; application and committed configuration are identical.

**Hosted authenticated baseline smoke = PARTIAL OWNER-REPORTED REACHABILITY; full smoke NOT PROVEN.** The owner reports Dashboard open at `/app#dashboard-daily-move`; other route/marker/error checks have not yet been supplied. A fresh browser request redirects to Vercel login. Owner access was requested; no bypass or authenticated workflow is claimed. Use the verified READY Preview and disclose later documentation-only differences instead of creating a deployment loop.

**111-equity target = CANDIDATE / DELIVERY FEASIBILITY NOT PROVEN.** The reported count/value arithmetic is correct (46.44% count / 63.53% frozen value), but REVIEW_REQUIRED/STALE does not establish complete evidence or approved implemented engine support. The current projection remains fail-closed with no final action. Before approval, supply cohort method/engine/evidence/cost assumptions or obtain explicit owner acceptance of the disclosed uncertainty.

**Baseline Freeze = PARTIAL. Scope Freeze B = INCOMPLETE / OWNER REVIEW NOT READY. V1 implementation = NOT AUTHORIZED.** Restore deferral to V1-9 remains an owner decision. Current capability totals remain 22 BLOCKER / 23 IMPORTANT / 3 V1.1 / 8 NO CHANGE.

The current verification and concrete owner choices are in `docs/PortfolioAI_V1_SCOPE_FREEZE_B_AND_BUILD_PLAN_2026-10-05.md`. This section supersedes earlier current-runtime, only-two-blockers and fully-justified-target claims below. This continuation changes documentation only; no runtime, provider, database, scheduler, storage, main or Production action occurred.

---

## Concrete Scope Freeze B acceptance proposal — 5 October 2026

The proposed V1 minimum real-portfolio usable-intelligence acceptance is now **111/239 equities (46.44%) representing INR 1,325,856.96 / 63.53% of the frozen priced-equity denominator**, selected objectively as the complete frozen non-INSUFFICIENT cohort (109 REVIEW_REQUIRED + 2 STALE). This is a proposed release target, not achieved coverage; current measured usable intelligence remains 0/239.

248/248 open securities still require explicit applicability/readiness status. The 128 INSUFFICIENT equities remain visible and blocked rather than excluded. Exact hosted current-HEAD deployment and authenticated owner-browser acceptance remain missing, so Scope Freeze B remains INCOMPLETE / OWNER REVIEW NOT READY and V1 implementation remains NOT AUTHORIZED.

---

## Current Development acceptance status — 5 October 2026

**Remote HEAD:** `fb067e01b64344c5279ceb65ead5ad7b3516a616`  
**Application source:** identical to READY Preview SHA `ba8c9e9ddbc0e2658a213af178f0f8922e86639d`; only documentation differs.  
**Verified READY Preview:** `dpl_5p9Daac7UqGSL8y6qP3dawqF1Hzx` at `ba8c9e9...`.  
**Exact current HEAD Preview:** NOT AVAILABLE / NOT PROVEN; Vercel currently returns no deployment for `fb067e01...`.  
**Hosted authenticated browser acceptance:** NOT PROVEN; no authorized owner browser session is exposed to this environment.  
**Build verification:** source build PASS, TypeScript PASS, architecture checks PASS, focused lint PASS, 33 focused regression tests PASS. Full repository lint remains FAIL with 84 errors and 4 warnings.  
**Capability totals:** 22 V1 BLOCKER / 23 V1 IMPORTANT / 3 V1.1 / 8 NO CHANGE.  
**Baseline Freeze:** PARTIAL.  
**Scope Freeze B:** INCOMPLETE / OWNER REVIEW NOT READY.  
**V1 implementation:** NOT AUTHORIZED.

The Scope Freeze B proposal content has been completed as a bounded implementation plan without requiring V1-4/V1-5/V1-7 execution before plan approval. Exact-current-HEAD hosted Preview proof and authenticated owner-browser verification remain the acceptance blockers before it can be promoted to PROPOSED / OWNER REVIEW REQUIRED.

---

## Development build recovery verification — 5 October 2026

Remote Development source `94be7ace03f6669edcf98da18b393cd41258e12b` passes the local TypeScript/Vite production-mode build. Architecture checks, focused lint and 33 preservation/environment regression tests pass. Full repository lint reports 84 errors and 4 warnings. No further source repair was needed in this continuation.

**Development Preview build recovery = COMPLETE / PASS.** Commit `ba8c9e9ddbc0e2658a213af178f0f8922e86639d` reached READY in Preview deployment `dpl_5p9Daac7UqGSL8y6qP3dawqF1Hzx`; the stable Development alias resolves to that exact SHA. This replaces the old runtime mismatch. Authenticated exact-SHA browser acceptance remains NOT PROVEN. Local login/LOCAL marker renders without page errors.

**Current audit totals: 22 V1 BLOCKER / 23 V1 IMPORTANT / 3 V1.1 / 8 NO CHANGE (56 capabilities).** This supersedes earlier counts below.

**Baseline Freeze = PARTIAL. Scope Freeze B = INCOMPLETE / OWNER REVIEW NOT READY. V1 implementation = NOT AUTHORIZED.** Restore deferral to V1-9 remains a proposed owner decision. Planning V1 remediation does not require prematurely implementing those gates.

Evidence and remaining acceptance: `docs/PortfolioAI_DEVELOPMENT_BUILD_RECOVERY_2026-10-05.md`. This continuation changes documentation only; ordinary Git-connected Preview builds are permitted, while provider/backend/storage/scheduler/main/Production mutations remain prohibited.

---

## Current Development Baseline Freeze + V1-1 audit — 5 October 2026

**Baseline Freeze = PARTIAL.**  
**V1-1 Operational Baseline Audit = COMPLETE FOR AVAILABLE READ-ONLY EVIDENCE.**  
**Scope Freeze B = INCOMPLETE PROPOSAL / OWNER REVIEW NOT READY.**  
**V1 implementation = NOT AUTHORIZED.**  
**Production/main mutation = NOT AUTHORIZED.**

New authoritative audit artifacts:
- `docs/PortfolioAI_CURRENT_DEVELOPMENT_BASELINE_FREEZE_2026-10-05.md`
- `docs/PortfolioAI_V1_OPERATIONAL_BASELINE_AUDIT_2026-10-05.md`
- `docs/PortfolioAI_V1_SCOPE_FREEZE_B_AND_BUILD_PLAN_2026-10-05.md`

Verified Development inventory: 248 open consolidated securities, 239 equities, 9 ETFs, 248/248 priced, priced market value INR 2,217,451.55, with 46 current-holding rows carrying missing broker attribution. Current held-equity evidence presence is 114/239 for fundamental observations and 111/239 for research documents; current classification is 239/239; persisted recommendation coverage is 1/239 and persisted position-sizing coverage is 0/239.

The exact pre-audit Development SHA is `a116cec4ab0939238c02a5480d283a09186b274b`.

Remaining Scope Freeze B readiness gaps are: Development Preview deployment/SHA verification, authenticated browser baseline proof, live R2/runtime storage verification sufficient for recovery mapping, complete 239-equity methodology-route/readiness census, measured usable-intelligence coverage and private real-security acceptance cohort. No V1-2–V1-9 implementation may start until Scope Freeze B is amended to a review-ready proposal and explicitly approved by the owner.

P8 remains preserved/paused for future V2; its existing code/data/docs/manifests are not deleted or rebuilt.

---

## PortfolioAI V1 Scope Freeze A — 5 October 2026

**Scope Freeze A = FROZEN.**  
**V1 implementation = NOT AUTHORIZED pending Scope Freeze B.**  
**Production/main mutation = NOT AUTHORIZED.**  
**P8 expansion = PROPOSED PAUSE / PRESERVE FOR V2, pending Development/P8 baseline verification.**

Authoritative release-boundary document:
`docs/PortfolioAI_V1_V2_PRODUCT_SCOPE_FREEZE_2026-10-05.md`.

The frozen V1 direction is operational current-portfolio investment intelligence: trustworthy accounting, approved current research evidence/methodology routing, deterministic Core/Satellite/Valuation/Momentum/Risk/Portfolio-Fit/Sizing/Exit intelligence, portfolio-aware advisory actions, optional grounded AI explanation and auditable owner decisions. Historical observations required for today's analysis remain V1 dependencies.

Deferred to V2/P8: point-in-time historical reconstruction and historical strategy/recommendation evaluation.

Before any mutable Development backend/provider execution, environment isolation must be verified. Next authorized work is read-only repository/baseline verification followed by the V1-1 Operational Baseline Audit. The audit must propose the dated acceptance inventory, supported profiles, real-security cohort, count/value usable-intelligence denominators and thresholds, gate completion contracts, maintenance mechanism and effort estimates. Owner approval of Scope Freeze B is required before implementation.

---

## P8 Step 2 Full Historical Feasibility Census closure — 5 October 2026

**Step 2 execution = COMPLETE / PASS / CLOSED.**  
**Research feasibility = NO-GO.**  
**Experiment freeze recommendation = NO.**  
**Step 1 remains COMPLETE / PASS / CLOSED with disposition `STEP1_POLICY_CLASSIFICATION_ROUTE_CANARY_PASS`.**

This current-state section supersedes earlier present-tense statements below that Step 2 was blocked/not started and supersedes the earlier Step 2 census evidence commit `e01e5f125fa895b338a4042bab3e351de48f4596`. Historical records are retained unchanged as audit history.

The frozen Step 2 contract is `P8_STEP2_HISTORICAL_FEASIBILITY_CONTRACT_V1`, Git blob `de02b6984fc715c81433a42a523e0a00f022b73d`. The final full read-only census used the exact B2 denominator and canonical R2/B3 authorities, verified the fixed source inventory, invoked the actual historical router/readiness adapter for proven classifications, and repeated the deterministic measurement independently against the same frozen inputs.

### Full B2 result

- pairs: **121,956**
- historical identities: **4,524**
- decision dates: **32**
- authoritative complete historical classification pairs: **61**
- actual supported existing methodology-route pairs: **29**
- routed historical identities: **1**
- complete-input pairs: **0**

Exclusive primary disposition:

- `NO_PRE_DECISION_EVIDENCE`: **60,254**
- `CLASSIFICATION_UNRESOLVED_OR_NOT_AUTHORITATIVE`: **61,609**
- `NOT_MEASURED_ACCESS_OR_DECODING_LIMITATION`: **32**
- `ROUTE_UNSUPPORTED_OR_AMBIGUOUS`: **32**
- `REQUIRED_INPUTS_INCOMPLETE`: **29**
- `MARKET_DATA_BLOCKED_OR_INSUFFICIENT_HISTORY`: **0**
- `COMPLETE_INPUTS`: **0**

The exclusive primary-disposition counts sum exactly to **121,956**. Separately, **39,452** pairs carry the overlapping diagnostic `B3_MARKET_NOT_READY`; primary precedence prevents those diagnostics from being double-counted as an exclusive reconciliation.

The 61 authoritative classifications split into **32 Edible Oil** pairs (`IN040101001`) that fail closed because the actual historical router has no supported existing route, and **29 Iron & Steel Products / STEEL_FERROUS** pairs (`IN070205015`) that reach the actual historical router and readiness adapter.

### Objectively predeclared narrower cohort

`P8_STEP2_OBJECTIVE_ROUTED_HISTORICAL_COHORT_V1` contains:

- **29 pairs**
- **1 historical identity**
- **29 decision dates**
- methodology: **STEEL_FERROUS**
- complete-input pairs: **0 / 29 = 0%**

All 11 frozen STEEL_FERROUS normalized signal codes are absent from the Development historical normalized-signal observation inventory. Raw XBRL facts and B3 prices were not promoted to canonical normalized scoring inputs. Every routed pair therefore fails closed as `REQUIRED_INPUTS_INCOMPLETE`.

Frozen acceptance standards:

- at least 24 decision dates: **PASS** (29)
- at least 80% overall complete-input coverage: **FAIL** (0%)
- at least 70% on every included decision date: **FAIL** (0% on each of 29 dates)
- at least 60% per applicable major methodology sector: **FAIL** (STEEL_FERROUS 0%)

Therefore the evidence-based recommendation is **NO-GO**. No experiment is frozen or executed. The smallest evidenced next dependency is route-specific historical normalized-input materialization/mapping under the already adopted methodology authorities; this is not authorization for another provider-acquisition loop.

Deterministic census fingerprint: `fe7ad2190af20aa111bd7ceef73235ea04f5472e30428c7418b57ea51d39e7b1`  
B3 partition-inventory fingerprint: `e381bee03e6f5d2236209d1400bddf47801e04d0df53da52933d5cf706744f59`  
Pair-manifest uncompressed SHA-256: `b17856697f0bdc40c124910870dd218455ee494609712406bc1348d146ad0832`  
Pair-manifest gzip SHA-256: `8f0effa34d1d7dcd8d9fec3d8cd88b3ba60331db1bb84050ecd582fa3627d183`  
Focused validation workflow: `37265713073` — **SUCCESS**  
Census evidence commit: `b7bf8b7a81e24d64ebef379c562b3c4e90cced57`

No provider calls, Supabase/R2 writes, migrations, deployments, score/decision/position/return/performance calculations, holdout reads, B5/B6/B-FINAL rebuild, P8-C start, `main` change or Production change occurred.

---

## P8 Step 1 closure — 5 October 2026

**Step 1 = COMPLETE / PASS / CLOSED against its original frozen policy/classification/route gate.**
**Disposition: `STEP1_POLICY_CLASSIFICATION_ROUTE_CANARY_PASS`.**
**Step 2 feasibility = BLOCKED / NOT STARTED.**

The previous `STEP1_CANARY_VALIDATION_BLOCKED_INSUFFICIENT_EXISTING_HISTORY` conclusion conflated Step 1's five frozen acceptance conditions with Step 2's complete-input feasibility. This closure corrects that scope error without changing either contract or relaxing a threshold. The source-history findings remain valid.

The actual canonical `routeHistoricalResearchProfileV1` was executed twice on every one of the 32 frozen pairs using complete official four-tier hierarchies, adopted V1/V3 contracts, pre-decision dissemination dates, and the reviewed OD2 entry. Classification is derived from the existing approved accounting audit and exact reviewed descriptions, not assigned by company identity. Existing source-semantic and V3 extraction measurements were reused; this was not a fresh source extraction.

- Source-cited positional semantic recovery: PASS.
- Complete authoritative classifications: 2 (Edible Oil and Iron & Steel Products).
- Unique existing routes from complete classification: 1 (Steel Pipes → STEEL_FERROUS).
- Repeated actual-router fingerprint: PASS.
- Unproven negative-control promotions: 0 of 8.

The authoritative gate is `PortfolioAI_P8_HISTORICAL_TAXONOMY_EVIDENCE_NORMALIZATION_CONTRACT_V1.json`, blob `a54ab626e8325a31c7bd960691fd1ba897c14b76`. Its five criteria are reproduced and checked exactly by the runner. Complete scoring inputs are not a condition of that gate. The approved V1, V3 and OD2 blobs are unchanged; OD4 remains BLOCKED. Edible Oil remains unsupported by an approved existing methodology route.

Complete normalized inputs remain 0. The routed case has only one evidenced consolidated annual year in the existing source inventory, insufficient for the five-year/12-quarter input contract. Identity-specific 252-day market-history sufficiency remains NOT MEASURED; an empty legacy SQL table is not evidence of missing canonical R2 data.

The gate PASS establishes technical canary readiness only. It does not itself authorize processing the 25,761-pair population. Step 2 requires a separately scoped feasibility build, with complete-input checks before any experiment freeze. No expansion, experiment execution, B5/B6/B-FINAL rebuild, P8-C, scores, performance analysis, Supabase/R2 write, migration or deployment occurred.

Reproducible evidence: `docs/p8/PortfolioAI_P8_STEP1_ACTUAL_ROUTER_CANARY_VALIDATION_2026-10-05.json`.
Runner: `scripts/p8/p8-step1-actual-router-canary.mjs`.
Validation: five Node regression tests and seven existing Python reconciliation tests.

---

## P8 Step 1 existing-evidence reconciliation — 5 October 2026

**Bounded audit = COMPLETE. Step 1 successful acceptance = BLOCKED.**
**Exact disposition: `STEP1_CANARY_VALIDATION_BLOCKED_INSUFFICIENT_EXISTING_HISTORY`.**

This reconciliation supersedes the earlier inference that zero PostgreSQL adjusted-series rows mean missing canonical market evidence. The frozen B3 R2 identity/storage contract requires that legacy SQL table to remain empty. Canonical adjusted series and decision ledgers reside in R2. Their 29 November 2024 partitions were independently listed; identity-specific 252-day history was **not measured** because the available connector returns binary Parquet as UTF-8 text. No price-history absence is claimed from the SQL count.

For the one routed Steel case (`19f21fe6-46c9-5f26-9ee5-6207558ba10b`, ISIN `INE230R01035`, decision 29 November 2024), the complete Workstream-D filing index contains 10 entries: 8 before the decision and 2 after it. The 8 pre-decision entries represent **6 distinct XML bodies**. All six bodies were read from R2 and their SHA-256 hashes independently verified.

Their complete context and explicit reporting-period inventories contain FY2024, the March/June/September 2024 quarters and the April–September 2024 half-year. They contain **one distinct consolidated annual reporting year**, FY2024. Consolidated and standalone filings for that year, and duplicate source bodies, do not supply additional annual observations. No earlier comparative reporting periods were found in these inspected XML bodies.

The locked `METALS_COMMODITIES_K4A_METHODOLOGY_V1` requires five annual fundamental years and twelve cycle/margin quarters. The inspected evidence cannot satisfy the five-year prerequisite. Creating normalization code cannot recover absent years; no signals or scores were fabricated and no requirement was relaxed.

Prior integration reports retain two classifications and one Steel route. Those route counts were not independently rerun here. The prior Python canary runner assigned routes by identity and hard-coded zero market rows; its repeat fingerprint does not independently measure routing or market coverage. This audit explicitly separates prior implementation results from newly measured source inventory.

Detailed evidence: [reconciliation audit](p8/PortfolioAI_P8_STEP1_EXISTING_EVIDENCE_RECONCILIATION_2026-10-05.json).

**Step 2 remains NOT STARTED.** This is a bounded blocker for the routed case and inspected evidence, not proof that all 25,761 candidates or historical validation are infeasible. Existing approvals and frozen V1/V3/crosswalk contracts remain unchanged.

No provider calls, new acquisition, Supabase/R2 writes, migrations, deployments, population expansion, experiment execution, B5/B6/B-FINAL rebuild, P8-C or outcome inspection occurred.

## P8 Steel-Ferrous Historical Route Integration + Frozen-Canary Input Readiness Validation — 5 October 2026

**Implementation = COMPLETE / PASS.**  
**Authoritative historical route = ESTABLISHED FOR 1 CASE.**  
**Normalized input completeness = BLOCKED / 0 COMPLETE PAIRS.**  
**Exact disposition: `STEEL_FERROUS_HISTORICAL_ROUTE_INTEGRATION_COMPLETE_INPUT_READINESS_BLOCKED`.**

### Historical integration authority

Versioned contract:

`P8_STEEL_FERROUS_HISTORICAL_ROUTE_INTEGRATION_V1`

Contract Git blob:

`a0d1700cab6f63ddaaf65986cad9cc3fc31f27b8`

Historical router version:

`HISTORICAL_RESEARCH_PROFILE_ROUTING_V1`

Exact eligible historical Basic Industry:

`IN070205015 — Iron & Steel Products`

Preserved economic hierarchy:

`Industrials → Capital Goods → Industrial Products → Iron & Steel Products`

Selected methodology:

`STEEL_FERROUS`

Existing engine:

`METALS_COMMODITIES`

Methodology authority:

`METALS_COMMODITIES_K4A_METHODOLOGY_V1`

Scoring authority:

`METALS_COMMODITIES_K4B_SCORING_V1`

The live/current `routeResearchProfileV1` behavior remains unchanged.

### Frozen 32-case canary

- denominator: **32**
- authoritative complete classifications: **2**
- exact integrated STEEL_FERROUS routes: **1**
- authoritative classification outside this integration: **1**
- other pairs rejected: **30**
- accidental negative-control routes: **0**
- preserved non-zero-intersegment blockers: **6**
- complete-input pairs: **0**

Canary fingerprint remains:

`b159764fd342aad3901717e04446596e93aa87d9c6726b7b3dd7ef8b55026dce`

Route-canary audit fingerprint:

`d9ad343b3c28cdf1015f081398c58f9fa4e42a3097b735606e76006055ccd357`

### Steel input readiness

Routed historical identity:

`19f21fe6-46c9-5f26-9ee5-6207558ba10b / INE230R01035`

Decision instant:

`2024-11-29T10:00:00+00:00`

Existing pre-decision evidence:

- XML sources: **8**
- eligible audited annual sources: **2**
- canonical adjusted B3 market rows: **0**

STEEL_FERROUS required readiness signals:

**11**

Normalized ready:

**0 / 11**

Therefore:

**INPUTS_INCOMPLETE**

Key blockers:

- no canonical 252-day momentum history;
- no canonical 252-day commodity-cycle drawdown history;
- only 2 audited annual sources versus 5 observations required by several through-cycle signals;
- no materialized 12-observation through-cycle margin/growth histories;
- no reviewed historical ownership/governance signal;
- no canonical historical commodity-exposure metadata signal.

### Verification

Workflow `37229420071`: **SUCCESS**

- focused tests: PASS
- focused lint: PASS
- architecture: PASS
- global typecheck: PASS
- global lint: PASS
- production build: PASS
- frozen canary audit: PASS

### Boundary

The route integration does **not** authorize scoring/recommendation generation, historical R6–R10 replay, B5/B6/B-FINAL rebuild, experiment execution, broad 25,761-pair expansion or P8-C.

Recommended next bounded task, if separately authorized:

**P8 Steel-Ferrous Historical Signal Materialization Feasibility**

Use only the existing routed Steel case and already-stored evidence; stop if required observation depth cannot be proven.

## P8 Historical Business-Applicability Evidence + Methodology Capability Decision — 5 October 2026

**Audit execution = COMPLETE / PASS.**  
**Exact disposition: `HISTORICAL_BUSINESS_APPLICABILITY_MIXED_DECISION_STEEL_EXISTING_METHOD_SUPPORTED_EDIBLE_OWNER_POLICY_REQUIRED`.**

### Important correction to the previous capability audit

The earlier capability audit correctly found zero authoritative routes, but it was too strict in treating several mandatory scored evidence families as methodology-selection prerequisites.

The locked methodology contracts distinguish selection from score readiness.

#### Steel Pipes / Iron & Steel Products

Approved historical classification:

`Industrials → Capital Goods → Industrial Products → Iron & Steel Products (IN070205015)`

The existing locked `STEEL_FERROUS` methodology explicitly accepts selector:

`IRON_STEEL_PRODUCTS`

Therefore:

- methodology applicability = **PROVEN**
- new methodology required = **NO**
- canonical route integration = **MISSING**
- generic non-BANK/non-PHARMA scoring adapter = **PENDING**
- normalized input completeness = **NOT PROVEN**

Raw-material integration, steel-spread history, capacity/utilisation and other through-cycle requirements remain mandatory scoring/readiness evidence. Their absence does not invalidate methodology selection.

#### Edible Oil

Approved historical classification:

`Fast Moving Consumer Goods → Fast Moving Consumer Goods → Agricultural Food & other Products → Edible Oil (IN040101001)`

`BRANDED_CONSUMER_FMCG` accepts selector `VEGETABLE_OILS_PRODUCTS`, but no adopted PortfolioAI rule currently maps `Edible Oil` to that selector.

Therefore:

- BRANDED_CONSUMER_FMCG applicability = **OWNER-CONTROLLED SELECTOR MAPPING DECISION**
- normalized input completeness = **NOT PROVEN**

`AGRI_PROCESSING` remains a registry-level profile with no canonical K4A-style selector contract, no router exposure, no sector-engine registration and no dedicated canonical executable K4 engine.

### Source-backed evidence

Steel source:
- ISIN `INE230R01035`
- source SHA-256 `4b0b16349cc9ef3ff46f61d590768a39915ba4c567ef4a72f0355cd28680521d`
- disseminated `2024-05-31T09:27:01+00:00`
- audited consolidated FY2024
- explicit dominant `Manufacturing- Steel Pipes` segment ≈ **74.88%**

Edible Oil source:
- ISIN `INE699H01024`
- source SHA-256 `07eeb7e380b7436e23543c61921d53011b9c15a523a9007751f4fca12d73a196`
- disseminated `2024-05-01T13:10:49+00:00`
- audited consolidated FY2024
- explicit dominant `Edible Oil` segment ≈ **75.67%**

### Recommended next authorization

Recommended:

**P8 Steel-Ferrous Historical Route Integration + Frozen-Canary Input Readiness Validation**

This would be a separately authorized, canary-only implementation using the existing `STEEL_FERROUS` methodology without changing historical economic taxonomy.

Edible Oil should remain separate. Owner must choose whether to approve:

`Edible Oil → VEGETABLE_OILS_PRODUCTS → BRANDED_CONSUMER_FMCG`

as a methodology selector mapping, retain Edible Oil unsupported, or separately authorize AGRI_PROCESSING capability design.

### Boundary

The 25,761-pair population remains **NOT AUTHORIZED / NOT MEASURED**.

No experiment execution, B5/B6/B-FINAL rebuild, P8-C, provider call, database/storage write, migration or deployment occurred.

## P8 Application-Taxonomy and Existing Methodology Coverage Audit — 4 October 2026

**Implementation / tests = COMPLETE / PASS.**  
**Exact disposition: `APPLICATION_TAXONOMY_METHODOLOGY_COVERAGE_BLOCKED_APPLICABILITY_AND_EXECUTION_GAPS`.**

### Current proven historical classifications

1. **Edible Oil — IN040101001**
2. **Iron & Steel Products — IN070205015** via approved `Manufacturing- Steel Pipes` synonym

Authoritative methodology routes remain **0**.

Complete normalized-input pairs remain **0**.

### Capability findings

#### Edible Oil

`AGRI_PROCESSING`:
- P7 methodology registry: **present**
- canonical router exposure: **absent**
- `SECTOR_ENGINE_REGISTRY`: **absent**
- dedicated executable K4 engine: **absent**
- historical applicability evidence: **insufficient**

`BRANDED_CONSUMER_FMCG`:
- methodology/sector engine: **implemented**
- router: **exposed**
- generic scoring adapter: **pending**
- historical applicability evidence: **insufficient** because Edible Oil classification does not establish brand/distribution/category durability.

#### Iron & Steel Products / Steel Pipes

`STEEL_FERROUS`:
- methodology/sector engine: **implemented**
- router: **exposed for metals/steel classifications**
- generic scoring adapter: **pending**
- historical applicability evidence: **insufficient** for commodity-cycle/raw-material integration semantics.

`CAPITAL_EQUIPMENT_ELECTRICAL`:
- methodology/sector engine: **implemented**
- router: **exposed**
- applicability to Steel Pipes: **rejected on current evidence**.

### Direct answers

- Either case blocked only by wiring? **NO**
- Additional historical business evidence required? **YES, for both**
- Registered but unimplemented profile? **AGRI_PROCESSING**
- Route integration justified now? **NO**

### Architecture conclusion

Economic taxonomy and analytical methodology remain separate authorities.

Do not add convenience aliases:
- Edible Oil → BRANDED_CONSUMER_FMCG
- Steel Pipes → STEEL_FERROUS
- Steel Pipes → CAPITAL_EQUIPMENT_ELECTRICAL

without the required point-in-time business-applicability evidence.

### Recommended next bounded owner decision

Authorize:

**P8 Historical Business-Applicability Evidence + Methodology Capability Decision**

This should use existing contemporaneous evidence to prove or reject applicability before any router integration. If AGRI_PROCESSING is proven applicable, a later separate authorization would be required for its canonical engine/router/adapter implementation.

Alternatively, retain both cases as unsupported exclusions and close this historical methodology-recovery branch.

### Verification

Workflow `37227467813`: **SUCCESS**

Deterministic audit fingerprint:

`23d8ffb2cfa1f239ff3b20001ada66f7f8fd9d3eb55d9fb77d614544d1b0570c`

The 25,761-pair surface remains **NOT AUTHORIZED / NOT MEASURED**.

## P8 OD2 Steel-Pipes Historical Taxonomy Adoption — 4 October 2026

**Current-state precedence:** This entry supersedes earlier statements that `Manufacturing- Steel Pipes` is pending OD2 review.

The owner has approved the OD2 evidence-backed synonym:

`Manufacturing- Steel Pipes → Iron & Steel Products (IN070205015)`

under:

`Industrials → Capital Goods → Industrial Products`

Frozen crosswalk candidate:

`P8_HISTORICAL_TAXONOMY_CROSSWALK_CANDIDATE_V1`

Git blob:

`fd5a683ab595d98c71254ea8c825d5ae82338afb`

Immutable owner-adoption record:

`docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CROSSWALK_OD2_OWNER_ADOPTION_2026-10-04.json`

### Updated frozen-canary taxonomy state

Authoritative complete historical classifications are now:

1. **Edible Oil — IN040101001**
2. **Manufacturing- Steel Pipes → Iron & Steel Products — IN070205015**

Therefore:

- authoritative complete classifications: **2**
- remaining ambiguous/incomplete dominant descriptions: **4**
- authoritative methodology routes: **0**
- complete normalized inputs: **0**

The remaining unresolved descriptions are:

- `IT and Business Service`
- `EPC/Engineering Services`
- `Textile`
- `Automotive Segment`

### Routing boundary

This approval establishes historical taxonomy classification only.

It does not authorize or create a semantically supported application-taxonomy target.

For Steel Pipes, the official taxonomy branch remains:

`Industrials → Capital Goods → Industrial Products → Iron & Steel Products`

It must not be silently rewritten into the active Metals & Mining application category merely to obtain the `STEEL_FERROUS` route.

Therefore methodology routing remains:

**0 authoritative routes**

The 25,761-pair surface remains unauthorized and unmeasured.

## P8 Historical Taxonomy Crosswalk + Existing Methodology Route Validation — 4 October 2026

**Implementation / tests = COMPLETE / PASS.**  
**Exact disposition: `HISTORICAL_CROSSWALK_ROUTE_VALIDATION_BLOCKED_NO_SEMANTICALLY_SUPPORTED_EXISTING_ROUTE`.**

Frozen candidate:

`P8_HISTORICAL_TAXONOMY_CROSSWALK_CANDIDATE_V1`

Git blob:

`fd5a683ab595d98c71254ea8c825d5ae82338afb`

### Frozen-canary result

| Measure | Result |
|---|---:|
| Authoritative complete classifications | **1** |
| Conditional OD2 complete classifications | **1** |
| Authoritative unique routes | **0** |
| Conditional unique routes | **0** |
| Complete normalized inputs | **0** |

The authoritative complete classification is **Edible Oil — IN040101001**.

The conditional OD2 candidate is **Manufacturing- Steel Pipes → Iron & Steel Products — IN070205015**, pending review.

### Edible Oil route assessment

Official hierarchy:

`Fast Moving Consumer Goods → Fast Moving Consumer Goods → Agricultural Food & other Products → Edible Oil`

No active Development application taxonomy target represents this hierarchy.

The canonical router can theoretically route `FMCG + Vegetable Oils Products` to `BRANDED_CONSUMER_FMCG`, but this is rejected as a crosswalk because:

- the active application taxonomy has no such target;
- Edible Oil does not itself prove branded-consumer methodology semantics;
- the BRANDED_CONSUMER_FMCG profile requires branded-consumer evidence including brand/distribution/category durability.

The registry contains `AGRI_PROCESSING`, but `RESEARCH_PROFILE_ROUTING_V2` does not expose that profile.

Disposition:

**`UNSUPPORTED_EXISTING_METHODOLOGY`**

### Other dominant descriptions

- `Manufacturing- Steel Pipes`: OD2 reviewable synonym to `Iron & Steel Products`; no semantically compatible application crosswalk or route.
- `IT and Business Service`: ambiguous below IT macro/sector.
- `EPC/Engineering Services`: ambiguous across Construction and Engineering Services.
- `Textile`: partial Textiles/Textiles & Apparels hierarchy only.
- `Automotive Segment`: Automobile versus Auto Components unresolved.

No company name, current classification or general model knowledge was used.

### Accounting boundary

The six V3-normalized cases with non-zero aggregate intersegment revenue remain blocked under approved V1.

No accounting rule was weakened.

### Verification

Workflow `37224872015`: **SUCCESS**  
Focused tests: **5 / 5 PASS**

Crosswalk fingerprint:

`4cec9b0468f27d0724e7db04487dba2af75794d9ffbcd19d304b855f2ddf6eb7`

Final router-validation fingerprint:

`c6c15c0e9bce15a20242e6ad8684bfd97f38ce584652515809a13bcd4e98cd19`

### Boundary

The 25,761-pair surface remains **NOT AUTHORIZED / NOT MEASURED**.

Experiment freeze/execution, B5/B6/B-FINAL rebuild and P8-C remain unauthorized.

OD2 review package:

`docs/p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CROSSWALK_OD2_REVIEW_PACKAGE_2026-10-04.md`

## P8 XBRL Segment-Period Semantics V3 Owner Adoption — 4 October 2026

**Current-state precedence:** This entry supersedes earlier statements that V3 is pending owner approval.

**V3 = OWNER APPROVED / ADOPTED.**  
**Approved V1 = UNCHANGED.**  
**OD1 = APPROVED.**  
**OD2 = APPROVED WITH REVIEW CONTROL.**  
**OD3 = APPROVED.**  
**OD4 = BLOCKED.**

Approved V3 authority:

`P8_XBRL_SEGMENT_PERIOD_SEMANTICS_CANDIDATE_V3`

Frozen Git blob:

`797b7e91d7770f3377d0061ee338c76e8220391f`

V1 remains exactly:

`45e990981371dba217d12c430f8ce567acbf25fc`

Immutable owner-adoption record:

`docs/p8/PortfolioAI_P8_XBRL_SEGMENT_PERIOD_SEMANTICS_V3_OWNER_ADOPTION_2026-10-04.json`

### Authoritative semantic effect

Where every frozen V3 evidence condition passes, PortfolioAI may now normalize the semantic period of the affected Four-reportable-segment facts to the explicit annual FourD reporting period while preserving the original literal quarter-dated XBRL contexts as raw evidence.

V3 does not permit annuality inference from concept/context naming, value magnitude, expected revenue or reconciliation alone.

### Measured canary state after adoption

The frozen 32-pair canary measurement does not change:

| Measure | Result |
|---|---:|
| V3 period normalizations | **12** |
| Comparable segment-revenue cases | **6** |
| Strict >50% dominant-business candidates | **6** |
| Exact Basic-Industry classifications | **1** |
| Methodology routes | **0** |
| Complete normalized inputs | **0** |

The exact classification remains **Edible Oil — IN040101001**.

Five other dominant-business descriptions still require OD2-reviewed mappings or remain ambiguous.

Six V3-normalized cases remain blocked by non-zero aggregate intersegment revenue without segment-specific external revenue.

### Expansion boundary

Approval of V3 does **not** authorize the 25,761-pair expansion.

The gate remains closed because:

- methodology routes = 0;
- complete normalized inputs = 0.

Experiment freeze/execution, B5/B6/B-FINAL rebuild and P8-C remain unauthorized.

## P8 XBRL Segment-Period Semantics Audit + Normalization Candidate — 4 October 2026

**Implementation / tests = COMPLETE / PASS.**  
**Approved V1 = UNCHANGED.**  
**V1 authoritative recovery = 0.**  
**V3 conditional normalization = MEASURED / PENDING OWNER APPROVAL.**  
**Exact disposition: `XBRL_SEGMENT_PERIOD_V3_CONDITIONAL_RECOVERY_PENDING_OWNER_APPROVAL`.**

Frozen candidate:

`P8_XBRL_SEGMENT_PERIOD_SEMANTICS_CANDIDATE_V3`

Git blob:

`797b7e91d7770f3377d0061ee338c76e8220391f`

### Root cause

The 12 prior segment-period mismatches are not V1 parser omissions.

All 12 show a same-filing conflict:
- `ReportingQuarter = Yearly`;
- explicit OneD reporting-period facts identify the quarter;
- explicit FourD reporting-period facts identify the audited annual period;
- literal OneD/FourD XBRL context dates remain quarter-dated;
- One/Four segment identities match;
- One/Four revenue and segment-profit groups independently reconcile to their corresponding totals.

This supports a recoverable source-tagging defect only under the separately versioned V3 semantic rule. Original literal context dates remain preserved.

### Frozen-canary result

Primary dispositions reconcile to 32:

- V3 conditional recoverable source-tagging defect: **12**
- accounting incomplete / other blocker: **12**
- no eligible audited consolidated annual source: **8**

V3 conditional diagnostics:

- period normalizations: **12**
- comparable segment revenue: **6**
- strict >50% dominant-business candidates: **6**
- exact Basic-Industry classifications: **1**
- candidate methodology routes: **0**
- complete normalized inputs: **0**

The exact Basic-Industry case is **Edible Oil — IN040101001**, but no existing exact application-taxonomy crosswalk produces a route.

The other five dominant descriptions require OD2 review/catalog mapping or remain ambiguous.

The remaining six V3-normalized cases are blocked by non-zero aggregate intersegment revenue without segment-specific external revenue.

### Missing accounting disclosures

The 12 accounting-incomplete cases were searched independently.

**12 / 12 = NO_ALTERNATE_RELATED_FACTS_FOUND.**

No absence was converted to zero.

### Source limitation

The XML references `Ind-AS_entry_point_2020-03-31.xsd`, but no applicable XSD/linkbase or companion rendered filing was found in the authorized repository/R2 evidence set.

### Verification

Final workflow: `37220672965` — SUCCESS  
Focused/source-backed tests: **12 / 12 PASS**

V3 final fingerprint:

`e75ffba7529050c5984b23575ef3663b5c823f1cc1c4a3c7d19e8717de9799f8`

### Boundary

V3 is **not owner-approved**.

Therefore authoritative V1 counts remain:

- comparable segment revenue: 0
- complete company classification: 0
- unique methodology routes: 0
- complete normalized inputs: 0

The 25,761-pair surface remains **NOT AUTHORIZED / NOT MEASURED**. P8-C remains NOT AUTHORIZED.

Owner review package:

`docs/p8/PortfolioAI_P8_XBRL_SEGMENT_PERIOD_SEMANTICS_V3_OWNER_APPROVAL_PACKAGE_2026-10-04.md`

## P8 OD1–OD3 Owner Adoption — 4 October 2026

**Current-state precedence:** This entry supersedes all earlier present-tense statements that OD1, OD2 or OD3 are pending owner approval. It does not alter the frozen canary measurement or authorize downstream expansion.

**OD1 = APPROVED.**  
**OD2 = APPROVED WITH REVIEW CONTROL.**  
**OD3 = APPROVED under the frozen contract.**  
**OD4 = BLOCKED.**

Authoritative adoption record:

`docs/p8/PortfolioAI_P8_SEGMENT_REVENUE_OWNER_POLICY_ADOPTION_2026-10-04.json`

### Adopted authorities

- OD1 authority: `PORTFOLIOAI_NSE_FOUR_TIER_TAXONOMY_REFERENCE_V1`
- official NSE November-2022 source SHA-256: `ed6a4af212460747510ca551bb14634ab8ef81bb5dee59a33d5d6973e3129dd1`
- taxonomy payload SHA-256: `e68821b19212f38a475bacd9977e9ec316e113babce90becbbca8a7c59bbed96`

OD2 now permits a **versioned, evidence-backed synonym catalog with review control**. Broad, conflicting or ambiguous descriptions remain blocked.

OD3 authority:

`P8_HISTORICAL_SEGMENT_REVENUE_CLASSIFICATION_CANDIDATE_V1`

Frozen Git blob SHA:

`45e990981371dba217d12c430f8ce567acbf25fc`

The frozen contract file itself remains unchanged after approval.

OD4 remains blocked:

`NO_SPECIALISED_ROUTE_FOR_DIVERSIFIED`

### Approval boundary

Owner approval adopts the policy contracts only.

It does **not** authorize:

- 25,761-pair expansion;
- experiment freeze or execution;
- B5/B6/B-FINAL rebuild;
- P8-C;
- Supabase/R2 writes;
- migrations;
- deployments;
- scheduler activation.

### Research state after adoption

Policy adoption does not change the measured frozen-canary evidence result:

| Measure | Result |
|---|---:|
| Frozen canary pairs | **32** |
| Eligible audited consolidated annual source | **24** |
| Comparable segment-revenue pairs | **0** |
| Dominant-business candidates | **0** |
| Complete company classifications | **0** |
| Unique methodology routes | **0** |
| Complete normalized-input pairs | **0** |

Therefore:

**Policy authority = ADOPTED.**  
**Accounting/source proof = BLOCKED.**  
**Expansion gate = CLOSED.**  
**Experiment feasibility = BLOCKED.**

The remaining unresolved dependency is source/accounting semantics, principally the audited-annual versus reportable-segment XBRL period-context mismatch and other incomplete annual accounting evidence. Any change that reinterprets those source contexts requires a separately versioned semantic/accounting contract and explicit authorization; it is not implied by OD1–OD3 approval.

## P8 Historical Segment-Revenue Classification Contract + Frozen Canary Validation — 4 October 2026

**Current-state precedence:** This entry supersedes the prior statement that the immediate blocker is simply taxonomy-policy adoption plus a multi-segment rule. The separately authorized segment/accounting contract task has now been implemented and measured on the unchanged frozen canary.

**Implementation / focused tests = COMPLETE / PASS.**  
**Segment/accounting contract candidate = FROZEN / PENDING OWNER ADOPTION.**  
**Accounting proof on frozen canary = BLOCKED.**  
**Company classification / route / normalized-input proof = 0.**  
**Experiment feasibility = BLOCKED.**  
**Exact disposition: `SEGMENT_REVENUE_CONTRACT_COMPLETE_CANARY_EVIDENCE_BLOCKED_PENDING_OWNER_ADOPTION`.**

### Methodology/version authority

The current official NSE Indices industry-classification methodology page is marked **Updated 21/09/2023** and documents:

- revenue-based classification;
- strict multi-business segment contribution `>50%`;
- Diversified handling;
- audited consolidated annual financials as the prime source;
- annual/event-driven review.

The PortfolioAI frozen vocabulary is the official **November-2022** NSE structure. Its frozen PDF contains definition text using `>50%` / `>=20%` concepts, but the exact complete November-2022 methodology text is not preserved. Therefore the 2023 methodology is treated as later official methodology evidence, not asserted verbatim as the November-2022 methodology.

Methodology assessment:

- current methodology HTML SHA-256: `5ef4f26fde3cfc2d105adf27c6a3884e500a307c02bf89f866b687bb0cb3792`
- November-2022 taxonomy PDF SHA-256: `ed6a4af212460747510ca551bb14634ab8ef81bb5dee59a33d5d6973e3129dd1`

### Frozen segment/accounting contract

Contract:

`P8_HISTORICAL_SEGMENT_REVENUE_CLASSIFICATION_CANDIDATE_V1`

Git blob SHA:

`45e990981371dba217d12c430f8ce567acbf25fc`

The contract was frozen before final canary measurement.

Core rules:

- latest eligible **audited consolidated annual** source strictly before the decision;
- annual duration 330–380 days;
- no standalone, quarterly or unaudited OD3 fallback in V1;
- company denominator = same-period net Revenue from Operations;
- total segment revenue − aggregate inter-segment revenue must reconcile to company revenue within XBRL rounding tolerance;
- segment numerator must be comparable external revenue;
- gross segment revenue can be used only when aggregate inter-segment revenue is valid zero;
- non-zero aggregate inter-segment revenue without segment allocation blocks dominance;
- strict `>50%`; exactly 50% fails;
- no summing available segments as the denominator;
- no combining separate segments to manufacture dominance;
- units, scale, currency, reporting period, accounting scope, revision lineage and provenance remain explicit.

### Frozen 32-pair canary

Membership remained unchanged:

- pairs: **32**
- unique identities: **31**
- membership fingerprint: `b159764fd342aad3901717e04446596e93aa87d9c6726b7b3dd7ef8b55026dce`

Final measured counts:

| Measure | Result |
|---|---:|
| Semantic canary pairs | **32** |
| Eligible audited consolidated annual source | **24** |
| Accounting block — segment/base period-context mismatch | **12** |
| Accounting-incomplete | **12** |
| No eligible audited consolidated annual source | **8** |
| Comparable segment-revenue pairs | **0** |
| Dominant-business candidates | **0** |
| Candidate complete company classifications | **0** |
| Authoritative complete classifications | **0** |
| Candidate unique routes | **0** |
| Authoritative routes | **0** |
| Complete normalized-input pairs | **0** |
| Negative-control promotions | **0** |

Accounting fingerprint:

`cce3a731431ade7caf697ef7af036074c1cbb5e5ce27ead0f833df3b02e09d50`

Final classification/router fingerprint:

`146206681ac7cc7f5f2978b8d7f1954afca56ce65aa7082e1ec17d2c2f032667`

### Primary accounting evidence gaps

The blocker is now source/accounting comparability rather than missing taxonomy vocabulary.

Observed overlapping diagnostics:

- `REPORTABLE_SEGMENT_FACTS_PRESENT_BUT_PERIOD_CONTEXT_MISMATCH`: **12 pairs**
- `INTERSEGMENT_REVENUE_MISSING`: **12 pairs**
- `TOTAL_SEGMENT_REVENUE_MISSING`: **4 pairs**
- `NO_ELIGIBLE_AUDITED_CONSOLIDATED_ANNUAL`: **8 pairs**

In some audited annual filings, the base `FourD` context is full-year while `FourReportableSegmentRevenue...` facts have literal XBRL context dates covering only a quarter, even where the values appear annual-sized. V1 deliberately does not infer annual semantics from the `Four` label or numeric magnitude.

This is a critical fail-closed boundary.

### Six prior exact Basic-Industry cases

All six prior exact-leaf canary cases were inspected:

- five have an eligible audited consolidated annual source;
- one has no eligible audited consolidated annual source;
- zero prove a comparable annual segment numerator under V1;
- zero produce a dominant company-level classification.

Therefore historical segment descriptions such as Pharmaceuticals, Commercial Vehicles, Education, Sugar and Edible Oil remain **segment evidence**, not whole-company classification.

### Policy status

Repository search still found no recorded owner approval for OD1–OD3.

A consolidated adoption package now proposes:

- OD1 — approve frozen November-2022 taxonomy vocabulary for retrospective organization of strictly point-in-time company evidence;
- OD2 — approve versioned evidence-backed semantic synonym mappings under review control;
- OD3 — approve the **strict frozen V1 accounting contract**, not an informal >50% shortcut;
- OD4 — remains blocked.

Crucially, approval would adopt policy only. It would **not** make this canary pass or authorize full expansion.

### Expansion boundary

The full historical denominator remains:

- B2 eligible: **121,956 pairs / 4,524 identities / 32 dates**
- provisional candidate surface: **25,761 pairs / 877 identities**

The 25,761-pair surface was **NOT processed**.

The pre-existing expansion gate still fails because complete company classification = 0 and unique methodology route = 0.

Any future proposal to reinterpret the filing's column semantics differently from the literal XBRL segment context dates must be a **new semantic contract version**, with explicit evidence, explanation and full frozen-canary rerun. It is not approved or implied by this closure.

### Verification

Final workflow: **37217432181 — SUCCESS**

Focused accounting / semantic tests: **18 / 18 PASS**

Actual `RESEARCH_PROFILE_ROUTING_V2` smoke guards passed. Repeat deterministic fingerprint matched.

### Authoritative artifacts

- [Methodology source assessment JSON](p8/PortfolioAI_P8_SEGMENT_REVENUE_METHODOLOGY_SOURCE_ASSESSMENT_2026-10-04.json)
- [Methodology version assessment](p8/PortfolioAI_P8_SEGMENT_REVENUE_METHODOLOGY_VERSION_ASSESSMENT_2026-10-04.md)
- [Segment-revenue contract](p8/PortfolioAI_P8_HISTORICAL_SEGMENT_REVENUE_CLASSIFICATION_CONTRACT_V1.json)
- [Segment-revenue specification](p8/PortfolioAI_P8_HISTORICAL_SEGMENT_REVENUE_CLASSIFICATION_SPEC_2026-10-04.md)
- [Canary source/accounting audit](p8/PortfolioAI_P8_SEGMENT_REVENUE_CANARY_SOURCE_ACCOUNTING_AUDIT_2026-10-04.json)
- [Canary classification/route audit](p8/PortfolioAI_P8_SEGMENT_REVENUE_CANARY_CLASSIFICATION_AUDIT_2026-10-04.json)
- [Consolidated owner-adoption package](p8/PortfolioAI_P8_SEGMENT_REVENUE_CONSOLIDATED_OWNER_ADOPTION_PACKAGE_2026-10-04.md)
- [Closure audit](p8/PortfolioAI_P8_SEGMENT_REVENUE_CLASSIFICATION_CLOSURE_AUDIT_2026-10-04.json)
- [Closure memo](p8/PortfolioAI_P8_SEGMENT_REVENUE_CLASSIFICATION_CLOSURE_2026-10-04.md)

Safety boundary: Supabase writes 0; R2 writes 0; migrations 0; deployments 0; scheduler activation 0; new company-source acquisition 0; Production/main changes 0; experiment execution 0; B5/B6/B-FINAL rebuild 0; P8-C 0; return/performance/forward/holdout reads 0.

## P8 Complete Four-Tier Taxonomy Authority Build + Frozen Canary Revalidation — 4 October 2026

**Current-state precedence:** This entry supersedes the prior four-tier mapping next-step statement only for the separately authorized complete-taxonomy authority task. Earlier P8 closures remain authoritative for their historical scopes.

**Implementation / tests = COMPLETE / PASS.**  
**Official four-tier vocabulary = COMPLETE AS DEVELOPMENT REFERENCE CANDIDATE.**  
**PortfolioAI canonical adoption = PENDING OWNER APPROVAL.**  
**Historical company complete classification = BLOCKED.**  
**Exact disposition: `COMPLETE_FOUR_TIER_TAXONOMY_BUILT_PENDING_OWNER_POLICY_ADOPTION`.**

### Official taxonomy authority

A read-only official NSE Indices reference fetch produced a complete candidate from:

- authority: **NSE Indices Limited**
- document: **Industry Classification Structure — November 2022**
- official PDF SHA-256: `ed6a4af212460747510ca551bb14634ab8ef81bb5dee59a33d5d6973e3129dd1`
- generated taxonomy payload SHA-256: `e68821b19212f38a475bacd9977e9ec316e113babce90becbbca8a7c59bbed96`

Validated declared hierarchy:

| Level | Count |
|---|---:|
| Macro-Economic Sector | **12** |
| Sector | **22** |
| Industry | **59** |
| Basic Industry | **197** |

Validation result: **0 errors / 0 orphan nodes / 0 empty names**.

This resolves the previous missing-vocabulary dependency at the reference-package level.

### Adoption status

The package remains:

`REFERENCE_CANDIDATE_PENDING_PORTFOLIOAI_OWNER_ADOPTION`

No repository evidence of explicit OD1–OD4 approval was found.

Owner-policy status remains:

- OD1 retrospective frozen taxonomy vocabulary: **PENDING OWNER DECISION**
- OD2 versioned evidence-backed synonym catalog: **PENDING OWNER DECISION**
- OD3 dominant-business inference: **PENDING OWNER DECISION**
- OD4 diversified specialised routing: **PENDING OWNER DECISION**

The execution request's proposed choices were not interpreted as approval.

### Frozen 32-case canary revalidation

The original frozen membership and fingerprint were reused unchanged.

| Measure | Result |
|---|---:|
| Semantic evidence retained | **32 / 32** |
| Pairs with exact official Basic-Industry evidence | **6** |
| Multi-segment exact-leaf cases blocked | **6** |
| Complete company-level taxonomy candidates | **0** |
| Authoritative complete classifications | **0** |
| Unique route candidates from complete classification | **0** |
| Authoritative methodology routes | **0** |
| Complete normalized-input pairs | **0** |
| Negative-control promotions | **0** |

Exact official leaves now evidenced inside the canary include:

- Pharmaceuticals — `IN060101001`
- Commercial Vehicles — `IN070202002`
- Education — `IN020602001`
- Sugar — `IN040101002`
- Edible Oil — `IN040101001`

All six exact-leaf evidence cases are multi-segment company contexts. Therefore exact leaf evidence cannot be promoted to company classification without an approved OD3 selection/dominance policy.

Canary revalidation fingerprint:

`04a89f697c95c0a403e4ab2c16fc6a1367b902169f6cc969732e1cc291c4616a`

### Expansion gate

The existing expansion gate remains unchanged.

- structurally complete taxonomy package: **PASS**
- mapping authority owner-adopted: **FAIL**
- OD1–OD4 approved: **FAIL**
- >=1 complete authoritative company classification: **FAIL**
- >=1 unique route from complete classification: **FAIL**
- repeat fingerprint: **PASS**
- negative controls remain unpromoted: **PASS**

Therefore:

- 25,761-pair broad processing = **NOT EXECUTED**
- full candidate semantic recovery = **NOT MEASURED**
- route-specific normalized-input completeness = **NOT EVALUATED**
- no experiment was frozen/executed
- P8-C remains **NOT AUTHORIZED**

### Owner adoption package

The review package proposes, but does not adopt:

1. OD1 — approve frozen later NSE taxonomy vocabulary for retrospective organization of strictly point-in-time company evidence with explicit taxonomy-version disclosure;
2. OD2 — approve a versioned evidence-backed synonym catalog while keeping broad/ambiguous phrases blocked;
3. OD3 — **do not approve dominant-business inference yet**; require a separate accounting/segment contract defining scope, period, comparability, eliminations and denominator semantics;
4. OD4 — keep diversified specialised routing blocked.

The precise remaining blocker is now:

**`OWNER_POLICY_ADOPTION_AND_MULTI_SEGMENT_CLASSIFICATION_POLICY`**

Safety boundary: no Supabase/R2 writes, migrations, deployments, Production/main changes, company-source acquisition, experiment execution, B5/B6/B-FINAL rebuild, P8-C, returns, performance, forward outcomes or holdout inspection.

## P8 Historical Four-Tier Taxonomy Mapping Authority + Canary Validation — 4 October 2026

**Current-state precedence:** This entry supersedes the prior taxonomy-normalization next-step statement only to record completion of the separately authorized four-tier mapping-authority task. Earlier P8 closures remain historical authority for their scopes.

**Implementation / tests = COMPLETE / PASS.**  
**Semantic evidence = CONFIRMED.**  
**Mapping authority = CANDIDATE / PENDING OWNER ADOPTION.**  
**Experiment feasibility = BLOCKED.**  
**Exact disposition: `HISTORICAL_FOUR_TIER_TAXONOMY_MAPPING_PENDING_OWNER_DECISION`.**

Authoritative task artifacts:

- [Authority inventory](p8/PortfolioAI_P8_HISTORICAL_FOUR_TIER_TAXONOMY_AUTHORITY_INVENTORY_2026-10-04.md)
- [Mapping specification](p8/PortfolioAI_P8_HISTORICAL_FOUR_TIER_TAXONOMY_MAPPING_SPEC_2026-10-04.md)
- [Machine-readable mapping candidate](p8/PortfolioAI_P8_HISTORICAL_FOUR_TIER_TAXONOMY_MAPPING_CANDIDATE_V1.json)
- [Owner decision package](p8/PortfolioAI_P8_HISTORICAL_FOUR_TIER_TAXONOMY_OWNER_DECISIONS_2026-10-04.md)
- [Frozen-canary validation](p8/PortfolioAI_P8_HISTORICAL_FOUR_TIER_TAXONOMY_CANARY_VALIDATION_2026-10-04.json)
- [Closure audit](p8/PortfolioAI_P8_HISTORICAL_FOUR_TIER_TAXONOMY_MAPPING_CLOSURE_AUDIT_2026-10-04.json)
- [Closure memo](p8/PortfolioAI_P8_HISTORICAL_FOUR_TIER_TAXONOMY_MAPPING_CLOSURE_2026-10-04.md)

### Authority inventory

The repository already encodes the intended NSE official four-field shape (`macroEconomicSector → sector → industry → basicIndustry`) in the K1 NSE classification adapter. However, the active Development taxonomy materialization remains only two levels:

- active taxonomy rows: **2**, both `SECTOR, INDUSTRY`;
- sectors: **8**;
- industries: **9**;
- verified source mappings: **9**.

No already-preserved K1 historical four-level snapshot was found in the repository or current R2 inventory. Gate-K remains an analytical methodology-routing taxonomy, not a complete economic hierarchy.

### Frozen 32-case canary validation

The exact frozen canary was reused unchanged.

| Measure | Result |
|---|---:|
| Semantic evidence retained | **32 / 32** |
| Authoritative partial taxonomy pairs | **5** |
| Authoritative partial unique identities | **4** |
| Authoritative Sector + Industry pairs | **2** |
| Conditional / pending-owner pairs | **4** |
| Unsupported or ambiguous pairs | **23** |
| Complete four-tier authoritative pairs | **0** |
| Authoritative methodology-route pairs | **0** |
| Route candidates from partial proof | **2 pairs / 2 identities** |
| Complete normalized-input pairs | **0** |

The two partial route candidates resolve to existing **PHARMA_V1** from exact `Pharmaceuticals` evidence plus the existing canonical two-level parent relationship. They remain `ROUTE_CANDIDATE_FROM_PARTIAL`, not authoritative routes, because Macro-Economic Sector and Basic Industry are absent.

Canary validation fingerprint: `661f2acf48eb8a626d9fbaa658f9ab6f9ab5701533884da14c96819918907461`.

### Owner-controlled decisions

The candidate does not silently adopt four policies:

1. OD1 — later frozen taxonomy vocabulary versus decision-date-contemporaneous taxonomy versions;
2. OD2 — exact labels only versus an owner-reviewed versioned semantic synonym catalog;
3. OD3 — no dominance inference versus explicit approval of the previously proposed >50% eligible segment-revenue rule;
4. OD4 — fail-closed diversified handling versus later design of a separate diversified analytical treatment.

The previous >50% rule is explicitly **not owner-frozen**.

### Expansion / experiment boundary

The existing expansion gate is preserved. It fails because the mapping candidate is not adopted, complete four-tier classification remains 0, and authoritative routes from complete classification remain 0.

Therefore:

- full semantic recovery over 25,761 provisional candidates = **NOT MEASURED**;
- no full census was executed;
- no route-specific normalized metric evaluation was executed;
- no narrower experiment was frozen or executed;
- `P8-C` remains **NOT AUTHORIZED**.

The full historical denominator remains **121,956 B2-eligible pairs / 4,524 identities / 32 dates**, with **25,761 provisional candidate pairs / 877 identities**.

This closure is **not primarily a missing-source-evidence failure**. The material blockers are incomplete four-tier taxonomy materialization, unapproved mapping policy, and ambiguous/multi-business semantics in a subset. Methodology is downstream: two PHARMA route candidates already exist, but cannot become authoritative before full classification proof.

Safety boundary: provider calls 0; new source acquisition 0; Supabase/R2 writes 0; migrations 0; deployment 0; Production/main changes 0; B5/B6/B-FINAL rebuild 0; experiment execution 0; P8-C 0; performance/forward/holdout reads 0.

## P8 Historical Taxonomy Evidence-Normalization Build — 4 October 2026

**Current-state precedence:** This entry supersedes the previous contract-resolution next-step statement by recording completion of the separately authorized bounded semantic-normalization build. Earlier P8-B, narrower-feasibility and contract-resolution records remain authoritative for their historical scopes.

**Implementation / focused tests = COMPLETE / PASS.**
**Semantic extraction canary = COMPLETE / PASS.**
**Historical classification / methodology route / normalized-input feasibility = BLOCKED.**
**Exact disposition: `HISTORICAL_TAXONOMY_EVIDENCE_NORMALIZATION_BLOCKED`.**

Frozen pre-measurement controls:

- canary: `P8_HISTORICAL_TAXONOMY_CANARY_V1`
- canary membership: **32**
- canary membership fingerprint: `b159764fd342aad3901717e04446596e93aa87d9c6726b7b3dd7ef8b55026dce`
- normalization contract: `P8_HISTORICAL_TAXONOMY_EVIDENCE_NORMALIZATION_V1`
- canary deterministic fingerprint: `69b9c2a93587b8178117c7b47f42065cb08b375ad0aa1b6bacf6c42b390d0259`

Authoritative artifacts:

- [Normalization specification](p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_EVIDENCE_NORMALIZATION_SPEC_2026-10-04.md)
- [Machine-readable normalization contract](p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_EVIDENCE_NORMALIZATION_CONTRACT_V1.json)
- [Frozen canary manifest](p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CANARY_MANIFEST_2026-10-04.json)
- [Canary audit](p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CANARY_AUDIT_2026-10-04.json)
- [Source semantic excerpts](p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_CANARY_SOURCE_EXCERPTS_2026-10-04.json)
- [Coverage audit](p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_EVIDENCE_NORMALIZATION_COVERAGE_AUDIT_2026-10-04.json)
- [Closure memo](p8/PortfolioAI_P8_HISTORICAL_TAXONOMY_EVIDENCE_NORMALIZATION_CLOSURE_2026-10-04.md)

### Canary result

All **32/32** frozen canary members yielded recoverable source-cited semantic business/segment text from the official XML bodies already stored in R2.

Key canary counts:

| Measure | Result |
|---|---:|
| Semantic evidence recovered | 32 / 32 |
| Positional-label cases with semantic recovery | 11 |
| Historical-only identities with semantic recovery | 19 |
| Negative controls incorrectly promoted | 0 |
| Complete four-tier classifications proven | 0 |
| Methodology routes proven | 0 |
| Complete normalized-input pairs | 0 |

Examples recovered directly from official source facts include `Performance Polymers & Chemicals`, `Solar Photovoltaic Modules`, `EPC/Engineering Services`, `Oil Seed Extraction and Refining`, `Hospital Business`, `Pharma`, `Chemicals` and `Textiles`.

This proves the prior positional XBRL labels were masking useful business meaning already present in the filing instances. However, the stored repository authority still does not contain a complete historical **Macro-Economic Sector → Sector → Industry → Basic Industry** mapping capable of converting those recovered business descriptions into the required canonical economic hierarchy without inventing new synonyms or using current-state classification.

The exact remaining blocker is:

**`COMPLETE_FOUR_TIER_TAXONOMY_MAPPING_AUTHORITY_ABSENT`**

Gate-K remains an analytical Sector+Industry methodology router; it is not a complete historical four-tier economic taxonomy and cannot be substituted for classification proof.

### Expansion decision

The frozen canary gate required:

1. source-cited positional semantic recovery;
2. at least one complete historical classification;
3. at least one exactly-one methodology route from a complete classification;
4. repeat fingerprint match; and
5. zero unsupported promotion of negative controls.

Conditions 1, 4 and 5 passed. Conditions 2 and 3 failed. Therefore broad semantic processing of the 25,761 provisional candidate pairs was **NOT EXECUTED**.

The full denominator remains:

- B2 eligible: **121,956 pairs / 4,524 identities / 32 decision dates**
- provisional candidates: **25,761 pairs / 877 identities**
- primary dispositions: 60,531 no pre-decision evidence; 33,706 classification unresolved; 1,958 market blocked; 25,761 taxonomy unproven.

No narrower denominator was created from successful canary rows.

The proposed standards remain not owner-frozen: >=24 dates passes at 32; >=80% complete-input coverage fails at 0%; >=70% per retained date fails; >=60% per major methodology sector remains not computable without canonical classification proof.

**`P8_EXP_NSE_MONTHLY_6M_NARROWER_V2_PROPOSED` remains NOT FROZEN / NOT AUTHORIZED / NOT EXECUTED. P8-C remains NOT AUTHORIZED.**

No follow-on taxonomy acquisition, recovery loop or experiment build is authorized by this closure.

Execution boundary: provider calls 0; new source acquisition 0; Supabase writes 0; R2 writes 0; migrations 0; experiment execution 0; B5/B6/B-FINAL rebuild 0; P8-C 0; performance/forward-return/holdout reads 0; Production/main changes 0.

## P8 Historical Classification / Methodology Route / Metric Contract Resolution Audit — 4 October 2026

**Current-state precedence:** This entry supersedes the prior narrower-feasibility next-step statement only to record completion of the separately authorized contract-resolution audit. Prior P8-B and narrower-feasibility closure records remain historical authority for their scopes.

**Audit execution = COMPLETE / PASS. Research feasibility = BLOCKED.**  
**Exact disposition: `HISTORICAL_CONTRACT_RESOLUTION_BLOCKED`.**

Frozen pre-census candidate:

- contract version: `P8_HISTORICAL_CONTRACT_RESOLUTION_CANDIDATE_V1`
- Git blob SHA: `f459a4bd01ff8d25bcabbcef2195249553ddeb87`
- owner-approved: **NO**
- experiment-frozen: **NO**

Authoritative artifacts:

- [Contract-resolution specification](p8/PortfolioAI_P8_HISTORICAL_CLASSIFICATION_METHOD_ROUTE_METRIC_CONTRACT_RESOLUTION_2026-10-04.md)
- [Machine-readable contract candidate](p8/PortfolioAI_P8_HISTORICAL_CONTRACT_RESOLUTION_CANDIDATE_V1.json)
- [Coverage census](p8/PortfolioAI_P8_HISTORICAL_CONTRACT_RESOLUTION_COVERAGE_CENSUS_2026-10-04.json)
- [Audit](p8/PortfolioAI_P8_HISTORICAL_CONTRACT_RESOLUTION_AUDIT_2026-10-04.json)
- [Closure memo](p8/PortfolioAI_P8_HISTORICAL_CONTRACT_RESOLUTION_CLOSURE_2026-10-04.md)

Deterministic full-B2 census:

| Measure | Result |
|---|---:|
| B2-eligible pairs | 121,956 |
| Historical identities | 4,524 |
| Decision dates | 32 |
| Prior provisional candidate pairs | 25,761 |
| Prior provisional candidate identities | 877 |
| Classification-proven pairs under frozen candidate | 0 |
| Methodology-route-proven pairs | 0 |
| Complete-input pairs | 0 |

Mutually exclusive primary dispositions reconcile exactly to 121,956:

- `NO_PRE_DECISION_EVIDENCE`: **60,531**
- `CLASSIFICATION_UNRESOLVED`: **33,706**
- `MARKET_DATA_BLOCKED`: **1,958**
- `CLASSIFICATION_TAXONOMY_UNPROVEN`: **25,761**

Within the 25,761 provisional candidates, overlapping classification diagnostics are:

- `DIVERSIFIED_WITHOUT_SEMANTIC_FOUR_TIER_PROOF`: **8,719**
- `POSITIONAL_XBRL_MEMBER_NOT_TAXONOMY`: **17,042**
- `METHODOLOGY_ROUTE_UNPROVEN`: **25,761**
- `METRIC_SET_NOT_SELECTABLE_WITHOUT_ROUTE`: **25,761**

The frozen contract reuses the existing four-tier historical taxonomy requirement, `RESEARCH_PROFILE_ROUTING_V2`, Gate-K authority and the existing P7-IC methodology registry. No parallel taxonomy or scoring family was created. The current P7-IC registry contains **47 profiles / 26 families / 471 required signals**; **209** required signals expose evidence-code + minimum-period + freshness metadata in the central registry, while **262** rely on further profile-specific normalization authority. PortfolioAI Dev has **47 active canonical fundamental metric definitions**, but there is no universal historical raw-XBRL concept/unit/scale mapping for every route signal.

The current Workstream-D labels are useful contemporaneous segment evidence but do not prove canonical historical Sector + Industry + Basic Industry. Assigning a Gate-K profile from them would invent taxonomy. Pair-level route-specific metric evaluation therefore stops fail-closed before selecting a methodology metric set.

Proposed research standards remain **not owner-frozen**: >=24 dates passes at 32; >=80% overall complete-input coverage fails at 0%; >=70% each retained date fails; >=60% per major methodology sector is not computable without inventing routes.

**P8_EXP_NSE_MONTHLY_6M_NARROWER_V2_PROPOSED remains NOT FROZEN / NOT AUTHORIZED / NOT EXECUTED. P8-C remains NOT AUTHORIZED.**

The next possible task is **not automatically authorized**. If separately approved by the owner, it is a bounded historical taxonomy evidence-normalization build using already acquired source bodies only: derive semantic business labels from eligible pre-decision evidence, map them into the existing four-tier taxonomy without current-state backdating, prove exact existing-router paths, then measure route-specific normalized metric completeness. No provider/source acquisition loop is implied.

Execution boundary: provider calls 0; new source acquisition 0; Supabase writes 0; R2 writes 0; migrations 0; forward-return/performance/holdout reads 0; Production/main changes 0.

## P8 Narrower Experiment Design + Feasibility Audit — 4 October 2026

**Current-state precedence:** This entry supersedes the prior `VERSION_NARROWER_EXPERIMENT_REQUIRED` next-step statement only to record that the separately authorized narrower-design feasibility audit has now been performed. Historical P8-B recovery closure records remain unchanged.

**P8 Narrower Experiment Design + Feasibility Audit = COMPLETE / NO-GO / CLOSED.**

Exact disposition: **`NARROWER_EXPERIMENT_NO_GO`**.

Authoritative artifacts:

- [Narrower Experiment Decision Memo](p8/PortfolioAI_P8_NARROWER_EXPERIMENT_DECISION_MEMO.md)
- [Narrower Experiment Feasibility Audit](p8/PortfolioAI_P8_NARROWER_EXPERIMENT_FEASIBILITY_AUDIT.json)

Verified outcome-blind intersection against the existing B2 + B3 V2 + Workstream D evidence surface:

| Measure | Result |
|---|---:|
| Historical identities | 4,524 |
| Proven decision dates | 32 |
| B2-eligible identity/date pairs | 121,956 |
| Maximum current candidate pairs | 25,761 |
| Candidate historical identities | 877 |
| Candidate share of B2 denominator | 21.123192% |
| Replay-ready pairs | 0 |

Pair dispositions total exactly 121,956:

- `CANDIDATE_ROUTE_AND_REQUIRED_METRICS_UNPROVEN`: **25,761**
- `CLASSIFICATION_UNRESOLVED`: **33,706**
- `MARKET_DATA_BLOCKED`: **1,958**
- `NO_PRE_DECISION_EVIDENCE`: **60,531**

The 25,761 candidate pairs satisfy B2 eligibility, B3 V2 market readiness, official pre-decision evidence presence and Workstream-D provisional classification resolution. They are **not replay-ready** because Workstream D's segment-derived classification labels are not a frozen complete historical taxonomy contract; therefore exactly one historical classification → R6–R10 methodology route and its complete normalized required-metric set cannot yet be proven. Raw XBRL fact presence is not treated as normalized metric completeness.

The proposed research-governance standards were not relaxed: 32 dates satisfy the >=24 date floor, but 0% replay-ready coverage fails the proposed >=80% overall requirement; per-date and major-methodology-sector replay-ready coverage cannot be validly computed until the route contract is frozen.

The proposed identifier `P8_EXP_NSE_MONTHLY_6M_NARROWER_V2_PROPOSED` is **NOT FROZEN / NOT AUTHORIZED / NOT EXECUTED**. No B5/B6/B-FINAL rebuild is authorized from this result. **P8-C remains NOT AUTHORIZED.**

The next legitimate step, only under separate owner authorization, is a bounded Development-only contract-resolution audit using already acquired evidence: freeze a complete historical taxonomy/router, map each eligible historical classification to exactly one frozen R6–R10 methodology path, define the exact normalized metric requirements per path, and then remeasure point-in-time coverage. This result does not authorize provider acquisition, schema/database/R2 writes, experiment execution or outcome inspection.

Audit boundary: zero provider calls, zero new source acquisition, zero Supabase writes, zero R2 writes, zero Production/main changes, and zero performance/holdout/forward-return reads.

## P8-B Recovery Workstream E and B-FINAL closure — 4 October 2026

**Current-state precedence:** This entry supersedes earlier recovery-active and E-not-started statements. Historical audits and their original denominators remain preserved.

**Workstream E = COMPLETE / BLOCKED / CLOSED.**
**P8-B-FINAL = COMPLETE / BLOCKED / CLOSED.**

Verified GitHub Actions run: [37207914448](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/37207914448), completed successfully on `PortfolioAI-Development`. Workflow success confirms execution completion; it does not establish experiment feasibility.

Authoritative records:

- [Workstream E closure](p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_E_CLOSURE_2026-10-04.md)
- [Workstream E audit](p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_E_AUDIT_2026-10-04.json)
- [B-FINAL rerun audit](p8/PortfolioAI_P8_B_RECOVERY_B_FINAL_RERUN_2026-10-04.json)

Corrected results against **121,956 B2-eligible pairs**:

| Measure | Result |
|---|---:|
| B5 resolved paths | 0 |
| B5 blocked paths | 121,956 |
| B6 replay-ready | 0 |
| B6 excluded | 121,956 |
| Replay-ready coverage | 0% |
| B3 market foundation READY / BLOCKED | 82,504 / 39,452 |
| Proven decision dates / minimum | 32 / 24 |

B5 blockers total exactly 121,956: `HISTORICAL_CLASSIFICATION_CONTRACT_UNPROVEN` 27,719; `HISTORICAL_CLASSIFICATION_UNRESOLVED` 33,706; `NO_PRE_DECISION_EVIDENCE` 60,531.

Deterministic replay passed. Future evidence, current-state fallback and cross-security imputation were not used. The owner-approved exclusion ceiling remains `PENDING_OWNER_FREEZE`. Corrected B5 and B6 feasibility checks failed despite structural execution completion.

`P8_EXP_NSE_MONTHLY_6M_V1` remains stopped: **P8-B = BLOCKED — V1 DATA FOUNDATION INSUFFICIENT**. **P8-C = NOT AUTHORIZED**. The next legitimate disposition is **`VERSION_NARROWER_EXPERIMENT_REQUIRED`**: prepare a separately authorized, owner-reviewable narrower design before any outcome inspection. This closure update does not authorize that work or another recovery loop.

The recorded E run made zero provider calls, zero Supabase writes and zero Production/main changes; P8-C, holdout, forward returns and performance outcomes were not inspected. Corrected E artifacts do not imply that the original hosted B5/B6 objects were rewritten. B3's separate original-source forensic preservation obligation remains open.

## P8-B3 N6R-3 event-local blocker policy — 3 October 2026

**Status: COMPLETE / PASS. N6 V1 FROZEN / UNCHANGED. N6R-4 NOT STARTED. V2 MATERIALIZATION NOT STARTED.**

N6R-3 completed the Development-only event-local / segment-local blocker simulation using the N6R-2 recovered dividend evidence.

- Policy version: `P8_B3_N6R3_EVENT_LOCAL_POLICY_V1`.
- N6R-2 recovered normalization IDs overlaid: **371**.
- Remaining unresolved event identities: **169**.
- Remaining unresolved event dates: **192**.
- Unique segment-boundary rows: **192**.
- Events without any raw row on/after the event: **0**.

Frozen policy:

- N6 V1 is never overwritten.
- Pre-event segment: usable as an independent segment.
- Unresolved transition: block only the cross-boundary return.
- Post-event segment: usable as a new independent segment.
- Segment restart: daily return = NULL and TRI resets to 1000.
- Unresolved dividend:
  - raw/price path remains usable;
  - total-return transition is blocked.
- Unresolved rights/demerger/bonus/other capital action:
  - the cross-boundary price/total-return transition is blocked;
  - both sides remain independently usable segments.
- No price carry-forward.
- No V2 materialization in N6R-3.

Measured daily-series impact:

- N6 V1 total raw-linked rows: **1,854,978**.
- N6 V1 READY: **1,395,996**.
- N6 V1 BLOCKED: **458,982**.
- Projected V2 price-usable rows under N6R-3 policy: **1,854,978**.
- Projected V2 price-blocked rows: **0**.
- Return-boundary rows: **192**.
- Whole-identity blocked rows recoverable: **458,982**.

Measured decision-ledger impact:

- N6 V1 READY: **60,616**.
- N6 V1 complex-action blockers: **20,787**.
- N6 V1 no-trade blockers: **40,553**.
- Projected READY under event-local policy: **81,394**.
- Projected complex-action blockers: **9**.
- Projected no-trade blockers: **40,553**.
- Complex blockers recoverable: **20,778 / 20,787**.

Formal artifacts:

- `docs/p8/PortfolioAI_P8_B3_N6R3_EVENT_LOCAL_POLICY_AUDIT_2026-10-03.json`
- `docs/p8/PortfolioAI_P8_B3_N6R3_EVENT_BOUNDARY_MATRIX_2026-10-03.csv`

N6 V1 remains unchanged. N6R-4 staleness analysis is not started. N6R-5/V2 materialization is not started. Production and `main` remain unchanged.

**STOP boundary:** N6R-3 is complete. Do not begin N6R-4 or V2 materialization without a new owner instruction.

## P8-B3 N6R-2 dividend blocker recovery — 3 October 2026

**Status: COMPLETE / PASS. N6 V1 FROZEN / UNCHANGED. N6R-3 NOT STARTED.**

N6R-2 completed a Development-only, read-only dividend recovery pass against the canonical R2 raw-price authority.

- Recovery version: `P8_B3_N6R2_DIVIDEND_RECOVERY_V1`.
- Dividend recovery units examined: **563**.
- RECOVERED events: **371**.
- Still BLOCKED events: **192**.
- Historical identities with at least one recovered event: **295**.
- Previously BLOCKED normalization events with uniquely parseable dividend cash terms recovered: **93**.
- Factor events recoverable from exact historical-identity-bound previous/ex-date R2 rows: **371**.
- Recovery method:
  - exact `historical_identity_id` only;
  - unique economic row required on each relevant date;
  - no symbol inference;
  - no price-drop inference;
  - no non-trading-date remap;
  - no multi-component cash distribution summation without a separately approved rule.
- Remaining blocker outcome counts:
  - multi-component dividend requires separate policy: **132**
  - identity absent on both previous and ex date: **43**
  - dividend cash amount not uniquely parseable: **14**
  - effective date not a proven trading date: **1**
  - ex-date conflicting economics: **1**
  - identity absent on previous date only: **1**
- The pass confirms many N5 dividend blockers were caused by the old `historical_identity_id + raw_symbol + raw_series` lookup being too strict. Exact identity-only R2 evidence recovers cases where the R2 symbol/series differs from the corporate-action observation while the historical identity is unambiguous.
- Examples observed in recovered evidence include R2 series/symbol transitions such as:
  - `BCONCEPTS`: corporate-action key EQ, canonical R2 row BE;
  - `SEMAC`: corporate-action key EQ, canonical R2 row BE;
  - `ALIVUS` observation resolved to R2 `GLS`;
  - `LTM` observation resolved to R2 `LTIM`;
  - `TIPSMUSIC` observation resolved to R2 `TIPSINDLTD`.
- Recovery ledger:
  `docs/p8/PortfolioAI_P8_B3_N6R2_DIVIDEND_RECOVERY_2026-10-03.json`.
- Full event matrix:
  `docs/p8/PortfolioAI_P8_B3_N6R2_DIVIDEND_RECOVERY_MATRIX_2026-10-03.csv`.
- N6 V1 was not overwritten.
- R2 catalog remains unchanged with SHA:
  `39c10f5c5a1cfe51908110953950aa4e05be8f6275ace200ae6cb2325999aa72`.
- Production and `main`: **UNCHANGED**.

**STOP boundary:** N6R-2 is complete. Do not begin N6R-3 event-local blocking/V2 series logic without a new owner instruction.

## P8-B3 N6R-0 / N6R-1 blocker remediation baseline — 3 October 2026

**Status: N6R-0 COMPLETE / PASS. N6R-1 COMPLETE / PASS. N6 V1 FROZEN / UNCHANGED.**

N6R-0 froze the completed N6 V1 output as the immutable remediation baseline:

- N6 V1 adjusted-series rows: **1,854,978**
  - READY: **1,395,996**
  - BLOCKED: **458,982**
- adjusted-series partitions: **744**
- N6 V1 adjusted-series aggregate fingerprint:
  `7f7f14c7af972baa22e0363732a285df1e4f3e0631d8134ce665ac32397c8a76`
- frozen B2 decision ledger: **121,956** pairs
  - READY: **60,616**
  - BLOCKED: **61,340**
  - complex corporate-action blockers: **20,787**
  - no-trade-on-decision-date blockers: **40,553**
- decision-ledger aggregate fingerprint:
  `9ec30b0c8ea30e5d8068be570a8b251964efc5ef725d795165666b5223b275ae`
- N6 completion fingerprint:
  `59992c038e74f83ccb278dce0af73ed6cbd97ba2064c67cd724e0df531a4ca12`
- baseline freeze:
  `docs/p8/PortfolioAI_P8_B3_N6R0_BASELINE_FREEZE_2026-10-03.json`
- N6 V1 overwrite is prohibited; any remediation output must be versioned separately.

N6R-1 completed the exact blocker-event census:

- blocked historical identities: **439**
- blocker events: **562**
  - normalization blockers: **141**
  - factor blockers: **421**
- blocker-event date range: **2023-10-17 through 2026-09-25**
- action-family identity counts:
  - CASH_DIVIDEND: **303**
  - RIGHTS: **119**
  - DEMERGER: **36**
  - BONUS: **3**
  - identities may overlap between action families
- remediation-category counts:
  - dividend remediation only: **282**
  - rights economics remediation only: **107**
  - demerger lineage remediation only: **27**
  - bonus terms remediation only: **2**
  - multiple corporate-action causes: **21**
- N6 V1 whole-identity blocking policy is confirmed as the direct cause of the broad **458,982-row** blocked surface.
- full blocker census:
  `docs/p8/PortfolioAI_P8_B3_N6R1_BLOCKER_CENSUS_2026-10-03.json`
- full 439-row matrix:
  `docs/p8/PortfolioAI_P8_B3_N6R1_BLOCKER_IDENTITY_MATRIX_2026-10-03.csv`
- N6R2 / V2 adjusted-series materialization: **NOT STARTED**.
- Production and `main`: **UNCHANGED**.

**STOP boundary:** N6R-0 and N6R-1 are complete. Do not alter N6 V1 or begin N6R-2 remediation logic without a new owner instruction.

## P8-B3 N5 adjustment-factor materialization — 3 October 2026

**Status: COMPLETE / PASS. N6 NOT STARTED.**

Owner-authorized N5 is formally closed in Development.

- Normalization authority: `P8_B3_NORMALIZATION_V1`.
- Adjustment authority: `P8_B3_ADJUSTMENT_V2`.
- Arithmetic policy: `P8_B3_ARITHMETIC_V1`.
- READY normalizations requiring factor treatment: **4,982**.
- READY normalizations without a factor row: **0**.
- Total N5 factor rows: **4,983** across **4,983 distinct normalization IDs**.
- Duplicate factor rows: **0**.
- READY factors: **4,562**.
- BLOCKED factors: **421**.
- Invalid factor states: **0**.
- One factor is the retained N3 canary demerger blocker linked to a BLOCKED normalization; it is outside the 4,982 READY-normalization coverage denominator.
- Factor coverage by family:
  - BONUS: 139 READY / 139 total
  - SPLIT: 38 READY / 38 total
  - CASH_DIVIDEND: 4,385 READY + 286 BLOCKED / 4,671 total
  - RIGHTS: 0 READY + 134 BLOCKED / 134 total
  - DEMERGER canary: 1 BLOCKED
- Dividend blockers:
  - 285: exact historical-identity-bound previous/ex-date R2 price pair unavailable
  - 1: effective date is not a proven raw-price trading date
- Rights blockers: 134; subscription terms are normalized, but deterministic rights-price treatment is not owner-approved.
- Factor payload integrity:
  - READY split rows missing factor math: 0
  - READY bonus rows missing factor math: 0
  - READY dividend rows missing required cash/reference/link fields: 0
  - BLOCKED rows carrying prohibited factor math: 0
  - invalid/missing SHA-256 hashes: 0
  - missing calculation inputs: 0
  - missing effective dates: 0
- Raw R2 catalog remains unchanged at **1,854,978 rows / 744 partitions** through **2026-09-30**.
- Raw catalog SHA remains `27c73dbf9d0e0b9ad9a0c2259d4375335278acc2af049e103f386c31ebd6352f`.
- Adjusted-series rows: **0**.
- N6: **NOT STARTED**.
- Formal audit:
  `docs/p8/PortfolioAI_P8_B3_N5_COMPLETION_AUDIT_2026-10-03.json` = **PASS**.
- Production and `main`: **UNCHANGED**.

**STOP boundary:** work stops after N5 as owner requested. Do not start N6 adjusted-series materialization without a new owner instruction.

## P8-B3 N0–N3 normalization canary — 3 October 2026

**Status: COMPLETE / PASS WITH TEST-RUNNER OBSERVABILITY LIMITATION.**

Owner-approved N0–N3 was executed Development-only and stopped before N4.

- N0 preflight: source-completion audit PASS; R2 catalog still 1,854,978 raw rows / 744 partitions through 2026-09-30.
- N1 deterministic normalization classifier implemented:
  - `src/features/backtesting/p8CorporateActionNormalization.ts`
- N2 explicit missing-price blocker classifier implemented:
  - `src/features/backtesting/p8MissingPriceBlocker.ts`
- N3 bounded canary persisted:
  - 5 corporate-action normalizations
  - 4 adjustment-factor rows
  - 0 adjusted-series rows
- READY normalizations: TCS dividend, FOCUS split, GENSOL bonus, GRASIM rights.
- BLOCKED normalization: BOROLTD demerger.
- READY factors:
  - FOCUS split: share factor 5; price back-adjustment factor 0.2
  - GENSOL bonus 2:1: share factor 3; price back-adjustment factor 0.333333333333333333333333333333
- BLOCKED factors:
  - GRASIM rights: deterministic rights-price treatment not owner-approved
  - BOROLTD demerger: successor entitlement / valuation lineage not proven
- Direct replay inserted **0 normalizations / 0 factors**, proving append/idempotency at this canary boundary.
- No-action control identity retained 0 action observations / 0 normalizations / 0 factors.
- Adjusted-series fail-closed R2 identity gate remains unchanged; adjusted-series rows remain 0.
- Raw R2 catalog SHA remains `27c73dbf9d0e0b9ad9a0c2259d4375335278acc2af049e103f386c31ebd6352f`.
- Canary fingerprint: `6ae872401c8b2cce3752354620614b6e8ac5060b298763f787bffd911a45b8bb`.
- Formal direct-canary audit:
  `docs/p8/PortfolioAI_P8_B3_N0_N3_DIRECT_CANARY_AUDIT_2026-10-03.json`.
- GitHub Actions did not persist the focused Vitest run during this session, and the isolated runner had no network path to GitHub; this limitation is recorded explicitly rather than treated as a test PASS.
- Production and `main`: unchanged.

**Next gate:** N4–N6 full normalization / factor / adjusted-series materialization is **NOT AUTHORIZED** and requires owner approval. The R2-backed adjusted-series identity contract must be designed before N6 can write any adjusted-series row.

## P8-B3 raw source-acquisition completion verification — 3 October 2026

**Status: SOURCE ACQUISITION / RAW HISTORY = COMPLETE / PASS. P8-B3 overall remains ACTIVE / NOT CLOSED.**

The Development-only R2-native raw market-history campaign and the required separate verification audit are complete.

- Campaign: `P8_B3_FULL_SOURCE_ACQUISITION_20261001_V1`.
- Official NIFTY 500 TRI campaign rows/dates: **744 / 744**, from **2023-10-03 through 2026-09-30**.
- Official NSE CM bhavcopy archives: **744 / 744**:
  - legacy: **189**
  - UDiFF: **555**
- R2 canonical raw-price partitions: **744 Parquet + 744 partition manifests**.
- Canonical raw-price rows: **1,854,978**.
- R2 source-content authority objects: **744 / 744**.
- Corporate-action monthly archives: **36 / 36**.
- Corporate-action observations: **6,703**:
  - RESOLVED: **6,078**
  - AMBIGUOUS: **184**
  - UNRESOLVED: **441**
- Derived B3 rows remain **zero**:
  - corporate-action normalizations: 0
  - adjustment factors: 0
  - adjusted market-price series: 0
- B3 security controls: all six B3 tables have RLS enabled with at least one policy; direct `anon` / `authenticated` table grants are zero.
- R2 raw-price catalog/manifest row parity: **PASS**.
- Aggregate raw-partition fingerprint: `178039ccb14f1f2417f2e4fe7f04acf647e2a93ce856d5c6c9bc272cfbeaee12`.
- Frozen B2 authority remains **32 decision dates**, **2024-02-29 through 2026-09-29**, exactly as P8-B2 closed.
- Raw-price coverage measured against B2 **eligible** membership on those 32 dates:
  - eligible security/date pairs: **121,956**
  - same-day raw-price pairs present: **81,403**
  - same-day raw-price pairs absent: **40,553**
  - measured same-day coverage: **66.747843%**
- These missing same-day rows are **not silently imputed**. They must become deterministic explicit blockers or be handled under the separately approved normalization/adjusted-series contract.
- Formal audit: `docs/p8/PortfolioAI_P8_B3_SOURCE_COMPLETION_VERIFICATION_2026-10-03.json` = **PASS**.
- Production and `main`: **UNCHANGED**.

**Next gate:** prepare the corporate-action normalization / adjustment-factor / adjusted-series proposal and explicit missing-price blocker policy. Do not materialize normalization, factors or adjusted series until separately owner-authorized.

## P8-B3 storage remediation and PostgreSQL retirement — 2 October 2026

**Status: COMPLETE / PASS for database-size remediation and permanent R2 runtime.**

Development-only storage remediation is complete after explicit owner approval.

- PortfolioAI Dev full PostgreSQL backup to Cloudflare R2: **PASS**.
- Verified encrypted backup object: ~188.3 MB; full R2 download, decrypt, SHA-256 and `pg_restore --list` validation passed.
- Canonical R2 export: **PASS**.
- Exact preserved rows:
  - B3 raw prices: 532,575
  - B2 listing observations: 562,790
  - B2 listing evidence: 562,790
  - B2 universe members: 144,768
- R2 runtime raw-price projection: **532,575 rows / 6,135 objects**.
- Focused live Worker smoke: **PASS** for health, catalog and real RELIANCE historical-price retrieval from Cloudflare R2.
- Bulk PostgreSQL retirement migration: **APPLIED / PASS** on PortfolioAI Dev only.
- Retired relations:
  - `p8_b3_raw_market_price_observations`
  - `p8_historical_listing_observations_v3`
  - `p8_historical_universe_member_listing_evidence_v3`
  - `p8_historical_universe_members_v3`
- No `CASCADE` was used. Dependent views/functions/FK were handled explicitly and legacy writer RPCs now fail closed.
- PortfolioAI Dev database size fell from **1,531,079,827 bytes** to **115,190,931 bytes** (~115 MB).
- PostgreSQL is writable again: `default_transaction_read_only=off`, `transaction_read_only=off`.
- Development project status: **ACTIVE_HEALTHY**.
- Operational/control-plane sanity check retained 1 portfolio, 284 securities, 496 transactions, 263 latest prices, 317 B3 source-archive metadata rows, 6,704 corporate-action observations and 745 benchmark rows.
- R2 runtime implementation merged into `PortfolioAI-Development` through PR #103; merge commit `ccbcbb51b14d53e47a29a24d21ff7cc2a433c64f`.
- Production database and Production runtime were not modified.

Remaining preservation note: complete raw official NSE source-byte archival/verification remains a separate open preservation task. Database evidence and canonical R2 Parquet/runtime copies are protected, but this does not claim that every original NSE source file byte has already been copied to R2.

## Program A · A2A closure — 23 September 2026

Program A · A2A is COMPLETE / PASS / CLOSED.

The bounded Trendlyne classification prerequisite cohort completed locally and normalized the five pilot holdings into reviewed canonical taxonomy:

- ALIVUS → Pharma / Pharmaceuticals
- AUROPHARMA → Pharma / Pharmaceuticals
- BIOCON → Pharma / Pharmaceuticals
- HDFCBANK → Banking / Private Sector Bank
- SYNGENE → Pharma / Pharmaceuticals

The Trendlyne adapter now uses the current provider response contract, exact canonical identity reconciliation, safe provider error propagation, reviewed mapping-pair normalization, and immutable raw evidence with canonical normalized values.

A2 stage isolation held correctly: classification changes invalidated the prior plan and stopped progression before A2B/A2C.

Fresh V10 zero-call plan:
- A2A = 0 actions
- A2B = ALIVUS Complete Research, 4 projected Trendlyne calls
- A2C = 4 projected Angel One calls
- actual PLAN calls/writes = 0

Program A · A2 remains IN PROGRESS.
A2B and A2C are NOT AUTHORIZED until separate owner review/approval.

No production migration, deployment, merge, score/recommendation/sizing activation, scheduler activation, AI activation, or trading occurred.

# PortfolioAI — Development Status

**Status:** Living implementation and handover record  
**Current branch:** `PortfolioAI-Development`
**Current milestone:** P8-B3 is ACTIVE. The Development-only B3 source-acquisition/raw-history campaign is COMPLETE / PASS with 744/744 proven trading dates and 1,854,978 canonical raw-price rows in R2. The separate source-completion verification audit is PASS. B3 overall is not closed because corporate-action normalization, adjustment factors, adjusted market-price/return series, and explicit treatment of missing same-day eligible-member prices remain unmaterialized and separately approval-gated. P8-B4 and P8-C+ remain not started/not authorized. Production and main remain unchanged
**Last reviewed:** 3 October 2026

This document records current implementation reality, completion level, known limitations, and the next gated work. Detailed historical implementation evidence remains in stage plans/completion records and Git history.


## P7-IC final planning coherence approval — 29 September 2026

Final read-only Codex audit result: **A. APPROVE**.

The audit confirmed that the repository planning package at `c567a3b8b1b3321fc19b72e41bcb0f6645defcc0` and the corrected V2 owner plan are aligned with no material current contradiction. The audit specifically confirmed:

- complete held-portfolio methodology completion remains the IC1 target;
- complete R7 policy coverage remains mandatory for every held-portfolio methodology/profile/subprofile;
- Gate K remains historically COMPLETE / PASS / CLOSED;
- checkpoint barriers are coherent: IC1→IC-B, IC2/IC3→IC-C, IC4/IC5→IC-D, IC6→IC-E;
- IC5 produces R7 candidacy/sizing readiness only and no owner-facing action state;
- canonical action projection occurs in IC6 only after R8 + Movement exist;
- canonical internal action states remain `ACCUMULATE / HOLD / WATCH / REDUCE / EXIT_REVIEW`;
- IC-A remains a future owner decision and may authorize strengthened IC1 plus persistence/access design only; migration creation/application remains separately approval-gated.

Governance remains:

```text
P7 = ACTIVE
IC0 = BLOCKED / AUDIT COMPLETE / PASS WITHHELD
IC-A = AWAITING OWNER APPROVAL
IC1 = NOT STARTED / NOT AUTHORIZED
P8 = NOT AUTHORIZED
Production = UNCHANGED
```

No build, provider call, migration, database write, deployment or Production change was authorized by this planning approval.


## P7-IC operational amendment — cache-first sector-aware completion — 28 September 2026

The owner clarified the required real-portfolio completion model and it is now frozen into the authoritative P7-IC plan and Post-D roadmap.

Current mandatory rules:

- all stock pages share one universal design shell; methodology-specific blocks vary by sector/industry/basic-industry/subprofile;
- methodology validation is by methodology/subprofile, not by every display-sector label; existing Gate H-K reference cases are reused when valid;
- a reference stock validates a methodology contract only; every held equity still requires its own company evidence/readiness lineage;
- provider-backed research is cache-first: fresh validated evidence is reused and planned provider calls for it are zero;
- accepted Trendlyne/Angel observations are persisted with provider provenance, normalized value, evidence/as-of date, retrieval date, freshness/stale boundary, evidence status and selected/canonical state;
- normal Research/Holdings/Intelligence/Dashboard browsing must make zero Trendlyne and zero Angel One historical calls;
- stale cached evidence remains visible but clearly marked stale and cannot silently qualify as current score-ready evidence;
- stock research cards/details must expose evidence/period date, last fetched/retrieved date and freshness state;
- Trendlyne rollout is by exact bounded cohorts. The current planning ceiling is 400 calls/day; default P7-IC planned usage is 320/day with approximately 80 calls reserved for bounded retries/diagnostics/exceptions;
- five Trendlyne calls/security is only a conservative budget model. For 239 equities this is 1,195 calls before cache savings; exact execution counts come from the missing/stale/conflicting evidence matrix;
- at the default 320/day envelope, a nominal five-call stock allows roughly 64 equities/day and about four worst-case provider days; completed cohorts may progress only within the currently approved checkpoint range and must stop at the next unapproved owner checkpoint;
- R7 canonical output remains Core Candidate / Satellite Candidate / Watch / Avoid or fail-closed blocker. Canonical internal owner-facing action states are `ACCUMULATE / HOLD / WATCH / REDUCE / EXIT_REVIEW`; the UI may render “Buy / Accumulate” or “Sell / Exit Review” as display copy, but `BUY`/`SELL` are not additional internal recommendation/action enums;
- P7 remains open until P7-IC IC-FINAL and Owner Checkpoint 6.

Production/main remain unchanged by this documentation amendment.

## P7-IC portfolio-completion mandate — strengthened before IC-A approval — 28 September 2026

IC0 proved that the current held-equity universe still contains 124 `METHODOLOGY_NOT_AVAILABLE` equities and 5 `REVIEW_REQUIRED` equities, while the currently resolved methodologies do not yet all have completed R7 threshold policies.

The owner has therefore strengthened IC1 before authorizing it.

Mandatory IC1 completion rules now are:

- Gate K remains historically closed; P7-IC reuses its methodology isolation/portability discipline without reopening the gate.
- Every current held equity must resolve through `Sector → Industry → Basic Industry / Business Model → Subprofile where needed → COMPLETE methodology`.
- "Complete methodology" means a full versioned research/scoring/recommendation contract, not a placeholder adapter.
- A complete methodology includes required evidence, metric applicability/N/A, dimensions/weights/curves, quality/durability/growth, capital-efficiency/cash-flow, leverage/credit, valuation, benchmark/peer authority, ownership/governance, momentum/risk, cycle normalization where relevant, freshness/blockers, deterministic R6 semantics, a complete R7 policy, reference validation, isolation tests and future-stock portability.
- For a current held equity, `METHODOLOGY_NOT_AVAILABLE` caused by historically deferred methodology engineering is now an IC1 work item, not an acceptable IC1 closure state.
- Every methodology/profile/subprofile used by current held equities must leave IC1 with an approved complete R7 policy; `...RECOMMENDATION_PENDING_THRESHOLDS` is not an IC1 completion state.
- Remaining unresolved holdings after IC1 may be only genuine factual/classification `REVIEW_REQUIRED` exceptions with explicit reasons and next actions.
- IC1 must make methodology-to-evidence requirements machine-readable enough for IC2 to compute exact fresh/stale/missing/conflicting evidence deficits and provider demand.
- P7-IC must not defer completion of current held-portfolio methodologies/recommendation policies into a later cleanup program.
- Canonical internal owner-facing action states are `ACCUMULATE / HOLD / WATCH / REDUCE / EXIT_REVIEW`, deterministically derived from R7 + R8 + Movement/context; display copy may say “Buy / Accumulate” or “Sell / Exit Review”, but score alone cannot create an action state.
- Action-state projection occurs only in/after IC6 once current R8 and Movement inputs exist; IC5 produces R7 candidacy and sizing readiness only.

IC-A remains pending. IC1 has not started and is not authorized until the owner explicitly approves this strengthened scope and the required additive persistence-design boundary.

### IC-A checkpoint and persistence clarification

Before IC-A is approved, the following authority boundaries are frozen:

- IC1 stops at IC-B.
- IC2 and IC3 stop at IC-C.
- IC4 and IC5 stop at IC-D.
- IC6 stops at IC-E.
- No bounded cohort may cross an unapproved owner checkpoint.
- IC-A may authorize strengthened IC1 and **design-only** work for additive persistence/access gaps identified by IC0.
- IC-A does not authorize migration creation/application, provider execution, Production change or deployment.
- Methodology requirement registries/read models needed for exact IC2 deficit planning must exist before provider-backed IC2 execution.
- Canonical current evidence-snapshot persistence/access must be resolved before IC3 PASS / IC-C.
- Durable R9 baseline/acknowledgement/snooze plus multi-period Movement history must be resolved before IC6 PASS / IC-E.
- If any migration is required, the exact additive migration returns for separate owner approval.


## Post-D P4 read-only baseline & bounded-cohort proposal — 26 September 2026

P4 planning/readiness work is **COMPLETE / READY FOR OWNER CHECKPOINT 4A**.

Authoritative plan:
`PortfolioAI_POST_D_P4_BOUNDED_COHORT_PLAN.md`

Machine-readable current snapshot:
`docs/p4/PortfolioAI_P4_CURRENT_READINESS_SNAPSHOT_2026-09-26.json`

Proposed cohort:
- HDFCBANK — mature Bank reference;
- TORNTPHARM — mature Pharma/DOMESTIC_FORMULATIONS reference;
- M&M — non-Pharma K4 reference;
- BEL — missing-industry classification prerequisite;
- BANKBARODA — fail-closed missing price/classification/Angel identity case.

Initial staged provider envelope proposed for 4A:
- Trendlyne classification: maximum 2 calls;
- Trendlyne evidence after mandatory replan: maximum 6 calls;
- Angel One security history after mandatory replan: maximum 3 requests;
- benchmark calls: zero initially because Development benchmark identity/readiness is not sufficient.

**Visible UI impact: NONE.**

No provider execution, database write, migration, paid AI, scheduler activation, score/recommendation/sizing persistence, Production mutation, merge to `main`, Production deployment or trading occurred.

Owner Checkpoint 4A is required before any provider-backed cohort execution. Owner Checkpoint 4B is not reached.

### Owner Checkpoint 4A approval and execution boundary — 26 September 2026

Owner Checkpoint 4A is **APPROVED** for the frozen five-security cohort and stated call ceilings.

Execution was evaluated immediately after approval. The first P4A-1 classification step did **not** make a provider call because the currently deployed `refresh-trendlyne-classification` function has two relevant safety contracts:

- its exact bounded `A2_EXECUTE` route explicitly rejects hosted/non-local Supabase targets;
- hosted execution still requires the internal classification token, and no connected execution tool exposes an approved exact-cohort invocation path carrying that token.

The generic hosted `RUN` path was not substituted because it selects its own highest-value unclassified cohort and would violate the owner-approved exact P4 cohort.

Therefore the safe result is:

```text
Owner Checkpoint 4A = APPROVED
P4A-1 provider calls = 0
P4A-1 writes = 0
Execution state = BLOCKED_SAFE
Reason = HOSTED_EXACT_COHORT_EXECUTION_PATH_NOT_AVAILABLE
Cohort definition = UNCHANGED
Call ceilings = UNCHANGED
```

No workaround that broadened scope, bypassed internal authentication, weakened the local-only guard, or used a different provider path was attempted.

**Visible UI impact: NONE.**

## Post-D P3 acceptance dataset & current-state register — 26 September 2026

P3 is **COMPLETE / PASS / CLOSED** after explicit Owner Checkpoint 4 approval.

P3 reused the operational Stage 5 Development acceptance dataset and the P0 current-state register. No dataset rebuild or recopy was performed.

Residual P3 work completed:
- the six-holding local regression fixture is permanently identified as `10000000-0000-4000-8000-000000000001` / `LOCAL UI Research Review`, expected six open holdings, LOCAL ONLY;
- the Development acceptance portfolio is separately frozen as `6193a4aa-3235-4057-bddc-209fcf443fc2` / `Consolidated Portfolio`;
- a read-only Development query confirmed the local fixture portfolio has zero rows in Development;
- machine-readable sanitization/licensing treatment is frozen in `docs/p3/PortfolioAI_P3_ACCEPTANCE_DATA_POLICY_V1.json`;
- a repeatable acceptance refresh/rebuild procedure is frozen in `docs/p3/PortfolioAI_P3_ACCEPTANCE_DATA_REFRESH_PROCEDURE.md`;
- fail-closed repository tools now verify dataset identity boundaries and generate refresh plans without performing a refresh.

Supporting P3 manifest:
`PortfolioAI_POST_D_P3_ACCEPTANCE_DATASET_CURRENT_STATE_REGISTER.md`

P3 implementation commit:
`05cc50f85230cc9e555e864f1abdc2db4a67a445`.

**Visible UI impact: NONE.** P3 changes only documentation and repository validation/planning tooling; no React/UI source was modified.

No Production mutation, migration, provider execution, scheduler activation, paid AI, trading, Production deployment or merge to `main` occurred.

Owner Checkpoint 4 was explicitly approved on 26 September 2026. P3 is formally closed.

**P4 — Existing Evidence & Market-Data Rollout is AUTHORIZED / NOT STARTED for planning, current-state audit, cost estimation and bounded-cohort proposal only.** Any provider-backed bounded cohort still requires the separate canonical **Owner Checkpoint 4A**. Portfolio-wide rollout requires **Owner Checkpoint 4B**.



### Owner Checkpoint 4 approval — 26 September 2026

The owner explicitly approved the P3 acceptance-dataset/current-state package.

This closes P3 as **COMPLETE / PASS / CLOSED** and authorizes **P4 — Existing Evidence & Market-Data Rollout** only for read-only planning, readiness reconciliation, cost estimation and bounded-cohort preparation.

P4 must reuse the existing R3/R5/Program A mechanisms in the canonical order: identity/eligibility → classification/profile readiness → current-price coverage → historical-price/benchmark coverage → fundamentals → valuation → ownership/governance → documents → news/event context.

**Owner Checkpoint 4A remains mandatory before any provider-backed bounded cohort is executed. Owner Checkpoint 4B remains mandatory before portfolio-wide Development rollout.**

This approval does not authorize Production mutation, Production migration, paid AI, scheduler activation, merge to `main`, Production deployment, PR merge/closure, or trading.

## Post-D P2 isolated Development environment residual reconciliation — 26 September 2026

P2 is **COMPLETE / PASS / CLOSED** after explicit Owner Checkpoint 3 approval.

P2 deliberately reused the already-complete Stage 4/Stage 5 environment work rather than rebuilding it. The supporting closure package is:

`PortfolioAI_POST_D_P2_ISOLATED_DEVELOPMENT_ENVIRONMENT_CLOSURE.md`

Pre-existing evidence accepted for P2:
- isolated Development Supabase project `lrgpjimipfkyoqbpsqzz`;
- repository-controlled schema reconstruction and byte-for-byte replay verification;
- Development Auth/RLS/ownership validation;
- 27 approved hosted Edge Functions;
- branch-scoped Vercel Development binding;
- canonical current-price path with no fallback authority;
- real-data browser acceptance;
- Production unchanged;
- providers, paid AI, scheduler and trading paths inactive.

The two residual P2 crossover safeguards identified by P0 were implemented in commit
`f3b5049502e957cee598288464ff4f49f96b7f9b`:
- Development/local runtime now rejects the known Production Supabase project ref;
- the stable Development preview must resolve to the approved Development Supabase project;
- visible `DEVELOPMENT` / `LOCAL` environment identity badges appear on auth and signed-in shells;
- deterministic unit coverage was added for environment identity and isolation assertions.

Vercel reported **SUCCESS** for safeguard commit
`f3b5049502e957cee598288464ff4f49f96b7f9b`.

No migration, provider execution, paid AI, scheduler activation, trading action, Production mutation, Production deployment or merge to `main` occurred.

Owner Checkpoint 3 was explicitly approved on 26 September 2026. P2 is formally closed. **P3 — Acceptance Dataset & Current-State Register is now AUTHORIZED but has not started.**



### Owner Checkpoint 3 approval — 26 September 2026

The owner explicitly approved the P2 isolated Development environment and crossover-safeguard package.

This closes P2 as **COMPLETE / PASS / CLOSED** and authorizes **P3 — Acceptance Dataset & Current-State Register** only.

P3 must reuse the existing Stage 5 Development acceptance dataset and current-state register. It is limited to the residual P3 work already frozen by P0: permanent deterministic fixture separation/reproducibility, sanitization/licensing treatment, and a repeatable acceptance-data refresh/rebuild procedure. It must not rebuild the Development environment or recopy data without evidence of a residual requirement.

P3 authorization does not authorize production mutation, production migration, provider execution, paid AI, scheduler activation, merge to `main`, production deployment, PR merge/closure, or trading.

## Post-D P1 source-code integration baseline — 26 September 2026

P1 is **COMPLETE / PASS / CLOSED** after explicit Owner Checkpoint 2 approval.

The first P1 reconciliation pass is documented in:

`PortfolioAI_POST_D_P1_SOURCE_CODE_INTEGRATION_BASELINE_MANIFEST.md`

Current P1 dispositions:

- `PortfolioAI-Development` remains the correct convergence codeline.
- Program A, Program C and Program D branch tips are ancestors of Development; no evidence of dropped Program A–D lineage was found.
- The `main` industry-first lock and final Vercel SPA rewrite are already functionally contained in Development.
- The earlier catch-all Vercel rewrite is superseded.
- The manual encrypted Production Supabase backup workflow is intentionally retained on `main` only as environment-specific Production operations configuration; it is not copied into Development.
- PR #101 is already contained in Development ancestry.
- PR #99 contributes no unique current functionality beyond an already-contained industry-first documentation sync.
- PR #98's older Pharma business-model routing is superseded by the later R4N/Gate subprofile authority in Development.
- PR #78's old Dashboard sizing UI is not ported during P1; the canonical R1/D35B sizing engine is present and sizing presentation is reserved for P7 UI consolidation.

No application-code patch has been required by P1 so far. No PR, Production environment, migration, provider, scheduler, paid-AI path or trading capability was modified.

Final P1 exact-head validation completed at `cab5b0f4059bb6858c4445a4b0f78f49dfd46a62`:

- P1 changed documentation only;
- no application source or migration changed;
- `main` remains unchanged at `d0cc52dfcf61fc9a884f139fcc7931b3bd73c57b`;
- exact-head Vercel deployment succeeded;
- inherited Stage 5 validation debt remains unchanged and documented.

Owner Checkpoint 2 was explicitly approved on 26 September 2026. **P2 — Isolated Development Environment & Schema Reconstruction is now AUTHORIZED but has not started.**

## Post-D P0 authority/readiness freeze — 26 September 2026

Post-D P0 is **COMPLETE / PASS / CLOSED** after explicit Owner Checkpoint 1 approval.

P0 completed a read-only/documentation-only current-state reconciliation against the canonical architecture, current Development/Production topology, Git divergence and open PR graph. It created:

- `PortfolioAI_POST_D_CURRENT_CAPABILITY_READINESS_REGISTER.md`
- `PortfolioAI_POST_D_P0_AUTHORITY_READINESS_FREEZE.md`

Key frozen conclusions:

- Programs A–D remain historically valid at their proven maturity; they are not reclassified as failures.
- Existing pre-P0 work toward P1/P2/P3 is explicitly recognized and must not be rebuilt without evidence of a residual requirement or defect.
- P1 is **PARTIALLY COMPLETE** and still requires deliberate disposition of the main-only backup workflow and the remaining open-PR ancestry/content.
- P2 is **PARTIALLY COMPLETE / NEAR COMPLETE** from Stage 4/5 environment work; only residual crossover-proof/owner-closure items remain.
- P3 is **PARTIALLY COMPLETE** because the production-equivalent Development dataset is operational, while permanent regression-fixture separation, sanitization/licensing treatment, and a repeatable acceptance-data refresh procedure remain to be formalized.
- `main` was not merged or modified.
- Production was not mutated.
- No source-code implementation, migration, provider call, paid AI call, scheduler activation, PR mutation, deployment or trading action occurred.

P0 exit criteria are recorded as PASS. Owner Checkpoint 1 was explicitly approved on 26 September 2026. **P1 — Source-Code Integration Baseline is now AUTHORIZED but has not started.**

## Stage 5 Development data validation — 26 September 2026

Stage 5 is **COMPLETE / PASS** on `PortfolioAI-Development`.

The stable Development Preview is
`https://portfiolio-ai-git-portfolioai-development-dibyendu-dutta.vercel.app/`
and is branch-scoped to Development Supabase project
`lrgpjimipfkyoqbpsqzz`. Production remains
`https://portfiolio-ai.vercel.app/app` backed by
`uxiyufbsbgzzdujzcdxe`; it was used read-only and was not modified.

The Development owner `dr.d.dutta@gmail.com` resolves the copied real
`Consolidated Portfolio`: 496 transactions, 273 security histories, 248 open
holdings, 25 closed histories, 248 cached latest-price rows (244 for current
open holdings in the copied reference scope), 251 market-data mappings, 236
classified non-ETF open holdings, 525 fundamental observations, 251 news
records, five recommendations, five broker accounts, five owner portfolio
settings, two themes and 13 open theme memberships. All Production ownership
references were remapped to the Development Auth user. No `DEV*` transaction is
present in the real portfolio; retained synthetic securities are orphaned
immutable audit evidence and do not enter holdings.

Accounting, transaction provenance, broker attribution, classification,
research evidence, news, recommendation and RLS paths resolve through the
existing canonical authorities. The UI correctly preserves incomplete data:
three non-ETF open holdings lack reviewed classification; four current open
holdings lack copied price coverage; most portfolio roles remain Unclassified
because only five owner-controlled settings exist in Production; and sparse or
missing score/research states remain unavailable or review-required rather than
being fabricated.

Two bounded integration defects were corrected. Development branch builds no
longer embed a Supabase key or force `VITE_MARKET_DATA_ENABLED=false`; the
frontend now consumes the branch-scoped Vercel variables. The Vercel SPA rewrite
preserves direct `/app` and `/app/*` navigation. No second price authority,
fallback value, migration, provider call, scheduler, paid-AI action, trading
action or Production mutation was introduced.

Latest Stage 5 implementation commit: `21f2a9e` (merged with the owner-authored
SPA routing commit in the Development branch). The authoritative closure and
row-level evidence are in
`PortfolioAI_STAGE_5_DEVELOPMENT_DATA_MANIFEST.md`; the final closure commit SHA
is reported in the Stage 5 handoff.

Post-Stage Reconciliation decision: the Development environment setup work completed through Stage 5 is now frozen as the baseline for formal Post-D convergence. **Post-D P0 is the next authorized planning/reconciliation stage.** Dev Setup Stage 6 and Stage 7 remain **NOT STARTED** and are not the current next step. P0 must explicitly recognize verified pre-existing P1/P2/P3 work as COMPLETE, PARTIAL, NOT STARTED, or INTENTIONAL DIFFERENCE / DEFERRED, and only residual work may proceed.

## Stage 4 Dev backend reconstruction — 26 September 2026

Stage 4 is COMPLETE / PASS. The separate Supabase project `PortfolioAI Dev`
(`lrgpjimipfkyoqbpsqzz`) now contains the repository-controlled database
baseline plus approved later migrations, 27 approved hosted Edge Functions and
only project-managed Supabase secrets. Its public schema is byte-for-byte
identical to a fresh repository-local replay.

The environment remains deliberately safe and empty: no production users or
business records were copied, no application Storage bucket was required, no
cron job was installed, and Angel One, Trendlyne, OpenAI and scheduler
credentials remain unset. Production `uxiyufbsbgzzdujzcdxe` was inspected
read-only and was not modified. Full findings, intentional differences and
advisor observations are recorded in
`PortfolioAI_STAGE_4_DEV_BACKEND_RECONSTRUCTION_MANIFEST.md`.

The next development-data stage may create a controlled Dev identity and
bounded realistic acceptance fixtures. It must not activate providers,
schedulers, paid AI, trading or production mutation without separate approval.
Post-D P0 remains NOT STARTED.

## Program A · Checkpoint A1 status — 23 September 2026

A1.1 planner/contract implementation is COMPLETE / PASS.

Implemented in A1.1:
- reusable Program A eligibility resolver;
- R3 evidence-coverage planner;
- R5 market-history planner;
- incremental history-window logic;
- benchmark dependency inventory;
- projected provider-cost planner;
- bounded pilot-cohort selection;
- zero-provider / zero-write safety contract.

Important scope clarification:
- A1.1 proves the planning contract with deterministic tests and frozen current-portfolio fixtures;
- it does not yet materialize the real current portfolio baseline directly from the owner's actual canonical cache/read-only stores.

A1.2 subsequently materialized the planner from actual local cache/read-only data and generated a real baseline for the six-holding `LOCAL UI Research Review` validation cohort.

Local inventory confirmed that no full owner portfolio dataset is presently available in local Supabase, so the six-holding cohort is accepted as the A1 runtime validation cohort.

Final status:
- A1.1 = COMPLETE / PASS;
- A1.2 = COMPLETE / PASS;
- Program A · A1 = COMPLETE / PASS / CLOSED;
- Program A = IN PROGRESS;
- provider execution = NOT YET AUTHORIZED.

No provider execution, production mutation, migration, score/recommendation/sizing persistence, scheduler activation, AI activation, deployment or merge is part of A1. Program B scorer activation remains out of scope.

## Post-K scoring reconciliation closure — 23 September 2026

PKR-1 / PKR-1B is COMPLETE / PASS / CLOSED.

The live Research scoring path is now aligned with the Gate-K fail-closed architecture:
- unsupported methodology → METHODOLOGY_NOT_AVAILABLE;
- missing/conflicting classification → REVIEW_REQUIRED;
- completed K4 methodology may be AVAILABLE while score execution remains PENDING_ADAPTER;
- K4 engines no longer substitute legacy GENERAL numeric scoring before Program B / R6 activates the correct sector scorer adapter;
- reviewed K4 assignments cannot bypass this guard;
- PHARMA_V1 and supported BANK scoring remain available;
- NBFC_LENDING remains fail-closed;
- explicit canonical GENERAL assignments remain separately supported where genuinely reviewed.

Local validation passed for targeted regressions, K-FINAL, TypeScript, architecture guard and production build. Full-repository lint retains inherited errors outside this reconciliation and is not a PKR regression.

Program A remains NOT STARTED.

## Post-Gate-K reconciliation — 23 September 2026

Gate H through Gate K materially advanced the research methodology architecture beyond the older R3/R4 roadmap wording.

Current reconciled state:
- Gate K is COMPLETE / PASS;
- the sector-specific research layer is portfolio-coverage complete/fail-closed for the frozen Gate-K scope;
- one universal Research workspace remains authoritative;
- PHARMA_V1, BANK_NBFC and ten additional K4 sector-engine families coexist under registry-driven routing/isolation;
- unsupported methodology remains METHODOLOGY_NOT_AVAILABLE and unresolved/conflicting classification remains REVIEW_REQUIRED;
- this is methodology/routing coverage, not proof of portfolio-wide company evidence, score-run, recommendation-run or sizing coverage.

The older roadmap item **R4 — Generic sector/profile Research contracts** is therefore superseded/completed by the H→K work, especially Gate K. The remaining canonical work begins with **R3 research-evidence breadth** and **R5 market-history breadth**, followed by readiness-driven R6/R7 execution and later R8–R12 portfolio engines/operations.

No canonical Gate L or Gate M is currently defined or required. See `PortfolioAI_POST_GATE_K_ARCHITECTURE_AND_ROADMAP_AUDIT.md`.

## A. Project identity

PortfolioAI is the private `drddutta-portfolio/PortfiolioAI` repository for a personal investment decision-support system covering a diversified Indian portfolio across multiple broker/demat accounts. It is not an autonomous investment adviser, order-execution bot, or trading bot; investment decisions remain with the owner.

- Frontend: React, Vite, strict TypeScript.
- Backend: Supabase Auth, PostgreSQL, Row Level Security, RPCs, and Edge Functions.
- Portfolio: one consolidated portfolio across distinct broker/demat accounts.
- Holdings remain transaction-derived.
- Angel One remains current-price and daily-OHLCV authority.
- Trendlyne remains a structured research-evidence provider behind PortfolioAI's provider-neutral storage/control plane.
- NSE/official sources remain authoritative for the implemented News Intelligence pipeline.

## B. Canonical document hierarchy

Authority descends in this order:

1. `PortfolioAI_Master_Blueprint.md`
2. `PortfolioAI_Research_and_Intelligence_Architecture.md` for source ownership, derived metrics, scoring lineage, and intelligence boundaries
3. `PortfolioAI_Single_Source_of_Truth_Architecture.md` for application-wide canonical business facts, shared access paths, and cross-page consistency
4. `PortfolioAI_Database_Architecture.md`
5. `PortfolioAI_Development_Rules.md`
6. `PortfolioAI_Product_UI_and_Decision_Workflow.md`
7. this Development Status
8. `PortfolioAI_Requirements_Register.md`
9. stage-specific plans, the Integration & Execution Plan, and completion records

`PortfolioAI_Integration_and_Execution_Plan.md` remains the repository-governed execution roadmap, subordinate to canonical architecture and unable by itself to authorize production changes.

## C. Current verified portfolio/application foundation

### Transactions, accounting, portfolio structure

- 249 current open holdings in the consolidated portfolio.
- 240 current non-ETF equities and 9 ETFs.
- Transaction-derived accounting and portfolio weights are operational.
- Roles, themes, target/min/max weights, watchlist/frozen state and related portfolio settings remain owner-controlled settings, not engine-assigned facts.
- Browser access remains constrained by the existing RLS/security model; trusted transaction history and source evidence remain auditable and non-destructively corrected.

### Current prices and market evidence

- 248/249 current holdings had latest cached Angel One prices in the most recently reconciled snapshot.
- Dashboard Daily Move uses cached previous-close evidence and remains cache-only.
- Historical OHLCV / market-derived momentum, volatility and drawdown coverage is not portfolio-wide. Reference/pilot work exists; Stage 7.3/R5 must not be described as portfolio-wide complete.

### Classification and Dashboard

The current application-wide classification authority is the reviewed enrichment layer:

`current_security_enrichment_v1`

Dashboard Allocation & Performance consumes this source for sector, industry and market-cap classification. R2E aligns shared portfolio consumers with the same authority so Dashboard, Holdings, Portfolio Structure, Research, Research Coverage and future decision surfaces cannot maintain competing user-visible classifications.

Current production coverage baseline:

- 240/240 open equities have sector classification in `current_security_enrichment_v1`;
- industry detail remains materially narrower (48/240 in the R2C baseline);
- market-cap classification is portfolio-wide for current non-ETF equities in the Dashboard evidence layer;
- the application must preserve exact current classification labels rather than silently remapping them into a second user-visible taxonomy.

Research profiles/subprofiles remain separate downstream methodology and may not rewrite the application sector/industry/market-cap classification.

### Dashboard decision surfaces

- D34 Core Health / Exit-Risk readiness is UI COMPLETE / merged. It exposes advisory/readiness evidence and does not fabricate formal Core Health or Exit-Risk engine states.
- D35 Position Sizing Health UI implementation is complete in PR #78; merge/deployment state remains separate from implementation completion.
- R2E refactored existing Dashboard evidence reads behind shared repositories/hooks; no competing production data authority was introduced.

## D. Research, provider control, and News state

### Stage 7 research foundation

The Stage 7 provider-neutral evidence architecture, trusted Trendlyne adapter, provider control plane and controlled Cohort A path are implemented. Existing protections remain mandatory:

- source/provenance preservation;
- immutable/raw evidence separation from normalized/selected evidence;
- provider kill switch;
- freshness-aware planning;
- atomic budget reservation/settlement;
- per-call usage accounting;
- bounded retries and leases;
- cache-first normal application reads;
- no silent provider spending from Dashboard/Research browsing.

### Research breadth

The R2C read-only production baseline found research breadth materially narrower than the portfolio:

- approximately 25 held equities with at least one fundamental observation;
- 3 held equities with research-document records;
- 1 held equity with the substantial Angel One daily-history path;
- 4 reviewed scoring-profile assignments;
- 0 persisted `stock_score_runs` for current holdings at the R2C checkpoint;
- HDFCBANK recommendation preview/persistence evidence exists, but canonical persisted score-run lineage is not portfolio-wide.

This evidence proves architecture/reference paths, not portfolio-wide research or scoring completion.

### News Intelligence

Official NSE News Intelligence is automated and operational:

- official NSE ingestion is scheduled;
- normalization and holding matching are persisted;
- linked-document capture/text extraction has been validated in production;
- stored-evidence reclassification is scheduled;
- Dashboard News consumes cached normalized evidence;
- normal Dashboard browsing does not perform live NSE fetches.

The News automation does not authorize research, market-history, scoring or sizing scheduler activation.

## E. Stage 8 / R1 reconciliation

Stage 8 reference implementation/pilot has started; portfolio-wide Stage 8 rollout remains incomplete.

### R1 / D35B Position Sizing Engine

R1 is **ENGINE CONTRACT COMPLETE** and merged.

Verified repository contract includes:

- deterministic/versioned D35B engine;
- fail-closed prerequisite handling;
- research profile code/version/readiness lineage;
- score/recommendation lineage requirements;
- READY / INSUFFICIENT_EVIDENCE / BLOCKED_PREREQUISITE / NOT_APPLICABLE behavior;
- additive persistence migration committed to the repository;
- unit tests, strict TypeScript/lint/build verification;
- isolated migration + pgTAP verification.

Important boundary:

- the R1 production migration has **not** been applied;
- HDFCBANK remains the only genuine current research-backed sizing reference case;
- a plausible sizing range alone cannot make another stock READY.

## F. R2 Portfolio Coverage Registry / Orchestrator

R2 repository-side coverage work has reached **COVERAGE CONTRACT COMPLETE** with a **READ-ONLY PORTFOLIO BASELINE COMPLETE**.

Implemented repository-side concepts include:

- deterministic per-security/domain coverage planner;
- cache-only projection/summary logic;
- portfolio-wide read-only R2C baseline;
- explicit eligibility, freshness, missing/conflicting/review states and downstream blockers;
- fail-closed research-profile readiness;
- no provider call required merely to determine coverage/readiness.

R2C read-only production baseline:

- 249 open holdings;
- 240 equities;
- 9 non-equities;
- 240/240 equities have current sector labels through the Dashboard enrichment authority;
- research/history/scoring/recommendation breadth remains narrow as described above.

The earlier experimental R2 mapping of source labels into a separate 20-sector user-visible taxonomy is superseded for application display. PortfolioAI preserves the Dashboard classification as the shared application classification; research profile routing remains separate.

### R2D production integration

R2D is now **PRODUCTION INTEGRATION COMPLETE for the authenticated read-only endpoint**.

Production implementation:

- `public.get_portfolio_coverage_registry_v1(uuid, uuid)` is deployed as a `STABLE SECURITY INVOKER` function;
- `anon` and `authenticated` have no direct execute privilege;
- only `service_role` may execute the database function;
- the function independently checks that the supplied portfolio belongs to the supplied authenticated user id;
- Edge Function `portfolio-coverage-registry` is deployed with JWT verification enabled;
- the Edge Function validates the signed-in user, independently checks portfolio ownership, then calls the service-only database projection;
- application code has a shared `loadPortfolioCoverageRegistry()` repository boundary rather than direct browser access to provider-control tables;
- response is compact and aggregate-only for market history; raw candles and document bodies are not returned;
- response explicitly reports `providerCalls: 0` and `budgetConsumed: 0`.

Production verification established:

- correct owner id returns 249 open holdings;
- deliberately incorrect user id is rejected with SQLSTATE `42501` / `PORTFOLIO_NOT_AUTHORIZED`;
- registry sector coverage is 240/240 equities and uses `current_security_enrichment_v1`;
- HDFCBANK returns `Banking` and `LARGE_CAP`, matching the Dashboard enrichment source exactly;
- HDFCBANK recommendation history remains `PREVIEW` with null `sourceScoreRunId`, so R2D does not fabricate persisted score lineage;
- `sizingPersistenceAvailable` remains false because the R1 production sizing table has not been applied;
- provider usage-event, ingestion-run, score-run, recommendation-run and fundamental-observation counts were unchanged before/after R2D verification;
- no provider call, provider-budget use, evidence mutation, recommendation mutation or sizing mutation occurred.

The production Edge Function is deployed, but an end-to-end HTTP call using the owner's actual browser JWT was not available to the repository/tooling session. The authenticated HTTP path follows the same existing `auth.getUser()` production pattern used by other verified Edge Functions; database ownership enforcement and service-only execution were independently verified.

## G. R2E — Single Source of Truth Architecture

R2E is **MERGED / REPOSITORY ARCHITECTURE COMPLETE** via PR #84.

Its governing rule is:

> **One business fact, one authority, one deterministic owner, many consistent views.**

R2E introduced/enforces:

- canonical `PortfolioAI_Single_Source_of_Truth_Architecture.md`;
- machine-readable `src/contracts/canonicalDataAuthorities.ts`;
- authority-registry tests;
- `npm run check:architecture` presentation-boundary scanner;
- permanent `.github/workflows/architecture-guard.yml` CI enforcement;
- updated Development Rules, documentation map and agent pre-flight;
- shared Dashboard evidence repository/hooks replacing direct presentation-layer Supabase reads discovered by the guard;
- shared classification overlay so portfolio consumer pages receive the same sector/industry facts as Dashboard.

The architecture guard treats presentation-layer direct canonical-storage access as drift rather than allowlisting it.

R2E itself made no production database mutation, provider call, scheduler change, RLS/grant change or provider-budget consumption.

### R4M — shared profile-driven Research workspace

R4M is **UI COMPLETE / MERGED** in PR #100 at merge commit `de54ed1fa9569e9db0c14cfa8dac6dfbc2638c9f`; deployment and production state remain separate.

- HDFCBANK / BANK_NBFC remains the mature regression reference.
- TORNTPHARM / PHARMA_V1 uses the same Research page, hierarchy and interaction language while its profile contract supplies Pharma metrics, labels, applicability, refresh modules and readiness requirements.
- Shared score surfaces distinguish scored, evidence-only, no-evidence and not-applicable states. PHARMA_V1 remains fail-closed; no numeric Pharma score curves were invented.
- The reusable readiness summary receives profile-specific groups and details through an adapter. All 13 PHARMA_V1 contracts remain inspectable.
- The legacy HDFCBANK refresh-module JSX branch has been removed. Typed profile/reference-security eligibility metadata now feeds the shared refresh-module renderer while preserving the bounded HDFCBANK pilot and keeping other BANK_NBFC securities fail-closed.
- The UI pass made no migration, database/evidence write, provider call, score/recommendation/sizing write, Edge Function deployment or scheduler change.
- The authenticated localhost visual review found no unresolved shared-UI differences between HDFCBANK and TORNTPHARM.

### R4N-A/R4N-B — Research contract freeze and Pharma subprofile foundation

R4N-A/R4N-B is **PRODUCTION SCHEMA DEPLOYED / CONTRACT IMPLEMENTATION IN DRAFT PR #101** on `r4n-pharma-subprofile-architecture`.

- The universal Research workspace is frozen as `R4M_V1`; future profiles supply configuration and data rather than page trees.
- The typed `PHARMA_V1` subprofile assignment contract preserves immutable versions, effective intervals, review provenance, secondary exposures and fail-closed resolution.
- The owner-supplied 25-stock Pharma mapping is a noncanonical provisional fixture register; ZYDUSWELL is separately `OUTSIDE_PHARMA_V1 / CONSUMER_HEALTH_REVIEW`.
- Missing, provisional, disputed or conflicting required subprofile assignment permits parent evidence display but blocks readiness, scoring and recommendation.
- Machine-readable V1 evidence/readiness contracts now compose all five subprofiles onto the parent exactly once. Top-line readiness uses active Mandatory requirements only; Important and Supplementary coverage remain separate.
- The frozen TORNTPHARM 42-row official-evidence proposal now has an exact fixture and pure dry-run classifier against `PHARMA_V1 + DOMESTIC_FORMULATIONS`. It maps 36 rows to six parent mandatory requirements and keeps six R&D rows contextual; it satisfies zero subprofile-specific or condition-activation requirements and performs no ingestion.
- A pure local ingestion validator now checks security/profile identity, metric units, periods, numeric values, source artifacts, derived formula/input lineage, duplicate candidates and conflicts with existing facts. A separate schema-design note defines the append-only assignment authority and RLS boundary.
- The global contract registry, append-only assignment history, secondary exposures, reviewed-interval exclusion, held-security read policies and service-only mutation privileges are deployed in production with five contract rows and zero assignments/exposures. A new production-unapplied forward migration reconciles secondary-exposure lifecycle, confidence, effective-interval and reviewer provenance with the approved typed contract; it creates no exposure and requires separate production authorization. The complete active migration chain replays locally with that migration, its environment-appropriate R4N pgTAP suite passes 41/41, the public schema diff is empty, all 85 public tables retain RLS, and database lint has only the inherited coverage-registry volatility warning.
- A disposable local baseline replay verified the complete history and R4N migration without changing committed historical migrations, the ordinary local database or production. The replay required the documented MOTHERSON fixture and four temporary filename normalizations, plus two reported structural compatibility repairs for historical NEWS/pg_cron ordering and disabled-policy retirement. R4N applied last in the disposable stack; all 19 pgTAP tests and direct schema/RLS/grant/immutability/empty-state/no-network checks passed. The stack and volumes were destroyed. `docs/R4N_Local_Migration_Replay_Audit_and_Fixture_Strategy.md` records the full result.
- The production deployment was limited to the three recorded checksum-pinned migrations. No database assignment, secondary exposure, provider action, evidence ingestion, scoring method, recommendation or sizing write was part of that deployment.

Detailed implementation and review boundaries are recorded in `R4M_Profile_Driven_Research_Workspace_Plan.md`.

## H. Completion terminology

Use these labels instead of the ambiguous word “complete”:

1. **UI COMPLETE** — the consumer interface works.
2. **ENGINE CONTRACT COMPLETE** — deterministic algorithm/storage/tests work on reference cases.
3. **PILOT COMPLETE** — a controlled real cohort has passed.
4. **PORTFOLIO-WIDE COVERAGE COMPLETE** — every eligible holding was processed or explicitly marked unresolved/not applicable.
5. **AUTOMATION COMPLETE** — scheduler/event orchestration is safely operational.
6. **PRODUCT CAPABILITY COMPLETE** — use only when relevant lower-level gates genuinely justify it.

Current examples:

- D34: UI COMPLETE / merged.
- D35: UI implementation complete in PR #78; merge status separate.
- R1/D35B: ENGINE CONTRACT COMPLETE / merged; production persistence not applied.
- R2: COVERAGE CONTRACT COMPLETE; R2C READ-ONLY COVERAGE BASELINE COMPLETE.
- R2D: authenticated read-only production endpoint deployed and verified within the stated boundary.
- R2E: repository architecture/enforcement merged.
- Stage 8 scoring/recommendation: REFERENCE IMPLEMENTATION / PILOT ONLY, portfolio-wide incomplete.
- News Intelligence: automated operational capability for its defined official-NSE scope.

## I. Current limitations and unresolved breadth

These are explicit limitations, not invitations to fabricate values:

- one current holding remains outside latest cached-price coverage in the reconciled snapshot;
- historical OHLCV / momentum / volatility / drawdown evidence is not portfolio-wide;
- fundamental research breadth is far below all eligible equities;
- research-document breadth is narrow;
- sector/profile methodology architecture is now portfolio-coverage complete/fail-closed under Gate K, but company-specific evidence and score execution are not portfolio-wide;
- persisted deterministic score-run coverage is not portfolio-wide;
- recommendation coverage is still a reference path rather than portfolio-wide;
- formal Position Sizing persistence is not applied to production;
- formal Core Health, Exit Risk and Portfolio Fit engines are not portfolio-wide persisted engines;
- D34/D35 consumer surfaces must remain readiness/coverage surfaces until those engines exist;
- owner targets/min/max weights must never be overwritten by deterministic engine output;
- ETFs/non-equity assets must not be forced through equity-only scoring/sizing contracts;
- `INSUFFICIENT_EVIDENCE`, `NOT_APPLICABLE`, conflict/review states and missing values are valid outputs and must remain explicit.

## J. Next work

The owner-authorized migration baseline cutover is active in the repository and verified in the ordinary local database: 78 historical SQL files remain byte-identical in the legacy archive, while the active directory contains 74 unique-version compatibility markers followed by deterministic schema, reference-registry and inert local-operational baseline migrations. A pre-reset inventory proved the ordinary local database contained no auth users or business rows, then `supabase db reset --local` successfully applied all 77 unique versions. Post-reset verification passed 29/29 relevant pgTAP assertions, 82/82 Vitest files and 444/444 tests, typecheck, architecture guard, production build, empty schema diff, error-level database lint, 85/85 public-table RLS, zero scheduler jobs and zero business/evidence/score/recommendation/sizing rows. Historical SQL-inspection tests now read the immutable archive. Known non-blocking debt remains: one database volatility warning, the superseded Stage 7.2A final-state pgTAP expectation, existing repository ESLint errors and the build chunk-size warning. The separately authorized read-only production-history inventory found production/local migration-ledger divergence, so deployment used a reviewed isolated compatibility-marker bundle rather than the ordinary migration directory. The three checksum-pinned forward migrations were applied to production on 16 September 2026 after a successful backup and a refreshed owner-authorized 492-transaction baseline. Post-deployment validation confirmed all three ledger rows, five immutable R4N contracts, zero assignments/exposures, RLS on all three tables, NEWS V6 retired with V7 current, byte-identical cron state, the portfolio-weight ambiguity removed, anonymous execution revoked, and exact preservation of 1 portfolio, 492 transactions, 273 securities, 458 fundamental observations and 4 recommendation runs. Linked database lint passed without errors with the inherited coverage-registry volatility warning. `docs/R4N_Production_Deployment_2026-09-16.md` records the evidence. Assignment, evidence ingestion, provider execution and scoring remain independently gated.

Post-Gate-K, the broader repository sequence is reconciled as:

1. **R3 — research evidence breadth expansion** using the existing provider-control/budget/freshness safeguards;
2. **R5 — market-history breadth expansion** through Angel One authority;
3. **R6 — readiness-driven deterministic scoring rollout** using the Gate-K methodology authorities;
4. **R7 — recommendation and position-sizing rollout** only after adequate evidence/scoring readiness;
5. **R8–R10 — Core Health / Portfolio Fit / Risk / Exit / Movement / Combined Action Center**;
6. **R11–R12 — scheduled maintenance and optional AI synthesis**, only after upstream manual/cohort rollout proves safe.

The older **R4 — generic sector/research-profile contracts** objective is superseded/completed by H→K and must not be rebuilt under a new Gate L/M label.

R3/R5/R6 must continue to use shared application classification only as classification evidence; sector-specific research profiles remain their own versioned methodology contracts and must fail closed when mandatory evidence/source/history requirements are unmet.

Any production provider cohort, broad refresh, scheduler activation, or additional database deployment still requires its own explicit production approval.

## K. Non-negotiable controls for all next stages

- One business fact must have one canonical authority and one shared application access path.
- Presentation code must not directly create competing canonical-storage queries.
- Preserve source/provenance and raw/normalized/derived/score/explanation separation.
- Reuse provider-budget reservation, usage accounting, freshness, lease and kill-switch controls.
- Keep normal Dashboard/Research browsing cache-first.
- Do not silently mutate transactions, holdings, roles, themes, targets or portfolio settings.
- Do not treat sizing/valuation reduction as thesis-driven exit.
- Keep equity/non-equity applicability explicit.
- Preserve deterministic exact-decimal behavior where weights/financial values are calculated.
- Keep human-in-the-loop approval for investment decisions and all production-enabling steps.
- No production migration, provider cohort execution, scheduler activation or other production change without explicit owner approval.

## L. Historical implementation records

Detailed historical stage evidence remains in the repository's `Stage_*`, `*_Completion.md`, News Intelligence, Dashboard stage documents and Git history. Historical text remains accurate for its dated checkpoint; this file records the current implementation state subject to the canonical hierarchy above.
## Program A · A2C Edge-auth correction and provider-runtime blocker — 24 September 2026

Program A · A2C remains **IN PROGRESS / NOT CLOSED**.

The local Supabase Auth service accepted the current ES256 browser JWT while the
installed local Edge gateway rejected it before function dispatch. Gateway JWT
verification is now disabled only for the three A2C handlers that continue to
require an Authorization header, validate the user through Supabase Auth
`getUser()`, verify portfolio ownership, and apply their existing target and
capability guards. Valid authenticated PLAN requests now return HTTP 200 with
zero provider calls; missing, malformed, random and anonymous credentials return
HTTP 401 from the function-level validation.

The approved residual plan remains unchanged at
`be56e35fc3bd3e4bccd0816258c3d37cf080bcdb365549c12f92b9c9a363f9ee`.
All four A2C PLAN-only capability probes pass. Physical execution is still
blocked because Angel One session creation from the local Edge runtime returns
HTTP 403, although an equivalent safe host-side diagnostic with the same local
configuration returns HTTP 200 / `SUCCESS`. The resumed attempts made zero
historical-data calls and zero writes. No production change, migration,
deployment, A2A/A2B execution, Trendlyne call, scoring, recommendation, sizing or
trading action occurred.

## Program A · A2C bounded pilot closed — 24 September 2026

Program A · A2C is **COMPLETE / PASS / CLOSED** for its approved local bounded
pilot. After explicit loading of the authoritative untracked
`supabase/.env.local` into the local Edge runtime, Angel One authentication
returned HTTP 200 / `SUCCESS`. Safe env metadata matched between host and Edge,
and the main/current branches have the same direct Angel One request contract;
the prior HTTP 403 was intermittent rather than a demonstrated code or secret
mismatch.

The equivalent regenerated residual plan
`c4ad4d7daed469ab7e7df216458230e46c6041d6112fbf389438f3de9daee505`
completed with four Angel One calls, zero controller retries and 287 writes.
Together with the preceding successful partial attempt, the bounded A2C work
made six controller-accounted provider calls and 297 idempotent writes, producing
277 net new unique daily candles. Final coverage is AUROPHARMA 247 rows,
HDFCBANK 247 rows, NIFTY_BANK 271 rows and TORNTPHARM 274 rows, all current
through the latest completed 23 September 2026 trading session.

A fresh zero-call plan correctly retains only three overlap refresh actions for
the not-yet-final 24 September daily candle and no NIFTY_BANK action. No
Trendlyne call, production mutation, migration, deployment, merge, scoring,
recommendation, sizing, scheduling or trading activation occurred. The temporary
mode-600 JWT file was deleted and its absence verified.


## Program D · D0 contract freeze implementation — 25 September 2026

Program D is now the active development program on `program-d-operations-optional-ai`, but authorization remains limited to **D0 only**.

D0 has added a machine-readable static contract and a dedicated freeze document:

- `src/features/operations/programD0Contract.ts`
- `src/features/operations/programD0Contract.test.ts`
- `docs/PortfolioAI_PROGRAM_D_D0_CONTRACT_DEPENDENCY_DURABILITY_SAFETY_FREEZE.md`

The frozen D0 decisions are:

- R11 uses a dependency-driven R6–R10 DAG rather than a blind linear cascade;
- exact trigger taxonomy, no-op rules, semantic job identity, kill-switch order, retry classes and owner gates are encoded as static contract data;
- existing research provider controls, budgets, usage accounting, freshness state and compatible acquisition leases are reused rather than duplicated;
- existing market-data refresh state and leases are reused subject to later scheduler-hardening review;
- current Program B R6 and R7 execution outputs are non-persisting;
- Program C R8 is non-persistent and remains governed by its existing four-sub-engine dependency contract;
- R9 restart safety requires **Model B: a minimal complete semantic comparison checkpoint** because exact reconstruction of the previous complete semantic `ProgramCR9ObservedState` is not proven from durable history;
- D0 does not authorize creating or persisting that checkpoint;
- core R11 does not require a durable R10 operational snapshot; R10 remains canonical through recomputation;
- R12 remains optional, downstream and unable to override deterministic authority; competing action/priority output is `REJECTED_AUTHORITY_CONFLICT`.

Current state:

```text
D0 contract package = IMPLEMENTED ON PROGRAM D BRANCH
local pull / validation = PENDING
owner D0 closure = PENDING
D1 = NOT AUTHORIZED
```

No migration, provider call, AI call, scheduler activation, production mutation, deployment, merge, Program C semantic change or trading capability was introduced by this D0 package.


## Program D · D0 local validation — 25 September 2026

D0 is now **COMPLETE / PASS / AWAITING OWNER CLOSURE** on `program-d-operations-optional-ai`.

The owner pulled exact D0 HEAD `a21f987c7f3dbec78d33293f6d33de8a7308231c` locally and validated the package against the running local Supabase/Vite environment.

Validation passed:

- D0 contract test: 9/9;
- frozen Program C regression set: 63/63 across 5 files;
- targeted D0 ESLint: pass;
- TypeScript: pass;
- architecture guard: pass;
- production build: pass, with only the existing chunk-size warning;
- `git diff --check`: pass;
- no tracked local D0 drift or unexpected generated files.

No provider/AI calls, migrations, scheduler activation, production mutation, deployment, merge, R9 persistence, R10 snapshot persistence, sizing authority or trading capability were introduced.

D1 remains **NOT AUTHORIZED** and may not begin without separate owner approval.


## Program D · D0 closed / D1 authorized — 25 September 2026

Owner approval closes D0 as **COMPLETE / PASS / CLOSED** and authorizes **D1 — R11 Local Implementation** only.

D1 remains local/provider-free by default. No migration, durable R9/R10 persistence, real provider pilot, scheduler activation, production mutation, R12/AI activation, deployment, merge or trading is authorized by this transition.


## Program D · D1 R11 local implementation — 25 September 2026

D1 is **IMPLEMENTED ON GITHUB / LOCAL VALIDATION PENDING**.

The branch now contains a provider-free local orchestration layer with SHA-256 semantic identity, dependency/no-op planning, duplicate-trigger reuse, local lease/restart handling, downstream dry-run routing, disposable browser-local operational state, a dedicated authenticated Operations UI, and adversarial local tests.

D1 does not execute real providers or R6–R10 automatically. It creates no migration, scheduler, production mutation, R9/R10 persistence, R12/AI activation, deployment, merge or trading capability.

The next step is exact-HEAD local pull, localhost Operations UI review, and full D1 local validation. D2 remains not authorized.


## Program D · D1 local validation complete — 25 September 2026

D1 is now **COMPLETE / PASS / AWAITING OWNER CLOSURE** on `program-d-operations-optional-ai`.

Validated locally:

- Operations UI and four frozen D1 fixtures;
- corrected dependency/topological stage order;
- provider-call estimate path with zero physical calls;
- no-op planning;
- semantic dedupe;
- lease contention safety;
- restart/resume behavior;
- stale local-ledger invalidation;
- 83/83 D1/D0/Program C regression tests;
- targeted D1 ESLint;
- TypeScript;
- architecture guard;
- production build;
- `git diff --check`;
- clean tracked working tree apart from pre-existing local untracked artifacts.

No provider call, migration, scheduler activation, production mutation, R9/R10 persistence, R12/AI activation, deployment, merge or trading capability was introduced.

D2 remains **NOT AUTHORIZED**.


## Program D · D1 closed / D2 authorized — 25 September 2026

Owner approval closes D1 as **COMPLETE / PASS / CLOSED** and authorizes **D2 — R11 Validation & Bounded-Pilot Readiness** only.

D2 may perform local/adversarial validation and bounded-pilot readiness design. A real provider pilot remains separately unauthorized inside D2. No migration, scheduler, production mutation, R12/AI activation, deployment, merge or trading is authorized.


## Program D · D2 adversarial validation implementation — 25 September 2026

D2 is **IMPLEMENTED ON GITHUB / LOCAL VALIDATION PENDING**.

The branch now includes a local/provider-free adversarial validation harness for the frozen R11 D2 checklist, plus a bounded-pilot readiness contract and Operations UI matrix. The readiness contract explicitly keeps real provider execution unauthorized.

No provider call, migration, scheduler activation, production mutation, R9/R10 persistence, R12/AI activation, deployment, merge or trading capability was introduced.


## Program D · D2 local validation complete — 25 September 2026

D2 is now **COMPLETE / PASS / AWAITING OWNER CLOSURE**.

R11 is correspondingly **COMPLETE / PASS / AWAITING OWNER CLOSURE** for the authorized local/provider-free scope.

Validated locally:

- full D2 adversarial matrix in the Operations UI;
- D2/D1/D0/Program C regression suite;
- targeted D2 ESLint;
- TypeScript;
- architecture guard;
- production build;
- `git diff --check`;
- local working-tree audit.

No real provider pilot was run. Real provider execution remains separately unauthorized. No migration, scheduler activation, production mutation, R9/R10 persistence, R12/AI activation, deployment, merge or trading capability was introduced.

D3 remains **NOT AUTHORIZED**.


## Program D · D2/R11 closed / D3 authorized — 25 September 2026

Owner approval closes D2 and R11 as **COMPLETE / PASS / CLOSED** and authorizes **D3 — Optional R12 Local Implementation**.

D3 is local/mock/on-demand only with external AI calls and cost fixed at zero. Real AI-provider execution, scheduled AI, migration, production mutation, deployment, merge and trading remain unauthorized.


## Program D · D3 optional R12 local implementation — 25 September 2026

D3 is **IMPLEMENTED ON GITHUB / LOCAL VALIDATION PENDING**.

The branch now includes a versioned deterministic R12 fact packet, strict local validator, zero-cost local mock generator, cache reuse, and a dedicated Investment Committee workspace. R12 remains downstream and non-authoritative; real AI-provider execution remains unauthorized.


## Program D · D3 local validation complete — 25 September 2026

D3 is now **COMPLETE / PASS / AWAITING OWNER CLOSURE**.

The bounded local/mock R12 implementation is correspondingly **COMPLETE / PASS / AWAITING D4 VALIDATION**.

Validated locally:

- Investment Committee UI and deterministic-vs-AI separation;
- zero external AI calls and zero external cost;
- VALID first local generation;
- VALID cache reuse on unchanged packet + prompt version;
- numeric-identifier boundary correction;
- fail-closed browser cache parsing;
- D3/D2/D1/D0/Program C regressions;
- targeted D3 ESLint;
- TypeScript;
- architecture guard;
- production build;
- `git diff --check`;
- local working-tree audit.

No real AI provider call, scheduled AI, migration, production mutation, deployment, merge, sizing authority or trading capability was introduced.

D4 remains **NOT AUTHORIZED**.


## Program D · D3 closed / D4 authorized — 25 September 2026

Owner approval closes D3 as **COMPLETE / PASS / CLOSED** and authorizes **D4 — Optional R12 Validation**.

D4 is local/mock/adversarial only by default. Real AI-provider execution and cost remain separately unauthorized. D-FINAL remains not authorized.


## Program D · D4 R12 validation implementation — 25 September 2026

D4 is **IMPLEMENTED ON GITHUB / LOCAL VALIDATION PENDING**.

The branch now includes the complete frozen local R12 grounding/adversarial matrix and Investment Committee validation UI. Real AI-provider execution remains unauthorized and external AI cost remains zero.


## Program D · D4/R12 closed / D-FINAL authorized — 25 September 2026

Owner approval closes D4 and R12 as **COMPLETE / PASS / CLOSED** and authorizes **D-FINAL — Authorized-Scope Closure Audit**.

D-FINAL is audit/closure work only. It does not authorize production enablement, provider/AI pilots, scheduler activation, migration, deployment, merge, notifications or trading.


## Program D · D-FINAL closure audit implemented — 25 September 2026

D-FINAL is **IMPLEMENTED / LOCAL VALIDATION PENDING**.

The final audit confirms the Program D branch remains bounded to Program D docs/operations/UI work with no Program C decision-file, Supabase migration, provider-function, scheduler or trading-file changes. Production remains disabled; real provider/AI pilots were not run; sizing and trading authority remain absent.


## Program D — COMPLETE / PASS / CLOSED — 25 September 2026

Program D is formally **COMPLETE / PASS / CLOSED** for the full authorized R11 + R12 scope.

```text
R11 = COMPLETE / PASS / CLOSED
R12 = COMPLETE / PASS / CLOSED
D-FINAL = COMPLETE / PASS / CLOSED
Program D = COMPLETE / PASS / CLOSED
```

Final local validation passed across the dedicated D-FINAL closure test, cumulative D4→D0/Program C regressions, targeted lint, TypeScript, architecture guard, production build, `git diff --check`, and working-tree audit.

Production remains disabled. No real provider pilot, real AI pilot, scheduler activation, migration, production mutation, notification activation, merge/deployment, numeric sizing authority or trading authority is authorized by this closure.

## Program D independent-audit remediation — REOPENED — 25 September 2026

An independent post-closure audit found material R12 gaps in browser-cache trust,
packet-integrity verification, unsupported textual-fact grounding, adversarial-test
quality and D-FINAL evidentiary derivation. The affected checkpoints are reopened
while the sound R11 local/provider-free work remains closed.

```text
D0 = COMPLETE / PASS / CLOSED
D1 = COMPLETE / PASS / CLOSED
D2 = COMPLETE / PASS / CLOSED
R11 = COMPLETE / PASS / CLOSED

D3 = REOPENED / REMEDIATION IN PROGRESS
D4 = REOPENED / REMEDIATION IN PROGRESS
R12 = REOPENED
D-FINAL = REOPENED
Program D = REOPENED / REMEDIATION IN PROGRESS

Production operational = NO
```

Remediation remains local/mock-only. Provider calls, real AI calls, migrations,
scheduler activation, production mutation, merge/deployment, sizing authority and
trading remain unauthorized.

## Program D independent-audit remediation — COMPLETE / PASS / CLOSED — 25 September 2026

The reopened D3, D4, R12 and D-FINAL checkpoints are reclosed after implementation,
automated regression coverage, executable repository evidence and local browser UI
validation.

```text
D0 = COMPLETE / PASS / CLOSED
D1 = COMPLETE / PASS / CLOSED
D2 = COMPLETE / PASS / CLOSED
R11 = COMPLETE / PASS / CLOSED
D3 = COMPLETE / PASS / CLOSED
D4 = COMPLETE / PASS / CLOSED
R12 = COMPLETE / PASS / CLOSED
D-FINAL = COMPLETE / PASS / CLOSED
Program D = COMPLETE / PASS / CLOSED

Production operational = NO
```

The remediation independently rehashes and deeply freezes R12 packets, treats
browser storage as untrusted, requires structured source-bound textual claims,
executes 16 non-vacuous D4 checks, and derives Git closure facts from an executable
audit. Local UI validation confirmed valid local generation, cache reuse, visible
source-bound provenance, zero external cost and all 16 D4 PASS results. No provider
or real-AI call, migration, scheduler, production mutation, notification, merge,
deployment, sizing authority or trading capability was introduced or authorized.

### Committed Program D remediation state

The accepted remediation implementation is committed on
`program-d-operations-optional-ai` as
`34be5702898f768c74cc9fe4a6f4943edf2fb4e6`. Executable Git evidence at that commit
confirmed valid Program D base ancestry, 104 commits ahead / 0 behind, no merge
commits, no unexpected files, and zero protected Program C, research-authority,
migration, provider-function, scheduler, or trading/order changes. The complete
regression run passed 289 test files / 1,687 tests, with targeted Program D ESLint,
TypeScript, architecture, build, and diff checks passing. Production remains
disabled; provider/AI pilots, scheduling, merge/deployment, numeric sizing and
trading/order authority remain unauthorized.


## Post-D P4 runtime deployment boundary — 26 September 2026

- Exact-cohort Development adapter source: IMPLEMENTED at `87a0b260f4475123567bf29879224afc24cc083b`.
- Branch/Vercel status for the adapter commit: SUCCESS.
- Live Development Edge Function: unchanged; P4 exact-cohort mode is not deployed.
- P4A-1 provider calls: 0.
- Development data writes from P4A-1: 0.
- Production impact: NONE.
- Next required action: deploy the committed adapter to PortfolioAI Dev, then execute the approved BEL/BANKBARODA classification cohort and stop for replan.
- Visible UI change: NONE.


## Post-D P4 Dev runtime configuration status — 26 September 2026

- Supabase target: PortfolioAI Dev only (`lrgpjimipfkyoqbpsqzz`).
- `refresh-trendlyne-classification` Development deployment: ACTIVE version 2.
- Live Development function contains `P4_EXECUTE`, Development-project lock, and Production rejection.
- Development Vault internal classification token: provisioned.
- First internal invocation reached the Dev function but was rejected before provider access because the token was initially absent.
- After Dev token provisioning, the invocation progressed to runtime configuration and stopped with `Server configuration is incomplete`.
- Shared missing runtime prerequisite: `TRENDLYNE_MCP_URL`.
- The Trendlyne remote MCP URL is secret-bearing and is intentionally not stored in Git/database configuration.
- Trendlyne provider calls consumed by P4A-1: 0.
- P4A-1 classification writes: 0.
- Production mutations/provider calls: 0.
- P4 remains IN PROGRESS; P5 remains NOT AUTHORIZED.
- Visible UI change: NONE.


## Post-D P4A-1 closure and provider-runtime replan — 27 September 2026

Owner-authorized bounded work remained restricted to **PortfolioAI Dev** (`lrgpjimipfkyoqbpsqzz`).

### P4A-1 classification prerequisite — COMPLETE

The hosted Trendlyne MCP runtime URL was unavailable in Development, so no Trendlyne MCP classification call was made. The existing `OWNER_REVIEWED_CLASSIFICATION` authority was used instead with exact public evidence and the frozen Gate K taxonomy:

- BEL: `Capital Goods / Aerospace & Defence`, exact symbol/ISIN evidence, no conflict.
- BANKBARODA: `Banking / Banks`, exact symbol/ISIN evidence plus NSE banking identity, no conflict.

Development writes:
- 1 reviewed source record;
- 3 immutable attribute observations;
- 3 selected manual-review decisions.

Portfolio classification readiness after rematerialization:
- open holdings: 248;
- open equities: 239;
- methodology-ready equities: **50** (was 48);
- classification-blocked equities: **189** (was 191);
- priced holdings: 244;
- unpriced holdings: 4.

### BANKBARODA AngelOne identity — RESOLVED

A Dev-only internal adapter reused the existing AngelOne public instrument-master mapping logic.

Result:
- provider instrument id: `4668`;
- exchange: `NSE`;
- trading symbol: `BANKBARODA-EQ`;
- mapping status: `VERIFIED`;
- match basis: `EXCHANGE_SYMBOL_EXACT`;
- ambiguous/unresolved/quarantined: 0.

This public instrument-master lookup required no AngelOne authentication and did not fetch price/history.

### Remaining provider-runtime blockers

- Trendlyne evidence refresh: `TRENDLYNE_MCP_URL` is missing from hosted PortfolioAI Dev runtime.
- AngelOne price/history: hosted PortfolioAI Dev is missing one or more required AngelOne runtime variables (`ANGEL_ONE_API_KEY`, `ANGEL_ONE_CLIENT_CODE`, `ANGEL_ONE_PIN`, `ANGEL_ONE_TOTP_SECRET`, `ANGEL_ONE_CLIENT_LOCAL_IP`, `ANGEL_ONE_CLIENT_PUBLIC_IP`, `ANGEL_ONE_MAC_ADDRESS`).
- Zero-call P4 AngelOne plan returned `AUTH_OR_CONFIG_ERROR`; AngelOne history calls consumed: 0.
- Trendlyne MCP evidence calls consumed: 0.
- Production mutations/provider calls: 0.

Relevant source commits:
- `a916a09537bddc09ec85385da51d3900f0bc6ae8` — Dev-only market-history adapter.
- `b89068d15b3d2f9fa91d75a768a2af0ac65e33f1` — validated Dev-only Angel mapping adapter source.

Live Development functions:
- `refresh-trendlyne-classification` v2;
- `refresh-market-history` v2;
- `refresh-market-data` v2.

P4 remains **IN PROGRESS**. Owner Checkpoint 4B is **NOT REACHED**. P5 remains **NOT AUTHORIZED**.

**Visible UI code change: NONE.** Development data may now visibly show BEL/BANKBARODA classification improvements and BANKBARODA as AngelOne-mapped where those fields are surfaced.


## Post-D P4 bounded cohort completion — 27 September 2026

**Environment:** PortfolioAI Dev only (`lrgpjimipfkyoqbpsqzz`)

**Result:** `P4 OWNER CHECKPOINT 4A BOUNDED COHORT = COMPLETE / PASS`

### P4A-1 — classification prerequisites

- BEL → `Capital Goods / Aerospace & Defence`
- BANKBARODA → `Banking / Banks`
- both are conflict-free in the canonical current-classification view.
- methodology-ready equities increased from 48 to 50.
- classification-blocked equities decreased from 191 to 189.

Trendlyne exact identities were subsequently resolved:
- BEL → provider stock id `175`;
- BANKBARODA → provider stock id `162`.

Identity discovery consumed 2 Trendlyne calls per security.

### P4A-2 — research evidence

Deep complete-research refresh was executed only for the two sparse cohort names.

BEL:
- 4/4 Trendlyne provider calls succeeded;
- 7 overview/core metrics;
- 4 detailed mapped metrics;
- 5 ownership metrics;
- 1 document appearance / 1 document inserted.

BANKBARODA:
- 4/4 Trendlyne provider calls succeeded;
- 7 overview/core metrics;
- 5 detailed mapped metrics;
- 5 ownership metrics;
- 1 document appearance / 1 document inserted.

Current evidence totals after reconciliation:
- HDFCBANK: 139 fundamental rows / 23 metrics / 1 document;
- TORNTPHARM: 69 / 20 / 1;
- M&M: 22 / 15 / 1;
- BEL: 16 / 16 / 1;
- BANKBARODA: 17 / 17 / 1.

### P4A-3 — AngelOne price/history

BANKBARODA AngelOne identity:
- provider instrument id `4668`;
- exchange `NSE`;
- trading symbol `BANKBARODA-EQ`;
- mapping `VERIFIED`;
- match basis `EXCHANGE_SYMBOL_EXACT`.

BANKBARODA current price refresh:
- fetched: 1;
- unresolved: 0;
- failed: 0;
- stored price: ₹235.26;
- provider: AngelOne.

History results:
- HDFCBANK: 280 `ONE_DAY` rows, through 2026-09-24, 4 derived metric codes;
- TORNTPHARM: 270 rows, through 2026-09-24, 4 derived metric codes;
- M&M: 270 rows, through 2026-09-24, 4 derived metric codes;
- BEL: 270 rows, through 2026-09-24, 4 derived metric codes;
- BANKBARODA: 270 rows, through 2026-09-24, 4 derived metric codes.

Derived market metrics for each security:
- `PRICE_MOMENTUM_12M`;
- `PRICE_MOMENTUM_6M`;
- `MAX_DRAWDOWN_1Y`;
- `VOLATILITY_1Y`.

HDFCBANK's first bounded execution successfully stored the new candles/metrics but returned `LEASE_RELEASE_FAILED` because the P4 cooldown was set to zero. The canonical release function requires at least one second. The lease was released through the canonical RPC, the P4 cooldown was corrected to one second, and no duplicate HDFCBANK provider call was made.

### One-time internal grants

Because secret-bearing Vault values are not transported through SQL, P4 price/history execution used exact, single-use Development grants stored as auditable records.

- 6 grants created for the bounded price/history actions;
- 6/6 grants consumed exactly once;
- no provider secret value was exposed or copied into Git/database payloads.

### Development readiness after bounded cohort

```text
Open holdings                 248
Open equities                 239
Current prices                245 / 248
Missing current prices        3
AngelOne verified mappings    245
Methodology-ready equities     50 / 239
Classification-blocked        189
```

The remaining portfolio-wide gaps are outside the approved five-security cohort and have not been swept.

### Governance state

```text
P4 read-only baseline                  COMPLETE
Owner Checkpoint 4A                    APPROVED
P4A-1 classification                   COMPLETE / PASS
P4A-2 evidence                         COMPLETE / PASS
P4A-3 price/history                    COMPLETE / PASS
P4 bounded cohort                      COMPLETE / PASS
Owner Checkpoint 4B                    READY FOR REVIEW / NOT APPROVED
Portfolio-wide P4 rollout              NOT AUTHORIZED
P5                                     NOT AUTHORIZED
Production mutation/deployment         NONE
```

Benchmark history remains outside this initial bounded execution exactly as frozen in the P4 plan: the Development benchmark configuration was not expanded or guessed during Checkpoint 4A.

**Visible UI code change: NONE.** Development data may now visibly show the new BEL/BANKBARODA classification and evidence, BANKBARODA current price/mapping, and current history/market metrics for all five cohort names where those fields are surfaced.


## Post-D P4 Checkpoint 4B portfolio-wide rollout status — 27 September 2026

**Environment:** PortfolioAI Dev only (`lrgpjimipfkyoqbpsqzz`)

**Owner Checkpoint 4B:** APPROVED / IN PROGRESS

### Classification layer — COMPLETE

Portfolio-wide industry materialization and reconciliation completed under the frozen K1 authority path.

```text
Open equities                  239
Classification-ready           239 / 239
Classification-blocked           0
```

The rollout preserved the canonical sector authority and only materialized/reconciled the missing industry layer. No sector-only methodology routing was introduced.

### AngelOne market-data layer — NEAR COMPLETE

Current portfolio-wide market-data state:

```text
AngelOne verified mappings     238 / 239
Current prices                 238 / 239
Daily history                  238 / 239
True AngelOne residual           1
```

Resolved during Checkpoint 4B:
- ALIVUS history: 270 `ONE_DAY` candles + 4/4 derived market metrics.
- PINELABS mapping: VERIFIED, provider instrument id `759820`, trading symbol `PINELABS-EQ`.
- PINELABS current price: ₹176.57.
- PINELABS history: 215 `ONE_DAY` candles.

The remaining true AngelOne residual is:
- `V2RETAIL` — mapping/current-price/history unresolved.
- Latest retries were blocked only by PortfolioAI’s own `SYNC_MAPPINGS` safety cooldown (`MARKET_DATA_RATE_LIMITED`), not by an AngelOne provider quota.
- No active market-data lease is stuck; the cooldown is fail-closed and functioning as designed.

Short-listed-history securities with fewer than four derived metrics are treated as legitimate N/A conditions where the required lookback does not exist. Missing 12M momentum is not backfilled or fabricated.

### Trendlyne identity/research layer — PAUSED BY DAILY PROVIDER QUOTA

Trendlyne execution was expanded to portfolio-wide one-time-grant paths with explicit Development-only guards and Production rejection.

During the rollout:
- exact identity and research batches were executed;
- genuine provider schema/response failures were separated from zero-call reservation collisions;
- retry logic was hardened so attempted provider failures are not repeatedly retried blindly;
- deep-research calls were changed to use verified Trendlyne stock IDs where available;
- testing confirmed that `overview omitted stockData` is a real provider-response limitation, not a symbol-routing bug.

Current Trendlyne constraint:
- the provider’s **400-call daily quota is exhausted for today**;
- all further Trendlyne calls are stopped until the daily reset;
- no attempt will be made to bypass the provider quota or fabricate missing research evidence.

The remaining Trendlyne research/identity work is therefore **quota-deferred**, not silently marked ready.

### Checkpoint 4B governance state

```text
P4 bounded 5-stock cohort              COMPLETE / PASS
Owner Checkpoint 4A                    COMPLETE / PASS
Owner Checkpoint 4B                    APPROVED / IN PROGRESS

Classification layer                   COMPLETE / PASS
AngelOne market-data layer             NEAR COMPLETE
Trendlyne identity/research layer      PAUSED — DAILY QUOTA EXHAUSTED

P4                                     NOT YET CLOSED
P5                                     NOT AUTHORIZED
Production mutation/deployment         NONE
```

No score, recommendation, sizing decision, scheduler, paid-AI workflow, trade, Production migration, Production deployment, main-branch merge, or PR merge was authorized or executed.

**Visible UI code change: NONE.** Development data coverage has materially improved, but this checkpoint has not changed the React UI.


## Post-D P4 portfolio-wide closure — 27 September 2026

**P4 = COMPLETE / PASS / CLOSED**

Owner Checkpoint 4B was explicitly approved and the portfolio-wide rollout completed in **PortfolioAI Dev** (`lrgpjimipfkyoqbpsqzz`) only.

Final terminal register:
- open holdings: **248 / 248** represented;
- unique `P4B_TERMINAL_READINESS` records: **248**;
- UNKNOWN states: **0**;
- overall READY: **90**;
- overall BLOCKED: **158**.

Equity readiness:
- open equities: **239**;
- classification READY: **239 / 239**;
- AngelOne mapping READY: **239 / 239**;
- current price READY: **239 / 239**;
- ONE_DAY history READY: **239 / 239**;
- full four derived market metrics: **230 / 239**;
- derived metrics NOT_APPLICABLE due insufficient listing history: **9 / 239**.

Trendlyne identity/evidence:
- identity READY: **99 / 239**;
- identity BLOCKED: **140 / 239**;
  - `CANONICAL_ISIN_MISSING`: **47**;
  - `TRENDLYNE_PROVIDER_RESPONSE_INCOMPLETE`: **93**;
- research evidence READY: **81 / 239**;
- research evidence BLOCKED with canonical reason: **158 / 239**.

The Trendlyne blocker was reproduced after switching overview/ownership calls from ticker symbol to verified provider stock ID; the provider continued returning responses without required `stockData`. Those holdings are therefore terminally blocked rather than repeatedly retried or inferred.

Non-equity holdings:
- ETFs: **9**;
- AngelOne mapping/current price: READY for all 9;
- company classification/research and equity-history methodology: `NOT_APPLICABLE` under the frozen FUND/ETF boundary.

Market-data residuals were closed:
- PINELABS mapping resolved as `PINELABS-EQ`; price and 215 ONE_DAY candles stored;
- V2RETAIL mapping resolved as `V2RETAIL-EQ`; price and 270 ONE_DAY candles stored;
- ALIVUS cooldown residual was retried successfully with 270 ONE_DAY candles and four derived metrics.

Provider-control closeout:
- the temporary owner-authorized Development Trendlyne internal ceiling was used only for the portfolio rollout;
- the canonical Development daily internal ceiling was restored to **400** after completion;
- provider quota status remains `VERIFIED`;
- no Production provider controls were modified.

Governance:

```text
Owner Checkpoint 4A          COMPLETE / PASS
Owner Checkpoint 4B          APPROVED / COMPLETE / PASS
P4 portfolio-wide rollout    COMPLETE / PASS
P4                           COMPLETE / PASS / CLOSED
P5                           NOT AUTHORIZED
Production changes           NONE
Score/recommendation/sizing  NOT EXECUTED BY P4
Scheduler / paid AI / trade  NOT ACTIVATED
```

**Visible UI code change: NONE.** Development data coverage changed substantially; existing UI surfaces may display the newly available classifications, prices, histories, metrics, and explicit blocked states where they already consume those authorities.


## Post-D P4 independent final reconciliation — 27 September 2026

The live Development database and deployed Development functions were audited
after the initial closure record. The final audit is recorded in
`PortfolioAI_POST_D_P4_FINAL_CLOSURE_AUDIT.md`.

The original `P4B_TERMINAL_READINESS` evidence remains immutable. A new
append-only `P4_TERMINAL_READINESS_V2` representation now records all ten P4
domains separately for every open holding:

```text
Terminal records                     248 / 248
Domains per record                    10 / 10
UNKNOWN or invalid states              0
Equity classification READY          239 / 239
AngelOne mapping/current price READY  248 / 248
Equity ONE_DAY history READY          239 / 239
Fresh research evidence READY          81 / 239
Research evidence BLOCKED             158 / 239
Reviewed methodology profile READY      4 / 239
Methodology profile OWNER_DEFERRED     235 / 239
```

The profile deferral is explicitly assigned to P5 and does not authorize P5.
This corrects the earlier compressed readiness representation without changing
the valid provider-coverage counts or fabricating missing evidence.

Focused security review of the deployed `verify_jwt:false` P4/P4B functions
passed. Live missing-credential probes were rejected before provider use or
mutation. Grant-controlled routes require exact, expiring, single-use execution
grants; the classification route requires its internal token; normal app routes
retain authenticated portfolio ownership checks. There are zero unconsumed,
unexpired P4 grants and zero active market-data leases.

`refresh-market-data` v15 is deployed in PortfolioAI Dev with the final mapping
lease correction. No database migration was created or applied.

```text
Post-D P4                       COMPLETE / PASS / CLOSED
Owner Checkpoint 4B             COMPLETE / PASS
P5                              NOT AUTHORIZED
Production operational changes NONE
```


## Post-D P5 real-portfolio execution closure — 27 September 2026

**Result:** `P5 = COMPLETE / PASS / CLOSED`

P5 reused the already-closed Program B R6/R7 contracts and current P4 terminal evidence. It did not rebuild scoring, recommendation or sizing engines and did not call providers.

Live Development terminal-disposition result:

```text
Open holdings                         248
Equities                              239
ETFs                                    9

Methodology RESOLVED                  110
Methodology NOT AVAILABLE             124
Methodology REVIEW REQUIRED             5
Methodology NOT APPLICABLE              9

R6 BLOCKED_PREREQUISITE               110
R6 METHODOLOGY_NOT_AVAILABLE          124
R6 REVIEW_REQUIRED                      5
R6 NOT_APPLICABLE                       9
R6 SCORED                               0

R7 BLOCKED_PREREQUISITE               110
R7 METHODOLOGY_NOT_AVAILABLE          124
R7 REVIEW_REQUIRED                      5
R7 NOT_APPLICABLE                       9
R7 RECOMMENDATION_READY                 0

Sizing BLOCKED_PREREQUISITE           110
Sizing METHODOLOGY_NOT_AVAILABLE      124
Sizing REVIEW_REQUIRED                  5
Sizing NOT_APPLICABLE                   9
Sizing READY                            0
```

Numeric coverage is reported separately and is not used as a false completion target. The frozen P5 exit contract requires portfolio-wide disposition, canonical blockers, explicit persistence, lineage and no promotion of historical reference outputs.

All 248 holdings have a latest `P5_TERMINAL_DISPOSITION_V1` record with non-null R6/R7/sizing dispositions.

Key safeguards:
- source P4 terminal identity/hash preserved;
- owner-settings snapshot hash preserved and unchanged before/after P5;
- historical Gate-H/G10/B2 score artifacts were not promoted into current score facts;
- database `DRAFT` recommendation policies were not promoted;
- no universal recommendation thresholds were invented;
- Program B sizing-policy registry remains unmodified;
- new score runs during P5: 0;
- new recommendation runs during P5: 0;
- new sizing assessments during P5: 0;
- provider calls: 0;
- Production mutation/deployment/migration: 0;
- merge to `main`: 0.

Supporting closure record:
`docs/PortfolioAI_POST_D_P5_FINAL_CLOSURE_AUDIT.md`

Reproducible audit:
`scripts/p5-final-closure-audit.sql`

A fresh authenticated browser smoke test was unavailable from the execution session because the Vercel connector lacked deployment permission. No browser pass is fabricated. Major UI consolidation remains P7 scope.

```text
Post-D P4 = COMPLETE / PASS / CLOSED
Post-D P5 = COMPLETE / PASS / CLOSED
P6        = NOT AUTHORIZED
Production = UNCHANGED
```

**Visible UI code change: NONE.**


## Post-D P6 integrated deterministic state — 27 September 2026

**Technical result:** `PASS`

**Formal closure:** `COMPLETE / PASS / CLOSED`

P6 converged the existing R8–R12 implementation onto the current P5 terminal authority without rebuilding R8–R12.

Key integration change:
- deployed `p6-terminal-disposition-read` to PortfolioAI Dev only;
- platform JWT verification is enabled;
- portfolio ownership is checked server-side;
- no direct frontend access to `data_source_records` was granted;
- R8/R9/R10 now consume current P5 terminal states instead of the stale hard-coded live R6 placeholder;
- Holdings and Research continue to share one canonical R10 Action Center path;
- Dashboard R8 consumers now receive the same P5 terminal-authority map.

Persistence decisions awaiting Owner Checkpoint 5:
- R8: recomputed/read-only, no new database persistence;
- R9: in-memory session baseline only, no durable persistence;
- R10: canonical recomputation, no competing snapshot persistence;
- R11: existing manual/auditable operational ledger semantics retained, no scheduler;
- R12: browser-local validated cache, `LOCAL_MOCK_ONLY`, no real AI;
- P5 terminal registry remains the upstream append-only authority.

Safety verification since P6 authorization:
```text
new score runs                 0
new recommendation runs        0
new sizing assessments         0
provider usage events          0
owner-setting mutations        0
scheduler activation           0
database migrations            0
Production changes             0
merge to main                  0
```

Owner settings remain unchanged with hash:
`2b70a819b84b62f88cd3a6634afc71e16f43e61871b2c787233bc4550f56dee7`

Supporting audit:
`docs/PortfolioAI_POST_D_P6_INTEGRATED_STATE_AUDIT.md`

```text
P4 = COMPLETE / PASS / CLOSED
P5 = COMPLETE / PASS / CLOSED
P6 technical execution = COMPLETE / PASS
Owner Checkpoint 5 = APPROVED / CLOSED
P6 formal closure = COMPLETE / PASS / CLOSED
P7 = NOT AUTHORIZED
Production = UNCHANGED
```

**Visible UI topology change: NONE.** Existing R8/R10 badges and dashboard consumers now use more accurate current upstream terminal state, but P7 remains the UI consolidation stage.


## Post-D P6 formal closure — 27 September 2026

**Owner Checkpoint 5:** `APPROVED / CLOSED`

The owner approved the frozen P6 integrated deterministic state and persistence decisions:

- R8 remains recomputed/read-only with no new database persistence.
- R9 remains in-memory session baseline only; no durable baseline, acknowledgement, snooze, or cross-session seen-state persistence was introduced.
- R10 remains the sole canonical Action Center authority through recomputation; no competing snapshot table was introduced.
- R11 retains the existing manual/auditable/fail-closed operational model; no scheduler was enabled.
- R12 remains `LOCAL_MOCK_ONLY` with browser-local validated cache; no real AI provider was authorized.
- The append-only P5 terminal registry remains the upstream authority for current P5 disposition facts.

Formal governance state:

```text
Post-D P4 = COMPLETE / PASS / CLOSED
Post-D P5 = COMPLETE / PASS / CLOSED
Post-D P6 = COMPLETE / PASS / CLOSED
Owner Checkpoint 5 = APPROVED / CLOSED
P7 = NOT AUTHORIZED
Production = UNCHANGED
```

No additional provider calls, score/recommendation/sizing runs, migrations, scheduler activation, Production mutation, merge to `main`, or Production deployment were authorized by this closure.

**Visible UI topology change: NONE.** P6 converged the existing deterministic decision chain; major UI consolidation remains P7.


## Post-D P7 UI consolidation technical pass — 27 September 2026

**Technical implementation:** `COMPLETE / PASS`

**Owner Checkpoint 6:** `PENDING BROWSER APPROVAL`

Primary navigation is now frozen to:

```text
Dashboard
Holdings
Portfolio Structure
Research
Intelligence
Transactions
Settings

Import is accessed from Settings and is not a primary navigation item.
```

Key P7 convergence completed:
- detailed health/risk/change/action views moved out of the long Dashboard workflow into Intelligence;
- legacy Operations route moved under Settings diagnostics with backward redirect;
- Investment Committee interpretation moved under Intelligence with backward redirect;
- Gate/Program/R6–R12 terminology removed from primary product copy;
- historical Gate-J/Gate-I reference outputs removed from live stock Research pages;
- current score slot no longer reconstructs a preview from partial/reference evidence;
- owner position settings are now owner-only and no longer run legacy draft recommendation, suggested-weight or action-bias previews;
- Action Center blockers are translated into investor language;
- duplicate “Backend planned” news placeholder removed;
- stale hardcoded provider-call limit removed in favor of live configured value.

The first P7 owner-settings build exposed a stale TypeScript test contract. The test was updated to the new owner-only component contract.

Verified app-code deployment:
`829df629339b701bf5228df735a32473904c5b5a` → Vercel `READY`.

No P7 migrations, provider calls, AI calls, scheduler activation, trading, Production mutation, merge to `main`, or Production deployment occurred.

Supporting audit:
`docs/PortfolioAI_POST_D_P7_UI_CONSOLIDATION_AUDIT.md`

```text
P4 = COMPLETE / PASS / CLOSED
P5 = COMPLETE / PASS / CLOSED
P6 = COMPLETE / PASS / CLOSED
P7 technical implementation = COMPLETE / PASS
Owner Checkpoint 6 = PENDING BROWSER APPROVAL
P7 formal closure = PENDING
P8 = NOT AUTHORIZED
Production = UNCHANGED
```


## Post-D P7 Owner Checkpoint 6 refinement status — 28 September 2026

**Stage state:** `ACTIVE / OWNER CHECKPOINT 6 REFINEMENT`

**Formal P7 closure:** `PENDING`

**P8:** `NOT AUTHORIZED`

Repository verification completed before this update:

- Development head: `ac935a168c3ed72f6ffd07d2beb91ceba95fae98`
- Production `main` remains: `d0cc52dfcf61fc9a884f139fcc7931b3bd73c57b`
- latest Development deployment for `ac935a1` completed successfully on Vercel;
- no Production merge, Production deployment, migration, provider activation, scheduler activation, paid AI call or trading action occurred.

Implemented since the earlier P7 technical-pass record:

1. **Import navigation refinement**
   - Import removed from the primary top navigation;
   - Import remains available at `/app/import`;
   - Import is now accessed from the Settings hub;
   - primary navigation now contains exactly seven top-level items:
     Dashboard / Holdings / Portfolio Structure / Research / Intelligence /
     Transactions / Settings.

2. **Dashboard sticky navigator restored and expanded**
   - the floating Dashboard navigator now links to every major Dashboard block:
     Overview, Summary, Pulse, Allocation, Weights, Position Returns, P&L Impact,
     Broker, Insights, Data Health, Integrity, Daily Move, Allocation Performance
     and News;
   - every jump target was verified to exist exactly once;
   - the navigator remains sticky for fast intra-Dashboard access.

3. **True page-top navigation restored**
   - the app header now has the canonical `app-top` target;
   - the right-side `Top` control scrolls to the actual page top rather than only
     to the Dashboard overview;
   - this restores visibility of the primary application menu after long
     Dashboard scrolling.

4. **Live News mount corrected**
   - the Dashboard News route wrapper again carries
     `dashboard-news-section`;
   - the live News portal therefore has a valid mount target;
   - the News sticky-menu link points to the real live News block.

### Owner-approved Dashboard refinement implemented

The current repository version of
`src/components/DashboardAllocationPerformance.tsx` and its CSS implements the
approved compact professional presentation with:

- equal-width paired cards;
- compact Classification Coverage and Allocation Scope summary cards;
- aligned Sector Allocation and Market-cap Allocation cards;
- aligned Sector Performance and Market-cap Performance tables;
- a compact full-width Allocation vs Performance insight section;
- consistent outer width with all other Dashboard blocks;
- responsive behavior for desktop, tablet and mobile;
- horizontally scrollable tables on narrow screens without dropping columns;
- strongly contrasting fixed market-cap colors:
  - Small Cap `#2F7D57`
  - Large Cap `#8FC56A`
  - Mid Cap `#4F86C6`
  - ETF / non-equity `#D9A441`
  - Unclassified / unavailable `#7B8794`

The component preserves canonical holdings, enrichment and accounting access
paths; displays unavailable priced scope as unavailable rather than fabricating
coverage; keeps missing classifications explicit; and does not introduce a new
business fact or calculation authority. Focused component/palette tests,
TypeScript, architecture checks, edge tests and the production build pass. The
repository-wide ESLint command retains pre-existing unrelated failures.
The authenticated Development deployment subsequently passed responsive browser
validation at 1440, 1280, 1024, 768, 430, 390 and 360 pixels, including internal
table scrolling, sticky navigation, true page-top return, live News presence and
absence of page-level horizontal overflow.

Current governance state:

```text
P4 = COMPLETE / PASS / CLOSED
P5 = COMPLETE / PASS / CLOSED
P6 = COMPLETE / PASS / CLOSED

P7 = ACTIVE
Owner Checkpoint 6 = IN REVIEW / REFINEMENT
Dashboard sticky navigation = IMPLEMENTED / DEPLOYED
Allocation & Performance redesign = IMPLEMENTED / VALIDATED
Dashboard responsive refinement = IMPLEMENTED / VALIDATED
P7 formal closure = PENDING

P8 = NOT AUTHORIZED
Production = UNCHANGED
```


## P7-IC Portfolio-wide Intelligence Completion Remediation — frozen 28 September 2026

**Working label:** Program E  
**Canonical status:** Required convergence/remediation checkpoint inside still-open P7; not a new feature program.  
**Authoritative plan:** `docs/PortfolioAI_POST_D_P7_IC_PORTFOLIO_INTELLIGENCE_COMPLETION_PLAN.md`

Master-Blueprint reconciliation confirmed that Programs A–D and Post-D P4–P6 correctly established architecture, contracts, safety boundaries and portfolio-wide terminal dispositions, but those closures do not by themselves prove current portfolio-wide numeric score/recommendation coverage or the full multi-period Movement Engine.

The required sequence is now frozen as:

```text
P7 shell/UI refinement
  ↓
P7-IC
  IC0  Authority + portfolio coverage freeze
  IC1  Methodology + recommendation-policy completion
  IC2  Evidence / market-history remediation
  IC3  Current canonical evidence snapshots
  IC4  R6 current portfolio scoring
  IC5  R7 recommendation / Core-Satellite candidacy / sizing readiness
  IC6  R8 + R9 + Movement Engine operationalization
  IC7  R10 + final P7 UI integration
  IC-FINAL portfolio-wide validation
  ↓
Owner Checkpoint 6
  ↓
P7 COMPLETE / PASS / CLOSED
  ↓
P8
  ↓
P-FINAL
```

### Completion principle

P7-IC does **not** require every equity to receive a numeric score or recommendation at any cost.

Every eligible equity must instead end with either:

- a reproducible current assessment through the deepest applicable canonical engine; or
- an explicit justified blocker such as `METHODOLOGY_NOT_AVAILABLE`, `INSUFFICIENT_EVIDENCE`, `REVIEW_REQUIRED`, `BLOCKED_PREREQUISITE` or `NOT_APPLICABLE`.

No hidden fallback or cross-sector policy borrowing is allowed.

### Core / Satellite and Movement objective

P7-IC must make current owner role and machine assessment separately visible.

Where legitimate current R7 evidence permits, PortfolioAI may produce:

- `CORE_CANDIDATE`
- `SATELLITE_CANDIDATE`
- `WATCH`
- `AVOID`

The owner role remains authoritative.

The Movement Engine must implement the Master Blueprint lifecycle without automatic role mutation, including at minimum:

- Core → Watch;
- Core → At Risk;
- Core → Satellite review;
- Core → Exit review;
- Satellite → Core Candidate;
- Satellite → Core Promotion Ready.

Promotion normally requires sustained qualifying evidence over 2–4 quarters unless an exceptional approved rule applies. Price weakness alone and one weak quarter cannot automatically demote Core.

### Governance state

```text
P4 = COMPLETE / PASS / CLOSED
P5 = COMPLETE / PASS / CLOSED
P6 = COMPLETE / PASS / CLOSED

P7 = ACTIVE
P7-IC = REQUIRED / PLAN FROZEN / NOT YET EXECUTED
Owner Checkpoint 6 = DEFERRED UNTIL IC-FINAL
P7 formal closure = PENDING

P8 = NOT AUTHORIZED
P-FINAL = NOT STARTED
Production = UNCHANGED
```

There is no canonical P9 in the current Post-D roadmap.

### P7-IC IC0 execution status — 28 September 2026

Development was reconciled at `673dcc9ac9acc1a514df3e27a9f2e4b58c15925f`.
The common Research stock-page shell is verified and locked across HDFCBANK,
TORNTPHARM, BEL, M&M and SRF representative methodology families and the
documented desktop/responsive viewport set. No shell correction was required.

The IC0 read-only authority/coverage freeze now contains 248/248 explicit
holding records: 239 equities and 9 non-equities. It executed with zero provider
calls, zero database writes, zero migrations and zero Production changes.

Current portfolio state includes 110 resolved methodologies, 124 unavailable
methodologies, 5 methodology reviews and 9 non-applicable holdings. Evidence is
66 conflicting, 142 missing, 31 review-required and 9 non-applicable. No current
numeric R6 score or R7 recommendation was promoted from reference output.

`IC0 = BLOCKED`: methodology-specific evidence-count access, a canonical
materialized current snapshot, durable R9 state and Movement history persistence
are insufficient or absent. IC-A awaits owner direction; IC1 has not started.

```text
P7 = ACTIVE
Universal stock-page shell = VERIFIED / LOCKED
P7-IC IC0 = BLOCKED / AUDIT COMPLETE / PASS WITHHELD
Owner Checkpoint IC-A = AWAITING OWNER DECISION
IC1 = NOT STARTED / NOT AUTHORIZED
P8 = NOT AUTHORIZED
Production = UNCHANGED
```


## P7-IC IC-A approval and IC1 candidate completion — 29 September 2026

Owner explicitly approved IC-A for strengthened IC1 methodology + complete R7-policy completion and persistence/access architecture DESIGN ONLY.

IC1 candidate package is complete and stopped at IC-B:
- 239 equities reconciled;
- 238 methodology/R7 resolved;
- 1 genuine factual review exception: BLUEJET Primary Pharma subprofile;
- 0 deferred-engineering METHODOLOGY_NOT_AVAILABLE closure states;
- 21 new held-business-model methodology candidates completed;
- all resolved held profiles have complete R7 authority/candidate coverage;
- Gate K remains historically COMPLETE / PASS / CLOSED;
- persistence/access design completed with no migration file.

Safety:
```text
IC1 runtime activation = NO
provider calls = 0
database writes = 0
migration creation/application = 0
Production change = 0
deployment = 0
merge = 0
P8 = NOT AUTHORIZED
```

The Development branch ref intentionally remains at `e7c021b865fcd1d49a7c59924ef9c44f0383f301` because a branch update is Vercel-deploying and deployment is not authorized. The IC1 package is staged as an unattached Git commit for IC-B review; no branch ref is moved.


## P7-IC IC-B / IC2 planning — 29 September 2026

IC-B accepted IC1 commit `8bd8a971ae31812e503217d06c6c3cc9098d4061`.

```text
IC1 = COMPLETE / PASS / CLOSED
IC2 = ACTIVE / PLANNING COMPLETE / PROVIDER EXECUTION NOT AUTHORIZED
IC3 = NOT STARTED
IC4 R6 = NOT AUTHORIZED
IC5 R7 = NOT AUTHORIZED
P8 = NOT AUTHORIZED
```

Live Development planning: 99 Trendlyne identities ready; 79 base current-research bundles reusable; 160 resolved equities need current research refresh; 140 need identity work first; supported-adapter Trendlyne ceiling 920 calls; 238 incremental Angel One stock-history calls; nine <252-session listing-history blockers; 22 primary benchmark authorities and zero ready benchmark histories; current R6-ready count 0. No provider calls or database writes occurred.


## P7-IC IC2 adapter implementation — 29 September 2026

Repository-only adapter implementation is complete as a detached candidate:
- 47 frozen methodology profile contracts;
- 239 accepted held-equity assignments;
- generic 22-index benchmark adapter;
- profile-aware Trendlyne evidence normalization;
- Development-only benchmark refresh execution path staged but not deployed;
- Complete Research IC2 execution path staged but not deployed.

Exact provider package:
- Trendlyne = 920 calls in 23 batches of at most 40 (280 identity + 640 current research);
- Angel One = 238 stock-history + 22 benchmark-history = 260 authenticated history calls;
- BLUEJET = 0 provider calls;
- 79 existing base research bundles are cache-first normalization candidates.

The temporary 1,000/day Trendlyne upgrade is now required before the next execution approval. PortfolioAI Development remains at 400/day until a separate owner-authorized database control change.

No provider call, DB write, migration, deployment, merge or Production change occurred.


## P7-IC IC2 provider execution — PAUSED FAIL-CLOSED — 29 September 2026

The Development-only IC2 orchestrator/grant mechanism was authorized, staged at `76cc0270a684c2e9e713bde15539b47b66ffcb2f`, and deployed without moving `PortfolioAI-Development`.

Live Development functions:
- `complete-research-refresh` v18;
- `p7-ic-benchmark-refresh` v2;
- `p7-ic2-orchestrator` v1.

Trendlyne internal Development limit remains 1,000/day with 40/run.

Execution began with the frozen TID01 identity cohort. Ten previously unresolved identities were matched exactly:
YATHARTH, SYRMA, LT, NH, MANKIND, SONACOMS, PERSISTENT, SKYGOLD, MFSL, RELIANCE.

Cumulative IC2 Trendlyne usage = **21 calls**. All 21 provider attempts succeeded at transport/provider level.

The next security, **USHAMART**, consumed 2 provider calls but failed exact reconciliation with `NO_EXACT_PROVIDER_IDENTITY`. Canonical PortfolioAI identity is NSE `USHAMART`, ISIN `INE228A01035`. No matched Trendlyne identity was persisted and no prior Trendlyne raw capture exists for offline repair.

Per the frozen IC2 stop rules, all further provider execution stopped immediately.

Current read-only audit:
- Trendlyne exact identity ready: 109/239 open equities (99 before IC2 execution);
- exact current base-research bundle ready: 80;
- IC2 research batches executed: 0;
- IC2 Angel One stock-history runs: 0;
- IC2 benchmark runs: 0;
- BLUEJET provider calls: 0.

No Production change, migration, Vercel deployment, Git merge, IC4/R6, IC5/R7 or P8 occurred.

**IC2 = ACTIVE / PROVIDER EXECUTION PAUSED / FAIL-CLOSED AT USHAMART.**


### IC2 Trendlyne quota accounting correction — 29 September 2026

Owner-provided Trendlyne MCPMax utilisation shows **11 / 1000 tool calls used**.

PortfolioAI's local ledger shows **21 internal provider-attempt events**, comprising:
- 11 × `GET_OVERVIEW_NEWS_CORP_EVENTS`
- 10 × `SEARCH_ENTITIES`

These are not equivalent accounting units. The Trendlyne subscription dashboard is authoritative for external quota consumption. Therefore:
- **External Trendlyne tool calls consumed = 11**
- **PortfolioAI internal provider-attempt events = 21**

Any earlier wording that described 21 as Trendlyne calls consumed is superseded by this correction.


## P7-IC IC2 — USHAMART remediation PASS; provider execution paused at MAXHEALTH — 29 September 2026

USHAMART exact remediation passed:
- canonical NSE symbol: `USHAMART`;
- canonical ISIN: `INE228A01035`;
- fresh Trendlyne overview stock ID: `1456`;
- persisted Trendlyne identity: MATCHED / confidence 1.0000;
- remediation provider calls: one overview operation.

IC2 identity execution then resumed under the standing owner authorization. Current exact Trendlyne identity coverage is **135 / 239 open equities**.

Current fail-closed blocker:
- `MAXHEALTH` → `NO_EXACT_PROVIDER_IDENTITY`.

Correction: PREMIERENE was not executed in this resumed slice. A stale historical PREMIERENE failure was initially surfaced by an audit query and is not the current stop reason.

Execution-control deviation recorded:
- the management audit loop failed to detect the escaped `matched:false` marker after MAXHEALTH and consequently submitted TID02 offsets 10 and 15 after the failure;
- those later slices completed successfully;
- no TID03+ slices were submitted;
- no IC2 research batches, Angel One stock-history calls, or benchmark calls were executed.

PortfolioAI internal provider-attempt events today = 63 (38 overview + 25 search). This is **not** the Trendlyne subscription billing count. The Trendlyne dashboard remains authoritative for external tool-call utilisation.

**IC2 = ACTIVE / PROVIDER EXECUTION PAUSED / FAIL-CLOSED AT MAXHEALTH.**


## P7-IC IC2 — MAXHEALTH remediation PASS — 29 September 2026

MAXHEALTH exact identity remediation passed under owner authorization:
- canonical NSE symbol: `MAXHEALTH`;
- canonical ISIN: `INE027H01010`;
- fresh Trendlyne overview stock ID: `276825`;
- observed Trendlyne symbol: `MAXHEALTH`;
- observed Trendlyne ISIN: `INE027H01010`;
- persisted Development identity: `MATCHED`;
- confidence: `1.0000`;
- remediation provider usage: one `GET_OVERVIEW_NEWS_CORP_EVENTS` operation; no `SEARCH_ENTITIES` operation.

The prior `NO_EXACT_PROVIDER_IDENTITY` result is therefore classified as a resolver/search-candidate false-negative, not a canonical identity conflict.

Broad IC2 provider execution remains PAUSED by owner scope. No TID03+, research, Angel One stock-history, or benchmark execution was resumed in this remediation step.

No Production change, migration, Vercel deployment, Git merge, IC4/R6, IC5/R7, IC6+, or P8 occurred.


## P7-IC IC2 identity execution resumed; stopped at TMCV — 29 September 2026

Owner approved resumption of the remaining IC2 identity campaign after MAXHEALTH remediation, with corrected stop-control.

Execution behavior:
- one bounded slice is submitted at a time;
- the next slice is not submitted unless every symbol in the current slice has a fresh exact `MATCHED` identity;
- audit queries are time-bounded to the current slice.

Results after resumption:
- TID02 remainder: PREMIERENE, SRHHYPOLTD, SENCO = PASS;
- TID03 offset 0: RATEGAIN, SHARDACROP, ERIS, LTFOODS, SHRIRAMFIN = PASS;
- TID03 offset 5: PHOENIXLTD, NATIONALUM, TATACAP, CPPLUS = PASS;
- TMCV = `NO_EXACT_PROVIDER_IDENTITY` and triggered immediate stop.

Current exact Trendlyne identity coverage = **148 / 239 open equities**.

No TID03 offset 10/15, TID04+, research, Angel One stock-history, or benchmark execution occurred after the TMCV failure.

PortfolioAI internal provider-attempt ledger today = 85 events (52 overview + 33 search). This is not equivalent to Trendlyne subscription billing; Trendlyne's own MCPMax utilisation remains authoritative for external quota usage.

**IC2 = ACTIVE / IDENTITY EXECUTION PAUSED / FAIL-CLOSED AT TMCV.**


## P7-IC IC2 — TMCV remediation PASS — 29 September 2026

TMCV exact identity remediation passed under owner authorization:
- canonical NSE symbol: `TMCV`;
- canonical ISIN: `INE1TAE01010`;
- fresh Trendlyne overview stock ID: `3327757`;
- observed Trendlyne symbol: `TMCV`;
- observed Trendlyne ISIN: `INE1TAE01010`;
- persisted Development identity: `MATCHED`;
- confidence: `1.0000`;
- remediation provider usage: one `GET_OVERVIEW_NEWS_CORP_EVENTS` operation; no `SEARCH_ENTITIES` operation.

The prior `NO_EXACT_PROVIDER_IDENTITY` result is classified as a resolver/search-candidate false-negative, not a canonical identity conflict.

Broad IC2 identity execution remains PAUSED by approval scope. No TID03 offset 10/15, TID04+, research, Angel One stock-history, or benchmark execution resumed in this remediation step.

No Production change, migration, Vercel deployment, Git merge, IC4/R6, IC5/R7, IC6+, or P8 occurred.


## P7-IC IC2 identity execution resumed; stopped at VEDL — 29 September 2026

Owner approved resumption of the remaining IC2 Trendlyne identity campaign using corrected one-slice-at-a-time fail-closed control.

Execution from TID03 offset 10:
- PRIVISCL = PASS
- NCC = PASS
- HBLENGINE = PASS
- VEDL = `NO_EXACT_PROVIDER_IDENTITY` → immediate stop
- LEMONTREE was not attempted
- no TID03 offset 15 or TID04+ slice was submitted

Current exact Trendlyne identity coverage = **152 / 239 open equities**.

PortfolioAI internal provider-attempt ledger today = 94 events:
- 57 × `GET_OVERVIEW_NEWS_CORP_EVENTS`
- 37 × `SEARCH_ENTITIES`

These are internal accounting events, not the Trendlyne subscription billing count. Trendlyne's own MCPMax utilisation remains authoritative for external quota usage.

No research, Angel One history, benchmark execution, Production change, migration, Vercel deployment, Git merge, IC4/R6, IC5/R7, IC6+, or P8 occurred.

**IC2 = ACTIVE / IDENTITY EXECUTION PAUSED / FAIL-CLOSED AT VEDL.**


## P7-IC IC2 — VEDL remediation PASS — 29 September 2026

VEDL exact identity remediation passed under owner authorization:
- canonical NSE symbol: `VEDL`;
- canonical ISIN: `INE205A01025`;
- fresh Trendlyne overview stock ID: `1289`;
- observed Trendlyne symbol: `VEDL`;
- observed Trendlyne ISIN: `INE205A01025`;
- persisted Development identity: `MATCHED`;
- confidence: `1.0000`;
- remediation provider usage: one `GET_OVERVIEW_NEWS_CORP_EVENTS` operation; no `SEARCH_ENTITIES` operation.

The prior `NO_EXACT_PROVIDER_IDENTITY` result is classified as a resolver/search-candidate false-negative, not a canonical identity conflict.

Broad IC2 identity execution remains PAUSED by approval scope. LEMONTREE and later identity slices were not resumed in this remediation step.

No research, Angel One history, benchmark execution, Production change, migration, Vercel deployment, Git merge, IC4/R6, IC5/R7, IC6+, or P8 occurred.


## P7-IC IC2 identity execution resumed; stopped at CHOLAFIN — 29 September 2026

Owner authorized resumption from LEMONTREE through the remaining IC2 Trendlyne identity batches using corrected one-slice-at-a-time fail-closed control.

Successful execution after the VEDL remediation:
- LEMONTREE = PASS;
- TID03 offset 15: KRN, LTF, TI, FORTIS, IRMENERGY = PASS;
- TID04 offset 0: ICIL, WOCKPHARMA, LENSKART, HCLTECH, GOLDIAM = PASS;
- TID04 offset 5: CEMPRO, ZYDUSLIFE, SHAILY, GRANULES, VINATIORGA = PASS;
- TID04 offset 10: SSWL, VOLTAS, SBCL, MUTHOOTFIN, GROWW = PASS;
- TID04 offset 15: UPL, ALIVUS, LGEINDIA, PAR, SAGILITY = PASS;
- TID05 offset 0: VENTIVE, SRF, ZENTEC, PENIND = PASS;
- CHOLAFIN = `PROVIDER_COMPANY_IDENTITY_CONFLICT` → immediate stop.

No TID05 offset 5 or any TID06/TID07 identity slice was submitted after the CHOLAFIN failure.

Exact Trendlyne identity coverage is now **183 / 239 open equities** (153 before this resumed pass + 30 newly matched).

No research, Angel One history, benchmark execution, Production change, migration, Vercel deployment, Git merge, IC4/R6, IC5/R7, IC6+, or P8 occurred.

**IC2 = ACTIVE / IDENTITY EXECUTION PAUSED / FAIL-CLOSED AT CHOLAFIN.**


## P7-IC IC2 — CHOLAFIN remediation PASS — 29 September 2026

CHOLAFIN exact identity remediation passed under owner authorization:
- canonical PortfolioAI symbol: `CHOLAFIN`;
- canonical ISIN: `INE121A01024`;
- canonical display-name alias: `Cholamandalam Investments`;
- fresh Trendlyne overview stock ID: `262`;
- observed Trendlyne symbol: `CHOLAFIN`;
- observed Trendlyne ISIN: `INE121A01024`;
- observed provider name: `Cholamandalam Investment & Finance Company Ltd.`;
- persisted Development identity: `MATCHED`;
- confidence: `1.0000`;
- remediation provider usage: one `GET_OVERVIEW_NEWS_CORP_EVENTS` operation; no `SEARCH_ENTITIES` operation.

The prior `PROVIDER_COMPANY_IDENTITY_CONFLICT` is classified as a canonical display-name alias false-positive, not a real provider/canonical identity conflict.

Broad IC2 identity execution remains PAUSED by approval scope. No TID05 offset 5 or later identity slice was resumed in this remediation step.

No research, Angel One history, benchmark execution, Production change, migration, Vercel deployment, Git merge, IC4/R6, IC5/R7, IC6+, or P8 occurred.


## P7-IC IC2 identity execution resumed; stopped at HAL — 29 September 2026

Owner authorized resumption of the remaining IC2 Trendlyne identity batches from TID05 offset 5 using corrected one-slice-at-a-time fail-closed control.

Current slice result:
- NYKAA = PASS
- VINCOFE = PASS
- HAL = `NO_EXACT_PROVIDER_IDENTITY` → immediate stop
- ONESOURCE = not attempted
- PANAMAPET = not attempted

No TID05 offset 10/15 or any TID06/TID07 identity slice was submitted after the HAL failure.

Exact Trendlyne identity coverage is now **186 / 239 open equities** (184 before this resumed slice + 2 newly matched).

No research, Angel One history, benchmark execution, Production change, migration, Vercel deployment, Git merge, IC4/R6, IC5/R7, IC6+, or P8 occurred.

**IC2 = ACTIVE / IDENTITY EXECUTION PAUSED / FAIL-CLOSED AT HAL.**


## P7-IC IC2 — HAL remediation PASS — 29 September 2026

HAL exact identity remediation passed under owner authorization:
- canonical NSE symbol: `HAL`;
- canonical ISIN: `INE066F01020`;
- fresh Trendlyne overview stock ID: `80502`;
- observed Trendlyne symbol: `HAL`;
- observed Trendlyne ISIN: `INE066F01020`;
- observed provider name: `Hindustan Aeronautics Ltd.`;
- persisted Development identity: `MATCHED`;
- confidence: `1.0000`;
- remediation provider usage: one `GET_OVERVIEW_NEWS_CORP_EVENTS` operation; no `SEARCH_ENTITIES` operation.

The prior `NO_EXACT_PROVIDER_IDENTITY` result is classified as a resolver/search-candidate false-negative, not a canonical identity conflict.

Broad IC2 identity execution remains PAUSED by approval scope. ONESOURCE, PANAMAPET and later identity slices were not resumed in this remediation step.

No research, Angel One history, benchmark execution, Production change, migration, Vercel deployment, Git merge, IC4/R6, IC5/R7, IC6+, or P8 occurred.


## P7-IC IC2 — RHIM remediation PASS — 29 September 2026

RHIM exact identity remediation passed under owner authorization:
- canonical NSE symbol: `RHIM`;
- canonical ISIN: `INE743M01012`;
- authoritative company identity: `RHI Magnesita India Limited`;
- fresh Trendlyne overview stock ID: `989`;
- observed Trendlyne symbol: `RHIM`;
- observed Trendlyne ISIN: `INE743M01012`;
- observed provider name: `RHI Magnesita India Ltd.`;
- persisted Development identity: `MATCHED`;
- confidence: `1.0000`;
- remediation provider usage: one `GET_OVERVIEW_NEWS_CORP_EVENTS` operation; no `SEARCH_ENTITIES` operation.

The prior `NO_EXACT_PROVIDER_IDENTITY` result is classified as a resolver/search-candidate false-negative, not a canonical identity conflict.

Broad IC2 identity execution remains paused after RHIM until separately resumed. The next frozen symbol is `IGL`.

No research, Angel One history, benchmark execution, Production change, migration, Vercel deployment, Git merge, IC4/R6, IC5/R7, IC6+, or P8 occurred.


## P7-IC IC2 identity campaign COMPLETE — 29 September 2026

Owner-authorized one-slice-at-a-time IC2 identity execution completed the remaining TID07 scope.

Post-RHIM execution:
- IGL = PASS, Trendlyne stock ID `596`;
- NATCOPHARM = PASS, stock ID `908`;
- JKLAKSHMI = PASS, stock ID `685`;
- GOKEX = PASS, stock ID `480`;
- PNBHOUSING = PASS, stock ID `4826`;
- INOXWIND initially failed `NO_EXACT_PROVIDER_IDENTITY`, then bounded exact remediation passed with stock ID `1627`;
- QUESS = PASS, stock ID `4595`;
- FAZE3Q = PASS, stock ID `3253`;
- ZENSARTECH = PASS, stock ID `1544`.

Development now verifies **239 / 239 open equities** with `MATCHED` Trendlyne identity observations and non-null provider instrument IDs.

INOXWIND remediation:
- canonical symbol `INOXWIND`;
- canonical ISIN `INE066P01011`;
- exact Trendlyne stock ID `1627`;
- resolver version 21 contains an exact one-symbol guard;
- remediation run `7d5e6de0-5e25-4578-9c33-dbd4e8cb34bd` = `SUCCEEDED / ACCEPTED`;
- immutable source record `1627:identity` written;
- one provider overview call;
- prior failure classified as resolver/search-candidate false-negative.

**IC2 Trendlyne identity campaign = COMPLETE / PASS.**

## P7-IC IC2 completion attempt — BLOCKED on canonical current-pointer semantics — 29 September 2026

Development-only cache reprojection, residual Trendlyne evidence collection and bounded rematerialization continued after the owner raised the verified Trendlyne daily entitlement to 1,000. The live control remains scheduler-disabled. Today’s internal ledger is 521 successful attempts and zero failed attempts; 262 attempts were added since this IC2 handoff, including 192 after the quota increase.

The residual two-domain campaign completed, followed by six approved full-research slices. The materializer was reconciled with live Development code and changed to avoid the 13 MB whole-portfolio projection. It now loads bounded slice evidence and exact per-security/per-benchmark history counts. Development Edge only was deployed; Production was not changed.

During validation, an intermediate bounded projection exposed two defects: the former whole-portfolio helper exceeded practical Edge/PostgREST limits, and a first slice-scoped implementation encountered the 1,000-row API boundary. That intermediate pass appended newer immutable snapshots containing zero-history dispositions. The corrected exact-count implementation deterministically reproduces older correct content hashes. The append helper therefore returns those older immutable rows, while `current_research_evidence_snapshot_v1` continues to select the newer erroneous rows by `created_at`.

No immutable snapshot was deleted, overwritten or fabricated. Correct closure now requires an owner-approved current-pointer/supersession persistence design or migration. No migration was created or applied because that specific schema action has not been approved. The canonical current view is consequently not valid for IC2 closure, even though all 239 securities were processed by the corrected materializer.

Independent blockers remain: 10/22 frozen benchmark authorities are loaded; 12 are absent from the approved Angel One master with no approved substitute. BLUEJET remains `METHODOLOGY_REVIEW_REQUIRED`. Human-review document evidence remains review-required.

The machine-readable stop audit is `docs/p7-ic/PortfolioAI_P7_IC2_COMPLETION_STOP_AUDIT_2026-09-29.json`.

**IC2 = BLOCKED / NOT CLOSED. IC3, R6, R7, IC6+ and P8 remain not authorized. Production and main are unchanged.**

No research, Angel One history, benchmark execution, Production change, migration, Vercel deployment, Git merge, IC4/R6, IC5/R7, IC6+, or P8 occurred.


## P7-IC IC2 canonical readiness remediation — BLOCKED — 29 September 2026

The owner-authorized Development-only remediation implemented and applied the additive canonical evidence boundary:

- `research_evidence_snapshots`;
- `research_evidence_snapshot_items`;
- `current_research_evidence_snapshot_v1` with `security_invoker = true`;
- service-only cache projection and atomic append helpers;
- append-only enforcement and owner-scoped read RLS.

A grant-gated Development-only materializer produced current canonical dispositions for all 239 held equities. Current snapshot totals are:

- READY: 0;
- INSUFFICIENT: 226;
- STALE: 8;
- CONFLICTING: 4;
- REVIEW_REQUIRED: 1 (BLUEJET).

The immutable machine-readable audit is `docs/p7-ic/PortfolioAI_P7_IC2_CANONICAL_READINESS_AUDIT_2026-09-29.json`.

Provider remediation stopped at two genuine external failures:

1. the bounded 22-benchmark Angel One path performed one public instrument-master fetch, then the market-data session was rejected with HTTP 403 before any benchmark-history call was accepted;
2. after live canonical proof of deficits for M&M, BHARTIARTL, SBIN, HDFCBANK and WABAG, the first Trendlyne residual attempt for M&M returned an overview without the mandatory `stockData` identity block. The path failed closed after one accounted attempt; the remaining three reserved units were released and the other securities were not called.

Trendlyne accounting was corrected to bind the internal daily limit to the verified external entitlement of 400/day. At the stop, 242/400 attempts had been consumed on 29 September 2026. Scheduler execution remains disabled.

Therefore IC2 is not closed. IC3 is not ready and no R6/R7 execution occurred. Production, main, Vercel and owner-controlled portfolio roles remain unchanged.


## P7-IC IC2 current-selection remediation — Stage 0/1 complete — 29 September 2026

Owner approved continuation of the IC2 blocker remediation in ChatGPT after Codex produced the current-selection repair plan.

Stage 0 read-only baseline verification is COMPLETE / PASS:

- authoritative GitHub Development baseline: `PortfolioAI-Development` at `572d87dd108c0bf2d698a8e3ea46035dfce5bfbc`;
- branch comparison against that commit: identical, 0 ahead / 0 behind;
- Development Supabase project: `PortfolioAI Dev` / `lrgpjimipfkyoqbpsqzz`, ACTIVE_HEALTHY;
- current portfolio: 248 open holdings = 239 equities + 9 ETFs;
- immutable evidence state: 1,007 `research_evidence_snapshots`, 14,913 `research_evidence_snapshot_items`;
- current view cardinality: 239 rows / 239 distinct held equities / 0 duplicate current securities;
- read-only current-selection baseline fingerprint: `10ccc67e6c8eed006c50fd3fb891e14a`;
- live Development Edge baseline: `p7-ic2-materialize-readiness` v16, `complete-research-refresh` v29, `p7-ic2-orchestrator` v4.

The canonical-current defect was independently confirmed. `append_research_evidence_snapshot_v1` is content-idempotent and returns an existing immutable snapshot when a corrected run reproduces an earlier hash, while `current_research_evidence_snapshot_v1` still determines currentness from `as_of_date, created_at, id`. Therefore an older corrected snapshot cannot become current again after a newer erroneous immutable snapshot has been inserted.

The observed current view remains unsuitable for IC2 closure and matches the prior stop audit:

- snapshot dispositions: READY 0, INSUFFICIENT 128, STALE 2, CONFLICTING 0, REVIEW_REQUIRED 109;
- requirement states: FRESH 829, INSUFFICIENT 258, MISSING 2,170, STALE 2, CONFLICTING 0, REVIEW_REQUIRED 246.

Stage 1 canonical-selection contract is COMPLETE / PASS at design level:

- immutable snapshot content and canonical selection are separated;
- a single reconciliation campaign/run identity spans all bounded slices;
- each bounded slice retains its own one-time execution-grant identity;
- one fixed `evaluation_as_of` and one fixed `source_cutoff_at` are required across the full campaign;
- content idempotency and selection idempotency are separate;
- same-run retries must resolve idempotently;
- partial-slice failures must be resumable without deleting successful selections;
- initial backfill must preserve the current pre-remediation view exactly;
- later reconciliation, not the migration itself, changes canonical selection;
- currentness must derive from the latest valid canonical selection event rather than snapshot creation time;
- the future selection ledger remains append-only, owner-readable under RLS, with no anonymous/browser write path and service-controlled writes only;
- the current view must retain `security_invoker = true`.

No migration has been created or applied. No database row was changed. No provider call was made. No Edge Function was deployed. Production and `main` remain unchanged. IC3/R6/R7/IC6+/P8 remain not authorized.

**Stage 0 = COMPLETE / PASS. Stage 1 = COMPLETE / PASS. Stage 2 = NOT STARTED. IC2 remains BLOCKED / NOT CLOSED pending the approved additive remediation build and later reconciliation.**


## P7-IC IC2 current-selection remediation — Stage 2 repository package — 29 September 2026

Stage 2 repository implementation package has been created on `PortfolioAI-Development`.

Artifacts:
- additive migration: `supabase/migrations/20260929235000_add_p7_ic2_canonical_snapshot_selection_ledger.sql`;
- transaction-only verification script: `supabase/tests/p7_ic2_current_selection_ledger.sql`;
- frozen contract: `docs/p7-ic/PortfolioAI_P7_IC2_CURRENT_SELECTION_CONTRACT_V1.md`;
- machine-readable Stage 2 audit: `docs/p7-ic/PortfolioAI_P7_IC2_CURRENT_SELECTION_REMEDIATION_STAGE2_AUDIT_2026-09-29.json`.

The migration is additive and preserves the existing immutable snapshot/item tables. It introduces `research_evidence_snapshot_selections`, backfills the pre-migration current projection without changing observable current state, changes `current_research_evidence_snapshot_v1` to resolve through canonical selection events, and adds service-only `append_and_select_research_evidence_snapshot_v2`.

The repository verification script is designed to run inside a transaction and ends with `ROLLBACK`. It checks backfill cardinality, one-current-row-per-security behavior, RLS/grants, `security_invoker`, older-snapshot reactivation without immutable snapshot/item growth, same-run retry idempotency, different-content idempotency failure, append-only mutation rejection, and composite snapshot/security integrity.

Repository delta from the Stage 0 baseline is controlled and contains only the approved remediation documentation plus the new migration/test package.

No migration has been applied to PortfolioAI Dev. No database row has been changed by Stage 2. No Edge Function has been deployed. No provider call has occurred. Production and `main` remain unchanged.

**Stage 2 repository package = COMPLETE. Local/replay execution verification = PENDING. Stage 3 = NOT AUTHORIZED. IC2 remains BLOCKED / NOT CLOSED.**


## P7-IC IC2 current-selection remediation — Stage 2 COMPLETE / PASS — 30 September 2026

The unapplied Stage 2 package was corrected locally before any hosted Development application:

- selection idempotency is scoped by `portfolio_id + selection_run_id + security_id`;
- the V2 reuse path verifies portfolio, snapshot metadata, and the complete normalized submitted item payload against the stored immutable snapshot items;
- verification proves exact backfill/current snapshot-ID equivalence and a documented deterministic mapping fingerprint;
- the contract and machine-readable audit reflect the corrected behavior.

Verification completed in two isolated local modes:

1. the full repository migration chain replayed successfully from scratch, followed by a controlled two-snapshot fixture and transaction-only behavioral verification;
2. a read-only dump of hosted PortfolioAI Dev public data was restored into an isolated local database at the exact pre-ledger migration boundary, then the corrected migration and rollback-only verification were executed against the real Development evidence dataset.

Real Development-data replay preserved the complete baseline:

- immutable snapshots: `1,007` before / `1,007` after;
- immutable snapshot items: `14,913` before / `14,913` after;
- current rows: `239` before / `239` after;
- distinct portfolio/security pairs: `239` before / `239` after;
- backfill selections: `239`;
- strengthened deterministic mapping fingerprint: `3c94aeafe90316a777de0ec6cd72350f` before and after;
- snapshot dispositions unchanged: READY `0`, INSUFFICIENT `128`, STALE `2`, CONFLICTING `0`, REVIEW_REQUIRED `109`;
- requirement states unchanged: FRESH `829`, INSUFFICIENT `258`, MISSING `2,170`, STALE `2`, CONFLICTING `0`, REVIEW_REQUIRED `246`.

The earlier Stage 0 fingerprint `10ccc67e6c8eed006c50fd3fb891e14a` used an undocumented serialization. Stage 2 does not reinterpret it. The strengthened replay records its exact serialization (`portfolio_id:security_id:snapshot_id`, newline-delimited and ordered by portfolio/security), proves identical pre/post values, and separately proves exact mapping-set equality.

The real-data transaction verification completed `BEGIN / DO / DO / DO / DO / ROLLBACK`, including canonical reselection, content and selection idempotency, tampered-item fail-closed behavior, append-only enforcement, privilege checks, `security_invoker`, and cross-scope FK rejection.

No migration has been applied to hosted PortfolioAI Dev. No hosted row changed. No Edge Function was deployed. No provider was called. Production and `main` remain unchanged.

**Stage 2 = COMPLETE / PASS. Stage 3 = NOT STARTED / NOT AUTHORIZED. IC2 remains BLOCKED / NOT CLOSED pending separate owner approval for hosted Development migration application.**


## P7-IC IC2 current-selection remediation — Stage 3 COMPLETE / PASS — 30 September 2026

Owner explicitly approved migration `20260929235000` for hosted PortfolioAI Dev. The migration was applied through the Supabase Management API as a single migration file and recorded in hosted migration history. A broad `db push` was deliberately not used because four earlier IC2 migrations are recorded remotely under historical timestamp aliases and must not be replayed.

Hosted Development preservation checks passed exactly:

- immutable snapshots: `1,007` before / `1,007` after;
- immutable snapshot items: `14,913` before / `14,913` after;
- current rows and distinct portfolio/security pairs: `239 / 239` before and after;
- initial behavior-preserving selections: `239`;
- deterministic mapping fingerprint: `3c94aeafe90316a777de0ec6cd72350f` before and after;
- snapshot and requirement-state matrices unchanged.

Hosted security and behavior checks passed: `security_invoker = true`, owner-scoped authenticated read, no anonymous read, no authenticated writes, no authenticated V2 execution, service-role V2 execution, exact mapping equivalence, immutable content reuse, tampered-item fail-closed behavior, append-only enforcement, and cross-scope rejection. The behavioral script completed inside a transaction and rolled back.

Database lint passed with only the pre-existing `get_portfolio_coverage_registry_v1` STABLE/VOLATILE warning. Hosted migration history contains `20260929235000 / add_p7_ic2_canonical_snapshot_selection_ledger`.

No Edge Function was deployed and no corrective selection occurred during Stage 3. No provider was called. Production and `main` remain unchanged.

**Stage 3 = COMPLETE / PASS. Stage 4 materializer integration is authorized and in progress. IC2 remains BLOCKED / NOT CLOSED until the 239-equity canonical reconciliation and closure audit pass.**


## P7-IC IC2 current-selection remediation — COMPLETE / PASS / CLOSED — 30 September 2026

The remaining owner-authorized current-selection remediation stages completed in hosted PortfolioAI Dev.

Stage 4 deployed `p7-ic2-materialize-readiness` version 17 from Development commit `9200921`. The function is Development-bound, one-time-grant controlled, provider-free, uses one fixed campaign evaluation/source cutoff, and writes through `append_and_select_research_evidence_snapshot_v2`.

Stage 5 canaries passed:

- ANANTRAJ reactivated an existing corrected immutable snapshot and now exposes `STOCK_HISTORY_READY` rather than false zero-history;
- GROWW preserved genuine short history;
- BLUEJET preserved its explicit methodology-review blocker.

Stage 6 reconciled all 239 held equities under selection run `e8b6aeb3-78a8-4b71-a328-0e98d03a08bb`, fixed at `2026-09-29T23:59:59.999Z`. All 239 immutable snapshots were reused; no snapshot or snapshot item was created, changed, or deleted. The campaign appended exactly 239 canonical selection events and changed 158 current mappings from the behavior-preserving backfill.

The true canonical requirement matrix is now:

- FRESH: `1,081`;
- INSUFFICIENT: `18`;
- MISSING: `2,158`;
- STALE: `2`;
- CONFLICTING: `0`;
- REVIEW_REQUIRED: `246`.

Compared with the invalid pointer view, FRESH increased by `252`, INSUFFICIENT decreased by `240`, and MISSING decreased by `12`. The stock-level matrix remains READY `0`, INSUFFICIENT `128`, STALE `2`, CONFLICTING `0`, REVIEW_REQUIRED `109`; those top-level totals are coincidentally unchanged because legitimate document and evidence blockers still dominate many corrected stocks.

Residuals are explicit and valid terminal IC2 dispositions: nine genuine short-history equities, 245 document-review requirements across 108 securities, BLUEJET methodology review, two stale requirements, 2,074 remaining required-evidence gaps, and 12 unavailable authorities from the frozen 22-benchmark set. No semantic conflict remains.

Stage 7 repeatability passed across all 239 equities: snapshots created `0`, snapshots reused `239`, selections created `0`, selections reused `239`, provider calls `0`, and fingerprint unchanged at `836b9474f5683d15b231c370aa0791f5`.

The immutable completion audit is `docs/p7-ic/PortfolioAI_P7_IC2_CURRENT_SELECTION_REMEDIATION_COMPLETION_AUDIT_2026-09-30.json`.

**IC2 = COMPLETE / PASS / CLOSED. IC3 remains NOT STARTED / NOT AUTHORIZED. No R6/R7/IC6+/P8 work occurred. Production and `main` remain unchanged.**

## P7-IC IC3 canonical current snapshots — COMPLETE / PASS / AWAITING IC-C — 30 September 2026

Owner-authorized IC3 completed in hosted PortfolioAI Dev. Additive migration `20260930022314` adds an append-only snapshot-lineage companion, IC3-specific selection basis, service-only atomic V3 append/select function, and `security_invoker` current-lineage view. All prior immutable snapshots/items and IC2 selection history remain preserved.

One cache-only campaign materialized 239/239 current equity snapshots with classification version, methodology role, and assignment identity/version. Complete lineage is 239/239, incomplete lineage is zero, provider calls are zero, and the deterministic current mapping fingerprint is `31f15adbe874c095f689128ed7ac1576`.

Evidence semantics are unchanged: snapshot dispositions remain INSUFFICIENT 128, STALE 2, REVIEW_REQUIRED 109, READY 0 and CONFLICTING 0. Excluding the new lineage item, requirement states remain FRESH 1,081, INSUFFICIENT 18, MISSING 2,158, STALE 2, REVIEW_REQUIRED 246 and CONFLICTING 0.

The completion audit is `docs/p7-ic/PortfolioAI_P7_IC3_CANONICAL_SNAPSHOT_COMPLETION_AUDIT_2026-09-30.json`.

**IC3 = COMPLETE / PASS. STOP at IC-C. IC-C = AWAITING OWNER APPROVAL. IC4/R6, IC5/R7, IC6+, P8, Production and `main` remain untouched and unauthorized.**

## P7-IC IC4 R6 current portfolio execution — COMPLETE / PASS — 30 September 2026

The owner approved IC-C and authorized Development-only IC4. IC4 consumed the 239 canonical IC3 snapshots cache-only with zero provider calls, zero AI numeric influence, no missing-input renormalization and no cross-profile fallback.

Every equity received one current deterministic R6 disposition: INSUFFICIENT_EVIDENCE 128, STALE_REQUIRED_EVIDENCE 2, REVIEW_REQUIRED 109, with SCORED 0 and CONFLICTING_EVIDENCE 0. Numeric coverage is therefore 0/239 and is reported separately rather than fabricated. Each row preserves its IC3 snapshot, classification, methodology/profile, methodology role and assignment lineage plus exact blocker reason codes.

The machine-readable execution audit is `docs/p7-ic/PortfolioAI_P7_IC4_R6_CURRENT_PORTFOLIO_EXECUTION_AUDIT_2026-09-30.json`; its SHA-256 is `4b97fd85259c4b2a586cbc783807b8c71a69814f3010ff14fdd32d0f518a03b5`.

**IC4/R6 = COMPLETE / PASS. IC5/R7 is authorized by approved IC-C but has not started. Stop remains IC-D after IC5. No database write, migration, provider call, deployment, Production or `main` change occurred in IC4.**

## P7-IC IC5 R7 candidacy and sizing readiness — COMPLETE / PASS / AWAITING IC-D — 30 September 2026

IC5 consumed the completed current IC4/R6 dispositions cache-only. Because numeric R6 coverage is 0/239, no equity is eligible for a candidacy recommendation: INSUFFICIENT_EVIDENCE 130 and REVIEW_REQUIRED 109. CORE_CANDIDATE, SATELLITE_CANDIDATE, WATCH and AVOID coverage are each zero. This is the required fail-closed result, not an incomplete execution.

All 239 owner roles were projected separately and left unchanged. Role compatibility was not evaluated where R6 was not scored. Sizing readiness is blocked for all 239, with no invented target/minimum/maximum weights. IC5 produced zero owner-facing action states; ACCUMULATE/HOLD/WATCH/REDUCE/EXIT_REVIEW remain an IC6 projection requiring R8 and Movement.

The machine-readable audit is `docs/p7-ic/PortfolioAI_P7_IC5_R7_CURRENT_PORTFOLIO_EXECUTION_AUDIT_2026-09-30.json`; its SHA-256 is `0b567dba2e03359f23f6b53fe6d3e5ff41c62c14d7e8866554328519326379aa`.

**IC5/R7 = COMPLETE / PASS. STOP at IC-D. IC-D = AWAITING OWNER APPROVAL. IC6+, P8, Production and `main` remain untouched and unauthorized.**

## P7-IC IC6 R8/R9/Movement/action projection — COMPLETE / PASS / AWAITING IC-E — 30 September 2026

The owner approved IC-D and authorized completion through the P7 boundary. IC6 consumed the current IC3 lineage and completed IC4/IC5 dispositions without provider calls or database writes. Because every current equity is fail-closed upstream, R8 Core Health, Portfolio Fit, Portfolio Risk and Exit Intelligence correctly produce 130 BLOCKED_PREREQUISITE and 109 REVIEW_REQUIRED dispositions. No assessment is represented as complete.

R9 records BASELINE_NOT_AVAILABLE for all 239 equities because no valid prior canonical R8 observed state exists; it does not confuse daily price movement with meaningful change. Movement is INSUFFICIENT_EVIDENCE for 130 and REVIEW_REQUIRED for 109. Every equity therefore has an explicit IC6 disposition or blocker.

Canonical action projection remains exactly ACCUMULATE, HOLD, WATCH, REDUCE and EXIT_REVIEW. It requires R7, all current R8 domains, Movement, owner context and evidence confidence/blockers. Current canonical action coverage is 0/239 and all 239 are BLOCKED_PREREQUISITE. BUY and SELL are not internal states. Owner roles remain unchanged.

The machine-readable audit is `docs/p7-ic/PortfolioAI_P7_IC6_CURRENT_PORTFOLIO_EXECUTION_AUDIT_2026-09-30.json`.

**IC6 = COMPLETE / PASS. STOP at IC-E. IC-E = APPROVED by the owner's instruction to complete IC6+ through P7 and stop before P8. No migration, database write, provider call, Production or `main` change occurred.**

## P7-IC IC7 / IC-FINAL product integration — COMPLETE / PASS / OWNER CHECKPOINT 6 — 30 September 2026

IC7 replaces the rendered frozen validation Action Center with one shared read-only current-intelligence path. The owner-scoped `current_research_evidence_snapshot_lineage_v1` view is loaded through `loadP7CurrentEvidenceSnapshots()`, projected fail-closed through `projectP7Ic6CurrentState()`, and consumed by one reusable `P7CanonicalIntelligencePanel` on both Dashboard and Intelligence.

The Dashboard now shows a compact canonical readiness block. Intelligence shows the full filterable current disposition table with owner role, R6, R7, R8, Movement and action blocker. The UI states plainly that no buy/sell signal was created, current action coverage is zero, and owner roles are unchanged. The complete open-holdings boundary is 248: 239 equities receive an explicit disposition and 9 ETFs are not applicable to the equity methodology.

Verification passed: 64 targeted IC6/R8/R9/R10/final and canonical-authority tests, TypeScript, architecture boundary guard, production build, scoped lint for every changed application file, and `git diff --check`. The deployed authenticated Development UI visibly proves 239/239 canonical equity coverage, zero R6 scores, zero R7 candidacies, zero canonical actions, 109 review-required and 130 insufficient/stale holdings; disposition filtering works and the browser reports no warning/error console entries. Repository-wide lint still has 79 pre-existing errors outside this change. The integration audit is `docs/p7-ic/PortfolioAI_P7_IC7_FINAL_UI_INTEGRATION_AUDIT_2026-09-30.json`.

**P7-IC = COMPLETE / PASS. IC-FINAL = COMPLETE / PASS. STOP at Owner Checkpoint 6. P8 = NOT AUTHORIZED / NOT STARTED. Production and `main` remain unchanged.**

## Owner Checkpoint 6 approved / P8 entered — 30 September 2026

The owner approved Owner Checkpoint 6 and authorized entry into P8. P7-IC and IC-FINAL are now formally COMPLETE / PASS / CLOSED.

P8 is governed by the Master Blueprint's Advanced Quant / Backtesting boundary. P8-0 freezes a deterministic point-in-time eligibility contract and adds a visible Development readiness surface under Intelligence. The contract rejects evidence observed or published after a simulated decision, later-captured evidence without immutable publication proof, unproven historical-universe membership, and outcome windows that overlap the decision instant.

The entry audit is fail-closed. The current portfolio has 239 canonical-current equity snapshots but zero numeric R6 scores, zero R7 candidacies, zero canonical actions and no historical canonical decision-state series. Today's holdings do not prove a survivor-free historical universe. Consequently no return, alpha, hit-rate, drawdown or policy-improvement claim is permitted.

The execution plan is `docs/p8/PortfolioAI_P8_ADVANCED_QUANT_BACKTESTING_EXECUTION_PLAN_2026-09-30.md`; the entry audit is `docs/p8/PortfolioAI_P8_STAGE0_ENTRY_AND_READINESS_AUDIT_2026-09-30.json`.

P8-0 verification passed: 18 targeted tests across the point-in-time, IC6 projection and canonical-authority contracts; changed-file lint; TypeScript; architecture boundary guard; production build; diff hygiene; and authenticated Development browser verification. The deployed `/app/intelligence/backtesting` route visibly reports BLOCKED — DATA FOUNDATION, 239 current equities, 0/239 current R6/R7 readiness, zero historical decision states and zero published backtest results; browser warnings/errors are zero.

**Owner Checkpoint 6 = APPROVED / CLOSED. P7 = COMPLETE / PASS / CLOSED. P8 = ACTIVE. P8-0 = COMPLETE / PASS. Current P8 execution gate = BLOCKED — DATA FOUNDATION. P8-A historical data sufficiency inventory is next. Production and `main` remain unchanged.**

## P8-A historical data sufficiency inventory — COMPLETE / PASS — 30 September 2026

P8-A completed as a read-only inventory against hosted PortfolioAI Dev. It made zero provider calls, database writes, migrations or performance runs. Production and `main` remain unchanged.

The inventory classified nine required data domains. Daily prices and benchmarks are partial foundations; corporate-action adjustment, point-in-time fundamentals, historical documents, historical canonical snapshots, survivor-free universe membership, classification/methodology validity history and historical decision runs are blocked. Daily prices cover all 239 equities and 63,927 rows, but provide at most 282 dates and no adjusted-close series. Canonical evidence covers 239/239 equities but only one as-of date. Listing validity dates, inactive/delisted universe history and historical score runs are absent.

The machine-readable audit is `docs/p8/PortfolioAI_P8_A_HISTORICAL_DATA_SUFFICIENCY_AUDIT_2026-09-30.json`; the handoff is `docs/p8/PortfolioAI_P8_A_HANDOFF_2026-09-30.md`. The Development readiness surface now exposes the domain-by-domain measured inventory and required remediation without presenting a return or performance claim.

**P7 = COMPLETE / PASS / CLOSED. P8 = ACTIVE. P8-0 = COMPLETE / PASS. P8-A = COMPLETE / PASS. P8-B = NOT STARTED / AWAITING OWNER-APPROVED REMEDIATION SCOPE. Current P8 execution gate = BLOCKED — DATA FOUNDATION. No performance backtest is authorized. Production and `main` remain unchanged.**

The implementation-ready continuation and safe-stop handoff is `docs/p8/PortfolioAI_P8_COMPLETION_BUILD_HANDOFF_PLAN_2026-09-30.md`. It sequences P8-B data-foundation remediation and experiment freeze through P8-C replay, P8-D simulation, P8-E adversarial validation, P8-F UI and P8-FINAL, with separate owner approvals for contract decisions, provider campaigns, migrations and the P8-C transition.


## P8-B0 re-entry baseline — 30 September 2026

P8-B0 is **COMPLETE / PASS** as a read-only re-entry and immutable baseline verification.

- Repository handoff HEAD verified: `4567bc7d7d82259d852b3a51e3c356701d9072d1`.
- Hosted Development project `PortfolioAI Dev` is healthy.
- P8-A core counts and blockers reproduced with no material drift.
- Current Development state remains 248 open holdings / 239 equities / 9 ETFs; 63,927 held-equity ONE_DAY price rows; 230 equities with at least 252 dates; zero adjusted-close coverage; 114/239 fundamental coverage with only two publication timestamps; 111/239 document coverage; 1,246 snapshots across one as-of date; no dated historical listing validity; zero historical score runs.
- Provider ledger was inspected only. P8-B0 made zero provider calls and zero database writes.
- Owner decision memo created at `docs/p8/PortfolioAI_P8_B0_OWNER_DECISION_MEMO_2026-09-30.md`.
- Baseline audit created at `docs/p8/PortfolioAI_P8_B0_REENTRY_BASELINE_AUDIT_2026-09-30.json`.

Current governance:

```text
P7 = COMPLETE / PASS / CLOSED
P8 = ACTIVE
P8-0 = COMPLETE / PASS
P8-A = COMPLETE / PASS
P8-B0 = COMPLETE / PASS
P8-B1 = AWAITING OWNER APPROVAL
P8-B2 = AWAITING OWNER APPROVAL
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
P8 execution gate = BLOCKED — DATA FOUNDATION
Production = UNCHANGED
main = UNCHANGED
```


## P8-B1 frozen experiment contract — 30 September 2026

P8-B1 is **COMPLETE / PASS** under the approved P8-B0 owner memo.

Repository implementation now freezes the first bounded historical experiment in `src/features/backtesting/p8ExperimentContract.ts` with focused tests in `src/features/backtesting/p8ExperimentContract.test.ts`. The contract fixes the historical NSE universe policy, 2023-10-01 through 2026-09-30 observation window, monthly post-close IST decision rule, minimum 24 proven decision dates, strict signal lag, six-month primary horizon, NIFTY 500 TRI benchmark rule, fail-closed missing-data behavior, historical validity rules, chronological 60/20/20 split, multiple-testing/holdout controls, dated cost policy, 10 bps base slippage, 5% median-traded-value liquidity ceiling and live-policy prohibitions.

No provider call, database write, migration, RLS change, Edge Function deployment, P8-C replay, Production change or `main` change was made.

Verification is complete for the P8-B1 scope: strict standalone TypeScript passed; all seven frozen-contract behavior cases passed against the exact implementation semantics; deterministic SHA-256 repeatability passed; and the exact Development commit received a successful Vercel status using the repository build command (`tsc -b && vite build`). The architecture guard was not rerun because B1 changed no `src/pages` or `src/components` files, which are the guard's complete scan surface. Repository ESLint was not available in the connector runtime; this omission and its residual risk are recorded in the stage audit.

Current governance:

```text
P8 = ACTIVE
P8-0 = COMPLETE / PASS
P8-A = COMPLETE / PASS
P8-B0 = COMPLETE / PASS
P8-B1 = COMPLETE / PASS
P8-B2+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
P8 execution gate = BLOCKED — DATA FOUNDATION
Production = UNCHANGED
main = UNCHANGED
```


## P8-B2 historical universe foundation package — 30 September 2026

P8-B2 is **IN PROGRESS — HOSTED FOUNDATION APPLIED / VERIFIED; HISTORICAL UNIVERSE RECONSTRUCTION PENDING** under explicit owner authorization.

Created repository-only migration `20260930061500_create_p8_historical_universe_foundation.sql`, its transactional SQL contract test, design note and machine-readable audit. The package introduces append-only owner-scoped historical listing observations, decision-instant universe runs, member dispositions and canonical selection history, with service-only mutation paths and `security_invoker` read models. It contains no current-holdings or `securities.is_active` historical fallback and does not rewrite existing `security_listings.valid_from/valid_to` values.

No provider call, hosted database write, hosted migration application, Edge Function deployment, P8-B3+, P8-C, Production or `main` change has occurred.

Local verification was completed on commit `ecf871dc09f65b1fbe71e22b74d23f5481b33493`: `supabase db reset` applied the P8-B2 migration successfully, and `supabase/tests/p8_b2_historical_universe_foundation.sql` completed `BEGIN → DO → DO → ROLLBACK` with no error. The test is self-contained and leaves no fixture data behind. Hosted Development application remains separately approval-gated.

Current governance:

```text
P8 = ACTIVE
P8-0 = COMPLETE / PASS
P8-A = COMPLETE / PASS
P8-B0 = COMPLETE / PASS
P8-B1 = COMPLETE / PASS
P8-B2 = IN PROGRESS / HOSTED FOUNDATION PASS / HISTORICAL UNIVERSE RECONSTRUCTION PENDING
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Hosted P8-B2 migration = APPLIED / VERIFIED (`20260930083620`)
Production = UNCHANGED
main = UNCHANGED
```


Hosted P8-B2 application verification:

- hosted migration `20260930083620_create_p8_historical_universe_foundation` applied successfully to PortfolioAI Dev only;
- the hosted transactional SQL contract test passed and rolled back with zero fixture residue;
- 4 P8-B2 tables, 2 `security_invoker` views and 3 functions are present;
- RLS is enabled on all 4 new tables;
- authenticated read / anonymous deny / service-only append and universe-run execution privileges match the contract;
- all new P8-B2 evidence/run/selection tables remain empty after verification;
- existing counts remain 284 securities, 282 listings, 496 transactions, 1,246 research snapshots, 717 snapshot selections and 239 snapshot-lineage rows;
- provider ledger remains 1,227 events with latest attempt at 2026-09-30T03:09:13.319Z, so this hosted migration/verification made zero provider calls.

Gate B2 is **not yet closed**. The governing P8 plan requires every approved decision date to reconstruct an eligible historical universe or produce a deterministic global blocker. Historical listing/delisting acquisition and reconstruction remain a separate, approval-gated next action.


## P8-B2 historical NSE universe acquisition — 30 September 2026

Owner approval received for the next P8-B2 historical listing/universe acquisition and reconstruction step. **Development Status is updated immediately: P8-B2 acquisition is AUTHORIZED / ACTIVE.**

The hosted B2 foundation remains applied and verified. A bounded official-NSE acquisition campaign has been prepared using the CM MII security master `NSE_CM_security_DDMMYYYY.csv.gz` for February 2024 through September 2026. This interval provides 32 monthly opportunities against the frozen minimum of 24 proven decision dates. The runner probes backward from each month-end and accepts only an actual official file; it does not infer holidays or invent dates.

Repository acquisition runner: `scripts/p8/p8-b2-acquire-nse-universe.mjs`. It writes raw immutable files plus SHA-256 manifest evidence and performs no database writes.

Current governance:

```text
P8 = ACTIVE
P8-0 = COMPLETE / PASS
P8-A = COMPLETE / PASS
P8-B0 = COMPLETE / PASS
P8-B1 = COMPLETE / PASS
P8-B2 = ACTIVE / HOSTED FOUNDATION PASS / HISTORICAL UNIVERSE ACQUISITION AUTHORIZED
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```


## P8-B2 acquisition result — 30 September 2026

Local owner-run acquisition completed successfully for the authorized official-NSE campaign.

```text
months_requested = 32
months_acquired = 32
months_missing = 0
minimum_proven_decision_dates = 24
minimum_met = true
```

The month-end probe correctly handled unavailable archive dates by moving backward to the first actual official file (for example September 2026 resolved despite a 404 on the initial probe). No missing month remains in the acquisition manifest.

P8-B2 now advances from acquisition to **schema/hash inspection and historical-universe reconciliation**. A read-only local inspection runner was added at `scripts/p8/p8-b2-inspect-nse-universe.mjs`. It verifies each CSV SHA-256 against the acquisition manifest, checks schema consistency across all 32 files, counts rows and captures the actual provider header set. It performs no database writes and no provider calls.

Current governance:

```text
P8-B2 acquisition = COMPLETE / PASS (32/32 months)
P8-B2 schema/hash inspection = READY / LOCAL READ-ONLY
P8-B2 historical universe reconstruction = NOT YET MATERIALIZED
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```


## P8-B2 NSE schema/hash inspection result — 30 September 2026

Owner local verification of the acquired official-NSE universe files passed:

```text
files_checked = 32
all_hashes_pass = true
total_rows_across_files = 991687
unique_header_set_count = 2
```

All 32 acquired files match their manifest SHA-256 values. The 32 files contain 991,687 total rows. Two distinct header schemas are present, so parser/reconciliation must be schema-version-aware; a single hard-coded column layout would be unsafe.

P8-B2 therefore advances to **schema-version mapping and dry-run historical-universe reconciliation**. No database materialization is authorized until the two header sets are explicitly mapped and the dry-run reconciliation proves deterministic identity handling, survivor-free decision-date membership, and explicit blockers for unresolved records.

Current governance:

```text
P8-B2 acquisition = COMPLETE / PASS (32/32 months)
P8-B2 hash integrity = COMPLETE / PASS
P8-B2 schema uniformity = MIXED / 2 HEADER VERSIONS
P8-B2 schema-version mapping = REQUIRED / NEXT
P8-B2 historical universe reconstruction = NOT YET MATERIALIZED
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```


## P8-B2 two-schema mapping detail — 30 September 2026

The owner-provided local schema comparison confirms both NSE layouts contain 120 columns. The version-specific differences are:

```text
V1-only: ElgbltyRETDBTMkt, Rsvd01
V2-only: ElgbltyClsgAuctnSsn, XchgExclsv
```

The month mapping shows the campaign is V1 through June 2026 and V2 from July 2026 onward. These fields are not assumed to be equivalent or renamed without evidence; the parser will treat them as version-specific optional attributes and keep core identity/universe fields on the common schema only.

A read-only semantic-analysis runner is added at `scripts/p8/p8-b2-analyze-nse-schema.mjs`. It extracts only identity/listing/security-relevant common columns, representative values for each schema version, and the exact month/version transition. No provider calls or database writes occur.


## P8-B2 semantic schema inspection — 30 September 2026

The schema semantic-analysis runner completed successfully and wrote `tmp/p8-b2-nse/schema-semantic-analysis.json`. Representative V2 identity/listing fields include `FinInstrmId`, `TckrSymb`, `SctySrs`, `FinInstrmNm`, `ISIN`, `SctyTpFlg`, `SctyTp`, `InstrmNm`, market identifiers and exchange fields. The two version-specific fields remain isolated from the core parser contract.

Before freezing the eligibility/parser rules, P8-B2 requires one compact semantic profile of the candidate identity/type fields so that equity filtering is based on observed NSE values rather than guessed meanings. Added `scripts/p8/p8-b2-profile-nse-identity.mjs`, which reads only the local analysis file and produces `tmp/p8-b2-nse/identity-profile.json`. No provider calls or database writes occur.


## P8-B2 NSE identity/type profile — 30 September 2026

The local NSE identity profile completed. Observed `SctyTpFlg` values include `0`, `2` and `4`; `SctyTp`, `InstrmNm`, `MktTpAndId` and `Xchg` are blank in the sampled profile. ISIN and common identity fields are populated, but the observed type-flag values alone are not sufficient authority to infer equity eligibility.

To avoid guessing NSE semantics, the next read-only step profiles the full 32-file distribution of `SctySrs × SctyTpFlg` with representative ticker/ISIN/name samples. Added `scripts/p8/p8-b2-profile-nse-series-flags.mjs`. No provider calls or database writes occur.


## P8-B2 NSE equity eligibility rule — 30 September 2026

NSE's official Master Data Technical Specifications explicitly define the Capital Market security-master instrument type as: `0 = Equities`, `1 = Preference Shares`, `2 = Debentures`, `3 = Warrants`, `4 = Miscellaneous`. Therefore the P8-B2 historical-equity eligibility rule is now frozen to `SctyTpFlg = "0"` for the acquired MII security files. Series is retained as evidence but is not used as a guessed substitute for instrument type.

This resolves the earlier ambiguity observed in the local profile (`0`, `2`, `4`). A read-only dry-run parser has been added at `scripts/p8/p8-b2-dry-run-nse-equities.mjs`. It filters only official instrument type 0 rows, uses ISIN as the primary stable identity, records symbol/series/name/instrument-ID changes without overwriting them, reports missing/duplicate ISINs, fingerprints every monthly universe, and produces a global identity fingerprint. It makes no database writes and no provider calls.


## P8-B2 NSE equity dry-run result — 30 September 2026

The owner-run dry parser completed against all 32 acquired NSE files.

```text
files_checked = 32
total_equity_rows = 597092
global_unique_isins = 5211
rows_missing_isin = 0
duplicate_isin_rows = 466208
changed_identity_isins = 4398
```

The zero missing-ISIN count is a strong identity-quality result, but the very large duplicate-row count proves that a single ISIN can have multiple contemporaneous eligible security-master rows (for example different series/instrument IDs). Therefore P8-B2 must not collapse rows arbitrarily or choose one series by assumption.

The next local read-only diagnostic is `scripts/p8/p8-b2-profile-duplicate-identities.mjs`. It measures whether same-month duplicate ISIN groups differ by symbol, series, security name and instrument ID, and captures bounded examples. This will determine whether monthly universe membership can be safely deduplicated at ISIN level while retaining all line-level evidence, or whether an additional evidence-bundle schema is required.


## P8-B2 duplicate identity diagnostic — 30 September 2026

The owner-run NSE duplicate-identity diagnostic completed across all 32 monthly files:

```text
files_checked = 32
duplicate_isin_months = 32
duplicate_isin_groups = 114908
multi_symbol_groups = 569
multi_series_groups = 114908
multi_name_groups = 28019
multi_instrument_id_groups = 114908
```

This is a decisive schema finding. Every duplicate-ISIN group differs by series and instrument ID, while smaller subsets also differ by symbol and security name. Therefore a single arbitrary NSE row cannot be selected as the sole evidence for historical ISIN-level universe membership.

P8-B2 historical membership identity remains ISIN-level, but the existing schema's single nullable `listing_observation_id` on a universe member cannot preserve the observed many-line-to-one-security evidence structure. An additive append-only member-to-listing-observation evidence-link relation is required before materialization.

No new migration has been created yet. Under the P8 migration protocol this schema extension requires explicit owner approval for Development-only local migration design/replay, followed by separate approval before hosted application.

Current governance:

```text
P8-B2 acquisition = COMPLETE / PASS
P8-B2 hash/schema/identity diagnostics = COMPLETE / PASS
P8-B2 duplicate structure = PROVEN MANY-TO-ONE AT ISIN LEVEL
P8-B2 historical universe materialization = BLOCKED / ADDITIVE EVIDENCE-LINK SCHEMA REQUIRED
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```


## P8-B2 evidence-link migration package — 30 September 2026

Owner approval received for the Development-only additive many-to-one evidence-link schema. The migration package is now created but **not applied to hosted PortfolioAI Dev**.

Created:

- `supabase/migrations/20260930170500_add_p8_b2_member_listing_evidence_links.sql`
- `supabase/tests/p8_b2_member_listing_evidence_links.sql`
- `docs/p8/PortfolioAI_P8_B2_MEMBER_LISTING_EVIDENCE_LINK_EXTENSION_2026-09-30.md`
- machine-readable package audit

The extension preserves all existing B2 objects and adds an append-only member-to-listing-observation bridge, an owner-scoped `security_invoker` evidence-bundle view, and a service-only V2 append/select function. V2 keeps one member per security identity while preserving every linked NSE line-level observation and leaves the legacy single `listing_observation_id` null.

Current governance:

```text
P8-B2 evidence-link migration = CREATED / LOCAL REPLAY PENDING
Hosted application = NOT AUTHORIZED / NOT APPLIED
Historical universe materialization = NOT STARTED
Provider calls = 0
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B2 evidence-link local replay verification — 30 September 2026

Owner-run local verification completed against Development commit `3dc490d8b8251a092c5bb3a1c0ba3a0a31056664`.

Verification evidence:

- `supabase db reset` completed successfully on the isolated local stack;
- migration `20260930170500_add_p8_b2_member_listing_evidence_links.sql` applied during the clean replay;
- `supabase/tests/p8_b2_member_listing_evidence_links.sql` completed with the required terminal sequence `BEGIN → DO → DO → ROLLBACK`;
- no SQL error occurred and the transactional test left no fixture data behind;
- no hosted PortfolioAI Dev migration/application was performed;
- no historical universe materialization, provider call, P8-B3, P8-C, Production or `main` change was performed.

Current governance:

```text
P8 = ACTIVE
P8-0 = COMPLETE / PASS
P8-A = COMPLETE / PASS
P8-B0 = COMPLETE / PASS
P8-B1 = COMPLETE / PASS
P8-B2 acquisition = COMPLETE / PASS
P8-B2 hash/schema/identity diagnostics = COMPLETE / PASS
P8-B2 duplicate structure = PROVEN MANY-TO-ONE AT ISIN LEVEL
P8-B2 evidence-link migration package = LOCAL REPLAY / TEST COMPLETE / PASS
Hosted PortfolioAI Dev application = NOT AUTHORIZED / NOT APPLIED
Historical universe materialization = NOT STARTED
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B2 evidence-link hosted Development application verification — 30 September 2026

Owner approval received for hosted PortfolioAI Dev application of the already locally replayed P8-B2 evidence-link migration.

Applied to **PortfolioAI Dev only**:

- hosted project: `lrgpjimipfkyoqbpsqzz`;
- hosted migration: `20260930172115_add_p8_b2_member_listing_evidence_links`;
- exact repository migration source: `supabase/migrations/20260930170500_add_p8_b2_member_listing_evidence_links.sql`;
- hosted transactional contract test: PASS / rolled back;
- evidence-link table, canonical evidence view and V2 append/select function: PRESENT;
- evidence-link RLS: ENABLED;
- canonical evidence view: `security_invoker=true`;
- anonymous SELECT: DENIED;
- authenticated SELECT: GRANTED and constrained by owner-scoped RLS;
- authenticated V2 execution: DENIED;
- service-role V2 execution: GRANTED;
- P8 listing observations / universe runs / members / selections / evidence links after verification: all zero;
- preservation counts remain 284 securities, 282 security listings and 496 transactions.

Supabase advisors report two expected authenticated-GraphQL visibility warnings for the authenticated-readable table/view; row access remains owner-scoped by RLS. Performance advisors also report two composite-FK indexing notices and unused-index notices on the empty new table. These are advisory/non-blocking for this correctness gate and no further schema change is authorized by this checkpoint.

No provider call, historical-universe materialization, P8-B3, P8-C, Production or `main` change occurred.

Current governance:

```text
P8 = ACTIVE
P8-0 = COMPLETE / PASS
P8-A = COMPLETE / PASS
P8-B0 = COMPLETE / PASS
P8-B1 = COMPLETE / PASS
P8-B2 acquisition = COMPLETE / PASS
P8-B2 hash/schema/identity diagnostics = COMPLETE / PASS
P8-B2 duplicate structure = PROVEN MANY-TO-ONE AT ISIN LEVEL
P8-B2 evidence-link migration = HOSTED DEVELOPMENT APPLIED / VERIFIED / PASS
P8-B2 historical universe materialization = NOT STARTED
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B2 historical identity reconciliation gate — 30 September 2026

Owner approval received to continue P8-B2 historical universe reconstruction/materialization. Before any universe data write, the canonical identity prerequisite is being measured fail-closed.

Measured hosted baseline:

- official NSE historical equity universe from the acquired B2 evidence: 5,211 unique ISINs;
- PortfolioAI Dev canonical securities: 284;
- canonical securities with ISIN: 256.

Created a read-only Development security identity snapshot and local reconciliation runner. The runner must establish exact ISIN overlap, current null-ISIN candidates, symbol collisions, required historical security additions and whether the acquired GZIP metadata supplies a defensible source publication timestamp. It performs no database writes or provider calls.

Current governance:

```text
P8-B2 evidence-link migration = HOSTED DEVELOPMENT APPLIED / VERIFIED / PASS
P8-B2 historical identity reconciliation = ACTIVE / LOCAL RUN REQUIRED
P8-B2 historical universe materialization = NOT YET STARTED
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B2 historical identity reconciliation result — 30 September 2026

Owner-run local reconciliation against Development commit `ddb6a4488046981435b4b2a59bcd7a36eec047dc` completed fail-closed.

Observed result:

- files checked: 32;
- total official-NSE equity rows: 597,092;
- historical unique equity ISINs: 5,211;
- PortfolioAI Dev canonical securities: 284;
- canonical distinct ISINs: 256;
- exact historical-to-canonical ISIN matches: 256;
- current null-ISIN symbol candidates requiring reconciliation: 7;
- historical canonical additions otherwise required under the current `securities.id` FK model: 4,948;
- current symbol-collision groups: 51;
- latest-month multi-symbol ISINs: 25;
- latest-month multi-name ISINs: 882;
- current equity ISINs absent from the archive: 0;
- rows missing ISIN: 0;
- CSV parse errors: 0;
- source hash mismatches: 0;
- GZIP files with usable MTIME publication timestamp: 0 / 32.

The runner therefore returned `ready_for_materialization = false` with exactly these blockers:

```text
SOURCE_PUBLICATION_TIMESTAMP_NOT_PROVEN_FROM_GZIP_METADATA
CANONICAL_CURRENT_SECURITIES_REQUIRE_ISIN_RECONCILIATION
CANONICAL_HISTORICAL_SECURITY_ADDITIONS_REQUIRED
```

No historical listing observation, universe run, universe member, selection or evidence link was written. No canonical security was created or modified.

Current governance:

```text
P8-B2 historical identity reconciliation = COMPLETE / BLOCKERS PROVEN
P8-B2 historical universe materialization = BLOCKED / NOT STARTED
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B2 historical identity remediation decision — 1 October 2026

The uploaded historical-identity reconciliation was analyzed in full. The live `securities` table is not a safe historical-universe registry because historical ISINs reuse current symbols and one historical ISIN may expose multiple symbols. Bulk historical insertion into `securities` is prohibited.

Frozen common-equity identity refinement:

```text
source identities                              5211
P8 company-equity identities                   4524
exact current common-equity links               255
current null-ISIN link candidates                 7
P8-local historical identities required        4262
excluded non-frozen identities                  687
eligible-cohort symbol-collision groups          40
```

Decision: introduce a P8-local historical identity registry with optional current-security linkage and preserve symbol/name/series/instrument-ID as dated evidence. Do not mutate the seven live null-ISIN securities in B2 and do not add 4,262 historical identities to the live canonical security registry.

The source-time blocker is redesigned fail-closed: GZIP MTIME is not used. Official NSE daily security-master dissemination plus the documented requirement to load the security master before trading hours supports a conservative `available_no_later_than_at` proof field; exact publication time will not be invented.

A read-only classification validator has been created. No new migration or hosted write is authorized by this checkpoint.

Current governance:

```text
P8-B2 historical identity reconciliation = COMPLETE
P8-B2 remediation design = COMPLETE
P8-B2 classification validation = LOCAL RUN PENDING
P8-B2 historical universe materialization = BLOCKED PENDING NEW ADDITIVE IDENTITY/PROVENANCE SCHEMA
P8-B2 new migration = NOT CREATED / REQUIRES SEPARATE OWNER APPROVAL
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B2 historical identity/source-archive V3 migration package — 1 October 2026

Owner approval received to create the additive P8-B2 remediation migration package and local contract test.

Created:

- `supabase/migrations/20261001001500_create_p8_b2_historical_identity_registry_v3.sql`;
- `supabase/tests/p8_b2_historical_identity_registry_v3.sql`;
- `docs/p8/PortfolioAI_P8_B2_HISTORICAL_IDENTITY_REGISTRY_V3_EXTENSION_2026-10-01.md`;
- `docs/p8/PortfolioAI_P8_B2_HISTORICAL_IDENTITY_REGISTRY_V3_EXTENSION_AUDIT_2026-10-01.json`.

The V3 package introduces a P8-local historical identity registry, immutable source archives with conservative availability upper bounds, identity-keyed line-level listing evidence, identity-keyed universe runs/members/evidence links/selections, owner-scoped RLS, three `security_invoker` views, and four service-only append/select functions.

Static package review:

```text
new tables = 7
new views = 3
new functions = 4
RLS policies = 7
security_invoker views = 3
DROP statements = 0
public.securities updates = 0
legacy B2 v1/v2 table alterations = 0
```

No historical data has been materialized and no hosted schema change has been made.

Current governance:

```text
P8-B2 reconciliation = COMPLETE
P8-B2 remediation design = COMPLETE
P8-B2 V3 migration package = CREATED
P8-B2 V3 local classification/replay = PENDING
P8-B2 V3 hosted application = NOT AUTHORIZED / NOT APPLIED
P8-B2 historical universe materialization = NOT STARTED
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B2 V3 local classification verification — 1 October 2026

Owner-run classification validation completed against Development commit `60dd4da3a858231a689a5c495e4eb9c50669779c` and matched the frozen remediation contract exactly.

```text
historical_unique_identities = 5211
frozen_company_equity_identities = 4524
excluded_non_frozen_identities = 687
exact_current_equity_links = 255
matched_non_equity_current_rows = 1
current_null_isin_company_equity_candidates = 7
p8_local_historical_identity_rows_required = 4262
frozen_equity_symbol_collision_groups = 40
frozen_equity_present_on_latest_decision_date = 4385
frozen_equity_historical_only_before_latest_date = 139
```

No database write or provider call occurred.

```text
P8-B2 V3 classification validation = COMPLETE / PASS
P8-B2 V3 clean local database replay = PENDING
P8-B2 V3 SQL contract test = PENDING
P8-B2 V3 hosted application = NOT AUTHORIZED / NOT APPLIED
P8-B2 historical universe materialization = NOT STARTED
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B2 V3 local SQL privilege failure and remediation — 1 October 2026

The owner-run V3 SQL contract test stopped in its second DO block with:

```text
ERROR: P8-B2 V3 table privilege contract failed on p8_historical_security_identities
CONTEXT: PL/pgSQL function inline_code_block line 32 at RAISE
```

Diagnosis: Supabase default privileges had already granted `service_role` direct DML on newly created tables. The migration granted SELECT afterward but had not first revoked those inherited/default privileges.

Repository-only remediation:

- each of the seven new V3 tables now explicitly `REVOKE ALL` from `service_role` before granting only `SELECT`;
- the three V3 read views now also explicitly reset `service_role` privileges and grant only `SELECT`;
- service-role mutation remains available only through the four validated service-only functions;
- no hosted migration or historical data write occurred.

The local database must be reset again so the amended migration is replayed before rerunning the SQL contract test.

Current governance:

```text
P8-B2 V3 classification validation = COMPLETE / PASS
P8-B2 V3 clean local migration replay = PASS ON PRE-REMEDIATION PACKAGE
P8-B2 V3 SQL contract test = FAIL-CLOSED / PRIVILEGE REMEDIATION APPLIED IN REPOSITORY
P8-B2 V3 post-remediation clean replay = PENDING
P8-B2 V3 hosted application = NOT AUTHORIZED / NOT APPLIED
P8-B2 historical universe materialization = NOT STARTED
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B2 V3 privilege-contract correction — 1 October 2026

A repeated local SQL failure showed that the prior remediation targeted the wrong invariant.

Supabase's documented role model treats `service_role` as the elevated server-side role with full data access / RLS bypass. Existing Supabase projects commonly grant `SELECT/INSERT/UPDATE/DELETE` on new `public` tables to `service_role` by default.

The Codex P8 security requirement is therefore enforced at the browser/user boundary:

- `anon`: no read or write access;
- `authenticated`: owner-scoped SELECT only, no direct INSERT/UPDATE/DELETE;
- V3 views: `security_invoker=true`;
- privileged append/select functions: EXECUTE denied to `anon`/`authenticated`, granted to `service_role`;
- `service_role` remains the Supabase server/admin role and may retain platform-level table DML.

Repository correction:

- V3 migration restored standard Supabase `service_role` table privileges;
- the SQL contract test now verifies no browser/user DML instead of incorrectly requiring `service_role` to have no direct DML;
- this does not widen any `anon` or `authenticated` privilege.

Because the migration and test changed, a fresh local reset and contract replay are required.

```text
P8-B2 V3 classification = COMPLETE / PASS
P8-B2 V3 privilege model = CORRECTED TO SUPABASE SERVICE-ROLE MODEL
P8-B2 V3 clean replay after correction = PENDING
P8-B2 V3 SQL contract after correction = PENDING
P8-B2 V3 hosted application = NOT AUTHORIZED / NOT APPLIED
P8-B2 historical universe materialization = NOT STARTED
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B2 V3 local migration gate closure — 1 October 2026

Owner-run validation completed against the corrected V3 package.

Verified locally:

- historical identity classification: PASS;
- clean `supabase db reset`: PASS;
- migration `20261001001500_create_p8_b2_historical_identity_registry_v3.sql`: applied successfully;
- SQL contract test `supabase/tests/p8_b2_historical_identity_registry_v3.sql`: PASS;
- terminal sequence: `BEGIN → DO → DO → ROLLBACK`;
- no fixture residue due to transactional rollback;
- no hosted PortfolioAI Dev migration/application;
- no historical universe materialization;
- no provider call;
- no P8-B3/P8-C work;
- Production and `main` unchanged.

Current governance:

```text
P8-B2 V3 classification = COMPLETE / PASS
P8-B2 V3 clean local replay = COMPLETE / PASS
P8-B2 V3 SQL contract = COMPLETE / PASS
P8-B2 V3 local migration package = COMPLETE / PASS

P8-B2 V3 hosted application = NOT AUTHORIZED / NOT APPLIED
P8-B2 historical universe materialization = NOT STARTED

P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B2 V3 hosted Development application verification — 1 October 2026

Owner approval received for hosted PortfolioAI Dev application of the exact locally validated P8-B2 V3 historical-identity/source-archive migration.

Applied to **PortfolioAI Dev only**:

- hosted project: `lrgpjimipfkyoqbpsqzz`;
- hosted migration: `20260930192959_create_p8_b2_historical_identity_registry_v3`;
- exact repository migration source: `supabase/migrations/20261001001500_create_p8_b2_historical_identity_registry_v3.sql`;
- hosted transactional contract test: PASS / rolled back;
- seven V3 tables: PRESENT;
- three V3 canonical read views: PRESENT / `security_invoker=true`;
- four V3 privileged append/select functions: PRESENT;
- RLS: ENABLED on all seven V3 tables;
- anonymous table/view access: DENIED;
- authenticated table access: SELECT only under owner-scoped RLS; INSERT/UPDATE/DELETE denied;
- authenticated privileged-function execution: DENIED;
- service-role privileged-function execution: GRANTED;
- all seven V3 tables after verification: zero rows;
- legacy B2 v1/v2 evidence/run/member/selection tables: zero rows;
- preservation counts: 284 securities / 282 security listings / 496 transactions.

Supabase security advisors report authenticated-GraphQL visibility warnings for the new authenticated-readable tables/views. Those warnings are consistent with the intended owner-scoped authenticated-read contract and do not indicate anon exposure; direct checks confirm anon access is denied and RLS is enabled.

Performance advisors report informational unindexed-foreign-key notices on several new V3 composite relationships plus an unused-index notice while the tables are empty. These are recorded as non-blocking for this schema-correctness gate; no additional migration is authorized by this checkpoint.

No historical-universe materialization, provider call, P8-B3, P8-C, Production or `main` change occurred.

Current governance:

```text
P8-B2 V3 local migration package = COMPLETE / PASS
P8-B2 V3 hosted application = COMPLETE / VERIFIED / PASS
P8-B2 historical universe materialization = NOT STARTED
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B2 V3 historical materialization planning — 1 October 2026

Owner approval received to begin P8-B2 historical-universe materialization.

Before any hosted row insert, a deterministic local planner was added:

`scripts/p8/p8-b2-plan-historical-materialization-v3.mjs`

The planner revalidates all 32 acquired NSE source-file hashes, reconstructs the frozen 4,524 common-equity identity registry, verifies the 255 exact-current links / 7 current-null-ISIN links / 4,262 historical-only identities, parses every frozen listing-evidence row, checks required line-level fields, freezes one source-archive record per decision date, and produces a deterministic materialization-plan hash.

It performs zero remote database writes and zero provider calls.

The planner must pass before the hosted materialization runner is activated. This is the canary/preflight required by the P8 handoff.

```text
P8-B2 V3 hosted schema = COMPLETE / VERIFIED / PASS
P8-B2 V3 materialization planner = CREATED
P8-B2 V3 materialization preflight = LOCAL RUN PENDING
P8-B2 historical universe materialization = AUTHORIZED / NOT YET WRITTEN
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B2 V3 hosted materialization execution package — 1 October 2026

The owner-approved P8-B2 materialization stage has passed deterministic preflight with plan hash:

`ea253903259183d3bf287e51412c6fa0938ea8b06260e48e40c682af2dfdf5b3`

Execution package created:

- local sender: `scripts/p8/p8-b2-materialize-historical-universe-v3.mjs`;
- Development-only Edge Function: `p8-b2-materialize-historical-universe`;
- function runtime hard-locks project ref `lrgpjimipfkyoqbpsqzz` and refuses Production;
- writes require the frozen plan hash and a time-limited campaign grant;
- identity/month/observation/member/evidence writes are idempotent and resumable;
- provider calls remain zero.

Hosted baseline immediately before canary:

```text
historical identities = 0
source archives = 0
listing observations = 0
universe runs = 0
universe members = 0
member evidence links = 0
run selections = 0
```

A 24-hour one-campaign grant has been issued out-of-repository. The capability token is not committed to GitHub.

Next execution gate: one-month canary for the first proven decision date, followed by hosted count/integrity verification. On pass, resume the remaining 31 months under the same approved P8-B2 materialization stage.

```text
P8-B2 V3 materialization preflight = COMPLETE / PASS
P8-B2 V3 materializer = DEPLOYED / DEVELOPMENT ONLY
P8-B2 V3 canary = READY / NOT YET EXECUTED
P8-B2 historical universe materialization = AUTHORIZED / ACTIVE
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B2 V3 canary evidence lookup failure and remediation — 1 October 2026

The first hosted materialization canary progressed through identity/archive/observation/run/member creation and then stopped fail-closed before any evidence-link or selection insert.

Observed hosted partial state:

```text
historical identities = 4524
source archives = 1
listing observations = 14998
universe runs = 1
universe members = 4524
member evidence links = 0
run selections = 0
campaign grant consumed = 0
```

The first run is for `2024-02-29` with:

```text
eligible = 3385
ineligible = 1139
blocked = 0
```

Root cause was isolated from hosted Edge/PostgREST logs: the evidence resolver attempted a `.in(...)` lookup with hundreds of 64-character row hashes in one GET URL, causing a PostgREST/gateway HTTP 400 before evidence-link insertion.

Repository/runtime remediation:

- observation row-hash lookup batches reduced from 400 hashes to 50;
- bounded error detail logging added for subsequent materializer failures;
- Development Edge Function redeployed as version 2;
- no data rollback or destructive remediation required because all completed writes are idempotent;
- campaign grant remains unconsumed and resumable.

Current governance:

```text
P8-B2 V3 canary = FAIL-CLOSED AT EVIDENCE LOOKUP / REMEDIATED
P8-B2 V3 partial canary data = PRESERVED / IDEMPOTENT
P8-B2 V3 materializer = DEVELOPMENT VERSION 2 / ACTIVE
P8-B2 V3 canary rerun = REQUIRED
P8-B2 historical universe materialization = AUTHORIZED / ACTIVE
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B2 V3 hosted canary verification — 1 October 2026

The remediated one-month materialization canary completed and was independently verified against PortfolioAI Dev.

Verified hosted state:

```text
historical identities = 4524
  EXACT_ISIN = 255
  EXACT_NSE_SYMBOL_CURRENT_NULL_ISIN = 7
  historical-only / NONE = 4262

source archives = 1
listing observations = 14998
universe runs = 1
universe members = 4524
member evidence links = 14998
run selections = 1
campaign grant consumed = 0
```

First selected decision date:

```text
decision date = 2024-02-29
run state = READY
eligible = 3385
ineligible = 1139
blocked = 0
evidence ELIGIBILITY_SUPPORT = 3385
evidence SYMBOL_SERIES_VARIANT = 11613
```

Source provenance is preserved with exact source hashes, `source_published_at = NULL`, and the approved conservative availability upper bound before the decision instant.

Live PortfolioAI security preservation was rechecked against the frozen 284-row canonical security snapshot:

```text
current securities = 284
snapshot securities = 284
changed = 0
missing = 0
added = 0
```

The canary is therefore **COMPLETE / PASS**. The same campaign grant remains unconsumed and the idempotent sender may now resume the full 32-date campaign; the already-completed canary date may be safely replayed.

```text
P8-B2 V3 materialization preflight = COMPLETE / PASS
P8-B2 V3 canary = COMPLETE / VERIFIED / PASS
P8-B2 V3 remaining 31 decision dates = AUTHORIZED / READY TO RESUME
P8-B2 full materialization = ACTIVE / NOT YET COMPLETE
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B2 V3 campaign network interruption recovery — 1 October 2026

The full materialization campaign progressed through 15 fully selected decision dates and then encountered a client-side HTTPS `ECONNRESET` while processing `2025-05-30`.

Hosted state at the stop point:

```text
historical identities = 4524
source archives = 16
listing observations = 244044
universe runs = 15
universe members = 67860
member evidence links = 239544
run selections = 15
campaign grant consumed = 0
```

Decision dates through `2025-04-30` are fully selected. The `2025-05-30` source archive exists with 4,500 listing observations staged, but no run/member/evidence/selection rows exist yet for that month.

Diagnosis: local Node fetch lost the TLS socket with `ECONNRESET`; no hosted constraint, hash, identity, or integrity error occurred.

Recovery package:

- local sender retries network/5xx/429 failures up to five attempts with bounded exponential backoff;
- identity replay is skipped when the hosted 4,524-row registry is already complete;
- `--from YYYY-MM-DD` permits deterministic resume from a frozen decision date;
- the verified hosted materializer remains on the stable Development v2 contract;
- no rollback is required because staged writes are idempotent.

Required resume point: `2025-05-30`.

```text
P8-B2 full materialization = ACTIVE / INTERRUPTED SAFELY / RESUMABLE
P8-B2 completed selected dates = 15 / 32
P8-B2 current partial date = 2025-05-30
P8-B2 campaign grant = ACTIVE / UNCONSUMED
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B2 V3 select-month statement-timeout remediation — 1 October 2026

The resumable campaign progressed to `2025-09-30` and then stopped fail-closed in `select_month` after all month rows had already been materialized.

Hosted state at the stop point:

```text
historical identities = 4524
source archives = 20
listing observations = 329755
universe runs = 20
universe members = 90480
member evidence links = 329755
run selections = 19
campaign grant consumed = 0
```

The `2025-09-30` month itself is fully staged:

```text
observations = 18399
members = 4524
evidence links = 18399
eligible = 3895
ineligible = 629
blocked = 0
selection = PENDING
```

Hosted Edge logs identified the exact timeout query: the final evidence verification read filtered the growing evidence table by `portfolio_id + experiment_id + decision_at`, ordered by `id`, and PostgREST canceled the first 1,000-row page with SQLSTATE `57014`.

Remediation:

- the `select_month` evidence verification no longer scans by `decision_at`;
- it now traverses evidence through the already-indexed `universe_member_id` relationship in bounded 75-member batches;
- exact total evidence count is still verified;
- every ELIGIBLE member must still have `ELIGIBILITY_SUPPORT`;
- no new schema migration was required;
- Development Edge Function redeployed as version 3;
- all staged month writes remain idempotent and the campaign grant remains unconsumed.

Resume point: `2025-09-30`.

```text
P8-B2 full materialization = ACTIVE / FAIL-CLOSED AT SELECTION VERIFY / REMEDIATED
P8-B2 completed selections = 19 / 32
P8-B2 current staged month = 2025-09-30
P8-B2 materializer = DEVELOPMENT VERSION 3
P8-B2 campaign grant = ACTIVE / UNCONSUMED
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B2 V3 late-campaign observation verification timeout remediation — 1 October 2026

The campaign progressed to decision date `2026-05-29` and again stopped fail-closed in `select_month` after all month writes completed.

Hosted state at the stop point:

```text
source archives = 28
listing observations = 481787
universe runs = 28
universe members = 126672
member evidence links = 481787
run selections = 27
campaign grant = ACTIVE / UNCONSUMED
```

The staged `2026-05-29` month is complete except for selection:

```text
observations = 19614
members = 4524
evidence links = 19614
eligible = 4139
ineligible = 385
blocked = 0
selection = PENDING
```

Hosted Edge logs identified the exact timeout query as the listing-observation fingerprint verification:

`p8_historical_listing_observations_v3 WHERE source_archive_id = ? ORDER BY id OFFSET ? LIMIT 1000`

As the append-only observation table grew, the `ORDER BY id` path stopped matching the archive-oriented index and PostgREST canceled the query with SQLSTATE `57014`.

Remediation:

- observation fingerprint verification now resolves observations through `source_archive_id + historical_identity_id` in bounded 75-identity batches, matching the existing composite index;
- the exact observation count and source-row-number-sorted fingerprint are still verified;
- evidence verification continues through indexed `universe_member_id`;
- future evidence write batches were reduced from 1500 to 500 to avoid large PostgREST upsert timeouts;
- Development Edge Function redeployed as version 4;
- no schema migration, rollback, Production change, or P8-B3/P8-C work occurred.

Resume point: `2026-05-29`.

```text
P8-B2 full materialization = ACTIVE / FAIL-CLOSED AT LATE VERIFICATION / REMEDIATED
P8-B2 completed selections = 27 / 32
P8-B2 current staged month = 2026-05-29
P8-B2 materializer = DEVELOPMENT VERSION 4
P8-B2 remaining decision dates after current month = 4
P8-B3+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B2 historical universe materialization closure — 1 October 2026

The owner-approved PortfolioAI Dev historical-universe materialization campaign completed successfully and was independently reverified against the hosted database.

Frozen plan:

```text
plan hash = ea253903259183d3bf287e51412c6fa0938ea8b06260e48e40c682af2dfdf5b3
completion hash = 23a19bfbd86a341767370d6753d4eb471982313b6a0e37fe36e8a0c818124823
experiment = P8_EXP_NSE_MONTHLY_6M_V1
first selected date = 2024-02-29
last selected date = 2026-09-29
selected dates = 32 / 32
```

Final hosted V3 counts:

```text
historical identities = 4524
  EXACT_ISIN = 255
  EXACT_NSE_SYMBOL_CURRENT_NULL_ISIN = 7
  historical-only / NONE = 4262
source archives = 32
listing observations = 562790
universe runs = 32
universe members = 144768
member evidence links = 562790
run selections = 32
```

Final decision date:

```text
decision date = 2026-09-29
eligible = 4385
ineligible = 139
blocked = 0
run hash = 2ddce0a378e758a84501f4ef537a37822d3d4479264f7c3ffa27e89824fcbb21
```

Independent integrity verification:

- all 32 runs have exactly 4,524 members;
- all 32 run-level eligible/ineligible counts match their member dispositions;
- all 32 runs have exactly one selection;
- every eligible member on every run has ELIGIBILITY_SUPPORT evidence;
- all 32 source archives have source publication time left NULL rather than invented;
- all 32 approved conservative availability upper bounds precede their decision instants;
- 4,524 identities are unique by historical ISIN and all satisfy the frozen common-equity identity rule;
- the 284-row current security registry remains exactly unchanged versus its frozen snapshot: 0 changed / 0 missing / 0 added;
- legacy B2 v1/v2 tables remain empty and were not repurposed;
- the one-campaign grant is consumed and cannot be reused;
- Production and `main` remain unchanged.

Gate B2 is therefore **COMPLETE / PASS / CLOSED**.

```text
P8 = ACTIVE
P8-B2 = COMPLETE / PASS / CLOSED
P8-B3 = NOT STARTED / NOT AUTHORIZED
P8-B4+ = NOT STARTED / NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 re-entry and authority baseline — 1 October 2026

Owner approved entry into P8-B3 after B2 closure.

Read-only hosted inventory:

```text
market_price_history rows = 63929
covered securities = 240
history = 2025-08-07 through 2026-09-28
adjusted_close rows = 2

benchmark rows = 2710
benchmark series = 10
history = 2025-08-25 through 2026-09-28

dedicated corporate-action history = absent
```

This is insufficient for the frozen 2023-10-01 through 2026-09-30 experiment.

Proposed B3 authority:

- raw equity OHLCV: official NSE cash-market bhavcopy archives;
- corporate actions: official NSE corporate-action evidence, with company evidence only where needed to resolve terms;
- primary benchmark: official NSE Indices NIFTY 500 Total Return Index history;
- raw source evidence immutable; adjusted series derived/versioned deterministically;
- ambiguous actions fail closed.

No acquisition, migration or hosted B3 write was performed at this checkpoint.

```text
P8-B2 = COMPLETE / PASS / CLOSED
P8-B3 = ACTIVE / READ-ONLY BASELINE COMPLETE
P8-B3 acquisition = NOT STARTED
P8-B3 schema package = NOT CREATED
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 no-guesswork local foundation package — 1 October 2026

Owner authorized the bounded B3 local schema/test + dry-run manifest package with an explicit real-money/no-guesswork requirement.

Created:

- `supabase/migrations/20261001123000_create_p8_b3_market_history_foundation.sql`
- `supabase/tests/p8_b3_market_history_foundation.sql`
- `src/features/backtesting/p8CorporateActionAdjustment.ts`
- `src/features/backtesting/p8CorporateActionAdjustment.test.ts`
- `scripts/p8/p8-b3-plan-market-history.mjs`
- `docs/p8/PortfolioAI_P8_B3_LOCAL_FOUNDATION_PACKAGE_2026-10-01.md`
- `docs/p8/PortfolioAI_P8_B3_LOCAL_FOUNDATION_PACKAGE_AUDIT_2026-10-01.json`

The package is additive and does not mutate live price/history/benchmark/security tables.

Financial-data doctrine:

- no inferred corporate actions from price discontinuities;
- no missing-data interpolation;
- no guessed download URLs;
- no price-index substitution for NIFTY 500 TRI;
- ambiguous rights/merger/demerger terms remain BLOCKED;
- raw evidence and derived adjustments are separate, immutable, versioned layers.

The dry-run planner intentionally performs zero network requests and leaves all exact download URLs unresolved until an official-source canary proves them.

```text
P8-B2 = COMPLETE / PASS / CLOSED
P8-B3 = ACTIVE
P8-B3 read-only baseline = COMPLETE
P8-B3 authority design = COMPLETE
P8-B3 local schema/test package = CREATED
P8-B3 dry-run planner = CREATED

P8-B3 clean local replay = PENDING
P8-B3 SQL contract test = PENDING
P8-B3 deterministic adjustment tests = PENDING
P8-B3 dry-run manifest execution = PENDING

P8-B3 hosted migration = NOT AUTHORIZED / NOT APPLIED
P8-B3 acquisition = NOT STARTED
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 local foundation validation closure — 1 October 2026

The B3 local foundation package has passed the complete local validation gate.

Verified locally:

```text
supabase db reset = PASS
B3 migration replay = PASS
SQL contract test = PASS
  BEGIN
  DO
  DO
  ROLLBACK

deterministic adjustment tests = 7 / 7 PASS

dry-run acquisition planner = PASS
candidate weekdays = 783
legacy format candidates = 200
UDiFF format candidates = 583
proven trading dates = 0
resolved download URLs = 0
acquisition_ready = false
```

The deliberate `acquisition_ready = false` state is the expected fail-closed result: no weekday, trading date, archive URL, corporate action or benchmark export has been guessed.

Current state:

```text
P8-B2 = COMPLETE / PASS / CLOSED
P8-B3 = ACTIVE

P8-B3 local schema package = COMPLETE / PASS
P8-B3 SQL contract = COMPLETE / PASS
P8-B3 deterministic adjustment tests = COMPLETE / PASS
P8-B3 dry-run manifest = COMPLETE / PASS

P8-B3 official-source retrieval canary = NOT STARTED / AWAITING OWNER APPROVAL
P8-B3 hosted migration = NOT AUTHORIZED / NOT APPLIED
P8-B3 bulk acquisition = NOT AUTHORIZED / NOT STARTED
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 official-source retrieval canary package — 1 October 2026

Owner approved the small official-source retrieval canary under the no-guesswork / real-money doctrine.

Created:

`scripts/p8/p8-b3-official-source-canary.mjs`

The canary performs four bounded local probes only:

1. official NSE legacy CM bhavcopy for 14-Mar-2024;
2. official NSE UDiFF CM bhavcopy for 01-Aug-2024;
3. official NSE corporate-action evidence for DELPHIFX, selected because the official corporate-action surface exposes split, bonus and rights events for the same security;
4. official NSE Indices NIFTY 500 Total Return Index for January 2024.

Acceptance is content-based, not URL-based:

- final host must remain official NSE/NSE Indices;
- bhavcopy responses must be real ZIP artifacts;
- extracted CSV schema and embedded trade date must match the requested canary date;
- corporate-action raw response must prove the requested symbol and explicit action text/date evidence;
- TRI response must identify NIFTY 500 and provide positive Total Returns Index values for the requested window;
- raw bytes are persisted locally with SHA-256 hashes;
- any mismatch produces BLOCKED, not a fallback or inferred success.

The canary performs zero database writes, zero paid-provider calls, zero hosted migrations and zero bulk acquisition.

```text
P8-B3 local foundation = COMPLETE / PASS
P8-B3 official-source canary runner = CREATED
P8-B3 official-source canary execution = LOCAL RUN PENDING

P8-B3 hosted migration = NOT AUTHORIZED / NOT APPLIED
P8-B3 bulk acquisition = NOT AUTHORIZED / NOT STARTED
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 official-source canary partial pass and TRI route remediation — 1 October 2026

The first local official-source canary executed under the fail-closed/no-guesswork contract.

Result:

```text
legacy NSE bhavcopy = PROVEN
UDiFF NSE bhavcopy = PROVEN
NSE corporate actions = PROVEN
NIFTY 500 TRI = BLOCKED
overall = CANARY_BLOCKED
```

Canary result hash:

`9d0c4c660442da2d598ddb3264baf4aa2d67d71879cae629cdf4fd3c6a8797c8`

The benchmark blocker was not bypassed. The failure was isolated to the stale NSE Indices backend route used by the initial canary:

`/Backpage.aspx/getTotalReturnIndexString`

Current 2026 NSE data tooling reflects the live route:

`/BackPage/getTotalReturnIndexString`

and a current direct-array JSON response contract. The canary was updated accordingly while preserving strict rejection of HTML/challenge responses.

No B3 database write, hosted migration, bulk acquisition, paid-provider call, Production change or main change occurred.

```text
P8-B3 local foundation = COMPLETE / PASS
P8-B3 official-source canary = PARTIAL PASS / 3 OF 4 PROVEN
P8-B3 TRI route remediation = CREATED / RERUN REQUIRED

P8-B3 hosted migration = NOT AUTHORIZED / NOT APPLIED
P8-B3 bulk acquisition = NOT AUTHORIZED / NOT STARTED
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 official-source canary closure — 1 October 2026

The bounded local official-source retrieval canary completed successfully under the no-guesswork / real-money contract.

Verified official authority paths:

```text
legacy NSE bhavcopy = PROVEN
UDiFF NSE bhavcopy = PROVEN
NSE corporate actions = PROVEN
NIFTY 500 TRI = PROVEN
overall = CANARY_PASS
```

Canary hash:

`bae2927499d3f37b7e58660680b506dc7b2ffccdaf10be5b1fb8a0d90e1b2c1f`

The canary performed no hosted database writes, no migration application, no bulk acquisition and no paid-provider call.

Gate implication:

- official raw OHLCV source path is proven across both pre- and post-UDiFF formats;
- official corporate-action evidence path is proven;
- official NIFTY 500 Total Return Index path is proven;
- source acquisition can now be planned without guessed URLs or benchmark substitution.

```text
P8-B2 = COMPLETE / PASS / CLOSED
P8-B3 = ACTIVE
P8-B3 local foundation = COMPLETE / PASS
P8-B3 official-source canary = COMPLETE / PASS

P8-B3 hosted migration = NOT AUTHORIZED / NOT APPLIED
P8-B3 bulk acquisition = NOT AUTHORIZED / NOT STARTED
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 pre-hosted migration verification — 1 October 2026

The remote pre-migration baseline and additive migration static review are complete.

Key findings:

- hosted Dev contains no `p8_b3_*` objects;
- reviewed B3 migration contains 7 additive tables, 2 views and 1 function;
- no DROP / UPDATE / DELETE / INSERT / non-B3 ALTER statement exists;
- existing B2 hosted migration history uses a different version alias than the repository filename, so broad `supabase db push` is forbidden;
- hosted preservation counts/fingerprint sums were captured for securities, live market history, benchmark history and B2 materialization;
- Supabase security/performance advisor findings were captured as the pre-B3 baseline.

Created:

- `scripts/p8/run-p8-b3-prehosted-verification.sh`
- `docs/p8/PortfolioAI_P8_B3_PREHOSTED_MIGRATION_VERIFICATION_2026-10-01.md`
- `docs/p8/PortfolioAI_P8_B3_PREHOSTED_MIGRATION_VERIFICATION_AUDIT_2026-10-01.json`

```text
P8-B3 local foundation = COMPLETE / PASS
P8-B3 official-source canary = COMPLETE / PASS
P8-B3 remote preservation baseline = COMPLETE
P8-B3 migration static review = COMPLETE / PASS
P8-B3 final local pre-hosted runner = CREATED / EXECUTION PENDING

P8-B3 hosted migration = NOT AUTHORIZED / NOT APPLIED
P8-B3 bulk acquisition = NOT AUTHORIZED / NOT STARTED
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 pre-hosted runner CLI compatibility remediation — 1 October 2026

The first pre-hosted runner reached step 8/10, proving steps 1-7 passed under `set -euo pipefail`, then stopped because `supabase migration list` requires a linked remote project.

This was a verifier command issue, not a schema/test/build failure.

Passed before the stop:

- clean local reset;
- SQL contract;
- deterministic financial fixtures;
- TypeScript;
- scoped ESLint;
- architecture check;
- production build.

CLI remediation:

- replaced remote-dependent `supabase migration list` with a direct read of the local `supabase_migrations.schema_migrations` ledger;
- corrected type generation to `supabase gen types --lang typescript --local`;
- removed the unnecessary `--local` flag from `supabase db diff`, which already targets local by default;
- added `scripts/p8/run-p8-b3-prehosted-verification-tail.sh` to complete steps 8-10 without repeating the already-passed steps 1-7.

```text
P8-B3 pre-hosted steps 1-7 = PASS
P8-B3 pre-hosted steps 8-10 = RERUN REQUIRED WITH CORRECTED LOCAL RUNNER

P8-B3 hosted migration = NOT AUTHORIZED / NOT APPLIED
P8-B3 bulk acquisition = NOT AUTHORIZED / NOT STARTED
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 pre-hosted verification closure — 1 October 2026

The corrected local verification tail completed successfully after the first runner had already passed steps 1-7.

Final confirmation:

```text
local migration ledger includes:
20261001123000|create_p8_b3_market_history_foundation

8/10 local DB lint + migration ledger + generated types = PASS
9/10 post-replay schema diff = PASS / EMPTY
10/10 repository hygiene = PASS

P8_B3_PREHOSTED_VERIFICATION_PASS
```

Therefore the full B3 pre-hosted package is now verified:

- clean local reset = PASS;
- migration replay = PASS;
- SQL contract = PASS;
- deterministic financial fixtures = 7 / 7 PASS;
- TypeScript = PASS;
- scoped ESLint = PASS;
- architecture check = PASS;
- production build = PASS;
- local DB lint = PASS;
- local migration ledger = PASS;
- generated local types include B3 schema objects;
- post-replay schema diff = EMPTY;
- repository hygiene / credential-pattern scan = PASS;
- official-source canary = 4 / 4 PROVEN.

```text
P8-B3 local foundation = COMPLETE / PASS
P8-B3 official-source canary = COMPLETE / PASS
P8-B3 pre-hosted verification = COMPLETE / PASS

P8-B3 hosted migration = READY FOR SEPARATE OWNER APPROVAL / NOT APPLIED
P8-B3 bulk acquisition = NOT AUTHORIZED / NOT STARTED
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 Codex-plan alignment checkpoint — 1 October 2026

Before hosted B3 schema application, the implementation was re-audited against:

- `PortfolioAI_P8_COMPLETION_BUILD_HANDOFF_PLAN_2026-09-30.md`;
- `PortfolioAI_P8_ADVANCED_QUANT_BACKTESTING_EXECUTION_PLAN_2026-09-30.md`;
- the frozen P8-B1 experiment/bias-control contract.

Result:

```text
B3 authority path = ALIGNED
B3 additive schema = ALIGNED
B3 migration protocol = ALIGNED
B3 fail-closed corporate-action handling = ALIGNED
B3 benchmark policy = ALIGNED
B3 stage boundary = ALIGNED

B3 arithmetic precision/rounding = NOT YET FROZEN
```

The arithmetic-policy gap does not block the additive schema application because no B3 data exists and all adjustment rows are versioned. It **does** block any adjustment-factor or adjusted-series materialization until a separately explicit precision/rounding policy is approved and tested.

Aligned next sequence:

1. exact hosted Development B3 schema application;
2. before/after preservation verification + RLS/advisor checks;
3. hosted schema canary;
4. freeze B3 arithmetic precision/rounding contract;
5. separately authorize bounded acquisition/materialization;
6. close Gate B3 before P8-B4.

```text
P8-B3 pre-hosted verification = COMPLETE / PASS
P8-B3 Codex alignment audit = COMPLETE / PASS WITH DEFERRED ARITHMETIC CONTRACT
P8-B3 hosted schema = OWNER APPROVED / NOT YET APPLIED
P8-B3 bulk acquisition = NOT AUTHORIZED
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 hosted schema application and fail-closed advisor stop — 1 October 2026

After the Codex-plan alignment audit and owner approval, the exact reviewed B3 foundation migration was applied to hosted PortfolioAI Dev.

Hosted migration:

```text
name = create_p8_b3_market_history_foundation
hosted version = 20261001112716
broad db push = NO
```

Post-application structural verification:

```text
B3 tables = 7
B3 security-invoker views = 2
B3 mutation-rejection functions = 1
all B3 tables RLS enabled = YES
owner-scoped policy on each table = YES
anon SELECT = NO
authenticated INSERT/UPDATE/DELETE = NO
service-role INSERT = YES
mutation function execute = service-role only
initial B3 rows = 0
```

All preservation baselines are unchanged:

```text
securities = 284 / fingerprint unchanged
market_price_history = 63929 / fingerprint unchanged
market_benchmark_price_history = 2710 / fingerprint unchanged
P8-B2 identities = 4524 / fingerprint unchanged
P8-B2 listing observations = 562790 / fingerprint unchanged
P8-B2 runs = 32
P8-B2 members = 144768
P8-B2 evidence links = 562790
P8-B2 selections = 32
```

Mandatory advisor comparison found B3-attributable deltas:

```text
authenticated GraphQL exposure WARN = +9
  exactly 7 B3 tables + 2 B3 views

unindexed foreign keys INFO = +12
  exactly 12 B3 FK paths

unused indexes INFO = +9
  newly created empty B3 indexes
```

No other security-warning category changed.

Per the Codex stop-on-divergence protocol, B3 is stopped before hosted schema canary/data acquisition. No B3 rows have been inserted.

The authenticated GraphQL findings are owner-scoped by RLS, but they conflict with the stricter pre-hosted no-new-security-warning criterion and therefore require an explicit hardening disposition rather than silent acceptance. The 12 unindexed-FK findings require performance review before loading the large historical dataset.

```text
P8-B3 hosted schema = APPLIED / STRUCTURAL PASS
P8-B3 preservation = PASS
P8-B3 advisor gate = BLOCKED / REMEDIATION REQUIRED
P8-B3 hosted data rows = 0
P8-B3 acquisition = NOT STARTED
P8-B3 adjustment materialization = BLOCKED BY ARITHMETIC CONTRACT + ADVISOR GATE
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 local schema hardening remediation package — 1 October 2026

Following the hosted advisor stop, an additive local-only hardening package was created.

Remediation:

```text
authenticated B3 table/view SELECT = REVOKED IN LOCAL MIGRATION
service-role access = PRESERVED
RLS policies = PRESERVED
exact FK covering indexes added = 12
data mutations = 0
```

Created:

- `supabase/migrations/20261001131500_harden_p8_b3_access_and_foreign_key_indexes.sql`
- `supabase/tests/p8_b3_schema_hardening.sql`
- `scripts/p8/run-p8-b3-hardening-local-verification.sh`
- `docs/p8/PortfolioAI_P8_B3_SCHEMA_HARDENING_PACKAGE_2026-10-01.md`
- `docs/p8/PortfolioAI_P8_B3_SCHEMA_HARDENING_PACKAGE_AUDIT_2026-10-01.json`

The cumulative B3 SQL contract was updated to validate the hardened access state.

```text
P8-B3 hosted foundation schema = APPLIED
P8-B3 hosted data rows = 0
P8-B3 advisor gate = BLOCKED / LOCAL REMEDIATION PACKAGE CREATED
P8-B3 local hardening verification = PENDING
P8-B3 hosted hardening migration = NOT AUTHORIZED / NOT APPLIED
P8-B3 acquisition = NOT STARTED
P8-B3 adjustment materialization = BLOCKED BY ARITHMETIC CONTRACT
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 hardening test false-negative remediation — 1 October 2026

The first local hardening verification reached step 3/9 and failed in the FK-covering-index assertion for `p8_b3_adjusted_series_identity_fk`.

This was confirmed to be a **test-catalog indexing bug**, not a migration/index failure:

- PostgreSQL `pg_index.indkey` is an `int2vector`;
- its array lower bound is 0;
- the original assertion sliced it as if it were 1-based, skipping the first FK/index key;
- the hardening migration itself already contains the intended exact covering index.

The assertion now reconstructs the leading index attnums explicitly from positions `0..N-1` before comparison with `pg_constraint.conkey`.

No migration SQL changed. No hosted hardening was applied.

A resume runner was added so the already-passed clean reset and cumulative foundation contract do not need to be repeated:

`scripts/p8/run-p8-b3-hardening-local-verification-resume.sh`

```text
P8-B3 hardening local step 1 reset = PASS
P8-B3 hardening local step 2 foundation contract = PASS
P8-B3 hardening local step 3 = TEST FALSE NEGATIVE / FIXED
P8-B3 hardening local steps 3-9 = RERUN REQUIRED

P8-B3 hosted hardening migration = NOT AUTHORIZED / NOT APPLIED
P8-B3 acquisition = NOT STARTED
P8-B3 hosted data rows = 0
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 local schema hardening verification closure — 1 October 2026

The additive B3 schema-hardening package completed the full local verification gate successfully.

Terminal closure marker:

```text
P8_B3_HARDENING_LOCAL_VERIFICATION_PASS
```

Verified:

- clean cumulative migration replay;
- cumulative B3 foundation contract;
- corrected B3 FK-covering-index contract;
- deterministic financial fixtures;
- TypeScript;
- architecture guard;
- scoped lint;
- production build;
- local DB lint;
- local migration ledger including `20261001131500|harden_p8_b3_access_and_foreign_key_indexes`;
- generated types;
- empty post-replay schema diff;
- repository hygiene;
- credential-pattern scan.

The earlier FK test failure was a false negative caused by PostgreSQL `int2vector` 0-based indexing in the catalog assertion; the schema migration itself did not change.

```text
P8-B3 hosted foundation schema = APPLIED
P8-B3 hosted data rows = 0
P8-B3 local hardening package = COMPLETE / PASS
P8-B3 hosted hardening migration = READY FOR SEPARATE OWNER APPROVAL / NOT APPLIED
P8-B3 acquisition = NOT STARTED
P8-B3 arithmetic precision/rounding contract = NOT YET FROZEN
P8-B3 adjustment materialization = BLOCKED
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 hosted schema hardening closure — 1 October 2026

The exact owner-approved B3 hardening migration was applied to hosted PortfolioAI Dev and passed post-migration verification.

Hosted migration:

```text
name = harden_p8_b3_access_and_foreign_key_indexes
hosted version = 20261001120242
broad db push = NO
```

Verified hosted access state:

```text
B3 tables = 7
B3 views = 2
all B3 tables RLS enabled = YES
anon B3 SELECT = NO
authenticated B3 SELECT = NO
authenticated B3 writes = NO
service-role SELECT/INSERT = YES
coverage views security_invoker = YES
```

Foreign-key hardening:

```text
B3 foreign keys checked = 14
covering index present = 14 / 14
B3 unindexed-FK advisor findings = 0
```

All preservation counts/fingerprints remain unchanged.

Advisor result:

```text
authenticated GraphQL WARN = 95
  returned exactly to pre-B3 baseline
  B3 findings = 0

unindexed foreign keys INFO = 135
  returned exactly to pre-B3 baseline
  B3 findings = 0

unused indexes INFO = 57
  B3 findings = 21
  disposition = EXPECTED while all B3 tables remain empty;
                review again after hosted data canary/load paths execute
```

All seven B3 tables remain empty.

```text
P8-B3 hosted foundation schema = APPLIED
P8-B3 hosted hardening = COMPLETE / PASS
P8-B3 advisor gate = COMPLETE / PASS
P8-B3 hosted data rows = 0

P8-B3 acquisition = NOT STARTED
P8-B3 arithmetic precision/rounding contract = NOT YET FROZEN
P8-B3 adjustment materialization = BLOCKED

P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

Next Codex-aligned gate: hosted B3 schema canary plus explicit arithmetic precision/rounding contract before any adjustment-factor or adjusted-series materialization.

## P8-B3 hosted transactional canary and arithmetic contract candidate — 1 October 2026

Hosted transactional schema/data canary:

```text
service-role B3 insert lineage = PASS
all seven B3 tables exercised = PASS
append-only mutation guard = PASS
transaction rollback = PASS
durable B3 rows after canary = 0
```

The fixture used `example.invalid` source URLs deliberately and was rolled back, so it cannot be mistaken for authoritative evidence.

Arithmetic candidate implemented in repository only:

```text
policy = P8_B3_ARITHMETIC_V1
internal precision = 50 significant digits
persisted derived precision = 30 significant digits
rounding = ROUND_HALF_EVEN
derived total-return index base = 1000
source inputs = exact decimal strings / no pre-rounding
binary floating-point persistence = prohibited
presentation rounding = non-authoritative
adjustment version = P8_B3_ADJUSTMENT_V2
```

The numerical policy is **not yet owner-approved**. It must pass local tests and then receive explicit owner approval before any derived B3 arithmetic fact is materialized.

```text
P8-B3 hosted foundation/hardening = COMPLETE / PASS
P8-B3 hosted transactional canary = COMPLETE / PASS
P8-B3 arithmetic contract = CANDIDATE / LOCAL VERIFICATION PENDING
P8-B3 acquisition = NOT STARTED
P8-B3 adjustment materialization = NOT AUTHORIZED
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 arithmetic contract candidate verification closure — 1 October 2026

The repository-only B3 arithmetic precision/rounding candidate completed the full local verification gate successfully.

Terminal marker:

```text
P8_B3_ARITHMETIC_CONTRACT_CANDIDATE_VERIFICATION_PASS
```

Verified:

- arithmetic-policy fixtures;
- corporate-action fixtures;
- half-even tie behavior;
- 30-significant-digit derived persistence boundary;
- long authoritative source decimal preservation;
- recurring-ratio determinism;
- isolation from application-wide Decimal.js defaults;
- presentation-rounding separation;
- TypeScript;
- scoped lint;
- architecture check;
- production build;
- repository hygiene.

Candidate policy remains:

```text
policy = P8_B3_ARITHMETIC_V1
internal precision = 50 significant digits
persisted derived precision = 30 significant digits
rounding = ROUND_HALF_EVEN
derived total-return index base = 1000
source values = no pre-rounding
storage = PostgreSQL numeric / canonical decimal
binary floating-point authority = prohibited
presentation rounding = non-authoritative
adjustment version = P8_B3_ADJUSTMENT_V2
```

This policy is technically validated but is **not yet owner-approved for financial materialization**.

```text
P8-B3 hosted foundation/hardening = COMPLETE / PASS
P8-B3 hosted transactional canary = COMPLETE / PASS
P8-B3 arithmetic contract local verification = COMPLETE / PASS
P8-B3 arithmetic contract owner approval = PENDING

P8-B3 acquisition = NOT STARTED
P8-B3 adjustment materialization = NOT AUTHORIZED
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 arithmetic contract owner approval — 1 October 2026

The owner explicitly approved the exact locally validated numerical policy.

```text
P8_B3_ARITHMETIC_V1 = OWNER APPROVED / FROZEN

internal precision = 50 significant digits
persisted derived precision = 30 significant digits
rounding = ROUND_HALF_EVEN
derived total-return index base = 1000
authoritative source values = no pre-rounding
binary floating-point persistence = prohibited
presentation rounding = non-authoritative
adjustment version = P8_B3_ADJUSTMENT_V2
```

Authoritative frozen record:

`docs/p8/PortfolioAI_P8_B3_ARITHMETIC_PRECISION_ROUNDING_CONTRACT_FROZEN_2026-10-01.md`

This approval clears the arithmetic-policy blocker only.

```text
P8-B3 hosted foundation/hardening = COMPLETE / PASS
P8-B3 hosted transactional canary = COMPLETE / PASS
P8-B3 arithmetic contract = OWNER APPROVED / FROZEN

P8-B3 bulk acquisition = NOT AUTHORIZED / NOT STARTED
P8-B3 durable materialization = NOT AUTHORIZED / NOT STARTED
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

Next gate: separate owner approval for the bounded B3 acquisition/materialization campaign.

## P8-B3 durable raw-price evidence canary campaign — 1 October 2026

Owner approved entry into the bounded B3 acquisition/materialization campaign.

The first durable slice is deliberately limited to official NSE raw price evidence:

```text
campaign = P8_B3_RAW_PRICE_CANARY_20261001_V1
target historical ISIN = INE002A01018

legacy bhavcopy date = 2024-03-14
UDiFF bhavcopy date = 2024-08-01

planned durable archives = 2
planned durable raw observations = 2
planned derived rows = 0
```

Created:

- `scripts/p8/p8-b3-build-durable-raw-price-canary.mjs`
- `docs/p8/PortfolioAI_P8_B3_DURABLE_RAW_PRICE_CANARY_CAMPAIGN_2026-10-01.md`
- `docs/p8/PortfolioAI_P8_B3_DURABLE_RAW_PRICE_CANARY_CAMPAIGN_AUDIT_2026-10-01.json`

The extractor performs zero database writes. Durable insertion is gated on a verified payload proving exact official artifact hashes, dates, schema and one exact target-ISIN row from each format.

```text
P8-B3 arithmetic contract = OWNER APPROVED / FROZEN
P8-B3 bounded acquisition campaign = OWNER APPROVED
P8-B3 raw-price durable canary extractor = CREATED
P8-B3 raw-price canary payload = PENDING
P8-B3 durable raw-price rows = 0
P8-B3 full acquisition = NOT STARTED

P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 durable raw-price canary closure — 1 October 2026

The first durable B3 acquisition slice completed successfully.

```text
campaign = P8_B3_RAW_PRICE_CANARY_20261001_V1
payload hash = a494b79025de3b04f41b771a2374a87721c1cd40abc30685bd37eb62a168ecaa

B3 source archives = 2
B3 raw price observations = 2
B3 derived rows = 0

target ISIN = INE002A01018
B2 identity resolution = EXACT_ISIN / single match

idempotency replay = 0 new archives / 0 new observations
preservation fingerprints = UNCHANGED
B3 security advisor findings = 0
B3 unindexed-FK findings = 0
```

Durable evidence covers both supported NSE bhavcopy formats:

- 2024-03-14 legacy CM bhavcopy;
- 2024-08-01 UDiFF CM bhavcopy.

```text
P8-B3 arithmetic contract = OWNER APPROVED / FROZEN
P8-B3 durable raw-price canary = COMPLETE / PASS

P8-B3 full raw-price acquisition = NOT STARTED
P8-B3 corporate-action durable canary = NOT STARTED
P8-B3 NIFTY 500 TRI durable canary = NOT STARTED
P8-B3 adjustment materialization = NOT STARTED

P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

Next gate: separate owner approval for the corporate-action and NIFTY 500 TRI durable authority canaries.

## P8-B3 durable corporate-action + NIFTY 500 TRI canary campaign — 1 October 2026

Owner approved the next bounded B3 authority canary.

Scope:

```text
campaign = P8_B3_ACTION_TRI_CANARY_20261001_V1

corporate action:
  BEL / INE263A01024
  Interim Dividend - Rs 1.95 Per Share
  ex/record date = 2026-03-06
  B2 link = EXACT_ISIN

benchmark:
  NIFTY 500 Total Return Index
  selected date = 2024-01-31
  benchmark version = P8_NIFTY500_TRI_V1

planned durable rows:
  source archives = +2
  corporate-action observations = +1
  benchmark TRI rows = +1
  normalization/factor/adjusted rows = +0
```

Created:

- `scripts/p8/p8-b3-build-durable-action-tri-canary.mjs`
- `docs/p8/PortfolioAI_P8_B3_DURABLE_ACTION_TRI_CANARY_CAMPAIGN_2026-10-01.md`
- `docs/p8/PortfolioAI_P8_B3_DURABLE_ACTION_TRI_CANARY_CAMPAIGN_AUDIT_2026-10-01.json`

The extractor performs zero database writes and must output a verified payload before any hosted durable insert.

```text
P8-B3 durable raw-price canary = COMPLETE / PASS
P8-B3 durable action+TRI canary = OWNER APPROVED / PAYLOAD PENDING

P8-B3 full raw-price acquisition = NOT STARTED
P8-B3 full corporate-action acquisition = NOT STARTED
P8-B3 full TRI acquisition = NOT STARTED
P8-B3 normalization/materialization = NOT STARTED

P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 action/TRI canary optional-date parser remediation — 1 October 2026

The first local action/TRI payload extraction stopped before any database write because the official NSE corporate-action response contains placeholder values such as `-` in optional date fields (for example book-closure fields).

The extractor was corrected so:

- required dates such as the selected corporate-action ex-date remain strict and fail closed if malformed/missing;
- optional date fields recognize only explicit official placeholder tokens (`-`, `--`, `NA`, `N/A`, `N.A.`, `NOT AVAILABLE`, `NOT APPLICABLE`, `NULL`) as null;
- any other non-date text still fails closed;
- no hosted B3 write occurred.

```text
P8-B3 durable raw-price canary = COMPLETE / PASS
P8-B3 durable action+TRI canary = PAYLOAD EXTRACTION RETRY REQUIRED
P8-B3 action+TRI hosted durable rows = 0

P8-B3 normalization/materialization = NOT STARTED
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 durable corporate-action + NIFTY 500 TRI canary closure — 1 October 2026

The second durable B3 authority slice completed successfully.

```text
campaign = P8_B3_ACTION_TRI_CANARY_20261001_V1
payload hash = f0e7da820631d9c0a6fe010c1a9008ac407119381a9e149356142aef2567b445

durable totals:
  source archives = 4
  raw price observations = 2
  corporate-action observations = 1
  benchmark TRI rows = 1
  normalizations = 0
  adjustment factors = 0
  adjusted series = 0

BEL corporate action:
  historical ISIN = INE263A01024
  B2 link basis = EXACT_ISIN
  purpose = Interim Dividend - Rs 1.95 Per Share
  ex/record date = 2026-03-06

NIFTY 500 TRI:
  trade date = 2024-01-31
  TRI = 31011.17
  NTRI = 29432.64

idempotency replay = 0 / 0 / 0 / 0
preservation fingerprints = UNCHANGED
B3 security findings = 0
B3 unindexed-FK findings = 0
```

```text
P8-B3 durable raw-price canary = COMPLETE / PASS
P8-B3 durable action+TRI canary = COMPLETE / PASS
P8-B3 arithmetic contract = OWNER APPROVED / FROZEN

P8-B3 full source acquisition = NOT STARTED
P8-B3 normalization = NOT STARTED
P8-B3 adjustment materialization = NOT STARTED

P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

Next gate: separate owner approval for the full B3 source-acquisition campaign plan/execution. No full acquisition begins from this canary closure alone.

## P8-B3 full source-acquisition execution ready — 1 October 2026

Owner approved the full Development-only B3 source-acquisition campaign after both durable authority canaries passed.

Frozen execution:

```text
campaign = P8_B3_FULL_SOURCE_ACQUISITION_20261001_V1
plan hash = 9367d9a55b5c7a6db176ef3e2b80da96cb97b3ac114f0ef884f124352a54919a
window = 2023-10-01 through 2026-09-30
```

Acquisition order:

1. official NIFTY 500 TRI in 36 calendar-month slices;
2. TRI-returned dates become the proven trading calendar;
3. official NSE corporate actions in 36 monthly slices;
4. one official NSE bhavcopy for every proven TRI trading date.

Raw-price identity resolution is exact historical ISIN only. Corporate-action identity resolution remains fail-closed and records AMBIGUOUS/UNRESOLVED states rather than guessing.

Implementation:

- Development Edge Function `p8-b3-acquire-market-history` deployed ACTIVE as version 1;
- Production-project refusal is hard-coded;
- authentication is a custom owner-approved one-campaign grant;
- local runner is cache-first, resumable and idempotent;
- grant expires automatically on 8 October 2026;
- grant ID is not stored in Git.

Pre-execution hosted state:

```text
full-campaign source archives = 0
full-campaign raw price rows = 0
full-campaign corporate-action rows = 0
full-campaign benchmark rows = 0

normalizations = 0
adjustment factors = 0
adjusted series = 0
```

```text
P8-B3 durable raw-price canary = COMPLETE / PASS
P8-B3 durable action+TRI canary = COMPLETE / PASS
P8-B3 arithmetic contract = OWNER APPROVED / FROZEN

P8-B3 full source-acquisition campaign = AUTHORIZED / READY TO EXECUTE
P8-B3 normalization = NOT AUTHORIZED / NOT STARTED
P8-B3 adjustment materialization = NOT AUTHORIZED / NOT STARTED

P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 full acquisition first interruption and transport remediation — 1 October 2026

The full B3 campaign started correctly.

Stage 1 completed:

```text
official NIFTY 500 TRI monthly archives = 36 / 36
proven trading dates = 744
calendar range = 2023-10-03 through 2026-09-30
benchmark rows = 744
```

Stage 2 began and completed the first monthly corporate-action slice:

```text
2023-10 corporate-action archive = 1
2023-10 corporate-action rows = 49
```

The next official NSE corporate-action request then exhausted the original 45-second transport timeout and stopped with a local `AbortError`. This was a network/transport stop, not a schema, identity or data-integrity failure.

Hosted state at stop:

```text
full-campaign source archives = 37
  TRI archives = 36
  corporate-action archives = 1
full-campaign benchmark rows = 744
full-campaign corporate-action rows = 49
full-campaign raw price rows = 0

normalizations = 0
adjustment factors = 0
adjusted series = 0
```

Transport remediation is repository-only:

- corporate-action request timeout increased from 45s to 120s;
- every failed corporate-action attempt obtains a fresh NSE session before retry;
- official response bytes are cached only after successful JSON/schema/date parsing;
- completed corporate-action months are skipped on resume so local counters are not double-counted;
- acquisition semantics, official-source requirements, campaign ID and plan hash are unchanged;
- existing one-campaign grant remains valid.

```text
P8-B3 full source acquisition = ACTIVE / RESUMABLE
Stage 1 TRI calendar = COMPLETE / PASS
Stage 2 corporate actions = 1 / 36 months COMPLETE
Stage 3 raw prices = NOT STARTED

P8-B3 normalization/materialization = NOT AUTHORIZED
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 hosted action-batch diagnostic hardening — 1 October 2026

The resumed full-source campaign reached the November-2023 corporate-action slice. The official November source archive was stored successfully, but the hosted `action_batch` operation returned HTTP 500 before inserting any November action rows.

Hosted state at the stop:

```text
full-campaign source archives = 38
  TRI archives = 36
  corporate-action archives = 2
full-campaign benchmark rows = 744
full-campaign corporate-action rows = 49
full-campaign raw-price rows = 0

normalizations = 0
adjustment factors = 0
adjusted series = 0
```

The Edge Function previously collapsed structured Supabase/PostgREST error objects into the generic code `P8_B3_SOURCE_ACQUISITION_FAILED`. That diagnostic behavior has been corrected without changing ingestion semantics.

Development Edge Function:

```text
p8-b3-acquire-market-history
version = 2
status = ACTIVE
```

Version 2 returns safe structured database diagnostics (code/message/details/hint) on failure while preserving the same campaign ID, plan hash, grant, database-write rules and fail-closed behavior.

```text
P8-B3 full source acquisition = ACTIVE / RESUMABLE
Stage 1 TRI calendar = COMPLETE / PASS
Stage 2 corporate actions = 1 month fully committed; November archive stored, rows pending
Stage 3 raw prices = NOT STARTED

P8-B3 normalization/materialization = NOT AUTHORIZED
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

## P8-B3 action identity resolver performance remediation — 2 October 2026

The resumed full-source campaign exposed the exact hosted failure:

```text
PostgreSQL code = 57014
message = canceling statement due to statement timeout
operation = action_batch
```

Root cause:

- `p8_historical_listing_observations_v3` contains 562,790 rows;
- the B3 corporate-action resolver filters by `portfolio_id + experiment_id + trading_symbol`;
- the table previously had no `trading_symbol` lookup index;
- November-2023 action resolution therefore crossed the hosted statement timeout.

Remediation:

1. additive Development migration added:
   `p8_historical_listing_obs_v3_action_lookup_idx`
2. exact key:
   `(portfolio_id, experiment_id, trading_symbol, historical_identity_id, source_date) INCLUDE (series)`
3. B2 listing/identity row counts and fingerprints verified unchanged pre/post migration;
4. Edge Function action identity lookup now queries symbols in deterministic chunks of 32 rather than one large `IN (...)` request;
5. Development Edge Function `p8-b3-acquire-market-history` deployed ACTIVE as version 3.

Preservation:

```text
B2 listing rows = 562790 / unchanged
B2 listing row-hash fingerprint = unchanged
B2 identities = 4524 / unchanged
B2 identity fingerprint = unchanged
```

Campaign state remains resumable with the same campaign ID, plan hash and one-campaign grant.

```text
P8-B3 full source acquisition = ACTIVE / RESUMABLE
Stage 1 TRI calendar = COMPLETE / PASS
Stage 2 corporate actions = October committed; November archive stored, rows pending retry
Stage 3 raw prices = NOT STARTED

P8-B3 normalization/materialization = NOT AUTHORIZED
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```


## P8-B3 storage remediation entry — 2 October 2026

The full B3 source-acquisition campaign is paused because the Development Supabase Free database exceeded the 500 MB database-size quota and entered read-only mode.

Read-only forensic remeasurement confirmed:

- Development database size = 1,531,079,827 bytes / ~1460 MB;
- `p8_b3_raw_market_price_observations` = ~565 MB;
- `p8_historical_listing_observations_v3` = ~499 MB;
- `p8_historical_universe_member_listing_evidence_v3` = ~208 MB;
- `p8_historical_universe_members_v3` = ~78 MB;
- those four relations total ~1350 MB;
- Supabase Storage currently contains 0 buckets / 0 objects / 0 bytes.

The owner approved proceeding with non-destructive storage-remediation stages S0–S3 only.

Authoritative plan:
`docs/p8/PortfolioAI_P8_B3_STORAGE_REMEDIATION_PLAN_V1_2026-10-02.md`

Target architecture:

- Supabase Postgres remains the online operational/control plane;
- bulky immutable B2/B3 historical materializations move to versioned Parquet in durable object storage;
- exact official NSE source files remain the forensic authority and are preserved separately;
- compact manifests, fingerprints and historical identity/symbol resolver structures remain in Postgres;
- final deployed PortfolioAI remains online and must not require localhost or the owner's Mac for normal use.

Current stage state:

```text
P8-B2 = COMPLETE / PASS / CLOSED
P8-B3 = ACTIVE / STORAGE-BLOCKED

B3 Stage 1 TRI = COMPLETE / PASS
B3 Stage 2 Corporate Actions = COMPLETE / PASS
B3 Stage 3 raw prices = 241 / 744 / PAUSED

Storage Remediation S0 = COMPLETE / PASS
Storage Remediation S1 = PENDING RAW-FILE BYTE VERIFICATION
Storage Remediation S2 = DOCUMENTED / OWNER REVIEW
Storage Remediation S3 = PARQUET CANARY PENDING

B3 normalization/materialization = NOT AUTHORIZED
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

No Supabase data write, schema migration, table/index removal, provider call, acquisition restart, normalization, deployment or Production/main change occurred during this entry.


## P8-B3 storage remediation S3A canary result — 2 October 2026

Owner froze Cloudflare R2 Standard as the primary P8 historical object store. Cloudflare D1 is not used.

A Development-only isolated branch was created:

`p8-b3-storage-s3-canary`

GitHub Actions executed the first exact Parquet preservation canary successfully:

- workflow run: `36961242278`;
- canary commit: `70732143ae5843dc19db46bd49a43230f5fdd82f`;
- artifact ID: `11208170069`;
- DuckDB: `1.5.6`;
- Parquet: V2 / ZSTD;
- rows: 5 exact Development B3 raw-price rows;
- source archive: `183e942c-a54d-5889-8043-436eebeb635d`;
- trade date: `2023-10-03`;
- source fingerprint:
  `716ad53ad17e6fadc9e9e49230584b946fbecd964e530384daad73f6c5ed9061`;
- read-back fingerprint:
  `716ad53ad17e6fadc9e9e49230584b946fbecd964e530384daad73f6c5ed9061`;
- Parquet SHA-256:
  `fb5f9b07d510cdaf7336f8a84b76c97740ff79566b81d6361d0c2468b873450f`;
- Parquet size: 6,330 bytes.

Exact round-trip parity therefore passed for the canary representation.

The workflow already contains Cloudflare R2 upload + download SHA-256 verification using the R2 S3 endpoint. That step was safely skipped because the repository currently has no R2 credentials configured:

`R2_CANARY=SKIPPED_MISSING_SECRETS`

Required future secret names:

- `CLOUDFLARE_R2_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET`

Current state:

```text
Storage Remediation S0 = COMPLETE / PASS
Storage Remediation S1 = PENDING RAW-FILE BYTE VERIFICATION
Storage Remediation S2 = COMPLETE / DOCUMENTED / R2 FROZEN
Storage Remediation S3A Parquet round-trip = COMPLETE / PASS
Storage Remediation S3B R2 upload-readback = PENDING R2 CONNECTION

P8-B3 acquisition = PAUSED at 241 / 744
B3 normalization/materialization = NOT AUTHORIZED
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED

NO SUPABASE WRITE
NO DATABASE MIGRATION
NO TABLE/INDEX REMOVAL
NO B3 RESTART
Production = UNCHANGED
main = UNCHANGED
```


## P8-B3 storage remediation S3B R2 hosted canary progress — 2 October 2026

Cloudflare R2 was enabled by the owner and became accessible through the authenticated Cloudflare plugin.

Hosted R2 actions completed:

- created private Development bucket `portfolioai-history-dev`;
- bucket location = APAC;
- bucket storage class = Standard;
- uploaded the exact 6,330-byte Parquet canary artifact produced by GitHub Actions;
- object key:
  `portfolioai-history/development/p8/b3/canary/v1/trade_date=2023-10-03/p8-b3-storage-s3-canary.parquet`;
- R2 reported object size = 6,330 bytes;
- uploaded immutable manifest sidecar;
- uploaded SHA-256 sidecar containing the expected Parquet SHA-256:
  `fb5f9b07d510cdaf7336f8a84b76c97740ff79566b81d6361d0c2468b873450f`;
- R2 list-objects confirms all three objects are present.

The Cloudflare ChatGPT connector's Get Object operation UTF-8 decodes binary object bodies. For the Parquet object, the connector returned a 6,290-character decoded string with U+FFFD replacement characters despite R2 reporting the stored object as 6,330 bytes. Therefore the connector output is not byte-preserving and MUST NOT be used for the required downloaded-object SHA-256 check.

Cloudflare API token management is not authorized through the current plugin session (`9109 Unauthorized to access requested resource`). Therefore a short-lived/exportable credential could not be created automatically for an independent S3/raw-byte download.

Fail-closed state:

```text
S3A Parquet local/CI round-trip = COMPLETE / PASS
S3B R2 bucket creation = COMPLETE / PASS
S3B R2 Parquet upload = COMPLETE
S3B R2 object presence/size = COMPLETE / PASS
S3B R2 manifest + SHA sidecars = COMPLETE / PASS
S3B strict binary download SHA-256 = PENDING S3/API CREDENTIAL PATH
S3 overall = NOT YET CLOSED
```

No PostgreSQL retirement, full export, acquisition restart or normalization may proceed solely on the connector-decoded object body. A true byte-preserving R2 download must match the expected SHA-256 before S3 closes.

## P8-B3 N6R-3 event-local / segment-local policy simulation — 3 October 2026

GitHub Actions run `37108934030` completed successfully on `PortfolioAI-Development`.

Frozen N6R-3 audit result:

- status = COMPLETE / PASS
- N6 V1 adjusted-series rows = 1,854,978 / unchanged
- V1 whole-identity blocked rows = 458,982
- projected V2 price-usable rows under event-local segmentation = 1,854,978
- projected V2 price-blocked rows = 0
- projected cross-boundary return rows = 192
- unresolved event identities = 169
- unresolved event dates = 192
- N6R-2 recovered dividend normalization IDs honored = 371
- V1 decision-ledger READY = 60,616
- V1 complex blockers = 20,787
- V1 no-trade blockers = 40,553
- projected decision READY = 81,394
- projected complex blockers = 9
- complex blockers recoverable under the simulated event-local policy = 20,778
- projected no-trade blockers remain = 40,553

Policy simulation only:

- unresolved corporate-action events block the cross-event return transition rather than the full identity history;
- pre-event and post-event segments remain independently usable;
- restarted segments seed return = null and TRI = 1000;
- unresolved dividend boundaries keep the price path usable while blocking total-return continuity;
- unresolved capital-action boundaries block price/total-return cross-boundary transitions;
- no price carry-forward was performed.

Preservation gates:

```text
N6 V1 overwrite = NO
N6R-4 materialization = NO
N6R-5 / V2 materialization = NO
R2 raw catalog mutation = NO
Production = UNCHANGED
main = UNCHANGED
```

Artifacts:

- `docs/p8/PortfolioAI_P8_B3_N6R3_EVENT_LOCAL_POLICY_AUDIT_2026-10-03.json`
- `docs/p8/PortfolioAI_P8_B3_N6R3_EVENT_BOUNDARY_MATRIX_2026-10-03.csv`

N6R-3 is COMPLETE / PASS / CLOSED. N6R-4 is authorized as analysis/policy-evidence only.

## P8-B3 N6R-4 no-trade-on-decision-date staleness analysis — 3 October 2026

N6R-4 completed the analysis-only census of all frozen N6 V1 `NO_TRADE_ON_DECISION_DATE` decision pairs using the exact immutable R2 raw-price history for the same `historical_identity_id`.

Final state:

```text
N6R-4 = COMPLETE / PASS / CLOSED
NO_TRADE_ON_DECISION_DATE pairs = 40,553
benchmark trading dates scanned = 744
R2 raw-price partitions scanned = 744
decision-ledger partitions = 32
exact target identities = 1,749
```

Exact staleness distribution:

```text
1 previous benchmark trading day = 1,177
2 benchmark trading days = 489
3 benchmark trading days = 417
4–5 benchmark trading days = 516
6–10 benchmark trading days = 247
>10 benchmark trading days = 3,353
no prior valid raw price = 34,354
TOTAL = 40,553
```

After applying the non-threshold fail-closed gates, 6,197 pairs are eligible for owner threshold review.

Candidate cumulative recoverable counts:

```text
<=1 benchmark trading day = 1,177
<=2 benchmark trading days = 1,666
<=3 benchmark trading days = 2,083
<=5 benchmark trading days = 2,597
<=10 benchmark trading days = 2,844
```

Primary exclusion accounting:

```text
NO_PRIOR_PRICE = 34,354
CORPORATE_ACTION_BOUNDARY = 2
ELIGIBLE_FOR_THRESHOLD_REVIEW = 6,197
TOTAL = 40,553
```

No identity-ambiguity exclusion and no conflicting-economics exclusion were observed in the final row-level census. The two pairs with an intervening corporate-action boundary remain fail-closed irrespective of staleness.

No carry-forward threshold has been selected or authorized. The audit records these owner-review policy candidates only:

- strict: <=1 benchmark trading day;
- conservative: <=2 benchmark trading days;
- research: <=3 benchmark trading days;
- <=5 and <=10 benchmark trading days remain diagnostic comparison candidates only.

Preservation gates:

```text
silent carry-forward = NO
V2 decision-price materialization = NO
N6 V1 mutation = NO
raw R2 catalog mutation = NO
N6R-5 = NOT STARTED / NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

Evidence commit produced by GitHub Actions:

`52ffdd89ec758cf4b3bb7ce4c8c272ff335f626e`

Artifacts:

- `docs/p8/PortfolioAI_P8_B3_N6R4_NO_TRADE_STALENESS_AUDIT_2026-10-03.json`
- `docs/p8/PortfolioAI_P8_B3_N6R4_NO_TRADE_STALENESS_MATRIX_2026-10-03.csv`
- `docs/p8/PortfolioAI_P8_B3_N6R4_RUN_STATE_2026-10-03.json`
- `scripts/p8/p8-b3-n6r4-no-trade-staleness.py`
- `.github/workflows/p8-b3-n6r4-no-trade-staleness.yml`

N6R-4 is frozen as analysis/policy evidence. Stop boundary remains before N6R-5.


## P8-B3 N6R-5 V2 materialization — 3 October 2026

N6R-5 completed successfully on Development using the strictest N6R-4 carry-forward candidate and localized fail-closed handling for raw economics conflicts.

Final GitHub Actions run:

`37112455074`

Final state:

```text
N6R-5 = COMPLETE / PASS / CLOSED
policy = STRICT_1_BENCHMARK_DAY
V2 adjusted-series rows = 1,854,978
V2 adjusted-series READY = 1,852,250
V2 adjusted-series BLOCKED = 2,728
raw economics conflict identity-date groups = 1,363
V2 decision-ledger rows = 121,956
V2 decision-ledger READY = 82,504
V2 decision-ledger BLOCKED = 39,452
strict 1-day carry-forward recoveries = 1,177
remaining complex blockers = 76
remaining no-trade blockers = 39,376
```

Raw economics conflict policy:

- exact conflicting identity-date only is blocked;
- no price row is selected from conflicting economics;
- continuity restarts after that identity-date;
- the rest of the identity history remains independently usable;
- 67 of the remaining complex decision blockers are caused by these localized raw-price conflicts;
- 20,711 of the original 20,787 complex blockers were recovered.

Preservation gates:

```text
N6 V1 adjusted fingerprint = 7f7f14c7af972baa22e0363732a285df1e4f3e0631d8134ce665ac32397c8a76 / unchanged
N6 V1 decision fingerprint = 9ec30b0c8ea30e5d8068be570a8b251964efc5ef725d795165666b5223b275ae / unchanged
N6 V1 completion fingerprint = 59992c038e74f83ccb278dce0af73ed6cbd97ba2064c67cd724e0df531a4ca12 / unchanged
silent imputation = NO
corporate-action boundary crossing = NO
Production = UNCHANGED
main = UNCHANGED
N6R-6 = NOT STARTED / NOT AUTHORIZED
```

Artifacts:

- `scripts/p8/p8-b3-n6r5-v2-materialization.py`
- `.github/workflows/p8-b3-n6r5-v2-materialization.yml`
- `docs/p8/PortfolioAI_P8_B3_N6R5_V2_MATERIALIZATION_AUDIT_2026-10-03.json`
- R2 `portfolioai-history/development/p8/b3/adjusted-series/v2/`
- R2 `portfolioai-history/development/p8/b3/adjusted-decision-ledger/v2/`
- R2 `portfolioai-history/development/p8/manifests/v2/N6R5_COMPLETE.json`

N6R-5 is frozen. Stop boundary remains before N6R-6.


## P8-B3 N6R-6 V1-versus-V2 comparison audit — 3 October 2026

N6R-6 completed the read-only V1-versus-V2 comparison/audit gate after N6R-5.

Final GitHub Actions run:

`37117240418`

Final state:

```text
N6R-6 = COMPLETE / PASS / CLOSED
decision pairs compared = 121,956
V2 adjusted manifests recomputed = 744
V2 decision-ledger manifests recomputed = 32
selected V2 price lineages verified = 82,504
V1 READY regressions = 0
total new READY vs V1 = 21,888
```

V1 -> V2 transition matrix:

```text
V1 READY -> V2 READY = 60,616
V1 COMPLEX -> V2 READY = 20,711
V1 COMPLEX -> V2 BLOCKED = 76
V1 NO_TRADE -> V2 READY = 1,177
V1 NO_TRADE -> V2 BLOCKED = 39,376
```

Remaining blocker accounting:

```text
TOTAL remaining blockers = 39,452

structural/evidence/boundary = 34,432
  NO_PRIOR_PRICE = 34,354
  CORPORATE_ACTION_BOUNDARY_NO_TRADE = 2
  RAW_PRICE_ECONOMICS_CONFLICT_COMPLEX = 67
  UNRESOLVED_EVENT_BOUNDARY_COMPLEX = 9

strict-policy staleness = 5,020
  STALE_GT_1_BENCHMARK_DAY = 5,020
```

Interpretation:

- all remaining blockers are fully accounted;
- the 34,432 structural/evidence/boundary blockers require new evidence or a separately authorized remediation to change;
- the 5,020 stale-price blockers are held by the frozen `STRICT_1_BENCHMARK_DAY` policy and are not claimed to be fundamentally irreducible;
- no silent imputation was detected;
- every READY V2 decision has an exact selected V2 price row and verified lineage;
- all 121,956 V2 decision rows verify the frozen V1 row ID and row hash lineage.

Determinism:

```text
N6R-5 replay created objects = 0
N6R-5 replay unchanged objects = 1,553
immutable replay stable = YES
```

Frozen fingerprints:

```text
V1 adjusted = 7f7f14c7af972baa22e0363732a285df1e4f3e0631d8134ce665ac32397c8a76
V1 decision ledger = 9ec30b0c8ea30e5d8068be570a8b251964efc5ef725d795165666b5223b275ae
V1 completion = 59992c038e74f83ccb278dce0af73ed6cbd97ba2064c67cd724e0df531a4ca12
V2 adjusted = 118195d4f80b64b5eccd6891780567ae9ee06a950c8badf91f15213a0d9c2a82
V2 decision ledger = 7cfd268d0114501acc292fb06b5d73dd18ef5cfb724d306d00cda401be49e452
V2 completion = cbacc9dc030e5c654bde0995d3e8490d7cba406475ec47ce7cfacd83a06fcc1f
N6R-6 audit = eae3cf1d0499d961d1ea9a8fb16f1cb1fc7363fe28d1682a6c9e2d2c43447bb9
```

Closure gate:

```text
N6R-6 comparison audit = PASS
ready for B3 closure decision = YES
B3 closed by N6R-6 = NO
new remediation authorized = NO
R2 writes = 0
Supabase writes = 0
Production = UNCHANGED
main = UNCHANGED
```

Artifacts:

- `scripts/p8/p8-b3-n6r6-v1-v2-comparison-audit.py`
- `.github/workflows/p8-b3-n6r6-v1-v2-comparison-audit.yml`
- `docs/p8/PortfolioAI_P8_B3_N6R6_V1_V2_COMPARISON_AUDIT_2026-10-03.json`

N6R-6 is frozen. The next step is the separate P8-B3 closure decision; N6R-6 itself does not close B3 or authorize further remediation.


## P8-B3 closure — 3 October 2026

Owner explicitly authorized closure after N6R-6 PASS.

Final state:

```text
P8-B3 = COMPLETE / PASS / CLOSED

V2 adjusted-series rows = 1,854,978
V2 adjusted-series READY = 1,852,250
V2 adjusted-series BLOCKED = 2,728

V2 decision-ledger rows = 121,956
V2 decision-ledger READY = 82,504
V2 decision-ledger BLOCKED = 39,452

net new READY vs V1 = 21,888
V1 READY regressions = 0
```

Residual blocker accounting:

```text
NO_PRIOR_PRICE = 34,354
CORPORATE_ACTION_BOUNDARY_NO_TRADE = 2
RAW_PRICE_ECONOMICS_CONFLICT_COMPLEX = 67
UNRESOLVED_EVENT_BOUNDARY_COMPLEX = 9
STALE_GT_1_BENCHMARK_DAY = 5,020
TOTAL = 39,452
```

Closure conditions:

- all residual blockers fully accounted;
- strict carry-forward policy remains `STRICT_1_BENCHMARK_DAY`;
- no silent imputation;
- all 82,504 READY V2 selected-price lineages verified;
- 744 adjusted manifests and 32 decision-ledger manifests independently recomputed;
- immutable replay stable;
- V1 and V2 fingerprints frozen;
- no new remediation authorized.

Separate open preservation item:

- exhaustive original NSE source-file byte archival/verification (storage-remediation S1) remains open and is not claimed complete.

Closure record:

- `docs/p8/PortfolioAI_P8_B3_CLOSURE_2026-10-03.md`

```text
R2 writes during closure = 0
Supabase writes during closure = 0
Production = UNCHANGED
main = UNCHANGED
P8-B4 = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
```

P8-B3 is frozen. Any future change to residual-blocker policy, staleness threshold, event policy, raw-conflict handling, V2 adjusted series or V2 decision ledger requires separate authorization and versioning.


## P8-B4 start — point-in-time fundamentals and document history — 3 October 2026

Owner authorized starting P8-B4 after P8-B3 closure.

Current state:

```text
P8-B4 = ACTIVE
B4-0 cache-first baseline = COMPLETE / PASS
B4-1 repository point-in-time evidence contract = IMPLEMENTED
B4 hosted schema migration = NOT APPLIED
B4 provider acquisition = NOT EXECUTED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

Read-only B4 entry findings on PortfolioAI Dev:

```text
historical identities = 4,524
mapped to current canonical security_id = 262
unmapped historical identities = 4,262

fundamental_observations = 2,458 rows / 116 securities
Trendlyne fundamental rows = 2,454 / 114 securities
Trendlyne rows with published_at = 0
historical identities with any current-table fundamentals = 114 / 4,524
historical identities with publication-dated fundamentals = 1 / 4,524
historical identities with >=8 distinct fundamental periods = 1 / 4,524

research_documents = 140 / 112 securities
historical identities with any documents = 111 / 4,524
historical identities with publication-dated documents = 111 / 4,524
historical identities with hashed canonical documents = 0 / 4,524
```

Architecture conclusion:

- existing live/current `security_id`-keyed fundamental/document tables cannot serve as P8 historical truth;
- B4 requires a separate append-only historical evidence layer keyed by `historical_identity_id` and exact historical ISIN;
- current tables may only seed cache candidates when exact identity and timestamp provenance are proven;
- unknown publication time is ineligible;
- retrieval/provider update time never substitutes for publication time;
- no present-day canonical-security mapping may be projected backward.

Repository artifacts:

- `docs/p8/PortfolioAI_P8_B4_POINT_IN_TIME_EVIDENCE_ENTRY_PLAN_2026-10-03.md`
- `src/features/backtesting/p8B4HistoricalEvidenceContract.ts`
- `src/features/backtesting/p8B4HistoricalEvidenceContract.test.ts`

Implemented B4 contract controls:

- exact historical identity + ISIN;
- strict-before-decision publication/availability predicate;
- equality at decision instant is ineligible;
- unknown publication time fails closed;
- unknown source availability time fails closed;
- observed/retrieved timestamps are audit fields only and cannot substitute for source publication/availability;
- deterministic evidence semantic key and SHA-256 fingerprint.

```text
provider calls during B4 entry = 0
Supabase writes during B4 entry = 0
R2 writes during B4 entry = 0
Production changes = 0
main changes = 0
```

Next B4 step: repository/local additive historical-evidence schema package plus B4-2 dry-run acquisition manifest. Hosted migration/application and provider acquisition remain separate auditable execution gates.


## P8-B4-1 schema + identity contract closure — 3 October 2026

P8-B4-1 completed as a repository/local-only schema-and-contract stage.

Final state:

```text
P8-B4 = ACTIVE
B4-0 = COMPLETE / PASS
B4-1 = COMPLETE / PASS / CLOSED
B4-2 = READY / NOT STARTED
hosted B4 schema migration = NOT APPLIED / NOT AUTHORIZED
provider acquisition = NOT EXECUTED / NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

B4-1 artifacts:

- `docs/sql/PortfolioAI_P8_B4_HISTORICAL_EVIDENCE_SCHEMA_PROPOSAL_2026-10-03.sql`
- `src/features/backtesting/p8B4HistoricalEvidenceContract.ts`
- `src/features/backtesting/p8B4HistoricalEvidenceContract.test.ts`
- `.github/workflows/p8-b4-1-contract-verification.yml`
- `docs/p8/PortfolioAI_P8_B4_1_SCHEMA_IDENTITY_CONTRACT_AUDIT_2026-10-03.json`

Proposed historical evidence objects:

```text
p8_b4_fundamental_observations
p8_b4_research_documents
p8_b4_decision_evidence_eligibility
```

Frozen B4-1 controls:

- exact `historical_identity_id` + historical ISIN binding;
- no present-day security-ID back-projection;
- publication and source availability must both be proven;
- evidence must be strictly before the decision instant;
- equality at the decision instant is ineligible;
- unknown publication time fails closed;
- observed/retrieved/provider-update time cannot substitute for publication time;
- amendments/restatements append and explicitly link prior immutable evidence;
- revisions cannot cross semantic evidence series;
- revisions cannot carry a publication timestamp earlier than the item superseded;
- deterministic evidence fingerprint and idempotent-existing detection;
- repository schema proposal enables RLS and revokes anon/authenticated access;
- no hosted migration file was created.

Verification run:

`37118973304`

Verification result:

```text
targeted B4-1 tests = 11 / 11 PASS
isolated B4 TypeScript compile = PASS
architecture boundary check = PASS
schema non-hosted/fail-closed guard = PASS
B4-specific type errors = 0
```

The diagnostic full-repository typecheck still reports pre-existing errors in the frozen B3 file
`src/features/backtesting/p8CorporateActionNormalization.ts`. B4-1 did not modify that B3 code and does not mask the debt.

Mutation report:

```text
provider calls = 0
Supabase writes = 0
R2 writes = 0
hosted migration = 0
Production changes = 0
main changes = 0
```

B4-1 is frozen. The next stage is B4-2 dry-run acquisition manifest only.


## P8-B4-2 dry-run acquisition manifest closure — 3 October 2026

P8-B4-2 completed as a strict read-only dry-run acquisition manifest.

Final state:

```text
P8-B4 = ACTIVE
B4-0 = COMPLETE / PASS
B4-1 = COMPLETE / PASS / CLOSED
B4-2 = COMPLETE / PASS / CLOSED
B4-3 = READY / NOT STARTED
hosted B4 schema migration = NOT APPLIED / NOT AUTHORIZED
provider acquisition = NOT EXECUTED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

Manifest:

- `docs/p8/PortfolioAI_P8_B4_2_DRY_RUN_ACQUISITION_MANIFEST_2026-10-03.csv`
- rows = 4,524
- unique historical identities = 4,524
- SHA-256 = `239e348709b2161cd859bf51d32d80dde51f1a6331b0ea2ecee56295dd3e8bea`

Provider identity readiness:

```text
exact Trendlyne provider ID + matching historical ISIN = 239
no current canonical link = 4,262
current canonical link but no exact Trendlyne provider identity = 23
blocked exact-provider-identity total = 4,285
provider ISIN mismatches = 0
```

Cache state inside the exact 239-identity cohort:

```text
fundamentals:
  cache absent = 125
  cache present but publication time unknown = 113
  publication-dated cache present = 1
  >=8 periods = 1

documents:
  cache absent = 128
  publication-dated metadata present = 111
  hashed canonical documents = 0
```

Dry-run call model:

```text
method = lower-bound one provider attempt per incomplete domain per exact identity
minimum planned Trendlyne attempts = 478
planned daily ceiling = 320
retry/diagnostic reserve = 80
minimum full-campaign days if later authorized = 2
```

The 478 figure is a lower bound only. Actual execution can be higher because historical period depth, official publication-time remediation, source-specific document retrieval and retries are not collapsed into the dry-run estimate.

Dry-run dispositions:

```text
CANARY_ELIGIBLE_CACHE_FIRST = 239
BLOCKED_EXACT_PROVIDER_IDENTITY = 4,285
```

Fail-closed rules:

- only exact Trendlyne provider ID plus matching historical ISIN may enter a future provider canary;
- current canonical linkage alone does not authorize provider execution;
- existing Trendlyne fundamentals with unknown `published_at` remain ineligible for historical replay;
- publication metadata without durable document content hash is not treated as complete historical document authority;
- unresolved identities remain deterministic exclusions until separately remediated.

Verification:

- GitHub Actions run `37119334491`
- job `111192235373`
- manifest accounting = PASS
- uniqueness = PASS
- provider/hosted mutation guard = PASS

Audit:

- `docs/p8/PortfolioAI_P8_B4_2_DRY_RUN_ACQUISITION_AUDIT_2026-10-03.json`

Mutation report:

```text
provider calls = 0
Supabase writes = 0
R2 writes = 0
hosted migrations = 0
Production changes = 0
main changes = 0
```

B4-2 is frozen. The next stage is B4-3 canary acquisition campaign, which requires separate authorization before any provider call or hosted persistence.


## P8-B4-3 canary acquisition closure — 3 October 2026

P8-B4-3 completed as a bounded live provider canary.

Final state:

```text
P8-B4 = ACTIVE
B4-0 = COMPLETE / PASS
B4-1 = COMPLETE / PASS / CLOSED
B4-2 = COMPLETE / PASS / CLOSED
B4-3 = COMPLETE / PASS / CLOSED
B4-4 = READY / NOT STARTED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

Deterministic three-identity cohort:

- MGL — no cached fundamentals/documents;
- RELIANCE — cached fundamentals with unknown publication time + document metadata;
- HDFCBANK — partial publication-dated fundamental cache.

Exact identity controls:

- exact historical identity ID;
- exact historical ISIN;
- exact Trendlyne provider ID;
- hard-coded cohort;
- maximum 6 provider attempts;
- stop on first provider/schema/provenance failure.

Live canary run:

```text
run_id = b5b61ca8-b2c1-4c94-aa01-c397e37755c5
provider calls planned max = 6
provider calls attempted = 6
provider calls succeeded = 6
provider calls failed = 0
budget consumed = 6
raw captures = 6
```

Provider operation split:

```text
GET_PARAMETER_VALUES_MULTI_STOCK = 3 / 3 succeeded
GET_DOCUMENT_SEARCH_RESULTS = 3 / 3 succeeded
```

Canary captures:

- 3 immutable raw fundamental-history captures;
- 3 immutable raw document-history captures;
- payload SHA-256 recorded for all six;
- provider usage event recorded for all six.

Canonical mutation controls:

```text
fundamental_observations rows after canary = 2,458 / unchanged
research_documents rows after canary = 140 / unchanged
canonical fundamental writes = 0
canonical document writes = 0
B4 schema writes = 0
R2 writes = 0
canonical promotion performed = NO
```

Evidence-quality finding:

- structured fundamental-history requests returned provider data for all three identities;
- however, the returned fundamental responses still do not prove a trustworthy source publication timestamp under the frozen B4 contract;
- therefore those captures remain raw evidence only and are NOT point-in-time eligible;
- document searches returned dated document records for all three identities, including annual-report dates;
- those provider-reported dates remain pending official NSE/BSE/company-source validation before canonical historical promotion.

Idempotency check:

- replay returned `IDEMPOTENT_EXISTING`;
- replay provider calls = 0;
- no duplicate source captures or usage events were created.

The replay GitHub job showed a final red status only because an old checkout attempted to push a second copy of the already-committed evidence file and hit a non-fast-forward rejection. The replay invocation and safety verification themselves both passed and made zero provider calls.

Artifacts:

- `supabase/functions/p8-b4-3-canary/index.ts`
- `.github/workflows/p8-b4-3-canary.yml`
- `docs/p8/PortfolioAI_P8_B4_3_CANARY_LATEST.json`
- `docs/p8/PortfolioAI_P8_B4_3_CANARY_ACQUISITION_AUDIT_2026-10-03.json`

Execution evidence:

- GitHub Actions run `37120486659`;
- successful canary job `111195466314`;
- idempotency replay job `111195796854`;
- deployed Development Edge Function `p8-b4-3-canary` version 2.

B4-3 is frozen. B4-4 must remain separately authorized before any broad provider campaign.


## P8-B4-4 bounded full acquisition closure — 3 October 2026

P8-B4-4 completed after owner authorized use of the live verified Trendlyne 1,000-calls/day quota for the remaining bounded campaign.

Final state:

```text
P8-B4 = ACTIVE
B4-0 = COMPLETE / PASS
B4-1 = COMPLETE / PASS / CLOSED
B4-2 = COMPLETE / PASS / CLOSED
B4-3 = COMPLETE / PASS / CLOSED
B4-4 = COMPLETE / PASS / CLOSED
B4-5 = READY / NOT STARTED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

Final B4-4 coverage:

```text
exact-provider identities = 239
identities with both raw fundamental + document capture = 239
remaining identities = 0
fund-only identities = 0
doc-only identities = 0

raw captures total = 478
  B4-3 canary fundamentals = 3
  B4-3 canary documents = 3
  B4-4 fundamentals = 236
  B4-4 documents = 236
```

Provider controls:

```text
live daily Trendlyne limit = 1,000
quota status = VERIFIED
per-run internal limit = 40
provider units used today = 479
```

The campaign remained below the verified 1,000/day provider limit.

Integrity and fail-closed status:

- exact historical identity + historical ISIN + exact provider identity required;
- raw-capture ledger is the final coverage authority;
- one worker-resource-limited run was reconciled safely and later resumed;
- a capture-ledger pagination undercount was found during continuation, stopped, and corrected before further broad execution;
- after the fix, remaining work was driven only from exhaustive raw-capture coverage;
- no canonical fundamentals were promoted;
- no canonical research documents were promoted;
- no B4 historical schema rows were written;
- no R2 writes;
- Production unchanged;
- main unchanged.

Canonical tables after B4-4:

```text
fundamental_observations = 2,458 / unchanged
research_documents = 140 / unchanged
```

Evidence disposition remains deliberately raw-only:

- fundamentals: pending provable publication/source-availability timing;
- documents: pending official NSE/BSE/company-source validation;
- no B4-5 point-in-time eligibility materialization has started.

Final audit:

- `docs/p8/PortfolioAI_P8_B4_4_FINAL_BOUNDED_CAMPAIGN_AUDIT_2026-10-03.json`

B4-4 is frozen. B4-5 requires separate owner authorization.


## P8-B4-5 decision-date eligibility materialization closure — 3 October 2026

P8-B4-5 completed as a Development-only decision-date eligibility materialization stage.

Final state:

```text
P8-B4 = ACTIVE
B4-0 = COMPLETE / PASS
B4-1 = COMPLETE / PASS / CLOSED
B4-2 = COMPLETE / PASS / CLOSED
B4-3 = COMPLETE / PASS / CLOSED
B4-4 = COMPLETE / PASS / CLOSED
B4-5 = COMPLETE / PASS / CLOSED
B4-6 = READY / NOT STARTED
P8-B5 = NOT STARTED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

Population:

```text
historical identities = 4,524
frozen B2 decision dates = 32
identity/date pairs = 144,768
evidence domains = 2
materialized eligibility rows = 289,536
```

Materializer:

- `P8_B4_DECISION_ELIGIBILITY_V1`
- exact hosted table: `public.p8_b4_decision_evidence_eligibility`
- repository SQL: `docs/sql/PortfolioAI_P8_B4_5_DECISION_ELIGIBILITY_MATERIALIZATION_2026-10-03.sql`

Eligibility result is deliberately fail-closed:

```text
selected evidence rows = 0
rows with explicit exclusion = 289,536
null exclusions = 0
```

Fundamental exclusions:

```text
INELIGIBLE_UNKNOWN_PUBLICATION_TIME = 7,648
INELIGIBLE_NO_EXACT_PROVIDER_IDENTITY = 137,120
```

Document exclusions:

```text
INELIGIBLE_UNKNOWN_SOURCE_AVAILABILITY_TIME = 7,648
INELIGIBLE_NO_EXACT_PROVIDER_IDENTITY = 137,120
```

The 7,648 rows per captured domain equal 239 exact-provider identities × 32 decisions.

No provider retrieval/update timestamp was treated as publication time. No provider-reported document date was treated as authoritative source availability without official-source validation. No current-state fallback or invented timing was used.

Determinism / idempotency:

```text
rows = 289,536
distinct logical keys = 289,536
distinct selection fingerprints = 289,536
aggregate fingerprint = 5ba943fa1ea2a2e94ead3f58065bc0a848c5a71a84275aa3192240993557e883
replay = ZERO NEW ROWS
```

Security:

```text
RLS = enabled
anon SELECT = false
authenticated SELECT = false
anon INSERT = false
authenticated INSERT = false
```

Supabase's RLS-with-no-policy information notice is intentional for this service/internal-only table because all public client privileges are revoked. The B4-5 foreign-key performance advisory was cleared by adding a covering historical-identity index.

Storage after B4-5:

```text
eligibility relation = 187 MB
PortfolioAI Dev database = 322 MB
free-plan threshold = 500 MB
```

This footprint must remain visible in B4-6 closure review.

Final audit:

- `docs/p8/PortfolioAI_P8_B4_5_DECISION_ELIGIBILITY_MATERIALIZATION_AUDIT_2026-10-03.json`

B4-5 is frozen. B4-6 remains separately owner-gated.


## P8-B4-6 final closure — 3 October 2026

P8-B4-6 completed as the final P8-B4 idempotency, coverage, provider-accounting, security and storage closure audit.

Final state:

```text
P8-B4 = COMPLETE / PASS / CLOSED
B4-0 = COMPLETE / PASS
B4-1 = COMPLETE / PASS / CLOSED
B4-2 = COMPLETE / PASS / CLOSED
B4-3 = COMPLETE / PASS / CLOSED
B4-4 = COMPLETE / PASS / CLOSED
B4-5 = COMPLETE / PASS / CLOSED
B4-6 = COMPLETE / PASS / CLOSED
P8-B5 = READY / NOT STARTED / NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

Acquisition closure:

```text
exact-provider identities = 239
identity/domain capture keys = 478
raw capture rows = 478
duplicate capture keys = 0
raw capture fingerprint = 4c4930eba3c5eee8bfce99af0210673b9b27e666f2117b17cad4ea27a71fffcb
provider units accounted today = 479
```

The one-unit difference between provider usage and useful captures is fully accounted for: one successful provider attempt was interrupted before durable capture during a worker resource-limit event and was later safely reacquired. No duplicate completed identity/domain capture remains.

B4-4 run accounting, corrected during closure review:

```text
B4-4 runs = 23
successful runs = 21
worker-resource-limited runs = 2
recorded B4-4 attempted calls = 473
accepted B4-4 identities = 236
B4-3 canary identities = 3
total exact-provider identities = 239
```

Decision-date eligibility closure:

```text
historical identities = 4,524
decision dates = 32
identity/date pairs = 144,768
evidence domains = 2
eligibility rows = 289,536
distinct logical keys = 289,536
distinct fingerprints = 289,536
selected evidence rows = 0
explicit exclusion rows = 289,536
null exclusions = 0
aggregate fingerprint = 5ba943fa1ea2a2e94ead3f58065bc0a848c5a71a84275aa3192240993557e883
replay = ZERO NEW ROWS
```

Frozen contract checks all passed:

- unknown publication time treated as eligible = 0;
- unknown source-availability time treated as eligible = 0;
- provider retrieval/update time never substituted for publication time;
- current-state fallback = none;
- cross-security imputation = none;
- invented publication timestamps = 0;
- invented source-availability timestamps = 0;
- replay duplicates = 0;
- fingerprint drift = 0.

Canonical preservation:

```text
fundamental_observations = 2,458 / unchanged
research_documents = 140 / unchanged
canonical fundamental promotion = NO
canonical document promotion = NO
```

Security:

```text
B4-5 eligibility RLS = enabled
anon SELECT/INSERT = denied
authenticated SELECT/INSERT = denied
historical-identity FK advisor = cleared
```

Storage at closure:

```text
B4 eligibility relation = 187 MB
PortfolioAI Dev database = 322 MB
free-plan threshold = 500 MB
approximate remaining headroom = 178 MB
```

The B4 eligibility relation remains a significant storage item and must stay visible in later P8 storage planning.

Final audit:

- `docs/p8/PortfolioAI_P8_B4_6_FINAL_CLOSURE_AUDIT_2026-10-03.json`

P8-B4 is frozen and closed. P8-B5 remains separately owner-gated.


## Post-B4 eligibility storage compaction — 3 October 2026

Post-B4 Development storage remediation completed before P8-B5.

Fresh full PortfolioAI Dev backup was created and verified through the existing GitHub workflow `Manual Supabase Database Backup`.

Verified backup checkpoint:

```text
GitHub run = 37013039221
Development backup job = 111224605687 / SUCCESS
R2 bucket = portfolioai-history-dev
R2 prefix = portfolioai-backups/development/database/manual/2026-10-03T14-42-12Z/
encrypted backup size = 43,118,448 bytes
encrypted SHA-256 = f1990ea4efc3f88566d28d413decbc3bb53f28bc54cdf2039bdf7b6d6f0bf9ec
COMPLETE.json = present
R2 read-back/decrypt/pg_restore validation = PASS
```

The previous 2 October backup prefix was manually deleted by the owner and independently verified empty:

`portfolioai-backups/development/database/manual/2026-10-02T13-27-09Z/`

Eligibility storage before remediation:

```text
PortfolioAI Dev DB = 322 MB
p8_b4_decision_evidence_eligibility = 187 MB
logical rows = 289,536
aggregate fingerprint = 5ba943fa1ea2a2e94ead3f58065bc0a848c5a71a84275aa3192240993557e883
```

Compacted architecture:

- physical storage: `public.p8_b4_decision_evidence_eligibility_compact`
- public logical interface retained at original name:
  `public.p8_b4_decision_evidence_eligibility`
- compatibility object is a `security_invoker` view;
- original `id` and `created_at` values preserved exactly;
- row-level fingerprints preserved in 32-byte binary form;
- repeated text/constant fields derived by the compatibility view;
- `anon` and `authenticated` access remains denied.

Exact equivalence verification before removal of the old expanded table:

```text
old minus compatibility = 0
compatibility minus old = 0
rows = 289,536
distinct fingerprints = 289,536
selected rows = 0
null exclusions = 0
aggregate fingerprint = 5ba943fa1ea2a2e94ead3f58065bc0a848c5a71a84275aa3192240993557e883
```

Final storage:

```text
compact eligibility relation = 46 MB
PortfolioAI Dev DB = 181 MB
reduction = 141 MB
target < 200 MB = PASS
approximate headroom to 500 MB = 319 MB
```

Canonical research state remained unchanged:

```text
fundamental_observations = 2,458
research_documents = 140
Production = UNCHANGED
main = UNCHANGED
```

Final audit:

- `docs/p8/PortfolioAI_P8_B4_ELIGIBILITY_STORAGE_COMPACTION_AUDIT_2026-10-03.json`

P8-B4 remains COMPLETE / PASS / CLOSED.

P8-B5 = READY / NOT STARTED / NOT AUTHORIZED.


## P8-B5 historical classification / methodology validity closure — 3 October 2026

P8-B5 completed as a Development-only historical classification, methodology, assignment and threshold validity gate.

Final state:

```text
P8-B4 = COMPLETE / PASS / CLOSED
Post-B4 storage remediation = COMPLETE / PASS
P8-B5 = COMPLETE / PASS / CLOSED
P8-B6 = READY / NOT STARTED / NOT AUTHORIZED
P8-B-FINAL = NOT STARTED
P8-C = NOT STARTED / NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

Frozen historical-validity rule:

- no current classification, methodology, subprofile, or threshold is projected backward without dated evidence valid at the historical decision instant;
- the P7-IC1 methodology registry remains a current-state authority with `asOfDate=2026-09-29` and is not backdated into earlier P8 decisions;
- DRAFT recommendation policies are not accepted as approved historical threshold authority.

Population:

```text
historical identities = 4,524
decision dates = 32
identity/date pairs = 144,768
```

Classification evidence baseline:

```text
SECTOR observations = 300
SECTOR observations with valid_from = 0
INDUSTRY observations = 250
INDUSTRY observations with valid_from = 0
```

All current sector/industry observations were observed/retrieved in September 2026. Therefore present-day classification cannot be projected backward.

Primary blocker census:

```text
NO_CANONICAL_LINK = 136,384
NO_CLASSIFICATION_EVIDENCE_BEFORE_DECISION = 8,145
CLASSIFICATION_VALIDITY_UNPROVEN = 239
classification conflict/overlap = 0
```

Component evidence preserved:

```text
reviewed DB methodology assignment available before decision = 4 rows
approved pre-decision threshold policy = 0 rows
reviewed/effective subprofile available before decision = 1 row
methodology overlap = 0
subprofile overlap = 0
```

Materialized B5 authority:

- physical table: `public.p8_b5_historical_assignment_validity`
- decoded internal view: `public.p8_b5_historical_assignment_validity_v1`

Final materialization:

```text
rows = 144,768
distinct logical keys = 144,768
distinct deterministic fingerprints = 144,768
resolved historical paths = 0
blocked historical paths = 144,768
rows without an explicit blocker = 0
aggregate fingerprint = 85fc8b7185d88c65b869ab9444a5c9b00acfc40cd7933cb1ffa99f5f80a9429f
```

Independent source replay:

```text
replay rows = 144,768
replay minus materialized = 0
materialized minus replay = 0
replay aggregate fingerprint = 85fc8b7185d88c65b869ab9444a5c9b00acfc40cd7933cb1ffa99f5f80a9429f
```

Storage was compacted before closure:

```text
B5 relation = 18 MB
PortfolioAI Dev DB = 199 MB
target < 200 MB = PASS
```

Security:

```text
RLS = enabled
anon SELECT/INSERT = denied
authenticated SELECT/INSERT = denied
decoded view = security_invoker
B5 performance-advisor findings = 0
```

The Supabase RLS-with-no-policy information notice is intentional because the B5 objects are service/internal-only and client privileges are revoked.

Important interpretation:

**B5 passes structurally because every historical identity/date pair has exactly one deterministic disposition and all unresolved paths are explicit fail-closed blockers. This does not mean historical classification coverage is sufficient for the experiment.** P8-B6 must carry these blockers into canonical snapshots/exclusions, and P8-B-FINAL must decide whether the frozen experiment has sufficient coverage to proceed to P8-C.

Plan:

- `docs/p8/PortfolioAI_P8_B5_HISTORICAL_CLASSIFICATION_METHODOLOGY_VALIDITY_PLAN_2026-10-03.md`

Final audit:

- `docs/p8/PortfolioAI_P8_B5_HISTORICAL_CLASSIFICATION_METHODOLOGY_VALIDITY_AUDIT_2026-10-03.json`

No provider calls, Production changes, main changes, or P8-B6 work occurred.


## P8-B6 canonical historical snapshot materialization closure — 3 October 2026

P8-B6 completed as the canonical historical snapshot materialization gate.

Final state:

```text
P8-B4 = COMPLETE / PASS / CLOSED
P8-B5 = COMPLETE / PASS / CLOSED
P8-B6 = COMPLETE / PASS / CLOSED
P8-B-FINAL = READY / NOT STARTED / NOT AUTHORIZED
P8-C = NOT STARTED / NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

Canonical materialization:

```text
materialization run = f117c92a-acac-43db-b832-81f5853410a2
materializer = P8_B6_CANONICAL_SNAPSHOT_V1
historical identities = 4,524
decision dates = 32
logical snapshots = 144,768
distinct logical keys = 144,768
distinct snapshot fingerprints = 144,768
replay-ready rows = 0
canonical exclusions = 144,768
selection events = 1
aggregate fingerprint = 3dcce751ab82f2e8a80fcb265db2b79d5a93567cea911f0b749b295860fcf4a1
```

Exclusion census:

```text
B5_NO_CANONICAL_LINK = 136,384
B5_NO_CLASSIFICATION_EVIDENCE_BEFORE_DECISION = 8,145
B5_CLASSIFICATION_VALIDITY_UNPROVEN = 239
```

No future source cutoff was used. Current-state fallback was not used.

Independent B2+B4+B5 source replay:

```text
replay rows = 144,768
fingerprint mismatches = 0
missing materialized rows = 0
replay aggregate fingerprint = 3dcce751ab82f2e8a80fcb265db2b79d5a93567cea911f0b749b295860fcf4a1
```

Frozen versions bound into every snapshot fingerprint:

- `P8_R6_R10_REPLAY_V1`
- `P8_NSE_HISTORICAL_UNIVERSE_V1`
- `P8_HISTORICAL_CLASSIFICATION_V1`
- `P8_NIFTY500_TRI_V1`
- `P8_COST_MODEL_V1`
- `P8_MONTH_END_IST_V1`

Storage architecture:

- B6 physical vectors: `public.p8_b6_canonical_snapshot_vectors`
- B6 materialization runs: `public.p8_b6_materialization_runs`
- B6 selection events: `public.p8_b6_selection_events`
- canonical decoded interface: `public.p8_b6_canonical_historical_snapshots_v1`

B5 was further vector-compacted without changing its logical interface:

```text
B5 vectors = 1304 kB
B5 sparse lineage = 32 kB
B6 vectors = 5616 kB
PortfolioAI Dev DB = 188 MB
target < 200 MB = PASS
```

B5 rowwise-to-vector equivalence was 0 differences in both directions before removal of the rowwise table.

Security:

- RLS enabled on all B6 physical tables;
- anon/authenticated SELECT denied;
- canonical view uses `security_invoker`;
- B6 FK covering-index gaps were fixed;
- remaining advisor mentions are only newly-created indexes not yet observed in usage.

Important interpretation:

**B6 passes structurally because every expected identity/date pair has exactly one canonical deterministic disposition. All 144,768 rows are exclusions inherited from B5, so B6 does not assert that the experiment is replayable. P8-B-FINAL must make the coverage-sufficiency decision under the frozen experiment contract.**

Plan:

- `docs/p8/PortfolioAI_P8_B6_CANONICAL_HISTORICAL_SNAPSHOT_PLAN_2026-10-03.md`

Final audit:

- `docs/p8/PortfolioAI_P8_B6_CANONICAL_HISTORICAL_SNAPSHOT_AUDIT_2026-10-03.json`

No provider calls, Production changes, main changes, P8-B-FINAL work, or P8-C work occurred.


## P8-B-FINAL data-foundation closure audit — 3 October 2026

P8-B-FINAL completed against the frozen Codex plan and the frozen experiment contract `P8_EXPERIMENT_BIAS_CONTROL_V1`.

Final state:

```text
P8-B2 = COMPLETE / PASS / CLOSED
P8-B3 = COMPLETE / PASS / CLOSED
P8-B4 = COMPLETE / PASS / CLOSED
P8-B5 = COMPLETE / PASS / CLOSED
P8-B6 = COMPLETE / PASS / CLOSED
P8-B-FINAL = COMPLETE / BLOCKED / CLOSED
P8-B = BLOCKED — DATA FOUNDATION INSUFFICIENT FOR FROZEN EXPERIMENT
P8-C = NOT AUTHORIZED
Production = UNCHANGED
main = UNCHANGED
```

Codex B-FINAL PASS-condition audit:

```text
minimum approved decision dates = PASS
  proven = 32
  minimum = 24

historical universe survivor-free = PASS
  authority = P8-B2 closure

adjustment + benchmark contracts = PASS
  authority = P8-B3 closure
  NIFTY 500 TRI trading dates = 744

point-in-time evidence + version lineage complete enough = FAIL

explicit gaps within usable exclusion boundary = FAIL
  canonical exclusions = 144,768 / 144,768 = 100%

holdout untouched = PASS
  P8-C objects = 0
  replay/performance results = 0

owner transition to P8-C = NOT ELIGIBLE
```

B4 domain coverage:

```text
FUNDAMENTAL rows = 144,768
selected = 0
excluded = 144,768

DOCUMENT rows = 144,768
selected = 0
excluded = 144,768
```

B5 historical-path coverage:

```text
rows = 144,768
resolved full paths = 0
blocked paths = 144,768
```

B6 canonical coverage:

```text
canonical snapshots = 144,768
replay-ready = 0
excluded = 144,768
distinct keys = 144,768
distinct fingerprints = 144,768
future source-cutoff violations = 0
aggregate fingerprint = 3dcce751ab82f2e8a80fcb265db2b79d5a93567cea911f0b749b295860fcf4a1
```

Final blocker census:

```text
B5_NO_CANONICAL_LINK = 136,384
B5_NO_CLASSIFICATION_EVIDENCE_BEFORE_DECISION = 8,145
B5_CLASSIFICATION_VALIDITY_UNPROVEN = 239
```

Security-pattern matrix:

```text
4,262 identities:
  32/32 dates blocked by NO_CANONICAL_LINK

239 identities:
  31/32 dates blocked by NO_CLASSIFICATION_EVIDENCE_BEFORE_DECISION
  final date blocked by CLASSIFICATION_VALIDITY_UNPROVEN

23 identities:
  32/32 dates blocked by NO_CLASSIFICATION_EVIDENCE_BEFORE_DECISION

identities with >=1 replay-ready date = 0
```

Determinism and no-look-ahead remain PASS:

- B4 replay idempotent;
- B5 source replay = 144,768 rows, zero differences;
- B6 source replay = 144,768 rows, zero fingerprint mismatches;
- no future source cutoff;
- no current-state fallback;
- no cross-security imputation;
- no contract relaxation.

Holdout remains untouched. No P8-C/replay-performance database object exists and no performance result has been generated.

Current storage:

```text
PortfolioAI Dev DB = 188 MB
Supabase threshold = 500 MB
approximate headroom = 312 MB
```

Coverage matrices:

- `docs/p8/PortfolioAI_P8_B_FINAL_COVERAGE_MATRICES_2026-10-03.md`

Final audit:

- `docs/p8/PortfolioAI_P8_B_FINAL_DATA_FOUNDATION_CLOSURE_AUDIT_2026-10-03.json`

The frozen experiment contract has NOT been weakened. Under the Codex instruction, B-FINAL closes BLOCKED because zero canonical snapshots are replay-ready. P8-C remains prohibited until a separately authorized remediation produces sufficient point-in-time classification/methodology/evidence coverage and B6/B-FINAL are re-executed.


## P8-B Recovery started — Workstream A semantic correction — 3 October 2026

The single bounded P8-B recovery plan is now ACTIVE.

Controlling plan:

- `docs/p8/PortfolioAI_P8_B_SINGLE_RECOVERY_PLAN_2026-10-03.md`

Workstream A has started with a repository-backed semantic audit:

- `docs/p8/PortfolioAI_P8_B_RECOVERY_WORKSTREAM_A_SEMANTIC_AUDIT_2026-10-03.md`
- commit `db8b79bfe71b7b5acbe75713ba80c4d873efe3e1`

Key corrections proven:

1. Historical P8 identity is `historical_identity_id + historical_isin`; current `canonical_security_id` is optional and must not gate historical eligibility.
2. Historical company facts must be point-in-time, but the frozen replay policy `P8_R6_R10_REPLAY_V1` is an experiment algorithm and does not need to have existed in the historical year.
3. B-FINAL recovery coverage must distinguish the full 144,768 audit surface from the 121,956 B2-eligible experiment candidate pairs.
4. Official NSE/BSE filings must become the historical evidence identity/time authority; Trendlyne remains supplemental.

No hosted B5/B6 data mutation, provider call, NSE/BSE acquisition, P8-C work, Production change or main change occurred.

New-chat handoff:

- `docs/p8/PortfolioAI_P8_B_RECOVERY_NEW_CHAT_HANDOFF_2026-10-03.md`
- commit `08489a7742408f8acc24fcd5b5f77322e5dbf1f5`

Next action: continue Workstream A by implementing a separately versioned recovery contract + tests/fixtures. The recovery exclusion ceiling remains pending explicit owner freeze before bulk acquisition or P8-C.


## Baseline/Scope Freeze B evidence-gap closure — 5 October 2026

Current Development HEAD before this closure work was `224c2889372cb1a8dbecb1f32babf03e6fee064c`.

Evidence closure results:
- Current Development Vercel deployment for that SHA exists but is **ERROR** (`lint_or_type_error`, `npm run build` exit 2).
- Stable Development alias remains on older READY SHA `52fb8929bbaa3991256cb4386f4c716c137c0634`.
- Cloudflare R2 Development bucket/binding and preserved P8 objects are verified read-only.
- Existing 2026-10-03 Development backup integrity evidence is strong, but no isolated live restore rehearsal has been performed.
- Current methodology census is complete: 239/239 held equities, 45 profile codes, one P7 IC1 assignment per equity.
- Current readiness: 128 INSUFFICIENT, 109 REVIEW_REQUIRED, 2 STALE, 0 READY.
- Current usable-intelligence coverage under the frozen V1 endpoint: 0/239 equities and INR 0 / INR 2,087,118.51 priced equity value.
- Revised priority counts: 23 V1 BLOCKER, 21 V1 IMPORTANT, 4 V1.1, 8 NO CHANGE.

**Baseline Freeze remains PARTIAL.**  
**Scope Freeze B remains INCOMPLETE PROPOSAL / OWNER REVIEW NOT READY.**  
**V1 implementation remains NOT AUTHORIZED.**

The immediate unresolved items are the broken current Development deployment/browser proof, isolated restore/recovery acceptance, and evidence/engine remediation required before a non-arbitrary V1 usable-intelligence release threshold can be derived.
