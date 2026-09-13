# R1 / D35B — Position Sizing Engine Contract

**Status:** Reference implementation under review  
**Completion target:** ENGINE CONTRACT COMPLETE only  
**Portfolio-wide coverage:** Not claimed  
**Production migration applied:** No  
**Scheduler/automation:** None

## 1. Purpose

D35B converts already-reviewed deterministic investment evidence into a separate, reproducible position-sizing assessment.

It answers:

> Given an approved sector/research profile, sufficient deterministic research/scoring/recommendation evidence, the current portfolio weight and owner context, what sizing state/range/action can PortfolioAI support without inventing evidence or overwriting owner settings?

D35B is a downstream portfolio engine. It does not replace sector-specific research, Quality/Growth/Valuation/Risk/Recommendation engines and does not fetch provider data.

## 2. Architecture boundary

The canonical Master Blueprint requires Position Sizing to consider conviction, portfolio role, business quality, growth durability, permanent-loss risk, valuation, volatility, concentration, liquidity and portfolio fit.

The sector-research architecture further establishes that those business-quality inputs must come from an approved business/sector research profile rather than a universal stock formula.

The intended production dependency is:

```text
sector/profile research
    -> standardized deterministic investment dimensions
    -> persisted score run
    -> persisted recommendation run + reviewed weight guidance
    -> D35B position sizing assessment
```

R1 does **not** pretend all of these domains are already portfolio-wide. Instead it:

1. requires an explicit approved research profile code and version;
2. requires that profile readiness be `READY` before D35B itself can become `READY`;
3. consumes persisted deterministic score/recommendation lineage;
4. consumes validated upstream weight guidance when that guidance exists;
5. consumes the transaction/price-derived current portfolio weight;
6. treats owner position settings as human context only;
7. fails closed when required evidence is absent, pending or below policy readiness;
8. persists a separate append-only assessment when trusted orchestration is later enabled.

A supplied min/max weight range by itself is **never sufficient** to unlock a real security for D35B.

## 3. Non-negotiable separations

### Sector research is upstream, not recreated inside D35B

D35B does not calculate bank GNPA/NIM, IT deal wins, pharma regulatory quality, industrial cash conversion or any other sector-specific business metric.

Those belong to the approved research profile and upstream deterministic scoring path. D35B consumes the standardized, versioned result and retains profile lineage.

### Owner settings are not engine output

`portfolio_security_settings` remains owner-controlled. D35B must never write a generated target/min/max range into that table.

The owner target/min/max values may be compared with the deterministic engine range and surfaced as agreement/conflict reason codes, but they do not become evidence for inventing the engine range.

### Recommendation guidance is upstream evidence, not the D35B record

`stock_recommendation_runs` may contain `suggested_weight_min` / `suggested_weight_max` from the reviewed recommendation policy. D35B consumes those values with their research-profile, score and recommendation lineage and creates its own assessment.

The records remain distinct so the system can answer:

- which research profile and version applied;
- what the score/recommendation layer said;
- what current portfolio weight was used;
- what D35B concluded;
- what the owner configured separately.

### Sizing reduction is not thesis exit

D35B never emits an automatic `EXIT` action. An upstream `EXIT_CANDIDATE` is converted only to `EXIT_REVIEW` so the dedicated thesis/permanent-loss Exit logic and human decision remain separate.

## 4. Deterministic v1 inputs

The pure TypeScript reference implementation accepts:

- `portfolioId`;
- `securityId`;
- `assetClass`;
- exact-decimal `currentWeight`;
- policy `minimumScoreReadyCoverage`;
- research profile code;
- research profile version;
- research profile readiness state;
- owner portfolio role;
- owner target/min/max settings;
- owner frozen state;
- persisted recommendation run ID;
- persisted score run ID;
- upstream suggested role;
- upstream action bias;
- upstream suggested minimum/maximum weight;
- score-ready coverage;
- evidence confidence;
- recommendation transition state.

No provider call, AI output, news fetch or browser-side inference is part of the v1 calculation.

## 5. Assessment states

### `READY`

The asset is an equity; an approved research profile code/version exists and is `READY`; persisted score/recommendation lineage exists; readiness coverage passes policy; current weight and validated upstream range are present.

### `INSUFFICIENT_EVIDENCE`

The assessment has relevant upstream evidence, but the evidence is not sufficient to support a range/action. Examples include coverage below the policy minimum, missing weight guidance or missing current weight.

No target/min/max range or action is returned in this state.

### `BLOCKED_PREREQUISITE`

A required upstream prerequisite is absent, pending or not approved. Examples include:

- missing research profile code/version;
- profile state `PARTIAL`, `PROFILE_PENDING`, `BLOCKED_REVIEW` or `INSUFFICIENT_EVIDENCE`;
- no persisted recommendation run;
- no score-run lineage;
- an `INSUFFICIENT` upstream recommendation;
- `EVIDENCE_PENDING` recommendation transition.

### `NOT_APPLICABLE`

The equity position-sizing contract does not apply to the asset. R1 explicitly returns this for ETFs and other non-equity assets rather than forcing equity rules onto them.

## 6. V1 action rule

The v1 action is deliberately conservative:

- owner frozen -> `FREEZE`;
- upstream `EXIT_CANDIDATE` -> `EXIT_REVIEW`;
- current weight above engine maximum -> `REDUCE`;
- current weight below engine minimum **and** upstream bias `ACCUMULATE` -> `ADD`;
- otherwise -> `HOLD`.

The schema reserves `ADD_ON_WEAKNESS` and `TRIM_INTO_STRENGTH` for later deterministic market/timing contracts. V1 does not fabricate those states without the required timing inputs.

## 7. Suggested target calculation

When the assessment is `READY`, v1 uses the midpoint of the validated upstream minimum and maximum as the suggested target:

