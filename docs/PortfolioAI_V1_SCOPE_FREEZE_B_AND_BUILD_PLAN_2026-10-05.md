## Current Scope Freeze B review status — 5 October 2026

**Status: INCOMPLETE / OWNER REVIEW NOT READY**  
**V1 implementation: NOT AUTHORIZED**  
**Current Development HEAD: `fb067e01b64344c5279ceb65ead5ad7b3516a616`**  
**Browser-tested/READY Preview SHA: `ba8c9e9ddbc0e2658a213af178f0f8922e86639d`**  
**READY deployment: `dpl_5p9Daac7UqGSL8y6qP3dawqF1Hzx`**

Current HEAD is one documentation-only commit ahead of the verified READY Preview. Git comparison shows no application-source or runtime-configuration difference between those SHAs. Vercel currently returns no deployment for the exact current HEAD, so exact-current-HEAD Preview acceptance remains unproven and the older READY deployment is not substituted for it.

Authenticated hosted browser verification also remains unavailable because no existing authorized owner browser session is exposed to this execution environment and the Preview is protected by Vercel SSO. No protection bypass, credential request, or write-capable browser action is permitted.

Proposal content is otherwise complete enough to define the intended V1 implementation plan without prematurely executing V1-4/V1-5/V1-7.

### Frozen measured baseline for the proposal

- 248 open securities: 239 equities + 9 ETFs.
- Priced equity denominator: INR 2,087,118.51.
- Current methodology assignment census: 239/239 equities across 45 profiles.
- Methodology assignment is not equivalent to approved executable engine readiness or evidence readiness.
- Current evidence/readiness states: 128 INSUFFICIENT, 109 REVIEW_REQUIRED, 2 STALE, 0 READY.
- Current usable-intelligence baseline: 0/239 equities and INR 0 / INR 2,087,118.51 under the frozen minimum V1 endpoint.
- Capability totals: 22 V1 BLOCKER / 23 V1 IMPORTANT / 3 V1.1 / 8 NO CHANGE.

### Bounded remediation plan

The plan remains the existing V1 gate sequence with no new sub-gate hierarchy:

- **V1-2 Accounting Integrity:** verify/reconcile current accounting and broker attribution; do not rebuild proven ledger authority.
- **V1-3 Identity / Classification / Routing:** reuse the 239/239 assignment census, verify compatibility with current application routing, and fail closed on any genuine mismatch.
- **V1-4 Evidence / Current-History Readiness:** remediate the measured INSUFFICIENT / REVIEW_REQUIRED / STALE cohorts, method-specific current-history sufficiency, freshness/conflicts and benchmark alignment.
- **V1-5 Deterministic Engines:** generalize valid pilots and complete only genuinely missing engines.
- **V1-6 Eligibility / Movement:** implement current eligibility first; defer unsupported temporal movement rather than infer it.
- **V1-7 Portfolio Intelligence / Actions:** integrate Portfolio Fit, Position Sizing, Exit Risk and final action precedence.
- **V1-8 Thesis / Decisions / Optional AI:** persist owner thesis and reviewed recommendation/decision linkage; AI remains optional and downstream.
- **V1-9 Maintenance / Release:** invalidation/recompute, outage behavior, exact-SHA browser acceptance and recovery rehearsal.

### Proposed acceptance cohorts

Repository documentation will not publish private holding identities. The private acceptance set should use the smallest real Development cohort that covers:
- Core;
- bank/financial;
- pharma/specialized;
- non-financial;
- ETF;
- missing/review-required evidence;
- partial-sale accounting;
- multi-broker/unknown attribution.

Where a genuine Development case does not exist at acceptance time (for example a supported Satellite or a specific final ADD/EXIT condition), use a clearly labelled deterministic fixture instead of misclassifying a real holding.

### Proposed coverage contract

No arbitrary usable-intelligence percentage is frozen before implementation.

