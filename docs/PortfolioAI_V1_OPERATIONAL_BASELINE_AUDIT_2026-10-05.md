# PortfolioAI V1 Operational Baseline Audit — 5 October 2026

**Repository:** drddutta-portfolio/PortfiolioAI  
**Branch:** PortfolioAI-Development  
**Pre-audit source SHA:** `a116cec4ab0939238c02a5480d283a09186b274b`  
**Verified Development backend:** PortfolioAI Dev / `lrgpjimipfkyoqbpsqzz`  
**Status:** COMPLETE FOR AVAILABLE READ-ONLY EVIDENCE / RUNTIME-BROWSER LIMITATIONS DISCLOSED  
**V1 implementation:** NOT AUTHORIZED

## 1. Audit method and evidence limits

The audit used the current Development repository, canonical/status/requirements documents, read-only Development SQL, schema/migration metadata, and connected platform metadata. It did not execute provider refreshes, migrations, schedulers, storage writes, backups/restores, or application code changes.

The Development Supabase target was positively verified. The connected Vercel context did not expose an accessible project/deployment, so authenticated browser and deployed Preview SHA verification remain uninspected rather than being inferred. Live Cloudflare/R2 runtime metadata was not independently available in this audit.

## 2. Dated inventory

- Open consolidated securities: **248**
- Equities: **239**
- ETFs: **9**
- Other open assets: **0**
- Quantity-complete holdings: **248 / 248**
- Cached latest-price coverage: **248 / 248**
- Priced market-value subtotal: **INR 2,217,451.55**
- Missing broker attribution: **46 current-holding rows**
- Current classification coverage: **239 / 239 held equities**
- Held equities with fundamental observations: **114 / 239**
- Held equities with research documents: **111 / 239**
- Held equities represented in legacy/current market-price-history storage: **239 / 239**; required lookback/benchmark sufficiency not proven by row presence alone
- Persisted stock recommendation coverage: **1 / 239**
- Persisted position-sizing assessment coverage: **0 / 239**
- Persisted `stock_score_runs` coverage: **0 / 239**

## 3. Eight user-facing surfaces

| Surface | Repository/current-data evidence | Audit state |
|---|---|---|
| Dashboard | Advanced overview/allocation/daily-move/research/intelligence/news/readiness surfaces documented and implemented; some engine cards are readiness-only | PARTIAL |
| Holdings | Ledger-derived quantities, accounting, valuation and classification requirements implemented | WORKING |
| Portfolio Structure | Roles/targets/themes/settings implemented | WORKING |
| Research | Generic cache-only workspace exists; evidence breadth and deep-engine generalization incomplete | PARTIAL |
| Intelligence | Recommendation/action/intelligence surfaces exist but portfolio-wide deterministic coverage incomplete | PARTIAL |
| Transactions | Import/correction/void/restore/provenance requirements implemented | WORKING |
| Import | Trusted import and dedup/reconciliation foundations implemented | WORKING |
| Settings | Owner settings/roles/themes exist; broader V1 thesis/decision/maintenance controls incomplete | PARTIAL |

No surface is claimed browser-verified in this audit because the authenticated Development Preview target was not positively verified.

## 4. Capability matrix — all 56 V1-1 capabilities

