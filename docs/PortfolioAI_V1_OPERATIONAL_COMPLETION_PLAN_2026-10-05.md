# PortfolioAI V1 Operational Completion — Development Plan

**Date:** 5 October 2026
**Target repository:** drddutta-portfolio/PortfiolioAI
**Target branch:** PortfolioAI-Development
**Status:** FINAL PROPOSED VERSIONED DEVELOPMENT PLAN / OWNER REVIEW REQUIRED
**Current Development Baseline Freeze:** REQUIRED / NOT YET EXECUTED
**Readiness:** baseline freeze + V1-1 audit after owner authorization and applicable target verification
**Scope Freeze A:** FROZEN
**Scope Freeze B:** PENDING — not created or approved by this plan
**V1 implementation:** NOT AUTHORIZED
**Main / Production:** no changes authorized

## 1. Objective and authority

Deliver the current-portfolio decision workflow:

Transactions → trusted holdings/accounting → identity and approved methodology → current evidence → deterministic stock intelligence → Core/Satellite eligibility → Core Health, Valuation, Momentum and Risk → Portfolio Fit, Position Sizing and Exit Risk → advisory action → optional grounded AI → owner decision linked to the reviewed recommendation → maintained current assessments.

This document operationalizes [Scope Freeze A](PortfolioAI_V1_V2_PRODUCT_SCOPE_FREEZE_2026-10-05.md). It does not replace that boundary or constitute Scope Freeze B. The supplied attachment is reference material for planning; its embedded execution instructions are not treated as a new authorization to perform backend work.

The [Versioned Build and Baseline Preservation Plan](PortfolioAI_VERSIONED_BUILD_AND_BASELINE_PRESERVATION_PLAN_2026-10-05.md) owns the proposed preservation policy and cumulative version sequence. This document owns the detailed ten V1 gate contracts. Both remain subordinate to Scope Freeze A and the canonical authorities. The baseline freeze is a recoverable reference point within the same PortfolioAI, not a new application or permanent parallel product branch.

Authority remains exactly as recorded in AGENTS.md:

1. PortfolioAI_Master_Blueprint.md.
2. PortfolioAI_Research_and_Intelligence_Architecture.md.
3. PortfolioAI_Single_Source_of_Truth_Architecture.md.
4. PortfolioAI_Database_Architecture.md.
5. PortfolioAI_Development_Rules.md.
6. PortfolioAI_Product_UI_and_Decision_Workflow.md.
7. PortfolioAI_Development_Status.md.
8. PortfolioAI_Requirements_Register.md.
9. Relevant stage-specific documentation.

Release plans control sequencing only. Preserve canonical accounting semantics, source ownership, requirement IDs and completed-stage history. Record conflicts explicitly before implementation.

## 2. Verified planning baseline and evidence limits

The remote Development branch was inspected at **9e037c439db1cc05d77ac99c4362dabf1000971c**. This SHA is a planning snapshot, not a statement that all of its application code is deployed.

At that snapshot:
- Scope Freeze A exists and is FROZEN.
- Development Status keeps V1 implementation unauthorized pending Scope Freeze B.
- Development Status records P8 Step 1 and Step 2 COMPLETE / PASS / CLOSED; Step 2 research feasibility is NO-GO.
- The recorded historical denominator is 121,956 pairs, with zero complete-input pairs. These are historical research results, not current V1 portfolio coverage.
- At the recorded planning snapshot, P8 expansion remained PROPOSED PAUSE / PRESERVE FOR V2 pending complete artifact reconciliation. The amended delivery policy is PRESERVED / PAUSED FOR FUTURE V2 during V1/V1.1; the full preservation inventory and recoverable baseline have NOT YET been executed. This policy does not retrospectively change any historical completion state.

The preceding environment audit established a separate PortfolioAI Dev Supabase project and Development Preview configuration, but the overall checkpoint remained NOT_PROVEN. That audit is dated evidence, not a permanently valid environment attestation.

| Planning field | Current disposition | Evidence required to finalize |
|---|---|---|
| Environment isolation | NOT_PROVEN at preceding checkpoint | Current runtime/secret/tool target evidence and closure |
| Current holdings/equities/ETFs/other assets | NOT MEASURED for this plan | Dated canonical Development inventory |
| Priced and unpriced holdings/value | NOT MEASURED | One consistent accounting/price snapshot |
| Supported methodology routes | NOT MEASURED | Current route/version/approval and input-readiness inventory |
| Real-security cohort | NOT SELECTED | Actual holdings, roles, accounting and evidence states |
| Usable-intelligence count/value thresholds | NOT PROPOSED numerically | Measured baseline and costed remediation projection |
| Effort and schedule | NOT ESTIMATED | Bounded gap inventory and dependency estimates |
| Exact V1 blocker/important counts | NOT MEASURED | Completed V1-1 gap matrix |

Do not substitute historical 249/240/9 or 239-security snapshots for a current inventory. Do not invent profile support, securities, percentages, engine completion or dates to fill this table.

## 3. Work sequence and authorization

