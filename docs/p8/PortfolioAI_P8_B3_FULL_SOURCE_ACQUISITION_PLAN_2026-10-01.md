# PortfolioAI P8-B3 full source-acquisition campaign

Date: 1 October 2026  
Environment: PortfolioAI Development only  
Status: **OWNER APPROVED / IMPLEMENTATION ACTIVE / NO NORMALIZATION OR DERIVED MATERIALIZATION**

## Frozen campaign identity

```text
plan version = P8_B3_FULL_SOURCE_ACQUISITION_PLAN_V1
campaign = P8_B3_FULL_SOURCE_ACQUISITION_20261001_V1
plan hash = 9367d9a55b5c7a6db176ef3e2b80da96cb97b3ac114f0ef884f124352a54919a
experiment = P8_EXP_NSE_MONTHLY_6M_V1
window = 2023-10-01 through 2026-09-30
```

The window is taken directly from the owner-approved B1 experiment contract.

## Authority and acquisition order

### 1. NIFTY 500 Total Return Index

Authority: NSE Indices Limited, Historical Data, Total returns Index Values.

Acquisition is split into 36 calendar-month requests.

The returned NIFTY 500 TRI dates become the authoritative trading-date set for this campaign. A weekday is never promoted to a trading date merely from the calendar.

### 2. NSE raw equity OHLCV

For every proven NIFTY 500 TRI trading date, acquire exactly one official NSE CM bhavcopy:

- before 8-Jul-2024: legacy `CM - Bhavcopy(csv)`;
- on/after 8-Jul-2024: `CM-UDiFF Common Bhavcopy Final (zip)`.

A missing/malformed bhavcopy on a proven TRI trading date is a hard stop.

Rows are bound to the B2 historical identity registry **only by exact historical ISIN**. Unknown ISINs are counted and skipped; symbol inference is prohibited.

Raw OHLCV remains immutable.

### 3. NSE corporate actions

Authority: official NSE Corporate Actions endpoint.

Acquisition is split into the same 36 calendar-month windows using explicit `from_date` / `to_date`.

Every official returned action row is preserved. Identity resolution is fail-closed:

1. B2 matching symbol/series observations are collected;
2. one unique historical identity resolves directly;
3. when multiple identities exist, the ex-date may select one only if exactly one observed symbol/series validity range brackets it;
4. otherwise the raw action remains `AMBIGUOUS`;
5. no B2 symbol evidence becomes `UNRESOLVED`.

No unresolved/ambiguous action is silently discarded or normalized.

## Hosted ingestion

Development-only Edge Function:

`supabase/functions/p8-b3-acquire-market-history`

The function:

- refuses the Production project;
- requires an owner-approved one-campaign grant;
- requires the exact campaign ID and plan hash;
- inserts only B3 raw source archives, raw price observations, raw corporate actions and official NIFTY 500 TRI rows;
- resolves prices only by exact B2 historical ISIN;
- leaves corporate-action ambiguity explicit;
- uses deterministic UUIDs and append-only tables;
- is idempotent and resumable;
- consumes its grant only after completion counts match the runner manifest;
- refuses completion if any normalization, adjustment-factor or adjusted-series rows exist.

## Local runner

The local runner is cache-first and restartable. Official raw artifacts are retained under:

`tmp/p8-b3/full-source-acquisition/`

Progress is persisted after each successful monthly/date slice. Network or hosted write failure stops the current atomic slice and leaves earlier slices resumable.

## Completion controls

The campaign may complete only when:

- benchmark monthly archives = 36;
- corporate-action monthly archives = 36;
- benchmark row count equals the number of proven trading dates;
- price archive count equals the number of proven trading dates;
- every proven benchmark trading date has an official validated NSE bhavcopy archive;
- hosted campaign counts equal the runner summary;
- derived B3 row counts remain zero;
- replay/resume produces no duplicate facts.

After completion, a separate verification audit must measure:

- decision-date raw price coverage against B2 eligible membership;
- corporate-action resolved/ambiguous/unresolved counts;
- benchmark and equity calendar alignment;
- preservation fingerprints;
- RLS/security/advisor state.

Only then may corporate-action normalization / adjusted-series materialization be proposed.

## Explicitly excluded from this approval

- corporate-action normalization;
- adjustment factors;
- adjusted market-price/return series;
- P8-B4;
- P8-C or later;
- Production;
- `main`.
