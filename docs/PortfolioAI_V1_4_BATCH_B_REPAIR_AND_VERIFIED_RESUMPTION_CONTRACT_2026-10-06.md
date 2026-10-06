# PortfolioAI — V1-4 Batch B Repair and Verified Resumption Contract — 6 October 2026

## Scope and status

Repository: `drddutta-portfolio/PortfiolioAI`  
Branch: `PortfolioAI-Development`  
Supabase Dev: `lrgpjimipfkyoqbpsqzz`

V1-4 remains **IN PROGRESS / NOT PROVEN**. V1-5 remains **NOT AUTHORIZED**.

Completed Batch A/C/E evidence is preserved. No history acquisition, Batch D review persistence, Batch F materialization, Production/main, migration, Auth/RLS, scheduler, R2, P8 or V1-5 work was performed during this repair.

Frozen 111 membership, manifest hash and frozen values are unchanged.

---

## 1. Deployed/source reconciliation

Starting remote Development HEAD for this repair:
`fbf96266a47d1056f952342d4b7414023c932e0a`.

At the start, deployed `p7-ic-benchmark-refresh` v5 did **not** correspond to repository source.

Observed deployed-v5-only behavior included:
- import/use of `normalizeBenchmarkAlias`;
- a `P7_IC2_DIAGNOSE_MAPPING` action not present in repository source;
- a live Angel One public instrument-master fetch inside that diagnostic path;
- similarity-based candidate reporting alongside exact resolution;
- no durable retention of that master response.

Similarity candidates were diagnostic only, but the live master artifact was not persisted, so the prior `NIFTY_CAPITAL_GOODS / P7_IC_BENCHMARK_IDENTITY_NOT_FOUND` result is not reproducible.

The old execution path also had material contract defects:
- loose history threshold `candles.length < 120`;
- no requirement for 252 distinct sessions;
- no explicit 400-row-per-benchmark / 4,800-total ceiling validation before write;
- no exact response-window/cutoff validation;
- `providerCalls` incremented only after a successful high-level history response, so failures could report zero after transport activity;
- automatic Angel One reauthentication/transient history retries could create extra external requests outside the stated zero-retry ceiling;
- authentication transport was not separately accounted.

Repository source has now been repaired and redeployed.

Final tested Development function:
- function: `p7-ic-benchmark-refresh`
- version: **v9**
- bundle SHA-256: `5bf0c2d26f1a7700d27ac5459acf045eb45640798a2b2f5d253d241b5c0b22ac`
- deployed `index.ts` is byte-for-byte equal to current `PortfolioAI-Development` source.

---

## 2. Repaired Batch B contract

New shared contract:
`supabase/functions/_shared/v14-batch-b-contract.ts`

Contract version:
`V1_4_BATCH_B_RESUMPTION_CONTRACT_V2`

Exact original twelve-code order is frozen:

1. `NIFTY_CAPITAL_GOODS`
2. `NIFTY_CHEMICALS`
3. `NIFTY_CONSUMER_DURABLES`
4. `NIFTY_CONSUMER_SERVICES`
5. `NIFTY_FINANCIAL_SERVICES_EX_BANK`
6. `NIFTY_HOSPITALS`
7. `NIFTY_INDIA_DEFENCE`
8. `NIFTY_OIL_GAS`
9. `NIFTY_POWER`
10. `NIFTY_SERVICES_SECTOR`
11. `NIFTY_TELECOM`
12. `NIFTY_TRANSPORTATION_LOGISTICS`

A reordered or partial list is rejected by the Batch B execution action.

### Identity preflight

Before any history acquisition, all twelve requested codes must be evaluated against one retained master artifact.

Each code receives exactly one state:
- `EXACT_MATCH`
- `AMBIGUOUS`
- `UNAVAILABLE`

An exact identity requires:
- exact normalized match to an explicitly accepted alias;
- NSE exchange;
- Angel instrument type `AMXIDX`;
- non-empty provider token;
- one unique token only.

Candidate-name similarity may be returned only as investigation evidence and is stamped `exactAliasAuthorized:false`. It can never authorize a mapping.

Wrong instrument types and ETF-like substitutions are rejected even when their display name resembles the requested index.

### Master evidence

Batch B execution no longer silently fetches a master.

History execution requires a retained `data_source_records` artifact:
- source code: `ANGEL_ONE`
- record kind: `V1_4_ANGEL_INSTRUMENT_MASTER`
- source URL retained;
- retrieval timestamp retained;
- raw master body retained;
- SHA-256 retained;
- body SHA-256 rechecked before preflight;
- JSON schema must be an array.

No such authorized artifact currently exists.

### History response acceptance

