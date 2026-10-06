# V1-4 Action B Phase 1 — implementation and acquisition plan

## Disposition

**Phase 1 code and member-level planning artifacts implemented and tested. V1-4 remains IN PROGRESS / NOT PROVEN. Full acquisition campaign execution contract remains NOT PROVEN. V1-5 remains unauthorized.**

Owner approved Phase 1 only. This record supersedes the earlier Action B proposal where it concerns implemented parsers and measured cache candidates. It does not authorize providers, cache materialization, methodology changes or readiness promotion.

Starting authoritative Development HEAD: `24fa695858583b239f8e7d8b617e0a9c460c2941`. Development Supabase: `PortfolioAI Dev / lrgpjimipfkyoqbpsqzz`. Target branch: `PortfolioAI-Development`. The remote repository was verified private before publishing member-level artifacts.

The generator retains Action A source/evaluation cutoff `2026-10-05T19:25:54.019754+00:00`. The frozen cohort is unchanged: 111 identities, 132,585,696 paise, approved JSON SHA-256 `79f551558333adc1f37d6a26298d8088ee02db3161f03c6d6e59f9a19a93fc27`. Release remains >=100 of those same members AND >=119,327,127 paise from their same frozen values at the full deterministic endpoint. All 239 equities and 248 holdings remain visible. Restore proof remains mandatory at V1-9.

## Implemented capability

- One shared canonical requirement-to-observation map, consumed by the materializer and offline planner. Removed implied fair-price upside percentage from P/E aliases. The approved methodology, minima and requirements were not changed.
- Exact primary-entity and provider-label parsing for the existing seven approved detailed mappings. Decimal tokens are retained as strings; peer values, duplicate labels, relative-year substitutes and missing values are rejected.
- Source-bound financial metadata review validation: metric mapping, quoted value, dated period/type, unit, currency, scope, source ID/hash/provider, reviewer/version, publication/retrieval and existing freshness limits. It reuses `validateObservationSeries`; invalid facts produce no accepted observation. There is no unit conversion or extension of freshness.
- Ownership calendar-quarter candidates retain explicit unit, quarter date and decimal zero. Summary totals and undated series do not substitute for dated history. Reporting basis and series-definition review remain explicit.
- Cited document-excerpt review verifies entity, document ID, same-source text and reviewer. A citation is not a numeric assessment, proof of full-body archiving or automatic readiness.
- Angel One raw-candle parser retains exact OHLCV decimal tokens, validates identity-bound request window, timezone, duplicate sessions, OHLC consistency and row ceiling. It never copies raw close to adjusted close.
- Calendar/adjustment/benchmark contract validation requires versioned reviewed session authority, complete adjustment-event coverage and exact verified benchmark mapping. Missing authority never becomes a weekend heuristic or assumed no-event history.
- Existing IC2 detailed/ownership writers now retain raw captures and return review candidates without appending undated/UNKNOWN observations as AVAILABLE. IC2 overview is raw-only pending metadata. Other legacy modes are preserved. Existing owner checks, grants, controls and usage accounting remain in place.
- Supabase SDK is pinned to the application's existing 2.115.0 version for the changed capture function; parser callbacks use explicit JSON parsing callbacks. No SDK upgrade or schema change was made.

## Cache-first result

The targeted Development read inspected 918 original research source records, 2,419 cohort observations, 47 metric definitions, 136 cohort document records, 111 stock-history inventories and 10 benchmark-history inventories. Redundant derived P7 projections were omitted from the private export; original provider result text and payload hashes were retained. Source rows were never modified.

The document-search cache contains provider-extracted excerpts. The earlier `document_bodies_retained:false` flag does not mean that cached search-response text is absent. It still does not prove retained original PDF/full-body archives. Review cached excerpts first; no document retrieval is currently planned.

Measured candidates: 741 exact-label numeric captures; 4,350 dated ownership-quarter candidates; 421 distinct cached document identifiers across source appearances. These are candidate counts, not successful normalizations. Repeated sources/quarters remain distinguishable for lineage and reconciliation; they do not count as distinct required periods.

All 111 frozen members are represented in 1,608 mandatory requirement jobs, excluding lineage bookkeeping. Dispositions:

| Disposition | Requirement jobs | Meaning |
|---|---:|---|
| Existing canonical cache validated | 2 | Already-valid bank growth requirements; no new writes/progress claimed |
| Cached exact-field metadata review | 183 | No period/scope inference allowed |
| Cached ownership-quarter review | 108 | Series/basis review required |
| Cached document excerpt review | 274 | 110 members; requirement-specific source citation required |
| Conditional raw acquisition then review | 49 | 45 members; request details included |
| Field/period/factual contract unresolved | 685 | No invented endpoint or fiscal anchor |
| History authority unresolved | 307 | Mapping/calendar/adjustment proof required before refresh can establish readiness |

No new canonical normalization was accepted or written in Phase 1. The two already-valid requirements are not two READY equities. Current selected states remain 111 REVIEW_REQUIRED / 0 READY for the cohort and 231 REVIEW_REQUIRED / 8 INSUFFICIENT / 0 READY for all equities.

