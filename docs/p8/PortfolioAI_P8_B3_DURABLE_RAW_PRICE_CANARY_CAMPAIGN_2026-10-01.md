# PortfolioAI P8-B3 durable raw-price canary campaign

Date: 1 October 2026  
Environment: PortfolioAI Development  
Status: **OWNER APPROVED / EXTRACTOR CREATED / DURABLE INSERT PENDING PAYLOAD VERIFICATION**

## Purpose

This is the first durable B3 acquisition slice after:

- B2 closure;
- B3 hosted foundation + hardening;
- hosted transactional rollback canary;
- owner-approved frozen arithmetic policy.

It intentionally persists only the smallest raw NSE market-evidence slice needed to prove the durable acquisition path. It does not create any derived financial result.

## Frozen canary scope

```text
campaign_id = P8_B3_RAW_PRICE_CANARY_20261001_V1
experiment_id = P8_EXP_NSE_MONTHLY_6M_V1
target historical ISIN = INE002A01018

legacy date = 2024-03-14
UDiFF date = 2024-08-01

expected durable source archives = 2
expected durable raw observations = 2
expected derived rows = 0
```

The target ISIN already exists in the closed B2 historical identity registry. The extractor must independently prove that exactly one row for that ISIN exists in each official bhavcopy artifact.

## Approved official artifacts

Legacy:

`https://nsearchives.nseindia.com/content/historical/EQUITIES/2024/MAR/cm14MAR2024bhav.csv.zip`

Post-cutover UDiFF:

`https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_20240801_F_0000.csv.zip`

These exact paths were previously proven by the official-source canary. No alternate mirror or third-party copy may be substituted.

## Extractor

`scripts/p8/p8-b3-build-durable-raw-price-canary.mjs`

The extractor:

1. retrieves or reuses a local cache of the exact official NSE ZIP;
2. proves the archive is a ZIP and extracts the CSV;
3. validates legacy/UDiFF schema and embedded trading date;
4. finds exactly one row for `INE002A01018`;
5. preserves all numeric inputs as decimal strings;
6. computes SHA-256 for ZIP bytes, CSV bytes, source archive identity and normalized row;
7. emits a deterministic payload;
8. performs zero database writes.

Expected payload:

`tmp/p8-b3/durable-canary/P8_B3_RAW_PRICE_CANARY_PAYLOAD.json`

## Durable insert protocol

The payload must be reviewed before any write.

If and only if `ready_for_durable_insert = true` and both artifacts/rows validate, the hosted write will be performed through the service-role database path with:

- 2 immutable `p8_b3_source_archives` rows;
- 2 immutable `p8_b3_raw_market_price_observations` rows;
- B2 identity resolution by exact historical ISIN;
- no corporate-action rows;
- no normalization rows;
- no adjustment-factor rows;
- no adjusted-price rows;
- no benchmark rows.

The insert must be idempotent. Replaying the same payload must create zero new rows and preserve the original fingerprints.

## Post-write stop/go checks

After the first durable write:

- exact row counts = 2 archives / 2 raw observations;
- archive and row hashes match payload;
- source URLs remain official NSE archive hosts;
- both raw rows point to one exact B2 historical identity;
- existing live market/B2 fingerprints unchanged;
- no B3 security advisor findings;
- no B3 unindexed-FK findings;
- replaying the exact payload is a no-op;
- all derived B3 tables remain empty.

Only after that pass may the next authority canary (corporate actions / benchmark) be proposed.

## Boundaries

This approval does not authorize:

- full historical bhavcopy campaign;
- corporate-action durable acquisition;
- NIFTY 500 TRI durable acquisition;
- normalization or derived adjustment materialization;
- P8-B4 or P8-C.