For each benchmark, before any write:
- exact request window must be `2025-09-01` through `2026-10-06`;
- `requestTo` must equal cutoff `2026-10-06`;
- maximum returned/accepted rows: **400**;
- minimum usable **distinct exchange sessions: 252**;
- duplicate session dates rejected;
- every session must lie inside the requested window;
- open/high/low/close must be positive exact decimals;
- volume, when present, must be non-negative;
- OHLC ordering must be internally consistent;
- total accepted/persisted rows across twelve benchmarks cannot exceed **4,800**.

Validation completes before mapping/history persistence.

### Counters and failure accounting

The function now keeps independent counters for:
- `instrumentMasterRequests`;
- `successfulInstrumentMasterResponses`;
- `providerAuthenticationRequests`;
- `successfulAuthenticationResponses`;
- `attemptedHistoryRequests`;
- `successfulHistoryResponses`;
- `acceptedRows`;
- `persistedRows`.

Execution actions create an audit `data_ingestion_runs` row. Counters are persisted on both success and failure.

Angel One now exposes an optional transport observer and a `getDailyHistoryNoRetry` path. Batch B uses the no-retry path.

If authentication fails before the history POST:
- authentication request is counted;
- history request is **not** counted;
- no false history usage event is written.

If a history request is attempted and fails:
- attempted history remains counted;
- successful response is not counted;
- accepted/persisted rows remain unchanged.

---

## 3. Request-ceiling correction

The prior 13-request total incorrectly counted:

- 1 instrument-master request
- 12 history requests

but omitted Angel One authentication on a cold worker.

The repaired two-stage ceiling is:

### Stage B0 — master replacement/preflight only
- external requests: **exactly 1 maximum**
- instrument master: ≤1
- authentication: 0
- history: 0
- retries: 0

### Stage B1 — history acquisition after a retained master exists
- master requests: 0
- Angel authentication requests: ≤1
- history requests: ≤12
- retries: 0
- external requests: **≤13**

Combined maximum across B0 + a later fully authorized B1:
**14 external requests**.

If Angel authentication is already valid in the worker, actual B1 external requests may be 12, but the safe ceiling is 13.

This corrects the accounting defect and is a material change from the old combined “13 request” description. It must be owner-approved before any new provider campaign.

---

## 4. Current identity/resumption decision

No retained authorized master artifact can be recovered from Dev.

Provider-free `P7_IC2_PLAN` on Development v9 confirms:
- retained master artifacts: **0**
- `masterReplacementRequired = true`
- fresh grant required: **true**
- old grant reusable: **false**
- request window: **2025-09-01 → 2026-10-06**
- per-code row ceiling: **400**
- total row ceiling: **4,800**
- all request/response/row counters: **0**

Therefore the exact currently eligible history-acquisition set is:

**EMPTY — 0/12 reproducibly eligible.**

This is not a judgment that the provider lacks all twelve indices. It means no retained master evidence currently proves any of the twelve mappings.

| Code | Current reproducible state | What is required next |
| --- | --- | --- |
| NIFTY_CAPITAL_GOODS | UNPROVEN; old unretained run reported NOT_FOUND | provider capability evidence from retained replacement master; if a unique AMXIDX exists only under a non-approved name, a proven alias-correction decision is needed; if none exists, provider capability is absent and alternate authority requires owner approval |
| NIFTY_CHEMICALS | NOT PREFLIGHTED in old stopped run | provider capability evidence first; same alias/capability branch after evidence |
| NIFTY_CONSUMER_DURABLES | NOT PREFLIGHTED | provider capability evidence first |
| NIFTY_CONSUMER_SERVICES | NOT PREFLIGHTED | provider capability evidence first |
| NIFTY_FINANCIAL_SERVICES_EX_BANK | NOT PREFLIGHTED | provider capability evidence first |
| NIFTY_HOSPITALS | NOT PREFLIGHTED | provider capability evidence first |
| NIFTY_INDIA_DEFENCE | NOT PREFLIGHTED | provider capability evidence first |
| NIFTY_OIL_GAS | NOT PREFLIGHTED | provider capability evidence first |
| NIFTY_POWER | NOT PREFLIGHTED | provider capability evidence first |
| NIFTY_SERVICES_SECTOR | NOT PREFLIGHTED | provider capability evidence first |
| NIFTY_TELECOM | NOT PREFLIGHTED | provider capability evidence first |
| NIFTY_TRANSPORTATION_LOGISTICS | NOT PREFLIGHTED | provider capability evidence first |

Rules after B0:
- `EXACT_MATCH` under an already approved alias → technically eligible.
- `AMBIGUOUS` → not eligible; identity must be resolved without similarity guesswork.
- `UNAVAILABLE` with a provider-native AMXIDX shown only by a different exact official name → prepare a **proven alias correction** for owner review before changing the registry.
- `UNAVAILABLE` with no correct AMXIDX → **provider capability gap**. A different provider/source/authority is a separate owner decision.
- ETF, context-label or TRI substitution is prohibited.