The proposal instead freezes:
1. **status coverage:** 248/248 open securities must have an explicit current applicability/readiness state;
2. **equity methodology-state coverage:** 239/239 equities remain explicitly assigned or explicitly blocked/review-required under the canonical authority;
3. **usable intelligence:** every equity counted as READY at release must reach the complete frozen endpoint (identity + applicable method + mandatory evidence/history + deterministic assessments + eligibility/portfolio context + Fit/Sizing/Exit where applicable + persisted advisory action);
4. unsupported, unresolved, stale or blocked securities remain visible in the denominator and never silently become HOLD;
5. the final count/value release threshold is measured from the implemented remediation cohorts before V1 release acceptance, not guessed in Scope Freeze B.

This is a planning contract, not a claim that any non-zero usable-intelligence coverage is currently achieved.

### Effort / dependency proposal

- V1-2: Small–Medium.
- V1-3: Small–Medium to Medium; 239/239 assignment census is reusable.
- V1-4: Large; dominant dependencies are evidence breadth/freshness, 9 sub-252-day history cases, and profile-specific benchmark/readiness rules.
- V1-5: Large; depends on V1-4 accepted inputs and pilot generalization.
- V1-6: Medium.
- V1-7: Large; depends on Fit/Sizing/Exit/action integration.
- V1-8: Medium.
- V1-9: Medium–Large; depends on invalidation, exact-SHA hosted browser proof and recovery rehearsal.

These are engineering ranges, not calendar promises or provider-call estimates.

### Owner decisions required once deployment/browser acceptance is available

1. Approve this bounded V1-2–V1-9 implementation plan and retain the no-sub-gate discipline.
2. Approve the coverage contract above rather than an arbitrary pre-implementation percentage.
3. Approve use of labelled deterministic fixtures for acceptance scenarios that do not exist as genuine READY Development holdings.
4. Approve deferral of the isolated restore rehearsal to **V1-9**, while keeping Baseline Freeze PARTIAL and retaining restore rehearsal as a release requirement.
5. Approve the proposed action semantics and precedence already documented in this file: BUY / ADD / HOLD / REDUCE / EXIT / WATCH, with BLOCKED as readiness rather than investment opinion.

Until exact-current-HEAD Preview and authenticated hosted browser evidence are available, this file remains **INCOMPLETE / OWNER REVIEW NOT READY**. No V1 implementation may start.

---

# PortfolioAI V1 Scope Freeze B and Build Plan — 5 October 2026

**Status:** INCOMPLETE PROPOSAL / OWNER REVIEW NOT READY  
**V1 IMPLEMENTATION:** NOT AUTHORIZED  
**Repository:** drddutta-portfolio/PortfiolioAI  
**Branch:** PortfolioAI-Development  
**Pre-audit source SHA:** `a116cec4ab0939238c02a5480d283a09186b274b`

## 1. Why this is incomplete

The authorized V1-1 audit is complete for available read-only repository and Development-database evidence, but Scope Freeze B cannot yet be honestly presented as ready for approval because four critical proof classes remain incomplete:

1. Development Preview deployment ID/SHA and repository-to-runtime match are unverified.
2. Authenticated browser end-to-end behavior is unverified.
3. Live Cloudflare/R2 runtime/bucket/catalog state and cross-layer recovery compatibility were not independently inspected.
4. A complete 239-equity methodology-route/readiness census has not yet been produced from the current contracts and evidence.

This proposal therefore freezes the build direction and known facts, but it does not authorize V1-2–V1-9.

## 2. Verified environment statement

Verified:
- repository: drddutta-portfolio/PortfiolioAI;
- authoritative branch: PortfolioAI-Development;
- pre-audit HEAD: `a116cec4ab0939238c02a5480d283a09186b274b`;
- Development Supabase: PortfolioAI Dev / `lrgpjimipfkyoqbpsqzz`, distinct from Project-PortfolioAI.

Unresolved:
- Vercel Development Preview deployment/ref/SHA;
- authenticated browser session;
- live R2 target/catalog/binding verification;
- isolated restore proof.

No unresolved item is converted into a PASS by name, historical status, or assumption.

## 3. Development/P8 baseline

Baseline report:
`docs/PortfolioAI_CURRENT_DEVELOPMENT_BASELINE_FREEZE_2026-10-05.md`

Status: **PARTIAL**.