The cumulative product sequence is CURRENT DEVELOPMENT BASELINE FREEZE → V1 → V1.1 → POST-V1.1 OWNER REVIEW → V2/P8 RESUMPTION → LATER VERSIONS. All stages extend one PortfolioAI application. V2/P8 does not resume automatically when V1.1 closes.

1. V1-0: establish this execution plan and existing requirement release overlay; after owner authorization, assemble the baseline freeze evidence package described in the umbrella plan. Capture available repository evidence first; complete recovery and runtime/data evidence only through positively verified Development targets. Baseline completion is required before V1 implementation.
2. Complete the environment-isolation checkpoint before mutable backend/provider work. Read-only repository/document inspection may precede full isolation. Live runtime/backend/browser/storage/provider-connected inspection requires positive verification of its Development target; all mutation/provider execution/scheduler/migration work requires full isolation and separate authorization. Preserve the preceding instruction that V1-1 requires separate owner authorization.
3. V1-1: perform the authorized Development baseline audit; reconcile the actual deployed application separately from remote HEAD.
4. Prepare the measured Scope Freeze B package, including acceptance thresholds, gate estimates, policy contracts and exact gaps.
5. Owner approves Scope Freeze B before V1-2–V1-9 implementation.
6. Implement the approved gates only after the baseline freeze is evidenced, reusing working capabilities and preserving deferred assets.
7. Owner accepts the Development release candidate.
8. Separate explicit authorization is required for Production deployment, migrations, provider cohorts and scheduler activation.

A Development branch is not environment isolation. Before each separately approved mutable operation, record the exact project/bucket/account target, command or function, budget where applicable, and rollback. Fail closed on an unresolved target.

This planning task makes no backend/provider calls, migrations, scheduler changes or V1 application changes.

## 4. Dependency order and engine ownership

Accounting and canonical identity precede portfolio-context calculations. Approved profiles and sufficient fundamental/market history precede stock engines. Current eligibility precedes portfolio-aware recommendation integration. Temporal movement requires prior observations, independently of current eligibility.

V1-5 validates stock engines and the contracts for downstream Portfolio Fit/Sizing/Exit intelligence. V1-7 validates their integrated portfolio-aware behavior and final action policy. They are not duplicate implementations.

Where an existing sizing contract requires a persisted stock-recommendation run, preserve that lineage. Model stock-level assessment/recommendation input and final portfolio action as distinct stages in the contract. Final action may consume sizing; sizing must not consume that same final action and create a cycle. Confirm the existing implementation and canonical authority in V1-1 before choosing integration order.

Minimal thesis semantics and snapshot contracts are designed in the Scope Freeze B proposal, before action integration. V1-8 completes their storage/UI and decision workflow; V1-7 cannot claim a thesis-based EXIT before the required thesis evidence exists.

Maintenance/invalidation contracts are designed before engine integration. V1-9 verifies the complete maintenance flow; it must not be the first time invalidation is considered.

## 5. Common completion contract

For every gate:
- Inspect → classify → fix only approved gaps → test → prove through the applicable UI → record completion.
- For each capability in V1-1 through V1-9, identify the existing baseline implementation and prove its status before choosing REUSE AS-IS, REUSE WITH FIX, GENERALISE PILOT, BUILD MISSING, or DEFER. BUILD MISSING is allowed only when no valid reusable implementation exists. Readiness-only UI may be reused as UI while its missing engine is built; it must not be discarded or represented as a completed engine.
- Later versions are cumulative upgrades of the frozen Development baseline and earlier approved versions. Do not delete, replace, duplicate or rebuild valid completed work merely because its release target is later. Retirement/replacement requires evidence of obsolescence, incorrectness, unsafety or incompatibility, preservation/migration implications and owner approval.
- Preserve transaction history, raw evidence, prior assessments/recommendations, owner decisions, methodology/profile versions, historical observations, P8 evidence/manifests and lineage. Prefer additive/backwards-compatible evolution; never solve migration problems by deleting valid data.
- Identify canonical fact owners, repository/hook access paths and financial/database/security impacts before code.
- Use one bounded gate record containing objective, inputs, fixtures, deterministic/browser/security checks, proof, allowable unresolved states, STOP conditions, effort, dependencies and uncertainty.
- Reference existing requirement IDs using Scope Freeze A section 11. Refine the overlay without changing historical statuses.
- Distinguish UI COMPLETE, ENGINE CONTRACT COMPLETE, PILOT COMPLETE, PORTFOLIO-WIDE COVERAGE COMPLETE, AUTOMATION COMPLETE and PRODUCT CAPABILITY COMPLETE.
- For application changes run the repository architecture guard, typecheck, lint, relevant financial/unit/integration tests and build. Add RLS/migration/security checks where applicable. Record any omitted check and its remaining risk.
- Document-only changes require document/link/whitespace review rather than irrelevant application tests.
- No gate may close while an unresolved condition makes an accepted financial or investment output misleading.

Proof records may be sections of the existing gate record. Avoid a new hierarchy of sub-gates unless a concrete architectural blocker requires it.

## 6. Ten delivery gates

### V1-0 — Product Boundary and Governance

