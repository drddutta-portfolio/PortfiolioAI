# PortfolioAI P8-B2 V3 historical materialization execution

Date: 1 October 2026  
Environment: PortfolioAI Development only  
Status: **PREFLIGHT PASS / MATERIALIZER DEPLOYED / CANARY READY**

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
