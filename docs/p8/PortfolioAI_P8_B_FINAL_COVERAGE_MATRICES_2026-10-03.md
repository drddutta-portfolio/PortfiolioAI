# PortfolioAI P8-B-FINAL coverage matrices

Date: 3 October 2026  
Environment: PortfolioAI Dev  
Experiment: `P8_EXP_NSE_MONTHLY_6M_V1`

## Decision-date canonical snapshot matrix

| Decision date | Snapshots | Replay-ready | No canonical link | No classification before decision | Classification validity unproven |
|---|---:|---:|---:|---:|---:|
| 2024-02-29 | 4524 | 0 | 4262 | 262 | 0 |
| 2024-03-28 | 4524 | 0 | 4262 | 262 | 0 |
| 2024-04-30 | 4524 | 0 | 4262 | 262 | 0 |
| 2024-05-31 | 4524 | 0 | 4262 | 262 | 0 |
| 2024-06-28 | 4524 | 0 | 4262 | 262 | 0 |
| 2024-07-31 | 4524 | 0 | 4262 | 262 | 0 |
| 2024-08-30 | 4524 | 0 | 4262 | 262 | 0 |
| 2024-09-30 | 4524 | 0 | 4262 | 262 | 0 |
| 2024-10-31 | 4524 | 0 | 4262 | 262 | 0 |
| 2024-11-29 | 4524 | 0 | 4262 | 262 | 0 |
| 2024-12-31 | 4524 | 0 | 4262 | 262 | 0 |
| 2025-01-31 | 4524 | 0 | 4262 | 262 | 0 |
| 2025-02-28 | 4524 | 0 | 4262 | 262 | 0 |
| 2025-03-28 | 4524 | 0 | 4262 | 262 | 0 |
| 2025-04-30 | 4524 | 0 | 4262 | 262 | 0 |
| 2025-05-30 | 4524 | 0 | 4262 | 262 | 0 |
| 2025-06-30 | 4524 | 0 | 4262 | 262 | 0 |
| 2025-07-31 | 4524 | 0 | 4262 | 262 | 0 |
| 2025-08-29 | 4524 | 0 | 4262 | 262 | 0 |
| 2025-09-30 | 4524 | 0 | 4262 | 262 | 0 |
| 2025-10-31 | 4524 | 0 | 4262 | 262 | 0 |
| 2025-11-28 | 4524 | 0 | 4262 | 262 | 0 |
| 2025-12-31 | 4524 | 0 | 4262 | 262 | 0 |
| 2026-01-30 | 4524 | 0 | 4262 | 262 | 0 |
| 2026-02-27 | 4524 | 0 | 4262 | 262 | 0 |
| 2026-03-30 | 4524 | 0 | 4262 | 262 | 0 |
| 2026-04-30 | 4524 | 0 | 4262 | 262 | 0 |
| 2026-05-29 | 4524 | 0 | 4262 | 262 | 0 |
| 2026-06-30 | 4524 | 0 | 4262 | 262 | 0 |
| 2026-07-31 | 4524 | 0 | 4262 | 262 | 0 |
| 2026-08-31 | 4524 | 0 | 4262 | 262 | 0 |
| 2026-09-29 | 4524 | 0 | 4262 | 23 | 239 |

## Domain matrix

| Domain | Logical rows | Selected/resolved | Explicitly excluded/blocked |
|---|---:|---:|---:|
| B4 FUNDAMENTAL | 144,768 | 0 | 144,768 |
| B4 DOCUMENT | 144,768 | 0 | 144,768 |
| B5 full classification/methodology path | 144,768 | 0 | 144,768 |
| B6 canonical snapshot | 144,768 | 0 | 144,768 |

## Security-pattern matrix

| Security pattern | Historical identities | No-link dates | No-classification-predecision dates | Validity-unproven dates | Replay-ready dates |
|---|---:|---:|---:|---:|---:|
| Historical-only / no canonical link | 4,262 | 32 | 0 | 0 | 0 |
| Linked, evidence arrives only by final date but historical validity unproven | 239 | 0 | 31 | 1 | 0 |
| Linked, no complete pre-decision classification evidence | 23 | 0 | 32 | 0 | 0 |

## Frozen closure interpretation

The minimum decision-date count passes (32 proven versus minimum 24), B2 survivor-free universe closure and B3 adjusted-market/benchmark closure remain valid, and B4-B6 are deterministic and fail-closed. However, there are zero replay-ready canonical snapshots. Therefore the point-in-time evidence/version-lineage sufficiency condition fails and P8-C cannot be authorized under the frozen experiment contract.
