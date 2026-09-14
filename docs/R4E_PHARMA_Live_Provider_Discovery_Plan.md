# R4E — PHARMA_V1 Live Provider Discovery Plan

Status: **REPOSITORY PLAN / NOT DEPLOYED / NOT EXECUTED**

## 1. Purpose

R4E prepares the smallest safe live Trendlyne discovery needed to resolve the PHARMA_V1 historical source-contract gaps identified in R4D.

It does not authorize deployment or execution.

## 2. Why the next call is parameter discovery only

R4D proved that existing stored Trendlyne evidence contains useful current values and provider-computed aggregates, but it does not prove a canonical period-by-period historical series contract for the mandatory PHARMA_V1 metrics.

Therefore the next provider interaction should not fetch values across the 26 Pharma holdings. It should first discover the exact provider parameters capable of retrieving raw/comparable history.

The proposed Edge Function is:

`discover-trendlyne-pharma-history-contract`

It uses `search_parameters` only.

## 3. Strict reference cohort

The discovery is intentionally limited to one existing reference holding:

- security: `TORNTPHARM`
- application sector: `Pharma`
- verified Trendlyne instrument: `1409`

Before any provider call, the function must verify:

1. valid authenticated owner session;
2. portfolio ownership;
3. TORNTPHARM remains an open equity holding;
4. shared `current_security_enrichment_v1.sector` remains exactly `Pharma`;
5. latest matched Trendlyne identity remains instrument `1409`;
6. provider entitlement/retention configuration is trusted;
7. provider ingestion control is enabled;
8. budget reservation is granted.

If any check fails, provider calls must remain zero.

## 4. Maximum provider usage

R4E has six fixed search domains and therefore a hard maximum of **6 provider tool attempts**:

1. annual revenue history;
2. quarterly operating-margin history;
3. annual ROCE history;
4. annual PAT/EPS history;
5. annual CFO/capex/FCF history;
6. debt/cash/leverage/interest-cover history.

The function must reserve all six units before the first attempt through `reserve_provider_budget_v1` and settle consumed/failed/released units afterward.

It must also record each provider tool attempt through `record_provider_usage_event_v1`.

## 5. Discovery-only storage

A successful run may write only operational accounting and one raw discovery capture in `data_source_records`.

It must not write:

- `fundamental_observations`;
- `fundamental_observation_decisions`;
- research-profile assignments;
- `stock_score_runs`;
- recommendation rows;
- position-sizing rows;
- portfolio holdings/settings;
- application classification.

The raw capture exists to preserve evidence of the provider contract that was actually observed.

## 6. What the discovery must prove

For each mandatory historical domain, R4E should establish whether Trendlyne exposes period-specific fields that can support deterministic PortfolioAI history.

The acceptance questions are:

- What exact provider parameter/field identifies each period?
- Are annual/quarterly periods explicit and comparable?
- Can multiple years/quarters be retrieved without provider-computed aggregation?
- Are units stable across periods?
- Are missing values distinguishable from zero?
- Can returned records be given stable idempotent identities?
- Can the history be normalized without changing semantics?

A search result alone does not promote a source contract. It only decides whether a subsequent bounded value-retrieval pilot is justified.

## 7. Execution gate

Repository merge of this plan/function is not a production change.

The following remain separately approval-gated:

1. deployment of `discover-trendlyne-pharma-history-contract` to production;
2. execution of the live Trendlyne discovery run;
3. any later value-retrieval pilot;
4. any canonical ingestion/promotion of newly observed fields.

## 8. Expected next state

If a live R4E discovery is later approved and succeeds, the result should allow PortfolioAI to split the PHARMA historical metrics into:

- provider raw-series contract proven;
- provider aggregate only / insufficient;
- unsupported by Trendlyne and requiring another approved source.

Only after that classification should R3 evidence ingestion for Pharma be designed.