The four already unsupported frozen authority labels remain unchanged and outside this twelve-code repair:
`NIFTY_CAPITAL_MARKETS`, `NIFTY_ENERGY_CONTEXT`, `NIFTY_HEALTHCARE_CONTEXT`, `NIFTY_INSURANCE`.
They require an owner-approved source/authority decision; they are not silently mapped to nearby indices.

---

## 5. History-proof preparation repair

New helper:
`supabase/functions/_shared/v14-history-proof-preparation.ts`

Calendar, corporate-action treatment and stock-history freshness are now explicitly separate proof dimensions.

### Exchange calendar

Current V1-4 official calendar evidence is insufficient:
- no exchange-calendar/session table exists;
- no complete official full-window calendar artifact exists;
- the only V1-4 official session canaries are the 1-Oct-2026 and 5-Oct-2026 bhavcopies.

Therefore:
`exchangeCalendarState = UNVERIFIED`

Reason:
`FULL_WINDOW_OFFICIAL_CALENDAR_NOT_PROVEN`

This conclusion is independent of:
- benchmark identity;
- benchmark acquisition;
- stock/benchmark session alignment.

The existing 111 Batch C proofs are preserved. No superseding proof was written during this repair.

A future superseding append-only proof must cite a complete official exchange-calendar/session artifact covering the selected history window; the two bhavcopies alone cannot satisfy it.

### Stock-history freshness

Current frozen-111 Angel One stock-history maxima:
- **110 securities** latest session = `2026-09-25`
- **HDFCBANK** latest session = `2026-10-05`

Therefore benchmark recovery does not refresh stock history.

At minimum, the 110 securities ending 25-Sep remain explicitly stale relative to the latest complete-session horizon around the 6-Oct evaluation.

HDFCBANK reaches 5-Oct, but its final freshness determination still depends on the verified exchange calendar/evaluation-time rule. It is not promoted merely because benchmark data later succeeds.

---

## 6. Ten corporate-action exceptions

Raw close remains raw close. No existing price row has been relabelled or mutated.

### Ordinary mechanical split/bonus candidates

For an ordinary split:
- share multiplier = old face value / new face value;
- pre-event price multiplier = new face value / old face value.

For an ordinary equity bonus `a:b`:
- share multiplier = `(a+b)/b`;
- pre-event price multiplier = `b/(a+b)`.

These factors may be applied only if the selected stock-history window actually crosses the ex-date and historical security identity is proven.

| Symbol | Action / ex-date | Corporate-action ISIN → current ISIN | Mechanical factor candidate |
| --- | --- | --- | --- |
| CAMS | Split Rs10 → Rs2, 05-Dec-2025 | INE596I01012 → INE596I01020 | shares ×5; pre-event price ×0.2 |
| ECLERX | Bonus 1:1, 13-Mar-2026 | INE738I01010 → same | shares ×2; pre-event price ×0.5 |
| GOODLUCK | Bonus 2:1, 21-Aug-2026 | INE127I01024 → same | shares ×3; pre-event price ×1/3 |
| HDFCAMC | Bonus 1:1, 26-Nov-2025 | INE127D01025 → same | shares ×2; pre-event price ×0.5 |
| HDFCBANK | Bonus 1:1, 26-Aug-2025 | INE040A01018 → INE040A01034 | shares ×2; pre-event price ×0.5 |
| KARURVYSYA | Bonus 1:5, 26-Aug-2025 | INE036D01010 → INE036D01028 | shares ×6/5; pre-event price ×5/6 |
| KOTAKBANK | Split Rs5 → Re1, 14-Jan-2026 | INE237A01010 → INE237A01036 | shares ×5; pre-event price ×0.2 |
| TDPOWERSYS | Split Rs2 → Re1, 24-Aug-2026 | INE419M01019 → INE419M01035 | shares ×2; pre-event price ×0.5 |

The HDFCBANK and KARURVYSYA events predate the prospective benchmark request start of 1-Sep-2025. They should not be mechanically applied to a selected stock-history slice that starts after the ex-date; the exact selected 252-session stock window must be frozen first.

For changed-ISIN cases, symbol continuity is insufficient. Required lineage:
1. official pre-event symbol/ISIN record;
2. official corporate-action record with ex/record date and ratio;
3. official post-event symbol/ISIN record or ISIN-change/security-master evidence;
4. deterministic pre/post identity linkage;
5. exact raw-session set used;
6. factor and formula version;
7. before/after session anchors;
8. hash of the derived adjusted series if an adjusted series is created.

