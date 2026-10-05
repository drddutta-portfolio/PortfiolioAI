# V1-4 Action B — consolidated frozen-cohort remediation proposal

Date: 5 October 2026. **PROPOSAL ONLY / NO PROVIDER OR DATA-WRITE AUTHORIZATION IMPLIED.** V1-5 remains unauthorized.

This matrix uses the **now-persisted** blocker inventory from Action A run `4d6ef6d6-ca7c-4fbc-8362-827edcfc6075`, with evaluation/source cutoff **2026-10-05T19:25:54.019754+00:00**. It is a specific remediation plan, not another general audit gate. All 111 original members and frozen values stay in the denominator. Current cohort: **111 REVIEW_REQUIRED / 0 READY**. No blocker was removed by Action A.

## Family matrix

Counts are distinct frozen members within each family; families overlap. Item counts are requirement rows, not unique source observations, provider requests or physical writes.

| Family | Affected members / item rows | Cache and acquisition conclusion | Supported source / adapter limitation | Proposed call / write budget | Readiness effect |
|---|---:|---|---|---|---|
| 1. Missing mandatory financial/fundamental inputs | **103 / 389** parameter/local-derivation requirements | No approved candidate for these requirements in the active materializer. Raw structured cache exists for 109 cohort members; missing mapping is not proof that every field needs reacquisition. Cache extraction first; external acquisition only for a named field proven absent/unusable. | TRENDLYNE_MCP parameter tool exists; issuer filings are the factual alternative. Current detailed writer implements seven exact labels and omits dated/scope metadata; most sector-specific/composite fields lack a proven ingest route. Screener is not implemented by the inspected refresh adapters. | Initial cache review: **0 calls, 0 DB writes**. Campaign **NOT BUDGETABLE YET**: requires deduplicated field/period/source requests and approved response parser. 2,871 required period slots are not 2,871 writes/calls. | Can unblock evidence only when actual required primitives/history are present and validated; no full-endpoint promise. |
| 2. Dated reporting periods / period types | **93 / 227** | 96 label-aggregate rows + 84 invalid-period rows + 47 period-type rows. Existing labels/values are candidates, not dated history. Parse exact dates only when explicitly evidenced; never infer years from growth-horizon labels. | Cached Trendlyne responses and source-cited annual/quarterly filings. Existing general refresh writes null reporting dates; historical discovery queries exist for a Pharma reference, but are discovery-only and not a 45-profile ingestion contract. | **0 calls / 0 DB writes** for initial cache contract/extraction. Future append budget = distinct validated primitive/period/scope/source rows actually recovered; currently unbounded/undeclared, hence not approved. | Necessary for evidence READY; refresh alone cannot repair a parser/period contract. |
| 3. Unit/currency/consolidation/source/metric contracts | **108 / 405** | 350 legacy normalized rows + 53 unreviewed-contract rows + 2 unit mismatches. 284 unique raw observation candidates retained in the cohort: 272 missing end dates, 256 UNKNOWN scope. 241 distinct cached source-record references back the numeric/ownership legacy-review rows. These figures overlap. | Existing metric definitions and source-cited raw payloads. Review selection authority, priority, actual units/scales and consolidated/standalone basis. Do not set REVIEWED flags or fill UNKNOWN from a guess. | Initial review **0 calls / 0 DB writes**. Later normalization/definition amendments need explicit field-level append/change budget; 284 candidates are an inspection bound, not permission to rewrite 284 rows. | Can unblock valid cached inputs; unknown or incompatible scope/units remain blocked. |
| 4. Document/business-model/governance review | **110**; **245 review rows + 29 missing rows** | 108 members have retained review candidates; 19 have missing document-channel requirements (union 110). 123 distinct selected candidate source-record references; document-search cache has 185 records across 109 members. Titles/keyword hits do not prove the assertions, and document bodies were not retained by the refresh writer. | Trendlyne `get_document_search_results` supports discovery only; original issuer/NSE filings are factual sources. Document-body capture/reviewer extraction is not implemented by the inspected refresh writer. | Cache/reference review **0 calls / 0 DB writes**. Discovery/body retrieval budget must be by unique required documents, not securities or keywords; count/availability not established. No campaign allowance proposed. | Reviewed, cited facts can unblock requirements. Another document-search call does not itself make evidence READY. |
| 5. Benchmark mapping/history | **32 / 32** directly blocked by mapping | 20 members require nine currently unbound NIFTY-like authority codes; 12 carry PHARMA_V1_SUBPROFILE_AUTHORITY with no NIFTY code. The latter need approved subprofile-specific authority resolution, not a fabricated index. Nine other benchmark rows reached history validation and remain in families 6/7. | Existing `market_benchmarks` authority and Angel One token/candle contract; preserve exact profile benchmark authority. Generic alternate indices/peer baskets cannot substitute. | Review nine source-binding decisions and the Pharma subprofile-authority resolver: **0 calls / 0 DB writes**. Nine names are not nine proven instruments or authorized mapping writes. Later calls/writes depend on exact approved bindings and deduplicated missing ranges; no acquisition budget yet. | Removes mapping blocker only; aligned history and adjustment semantics still required. |
| 6. Stock/benchmark calendar alignment | **109 / 273** joint history-validation rows | Stored candles exist; row counts cannot establish valid exchange sessions, matched stock/benchmark dates or staleness. No public exchange-calendar table was found. Cache may avoid candle reacquisition after calendar proof. | Official exchange calendar plus cached Angel One candles and approved benchmark mapping. No implemented calendar/alignment authority was proven. | Contract/validator engineering and cache review **0 calls / 0 DB writes** initially. Calendar import/aligned-derived rows need an explicit source/version/date-range/count proposal before writes. No candle refresh budget until actual gaps are known. | Can unblock usable history after all semantics are proven. Provider refresh cannot replace calendar/validation engineering. |
| 7. Corporate-action adjustment semantics | **109 / same 273 joint rows** | Same rows as family 6, not 273 extra blockers. Existing P8 corporate-action/factor/history assets are preserved, but no active current-pipeline adjustment methodology was proven. Cached daily candles are predominantly unadjusted. | Issuer/exchange corporate-action facts with reviewed price-adjustment convention. Existing Angel One history writer sets adjusted_close null. Reuse appropriate preserved assets only through an approved current V1 contract; do not execute paused P8. | Initial contract/cache review **0 calls / 0 DB writes**. Adjustment-factor/corporate-action acquisition and derived-history writes remain **NOT BUDGETABLE** until source lineage, convention and covered events/date ranges are proven. | Necessary where approved history requires adjustments. More raw candles do not resolve adjustment semantics. |
| 8. Stale evidence refresh | **26 members / 47 unique expired candidate observations**; **0 primary STALE snapshot states** | Expired candidates are masked by earlier contract/date failures. This is input-expiry evidence, not proof that all 26 need calls: a fresh alternative might exist in cache. History freshness cannot be certified before calendar validation. Original two STALE manifest labels are preserved. | Field-compatible source already established for that primitive; current general Trendlyne refresh still lacks required metadata. | Cache alternative selection **0 calls / 0 DB writes** initially. Only then count unique expired mandatory fields/periods without fresh alternatives and supported calls; no 26-stock refresh budget. | May unblock truly stale requirements; metadata and historical gaps persist unless independently solved. |
| 9. Factual methodology exception | **1 / 1** | Preserved factual-review exception; no primary subprofile may be guessed. | Owner-reviewed factual business/segment evidence under the existing approved methodology authority. | **0 provider calls / 0 DB writes** in the proposal. Any eventual assignment record amendment requires its exact approved factual decision; methodology requirements must not change. | Can resolve the factual exception; not a provider-volume problem or automatic readiness pass. |
| 10. Structurally insufficient listing/history | **1 / 2** requirements; **190 distinct sessions vs minimum 252** | Observed short history is proven; structural listing insufficiency is **NOT PROVEN**. Distinguish an incomplete cached request window from actual listing age using listing/session evidence. Do not fabricate the missing 62 sessions. | Canonical listing facts, official exchange calendar and exact Angel One history windows. Existing refresh-market-history supplies raw candles only. | Cache/listing review **0 calls / 0 DB writes**. If genuine missing ranges exist, budget exact API chunks and returned candle rows. If listing age is structurally short, provider budget is **0** because a refresh cannot create pre-listing history. | May remain explicitly INSUFFICIENT; no lowering the minimum or excluding the member. |
| 11. Ownership/governance-series metadata | **110**; **107 legacy-review rows + 3 missing rows** | 107 normalized ownership-series rows lack the reviewed metadata contract; three missing rows require at least four quarters each. Raw ownership cache: 123 records across 109 members. | Trendlyne `get_ownership_deals_insider_sast` supports shareholding retrieval; canonical quarter dates, entity identity, class/denominator, unit, source provenance and reviewed selection remain necessary. | Cache parsing/review **0 calls / 0 DB writes** initially. Later budget deduplicated missing quarter/class series using verified identities and supported exact responses; no ownership campaign approved. | Can unblock ownership evidence once valid series exist; new provider text is not automatically READY. |

