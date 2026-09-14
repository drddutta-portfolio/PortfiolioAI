# R2C Portfolio Coverage Baseline — 2026-09-14

Status: **READ-ONLY PRODUCTION BASELINE**

This document records the first portfolio-wide R2C coverage inventory generated from existing PortfolioAI production data. The inventory was produced with read-only SQL only. It did not mutate portfolio data, invoke external providers, consume provider budget, deploy code, apply migrations, or enable schedulers.

## 1. Purpose

R2C converts the R2 coverage-registry contract into a real portfolio-wide truth table. It answers what is currently held, which classifications already exist, where research evidence exists, where research profiles remain pending, where market history exists, and where downstream scoring/recommendation/sizing lineage is still missing.

R2C is descriptive only. It does not fetch missing evidence and does not create investment recommendations.

## 2. Portfolio population

Read-only production query over `current_holdings` found:

| Population | Count |
| --- | ---: |
| Open holdings | 249 |
| Equity holdings | 240 |
| Non-equity holdings | 9 |
| Open holdings with ISIN present in `securities` | 185 |

The 9 non-equity holdings are not to be forced through the equity research/scoring/recommendation/sizing chain. Their equity-research domains should report `NOT_APPLICABLE` unless a future asset-specific engine is introduced.

## 3. Application-wide classification authority

The raw `securities.sector_id` / `industry_id` columns are not the current classification authority for this portfolio: all 249 open holdings currently have null raw sector/industry links.

The shared reviewed enrichment projection `current_security_enrichment_v1` is the application-wide classification authority. It is already consumed by Dashboard → Allocation & performance and must also be consumed by R2, Research, Holdings, Portfolio Structure and future decision surfaces.

For the 240 equity holdings:

| Classification state | Count |
| --- | ---: |
| Sector available through current enrichment | 240 |
| Industry available through current enrichment | 48 |
| Enrichment state `AVAILABLE` | 48 |
| Enrichment state `PARTIAL` | 192 |
| No enrichment row | 0 |

Interpretation:

- **Sector-level classification is portfolio-wide: 240/240 equities.**
- **Industry-level specificity is not portfolio-wide.**
- A `PARTIAL` enrichment state does not mean sector is missing when the sector value is already present.
- R2 must use exactly the same sector label shown by the Dashboard, not a secondary user-visible taxonomy.

## 4. Current sector distribution of the 240 equities

The shared enrichment layer reports the following application sector labels:

| Sector label | Holdings |
| --- | ---: |
| Pharma | 26 |
| Capital Goods | 22 |
| Financial Services | 22 |
| Information Technology | 19 |
| Banking | 15 |
| Chemicals | 14 |
| Automobile and Auto Components | 12 |
| Consumer Services | 11 |
| Metals & Mining | 10 |
| Fast Moving Consumer Goods | 9 |
| Oil Gas & Consumable Fuels | 8 |
| Consumer Durables | 7 |
| Waste Managment | 7 |
| Gems and Jewellery | 6 |
| Healthcare | 6 |
| Industrial | 6 |
| Textiles | 6 |
| Material | 4 |
| Power | 4 |
| Services | 4 |
| Energy | 3 |
| Construction | 2 |
| Consumer Discretionary | 2 |
| Defence | 2 |
| FMCG | 2 |
| Realty | 2 |
| Renewable Energy | 2 |
| Ship Building | 2 |
| Telecommunication | 2 |
| Construction Materials | 1 |
| Consumer Staples | 1 |
| Textiles Apparels & Accessories | 1 |

These labels are the application classification for the current portfolio because they are the same labels used by Dashboard → Allocation & performance.

R2 must not merge `Banking` with `Financial Services`, `Pharma` with `Healthcare`, or any other Dashboard sectors for display/counting purposes. Research-profile grouping is a separate downstream methodology concern only.

## 5. Market-cap classification authority

Dashboard market-cap performance also reads the same `current_security_enrichment_v1` projection, specifically `market_cap_category`.

Therefore all pages must use the same market-cap category for the same security. No independent page-level market-cap bucketing should be maintained.

## 6. Structured research evidence breadth

Read-only production evidence counts show:

| Evidence / downstream layer | Current equity coverage |
| --- | ---: |
| Equities with at least one fundamental observation | 25 / 240 |
| Equities with research documents | 3 / 240 |
| Equities with Angel One daily market history | 1 / 240 |
| Equities with at least 200 daily candles | 1 / 240 |
| Reviewed scoring-profile assignments | 4 / 240 |
| Persisted `stock_score_runs` | 0 / 240 |
| Persisted recommendation coverage | HDFCBANK only |
| Production `position_sizing_assessments` table | Not present |

