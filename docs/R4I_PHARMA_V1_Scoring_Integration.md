# R4I — PHARMA_V1 Scoring Integration

Status: **REPOSITORY IMPLEMENTATION / PRODUCTION MIGRATION NOT APPLIED**

## Purpose

R4I connects the PHARMA_V1 research methodology to the same Research scoring surface used by the validated HDFCBANK reference pathway.

The problem being corrected is architectural: a security could display the reviewed legacy `PHARMA_HEALTHCARE` scoring profile while the scoring repository silently evaluated the `GENERAL` metric-rule set. That made the Research scorecard numbers unrelated to the newer PHARMA_V1 evidence/history contract.

## Canonical flow

```text
canonical application classification
  → Pharma methodology routing
  → PHARMA_V1 scoring contract
  → canonical fundamental observations
  → deterministic evidence/readiness evaluation
  → SecurityScoringSnapshot
  → ResearchScorecardPanel
  → later recommendation / position sizing only after readiness gates
```

This is intentionally analogous to the HDFCBANK pathway:

```text
canonical evidence → BANK_NBFC rules → deterministic snapshot → Research UI
```

## Legacy assignment compatibility

Existing reviewed `PHARMA_HEALTHCARE` assignments are not rewritten in R4I repository code. When canonical application classification identifies a pharmaceutical business, that legacy assignment is treated as an alias for `PHARMA_V1` methodology.

A newly added holding with canonical sector `Pharma` or canonical industry `Pharmaceuticals` automatically enters the PHARMA_V1 scoring pathway even without a manual scoring assignment.

Generic Healthcare businesses are not automatically routed to PHARMA_V1.

## PHARMA_V1 scoring contract

The additive migration `20260914143000_add_pharma_v1_scoring_contract.sql` registers:

- `PHARMA_V1` as a scoring profile;
- the existing common PortfolioAI scorecard dimensions under that profile;
- Pharma-specific metric-rule inputs aligned to the PHARMA_V1 research contract.

No final numeric Pharma score curves are invented in R4I. History contracts with proven canonical semantics may contribute **evidence coverage**. They remain **score-unready** until an explicit later migration approves normalization curves.

Unresolved domains remain `PENDING_SOURCE`, including valuation context, ownership/governance event overlay, regulatory-site evidence, and portfolio-wide market-history-derived momentum/risk inputs.

## Partial evidence behavior

R4I distinguishes evidence presence from score readiness.

Examples:

- five matched quarterly operating-margin periods against the PHARMA_V1 minimum of eight contribute partial evidence but do not become score-ready;
- one annual operating-revenue point against the minimum of three is partial only;
- five CFO years alone cannot satisfy cash conversion because matched PAT and FCF/capex evidence are also required;
- stale or conflicting observations do not contribute.

Therefore a stock may have substantial canonical stored history while still showing no numeric PHARMA_V1 score. That is correct fail-closed behavior.

## UI behavior

`useSecurityScoring()` becomes the single application entry point. For a Pharma scoring context it loads the PHARMA_V1 snapshot; otherwise the existing HDFCBANK/general scoring repository path remains unchanged.

`ResearchScorecardPanel` continues to consume one `SecurityScoringSnapshot`. The dedicated Pharma history/readiness panel remains a diagnostic evidence view, not a second scoring authority.

## Production boundary

The migration in this change is **not applied automatically**.

Applying it to production requires explicit owner approval. Applying the scoring-contract migration alone must not:

- create a `stock_score_runs` row;
- create a recommendation;
- alter portfolio roles/targets;
- make provider calls;
- enable a scheduler.

After approved production application, TORNTPHARM should resolve to `PHARMA_V1` in the Research scoring cockpit and the old GENERAL-derived 14% / 7% scorecard should no longer be presented as Pharma methodology.