| # | Capability | Intended behavior | Actual evidence | State | Gap | Priority | Canonical owner / access path | Reuse disposition | Proposed fix / gate | Impact / uncertainty |
|---:|---|---|---|---|---|---|---|---|---|---|
| 1 | Authentication/RLS/security | Owner-authenticated, RLS-safe application | RLS enabled broadly; security architecture documented; authenticated browser not inspected | PARTIAL | Runtime auth flow not re-proven | V1 IMPORTANT | Auth/RLS + repositories | REUSE WITH FIX | Revalidate in V1-9 | Security uncertainty until browser proof |
| 2 | Transaction import | Deterministic trusted import | Requirements mark implemented/deployed; transaction/import structures present | WORKING | No new gap found | NO CHANGE | Transaction/import authority | REUSE AS-IS | V1-2 verification only | Browser not rechecked |
| 3 | Duplicate import handling | Idempotent dedup | Deduplication keys/import lineage present; requirements implemented | WORKING | No new gap found | NO CHANGE | Import authority | REUSE AS-IS | V1-2 fixtures | Low |
| 4 | Correction/supersession | Preserve original + audited replacement | Correction/supersession fields and requirement implemented | WORKING | No new gap found | NO CHANGE | Transaction correction RPC/service | REUSE AS-IS | V1-2 fixtures | Low |
| 5 | Void/restore | Audited non-destructive reversal | Accounting events + requirement implemented/deployed | WORKING | No new gap found | NO CHANGE | Transaction accounting service | REUSE AS-IS | V1-2 fixtures | Low |
| 6 | Holdings derivation | Transaction-derived current holdings | `current_holdings` view; 248 holdings; 248 quantity-complete | WORKING | No new gap found | NO CHANGE | Transactions/current_holdings | REUSE AS-IS | V1-2 cross-surface check | Low |
| 7 | FIFO/weighted-average fallback | Exact deterministic supported basis | Requirements register records FIFO + weighted-average fallback | WORKING | Re-run edge fixtures | V1 IMPORTANT | Accounting engine | REUSE AS-IS | V1-2 | Real-ledger edge cases remain |
| 8 | Partial sales | Correct remaining/realised basis | Accounting requirements support partial/closed histories | WORKING | Reconcile fixture | V1 IMPORTANT | Accounting engine | REUSE AS-IS | V1-2 | Browser not rechecked |
| 9 | Closed/reopened positions | Preserve historical basis, reopen correctly | Requirement implemented/deployed | WORKING | Reconcile fixture | V1 IMPORTANT | Accounting engine | REUSE AS-IS | V1-2 | Low |
| 10 | Realised P&L | Covered deterministic realised P&L | Requirement implemented/deployed | WORKING | Coverage must stay qualified | V1 IMPORTANT | Accounting repository | REUSE AS-IS | V1-2 | Current portfolio aggregate not independently recomputed here |
| 11 | Unrealised P&L | Covered deterministic unrealised P&L | Requirement implemented/deployed | WORKING | Coverage semantics verification | V1 IMPORTANT | Accounting + latest price | REUSE AS-IS | V1-2 | Same |
| 12 | Latest prices | Cached current price authority | 248/248 holdings priced | WORKING | Freshness varies | V1 IMPORTANT | `market_price_latest` | REUSE WITH FIX | V1-4 freshness policy | Oldest selected latest observation 2026-09-22 |
| 13 | Portfolio value | Qualified current value | All 248 priced; measured subtotal INR 2,217,451.55 | WORKING | Must preserve freshness/coverage labels | V1 IMPORTANT | Portfolio valuation repository | REUSE AS-IS | V1-2 | Not browser rechecked |
| 14 | Portfolio weights | Deterministic current weights | Requirements and architecture indicate operational | WORKING | Reconcile same snapshot | V1 IMPORTANT | Portfolio/accounting repository | REUSE AS-IS | V1-2 | Not independently recalculated here |
| 15 | Broker/account attribution | Correct account exposure | 46 current-holding rows report missing broker attribution | PARTIAL | Unknown attribution remains | V1 IMPORTANT | Transaction/broker authority | REUSE WITH FIX | V1-2 | Real data limitation |
| 16 | Asset classification | Equity/ETF separated | 239 equities + 9 ETFs; canonical asset class | WORKING | No new gap | NO CHANGE | Securities | REUSE AS-IS | V1-3 | Low |
| 17 | Portfolio roles | Owner-controlled Core/Satellite/etc. | Requirements implemented/deployed | WORKING | No new gap | NO CHANGE | `portfolio_security_settings` | REUSE AS-IS | V1-3 | Low |
| 18 | Themes | Owner themes independent of roles | Requirements implemented/deployed | WORKING | Value analytics richer later | V1.1 | Themes/theme_securities | REUSE AS-IS | Defer richer analytics | Low |
| 19 | Security identity | One canonical identity | Identity/reconciliation structures; 248 distinct holdings | WORKING | Revalidate ambiguous cases | V1 IMPORTANT | Security master | REUSE AS-IS | V1-3 | Low |
| 20 | Sector/industry/Basic Industry | Canonical classification | 239/239 held equities in current classification view | WORKING | Taxonomy reconciliation still important for method routing | V1 IMPORTANT | Current classification authority | REUSE WITH FIX | V1-3 | Current classification != methodology |
| 21 | Profile/methodology routing | Explicit approved route | Code/registry/pilots exist; explicit reviewed assignment rows only 4; broad route readiness not yet measured | PARTIAL | Portfolio-wide authoritative route matrix incomplete | V1 BLOCKER | Research profile router + versioned contracts | GENERALISE PILOT | V1-3 | Major dependency |
| 22 | Fundamental evidence | Required current fundamentals | 114/239 held equities have observations | PARTIAL | 125 held equities without current table coverage | V1 BLOCKER | Fundamental evidence repository | REUSE WITH FIX | V1-4 | Provider/evidence effort |
| 23 | Ownership evidence | Required ownership where applicable | Architecture/provider contracts exist; portfolio-wide readiness not measured | AUDIT_PENDING | Coverage not measured independently | V1 IMPORTANT | Research evidence repository | REUSE WITH FIX | V1-4 | Needs specific inventory |
| 24 | Valuation evidence | Required valuation inputs | Reference/pilot contracts exist; portfolio-wide readiness not measured | PARTIAL | Breadth incomplete | V1 BLOCKER | Research evidence repository | GENERALISE PILOT | V1-4/V1-5 | Method-specific |
| 25 | Research documents | Canonical document evidence | 111/239 held equities have document records | PARTIAL | 128 without document records; applicability varies | V1 IMPORTANT | research_documents | REUSE WITH FIX | V1-4 | Not every method requires same docs |
| 26 | Provenance | Source/record lineage | Fundamental/document/raw structures preserve provenance | WORKING | Verify every accepted metric path | V1 IMPORTANT | Evidence repositories | REUSE AS-IS | V1-4 | Medium |
| 27 | Freshness/conflicts/missing states | Explicit fail-closed readiness | Freshness/status/conflict structures exist | PARTIAL | Portfolio-wide current readiness matrix incomplete | V1 BLOCKER | Evidence/readiness layer | REUSE WITH FIX | V1-4 | Key release dependency |
| 28 | Current-analysis historical observations | History required for current engines | `market_price_history` has all held equities represented; exact method lookback not measured | PARTIAL | Sufficiency per route unknown | V1 BLOCKER | Market/evidence repositories | REUSE WITH FIX | V1-4 | R2 should not be inferred from legacy emptiness |
| 29 | OHLCV coverage | Sufficient adjusted history | Security presence 239/239; 252-day or route-specific sufficiency not measured | PARTIAL | Lookback/adjustment readiness unproven | V1 BLOCKER | Market history authority | REUSE WITH FIX | V1-4 | Major |
| 30 | Benchmark history/alignment | Correct benchmark/date alignment | Historical benchmark architecture exists; current V1 per-route readiness not measured | PARTIAL | Coverage/alignment incomplete | V1 BLOCKER | Benchmark authority | REUSE WITH FIX | V1-4 | Major |
| 31 | Quality/Growth | Deterministic current assessment | Reference engines/profiles exist; no portfolio-wide persisted score runs | REFERENCE/PILOT ONLY | Portfolio-wide engine coverage incomplete | V1 BLOCKER | Deterministic scoring | GENERALISE PILOT | V1-5 | Requires evidence |
| 32 | Core Selection | Deterministic eligibility | Reference scoring/recommendation architecture exists | REFERENCE/PILOT ONLY | Generalization incomplete | V1 BLOCKER | Deterministic engine | GENERALISE PILOT | V1-5/V1-6 | Requires policy acceptance |
| 33 | Core Health | Deterministic health for Core holdings | Dashboard readiness surface exists; dedicated formal engine incomplete | UI/READINESS SURFACE ONLY | Engine missing | V1 BLOCKER | Core Health engine | BUILD MISSING | V1-5/V1-7 | Preserve UI |
| 34 | Satellite Opportunity | Deterministic Satellite assessment | Reference methodology work exists | REFERENCE/PILOT ONLY | Portfolio-wide validation incomplete | V1 IMPORTANT | Deterministic scoring | GENERALISE PILOT | V1-5 | Evidence/profile dependent |
| 35 | Valuation | Deterministic valuation state | Reference/profile-specific contracts exist | REFERENCE/PILOT ONLY | Breadth incomplete | V1 BLOCKER | Valuation engine | GENERALISE PILOT | V1-5 | Method-specific |
| 36 | Momentum/Technical | Deterministic price-state assessment | Stage 7.3 reference/pilot only | REFERENCE/PILOT ONLY | Portfolio-wide valid technical engine not proven | V1 BLOCKER | Market engine | GENERALISE PILOT | V1-5 | History dependency |
| 37 | Relative Strength | Benchmark-relative state | Architecture/reference work exists | REFERENCE/PILOT ONLY | Broad benchmark-aligned execution incomplete | V1 BLOCKER | Market engine | GENERALISE PILOT | V1-5 | Benchmark dependency |
| 38 | Risk | Deterministic market/business risk | Some dashboard/readiness and reference work | PARTIAL | Formal portfolio-wide risk outputs incomplete | V1 BLOCKER | Risk engines | REUSE WITH FIX | V1-5/V1-7 | Multiple dependencies |
| 39 | Portfolio Fit | Portfolio-context assessment | Architecture planned/reference only | MISSING | Formal integrated engine not proven | V1 BLOCKER | Portfolio Fit engine | BUILD MISSING | V1-7 | Needs concentration/context |
| 40 | Position Sizing | Versioned persisted sizing assessment | Contract/schema exists; 0 persisted current assessments | REFERENCE/PILOT ONLY | Runtime portfolio coverage absent | V1 BLOCKER | position_sizing_assessments | GENERALISE PILOT | V1-5/V1-7 | Must preserve fail-closed |
| 41 | Exit Risk | Business/thesis deterioration distinct from trim | Readiness UI exists; dedicated formal engine incomplete | UI/READINESS SURFACE ONLY | Engine missing | V1 BLOCKER | Exit Risk engine | BUILD MISSING | V1-5/V1-7 | Must not infer from missing data |
| 42 | Core/Satellite eligibility | Current fit without automatic role change | Reference scoring/recommendation semantics exist | REFERENCE/PILOT ONLY | Broad eligibility engine incomplete | V1 BLOCKER | Eligibility engine | GENERALISE PILOT | V1-6 | Policy required |
| 43 | Role mismatch | Compare owner role vs system eligibility | Architecture supports distinction | PARTIAL | Portfolio-wide computed mismatch not proven | V1 IMPORTANT | Eligibility + owner settings | REUSE WITH FIX | V1-6 | Needs current eligibility |
| 44 | Temporal movement/anti-churn | Evidence-based transition only | Historical/persistence concepts exist; broad prior-observation basis incomplete | BLOCKED_BY_EVIDENCE | Insufficient longitudinal accepted observations | V1.1 | Movement engine | DEFER | V1.1 unless bounded V1 support | Not required for otherwise valid current intelligence |
| 45 | Recommendation/action engine | Persist deterministic advisory action | 1/239 persisted recommendation | REFERENCE/PILOT ONLY | Portfolio-wide coverage absent | V1 BLOCKER | Recommendation engine | GENERALISE PILOT | V1-7 | Main product gap |
| 46 | BUY/ADD/HOLD/REDUCE/EXIT/WATCH mapping | Policy-correct headline mapping | Policy specified in V1 plan; existing action vocab differs in pilots | PARTIAL | Final V1 mapping/precedence not accepted | V1 BLOCKER | Action policy | REUSE WITH FIX | Scope Freeze B + V1-7 | Avoid HOLD from missing data |
| 47 | BLOCKED/readiness semantics | BLOCKED means readiness, not opinion | Existing architecture and plans explicitly preserve fail-closed semantics | WORKING | Ensure all engines conform | V1 IMPORTANT | Readiness/action contracts | REUSE AS-IS | V1-4/V1-7 verification | Low |
| 48 | Investment thesis | Minimal owner thesis, never inferred | No accepted persisted V1 owner-thesis workflow proven | MISSING | Contract/UI/storage incomplete | V1 IMPORTANT | Owner decision/thesis authority | BUILD MISSING | V1-8 | Can be minimal |
| 49 | Recommendation snapshots/versioning | Reproducible recommendation context | Versioned recommendation structures exist | PARTIAL | Broad snapshot/decision contract incomplete | V1 IMPORTANT | Recommendation persistence | REUSE WITH FIX | V1-8 | One-stock evidence |
| 50 | Owner-decision linkage | Owner decision references reviewed recommendation | Not proven as complete workflow | MISSING | Decision persistence/UI linkage missing | V1 IMPORTANT | Owner decision authority | BUILD MISSING | V1-8 | Required acceptance behavior |
| 51 | Optional AI grounding | Explain deterministic evidence only | AI interpretation reference fields/evidence exist | REFERENCE/PILOT ONLY | Grounded portfolio-wide workflow incomplete | V1.1 | AI explanation layer | GENERALISE PILOT | V1-8 | Optional for release |
| 52 | AI-off deterministic operation | Core workflow survives AI outage | Architecture mandates this; deterministic layers exist independently | PARTIAL | End-to-end proof pending | V1 IMPORTANT | Deterministic app services | REUSE AS-IS | V1-8/V1-9 | Browser proof pending |
| 53 | Maintenance/refresh/invalidation | Refresh stale inputs and invalidate dependent outputs | Provider refresh state/control structures exist | PARTIAL | Full dependency invalidation/recompute policy incomplete | V1 BLOCKER | Refresh/orchestration layer | REUSE WITH FIX | V1-9 | Scheduler activation separate |
| 54 | Provider recovery | Retries/leases/budgets/outage safety | Provider-control plane structures and historical operation records exist | PARTIAL | Current full recovery behavior not re-proven | V1 IMPORTANT | Provider control plane | REUSE AS-IS | V1-9 | No provider calls made |
| 55 | Backup/rollback | Recover code/schema/data/storage | Existing backup workflow/history; no restore rehearsal | PARTIAL | Restoration proof missing | V1 BLOCKER | Recovery/ops | REUSE WITH FIX | V1-9 | Separate mutable approval required |
| 56 | Authenticated browser end-to-end workflow | Same app works through UI against verified Dev backend | Vercel target unavailable to connector; no authenticated browser test performed | AUDIT_PENDING | Runtime/deployment proof missing | V1 BLOCKER | Vercel Preview + app | REUSE WITH FIX | V1-9 | Critical release proof |

