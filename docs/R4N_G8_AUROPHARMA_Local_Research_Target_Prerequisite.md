# R4N / G8 Prerequisite — AUROPHARMA Local Research Target

**Status:** Local-development fixture only  
**Branch:** `r4n-pharma-subprofile-architecture`  
**Production mutation:** NO  
**Research evidence created:** NO  
**G8 checkpoint:** prerequisite before G8.1; not G8.0

## Purpose

The ordinary localhost Research Coverage page enumerates current holdings.

Before Aurobindo Pharma can be used as the G8 second-company reference in the local application, AUROPHARMA must therefore exist as:

1. a canonical local equity security;
2. an active NSE listing;
3. a current local holding in the same ordinary development portfolio that already contains HDFCBANK and TORNTPHARM.

This fixture creates only those minimum local prerequisites.

## Canonical identity

Local target identity:

- company: Aurobindo Pharma Limited
- NSE symbol: `AUROPHARMA`
- ISIN: `INE406A01037`
- exchange: `NSE`
- series: `EQ`
- asset class: `EQUITY`

The symbol/ISIN identity was checked against official NSE/issuer material before the fixture was prepared.

## Local portfolio guard

The script does not pick an arbitrary portfolio.

It requires exactly one local portfolio currently holding both:

- HDFCBANK
- TORNTPHARM

If that condition is not uniquely true, the script aborts.

It captures both pre-existing quantities and verifies they remain unchanged.

## Pharma sector routing

The fixture reuses the existing local TORNTPHARM sector id for AUROPHARMA.

It does **not** copy an industry and does not create provider/classification evidence.

This keeps local Pharma routing aligned with the already working local reference while avoiding unsupported industry inference.

## Synthetic ownership link

Research Coverage enumerates `current_holdings`, which is derived from transactions.

If AUROPHARMA is not already a positive current holding, the fixture adds exactly one local-only:

`OPENING_POSITION`

with:

- quantity: 1
- transaction date: null
- broker account: null
- unit price: null
- gross amount: null
- charges: null
- taxes: null
- net amount: null
- data quality: `NEEDS_REVIEW`
- source type: `LOCAL_G8_FIXTURE`

This is not a claimed investment/trade or cost basis. It exists only so the local Research Coverage surface can enumerate AUROPHARMA for G8 validation.

## Explicitly not created

The fixture does not insert:

- `fundamental_observations`
- `research_documents`
- `security_identity_observations`
- `research_subprofile_assignments`
- score runs
- recommendation runs
- position-sizing outputs
- provider refresh rows

Therefore the correct initial AUROPHARMA Research Coverage evidence state is expected to be **MISSING**.

That is intentional.

## Files

- `scripts/r4n/auropharma-local-research-target.sql`
- `scripts/r4n/run-auropharma-local-research-target.sh`
- `src/features/research/auropharmaLocalResearchTargetSql.test.ts`

## Local execution

From the PortfolioAI repository root:

```bash
bash scripts/r4n/run-auropharma-local-research-target.sh
```

The runner defaults to the ordinary local Supabase URL:

`postgresql://postgres:postgres@127.0.0.1:54322/postgres`

It refuses a connection string that does not contain `127.0.0.1` or `localhost`.

Following the already validated Gate E local-fixture pattern, the SQL explicitly resolves the local app auth user:

`dr.d.dutta@gmail.com`

and then targets that user's earliest active portfolio. This is intentionally local-only and avoids postgres/RLS ambiguity.

## Expected verification

The SQL prints HDFCBANK, TORNTPHARM and AUROPHARMA from the same current-holdings portfolio.

After refreshing localhost Research Coverage, expected:

- Open holdings: 3
- HDFCBANK still present
- TORNTPHARM still present
- AUROPHARMA present
- AUROPHARMA equity eligible
- AUROPHARMA evidence domains initially Missing
- no provider call

## Next step

Only after local owner validation should G8.1 begin official-evidence classification review.
