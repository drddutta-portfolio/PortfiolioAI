# BANK V1-4 — bounded Oct-9 canary, source qualification and current materialization
**Date:** 2026-10-10
**Scope:** PR #124 / Development only. Production/main/V1-5 unchanged.
**Methodology:** current BANK V1 only. D1 and D2 remain **NOT APPROVED / NOT ACTIVATED**.

## 1. Exact-head verification baseline

The first corrected successor `83411c4bb237fa9bf87a2d968c5b740a2ed6752a` passed both:
- PortfolioAI Architecture Guard
- Banking V1-4 Full Verification

Subsequent implementation added the bounded maintenance canary and exact grant-scoped canonical targeting. Final exact-head CI is recorded separately at PR HEAD and must be PASS before this continuation is called repository-verified.

## 2. D1/D2 preserved as owner decisions

Decision package: `Banking_V1_4_D1_D2_Owner_Decision_Package_2026-10-10.md`.

- D1 proposed V2 only: M7 = **12/17**, M5 = **5/17**, M6 removed. V1 remains immutable. D1 is not active.
- D2 proposed current-review publication precision only: EXACT unchanged; DATE_ONLY may use conservative end-of-date IST bound; UNKNOWN may use first verified availability. `published_at` stays NULL when unknown. No historical availability inference, reporting-age renewal, source-freshness renewal or valuation look-ahead. D2 is not active.

## 3. Capital facts qualified from retained original bytes

Original GitHub/R2 PDF bytes were independently re-opened, rehashed and text re-extracted. Eight append-only child source facts were persisted as `SOURCE_FACT_QUALIFIED`, not ACCEPTED:

| Bank | Scope selected consistently with current NPA review basis | CET1 | Total CRAR | Publication precision |
|---|---|---:|---:|---|
| BANDHANBNK | STANDALONE | 17.54% | 18.15% | UNKNOWN |
| ICICIBANK | STANDALONE | 16.19% | 16.84% | UNKNOWN |
| KARURVYSYA | STANDALONE / no subsidiaries | 17.98% | 18.61% | UNKNOWN |
| SBIN | STANDALONE bank | 12.89% | 15.67% | UNKNOWN |

The original issuer URLs, PDF SHA-256 values, R2 object keys, exact source fragments, first verified availability and parent source-record IDs are retained. Consolidated alternatives for ICICI/SBI remain source provenance, not selected substitutes. These eight facts remain pending D2 precision approval plus ordinary canonical review; no publication timestamp was fabricated.

## 4. AUBANK SFB evidence completed

The retained official NSE Integrated Filing for 30-Jun-2026 provides exact exchange broadcast time and current SFB capital facts:
- `SFB_PRUDENTIAL_CET1 = 17.14%`
- `SFB_PRUDENTIAL_TOTAL_CRAR = 18.93%`
- Tier I = 17.14%, Tier II = 1.79%
- standalone; no consolidation requirement
- source explicitly ties CAR to RBI direction `DOR.CAP.REC.101/21-01-002/2025-26` dated 28-Nov-2025, as amended
- exact publication precision: **EXACT**, 25-Jul-2026 20:07:10 IST / 14:37:10Z

Two append-only SFB source-fact records were persisted as `SOURCE_FACT_QUALIFIED`. They are not relabelled Basel III. The owner-approved SFB mapping direction remains evidence/scoring-compatibility gated; the facts are not canonical ACCEPT until that existing mapping/review path is activated and passes.

## 5. Ownership, ratings/governance investigation

### Ownership
Five official NSE shareholding captures per bank are retained with hashes. Their XBRL semantics preserve domestic and foreign institutional categories separately. The canonical BANK requirement expects one `INSTITUTIONAL` / total-equity series. No approved derivation permits silently summing those categories. Therefore ownership remains fail-closed pending an aggregate original source or explicit derivation contract.

### Ratings
Retained issuer/annual-report/investor documents contain concrete rating candidates for several banks, including HDFCBANK, BANKBARODA, IDFCFIRSTB, INDIANB and KARURVYSYA. Current evidence is sufficient to identify candidate agencies/ratings, but not to prove a source-primary, period-matched previous/current pair for `RATING_TREND` across the 13-bank set. No rating ACCEPT was manufactured.