**Objective:** establish one consistent Development delivery direction governed by Scope Freeze A.
**Prerequisites:** remote Development branch, attached/current scope comparison, AGENTS.md authority.
**Work:** reference the scope in the existing planning/status documents only where needed; retain requirement IDs, approved methodologies and historical completion evidence. Link this execution plan rather than introducing another roadmap.
**Baseline requirement:** use the umbrella plan's single freeze manifest and preservation matrix as V1-0/V1-1 evidence, not additional delivery sub-gates. Record exact code/deployment/data references and recovery limitations without claiming completion from a Git SHA alone.
**Acceptance:** every meaningful feature has V1/V1.1/V2/Later/Out-of-Scope placement; conflicts and pending Scope Freeze B facts are explicit.
**Checks/proof:** document reconciliation and requirement-to-gate overlay; no application/database change.
**Allowable unresolved:** measured audit outputs and Scope Freeze B approval.
**STOP:** any attempt to redefine technical authority or silently rewrite history.
**Effort/dependencies:** documentation scope can be estimated after reviewing affected files; implementation estimates remain pending V1-1.

### V1-1 — Operational Baseline Audit

**Objective:** establish what Development actually does before choosing fixes.
**Prerequisites:** separately authorized audit, verified target for each inspected surface, explicit separation of remote code and deployed runtime.
**Work:** inspect Dashboard, Holdings, Portfolio Structure, Research, Intelligence, Transactions, Import and Settings. Complete the audit coverage register in section 7.
**Acceptance:** each capability has evidence, state, gap priority, reuse decision, owner and proposed gate; inventory/profile/cohort/coverage/effort outputs are measured or explicitly unmeasurable with a reason.
**Checks/proof:** dated snapshot and prioritized gap matrix; actual authenticated browser workflow where access permits; record inaccessible paths without calling them working.
**Allowable unresolved:** evidence/profile gaps intended for remediation, with counts and effects; no fabricated baseline.
**STOP:** ambiguous environment, attempted provider execution, or assumptions represented as live observations.
**Effort/dependencies:** audit estimate and access limitations are recorded before execution. Scope Freeze B is prepared only from completed audit outputs.

### V1-2 — Portfolio Accounting Integrity

**Objective:** trust ledger-derived quantities, cost, value, P&L and weight.
**Prerequisites:** approved Scope Freeze B, isolated Development test context, existing accounting contracts.
**Fixtures:** single/multiple BUY, charges, SELL/partial sale, closed/reopened position, multi-broker, duplicate import, missing chronology, correction/supersession, void/restore, precision, relevant corporate action, ETF and unpriced holding.
**Deterministic checks:** hand reconciliation; exact-decimal/rounding policy; idempotency; FIFO when chronology supports it and existing supported average-cost fallback; zero remaining cost/quantity for closed positions; preserve raw/import evidence.
**UI checks:** same facts on Dashboard/Holdings/Transactions; disclosed accounting basis; priced subtotals and P&L coverage; realised/unrealised meanings; unrealised return is not investment performance.
**Security:** same-owner access, audited corrections, no financial mutation via presentation code.
**Proof:** fixture expectations, numerical reconciliation and cross-surface evidence.
**Allowable unresolved:** genuinely unsupported ledger/corporate-action cases shown unavailable; no misleading totals.
**STOP:** material discrepancy, guessed cost/date/broker or imported snapshot entering calculations.
**Effort:** pending audit; estimate accounting fixes separately from verification. Main uncertainty: real ledger edge cases.

### V1-3 — Identity, Classification and Methodology Routing

**Objective:** each holding has canonical identity, classification, role and explicit methodology applicability.
**Prerequisites:** reconciled inventory and existing identity/classification/setting authorities.
**Fixtures:** bank, non-financial, specialized profile, ETF, unresolved identity and ambiguous route.
**Deterministic checks:** identity uniqueness/mapping; asset class separate from role; classification separate from research profile; versioned approved routing; no unsupported fallback route.
**UI checks:** consistent symbol/sector/industry on all relevant pages; route/version/blocker drill-down; owner-controlled roles/themes.
**Security:** audited global classification corrections; owner-scoped settings/themes.
**Proof:** holding-to-route matrix and classification consistency results.
**Allowable unresolved:** explicit identity/profile/industry missing states outside minimum usable coverage; still included in inventory.
**STOP:** ambiguous identity used for accounting/scoring, duplicate authority, or automatic role mutation.
**Effort:** pending audit; estimate by route mapping and profile-contract gap. Main uncertainty: ambiguous specialized businesses.

### V1-4 — Evidence and Current-History Readiness

**Objective:** valid, provenance-bearing inputs for current methodologies.
**Prerequisites:** approved routes and metric applicability/source/history contracts.
**Fixtures:** ready, partial, stale, missing, conflicting/review-required evidence; sufficient/short OHLCV; benchmark/date mismatch; corporate-action case.
**Deterministic checks:** financial period, units, currency, consolidated/standalone scope, missing periods, mandatory metrics, source selection, freshness, history lookback, OHLCV adjustment semantics and benchmark alignment.
**UI checks:** source/time/period and conflicts visible in one Research workspace; readiness reasons accurately explain blocked downstream engines.
**Security/operations:** provider budgets, leases, usage accounting, retries and kill switch preserved; normal browsing performs no provider refresh.
**Proof:** per-profile readiness report and source lineage.
**Allowable unresolved:** truthful readiness states for all holdings, provided accepted thresholds can still be met.
**STOP:** incompatible fallback evidence, quota spending without approval, or invented observations.
**Effort:** pending audit, costed by profile and provider need; separate engineering time from evidence acquisition delay.