`target = (minimum + maximum) / 2`

Critical financial arithmetic uses `decimal.js`, not JavaScript floating point. The target is rounded to six decimal places using `ROUND_HALF_UP`, matching the database weight scale.

The midpoint is a deterministic reference target inside an already-reviewed range. It is not a replacement for the owner's configured target.

## 8. Persistence contract

The additive migration introduces `position_sizing_assessments` with:

- portfolio/security identity;
- engine version;
- `evaluation_key` idempotency fingerprint;
- assessment timestamp;
- assessment state;
- research profile code;
- research profile version;
- captured current weight;
- suggested target/min/max weights;
- recommended sizing action;
- evidence coverage/confidence;
- reason codes;
- deterministic rationale;
- canonical structured `input_snapshot`;
- source score-run lineage;
- source recommendation-run lineage;
- creation timestamp.

A `READY` persisted assessment requires non-null profile code/version and score/recommendation lineage.

Source score and recommendation foreign keys use restrictive deletion semantics so a retained READY assessment cannot silently lose its deterministic lineage through source-row deletion.

### Idempotency

Trusted orchestration must generate a stable evaluation fingerprint from the canonical deterministic input snapshot. The database uniquely constrains:

`(portfolio_id, security_id, engine_version, evaluation_key)`

A repeated evaluation of the same canonical input therefore cannot silently append duplicates.

### Append-only / security

- RLS is enabled.
- Authenticated browser users receive owner-scoped `SELECT` only.
- Authenticated browser users receive no `INSERT`, `UPDATE` or `DELETE` privilege.
- `service_role` receives `SELECT` and `INSERT` only.
- Neither authenticated browser users nor `service_role` receive `UPDATE` or `DELETE` privilege.
- No browser RPC for writing assessments is introduced in R1.

This keeps future execution in a trusted server/orchestration path and prevents historical engine output from being silently rewritten.

## 9. Reference cohort

The contract tests deliberately different cases.

### 1. HDFCBANK genuine reference

Uses `BANK / BANK_V1` research-profile lineage, the known 3–4% upstream reference guidance and adequate score coverage. The pure engine derives a 3.5% midpoint and can return `ADD` when current weight is below 3% and upstream action bias is `ACCUMULATE`.

**Important:** HDFCBANK is not hard-coded in the engine; `BANK_V1` is supplied as validated upstream context.

### 2. Unready non-bank security

A stock may have an apparently valid 2–3% range, but if its sector/research profile is `PROFILE_PENDING` or otherwise not `READY`, D35B must return `BLOCKED_PREREQUISITE` with no range/action.

This proves that supplying a range cannot bypass sector-specific research readiness.

### 3. Synthetic non-financial contract fixture

A synthetic non-financial test fixture may be marked with an explicitly READY test profile to prove the D35B software itself is not bank-coded.

This is a **software contract test only**. It is not evidence that INFY, TORNTPHARM, M&M or any other non-bank production security currently has research-backed sizing readiness.

### 4. Deliberately incomplete equity

A stock with score-ready coverage below policy returns `INSUFFICIENT_EVIDENCE`, no range and no action.

### 5. ETF

An ETF returns `NOT_APPLICABLE`, no range and no action.

## 10. Additional guard tests

The TypeScript reference tests verify:

- missing research profile code/version blocks sizing;
- non-READY sector/profile research blocks sizing even if a range is supplied;
- a synthetic READY non-financial fixture exercises the generic software path without claiming production coverage;
- missing upstream ranges do not create a default 3–4% range;
- human freeze returns `FREEZE`;
- exit candidates become `EXIT_REVIEW`, never automatic exit;
- midpoint rounding uses exact decimal arithmetic.

The SQL contract test verifies:

- required columns and score/recommendation/profile lineage fields exist;
- idempotency is uniquely constrained;
- owner-scoped RLS policy exists;
- browser writes are denied;
- service role can append but cannot rewrite/delete assessment history.

## 11. Current real-world coverage boundary

At R1, HDFCBANK remains the only genuine research-backed `READY` sizing reference case.

Until R2/R3/R4 establish portfolio coverage and approved sector/profile research contracts, other real securities should remain `BLOCKED_PREREQUISITE`, `INSUFFICIENT_EVIDENCE`, `PROFILE_PENDING` upstream, or `NOT_APPLICABLE` as appropriate.

R1 therefore proves the receiving/downstream contract. It does not manufacture missing sector research.

## 12. What R1 explicitly does not do

R1 does not:

- implement BANK_V1 research itself;
- implement the other sector research profiles;
- apply the migration to production;
- populate `position_sizing_assessments` in production;
- change `portfolio_security_settings`;
- change transactions, holdings or accounting;
- call Trendlyne, Angel One, NSE or any external provider;
- consume provider budget;
- run AI;
- schedule anything;
- claim portfolio-wide sizing coverage;
- claim all Blueprint sizing factors already have portfolio-wide evidence;
- enable automatic trading or automatic exits.

## 13. Approval gates

Before a production sizing assessment can be persisted:

1. approve/merge the sector-research architecture reference;
2. review and merge the R1 code/schema contract;
3. run TypeScript/test/lint/build checks in a full repository checkout;
4. run the migration and pgTAP test against a disposable/local Supabase environment;
5. inspect the resulting schema/RLS diff;
6. obtain explicit owner approval before applying the migration to production;
7. inspect the real pilot cohort using current stored evidence;
8. run a bounded manual dry run;
9. inspect outputs and lineage;
10. only then consider a trusted persistence/orchestration path.

Passing R1 means **ENGINE CONTRACT COMPLETE**. It does not mean PILOT COMPLETE, PORTFOLIO-WIDE COVERAGE COMPLETE or AUTOMATION COMPLETE.