P8 is **PRESERVED / PAUSED FOR FUTURE V2** during V1/V1.1. Existing P8 code/data/docs/manifests are not deleted or rebuilt. P8 Step 1 and Step 2 historical records remain preserved; Step 2's historical feasibility conclusion is NO-GO under its frozen experiment contract. That historical result is not a V1 blocker unless a V1 current-analysis dependency genuinely reuses the same preserved evidence.

## 4. Dated inventory

Measured from verified Development:

| Inventory | Count / value |
|---|---:|
| Open consolidated securities | 248 |
| Equities | 239 |
| ETFs | 9 |
| Other assets | 0 |
| Priced holdings | 248 |
| Unpriced holdings | 0 |
| Total priced market value | INR 2,217,451.55 |
| Priced equity value | INR 2,087,118.51 |
| Priced ETF value | INR 130,333.04 |
| Quantity-complete holdings | 248 |
| Holdings with missing broker attribution | 46 rows |

Current evidence breadth among 239 held equities:
- fundamental observation presence: 114;
- research-document presence: 111;
- current classification: 239;
- persisted recommendations: 1;
- persisted position-sizing assessments: 0.

These counts are evidence presence, not method-ready intelligence coverage.

## 5. Supported/unsupported methodology routes

**Not yet finalizable.**

Application classification covers 239/239 equities, but a complete current methodology-route/readiness census is still required because classification and analytical method are separate authorities. The census must derive each holding's route from the approved versioned contracts, then test mandatory metric, freshness, history, benchmark, engine and action prerequisites.

Until that census exists:
- SUPPORTED count: AUDIT_PENDING
- PARTIALLY SUPPORTED count: AUDIT_PENDING
- UNSUPPORTED count: AUDIT_PENDING
- AMBIGUOUS / UNRESOLVED count: AUDIT_PENDING

No release percentage is inferred from classification coverage alone.

## 6. Acceptance cohort contract

The committed repository must not expose the owner's private holding identities. Therefore the release cohort is defined here by classes and objective selection rules; the exact holding IDs/symbols must be recorded in an owner-private review artifact or local acceptance record when V1 implementation is authorized.

Required real cases, where present:
- supported Core;
- supported Satellite;
- role mismatch;
- high-quality overweight;
- underweight/ADD;
- deterioration/EXIT-review;
- missing evidence;
- conflicting evidence;
- bank/financial;
- non-financial;
- pharma/specialized profile;
- ETF;
- partial-sale accounting;
- multi-broker/unknown attribution.

Selection rule: choose the smallest set of real Development holdings that covers the maximum number of scenarios, using persisted evidence only. If a scenario does not exist, use a labelled deterministic fixture and do not pretend a real holding exhibits it.

## 7. Coverage definitions

Frozen denominators:
- **Equity count denominator:** 239 open equities.
- **Priced equity-value denominator:** INR 2,087,118.51 at the measured snapshot.
- ETFs/non-equities: separate accounting/status coverage; not included in the equity-intelligence numerator or denominator.
- Unsupported and unresolved equity profiles remain in the 239 denominator.
- Unpriced equity treatment: no unpriced equities in this snapshot; future unpriced holdings remain in count denominator with value unknown and a separate price-coverage condition.

Minimum deterministic usable endpoint:
1. canonical identity;
2. approved applicable method;
3. mandatory current evidence and current-analysis history;
4. deterministic stock assessments;
5. Core/Satellite eligibility/role fit;
6. required valuation/market/risk context;
7. portfolio Fit/Sizing/Exit assessment or legitimate method-defined not-applicable state;
8. persisted advisory action with reproducible input/portfolio lineage.

Generic BLOCKED, missing mandatory prerequisites, unsupported routes, or unresolved conflicts do not count as usable intelligence.

**Measured current usable-intelligence baseline:** NOT YET COMPUTABLE because the route/readiness census and integrated action coverage are incomplete.

## 8. Proposed release-threshold method

No arbitrary percentage is frozen yet.

The final minimum release threshold must be derived after the route/readiness census by:
- measuring baseline usable count/value;
- grouping remediable holdings into bounded cohorts;
- estimating count/value gained by each cohort;
- separating engineering work from provider/evidence acquisition;
- proving the resulting target is achievable without weakening evidence standards.