### V1-5 — Deterministic Investment Engines

**Objective:** approved current Quality/Growth, Core Selection/Health, Satellite Opportunity, Valuation, Momentum/Relative Strength and Risk; validated downstream Fit/Sizing/Exit contracts.
**Prerequisites:** evidence-ready accepted fixtures; versioned methods and agreed lineage.
**Fixtures:** multiple approved routes, boundaries, missing/conflicting inputs, stale evidence, ETF/non-equity not-applicable cases.
**Deterministic checks:** independently expected calculations; engine version and input fingerprint; repeated output equivalence; profile-specific units/lookback; fail-closed prerequisites; dimensions remain independently visible.
**UI checks:** authoritative engine output consumed across views; UI/readiness cards cannot impersonate computed results.
**Security:** authorized assessment persistence and immutable lineage; no target/role/transaction mutations.
**Proof:** engine input/output/version matrix and repeatability results.
**Allowable unresolved:** non-supported routes remain explicit, outside usable numerator but inside denominator.
**STOP:** DRAFT pilot promoted to official policy without approval; hidden aggregate score erases disagreement; insufficient inputs accepted.
**Effort:** pending audit; separate GENERALISE PILOT from BUILD MISSING ENGINE and estimate each actual engine gap.

### V1-6 — Core/Satellite Eligibility and Temporal Movement

**Objective:** current eligibility and role fit, with temporal claims only where supported.
**Prerequisites:** stock assessments and approved eligibility/anti-churn policy.
**Fixtures:** PASS/CONDITIONAL/FAIL/NOT_COMPUTABLE; role mismatch; healthy/weak single-quarter case; sustained improvement/deterioration; insufficient prior observations.
**Deterministic checks:** current eligibility separate from transition; persistence/hysteresis and prior-observation requirements; hard deterioration handled only by approved exceptions.
**UI checks:** explicit current role, eligibility, mismatch and TRANSITION_NOT_ASSESSABLE; movement recommendations do not alter owner role.
**Security:** owner decision and role changes are distinct audited operations.
**Proof:** state-transition fixture results and matched UI evidence.
**Allowable unresolved:** temporal movement unavailable while current eligibility remains usable where approved.
**STOP:** promotion/demotion inferred from isolated data or price weakness alone.
**Effort:** pending audit; main uncertainty is persisted observation breadth.

### V1-7 — Portfolio Intelligence and Action Integration

**Objective:** canonical portfolio context, Fit/Sizing/Exit integration and advisory actions.
**Prerequisites:** V1-2–V1-6 applicable outputs, approved action contract, sizing lineage and recorded thesis where used.
**Fixtures:** high-quality overweight; underweight ADD candidate; extreme valuation; concentration constraint; frozen holding; deteriorating EXIT-review; missing portfolio context; owned/unowned candidate.
**Deterministic checks:** context snapshot consistency; qualified concentration; target versus suggested range remains distinct; REDUCE versus EXIT; no recommendation/sizing dependency cycle; section 10 precedence.
**UI checks:** action, reasons, contraindications and readiness drill-down agree across Holdings/Intelligence/Dashboard.
**Security:** advisory outputs cannot place orders or write owner settings.
**Proof:** complete action-policy fixture matrix with lineage and portfolio sensitivity.
**Allowable unresolved:** explicit blocked action where required context is incomplete; held-security coverage cannot rely only on those blocked cases.
**STOP:** missing evidence converted to HOLD/EXIT, circular calculation, fabricated concentration or settings overwrite.
**Effort:** pending audit; portfolio-context and final-action integration estimated separately from engine contracts.

### V1-8 — Minimal Thesis, Grounded AI and Owner Decisions

**Objective:** separate owner thesis/decision from versioned system recommendation and optional explanation.
**Prerequisites:** section 11 contract, immutable recommendation identity and approved AI boundary.
**Fixtures:** recorded/missing thesis; validated invalidation condition; owner HOLD against system ADD; newer recommendation after an older decision; AI-off/outage; conflicting evidence.
**Deterministic checks:** decision references exact reviewed recommendation; old context reproducible; thesis evaluation uses recorded conditions; AI cannot alter score/action.
**UI checks:** record reasons/date/review date; inspect prior decision/recommendation; source-grounded explanations with contradictions; deterministic workflow remains available when AI fails.
**Security:** owner-only thesis/decision writes, input/document prompt-injection boundaries, no AI write tools for holdings/roles/orders; AI requests remain budgeted.
**Proof:** decision lineage, access-control and AI-off workflow evidence.
**Allowable unresolved:** optional AI disabled/unavailable, or thesis absent with explicit non-assessable status.
**STOP:** inferred owner thesis, overwritten historical recommendation or AI substitution for calculations.
**Effort:** pending audit; estimate persistence, decision UI and AI grounding independently.

