# Stage 7.2B — Controlled Cohort A Completion

**Status:** Complete; controlled Cohort A accepted; Stage 7.2C not started

## Scope and preflight

The exact 25-security cohort was HDFCBANK, M&M, BHARTIARTL, MOTHERSON, BBOX,
AVALON, ASTRAMICRO, WABAG, WAAREEENER, ZAGGLE, ICICIBANK, SBIN, FEDERALBNK,
INFY, TITAN, TORNTPHARM, LAURUSLABS, TVSMOTOR, IREDA, HUDCO, TDPOWERSYS,
MTARTECH, PIIND, VBL and NETWEB. The authenticated live dry-run found the ten
pilot securities fresh and planned the 15 additions at 60 base attempts plus 12
retry units, with initial logical reservations of 39 and 33 and projected daily
usage of 72/100. It made no provider call and consumed no budget.

Before execution the live API was hardened to require one explicit logical batch,
deterministic approved-symbol ordering and state-aware sequencing. This closed the
gap where the previous endpoint would have executed both batches without the
mandatory Batch 1 acceptance pause. No schema migration was required.

## Batch results

Batch 1 contained ICICIBANK, SBIN, FEDERALBNK, INFY, TITAN, TORNTPHARM,
LAURUSLABS and TVSMOTOR. Run `c45ed6db-cd00-4d77-bdd9-d7fb71962161`
succeeded with 24 attempts: eight overview, eight identity search and eight
ownership calls. There were no retries or failed calls. Its 39-unit reservation
settled with 24 consumed and 15 released; all 24 domain run items were accepted,
all 24 refresh states became fresh, and the lease was released.

Batch 2 contained IREDA, HUDCO, TDPOWERSYS, MTARTECH, PIIND, VBL and NETWEB.
After Batch 1 freshness was applied, its current-state plan was 28 base plus six
retry units, or 34 reserved. Run `5d8da0ba-48ee-4f82-b826-f8fd0df22c58`
succeeded with 23 attempts: seven overview, nine identity search and seven
ownership calls. The two additional searches were strict identity fallbacks, not
retries. There were no failed calls or retries. The reservation settled with 23
consumed and 11 released; all 21 run items were accepted, all 21 refresh states
became fresh, and the lease was released.

## Evidence acceptance

All 15 additions resolved to exact matched provider identities, bringing Cohort A
coverage to 25/25 with no duplicate verified provider ID and no unresolved or
quarantined identity. The rollout added 180 observations: 105 first-wave
fundamental observations and 75 aggregate-ownership observations. Each security
received MARKET_CAP_PROVIDER_RAW, PE_TTM, PBV_ADJUSTED_PROVIDER, REVENUE_TTM,
NET_PROFIT_TTM, CFO_ANNUAL and ROE_ANNUAL plus promoter, FII/FPI, DII, mutual-fund
and public ownership percentages.

All 15 adjusted P/B observations remain explicitly `PBV_ADJUSTED_PROVIDER` with
`CONFLICTING` evidence status; no generic P/B row was created. No numeric value
was missing. Two promoter values were zero because the retained provider payload
explicitly reported `0.0`; no null was converted to zero. Every ownership row
retains the reported quarter end. No document search ran, and the existing three
provisional `REVIEW_REQUIRED` appearances and sources remained unchanged.

## Accounting, storage and regression

The two runs used 47 actual attempts against 73 reserved units and released 26.
Every attempt has one successful usage event; there were zero failed events and
zero retries. Both reservations are settled, all 45 run items are accepted, all
45 refresh projections are fresh, and the cohort lease has no holder or expiry.

Measured linked growth included fundamental observations from 128 to 308,
identity observations from 10 to 25, data-source records from 43 to 88, usage
events from zero to 47, reservations from zero to two, run items from zero to 45,
refresh states from zero to 45 and ingestion runs from 46 to 48. Approximate total
storage grew by 144 kB for fundamental observations, 136 kB for source records,
80 kB for usage events, 64 kB for run items, 32 kB for reservations and 8 kB for
ingestion runs.

Protected state remained 482 transactions, 271 securities, 249 Angel One
mappings, 248 latest prices, five broker accounts, two themes, 14 memberships and
zero position settings. Because transactions and prices were unchanged, holdings
quantities and deterministic realised/unrealised accounting outputs were
unchanged. No asset class, role, theme or accounting record was mutated.

## Verification and remaining boundary

The full 173-test Vitest suite, 82 Edge tests, TypeScript, application and Edge
ESLint, production build, linked schema lint, `git diff --check`, secret scan,
`npm audit` and the 45-assertion disposable pgTAP/RLS/control-plane suite passed.
`refresh-security-enrichment` version 14 is active with JWT verification. No
production privilege was widened.

This completion covers only the controlled Cohort A rollout. It does not implement
Stage 7.2C, scheduled refresh, research UI, additional documents, news, corporate
events, technical data, accounting changes or a broader Trendlyne rollout.
