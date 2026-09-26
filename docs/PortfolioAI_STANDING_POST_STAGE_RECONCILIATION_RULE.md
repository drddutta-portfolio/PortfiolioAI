# PortfolioAI — Standing Post-Stage Reconciliation Rule

**Status:** OWNER-APPROVED GOVERNANCE RULE  
**Applies to:** `PortfolioAI-Development` and all Post-D convergence stages  
**Effective date:** 26 September 2026

## Purpose

PortfolioAI will use a standing P0-style reconciliation checkpoint after every major completed stage so that ChatGPT, Codex, GitHub, Supabase, Vercel, and the visible application remain synchronized.

The formal roadmap stage `P0 — Authority, Lineage, and Current Product-Readiness Freeze` remains a one-time roadmap stage. It is **not reopened or renumbered** after each later stage.

Instead, each completed stage is followed by a short **Post-Stage Reconciliation Checkpoint**.

## Permanent workflow

```text
Complete current stage
        ↓
Validate stage exit criteria
        ↓
Post-Stage Reconciliation Checkpoint
        ↓
Update authoritative current-state register
        ↓
Classify changed capabilities:
COMPLETE / PARTIAL / BLOCKED / DEFERRED / INTENTIONAL DIFFERENCE
        ↓
Confirm canonical authority and cross-surface consistency
        ↓
Record exact residual work
        ↓
Owner reviews and approves next stage
        ↓
Begin next stage
```

## Required reconciliation checks

After every major stage:

1. Record what actually changed.
2. Record what is now complete, partial, blocked, deferred, or intentionally different.
3. Verify that no completed capability was accidentally rebuilt or duplicated.
4. Verify that each business fact still has one canonical authority and shared access path.
5. Check whether the completed stage changed any downstream or upstream readiness.
6. Reconcile Git branch state, database state, deployment state, and visible UI state.
7. Confirm production impact explicitly.
8. Record unresolved defects and the exact next approved action.
9. Record the latest relevant commit SHA/date.
10. Do not begin the next major stage until owner approval.

## Authoritative handoff record

The living handoff remains:

`docs/PortfolioAI_Development_Status.md`

Every stage-closing reconciliation must update that file before the next stage begins.

Stage-specific manifests remain supporting evidence and must be referenced from the Development Status where applicable.

## Post-D roadmap treatment

When formal Post-D `P0` begins, it must acknowledge verified work already completed before P0 rather than rebuilding it.

In particular, pre-existing work toward P1/P2/P3 must be classified requirement-by-requirement as:

- COMPLETE
- PARTIALLY COMPLETE
- NOT STARTED
- INTENTIONAL DIFFERENCE / DEFERRED

Only residual work should be executed.

## Safety rule

A Post-Stage Reconciliation Checkpoint is an audit/governance step. By itself it does not authorize:

- production mutation;
- provider execution;
- paid AI;
- scheduler activation;
- trading;
- database migration;
- merge to `main`;
- production deployment;
- new feature scope.

Any such action remains separately gated.

## Naming convention

Recommended labels:

- `Reconciliation Checkpoint — after P0`
- `Reconciliation Checkpoint — after P1`
- `Reconciliation Checkpoint — after P2`
- …
- `Reconciliation Checkpoint — after P8`

For the Development Environment Setup project, use the same pattern, for example:

- `Reconciliation Checkpoint — after Dev Setup Stage 5`

## Owner decision

This rule was explicitly approved by the owner on 26 September 2026 and is now the default PortfolioAI workflow.
