# PortfolioAI P8-B3 durable corporate-action + NIFTY 500 TRI canary campaign

Date: 1 October 2026  
Environment: PortfolioAI Development  
Status: **COMPLETE / PASS / DURABLE ACTION + TRI AUTHORITY CANARY CLOSED**

## Purpose

This is the second durable B3 authority slice after the durable raw-price canary passed.

It persists only:

- one raw official NSE corporate-action observation;
- one official NIFTY 500 Total Return Index observation;
- two corresponding immutable source-archive rows.

It does **not** persist corporate-action normalization, adjustment factors, adjusted price series, or any full historical campaign.

## Corporate-action canary

Selected security:

```text
symbol = BEL
historical ISIN = INE263A01024
historical identity = abb92c43-9463-5a06-b5db-8b795d78cf62
B2 canonical link basis = EXACT_ISIN
B2 listing coverage = 2024-02-29 through 2026-09-29
```

Selected action:

```text
purpose = Interim Dividend - Rs 1.95 Per Share
ex-date = 2026-03-06
record date = 2026-03-06
series = EQ
```

Official source:

`https://www.nseindia.com/api/corporates-corporateActions?index=equities&symbol=BEL`

The exact selected row must occur exactly once in the official response.

## Benchmark canary

Authority:

`NSE Indices Historical Data → Total returns Index Values`

Frozen benchmark:

```text
benchmark version = P8_NIFTY500_TRI_V1
benchmark code = NIFTY_500
selected trade date = 2024-01-31
request window = 01-Jan-2024 through 31-Jan-2024
```

Official endpoint:

`https://www.niftyindices.com/BackPage/getTotalReturnIndexString`

The extractor accepts only a valid official-host JSON response identifying NIFTY 500 and exactly one row for 2024-01-31.

## Extractor

`scripts/p8/p8-b3-build-durable-action-tri-canary.mjs`

The extractor:

1. retrieves/reuses the exact official NSE BEL corporate-action response;
2. proves the selected BEL dividend row exactly once;
3. binds it to the already-proven B2 historical identity;
4. retrieves/reuses official NIFTY 500 TRI January 2024 data;
5. proves exactly one 2024-01-31 TRI row;
6. preserves raw response SHA-256 hashes;
7. computes deterministic archive/observation/benchmark row hashes;
8. performs zero database writes.

Expected payload:

`tmp/p8-b3/durable-canary/P8_B3_ACTION_TRI_CANARY_PAYLOAD.json`

## Planned durable write after payload review

Exactly:

```text
source archives = +2
corporate action observations = +1
benchmark TRI rows = +1

corporate-action normalizations = +0
adjustment factors = +0
adjusted price/return rows = +0
```

The hosted write must be idempotent. Exact replay must insert zero new rows.

## Stop/go verification

After the exact durable insert:

- selected BEL action values and hash match the payload;
- BEL identity binding remains exact and singular;
- selected NIFTY 500 TRI date/value/hash match the payload;
- raw source hashes match;
- existing raw-price canary rows remain unchanged;
- live/B2 preservation fingerprints remain unchanged;
- B3 security findings remain zero;
- B3 unindexed-FK findings remain zero;
- exact replay is a no-op;
- normalization/factor/adjusted-series tables remain empty.

Only after this canary passes may a full-source campaign plan be proposed.

## Boundaries

Not authorized:

- full corporate-action campaign;
- full NIFTY 500 TRI campaign;
- full raw-price campaign;
- normalization;
- adjustment factors;
- adjusted series;
- P8-B4 or P8-C.

## Completion result

The uploaded payload was independently hash-validated and the exact four-row durable authority canary was applied.

```text
payload hash = f0e7da820631d9c0a6fe010c1a9008ac407119381a9e149356142aef2567b445

new source archives = 2
new corporate-action observations = 1
new benchmark TRI rows = 1
new normalization/factor/adjusted rows = 0
```

Corporate-action evidence:

```text
BEL / INE263A01024
B2 link basis = EXACT_ISIN
Interim Dividend - Rs 1.95 Per Share
face value = 1
ex-date = 2026-03-06
record date = 2026-03-06
observation hash = af6c6e3df80527790f0aa2f65028f49debbf0fe5a76c595c93fefdf82d5a64b1
```

Benchmark evidence:

```text
P8_NIFTY500_TRI_V1 / NIFTY_500
trade date = 2024-01-31
TRI = 31011.17
NTRI = 29432.64
row hash = d10e475b21fed2768bc9cd196630b9c3bd03f2c2fdfe22da5fe93d6c27ae49e9
```

Exact payload replay inserted zero new rows. Existing live/B2 preservation fingerprints remain unchanged. B3 security and unindexed-FK advisor findings remain zero.

This closes only the durable corporate-action + benchmark authority canary. Full-source acquisition and derived materialization remain separately approval-gated.