## 5. Gap summary

From the 56 capability rows:

- **V1 BLOCKER:** 24
- **V1 IMPORTANT:** 21
- **V1.1:** 4
- **V2:** 0 in the 56-row current-V1 register (P8 historical replay is separately preserved/deferred)
- **NO CHANGE:** 7

The blocker count is intentionally conservative. A blocker means the capability or proof is required for the owner-facing V1 acceptance and is not yet sufficiently evidenced; it does not mean the existing work is unusable.

## 6. Profile/readiness conclusion

A complete per-held-equity route/readiness census is not yet justified by the available read-only evidence because:
- explicit reviewed scoring-profile assignment rows cover only a small subset and routing is partly code/classification-derived;
- method-specific required metric/lookback contracts vary;
- benchmark/current-history sufficiency must be measured against each route;
- the audit did not run provider acquisition.

Therefore profile status is presently:
- application classification: **239 / 239 held equities covered**;
- current fundamental observation presence: **114 / 239**;
- current research-document presence: **111 / 239**;
- deterministic recommendation persistence: **1 / 239**;
- position-sizing persistence: **0 / 239**;
- full supported/partial/unsupported/unresolved methodology-route counts: **AUDIT_PENDING pending route-contract census**.

This missing route census is a Scope Freeze B readiness gap, not grounds to invent a percentage.

