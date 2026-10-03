# PortfolioAI P8-B Recovery — Workstream A Contract Implementation

Date: 3 October 2026  
Environment: Development only  
Branch: `PortfolioAI-Development`  
Status: WORKSTREAM A CONTRACT IMPLEMENTED

## Versioned recovery contract

Implemented:

- `src/contracts/p8BRecoveryContractV1.ts`
- `src/contracts/fixtures/p8BRecoveryContractV1.fixtures.ts`
- `src/contracts/p8BRecoveryContractV1.test.ts`

Contract version:

`P8_B_RECOVERY_CONTRACT_V1`

Frozen replay methodology:

`P8_R6_R10_REPLAY_V1`

## Encoded invariants

1. `historical_identity_id` is mandatory.
2. `historical_isin` is mandatory.
3. `canonical_security_id` is optional and may be null.
4. Historical company facts are usable only when their publication/availability timestamp is strictly before the simulated decision.
5. Cross-security historical fact use fails closed.
6. The frozen replay methodology may be applied retrospectively to valid historical facts.
7. A present-day manual company assignment is intentionally omitted from the replay router input and therefore cannot be projected backward.
8. Coverage keeps two distinct surfaces:
   - full audit surface = 144,768 identity/date dispositions;
   - B2-eligible experiment candidate denominator = 121,956.
9. Replay-ready coverage is bounded by the B2-eligible denominator.
10. The recovery exclusion ceiling is explicitly `PENDING_OWNER_FREEZE` and remains null.

## Scope boundary

This implementation does not mutate hosted B5/B6, does not call providers, does not acquire NSE/BSE files, does not inspect holdout/performance outcomes, does not start P8-C, and does not modify Production/main.

Workstream B may begin only after repository tests verify this contract.