### V1-9 — Maintenance, Unified UI and Release Candidate

**Objective:** one operational Development application that remains correct after input changes.
**Prerequisites:** accepted engine/action/decision contracts, maintenance proposal, coverage threshold approval and current environment revalidation.
**Fixtures:** transaction/settings/role change; new fundamentals/results/prices/OHLCV/news; corrected evidence; method-version change; outage/retry; backup restore; authenticated browser flow.
**Deterministic checks:** invalidation/recalculation dependencies; idempotency; no stale action presented as current; coverage numerator/denominator reconciliation; unchanged cache-only browsing.
**UI checks:** full accepted cohort through existing navigation, explicit empty/loading/stale/error states, no duplicate shell/workspace; verified Development frontend → backend → persisted facts.
**Security:** ownership/RLS, browser/service-role boundary and secrets review.
**Operations:** confirmed backup, tested isolated restore, backwards-compatible migration/rollback manifest, failure recovery; schedules/providers activated only by separate approval.
**Proof:** release-candidate acceptance record with known limitations, checks and recovery results.
**Allowable unresolved:** agreed out-of-cohort profile/evidence limitations and optional enrichments; no blocker affecting financial integrity or agreed usable coverage.
**STOP:** unresolved security/accounting blocker, failed recovery, coverage below approved threshold or Production mutation.
**Effort:** pending audit; estimate integration/recovery validation and remediation contingency separately. Release date is not committed until Scope Freeze B.

## 7. V1-1 audit coverage register

Each numbered capability below requires its own matrix row. Use these states exactly:
WORKING / PARTIAL / UI/READINESS SURFACE ONLY / REFERENCE/PILOT ONLY / BROKEN / MISSING / BLOCKED_BY_EVIDENCE / NOT_APPLICABLE.

Gap priority: V1 BLOCKER / V1 IMPORTANT / V1.1 / V2 / NO CHANGE.

Required row fields: capability, intended behavior, actual code/runtime evidence, verification timestamp/ref, state, gap, priority, canonical owner/access path, reuse decision, proposed fix/gate, database/provider impact and uncertainty. An uninspected capability remains AUDIT_PENDING in the collection process; do not force it into WORKING or MISSING.

1. Authentication/RLS/security
2. Transaction import
3. Duplicate import handling
4. Correction/supersession
5. Void/restore
6. Holdings derivation
7. FIFO/weighted-average fallback
8. Partial sales
9. Closed/reopened positions
10. Realised P&L
11. Unrealised P&L
12. Latest prices
13. Portfolio value
14. Portfolio weights
15. Broker/account attribution
16. Asset classification
17. Portfolio roles
18. Themes
19. Security identity
20. Sector/industry/Basic Industry
21. Profile/methodology routing
22. Fundamental evidence
23. Ownership evidence
24. Valuation evidence
25. Research documents
26. Provenance
27. Freshness/conflicts/missing states
28. Current-analysis historical observations
29. OHLCV coverage
30. Benchmark history/alignment
31. Quality/Growth
32. Core Selection
33. Core Health
34. Satellite Opportunity
35. Valuation
36. Momentum/Technical
37. Relative Strength
38. Risk
39. Portfolio Fit
40. Position Sizing
41. Exit Risk
42. Core/Satellite eligibility
43. Role mismatch
44. Temporal movement/anti-churn
45. Recommendation/action engine
46. BUY/ADD/HOLD/REDUCE/EXIT/WATCH mapping
47. BLOCKED/readiness semantics
48. Investment thesis
49. Recommendation snapshots/versioning
50. Owner-decision linkage
51. Optional AI grounding
52. AI-off deterministic operation
53. Maintenance/refresh/invalidation
54. Provider recovery
55. Backup/rollback
56. Authenticated browser end-to-end workflow

Record surface coverage separately for the eight existing navigation areas. Distinguish repository capability, persisted Development data, deployment reachability and browser behavior.

## 8. Inventory, profile readiness and real-security cohort

Freeze one dated canonical snapshot for open holdings, asset classes, quantities, prices, weights and accounting coverage. Record priced subtotal as a subtotal; total market value is unavailable if unpriced holdings prevent a supported total. Include acquisition/remaining-cost/P&L coverage and unknown attribution.

For each held equity profile record ID/version, approval state, held count, priced value represented, required metrics/periods/lookback, fundamental and market readiness, engine/action readiness and blockers. Classification does not establish method approval. A profile can be approved while a specific security remains unready.

Select actual securities spanning:
- supported Core and Satellite;
- role mismatch;
- high-quality overweight and underweight ADD candidate;
- deteriorating/EXIT-review;
- missing and conflicting evidence;
- bank/financial, non-financial and pharma/specialized route;
- ETF;
- partial-sale and multi-broker accounting.

A security may cover several scenarios. Record canonical security ID, selection evidence and why it is included. If a real scenario is absent, document the absence and add a labelled deterministic fixture; do not falsely describe a real holding. Do not claim supported examples before measuring them.