Status coverage must be 100%: every one of the 248 open securities must have an explicit applicable/readiness state, even when equity intelligence is NOT_APPLICABLE or BLOCKED.

## 9. V1-2–V1-9 completion contracts

The ten-gate structure in `PortfolioAI_V1_OPERATIONAL_COMPLETION_PLAN_2026-10-05.md` remains frozen. No new hierarchy of sub-gates is introduced.

- **V1-2 Accounting Integrity:** verify hand-reconciled ledger fixtures, partial sales, close/reopen, multi-broker, corrections, exact decimals, valuation/P&L cross-surface consistency.
- **V1-3 Identity/Classification/Routing:** complete 239-equity route matrix; preserve classification versus research-profile separation; fail closed on ambiguity.
- **V1-4 Evidence/History Readiness:** prove mandatory metric/freshness/history/benchmark readiness per route; acquire only authorized missing/stale evidence.
- **V1-5 Deterministic Investment Engines:** generalize valid pilots and build only genuinely missing engines; preserve independent dimensions and versioned lineage.
- **V1-6 Core/Satellite Eligibility and Movement:** current eligibility first; temporal movement only with adequate prior observations and anti-churn policy.
- **V1-7 Portfolio Intelligence and Actions:** integrate Portfolio Fit, Position Sizing and Exit Risk; preserve trim/reduce versus exit distinction; final advisory actions are portfolio-aware.
- **V1-8 Thesis/AI/Owner Decisions:** minimal owner thesis, immutable recommendation snapshot, owner decision linked to reviewed recommendation; AI optional and downstream.
- **V1-9 Maintenance/Release Candidate:** invalidation/recompute, outage behavior, end-to-end authenticated browser verification, recovery rehearsal and release acceptance.

## 10. Reuse/build/preservation matrix

| Area | Decision |
|---|---|
| Transaction/accounting foundation | REUSE AS-IS unless V1-2 proves a defect |
| Identity/classification | REUSE WITH ROUTE RECONCILIATION |
| Roles/settings/themes | REUSE AS-IS |
| Latest price cache | REUSE WITH FRESHNESS QUALIFICATION |
| Research evidence architecture/provider controls | REUSE / EXTEND |
| Generic Research workspace | REUSE / EXTEND |
| HDFCBANK/reference scoring/recommendation work | GENERALISE PILOT; do not clone stock-specific code |
| Pharma/specialized methodologies | PRESERVE and route through approved contracts |
| Core Health / Exit Risk readiness UI | PRESERVE UI; build missing formal engines |
| Position-sizing contract | GENERALISE PILOT; preserve fail-closed states |
| News | REUSE AS-IS subject to V1-9 runtime validation |
| Optional AI | REUSE as optional explanation only |
| P8/R2 historical replay assets | PRESERVED FOR V2/P8 |
| Historical experiment/backtesting | PAUSED; no V1 expansion |

## 11. Exact V1 blocker/important lists

Source of truth:
`docs/PortfolioAI_V1_OPERATIONAL_BASELINE_AUDIT_2026-10-05.md`

Current classification:
- V1 BLOCKER: 24 capability rows
- V1 IMPORTANT: 21
- V1.1: 4
- NO CHANGE: 7

Key blockers are route/readiness coverage, evidence/history/benchmark sufficiency, generalization/missing deterministic engines, Fit/Sizing/Exit/action integration, maintenance/recovery, and authenticated end-to-end proof.

## 12. V1.1 / V2 / Later placement

V1.1:
- richer monitoring/target/stop alerting;
- temporal movement where current evidence cannot support V1;
- richer theme intelligence;
- broader optional AI enrichment.

V2/P8:
- point-in-time historical reconstruction;
- historical recommendation/strategy replay and evaluation;
- preserved P8 historical data/manifests and backtesting foundation.

Nothing is deleted solely because it is deferred.

## 13. Action-policy proposal