Family 1 excludes the 29 document-channel and three ownership-channel missing rows; together they reconcile the **421 REQUIRED_EVIDENCE_MISSING rows / 103 members**. Family 2's 227 rows and family 3's 405 rows are reason-unions, not new source rows. The appendix covers **256 blocked requirement codes and 1,606 non-FRESH requirement rows**; the 111 lineage rows and two FRESH requirement rows are omitted. None of these counts can be summed into a member denominator.

## Exact input contracts and reviewed-write rules

For each primitive retain: canonical security ID; exact requirement/metric; unchanged profile/methodology and minimum; valid reporting start/end/type; actual source period anchors; consolidated/standalone basis; accounting standard where required; numeric decimal string/value kind; unit/scale and currency; source provider/record/field; publication/retrieval timestamps; evaluation/source cutoff; reviewed definition and source priority; explicit freshness bound. Preserve null/missing/zero distinctions. Never pool incompatible metrics, periods, scopes, units or sources to meet a minimum.

Observed candidate metric codes are `CFO_ANNUAL`, `EPS_GROWTH_YOY`, `NET_PROFIT_TTM`, `OPERATING_PROFIT_QUARTER`, `OPM_TTM`, `PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT`, `PE_TTM`, `REVENUE_ANNUAL`, `REVENUE_TTM`, `ROCE_ANNUAL`, `ROE_ANNUAL`. Presence is not readiness. Review aliases and derived semantics against the approved evidence requirement: fair-price implied upside is not itself a PE multiple; growth-horizon percentages are not distinct historical observations. Composite requirements need their actual constituent primitives and reproducible derivation, not generic label substitution.

Document contracts additionally need original document identity/hash/link, issuer identity, relevant dated page/section/citation, fact extraction, explicit factual reviewer/decision lineage and method-specific assertion. Keyword presence is only a discovery hint. All cited assets must satisfy applicable retention/terms restrictions.

History contracts need exact instrument and benchmark mappings, exchange/session calendar version, date-window/minimum distinct sessions, consistent adjustment convention, corporate-action event/factor authority and reproducible factors, price/session alignment, publication/retrieval cutoffs and trading-session freshness. A price count, null adjusted_close or guessed no-event assumption cannot satisfy this contract.

Original records remain immutable. Any later reviewed normalization must use approved append/correction/selection mechanisms with explicit supersession/lineage. No changes to accounting, roles, release denominator, methodology requirements or freshness/history standards.

### Benchmark authority detail

The nine unbound codes are `NIFTY_CAPITAL_GOODS`, `NIFTY_CONSUMER_DURABLES`, `NIFTY_CONSUMER_SERVICES`, `NIFTY_ENERGY_CONTEXT`, `NIFTY_FINANCIAL_SERVICES_EX_BANK`, `NIFTY_OIL_GAS`, `NIFTY_SERVICES_SECTOR`, `NIFTY_TELECOM`, `NIFTY_TRANSPORTATION_LOGISTICS`. Their names alone do not prove live tradable index identities. `NIFTY_FINANCIAL_SERVICES` and `NIFTY_METAL` already have verified mappings but occur in composite requirements with another unbound authority. The 12 Pharma members carry `PHARMA_V1_SUBPROFILE_AUTHORITY`; implement/review interpretation against the already-approved subprofile contract rather than assigning an index or changing methodology requirements. This separates authority-resolution engineering from genuine history acquisition.