## Exact conditional acquisition budget

The private JSON/CSV contains member identity, exact requirement, known source-dated periods, required distinct-period count, cache references, missing contract, provider tool/arguments/query, parser/target, lineage requirements, request write cap and expected blocker removal. Unknown missing dates are explicitly unresolved rather than derived from relative-year labels.

There are **46 deduplicated conditional Trendlyne tool attempts**: **44 parameter queries** combining the 47 identified missing parameter jobs, plus **2 ownership queries**. There are **0 executable Angel One history calls**, **0 document retrieval calls**, **0 immediate provider calls**, **0 canonical-observation writes**, and **0 readiness writes**. No shared benchmark request is duplicated: all unresolved benchmark/window contracts remain excluded from executable requests. Zero automatic retries are budgeted.

The conditional list has a **46-row raw evidence append ceiling** under a dedicated raw-capture implementation. Its queries are concrete arguments for existing `TrendlyneObservedMcpClient` tools; it is not an executable whole-runtime grant for `complete-research-refresh`. That existing handler constructs its own queries, consumes grants and writes bookkeeping. Do not paste the generated queries into it or assume its default queries implement this plan exactly.

**Total campaign database-write ceiling and truly required provider count are NOT PROVEN.** Run/item/usage/grant/control bookkeeping must be explicitly bounded in the eventual approved execution contract. The 46 raw-record cap excludes those writes. Cached cited-fact review must finish before conditional calls can be called necessary. Some missing definitions authorize company/exchange filings or issuer annual reports rather than Trendlyne; source authority must not be silently switched.

The generators/parsers are executable offline. Provider execution still needs a scoped, tested capture dispatcher that consumes the generated exact requests through existing controls, including bookkeeping and attempt accounting. Phase 1 has not fabricated that authorization or claimed that raw tool support proves metadata-complete field support.

## Remaining exact blockers

1. 685 requirement jobs lack a reviewed exact field/period/source contract or factual resolution. Parameter hints are not approved metric mappings. The factual Pharma exception remains unchanged.
2. 307 history jobs lack benchmark authority/token and/or reviewed exchange-session and corporate-action adjustment coverage. More raw candles cannot remove these blockers alone. The 190-versus-252 session case remains unproven as a structural listing-history shortage; do not infer listing age from cache length.
3. Cached numeric/document/ownership candidates need source-bound requirement review. Missing publication date or consolidation scope cannot be filled from retrieval date or a generic document title.
4. Required acquisition count and full runtime write ceiling depend on that review and on a separately bounded dispatcher contract. The private plan explicitly records null/blocked entries instead of an estimated campaign volume.

These are focused implementation/review prerequisites, not a request for another general V1-4 audit. There is no automatic HOLD, changed denominator, changed cohort value, loosened method or readiness guarantee.

## Reproduce and validate

Run with Deno 2.9.6, no network permission:

```sh
deno run --no-lock --allow-read --allow-write scripts/v14-action-b-phase1-plan.ts CACHE_DIR APPROVED_FROZEN_JSON ACTION_A_VALIDATED_JSON OUTPUT_DIR
```

Required cache inputs are named explicitly by the generator. It validates the frozen file's exact SHA-256, member count, unique IDs, exact integer-paise aggregate and cutoff before writing artifacts. Raw caches are private execution inputs; they are not committed as new copies of the provider corpus. SHA-256 artifact references follow below.

Validation: 75 focused pure Edge tests passed; two actual Deno handler/writer tests passed with mocked transport and rejected any provider target/unexpected observation write; strict Deno checks passed for changed modules and planner; application TypeScript/Vite build and architecture guard passed; changed-file Edge lint passed. The build retains an existing chunk-size warning. A baseline full-repository lint failure is not described as a new PASS.

Runtime deployment and final read-only side-effect reconciliation are recorded in the current Development Status after publication. No V1-4 readiness materialization or provider execution is included in Phase 1.

## Private review artifacts and integrity

- [`PortfolioAI_V1_4_ACTION_B_PHASE1_ACQUISITION_PLAN_2026-10-05.csv`](private/PortfolioAI_V1_4_ACTION_B_PHASE1_ACQUISITION_PLAN_2026-10-05.csv) — SHA-256 `2cd19fb289cb321bda9695b6279969c81586191d883b89d4570083e4b2768aa2`
- [`PortfolioAI_V1_4_ACTION_B_PHASE1_ACQUISITION_PLAN_2026-10-05.json`](private/PortfolioAI_V1_4_ACTION_B_PHASE1_ACQUISITION_PLAN_2026-10-05.json) — SHA-256 `e6fc3163427626aa4a951225506fdb371bce2e2ba1ebb2e42bfec984c1943450`
- [`PortfolioAI_V1_4_ACTION_B_PHASE1_CACHE_REVIEW_CANDIDATES_2026-10-05.json`](private/PortfolioAI_V1_4_ACTION_B_PHASE1_CACHE_REVIEW_CANDIDATES_2026-10-05.json) — SHA-256 `e338e84a8bc15d4fe3c7f9c5dd9a644066d84cc4766d811b9fe3b8671f2de282`