Headline actions:
- BUY: initiate a position only through an approved bounded candidate/watchlist/research path.
- ADD: increase an existing open holding.
- HOLD: maintain exposure under a supported policy; never a fallback for missing data.
- REDUCE: sizing/valuation/concentration/portfolio-fit reduction.
- EXIT: headline advisory action backed by detailed EXIT REVIEW / EXIT CANDIDATE semantics.
- WATCH: supported monitoring conclusion.
- BLOCKED: readiness state, not an investment opinion.

Precedence:
1. unresolved identity/method/mandatory evidence => BLOCKED;
2. explicit severe business/permanent-loss deterioration under approved Exit policy can create EXIT REVIEW/CANDIDATE;
3. portfolio concentration/sizing/valuation concerns can create REDUCE without implying thesis failure;
4. supported positive stock assessment plus portfolio capacity can create ADD;
5. HOLD only when required current evidence and context support maintaining exposure;
6. WATCH is for supported monitoring states where action prerequisites are not triggered.

Frozen holdings/owner constraints must be carried as portfolio context, not overwritten.

## 14. Minimal thesis and recommendation/decision snapshot contracts

Proposed minimal owner-thesis fields:
- thesis text or structured conditions;
- recorded_at;
- optional invalidation conditions;
- optional review date;
- owner identity;
- version/history.

Do not infer an owner's thesis. Missing thesis => THESIS_NOT_RECORDED / REVIEW_REQUIRED, not “thesis intact.”

Recommendation snapshot:
- immutable recommendation ID/version;
- security/portfolio;
- as-of timestamp;
- method/profile versions;
- input/evidence fingerprint;
- stock assessment;
- portfolio context;
- final action and reason codes;
- blocked/contradictory evidence;
- engine version.

Owner decision:
- references exact reviewed recommendation snapshot;
- owner action/decision;
- reason/note;
- decided_at;
- optional next review date;
- never overwrites the recommendation.

## 15. Maintenance/invalidation proposal

Manual and future scheduled refresh must remain cache-first and contract-driven.

Invalidate dependent outputs when accepted inputs materially change, including:
- transaction/accounting state;
- portfolio role/target/frozen settings;
- classification/profile assignment;
- mandatory fundamentals/ownership/valuation;
- accepted market history/benchmark data;
- methodology/policy version.

Provider outage behavior:
- retain last accepted evidence;
- mark stale/unavailable explicitly;
- do not manufacture fresh scores/actions;
- retries must remain bounded through existing budget/lease/usage controls.

Scheduler activation is not authorized by this proposal.

## 16. Effort ranges and dependencies

| Gate | Range | Dependencies |
|---|---|---|
| V1-2 | Small–Medium | Accounting fixtures/browser proof |
| V1-3 | Medium | 239-route census |
| V1-4 | Large | Route census; provider/evidence availability |
| V1-5 | Large | V1-4 readiness; pilot generalization |
| V1-6 | Medium | Current engine outputs; policy |
| V1-7 | Large | Fit/Sizing/Exit engines and action policy |
| V1-8 | Medium | Recommendation snapshot + owner-decision persistence |
| V1-9 | Medium–Large | Maintenance, Vercel/browser access, recovery rehearsal |

These are relative engineering ranges, not calendar commitments.

## 17. Risk register

Primary risks:
- mistaking classification for methodology readiness;
- treating evidence presence as sufficient lookback/freshness;
- turning reference-stock pilots into portfolio-wide claims;
- duplicating business logic across UI surfaces;
- recommendation/sizing dependency cycles;
- HOLD/EXIT generated from missing evidence;
- stale outputs surviving material input change;
- provider refreshes bypassing quota controls;
- loss of P8/R2 work through unnecessary rebuild;
- unproven backup/restore or deployment mismatch;
- committing owner-private holding identities to repository documentation.

## 18. Recovery/rollback requirements

Before release acceptance:
- verify exact deployed Preview SHA;
- verify live Development storage bindings;
- establish code/schema/storage compatibility;
- perform an explicitly authorized isolated restore rehearsal;
- document rollback/migration compatibility;
- prove application starts and reads expected canonical facts after recovery.

No recovery mutation is authorized by this proposal.

## 19. Owner-facing release acceptance

The owner must be able to open the same PortfolioAI application, without technical tools, and determine:
- what is owned;
- honestly qualified value;
- supported assessments and Core/Satellite suitability;
- portfolio risk/concentration;
- recommended action and why;
- missing/conflicting evidence;
- and record a different owner decision against the reviewed recommendation.

