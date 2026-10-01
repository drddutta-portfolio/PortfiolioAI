# PortfolioAI P8-B2 V3 historical materialization execution

Date: 1 October 2026  
Environment: PortfolioAI Development only  
Status: **COMPLETE / PASS / CLOSED**

## Frozen plan

```text
plan hash = ea253903259183d3bf287e51412c6fa0938ea8b06260e48e40c682af2dfdf5b3
historical identities = 4524
exact current-ISIN links = 255
current-null-ISIN links = 7
P8-local historical-only identities = 4262
decision dates = 32
first = 2024-02-29
last = 2026-09-29
source CSV rows = 991687
frozen listing observations = 562790
latest eligible identities = 4385
latest ineligible identities = 139
```

## Execution architecture

The local sender reads only the previously acquired and hash-verified NSE source files on the owner's workstation. It sends bounded batches to a Development-only Edge Function.

The Edge Function:

- hard-refuses the Production project ref;
- accepts only the frozen P8-B2 action and plan hash;
- requires a time-limited one-campaign capability grant;
- validates identity hashes, archive hashes, observation hashes and canonical-link rules;
- writes only the seven already-approved V3 P8 historical tables plus campaign audit records;
- uses idempotent unique keys so interrupted runs can resume;
- verifies month counts, row-hash fingerprint, membership dispositions and eligibility-support evidence before selecting a month;
- consumes the campaign grant only after all 32 months meet the exact completion counts.

The campaign grant is intentionally not stored in repository documentation.

## Canary protocol

Run the local sender with `--canary`.

Expected hosted result after the first month:

- all 4,524 P8 historical identities are materialized;
- one immutable source archive is materialized for 2024-02-29;
- one run and one selection exist for that decision date;
- exactly 4,524 members exist for that run;
- listing-observation/evidence-link counts equal the first-month frozen plan count;
- eligible/ineligible counts equal the first-month plan;
- Production and `main` remain unchanged.

After independent hosted verification, resume with `--resume`. The sender is idempotent and may safely replay the canary month before continuing.

## Stop boundary

P8-B3 and P8-C are not authorized. Materialization success does not authorize replay, simulation or results work.

## Canary verification result

The remediated canary for decision date `2024-02-29` completed and passed independent hosted verification.

```text
identities = 4524
source archives = 1
observations = 14998
runs = 1
members = 4524
evidence links = 14998
selections = 1

eligible = 3385
ineligible = 1139
blocked = 0
ELIGIBILITY_SUPPORT links = 3385
SYMBOL_SERIES_VARIANT links = 11613
```

Identity linkage remains exactly `255 / 7 / 4262`.

The frozen live-security snapshot was compared to current PortfolioAI Dev after the canary and returned `0 changed / 0 missing / 0 added`.

The campaign grant remains unconsumed. The full materialization sender may now resume; its idempotent keys safely replay the canary month before continuing through the remaining 31 dates.

## Full campaign completion

The Development-only campaign completed on 1 October 2026.

```text
status = COMPLETE
operation = complete_campaign

historical identities = 4524
source archives = 32
listing observations = 562790
universe runs = 32
universe members = 144768
member evidence links = 562790
run selections = 32

latest decision date = 2026-09-29
latest eligible = 4385
latest ineligible = 139
latest blocked = 0
latest run hash = 2ddce0a378e758a84501f4ef537a37822d3d4479264f7c3ffa27e89824fcbb21

completion hash = 23a19bfbd86a341767370d6753d4eb471982313b6a0e37fe36e8a0c818124823
```

The campaign completion record and grant-consumption record are present in hosted PortfolioAI Dev.

Independent post-completion verification confirmed:

- 32 / 32 selected dates from 2024-02-29 through 2026-09-29;
- 32 / 32 runs with exact 4,524-member cardinality and matching eligible/ineligible counts;
- 32 / 32 runs with one selection and complete ELIGIBILITY_SUPPORT coverage for eligible members;
- 32 / 32 source archives with the approved conservative availability bound before the decision instant and no invented publication timestamp;
- identity split exactly 255 / 7 / 4262 with zero invalid frozen common-equity ISINs;
- live current-security preservation exactly 284 / 284 rows, with 0 changed / 0 missing / 0 added;
- legacy B2 v1/v2 tables remain unused.

P8-B2 Gate result: **COMPLETE / PASS / CLOSED**.

P8-B3, P8-B4+ and P8-C remain separately authorization-gated.