## 7. Acceptance cohort

Repository and Development data prove several useful cohort classes, but this audit does not invent scenario labels such as “high-quality overweight” or “deteriorating EXIT-review” without persisted evidence.

Real acceptance cohort classes selected now:
- one currently held bank/financial reference security from the existing HDFCBANK pilot path;
- one currently held pharma/specialized security from the approved PHARMA work;
- one non-financial held equity with current fundamental/document evidence;
- one held equity lacking mandatory research evidence;
- one ETF;
- one holding participating in partial-sale accounting history, if identified from transaction evidence during V1-2 fixture selection;
- one multi-broker/unknown-attribution case from the 46 missing-broker-attribution rows.

Exact security IDs/symbols for scenario-specific “overweight”, “ADD”, “EXIT-review”, “conflicting evidence” remain **not selected** because this audit did not establish those states reproducibly. They must be chosen from persisted deterministic evidence or replaced by labelled fixtures.

## 8. Usable-intelligence coverage proposal

Denominators are frozen as:
- equity count denominator: **239 open equities**;
- priced equity-value denominator: current priced value of those same 239 equities at one consistent snapshot;
- ETFs: separate accounting/status denominator; they do not inflate equity-intelligence coverage;
- unsupported/unresolved equity profiles remain in the 239 denominator.

