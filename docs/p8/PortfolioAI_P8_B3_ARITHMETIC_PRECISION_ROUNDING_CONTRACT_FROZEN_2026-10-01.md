# PortfolioAI P8-B3 arithmetic precision and rounding contract — FROZEN

Date: 1 October 2026  
Environment: PortfolioAI Development  
Status: **OWNER APPROVED / FROZEN / AUTHORITATIVE**

This document freezes the exact B3 numerical policy approved by the owner after complete local verification.

## Frozen policy

```text
policy version = P8_B3_ARITHMETIC_V1
adjustment version = P8_B3_ADJUSTMENT_V2

internal calculation precision = 50 significant digits
persisted derived precision = 30 significant digits
rounding mode = ROUND_HALF_EVEN
derived security total-return index base = 1000

authoritative source values = decimal strings / no pre-rounding
derived persistence = PostgreSQL numeric / canonical decimal
binary floating-point authority = prohibited
presentation rounding = non-authoritative / never feeds calculations
```

## Scope

This frozen contract governs:

- split/consolidation factors;
- bonus factors;
- price back-adjustment factors;
- price-return link factors;
- total-return link factors;
- cumulative derived adjustment factors;
- derived security total-return index values.

Official NIFTY 500 TRI values remain authoritative source evidence and are not recomputed under this policy.

## Determinism

Implementation:

- `src/features/backtesting/p8ArithmeticPolicy.ts`
- `src/features/backtesting/p8CorporateActionAdjustment.ts`

Verification:

```text
P8_B3_ARITHMETIC_CONTRACT_CANDIDATE_VERIFICATION_PASS
```

The arithmetic engine uses an isolated Decimal.js clone so unrelated application-wide Decimal configuration cannot alter B3 arithmetic.

## Exact-source preservation

Authoritative exchange/company values are preserved without pre-rounding. Exact corporate-action terms remain in immutable evidence/normalization inputs.

For recurring derived values, rounding occurs only at the 30-significant-digit persistence boundary under ROUND_HALF_EVEN.

Example:

```text
exact terms: 1 / 3
persisted derived factor:
0.333333333333333333333333333333
```

## Presentation boundary

UI formatting is never an arithmetic authority. A rendered/display-rounded number must never overwrite or feed any B3 calculation or stored canonical derived value.

## Approval boundary

Owner approval freezes the arithmetic contract only.

It does **not** authorize:

- bulk historical acquisition;
- durable source-archive writes;
- durable raw-price writes;
- durable corporate-action writes;
- adjustment-factor materialization;
- adjusted-series materialization;
- benchmark-history materialization.

Those actions require the separately approved B3 acquisition/materialization campaign and its own bounded canary/resume controls.

Any future numerical-policy change requires a new version; `P8_B3_ARITHMETIC_V1` must not be silently edited after materialization begins.