## 9. Usable-intelligence coverage proposal

**Status coverage:** 100% of the frozen open-holding inventory must have explicit applicable/readiness statuses.

**Proposed equity count denominator:** all open equity securities in the frozen inventory, including unsupported and unresolved profiles. Count consolidated securities once, not broker lots.

**Proposed equity value denominator:** authoritative priced equity market-value subtotal at the same snapshot. Report it as priced-equity coverage, with unpriced equity identities/count and their unknown value separately. Never infer complete total-value coverage from a partial subtotal. Define a separate price-coverage acceptance condition in Scope Freeze B.

ETFs/non-equities remain in integrity and accounting acceptance with explicit NOT_APPLICABLE equity outputs, but have a separately disclosed accounting/status measure. They do not inflate equity intelligence coverage.

**Proposed minimum usable endpoint:** approved applicable stock assessments and eligibility, required valuation/market/risk context, valid portfolio Fit/Sizing/Exit assessment or legitimate method-defined not-applicable state, and persisted advisory action with reproducible evidence/portfolio lineage. Missing mandatory inputs, unsupported profiles and generic BLOCKED states do not count. Optional AI, owner choice to record a decision, and unavailable temporal movement do not determine the numerator.

Formulas:
- count coverage = usable open equities / all open equities;
- priced-value coverage = priced value of usable equities / priced equity subtotal;
- separately report usable unpriced securities, priced count coverage and all-asset integrity coverage.

Scope Freeze B must confirm method-specific applicability and endpoint details. Numerical thresholds are pending measured baseline and remediation.

For each proposed remediation cohort show baseline numerator, incremental securities/value expected to become usable, prerequisites, evidence cost/limits, effort and residual unsupported population. Propose thresholds from that achievable result and profile diversity, then obtain owner approval. If meaningful coverage is not achievable, report that outcome rather than lower standards silently.

## 10. Action-policy proposal for Scope Freeze B

No policy is activated by this plan. Numerical thresholds and method-specific rules must come from approved canonical contracts.

| Action | Proposed meaning and minimum condition |
|---|---|
| BUY | Initiate an unowned candidate after approved attractiveness, risk, portfolio-fit and sizing prerequisites pass. A zero open quantity defines unowned; prior closed history remains auditable. |
| ADD | Increase an existing open holding after the same applicable increase prerequisites and portfolio constraints pass. |
| HOLD | Maintain exposure when the approved policy supports maintenance; never a default for missing evidence. |
| REDUCE | Lower exposure for supported sizing, valuation, concentration or portfolio-fit reasons; keep thesis deterioration distinct. |
| EXIT | Headline advisory action; detailed state EXIT REVIEW / EXIT CANDIDATE, supported by approved deterioration/permanent-loss or recorded thesis-invalidation rules. Never automatic execution. |
| WATCH | Evidence is sufficient for an approved monitoring conclusion but action conditions are not met. |
| BLOCKED | Separate readiness state with reason codes; not an investment opinion. |

Proposed decision order:
1. Establish action-specific prerequisites and one consistent evaluation snapshot. Missing required inputs blocks that action; retain independently valid diagnostics.
2. Evaluate approved hard deterioration/EXIT rules. Do not convert valuation, weakness or concentration alone into a thesis-break EXIT.
3. Evaluate supported exposure-reduction constraints. Above-range exposure can support REDUCE when its own prerequisites pass, without pretending missing stock research is a negative assessment.
4. Apply owner-frozen restrictions to increases. A freeze blocks BUY/ADD and does not suppress a valid risk alert; owner remains final authority.
5. Consider BUY/ADD only when eligible, valuation/timing rules permit it and portfolio constraints pass.
6. Emit HOLD/WATCH only if their own policy requirements pass; otherwise show assessment unavailable plus readiness blocker.

Preserve disagreement and supporting/contradicting dimensions. Missing portfolio context prevents a portfolio-aware action where that context is required. EXIT_CANDIDATE maps to headline EXIT only under the approved mapping and visible wording “Advisory exit review”; it is not an instruction to execute immediately.

V1 BUY applies only to an approved bounded candidate/watchlist/research path. A bounded unowned fixture may verify the policy but does not establish a working discovery capability. BUY does not authorize market-wide discovery; broader discovery remains V1.1/Later unless already working and retained.

## 11. Minimal thesis and decision contract

Option A is retained. Record owner-authored why owned, role, drivers, risks, invalidation conditions, optional note and review date. Reference canonical role rather than introducing a second mutable role authority; retain role-at-recording for historical context if needed.

Each invalidation condition must specify what evidence is required and how it is assessed. Free-text conditions without an approved deterministic interpretation remain owner-review items.

- THESIS_INTACT: recorded, evaluable conditions have adequate current evidence and none is met; describe only the tested scope.
- POTENTIAL_THESIS_INVALIDATION: an approved evaluable condition is met, citing condition/evidence/version; owner review required.
- THESIS_REVIEW_REQUIRED: missing/stale/conflicting condition evidence, materially changed context, due review or an unevaluable condition.
- NO_RECORDED_THESIS: do not infer owner intent; approved generic deterioration rules may still produce Exit Risk independently.

