# PortfolioAI — Post-D P3 Acceptance Dataset & Current-State Register

**Stage:** P3 — Acceptance Dataset & Current-State Register  
**Status:** COMPLETE / PASS / CLOSED — OWNER CHECKPOINT 4 APPROVED  
**Branch:** `PortfolioAI-Development`  
**Date:** 26 September 2026  
**P2 prerequisite:** COMPLETE / PASS / CLOSED  
**Production impact:** NONE

## 1. Residual-only decision

P3 reuses Stage 5 rather than recopying the Development dataset.

Already accepted:
- production-equivalent Development business/application data is operational;
- the Stage 5 manifest records row counts, ownership remap, provenance, canonical resolution and known gaps;
- the Post-D Current Capability Readiness Register is the present-tense current-state register.

P3 therefore implements only the three residual requirements frozen by P0.

## 2. Deterministic regression fixture separation

The local regression fixture is permanently identified as:

- portfolio ID: `10000000-0000-4000-8000-000000000001`;
- name: `LOCAL UI Research Review`;
- expected open holdings: 6;
- environment: LOCAL ONLY.

The Development acceptance portfolio is:

- portfolio ID: `6193a4aa-3235-4057-bddc-209fcf443fc2`;
- name: `Consolidated Portfolio`;
- current transaction rows: 496;
- environment: Development Supabase `lrgpjimipfkyoqbpsqzz`.

A P3 read-only Development query verified that the local fixture portfolio ID has **0 rows** in Development.

The repository now contains `scripts/p3-verify-dataset-boundary.mjs`, which fails closed when a supplied inventory violates the local-fixture or Development-acceptance identity contract.

This preserves two distinct test classes:
- small deterministic local regression/adversarial fixture;
- production-equivalent Development acceptance dataset.

## 3. Sanitization and licensing treatment

Machine-readable policy:
`docs/p3/PortfolioAI_P3_ACCEPTANCE_DATA_POLICY_V1.json`

The policy freezes field/data-family treatment including:
- Development ownership-ID remap;
- exclusion of Auth credentials/sessions/MFA material;
- exclusion of Vault/provider/scheduler/AI secrets;
- private-only copying of owner portfolio/accounting facts;
- minimum required broker/source metadata;
- internal-audit-only treatment of immutable provider raw evidence;
- private-cache-only market data treatment;
- source-rights boundary for news/research documents;
- no redistribution/publication right inferred from private copying.

P3 does not claim that a provider subscription confers broader redistribution rights.

## 4. Repeatable refresh/rebuild procedure

Permanent procedure:
`docs/p3/PortfolioAI_P3_ACCEPTANCE_DATA_REFRESH_PROCEDURE.md`

Deterministic planning tool:
`scripts/p3-acceptance-refresh-plan.mjs`

The planner rejects:
- a source other than the approved Production project;
- Production access not marked read-only;
- a target other than the approved Development project;
- Production as target;
- a Development target containing the local fixture portfolio.

The generated procedure keeps Production read-only, Development as the only hosted write target, and all providers/schedulers/paid-AI/trading inactive.

No refresh was executed in P3 because the Stage 5 acceptance dataset already satisfies the current acceptance requirement.

## 5. Current-state reconciliation

P3 does not change business authorities or maturity claims in the P0 readiness register.

The Stage 5 known limitations remain truthful:
- four current holdings lack copied current-price coverage;
- three non-ETF open holdings lack reviewed classification;
- most holdings have no owner-assigned role because Production has no corresponding owner setting;
- score coverage remains sparse/zero where recorded;
- recommendation coverage remains narrow.

These are current-state data/readiness facts, not P3 defects.

## 6. P3 exit criteria

| Criterion | Result |
|---|---|
| Existing Stage 5 acceptance dataset reused | PASS |
| Current-state register reused | PASS |
| Local six-holding regression fixture permanently identified | PASS |
| Local fixture distinct from Development acceptance portfolio | PASS |
| Local fixture absent as a portfolio from Development | PASS |
| Reproducible boundary validator added | PASS |
| Field-level sanitization treatment documented | PASS |
| Licensing/redistribution boundary documented | PASS |
| Repeatable refresh/rebuild procedure established | PASS |
| Refresh planner fails closed on Production target/crossover | PASS |
| Data recopy performed merely for P3 | NO |
| Production mutation | NONE |
| Migration | NONE |
| Provider execution | NONE |
| Scheduler activation | NONE |
| Paid AI | NONE |
| Trading | NONE |

## 7. UI impact

**No visible application UI change is introduced by P3.**

P3 changes repository governance, validation tooling and data-handling procedure only. The existing Development UI and Stage 5 acceptance data remain unchanged.

## 8. Closure candidate

```text
P3 implementation = COMPLETE
P3 exit criteria = PASS
Acceptance dataset rebuild = NOT REQUIRED
Owner Checkpoint 4 = APPROVED
P3 formal closure = COMPLETE / PASS / CLOSED
P4 = AUTHORIZED / NOT STARTED (planning/bounded-cohort preparation only)
Owner Checkpoint 4A = REQUIRED BEFORE PROVIDER-BACKED COHORT EXECUTION
```


## 9. Owner Checkpoint 4 approval — 26 September 2026

The owner explicitly approved the P3 closure package after the exact-head closure-candidate deployment completed successfully.

P3 is therefore **COMPLETE / PASS / CLOSED**.

**P4 — Existing Evidence & Market-Data Rollout is AUTHORIZED / NOT STARTED** for read-only planning, readiness reconciliation, provider-cost estimation and bounded-cohort proposal only.

Per the canonical Post-D roadmap:
- Owner Checkpoint 4A is required before any provider-backed bounded cohort execution.
- Owner Checkpoint 4B is required before portfolio-wide Development rollout.

No visible UI change is introduced by this formal closure.