## 20. Approval boundary and exact next decisions

**Scope Freeze B is NOT READY FOR APPROVAL yet.**

Before approval, complete:
1. verified Development Preview deployment/ref/SHA;
2. authenticated browser baseline verification;
3. live R2/runtime storage verification sufficient for recovery mapping;
4. 239-equity methodology-route/readiness census;
5. measured baseline usable-intelligence count/value and remediation-cohort projection;
6. private real-security acceptance cohort with persisted scenario evidence;
7. explicit owner review of the resulting release thresholds.

After those are supplied, amend this same file to **PROPOSED / OWNER REVIEW REQUIRED**. Only explicit owner approval after that amendment may authorize V1-2–V1-9 implementation.

No application code, database migration, provider execution, scheduler activation, storage write, main/Production change, or V1 implementation is authorized by this document.


## 21. Evidence-gap closure update — 5 October 2026

**Status remains: INCOMPLETE PROPOSAL / OWNER REVIEW NOT READY.**  
**V1 IMPLEMENTATION remains NOT AUTHORIZED.**

### Closed or materially improved evidence gaps

1. **R2 target/runtime mapping:** verified read-only. `portfolioai-history-dev-api` is bound to `portfolioai-history-dev`; preserved P8 objects/manifests and hashes are present.
2. **Existing Development backup integrity:** verified from live R2 metadata plus the repository workflow contract. The 2026-10-03 encrypted backup exists with manifest, SHA file and PASS completion marker; the workflow performed upload/read-back/decrypt/SHA/`pg_restore --list` validation.
3. **Full current methodology census:** completed. 239/239 held equities have one current P7 IC1 methodology assignment across 45 profile codes.
4. **Current evidence/readiness totals:** completed. 128 INSUFFICIENT, 109 REVIEW_REQUIRED, 2 STALE, 0 READY.
5. **Current usable-intelligence baseline:** measured as **0/239 equities and INR 0 / INR 2,087,118.51 priced equity value** under the frozen minimum V1 endpoint.
6. **Private real-case availability:** measured without publishing identities. Core, ETF, bank/financial, pharma/specialized, non-financial, missing/review evidence, partial-sale and multi-broker cases exist; no owner SATELLITE role was measured and no current READY equity exists.

### Newly proven deployment blocker

Current repository HEAD `224c2889372cb1a8dbecb1f32babf03e6fee064c` maps to Vercel deployment `dpl_3ViT5naRqprmzHxwBfiRrD1LjLXW`, which is **ERROR**:
- error code: `lint_or_type_error`;
- build command: `npm run build`;
- exit code: 2.

The stable Development alias currently resolves to an older READY deployment at SHA `52fb8929bbaa3991256cb4386f4c716c137c0634`.

Therefore current HEAD cannot yet pass authenticated browser acceptance, and the older runtime must not be represented as verification of current HEAD.

### Remediation cohorts and threshold consequence

The current 239-equity denominator divides into evidence cohorts:
- 128 INSUFFICIENT / INR 761,261.55;
- 109 REVIEW_REQUIRED / INR 1,240,361.16;
- 2 STALE / INR 85,495.80.

Common downstream work affects the entire denominator: current V1 engines/actions are not portfolio-wide and no current snapshot is READY.

Therefore no honest non-zero release threshold can yet be derived solely from read-only evidence. A percentage chosen now would be arbitrary. The correct owner-facing conclusion is:

> Current usable-intelligence coverage is 0%. Before a numerical V1 release threshold is proposed, V1-4/V1-5/V1-7 remediation must establish a bounded set of securities that actually reaches the minimum endpoint; the threshold must then be derived from the measured count/value produced by those remediation cohorts.

The denominator remains 239 equities and INR 2,087,118.51 priced equity value at the dated snapshot. It must not be reduced to make the percentage look better.

### Remaining conditions before Scope Freeze B can become review-ready

