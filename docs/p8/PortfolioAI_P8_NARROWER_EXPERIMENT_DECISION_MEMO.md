# PortfolioAI P8 Narrower Experiment Decision Memo

Date: 4 October 2026  
Environment: Development only  
Branch: `PortfolioAI-Development`  
Source experiment: `P8_EXP_NSE_MONTHLY_6M_V1`  
Proposed version identifier: `P8_EXP_NSE_MONTHLY_6M_NARROWER_V2_PROPOSED`

## Decision

**NARROWER_EXPERIMENT_NO_GO**

This is an outcome-blind feasibility decision. No P8-C output, holdout result, forward return, benchmark performance, portfolio simulation or performance metric was inspected.

## What was measured

The audit rejoined the authoritative Workstream D pair-disposition ledger with the 32-partition B3 V2 adjusted decision ledger at exact `historical_identity_id + decision_date`.

Full historical surface:

- historical identities: **4,524**
- decision dates: **32**
- B2-eligible identity/date pairs: **121,956**

Maximum current candidate surface before methodology/metric proof:

- B2 eligible;
- B3 market state READY;
- official pre-decision evidence present;
- Workstream-D provisional classification resolved.

That candidate surface contains **25,761 pairs across 877 historical identities**, or **21.12%** of the B2-eligible denominator.

It is deliberately labelled **candidate**, not replay-ready.

## Why it is not yet replay-ready

Workstream D materially improved the evidence surface, but its `classification_label` is a provisional segment-derived signal produced from parsed XBRL. It is not yet the frozen complete historical classification contract required by the recovery plan.

Because that complete classification contract is not frozen, PortfolioAI cannot yet prove exactly one deterministic R6-R10 methodology route for those candidate pairs. Without the route, the methodology-specific required metric set is also not determinable. Raw XBRL fact presence is not equivalent to proof that all required normalized scoring metrics are available and semantically valid.

Accordingly this audit does **not** convert provisional classification or raw facts into a synthetic PASS.

## Objective narrowing rules evaluated

1. Preserve the survivor-free B2 historical universe; no present-day survival or holdings filter.
2. Require B3 market readiness at each decision date.
3. Require official evidence disseminated strictly before the decision.
4. Require a frozen point-in-time historical classification that maps to exactly one R6-R10 methodology route.
5. Require the complete normalized methodology-specific metric set from pre-decision evidence.
6. Retain at least 24 decision dates.
7. Never select securities using future returns, later success, outcome inspection, or manual convenience.

These rules are objective and point-in-time, but rules 4–5 are not yet provable from the current frozen evidence contracts.

## Coverage standards

| Standard | Result |
|---|---|
| At least 24 proven decision dates | PASS — 32 available |
| 100% identity resolution for retained pairs | PASS at B2 historical-identity level |
| At least 80% overall replay-ready coverage | FAIL — replay-ready remains 0% |
| At least 70% replay-ready on every retained date | FAIL / not yet computable as replay-ready |
| No major methodology sector below 60% | FAIL / methodology sectors not yet deterministically routable |
| Explicit missingness disclosure | PASS |

The standards were not lowered after observing coverage.

## Candidate distribution by decision date

| Decision date | B2 eligible | Candidate before route/metric proof | Candidate share | Replay-ready |
|---|---:|---:|---:|---:|
| 2024-02-29 | 3,385 | 705 | 20.83% | 0 |
| 2024-03-28 | 3,409 | 701 | 20.56% | 0 |
| 2024-04-30 | 3,434 | 729 | 21.23% | 0 |
| 2024-05-31 | 3,458 | 786 | 22.73% | 0 |
| 2024-06-28 | 3,479 | 790 | 22.71% | 0 |
| 2024-07-31 | 3,511 | 794 | 22.61% | 0 |
| 2024-08-30 | 3,546 | 802 | 22.62% | 0 |
| 2024-09-30 | 3,594 | 819 | 22.79% | 0 |
| 2024-10-31 | 3,626 | 816 | 22.50% | 0 |
| 2024-11-29 | 3,645 | 823 | 22.58% | 0 |
| 2024-12-31 | 3,677 | 833 | 22.65% | 0 |
| 2025-01-31 | 3,695 | 820 | 22.19% | 0 |
| 2025-02-28 | 3,721 | 828 | 22.25% | 0 |
| 2025-03-28 | 3,732 | 832 | 22.29% | 0 |
| 2025-04-30 | 3,740 | 830 | 22.19% | 0 |
| 2025-05-30 | 3,753 | 829 | 22.09% | 0 |
| 2025-06-30 | 3,782 | 834 | 22.05% | 0 |
| 2025-07-31 | 3,814 | 820 | 21.50% | 0 |
| 2025-08-29 | 3,851 | 818 | 21.24% | 0 |
| 2025-09-30 | 3,895 | 824 | 21.16% | 0 |
| 2025-10-31 | 3,922 | 814 | 20.75% | 0 |
| 2025-11-28 | 3,946 | 814 | 20.63% | 0 |
| 2025-12-31 | 3,976 | 813 | 20.45% | 0 |
| 2026-01-30 | 3,990 | 813 | 20.38% | 0 |
| 2026-02-27 | 4,011 | 811 | 20.22% | 0 |
| 2026-03-30 | 4,030 | 814 | 20.20% | 0 |
| 2026-04-30 | 4,127 | 805 | 19.51% | 0 |
| 2026-05-29 | 4,139 | 805 | 19.45% | 0 |
| 2026-06-30 | 4,156 | 815 | 19.61% | 0 |
| 2026-07-31 | 4,182 | 806 | 19.27% | 0 |
| 2026-08-31 | 4,345 | 809 | 18.62% | 0 |
| 2026-09-29 | 4,385 | 809 | 18.45% | 0 |

## Exclusion/disposition policy

Every B2-eligible pair has an explicit feasibility disposition:

- `NO_PRE_DECISION_EVIDENCE`
- `CLASSIFICATION_UNRESOLVED`
- `MARKET_DATA_BLOCKED`
- `CANDIDATE_ROUTE_AND_REQUIRED_METRICS_UNPROVEN`
- fail-closed unknown only if an unrecognized state appears.

No pair is silently excluded.

## Known limitations

The existing Workstream D classification is not a complete four-tier historical taxonomy. The current audit therefore cannot produce sector/industry/methodology-family coverage that is research-valid for owner freeze. Likewise, methodology-specific normalized metric completeness cannot be measured honestly until the route contract exists.

This is not a provider-data shortage that should trigger another acquisition loop. It is a contract/evidence-normalization gap inside the already acquired evidence surface.

## GO / NO-GO recommendation

**NO-GO. Do not rebuild B5/B6/B-FINAL yet.**

The next legitimate Development task, if separately authorized, is a bounded contract-resolution step that:

1. freezes a complete historical classification taxonomy/router from the already acquired point-in-time evidence;
2. maps each eligible historical classification to exactly one frozen R6-R10 methodology path; and
3. defines the exact normalized metric requirements per path and measures their existing pre-decision coverage.

Only after that read-only coverage census can PortfolioAI know whether the candidate surface above becomes sufficiently large and unbiased to justify a separately versioned experiment.

P8-C remains **NOT AUTHORIZED**. Production and `main` remain unchanged.
