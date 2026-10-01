# PortfolioAI P8-B3 market-history and corporate-action authority memo

Date: 1 October 2026  
Environment: PortfolioAI Development only  
Authority: owner-approved entry into P8-B3  
Upstream gate: P8-B2 COMPLETE / PASS / CLOSED  
Status: **READ-ONLY BASELINE COMPLETE / ACQUISITION + MIGRATION NOT YET EXECUTED**

## 1. Frozen B3 contract

P8-B1 already freezes the following:

- experiment window: 2023-10-01 through 2026-09-30;
- monthly decision cadence after NSE close in Asia/Kolkata;
- primary outcome: six-month total return;
- secondary outcomes: one, three and twelve months when complete;
- primary benchmark: NIFTY 500 Total Return Index;
- currency: INR;
- corporate actions: official NSE/company evidence;
- raw OHLCV must remain immutable;
- adjusted series must be derived/versioned deterministically;
- missing or unexplained evidence fails closed rather than being inferred.

B3 must therefore supply point-in-time raw market history, corporate-action evidence, deterministic adjustment lineage and benchmark history. It must not rewrite the current live-price authority.

## 2. Hosted Development baseline

Existing `market_price_history`:

```text
rows = 63,929
provider = ANGEL_ONE
interval = ONE_DAY
covered securities = 240
first period = 2025-08-07
last period = 2026-09-28
rows with adjusted_close = 2
```

Existing benchmark history:

```text
rows = 2,710
series = 10
provider = ANGEL_ONE
first period = 2025-08-25
last period = 2026-09-28
NIFTY_500 rows = 271
```

This is insufficient for the frozen 2023-10-01 through 2026-09-30 experiment and cannot serve as the B3 adjustment authority.

There is no dedicated immutable corporate-action history relation in the current schema.

## 3. Authoritative acquisition path

### 3.1 Raw equity OHLCV

Primary authority: official NSE cash-market bhavcopy/report archive.

The NSE reports surface documents:

- legacy cash-market bhavcopy/common bhavcopy reports before the UDiFF cutover;
- CM-UDiFF Common Bhavcopy Final after the July 2024 format transition;
- full bhavcopy / security deliverable reports;
- dated archives.

The acquisition must preserve each raw source file, source date, URL/file identity, retrieval time, SHA-256, parser version and every raw OHLCV row used by B3.

No current `market_price_history` row is overwritten.

### 3.2 Corporate actions

Primary authority: official NSE Corporate Filings → Corporate Actions downloadable report/API surface.

The official report exposes company/symbol/series, purpose, face value, ex-date, record date and book-closure fields. Store the raw purpose text unchanged and derive normalized action semantics separately.

All action records remain immutable evidence.

Action families to recognize:

- cash dividend;
- stock split / face-value subdivision or consolidation;
- bonus issue;
- rights issue;
- merger / amalgamation;
- demerger / spin-off;
- other capital restructuring;
- symbol/security-identity transition;
- delisting/inactive disposition where supported by the B2 listing authority.

Unparseable or economically ambiguous actions are explicit blockers. They must not be silently converted into adjustment factors.

### 3.3 Benchmark

Primary benchmark authority: NSE Indices historical Total Return Index values for NIFTY 500.

The benchmark must be stored as a total-return series under the frozen `P8_NIFTY500_TRI_V1` benchmark version. Existing Angel One NIFTY 500 rows are price-market evidence only and may not silently substitute for TRI.

Sector TRI histories may be acquired as raw benchmark evidence, but historical sector benchmark use remains conditional on B5 proving point-in-time classification and benchmark mapping.

## 4. Deterministic adjustment contract

B3 should keep three concepts separate:

1. **Raw price series** — exact exchange OHLCV; immutable.
2. **Price-adjusted series** — backward-compatible factor series for capital-structure events where the economics are fully known.
3. **Total-return series** — separately versioned return factors incorporating eligible cash distributions.

Minimum deterministic rules:

- split/consolidation: use declared ratio / face-value terms only;
- bonus: use declared bonus ratio only;
- dividend: use declared cash amount on the ex-date for total-return treatment;
- rights: adjust only when the full entitlement and subscription terms permit a deterministic calculation; otherwise block;
- merger/demerger/spin-off: do not synthesize value from a price jump; require explicit economic terms and successor/security mapping, otherwise block;
- unexplained discontinuity: never infer an action from price movement alone;
- action date boundary: use the ex/effective date declared by the authority;
- all arithmetic, scale and rounding rules must be versioned and unit-tested.

## 5. Proposed additive B3 data model

Repository/local design should use additive P8-specific objects rather than mutating the live price schema:

- `p8_market_source_archives`
- `p8_raw_market_price_observations`
- `p8_corporate_action_observations`
- `p8_corporate_action_normalizations`
- `p8_price_adjustment_factors`
- `p8_adjusted_market_price_series`
- `p8_benchmark_source_archives`
- `p8_benchmark_total_return_history`
- owner-scoped `security_invoker` read models;
- service-only append/materialization functions.

Exact table count and constraints remain subject to local schema design review; this memo does not authorize a hosted migration.

## 6. Acquisition design

Before any download campaign:

1. enumerate every NSE trading date in the frozen window;
2. resolve the correct report format for each date around the July 2024 UDiFF transition;
3. generate a dry-run manifest of exact source URLs/files;
4. enumerate the B2 identities/listing evidence expected on each date;
5. hash every acquired raw file;
6. reject missing or inconsistent source dates;
7. run a small hand-verifiable canary containing at least:
   - no-action security;
   - cash dividend;
   - split;
   - bonus;
   - one complex/blocked action;
8. only then resume the complete acquisition/materialization campaign.

This stage should prefer official NSE/NSE Indices archives and therefore does not require Trendlyne for the primary B3 authority.

## 7. Expected gate

B3 can close only when:

- raw OHLCV covers every eligible security/date required by the frozen experiment, or has an explicit blocker;
- corporate actions required to interpret the series are represented as immutable evidence;
- every derived adjustment is reproducible from explicit action evidence;
- complex unsupported actions fail closed;
- NIFTY 500 TRI covers every required benchmark period;
- hand-verifiable fixtures pass;
- rerunning adjustment materialization produces identical fingerprints;
- no current live security/price fact is mutated;
- Production and `main` remain unchanged.

## 8. Current authorization boundary

Completed by this checkpoint:

- B3 repository/hosted read-only inventory;
- official-source feasibility research;
- source/adjustment architecture proposal.

Not yet executed:

- no NSE historical-price acquisition;
- no corporate-action acquisition campaign;
- no NIFTY TRI acquisition;
- no B3 migration created or applied;
- no hosted B3 data write;
- no provider/paid API call;
- no P8-B4 or P8-C work.

Next gate: owner approval of the exact B3 acquisition + additive schema package creation before those consequential steps.