Recommendation snapshots retain ID, evaluation time, engine/profile/policy versions, input references/fingerprint, portfolio-context reference, action/readiness and rationale. Owner decisions reference exactly the reviewed snapshot and remain distinct from transactions. New evidence creates a new assessment; it does not rewrite a past owner decision.

## 12. Maintenance and invalidation proposal

Manual provider refresh is the proposed V1 default until a separately approved scheduler contract exists. Retain existing working scheduled capabilities only after audit; do not disable or activate them through planning.

| Domain | Refresh / freshness proposal | Invalidation and failure behavior |
|---|---|---|
| Transactions/accounting | Recompute from effective ledger on accepted changes; no provider refresh | BUY/SELL/import/correction/void/restore invalidates holdings, weights, fit/sizing/action; failed recomputation shows explicit unavailable/currentness state |
| Roles/settings/themes | Reassess impacted portfolio context after owner changes | Target/role/freeze/theme changes invalidate applicable fit/sizing/action and role compatibility |
| Prices | Existing authoritative cache; bounded manual refresh unless approved schedule already operates | New price/as-of state invalidates value, weights, valuation/timing and portfolio-aware outputs; retain last good cache with timestamp |
| Fundamentals/ownership/documents | Controlled manual refresh under provider budget | New periods/results/corrections/conflicts invalidate dependent metrics/engines; preserve raw evidence |
| OHLCV/benchmarks | Incremental authoritative acquisition when separately approved | New session/action correction/alignment failure invalidates momentum/relative strength/risk |
| News/material evidence | Retain approved cached ingestion; explicit impact selection | Reassess only engines whose approved inputs depend on validated material evidence; news alone cannot silently replace fundamentals |
| Profile/methodology | Reviewed version publication | Changed route/version invalidates dependent results; old versions/snapshots remain reproducible |
| AI | On demand, context-version cached | Stale context invalidates narrative; outage never invalidates deterministic availability |
| Decisions | Owner-triggered recording | New recommendation does not mutate older decision; surface changed context/review due |

Exact freshness ages come from existing source/profile contracts; where absent, propose them by data type and obtain approval in Scope Freeze B. Never invent a universal freshness age.

Provider failures preserve previous evidence with honest stale status. Bounded retries obey existing lease, idempotency, usage accounting and kill switch. An output is current only if its dependency versions and snapshot satisfy policy.

## 13. Reuse versus build

These are planning defaults, not current verified completion classifications.

| Capability | Proposed disposition | Audit requirement |
|---|---|---|
| Ledger/import/accounting/holdings | REUSE AS-IS or REUSE WITH FIX | Prove current edge cases and UI consistency |
| Portfolio settings/roles/themes | REUSE AS-IS | Confirm canonical ownership and audit boundaries |
| Prices/classification/shared repositories | REUSE AS-IS or REUSE WITH FIX | Current authority, coverage and cache semantics |
| Provider controls/coverage registry | REUSE WITH FIX if a measured gap exists | Budget, readiness and access paths |
| Research workspace | REUSE WITH FIX / GENERALISE PILOT | Remove only proven pilot-specific limitations |
| Stage 8 schemas/reference scoring/action | GENERALISE PILOT | Preserve lineage; approve profile/policy before official use |
| Core Health/readiness cards | REUSE UI; BUILD MISSING ENGINE only if absent | Do not confuse a card with a formal engine |
| Sizing UI/engine contract | REUSE WITH FIX / GENERALISE PILOT | Verify migration/persistence and prerequisites |
| Portfolio Fit/Exit/Risk | REUSE if present; BUILD MISSING ENGINE if absent | Actual versioned runtime/persistence evidence |
| AI interpretation | REUSE WITH FIX / GENERALISE PILOT | Grounding, optionality and snapshot scope |
| Thesis/owner decisions | REUSE if present; BUILD MISSING capability if absent | Existing schema/UI and required linkage |
| NSE News | REUSE AS-IS within approved scope | Cache/scheduler target and operational evidence |
| P8/R2 infrastructure | Preserve; reuse applicable current-history access only | No historical expansion or duplicate storage architecture |

The audit assigns one final disposition per concrete gap: REUSE AS-IS / REUSE WITH FIX / GENERALISE PILOT / BUILD MISSING ENGINE / DEFER.

## 14. Scope placement and documentation

V1 retains all functions in section 1, subject to truthful applicability and evidence. Working features remain available even if new expansion belongs later.

V1.1: richer target/stop alerts, Calendar, Why Stocks Moved, thematic intelligence, credit/consensus/revisions, discovery/screeners/re-entry/replacement and broader notifications.

V2/P8: point-in-time identity/evidence/taxonomy reconstruction, historical routing/scoring/eligibility/action/portfolio replay, benchmark TRI/alpha/hit-rate evaluation, bias controls, walk-forward testing and historical calibration.

P8 is PRESERVED / PAUSED FOR FUTURE V2 during V1/V1.1. Preserve its code/data/docs and valid completed work. Historical-feasibility blockers do not become V1 blockers merely because P8 is incomplete. A preserved component may be reused for a genuine current-analysis dependency; this does not authorize historical campaign expansion or relax provider/migration approvals. Future V2 resumes from preserved assets after the mandatory post-V1.1 owner review.

