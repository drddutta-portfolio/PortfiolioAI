# PortfolioAI P8-B3 arithmetic precision and rounding contract candidate

Date: 1 October 2026  
Environment: Development repository only  
Status: **CANDIDATE IMPLEMENTED / LOCAL VERIFICATION PENDING / OWNER APPROVAL REQUIRED BEFORE USE FOR MATERIALIZATION**

## Why this contract exists

P8-B3 will eventually calculate split/bonus adjustment factors, price-return links, total-return links, cumulative adjustment factors and derived total-return indexes.

Those values must not depend on:

- JavaScript binary floating-point behavior;
- Decimal.js global defaults;
- hidden library defaults;
- UI/display rounding;
- unspecified database coercion;
- run-to-run implementation differences.

The Codex B3 gate explicitly requires documented precision and rounding.

## Candidate policy: P8_B3_ARITHMETIC_V1

### Internal calculation precision

```text
50 significant digits
```

All B3 arithmetic uses an isolated `Decimal.clone` constructor with this precision.

Reason: materially higher than source-market precision and the 30-digit persistence boundary, while leaving substantial guard digits for chained calculations.

### Rounding mode

```text
ROUND_HALF_EVEN
```

Also known as bankers' rounding.

Reason: deterministic and unbiased across repeated rounding boundaries compared with always rounding .5 away from zero.

### Authoritative source values

Authoritative source numerics are parsed from decimal strings and **not pre-rounded before calculation**.

Examples:

- NSE prices;
- declared dividend amount;
- declared face value;
- declared split/bonus terms;
- official NIFTY 500 TRI values.

The immutable raw source representation remains preserved separately. Canonical numeric spelling is not a substitute for the raw evidence.

### Derived persistence boundary

Derived financial values are persisted at:

```text
30 significant digits
ROUND_HALF_EVEN
```

This applies to:

- share factors;
- price back-adjustment factors;
- price-return link factors;
- total-return link factors;
- cumulative derived factors;
- derived security total-return index values.

PostgreSQL `numeric` and canonical decimal strings are used. Binary IEEE-754 floating point is not an accepted persistence authority.

### Exact corporate-action terms

Split/bonus inputs remain preserved in `calculation_inputs` / normalization evidence as the exact declared terms.

For example:

```text
old face value = "10"
new face value = "2"
```

The derived decimal factor may be rounded only at the 30-significant-digit persistence boundary.

For a recurring factor such as 1/3, the stored derived value under this policy is:

```text
0.333333333333333333333333333333
```

The exact source terms remain available so the factor can always be recomputed.

### Cash distributions and prices

Authoritative price/dividend inputs are preserved as exact source decimals for the calculation.

Example total-return link:

```text
(previous price = P)
(ex-date close = C)
(cash distribution per share = D)

price-return link = C / P
total-return link = (C + D) / P
```

Only the derived link is rounded to the 30-significant-digit persistence boundary.

### Derived total-return index

Candidate base:

```text
1000
```

The base is exact. Chained calculations use 50-digit internal precision; each persisted derived index value is canonicalized to 30 significant digits under ROUND_HALF_EVEN.

Official NIFTY 500 TRI source values are not recomputed by this policy; their authoritative source decimals are preserved.

### Presentation rounding

Presentation/UI rounding is explicitly **non-authoritative**.

A displayed value may later be formatted to fewer decimal places, but:

- display rounding must never overwrite stored B3 values;
- display values must never feed back into calculations;
- backtests must use canonical stored/calculated facts, not rendered UI strings.

The presentation layer may define separate formatting rules later without changing this arithmetic contract.

## Implementation

`src/features/backtesting/p8ArithmeticPolicy.ts`

Candidate constants:

```text
policy version = P8_B3_ARITHMETIC_V1
internal precision = 50 significant digits
persisted derived precision = 30 significant digits
rounding = ROUND_HALF_EVEN
derived total-return index base = 1000
```

Corporate-action calculation version is bumped from:

```text
P8_B3_ADJUSTMENT_V1
```

to:

```text
P8_B3_ADJUSTMENT_V2
```

because V1 depended on implicit Decimal.js defaults, even though the existing simple fixtures produced the same visible values.

No B3 adjustment rows currently exist, so no historical derived fact requires migration.

## Determinism tests

`src/features/backtesting/p8ArithmeticPolicy.test.ts`

The candidate tests:

- frozen contract values;
- preservation of long authoritative source decimals;
- 30-significant-digit derived rounding;
- explicit half-even tie behavior;
- deterministic recurring 1/3 factor;
- isolation from application-wide Decimal.js defaults;
- prevention of presentation rounding from becoming a calculation input.

Existing corporate-action fixtures are also updated to require the arithmetic policy version.

## Authorization boundary

This candidate is **not yet owner-approved for financial materialization**.

Until explicit owner approval:

- no adjustment-factor campaign;
- no adjusted market-price series;
- no derived security total-return series;
- no B3 bulk acquisition/materialization that depends on this arithmetic contract.

Raw authoritative evidence acquisition can be designed separately, but no derived arithmetic facts may be persisted under this candidate policy until approval.

## Local verification result

The candidate passed its complete local verification gate.

```text
P8_B3_ARITHMETIC_CONTRACT_CANDIDATE_VERIFICATION_PASS
```

The numerical policy is therefore technically validated and reproducible. It remains pending explicit owner approval before any adjustment factor, adjusted price, derived return, or derived security total-return series may be materialized.