## Provider and write budget decision

**Recommendation: do not authorize a full-cohort acquisition campaign yet.** The actionable first Action B package is contract/parser/validator engineering plus **targeted cached-field and document-reference review**, with **zero external provider calls and zero runtime database writes**. This is proposed work, not performed by Action A.

The existing general refresh makes an overview request followed by detailed-parameter, ownership and document-search requests. Its detailed writer recognizes exactly seven labels: annual ROCE, TTM OPM, promoter pledge, gross NPA, net NPA, EPS quarter YoY growth and fair-price 5Y-PE implied upside. Only **21 currently missing requirement rows across 21 members** map to that narrow detailed label set: two ROCE, ten EPS YoY and nine operating-margin requirements. The current writer nevertheless stores null dates and UNKNOWN scope, so even these 21 are **not executable readiness-remediation jobs** through that path. A four-call ceiling per security is not a valid cost model for the 389 missing parameter requirements.

The approved evidence planner's channels/hints in the appendix identify intended routing, **not proven provider field availability or implemented ingestion support**. The existing Pharma historical-discovery module defines three narrow query families using a supported parameter tool, but they are reference-specific discovery queries, not permission to call them or proof of an all-profile feed. Do not repeat existing discovery if its retained output already answers the specific missing-field question.

A provider/write budget becomes approval-ready only after a per-field plan specifies:
1. Frozen member and exact missing mandatory primitive/period; cached source/alternative inspected; factual reason it cannot be used.
2. Supported provider tool/endpoint and exact query/instrument/domain/window; approved source and response parser; complete required metadata.
3. Deduplicated requests. One shared benchmark request is counted once; retries, pagination/chunk boundaries and identity checks are explicit. Discovery calls and successful canonical ingestion calls are separate.
4. Maximum returned source rows, observation/document/factor/derived rows, run/control/usage/grant records and later snapshot/item/selection/lineage writes, named by table. Reuse existing capacities; do not introduce schema or R2 writes under this proposal.
5. Expected requirement changes and remaining engineering/factual/structural blockers. Stop if the response cannot fulfill the contract; retain not-ready states.

At present a numeric external campaign/write ceiling would be invented. The matrix therefore explicitly records **NOT BUDGETABLE / NOT AUTHORIZED**, rather than concealing unsupported fields behind an estimate. The 2,871 financial period slots and 12 missing ownership-quarter slots are overlapping logical requirements; they are not physical write budgets.

After reviewed cache normalization/source acquisition is separately approved and performed, a **new named evaluation/source-cutoff contract** is required for its validated snapshot materialization. Do not change Action A's immutable cutoff or let newly fetched post-cutoff sources enter its run.

## Objective acceptance and stop

A family repair may make individual evidence requirements FRESH. Evidence-snapshot READY still requires all applicable mandatory evidence contracts to pass; full usable intelligence additionally requires the frozen deterministic assessment/eligibility/context/Fit-Sizing-Exit/advisory-lineage endpoint in its separately authorized gates. No family or provider request guarantees a member reaches that endpoint.

Retain all 111 attempts and their frozen values, all 239 equities and all 248 holdings. Release minimum remains 100 same members AND 119,327,127 paise from those successful members; frozen aggregate remains 132,585,696 paise. Structurally short, factual-review and unsupported-source cases remain explicit blockers. No HOLD fallback or denominator edits.

**Stop after this proposal. No Action B implementation, provider execution or V1-5 is authorized by its publication.** Successful isolated restore remains mandatory at V1-9.

## Requirement-level contract inventory

Minimums below are copied from the selected Action A requirement items, not newly proposed standards. Channel names come from the preserved evidence planner; they are intended source families, not acquisition guarantees. Requirements with multiple minimums retain their own profile-specific minimum. Every row retains the exact current reason for the relevant member/requirement.

