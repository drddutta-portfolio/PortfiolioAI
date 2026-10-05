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