`security_refresh_states` currently shows narrow Trendlyne refresh-state coverage rather than portfolio-wide refresh-state coverage:

- `VERIFIED_IDENTITY`: 15 FRESH
- `TTM_FUNDAMENTALS`: 5 FRESH, 15 STALE
- `OWNERSHIP`: 16 FRESH
- `DOCUMENT_DISCOVERY`: 1 FRESH

This is consistent with the known pilot-first history and must not be interpreted as portfolio-wide research completeness.

## 7. Important evidence caveat

All 25 securities with fundamental observations have at least one historical `CONFLICTING` observation somewhere in their evidence history. This does **not** mean all 25 stocks should automatically be considered currently conflicted.

The first live R2C check found no rows in `fundamental_observation_decisions` selecting a canonical observation for these holdings. Therefore R2 must distinguish raw evidence presence, historical conflict, reviewed canonical selection, and profile-specific mandatory evidence readiness.

Until that distinction is implemented, R2 should conservatively report research evidence as present but **not claim profile/scoring readiness** from observation count alone.

## 8. Scoring and recommendation persistence caveat

Production currently contains no rows in `stock_score_runs` for the 240 open equities.

HDFCBANK does have persisted recommendation-preview history in `stock_recommendation_runs`, including stable BANK_NBFC preview rows with score-ready coverage and 3–4% suggested-weight guidance. Those recommendation rows currently have `source_score_run_id = null` and `run_state = PREVIEW`.

Therefore R2 must not describe HDFCBANK as having a persisted canonical score-run lineage today. HDFCBANK remains the deepest validated research/scoring/recommendation reference path, recommendation-preview persistence exists, canonical `stock_score_runs` persistence is absent, and D35B position-sizing persistence is not yet applied to production.

## 9. Research-profile readiness rule

Existing `security_scoring_profile_assignments` are scoring-methodology assignments. They must not automatically promote a security to an approved R4 sector-research profile.

A valid application sector is not the same as a ready research profile. For example, every current equity can be sector-classified while most remain `PROFILE_PENDING` for sector-specific research methodology.

Research profiles may internally group compatible application sectors, but that grouping must never alter the sector classification displayed to the user.

## 10. R2C blocker interpretation today

At the portfolio level, the earliest broad blockers are:

1. **Research-profile contract coverage** — most equities do not yet have an approved R4 research-profile contract/readiness state.
2. **Profile-specific research evidence breadth** — only a minority have structured fundamental evidence.
3. **Market-history breadth** — only one equity currently has the full Angel One daily-history path.
4. **Persisted deterministic scoring lineage** — no current `stock_score_runs` rows for open holdings.
5. **Recommendation breadth** — only HDFCBANK has persisted preview history.
6. **Position-sizing persistence** — repository contract exists, but the production table is intentionally not applied yet.

Core Health and Exit Risk remain future engines and should continue to report `BLOCKED_PREREQUISITE` rather than fabricated readiness.

## 11. R2 implementation implications

R2 should project existing truth rather than create duplicate truth:

- `current_holdings` is the open-holding population source.
- `current_security_enrichment_v1` is the shared sector, industry and market-cap classification source.
- Dashboard and all other pages must resolve classification through the same source/shared selector.
- raw `securities.sector_id/industry_id` must not be treated as the current classification authority while they remain null.
- `security_refresh_states` is provider/cache metadata, not proof of profile-specific research completeness.
- `fundamental_observations` / review decisions describe evidence and reconciliation state.
- `research_documents` describes document coverage.
- `market_price_history` describes Angel One historical-market coverage.
- `security_scoring_profile_assignments` describes reviewed scoring methodology only.
- `stock_score_runs` and `stock_recommendation_runs` describe persisted downstream lineage when present.
- position sizing must remain unavailable in production until the R1 migration is explicitly approved and applied.

The browser must not receive broader service-role access merely to render R2. If some control-plane tables are intentionally non-browser-readable, R2 should expose a minimal safe projection through a reviewed server-side boundary rather than weakening RLS.

## 12. Single-source consistency rule

Every application surface displaying sector, industry or market-cap classification must show the same data for the same security.

A classification correction must be made once in the shared enrichment/classification layer and then propagate everywhere. Page-specific copies, hidden remapping tables, ticker-name inference and independent market-cap classification are prohibited.

## 13. Completion status

This baseline is **R2C COVERAGE BASELINE COMPLETE** for the read-only inventory performed on 2026-09-14.

It is **not** portfolio-wide research completion, scoring completion, recommendation completion, sizing completion, or R2 production integration completion.