Later: advanced cross-asset/tax/scenario optimization and commercial capability. Ungrounded LLM calls, silent financial mutations and autonomous trading remain outside normal scope.

After authorized audit, reconcile Development Status, Requirements Register and Integration/Execution Plan first. Amend Blueprint, Product/UI and Research architecture only if a specific release reference or approved contract clarification requires it. Keep Database, SSOT and Sector semantics intact.

Exact blocker and important lists remain V1-1 outputs. Planning prerequisites must not be counted as an invented application blocker inventory.

## 15. Effort estimation and risks

For every gate, Scope Freeze B records:
- bounded fixes and proof tasks;
- reuse versus new-engine work;
- optimistic/likely/pessimistic engineering effort;
- evidence acquisition/access delay;
- dependencies and parallelizable work;
- uncertainty and contingency;
- earliest start after prerequisites, without an invented release deadline.

Total schedule follows dependency order rather than summing every task blindly. No percentages or day estimates are committed by this pre-audit plan.

| Risk | Effect | Required mitigation / stop |
|---|---|---|
| Environment/credential crossover | Production mutation or shared provider spending | Resolve explicit target/secret/account evidence before mutable work |
| Remote HEAD differs from deployed Preview | False operational claims | Record both refs and test the intended build before acceptance |
| Narrow approved-profile breadth | Truthful but unusable product | Measured count/value/profile threshold and costed remediation |
| Missing multi-period evidence | Unsupported current intelligence | Preserve lookback requirements; block affected engines |
| Pilot/readiness mistaken for completed engine | Fabricated capability | Contract/persistence/UI proof distinctions |
| Recommendation/sizing dependency cycle | Inconsistent action | Separate stock assessment input and final portfolio action |
| Coverage excludes difficult holdings | Inflated release readiness | Frozen denominators and explicit price coverage |
| Stale recommendation/AI context | Misleading decision | Versioned dependency invalidation and visible timestamps |
| Scope expansion | Unbounded delivery | Scope-change rule and approved gate contracts |
| Recovery untested | Unsafe release candidate | Isolated restore rehearsal and rollback manifest |

## 16. Recovery and release-candidate acceptance

**Owner-facing business acceptance:** without technical tools, the owner can open PortfolioAI, see what is owned and its honestly qualified value, understand supported assessments and Core/Satellite suitability, identify portfolio risk/concentration, see the advisory action and why, inspect missing/conflicting evidence, and record a different owner decision against the reviewed recommendation. Test this workflow in the existing UI on the accepted real-security cohort.

Before owner acceptance:
- all eight surfaces use the same canonical facts;
- accounting and security blockers are closed;
- the actual real-security cohort and approved count/value/price coverage contracts pass;
- every holding has explicit integrity/readiness/applicability status;
- recommendations reproduce from their recorded input/context/version references;
- owner decisions retain reviewed snapshots;
- AI-off and provider-outage paths remain usable;
- maintenance/invalidation passes real input-change scenarios;
- approved checks and authenticated Development browser flow pass;
- environment isolation is current, backups are confirmed and isolated recovery is demonstrated;
- migrations/deployment order, compatibility and rollback are documented;
- remaining limitations and provider costs are accepted.

Prefer additive migrations and application rollback compatible with existing schema. Never roll back by deleting transaction/evidence/decision history. Restore exercises use an isolated disposable target and their own explicit authorization.

Passing these checks establishes implementation correctness, not historical investment effectiveness.

## 17. Scope Freeze B handoff and stop

The future measured Scope Freeze B package must contain:
1. environment statement and Development/P8 baseline;
2. dated inventory;
3. supported/unsupported routes/versions;
4. actual cohort;
5. coverage definitions, measured baseline and proposed thresholds;
6. finalized V1-2–V1-9 gate contracts;
7. action, thesis and snapshot contracts;
8. maintenance/invalidation policy;
9. reuse/build matrix and exact blocker/important lists;
10. V1.1/V2 placement;
11. effort/dependencies/risks;
12. recovery/release criteria and Production boundary.

Set it PROPOSED / OWNER REVIEW REQUIRED until approval. This document does not create or approve that package.

After Scope Freeze B, new V1 work must be necessary for financial correctness, security/data integrity, an approved workflow, prevention of misleading investment results, or the agreed usable-coverage threshold. Otherwise assign V1.1/V2/Later.

Immediate next step: owner authorizes baseline-freeze evidence assembly and V1-1 inspection. Start with read-only repository/document references, resolve remaining environment evidence before live inspection, complete the recoverable baseline package, and then prepare measured Scope Freeze B. Do not start V1 implementation or resume major V2/P8 work from this plan.

## 18. Document verification

This plan was checked against the attached Scope Freeze A and the current remote Scope Freeze A, AGENTS.md and Development Status. No live portfolio inventory or application acceptance audit was performed in this planning task. Document structure, whitespace and absence of credential literals are checked locally. No canonical domain semantics, runtime configuration, database schema or provider state is changed.
