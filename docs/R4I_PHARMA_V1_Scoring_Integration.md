# R4I — PHARMA_V1 Scoring Integration

Status: **REPOSITORY INTEGRATION COMPLETE / PRODUCTION SCORING CONTRACT APPLIED**

## Purpose

R4I connects the PHARMA_V1 research methodology to the same Research scoring surface used by the validated HDFCBANK reference pathway while preserving a completely separate Pharma-specific metric contract.

The commonality is architectural only:

```text
canonical evidence
  → profile-specific rules
  → deterministic scoring/readiness engine
  → SecurityScoringSnapshot
  → Research UI
```

The evaluation metrics remain profile-specific:

```text
HDFCBANK → BANK_NBFC rules
TORNTPHARM → PHARMA_V1 rules
```

PHARMA_V1 does not inherit BANK/NBFC evaluation metrics and no longer silently falls back to GENERAL rules.

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

## Legacy assignment compatibility

Existing reviewed `PHARMA_HEALTHCARE` assignments are not rewritten in R4I repository code. When canonical application classification identifies a pharmaceutical business, that legacy assignment is treated as an alias for `PHARMA_V1` methodology.

A newly added holding with canonical sector `Pharma` or canonical industry `Pharmaceuticals` automatically enters the PHARMA_V1 scoring pathway even without a manual scoring assignment.

Generic Healthcare businesses, hospitals and diagnostics are not automatically routed to PHARMA_V1.

## PHARMA_V1 scoring contract

The additive migration `20260914143000_add_pharma_v1_scoring_contract.sql` registers:

- `PHARMA_V1` as a scoring profile;
- nine common PortfolioAI scorecard dimensions under that profile;
- Pharma-specific metric-rule inputs aligned to the PHARMA_V1 research contract.

Dimension weights total 100%:

- Quality — 15%
- Growth — 18%
- Capital Efficiency — 12%
- Cash Flow — 12%
- Balance Sheet / Credit — 10%
- Valuation — 13%
- Momentum — 10%
- Ownership / Governance — 5%
- Risk — 5%

No final numeric Pharma score curves are invented in R4I. History contracts with proven canonical semantics may contribute **evidence coverage**. They remain **score-unready** until an explicit later migration approves Pharma-specific normalization curves.

Unresolved domains remain `PENDING_SOURCE`, including valuation context, ownership/governance event overlay, regulatory-site evidence, and portfolio-wide market-history-derived momentum/risk inputs.

## Partial evidence behavior

R4I distinguishes evidence presence from score readiness.

Examples:

- matched quarterly operating-margin periods against the PHARMA_V1 minimum contribute partial evidence but do not become score-ready until the minimum history and scoring curve are satisfied;
- one annual operating-revenue point against a minimum history remains partial only;
- CFO history alone cannot satisfy cash conversion without matched PAT and FCF/capex evidence;
- stale or conflicting observations do not contribute.

Therefore a stock may have substantial canonical stored history while still showing no numeric PHARMA_V1 score. That is correct fail-closed behavior.

## UI behavior

`useSecurityScoring()` is the single application entry point. For a Pharma scoring context it loads the PHARMA_V1 snapshot; HDFCBANK continues through BANK_NBFC and other profiles retain their existing pathways.

`ResearchScorecardPanel` continues to consume one `SecurityScoringSnapshot`. The dedicated Pharma history/readiness panel remains a diagnostic evidence view, not a second scoring authority.

## Production activation

The migration was explicitly approved and applied to production on 2026-09-14.

Post-application verification confirmed:

- PHARMA_V1 scoring profile rows: 1;
- PHARMA_V1 dimensions: 9;
- PHARMA_V1 metric rules: 15;
- dimension weights sum to 100%;
- TORNTPHARM score runs remained 0;
- TORNTPHARM recommendation runs remained 0;
- provider usage events remained unchanged during the migration;
- TORNTPHARM fundamental observations remained unchanged during the migration.

The migration therefore registered methodology/configuration only. It made no provider call and created no investment score, recommendation, position-sizing assessment or scheduler action.

## Branch policy

Further Pharma work lands first in `pharma-research-integration`. Only when the complete Pharma research pathway is satisfactory should that integration branch be proposed for merge into `main`.

The same sector-integration-branch pattern should be used for future sector research implementations.