### Governance
Document presence or absence is not a favorable governance fact. No blanket no-event inference was made. Exact adverse/no-adverse event review remains source/event scoped.

## 6. Corporate-action conflicts resolved from existing evidence

P8 normalization/factor tables independently prove READY corporate-action treatments:
- KARURVYSYA 1:5 bonus, 26-Aug-2025: share factor 1.2; price back-adjustment factor 0.833333...
- HDFCBANK 1:1 bonus, 26-Aug-2025: share factor 2.0; price back-adjustment factor 0.5
- KOTAKBANK retained structural-treatment record proves provider continuity across the face-value split
- SBI retained actions are READY cash-dividend treatments

Existing V1-4 treatment records independently show Angel One history is already continuity adjusted around KVB, Kotak and HDFC structural actions. New append-only history proofs therefore use `PRICE_RETURN_CORPORATE_ACTION_ADJUSTED` and `corporateActionState=COMPLETE` for those affected stocks; no local price rewrite was performed.

After current canonical materialization, the five history requirements
`PRICE_MOMENTUM_6M`, `PRICE_MOMENTUM_12M`, `MAX_DRAWDOWN_1Y`, `VOLATILITY_RELATIVE`, and `RELATIVE_STRENGTH_12M`
are **FRESH for 13/13 banks**.

## 7. Historical valuation coverage qualified, but still insufficient

### Live Angel One history
Post-canary current stock history has 279 distinct sessions for most banks; HDFCBANK has 289. Latest completed session is 09-Oct-2026.

### R2 P8 archive
Both raw-price and adjusted-series R2 archives have:
- 2021: 0 trade-date partitions
- 2022: 0
- 2023: 61 (03-Oct to 29-Dec)
- 2024: 249
- 2025: 249
- 2026: 185 through 30-Sep
- total: **744 trade-date partitions**

This proves roughly three years of archived price-side evidence, not the required five-year distribution.

### Point-in-time financial denominators
Current `fundamental_observations` for the 13 banks do not supply a historical point-in-time M5/M7 denominator series:
- `PE_TTM`: 26 rows / 13 securities, **0 with period_end**
- `PBV_ADJUSTED_PROVIDER`: 26 rows / 13 securities, **0 with period_end**
- `PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT`: 38 rows / 12 securities, **0 with period_end**
- `EPS_DILUTED`: 1 row, **0 with period_end**

Therefore the approved ≥36/60 month-end requirement distributed across all five preceding years remains unproven. No current value is backfilled historically. M5 and M7 remain blocked.

## 8. Oct-8 accounting reconciled without backdating

No standard `data_ingestion_runs`, provider budget reservation, or usage event existed for the custom Oct-8 tail executor. Historical evidence nevertheless proves:
- consumed one-time grant;
- execution response: 1 authentication + 14 history requests;
- exactly 14 immutable Angel One tail captures;
- capture window 03:15:44Z–03:16:18Z on 09-Oct.

Append-only audited reconciliation:
- record kind `V1_4_PROVIDER_ACCOUNTING_RECONCILIATION`
- record ID `e7351429-65a3-4ac1-9cdd-a635f07b09f6`
- classification `RECONSTRUCTED_FROM_EXECUTION_RESPONSE_PLUS_IMMUTABLE_SOURCE_CAPTURES`
- native ledger settlement proven = false
- backdated usage events inserted = false

No historical accounting event was fabricated.

## 9. Legitimate fresh-grant path and actual bounded canary

The existing legitimate issuer is the owner-authorized Development control plane: append-only `P4_EXECUTION_GRANT` records under `OWNER_REVIEWED_CLASSIFICATION`, consumed exactly once by the existing P4 grant validator. No owner token or synthetic secret is required.

ANGEL_ONE provider control was configured:
- scheduler OFF
- 14 attempts/day
- 14 attempts/run
- rolling limit 14 / one day
- concurrency 1
- hard stop 100%
- provider quota status UNKNOWN (not invented)