1. fix or otherwise separately resolve the current Development build/deployment failure and positively verify the resulting exact SHA;
2. perform authenticated browser verification on that exact current Development deployment;
3. establish an explicitly authorized isolated live restore rehearsal, or owner-accept a documented recovery limitation if the release standard is amended;
4. after bounded V1 remediation evidence exists, derive a non-arbitrary minimum usable-intelligence release threshold;
5. finalize private acceptance fixtures for scenarios that do not currently exist as real READY holdings.

The deployment fix is application/runtime work and is **not authorized by this audit task**. The isolated restore is a mutable operation and is **not authorized**. Both require separate owner authorization.

### Revised blocker/reuse position

Current audit priorities are now:
- 23 V1 BLOCKER;
- 21 V1 IMPORTANT;
- 4 V1.1;
- 8 NO CHANGE.

The methodology-assignment census itself is no longer a blocker and should be **REUSE AS-IS**, subject to V1-3 compatibility verification. Evidence readiness remains a V1-4 blocker. Existing P8/R2 assets remain preserved and are not rebuilt.

### Gate effort refinement

- V1-2: optimistic Small; likely Small–Medium; pessimistic Medium.
- V1-3: optimistic Small; likely Medium; pessimistic Medium. The 239/239 assignment census can be reused.
- V1-4: optimistic Medium; likely Large; pessimistic Large+, driven by 128 INSUFFICIENT + 109 REVIEW_REQUIRED + 2 STALE snapshots and 9 equities below 252 daily history rows.
- V1-5: optimistic Medium; likely Large; pessimistic Large+, driven by engine generalization/missing engines.
- V1-6: optimistic Small–Medium; likely Medium; pessimistic Medium–Large.
- V1-7: optimistic Medium; likely Large; pessimistic Large+, driven by Fit/Sizing/Exit/action integration.
- V1-8: optimistic Small–Medium; likely Medium; pessimistic Medium–Large.
- V1-9: optimistic Medium; likely Medium–Large; pessimistic Large, driven by deployment/browser/recovery/invalidation proof.

External provider/evidence delays are not included in engineering effort and remain separately authorization/budget dependent.


## 22. Development build recovery reconciliation — 5 October 2026

Current capability totals are **22 V1 BLOCKER / 23 V1 IMPORTANT / 3 V1.1 / 8 NO CHANGE** across 56 capabilities. They supersede previous totals in this document.

Remote HEAD `94be7ace03f6669edcf98da18b393cd41258e12b` passes the locally reproduced TypeScript/Vite build. Exact-SHA Development Preview and authenticated browser acceptance remain NOT PROVEN; see `PortfolioAI_DEVELOPMENT_BUILD_RECOVERY_2026-10-05.md`. Status remains **INCOMPLETE PROPOSAL / OWNER REVIEW NOT READY**, and V1 implementation remains **NOT AUTHORIZED**.

The earlier statement requiring V1-4/V1-5/V1-7 remediation before proposing release coverage creates a circular approval dependency and is superseded: a review-ready proposal must describe bounded remediation cohorts, count/value estimates, prerequisites and measurable acceptance. Only after owner approval may those gates implement and measure the proposed outcomes. No arbitrary target or forecast is recorded as verified readiness.

Deferral of the isolated restore rehearsal to V1-9 requires an explicit owner decision. Baseline Freeze remains PARTIAL until its outstanding evidence is satisfied; strong backup integrity is not completed restore proof.


### Exact Preview recovery outcome

Development Preview deployment `dpl_5p9Daac7UqGSL8y6qP3dawqF1Hzx` is **READY** at Git SHA `ba8c9e9ddbc0e2658a213af178f0f8922e86639d`, branch `PortfolioAI-Development`, Preview (`target: null`). The stable Development alias resolves to that exact deployment/SHA. This closes the current-branch build/deployment failure; the preserved source at `94be7ace...` required no further application change.

Authenticated hosted browser acceptance is still NOT PROVEN. The local login screen/LOCAL marker renders without page errors but does not establish protected Preview workflow acceptance. A permitted authenticated Development session is the exact missing evidence. Scope Freeze B remains INCOMPLETE / OWNER REVIEW NOT READY until its remaining proposal/acceptance conditions are evidenced. V1 implementation is NOT AUTHORIZED.