Minimum usable intelligence requires:
1. authoritative identity and applicable approved method;
2. mandatory current evidence and required current-analysis history;
3. deterministic stock assessments;
4. current eligibility/role-fit;
5. required portfolio context including valid Fit/Sizing/Exit or legitimate method-defined not-applicable state;
6. persisted advisory action with reproducible lineage.

Missing prerequisites or generic BLOCKED states do not count in the numerator. Optional AI and unavailable temporal movement do not automatically disqualify otherwise valid current intelligence.

**Measured baseline usable-intelligence coverage is not yet numerically claimable** because the route/readiness census and integrated action coverage are incomplete. The existing one-security recommendation path proves a reference implementation, not a release percentage.

## 9. Effort by V1 gate — audit estimate

These are engineering ranges after evidence review, not delivery promises:

| Gate | Estimated effort | Main uncertainty |
|---|---|---|
| V1-2 Accounting Integrity | Small–Medium | Real ledger edge cases and browser reconciliation |
| V1-3 Identity/Classification/Routing | Medium | Full 239-equity route reconciliation |
| V1-4 Evidence/History Readiness | Large | Provider/evidence breadth and method-specific lookbacks |
| V1-5 Deterministic Engines | Large | Generalizing pilots + missing engines |
| V1-6 Eligibility/Movement | Medium | Policy finalization and longitudinal evidence |
| V1-7 Portfolio Intelligence/Actions | Large | Fit/Sizing/Exit integration and precedence |
| V1-8 Thesis/Decision/AI | Medium | Minimal persistence/UI contract |
| V1-9 Maintenance/Release | Medium–Large | Invalidation, browser proof, recovery rehearsal |

## 10. V1-1 conclusion

The audit establishes a strong reusable foundation but not a release-ready V1.

Already working/reusable: transactions/import, ledger-derived holdings, current asset/classification coverage, latest price coverage, roles/settings/themes, research storage architecture, provider controls, generic Research workspace, News, and multiple pilot/reference intelligence components.

Primary work remaining: route/readiness census, evidence breadth, method-valid current-history/benchmarks, generalization/completion of deterministic engines, Portfolio Fit/Core Health/Exit Risk, portfolio-wide sizing/recommendations, final action policy, owner decision/thesis, invalidation/maintenance, recovery proof and authenticated end-to-end release validation.