### Non-mechanical capital actions

| Symbol | Action / ex-date | Corporate-action ISIN → current ISIN | Treatment |
| --- | --- | --- | --- |
| HINDUNILVR | Demerger, 05-Dec-2025 | INE030A01027 → same | no generic multiplicative price factor |
| TVSMOTOR | Scheme of Arrangement — Bonus NCRPS 4:1, 25-Aug-2025 | INE494B01015 → INE494B01023 | not an ordinary equity bonus; no `1/(1+4)` shortcut |

HINDUNILVR demerger requires official entitlement/scheme terms and an approved valuation/adjustment method if continuous adjusted price is required.

TVSMOTOR requires the NCRPS entitlement terms, instrument/value treatment, scheme chronology and historical equity-identity lineage. It cannot use the ordinary equity-bonus formula.

Dividends remain unadjusted under a price-return/raw-close basis. A total-return treatment would require a different approved calculation contract.

---

## 7. Tests and verification

Committed tests cover:
- exact canonical identity;
- explicitly accepted legitimate aliases;
- ambiguity;
- wrong instrument type;
- ETF substitution rejection;
- missing identity / similarity non-authority;
- insufficient distinct sessions;
- duplicate sessions;
- request-window rejection;
- invalid OHLC;
- 400-row ceiling;
- 4,800-total ceiling;
- exact 400-day request window;
- independent counters;
- source-level preflight-before-history ordering;
- retained-master hash evidence;
- no-retry history path;
- authentication/history counter separation;
- calendar-canary rejection;
- split/bonus formulas;
- non-mechanical demerger/NCRPS treatment;
- independent stale-history state.

Provider-free runtime contract self-test:
**16/16 PASS**.

Final source-level Development assertions:
**all PASS**.

Final provider-free `P7_IC2_PLAN` on v9:
- HTTP 200;
- no external/provider call;
- no master artifact found;
- replacement master required;
- fresh grant required;
- old grant not reusable;
- all counters zero.

No provider campaign was executed during this repair.

---

## 8. One concrete resumption proposal

### Proposed next authorization: B0 only — replacement master capture + complete twelve-code preflight

Purpose:
recover reproducible provider capability evidence before any history request.

Action:
`P7_IC2_CAPTURE_MASTER`

Exact code list:
the twelve frozen Batch B codes above, in the same order.

Cutoff:
`2026-10-06`

Fresh grant:
required.

Grant action:
`P7_IC2_CAPTURE_MASTER`

Grant sentinel:
`P7_IC2_BATCH_B_MASTER_PREFLIGHT`

Old grant:
`34e7c8c0-6edf-4541-8051-b621499ae450` is consumed and must never be reset/reused.

External-request ceiling:
- Angel public instrument-master GET: **≤1**
- Angel authentication: 0
- Angel history: 0
- total external requests: **≤1**
- retries: **0**

Write ceiling:
- ≤1 audit `data_ingestion_runs` row;
- ≤1 retained `V1_4_ANGEL_INSTRUMENT_MASTER` source record;
- ≤1 instrument-master provider-usage event;
- market benchmark mapping writes: 0;
- benchmark history writes: 0;
- fundamental/review/snapshot/selection/lineage writes: 0.

Required output:
- source URL, retrieval time, payload SHA-256 and row count;
- exact/ambiguous/unavailable status for **all twelve codes**;
- exact matched alias/field/token for every exact match;
- non-authorizing similarity candidates for investigation only;
- resulting exact eligible set.

Stop after B0 and report.

### B1 is deliberately NOT proposed for immediate execution

History acquisition must not resume until B0 has produced the exact eligible set and the owner has reviewed it.

If all twelve are `EXACT_MATCH`, a later B1 approval can retain the original history order unchanged.

If any code is ambiguous/unavailable, skipping it and continuing later codes would change the old stop/scope behavior and requires explicit owner approval.

Prospective B1 ceiling after separate approval:
- retained master fetch: 0;
- authentication: ≤1;
- history requests: ≤12;
- total external requests: ≤13;
- retries: 0;
- ≤12 mapping upserts;
- ≤4,800 history rows total and ≤400/code;
- ≤13 request-accounting events;
- ≤1 audit run;
- no other evidence/materialization writes.

No history acquisition is authorized by this memo.

---

## Disposition

**Batch B code repair: COMPLETE / TESTED / DEPLOYED.**

**Batch B identity evidence: BLOCKED pending one retained replacement master fetch.**

**Current exact eligible history-acquisition set: 0/12 proven.**

**History-proof preparation repair: COMPLETE in code; existing proofs preserved; no superseding writes performed.**

**V1-4: IN PROGRESS / NOT PROVEN.**

**V1-5: NOT AUTHORIZED.**