| Requirement code | Frozen members / item rows | Approved minimum(s) | Proposed channel(s), not source proof | Current reason(s) |
|---|---:|---|---|---|
| `ADVANCES_GROWTH_YOY` | 12 / 12 | 1 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `ALM_MISMATCH` | 3 / 3 | 252 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `APPROVED_BENCHMARK_HISTORY_252D` | 41 / 41 | 252 | ANGEL_ONE_BENCHMARK_HISTORY, LOCAL_DERIVATION | ADJUSTMENT_CALENDAR_ALIGNMENT_NOT_PROVEN, BENCHMARK_MAPPING_NOT_PROVEN |
| `ASSET_OR_FRANCHISE_DIVERSIFICATION` | 3 / 3 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `ASSET_QUALITY` | 3 / 3 | 252 | TRENDLYNE_PARAMETERS | DATED_REPORTING_PERIODS_NOT_PROVEN |
| `ASSET_SERVICE_MARGIN_QUALITY` | 1 / 1 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `AUM_ADVANCES_DISBURSEMENT_GROWTH` | 3 / 3 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `AUM_CLIENT_ASSET_AND_EARNINGS_GROWTH` | 4 / 4 | 1 | TRENDLYNE_PARAMETERS | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `BORROWER_OR_SEGMENT_GROWTH` | 3 / 3 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `BRAND_DISTRIBUTION_AFTERSALES` | 2 / 2 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `BRAND_DISTRIBUTION_CATEGORY_DURABILITY` | 5 / 5 | 1 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `BRAND_NETWORK_CUSTOMER_REPEAT` | 3 / 3 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `BRAND_NETWORK_DENSITY` | 2 / 2 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `BRAND_OR_HOME_TEXTILE_POSITION` | 1 / 1 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `BRAND_TRUST_NETWORK_DISTRIBUTION` | 3 / 3 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `BUSINESS_DURABILITY` | 35 / 35 | 1 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `CAPACITY_DISCIPLINE` | 2 / 2 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `CAPACITY_GENERATION_AND_ASSET_MIX_GROWTH` | 1 / 1 | 1 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `CAPACITY_UTILISATION` | 1 / 1 | 3 | TRENDLYNE_DOCUMENTS | REQUIRED_EVIDENCE_MISSING |
| `CAPEX` | 12 / 12 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `CAPITAL_ACCESS` | 2 / 2 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `CAPITAL_ADEQUACY` | 3 / 3 | 3 | TRENDLYNE_PARAMETERS | DATED_REPORTING_PERIODS_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `CAPITAL_ADEQUACY_RATIO` | 13 / 13 | 1 | TRENDLYNE_PARAMETERS | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `CAPITAL_ALLOCATION` | 2 / 2 | 8 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `CAPITAL_EFFICIENCY_OR_BURN_EFFICIENCY` | 1 / 1 | 1 | TRENDLYNE_PARAMETERS | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN |
| `CAPITAL_MARKETS_DURABILITY` | 4 / 4 | 1 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `CATEGORY_AND_MARKET_RISK` | 5 / 5 | 1 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `CATEGORY_POSITION` | 2 / 2 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `CET1_RATIO` | 13 / 13 | 1 | TRENDLYNE_PARAMETERS | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `CFO_FCF_AND_WORKING_CAPITAL` | 10 / 10 | 1 | TRENDLYNE_PARAMETERS | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `CFO_FCF_CAPEX_CONVERSION` | 1 / 1 | 3 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | REQUIRED_EVIDENCE_MISSING |
| `CFO_FCF_CONVERSION` | 10 / 10 | 1, 3 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | DATED_REPORTING_PERIODS_NOT_PROVEN, NORMALIZED_INPUT_CONTRACT_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `CFO_FCF_INVENTORY_WORKING_CAPITAL` | 3 / 3 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `CFO_FCF_OR_CASH_BURN` | 1 / 1 | 1 | TRENDLYNE_PARAMETERS | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN |
| `CFO_FCF_RECEIVABLES` | 2 / 2 | 3 | TRENDLYNE_DOCUMENTS | REQUIRED_EVIDENCE_MISSING |
| `CFO_FCF_WORKING_CAPITAL` | 5 / 5 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `CFO_FCF_WORKING_CAPITAL_OR_BURN` | 2 / 2 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `CFO_OR_FCF_AND_PROJECT_CASH_CONVERSION` | 2 / 2 | 1 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN |
| `CFO_OR_FCF_CONVERSION` | 29 / 29 | 1, 3 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | METRIC_CONTRACT_NOT_REVIEWED |
| `CFO_OR_FCF_CONVERSION_AND_WORKING_CAPITAL` | 5 / 5 | 1 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN |
| `CFO_OR_FCF_CONVERSION_THROUGH_CYCLE` | 8 / 8 | 1, 3 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | DATED_REPORTING_PERIODS_NOT_PROVEN, NORMALIZED_INPUT_CONTRACT_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `CLIENT_CONCENTRATION_LABOUR_REGULATION` | 1 / 1 | 252 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `CLIENT_CONCENTRATION_WAGE_FX_AUTOMATION` | 2 / 2 | 252 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `CLIENT_DIVERSIFICATION` | 1 / 1 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `CLIENT_RETENTION` | 3 / 3 | 3, 8 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `COLLECTION_OR_TREATMENT_EFFICIENCY` | 2 / 2 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `COMMODITY_CYCLE_DRAWDOWN_RISK` | 5 / 5 | 252 | ANGEL_ONE_STOCK_HISTORY, LOCAL_DERIVATION | ADJUSTMENT_CALENDAR_ALIGNMENT_NOT_PROVEN |
| `COMMODITY_POLICY_COUNTERPARTY_TRANSITION` | 1 / 1 | 252 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `COMMODITY_POLICY_ENERGY_TRANSITION_MINING` | 1 / 1 | 252 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `COMMODITY_POLICY_TRANSITION_RISK` | 1 / 1 | 1 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `CONCESSION_CONTRACT_DURATION` | 2 / 2 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `CONTRACT_RENEWAL` | 1 / 1 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `CONTRIBUTION_MARGIN_OR_UNIT_ECONOMICS` | 1 / 1 | 1 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `CONTRIBUTION_OPERATING_MARGIN_NETWORK_EFFICIENCY` | 1 / 1 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `COST_POSITION` | 1 / 1 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `COTTON_INPUT_FX_DEMAND_CYCLE` | 1 / 1 | 252 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `COUNTERPARTY_RECEIVABLE_REGULATORY_PROJECT` | 2 / 2 | 252 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW, REQUIRED_EVIDENCE_MISSING |
| `CUSTOMER_CONCENTRATION_RECEIVABLE_REGULATION` | 1 / 1 | 252 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `CUSTOMER_DIVERSIFICATION` | 2 / 2 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `CUSTOMER_RETENTION` | 2 / 2 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `CYCLE_NORMALIZED_EARNINGS_QUALITY` | 2 / 2 | 1, 8 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | REQUIRED_EVIDENCE_MISSING |
| `DELIVERY_SCALE` | 2 / 2 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `DEPOSITS_GROWTH_YOY` | 12 / 12 | 1 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `DISCRETIONARY_DEMAND` | 3 / 3 | 252 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `DISTRIBUTION_CUSTOMER_PRODUCT_MOAT` | 2 / 2 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `DIVIDEND_YIELD` | 1 / 1 | 3 | TRENDLYNE_PARAMETERS | DATED_REPORTING_PERIODS_NOT_PROVEN |
| `DIVIDEND_YIELD_CONTEXT` | 1 / 1 | 3 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | REQUIRED_EVIDENCE_MISSING |
| `DOMAIN_DEPTH` | 2 / 2 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW, REQUIRED_EVIDENCE_MISSING |
| `DRAWDOWN_VOLATILITY_RISK` | 43 / 43 | 252 | ANGEL_ONE_STOCK_HISTORY, LOCAL_DERIVATION | ADJUSTMENT_CALENDAR_ALIGNMENT_NOT_PROVEN, DISTINCT_SESSIONS_INSUFFICIENT |
| `EBITDA_PER_TONNE_OR_MARGIN` | 1 / 1 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `ENERGY_FREIGHT_CYCLE_CARBON` | 1 / 1 | 252 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `EPS_GROWTH_MULTI_PERIOD` | 12 / 12 | 3 | TRENDLYNE_PARAMETERS | DATED_REPORTING_PERIODS_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `EPS_GROWTH_YOY` | 13 / 13 | 1 | TRENDLYNE_PARAMETERS | REPORTING_PERIOD_INVALID, REQUIRED_EVIDENCE_MISSING |
| `EV_AUM_OR_PRICE_AUM_WHEN_APPLICABLE` | 3 / 3 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `EV_EBITDA` | 29 / 29 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `EV_EBITDA_FOR_RENTAL` | 1 / 1 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `EV_EBITDA_NORMALIZED` | 4 / 4 | 3 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | REQUIRED_EVIDENCE_MISSING |
| `EV_EBITDA_OR_EV_SALES_BY_MATURITY` | 2 / 2 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `EV_EBITDA_PER_TONNE` | 1 / 1 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `EXTERNAL_LONG_TERM_RATING` | 13 / 13 | 1 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW, REQUIRED_EVIDENCE_MISSING |
| `EXTERNAL_RATING` | 3 / 3 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `FCF_CONVERSION` | 8 / 8 | 1, 3 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `FCF_OR_CASH_BURN` | 1 / 1 | 1 | TRENDLYNE_PARAMETERS | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN |
| `FCF_YIELD` | 33 / 33 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `FCF_YIELD_NORMALIZED` | 3 / 3 | 3 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | DATED_REPORTING_PERIODS_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `FINTECH_PLATFORM_DURABILITY` | 1 / 1 | 1 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `FRANCHISE_DIVERSIFICATION` | 2 / 2 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `FRANCHISE_OR_DISTRIBUTION` | 3 / 3 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW, REQUIRED_EVIDENCE_MISSING |
| `FRANCHISE_STORE_ECONOMICS` | 3 / 3 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `FUEL_COMPETITION_CLIENT_CONCENTRATION` | 1 / 1 | 252 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `FUNDING_DIVERSIFICATION` | 3 / 3 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `GNPA_NNPA_CREDIT_COST` | 3 / 3 | 8 | TRENDLYNE_PARAMETERS | DATED_REPORTING_PERIODS_NOT_PROVEN |
| `GOLD_PRICE_INVENTORY_REGULATION` | 3 / 3 | 252 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `GOVERNANCE_EVENT_REVIEW` | 41 / 41 | 4 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW, REQUIRED_EVIDENCE_MISSING |
| `GOVERNANCE_EVENT_SIGNAL` | 13 / 13 | 1 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW, REQUIRED_EVIDENCE_MISSING |
| `GROSS_AND_OPERATING_MARGIN_HISTORY` | 5 / 5 | 1 | TRENDLYNE_PARAMETERS | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN |
| `GROSS_CONTRIBUTION_OPERATING_MARGIN_HISTORY` | 2 / 2 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `GROSS_NPA` | 13 / 13 | 1 | TRENDLYNE_PARAMETERS | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `GROSS_OPERATING_MARGIN_HISTORY` | 5 / 5 | 8 | TRENDLYNE_PARAMETERS | REPORTING_PERIOD_INVALID |
| `HOLDCO_CASH_DIVIDEND_COVERAGE` | 2 / 2 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `HOLDCO_DISCOUNT_LEVERAGE_COMPLEXITY` | 2 / 2 | 252 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `HOLDCO_NET_DEBT_AND_LIQUIDITY` | 2 / 2 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW, REQUIRED_EVIDENCE_MISSING |
| `HOSPITAL_OPERATING_DURABILITY` | 2 / 2 | 1 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `INPUT_COST_DEMAND_CAPEX` | 2 / 2 | 252 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `INPUT_COST_DEMAND_COMPETITION` | 2 / 2 | 252 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `INSTITUTIONAL_OWNERSHIP_TREND_4Q` | 13 / 13 | 4 | TRENDLYNE_OWNERSHIP | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `INSURANCE_CASH_OR_EARNINGS_QUALITY` | 1 / 1 | 1 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `INSURANCE_DURABILITY` | 1 / 1 | 1 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `INVENTORY_COMPETITION_UNIT_ECONOMICS` | 2 / 2 | 252 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `LAND_BANK_LOCATION_BRAND_EXECUTION` | 1 / 1 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `LEVERAGE` | 3 / 3 | 3 | TRENDLYNE_PARAMETERS | DATED_REPORTING_PERIODS_NOT_PROVEN |
| `LEVERAGE_APPROVAL_EXECUTION_CYCLE` | 1 / 1 | 252 | TRENDLYNE_PARAMETERS | DATED_REPORTING_PERIODS_NOT_PROVEN |
| `LIMESTONE_RESERVES_COST_POSITION_DISTRIBUTION` | 1 / 1 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `LIQUIDITY_ALM` | 3 / 3 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `LOOK_THROUGH_EARNINGS_AUM_GROWTH` | 2 / 2 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `LOOK_THROUGH_EARNINGS_YIELD` | 2 / 2 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `LOOK_THROUGH_ROE_ROIC` | 2 / 2 | 3 | TRENDLYNE_PARAMETERS | DATED_REPORTING_PERIODS_NOT_PROVEN |
| `MARKET_DRAWDOWN` | 41 / 41 | 252 | ANGEL_ONE_STOCK_HISTORY, LOCAL_DERIVATION | ADJUSTMENT_CALENDAR_ALIGNMENT_NOT_PROVEN |
| `MAX_DRAWDOWN_1Y` | 13 / 13 | 252 | ANGEL_ONE_STOCK_HISTORY, LOCAL_DERIVATION | ADJUSTMENT_CALENDAR_ALIGNMENT_NOT_PROVEN |
| `METALS_BUSINESS_DURABILITY` | 5 / 5 | 1 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `METHODOLOGY_ASSIGNMENT` | 1 / 1 | 1 | OWNER_FACTUAL_REVIEW | METHODOLOGY_REVIEW_REQUIRED |
| `MOMENTUM_12M_RELATIVE` | 56 / 56 | 252 | ANGEL_ONE_STOCK_HISTORY, LOCAL_DERIVATION | ADJUSTMENT_CALENDAR_ALIGNMENT_NOT_PROVEN, DISTINCT_SESSIONS_INSUFFICIENT |
| `NAV_DISCOUNT_PREMIUM` | 1 / 1 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `NET_CASH_LEVERAGE_FUNDING_RUNWAY` | 2 / 2 | 3 | TRENDLYNE_PARAMETERS | DATED_REPORTING_PERIODS_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `NET_CASH_OR_FUNDING_RUNWAY` | 1 / 1 | 1 | TRENDLYNE_PARAMETERS | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN |
| `NET_CASH_OR_LEVERAGE` | 49 / 49 | 1, 3 | TRENDLYNE_PARAMETERS | DATED_REPORTING_PERIODS_NOT_PROVEN, NORMALIZED_INPUT_CONTRACT_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `NET_DEBT_AND_INTEREST_COVERAGE` | 18 / 18 | 1, 3 | TRENDLYNE_PARAMETERS | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `NET_DEBT_AND_INTEREST_COVERAGE_MID_CYCLE` | 5 / 5 | 1 | TRENDLYNE_PARAMETERS | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `NET_DEBT_FIXED_CHARGE_COVERAGE` | 3 / 3 | 3 | TRENDLYNE_PARAMETERS | DATED_REPORTING_PERIODS_NOT_PROVEN |
| `NET_DEBT_INTEREST_COVERAGE` | 6 / 6 | 3 | TRENDLYNE_PARAMETERS | DATED_REPORTING_PERIODS_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `NET_DEBT_INTEREST_COVERAGE_AND_REFINANCING` | 2 / 2 | 1 | TRENDLYNE_PARAMETERS | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN |
| `NET_DEBT_INTEREST_COVERAGE_RECEIVABLES` | 1 / 1 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `NET_DEBT_INVENTORY_FUNDING` | 3 / 3 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `NET_DEBT_TO_EQUITY_INTEREST_COVERAGE_LIQUIDITY` | 1 / 1 | 3 | TRENDLYNE_PARAMETERS | DATED_REPORTING_PERIODS_NOT_PROVEN |
| `NET_NPA` | 13 / 13 | 1 | TRENDLYNE_PARAMETERS | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `NET_PROFIT_GROWTH_MULTI_PERIOD` | 12 / 12 | 3 | TRENDLYNE_PARAMETERS | REPORTING_PERIOD_TYPE_NOT_PROVEN |
| `NETWORK_DENSITY_CLIENT_DIVERSIFICATION_TECH` | 1 / 1 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `NIM_OR_SPREAD_HISTORY` | 3 / 3 | 8 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | REQUIRED_EVIDENCE_MISSING |
| `NIM_TTM` | 13 / 13 | 1 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `OCCUPANCY_TRAFFIC_VOLATILITY` | 3 / 3 | 252 | ANGEL_ONE_STOCK_HISTORY, LOCAL_DERIVATION | ADJUSTMENT_CALENDAR_ALIGNMENT_NOT_PROVEN |
| `OIL_GAS_BUSINESS_DURABILITY` | 1 / 1 | 1 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `OMNICHANNEL_OR_PLATFORM_MOAT` | 2 / 2 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW, REQUIRED_EVIDENCE_MISSING |
| `OPERATING_AND_PIPELINE_CAPACITY_GROWTH` | 1 / 1 | 1 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `OPERATING_CASH_FLOW_COLLECTIONS_LAND_CAPEX` | 1 / 1 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `OPERATING_MARGIN_CONTRACT_QUALITY` | 2 / 2 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `OPERATING_MARGIN_HISTORY` | 58 / 58 | 1, 8 | TRENDLYNE_PARAMETERS | CANONICAL_UNIT_MISMATCH, REPORTING_PERIOD_INVALID, REQUIRED_EVIDENCE_MISSING |
| `OPERATING_MARGIN_REVENUE_QUALITY` | 1 / 1 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `OPERATING_QUALITY_AND_AVAILABILITY` | 2 / 2 | 1 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `ORDER_BOOK_AND_EXECUTION_GROWTH` | 4 / 4 | 1 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `ORDER_BOOK_AND_REVENUE_GROWTH` | 2 / 2 | 1 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `OWNERSHIP_GOVERNANCE` | 56 / 56 | 4 | TRENDLYNE_OWNERSHIP | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `OWNERSHIP_TREND_4Q` | 41 / 41 | 4 | TRENDLYNE_OWNERSHIP | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `PB_ADJUSTED_FOR_ROE` | 13 / 13 | 1 | TRENDLYNE_PARAMETERS | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `PB_RELATIVE` | 13 / 13 | 1 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | REQUIRED_EVIDENCE_MISSING |
| `PB_RELATIVE_TO_ROE` | 3 / 3 | 3 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | DATED_REPORTING_PERIODS_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `PB_ROCE_CONTEXT` | 3 / 3 | 3 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | DATED_REPORTING_PERIODS_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `PB_ROE_CONTEXT` | 3 / 3 | 3 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | DATED_REPORTING_PERIODS_NOT_PROVEN |
| `PE` | 22 / 22 | 3 | TRENDLYNE_PARAMETERS | REPORTING_PERIOD_TYPE_NOT_PROVEN |
| `PE_RELATIVE_TO_PEERS_AND_SELF_HISTORY` | 3 / 3 | 3 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | DATED_REPORTING_PERIODS_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `PE_SELF_AND_PEER` | 2 / 2 | 3 | TRENDLYNE_PARAMETERS | DATED_REPORTING_PERIODS_NOT_PROVEN |
| `PE_TTM_RELATIVE` | 13 / 13 | 1 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `PE_WHEN_EARNINGS_POSITIVE` | 3 / 3 | 3 | TRENDLYNE_PARAMETERS | DATED_REPORTING_PERIODS_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `PE_WHEN_POSITIVE` | 3 / 3 | 3 | TRENDLYNE_PARAMETERS | DATED_REPORTING_PERIODS_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `PE_WITH_CYCLE_CONTEXT` | 1 / 1 | 3 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | DATED_REPORTING_PERIODS_NOT_PROVEN |
| `POWER_ASSET_DURABILITY` | 2 / 2 | 1 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `PRE_SALES_COLLECTION_EXECUTION_QUALITY` | 1 / 1 | 8 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `PRE_SALES_COLLECTIONS_AREA_RENTAL_GROWTH` | 1 / 1 | 8 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `PREMIUM_OR_AUM_GROWTH_MULTI_PERIOD` | 1 / 1 | 1 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `PRICE_HISTORY_252D` | 41 / 41 | 252 | ANGEL_ONE_STOCK_HISTORY, LOCAL_DERIVATION | ADJUSTMENT_CALENDAR_ALIGNMENT_NOT_PROVEN |
| `PRICE_MOMENTUM_12M` | 13 / 13 | 252 | ANGEL_ONE_STOCK_HISTORY, LOCAL_DERIVATION | ADJUSTMENT_CALENDAR_ALIGNMENT_NOT_PROVEN |
| `PRICE_MOMENTUM_6M` | 13 / 13 | 252 | ANGEL_ONE_STOCK_HISTORY, LOCAL_DERIVATION | ADJUSTMENT_CALENDAR_ALIGNMENT_NOT_PROVEN |
| `PRODUCT_MIX` | 2 / 2 | 8 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `PRODUCT_MIX_QUALITY` | 2 / 2 | 8 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `PRODUCTION_OFFTAKE_REALIZATION_GROWTH` | 1 / 1 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `PRODUCTION_ORDER_REVENUE_GROWTH_BY_BUSINESS_MODEL` | 1 / 1 | 8 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `PRODUCTION_VOLUME_REALIZATION_GROWTH` | 4 / 4 | 1 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `RATING_TREND` | 16 / 16 | 1, 252 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW, REQUIRED_EVIDENCE_MISSING |
| `REALIZATION_COST_POSITION` | 1 / 1 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `REALIZATION_PRODUCT_MIX` | 1 / 1 | 8 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `REGIONAL_DIVERSIFICATION` | 1 / 1 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `REGULATORY_RISK` | 12 / 12 | 252 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `RELATIVE_STRENGTH_12M` | 13 / 13 | 252 | ANGEL_ONE_STOCK_HISTORY, LOCAL_DERIVATION | ADJUSTMENT_CALENDAR_ALIGNMENT_NOT_PROVEN |
| `RENTAL_ANNUITY_WHEN_APPLICABLE` | 1 / 1 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `RENTAL_OCCUPANCY_WHEN_APPLICABLE` | 1 / 1 | 8 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `RESERVES_CONTRACT_VISIBILITY_ASSET_OR_SERVICE_DEPTH` | 1 / 1 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `RESERVES_COST_POSITION_OFFTAKE` | 1 / 1 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `REVENUE_AND_EBITDA_GROWTH_MULTI_PERIOD` | 2 / 2 | 1 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `REVENUE_AND_ORDER_GROWTH_MULTI_PERIOD` | 10 / 10 | 1 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `REVENUE_AND_VOLUME_GROWTH_MULTI_PERIOD` | 3 / 3 | 1 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `REVENUE_AND_VOLUME_PRICE_MIX_GROWTH` | 5 / 5 | 1 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `REVENUE_CLIENT_GROWTH_MULTI_PERIOD` | 2 / 2 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `REVENUE_CLIENT_HEADCOUNT_OR_VOLUME_GROWTH` | 1 / 1 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `REVENUE_GMV_SSSG_NETWORK_GROWTH` | 2 / 2 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `REVENUE_GROWTH_MULTI_PERIOD` | 25 / 25 | 1, 3 | TRENDLYNE_PARAMETERS | CANONICAL_UNIT_MISMATCH, METRIC_CONTRACT_NOT_REVIEWED |
| `REVENUE_ORDER_BOOK_CAPACITY_GROWTH` | 2 / 2 | 8 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW, REQUIRED_EVIDENCE_MISSING |
| `REVENUE_PER_EMPLOYEE_OR_DELIVERY_EFFICIENCY` | 2 / 2 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `REVENUE_SAME_STORE_NETWORK_GROWTH` | 3 / 3 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `REVENUE_UNIT_NETWORK_BOOKING_GROWTH` | 3 / 3 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `REVENUE_VOLUME_CATEGORY_GROWTH` | 2 / 2 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `REVENUE_VOLUME_EXPORT_GROWTH` | 1 / 1 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `REVENUE_VOLUME_ORDER_GROWTH` | 2 / 2 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `ROA_ANNUAL` | 13 / 13 | 1 | TRENDLYNE_PARAMETERS | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `ROA_ROE_CAPITAL_ADEQUACY` | 3 / 3 | 3 | TRENDLYNE_PARAMETERS | DATED_REPORTING_PERIODS_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `ROCE_CONTEXT` | 6 / 6 | 3 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | DATED_REPORTING_PERIODS_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `ROCE_OR_ROIC` | 66 / 66 | 1, 3 | TRENDLYNE_PARAMETERS | DATED_REPORTING_PERIODS_NOT_PROVEN, NORMALIZED_INPUT_CONTRACT_NOT_PROVEN, REPORTING_PERIOD_INVALID, REQUIRED_EVIDENCE_MISSING |
| `ROCE_OR_ROIC_ASSET_LIGHT_CONTEXT` | 1 / 1 | 3 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | DATED_REPORTING_PERIODS_NOT_PROVEN |
| `ROCE_OR_ROIC_PROJECT_CONTEXT` | 3 / 3 | 3 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | DATED_REPORTING_PERIODS_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `ROCE_OR_ROIC_THROUGH_CYCLE` | 9 / 9 | 1, 3 | TRENDLYNE_PARAMETERS | DATED_REPORTING_PERIODS_NOT_PROVEN, NORMALIZED_INPUT_CONTRACT_NOT_PROVEN |
| `ROCE_OR_ROIC_WITH_ASSET_CONTEXT` | 2 / 2 | 1 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN |
| `ROCE_OR_ROIC_WITH_ASSET_LIGHT_CONTEXT` | 3 / 3 | 3 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | DATED_REPORTING_PERIODS_NOT_PROVEN |
| `ROCE_PROJECT_CONTEXT` | 2 / 2 | 3 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | DATED_REPORTING_PERIODS_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `ROCE_TENANCY_CONTEXT` | 1 / 1 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `ROCE_THROUGH_CYCLE` | 1 / 1 | 3 | TRENDLYNE_PARAMETERS | DATED_REPORTING_PERIODS_NOT_PROVEN |
| `ROCE_WORKING_CAPITAL_CONTEXT` | 3 / 3 | 3 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | DATED_REPORTING_PERIODS_NOT_PROVEN |
| `ROE_ANNUAL` | 13 / 13 | 1 | TRENDLYNE_PARAMETERS | REPORTING_PERIOD_TYPE_NOT_PROVEN |
| `ROE_OR_ROIC` | 4 / 4 | 1 | TRENDLYNE_PARAMETERS | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `ROIC_CONTEXT` | 1 / 1 | 3 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | DATED_REPORTING_PERIODS_NOT_PROVEN |
| `ROIC_NETWORK_CONTEXT` | 1 / 1 | 3 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | DATED_REPORTING_PERIODS_NOT_PROVEN |
| `ROIC_STORE_OR_PLATFORM_CONTEXT` | 2 / 2 | 3 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | DATED_REPORTING_PERIODS_NOT_PROVEN |
| `ROIC_STORE_PLATFORM_CAPITAL_EFFICIENCY` | 2 / 2 | 3 | TRENDLYNE_PARAMETERS | DATED_REPORTING_PERIODS_NOT_PROVEN |
| `SAME_STORE_REVPAR_OR_TRANSACTION_QUALITY` | 3 / 3 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `SCALE` | 2 / 2 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `SERVICE_DEPTH` | 1 / 1 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `SERVICE_QUALITY` | 1 / 1 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `SHIPMENT_REVENUE_CLIENT_NETWORK_GROWTH` | 1 / 1 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `SOLVENCY_BALANCE_SHEET_BUFFER` | 1 / 1 | 1 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `SOLVENCY_OR_CAPITAL_ADEQUACY` | 1 / 1 | 1 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `SOTP_NAV_DISCOUNT` | 2 / 2 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `SOTP_WHEN_DIVERSIFIED` | 1 / 1 | 3 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `STUDDED_MIX_OR_MAKING_CHARGE_QUALITY` | 3 / 3 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `SUBSIDIARY_EARNINGS_QUALITY` | 2 / 2 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `SUBSIDIARY_QUALITY` | 2 / 2 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `TARIFF_OFFTAKER_GRID_AND_RESOURCE_RISK` | 2 / 2 | 1 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `TECHNOLOGY_PERMITS_MUNICIPAL_INDUSTRIAL_DIVERSIFICATION` | 2 / 2 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW, REQUIRED_EVIDENCE_MISSING |
| `TENANCY_CONTRACT_NETWORK_SCALE` | 1 / 1 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `TENANCY_MARGIN_COLLECTION_QUALITY` | 1 / 1 | 8 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `THROUGH_CYCLE_MARGIN_COST_QUALITY` | 1 / 1 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `THROUGH_CYCLE_MARGIN_QUALITY` | 5 / 5 | 1 | TRENDLYNE_PARAMETERS | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN |
| `THROUGHPUT_SEGMENT_AND_MARGIN_GROWTH` | 1 / 1 | 1 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `TOWER_TENANCY_DATA_CAPEX_REVENUE_GROWTH` | 1 / 1 | 8 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `UNDERWRITING_CYCLE_HISTORY` | 3 / 3 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW, REQUIRED_EVIDENCE_MISSING |
| `UNDERWRITING_OR_RESERVING_QUALITY` | 1 / 1 | 1 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `UNIT_ECONOMICS` | 2 / 2 | 8 | TRENDLYNE_DOCUMENTS | REQUIRED_EVIDENCE_MISSING |
| `UNIT_ECONOMICS_OR_ASSET_ROCE_CONTEXT` | 3 / 3 | 3 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `UNIT_LEVEL_MARGIN_OR_OPERATING_MARGIN` | 3 / 3 | 8 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `UPTIME` | 1 / 1 | 8 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `VALUATION` | 48 / 48 | 1 | TRENDLYNE_PARAMETERS | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
| `VALUATION_ASSET_AND_CASH_FLOW_CONTEXT` | 2 / 2 | 1 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN |
| `VALUATION_THROUGH_CYCLE` | 6 / 6 | 1 | TRENDLYNE_PARAMETERS | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN |
| `VOLATILITY_252D` | 12 / 12 | 252 | ANGEL_ONE_STOCK_HISTORY, LOCAL_DERIVATION | ADJUSTMENT_CALENDAR_ALIGNMENT_NOT_PROVEN |
| `VOLATILITY_RELATIVE` | 13 / 13 | 252 | ANGEL_ONE_STOCK_HISTORY, LOCAL_DERIVATION | ADJUSTMENT_CALENDAR_ALIGNMENT_NOT_PROVEN |
| `VOLUME_AND_REVENUE_GROWTH_MULTI_PERIOD` | 3 / 3 | 1 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `VOLUME_CAPACITY_UTILISATION_GROWTH` | 1 / 1 | 8 | TRENDLYNE_DOCUMENTS | DOCUMENT_EVIDENCE_REQUIRES_REVIEW |
| `VOLUME_PRICE_MIX_GROWTH` | 1 / 1 | 1 | TRENDLYNE_PARAMETERS | REQUIRED_EVIDENCE_MISSING |
| `VOLUME_REALIZATION_AND_SPREAD_GROWTH` | 1 / 1 | 1 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | REQUIRED_EVIDENCE_MISSING |
| `WORKING_CAPITAL_AND_CASH_CONVERSION` | 3 / 3 | 1 | TRENDLYNE_PARAMETERS, LOCAL_DERIVATION | NORMALIZED_INPUT_CONTRACT_NOT_PROVEN, REQUIRED_EVIDENCE_MISSING |