A new separate executor `v14-bank-maintenance-canary` was deployed. A first grant was consumed by a pre-provider run-creation enum failure; zero provider requests/reservations occurred. The failure remains in the audit trail. The enum was repaired before replacement authorization.

### Successful canary
Development function v2 SHA `8a90d8b7afccb95e90c6f8ef5e8d03f41d49cc2aed23a03a41e0972afc633562`.

- run ID: `7ef5b788-1ff6-4810-b803-4eb7b1754979`
- reservation ID: `9dafe0dd-7eed-4ea0-9fea-6ac9ccbe2d10`
- session: **09-Oct-2026 only**
- authentication requests/responses: **1 / 1**
- history requests: **14**
- successful stock history calls: **13**
- successful benchmark calls: **1**
- retries: **0**
- failed provider units: **0**
- reserved units: **14**
- consumed units: **14**
- released units: **0**
- run status: **SUCCEEDED**
- source captures persisted: **14**
- post-write rows: **13 stock + 1 NIFTY_BANK**
- all exchange-local session dates independently read back as **09-Oct-2026**

The canary itself did not materialize readiness.

## 10. Current canonical validation/materialization

The existing single canonical materializer was narrowly extended so explicit security-ID writes require:
`targetingMode=P4_GRANT_SCOPED_SECURITY_IDS_V1`
and a P4 grant whose `security_id` scope exactly equals the ordered requested ID list. Pagination cannot be combined with explicit IDs.

Development canonical validator/materializer:
- v52 ACTIVE
- SHA `a83424952b5765e98160105002b23608faad801040829f432abaa1fa916763cf`

A 13-bank write initially persisted 10 selections and then hit a Supabase worker resource limit. No replay of those 10 occurred. Three attempted same-selection-run continuations failed safely because their evaluation/cutoff metadata differed; no selections were created by those failed attempts. KARURVYSYA, KOTAKBANK and SBIN were then each materialized under a fresh single-bank grant/selection run. HDFCBANK was rematerialized once after its independently proven bonus treatment superseded the stale INCOMPLETE proof.

Final independent readback:
- **13/13 current snapshots created on 10-Oct-2026**
- **13/13 current selections persisted**
- **13 REVIEW_REQUIRED**
- **0 CONFLICTING**
- **0 READY**
- current READY value remains **₹0 / ₹2,05,138.62**
- current history requirements: **5/5 FRESH for 13/13 banks**
- canonical materialization provider calls: **0**

This is a real improvement from the starting 11 REVIEW_REQUIRED / 2 CONFLICTING state. It is not a READY claim.

## 11. Accepted vs qualified facts

Canonical accepted reviews currently retained:
- GROSS_NPA: **13 ACCEPTED**
- NET_NPA: **13 ACCEPTED**
- total existing accepted NPA requirements: **26**

New current-source qualification in this continuation:
- ordinary-bank CET1/CRAR source facts: **8 SOURCE_FACT_QUALIFIED**
- AUBANK SFB capital source facts: **2 SOURCE_FACT_QUALIFIED**
- new financial ACCEPT reviews from those 10 facts: **0**, because D2 is not approved and AUBANK mapping remains separately activation/review gated.

No other factual requirement is represented as accepted merely because a source route/document exists.

## 12. Remaining gates after executed work

Still unresolved for READY:
- M1 NIM TTM and M4 audited ROA source-qualified current facts across the cohort;
- M2/M3 current admission for retained ordinary-bank capital PDFs pending D2 where publication is UNKNOWN;
- AUBANK SFB mapping activation/review despite exact current source facts;
- M5/M7 genuine five-year point-in-time valuation evidence;
- M6 remains mandatory under V1 unless D1 is explicitly approved;
- institutional ownership aggregate semantics;
- exact source-primary external rating + trend evidence;
- governance event evidence;
- other current required financial growth/ROE inputs as shown by canonical item states.

D1/D2 owner approval remains the next methodology/policy decision boundary. Production, main, frozen membership and V1 history remain unchanged.
