# Operational V1-4 — independently sourced Trendlyne ownership semantics

**Status:** PARTIALLY PROVEN, CANONICAL ADMISSION BLOCKED. 8 October 2026.

## Verified source contracts

- Official Trendlyne help: https://help.trendlyne.com/support/solutions/articles/84000396770-how-can-i-create-a-screener-using-the-custom-parameter-for-public-shareholding- (18 March 2025). Explicitly states the Institutional holding category includes **FII, DII, and other holdings**. Thus **do not add FII/DII/MF to the Institutional aggregate**. This does **not** prove the exact denominator, inclusion of MF within DII in each reporting period, or the `get_ownership_deals_insider_sast` response-field revision rules.
- Official Trendlyne MCP capability description: https://trendlyne.freshdesk.com/support/solutions/articles/84000399411-what-capabilities-are-currently-available-in-the-trendlyne-mcp-server- (21 July 2026); confirms ownership, deals and SAST disclosure tool and separate shareholding classes. It does not specify the percent denominator or filing publication timestamp.
- Official Trendlyne shareholding screener: https://trendlyne.com/stock-screeners/shareholding-change/ shows the distinct promoter and institutional percentage series by reported quarter. It is display-level proof, not canonical instrument-specific source identity.

## Original retained read-only Development examples

Project `lrgpjimipfkyoqbpsqzz`, `data_source_records`, `record_kind=COMPLETE_RESEARCH_OWNERSHIP`, `source_code=TRENDLYNE_MCP`, `provider_tool=get_ownership_deals_insider_sast`.

- JKLAKSHMI raw record `437eb523-96ba-45e9-9036-4e121f74fe01`: original chart header **Promoter Holding (%)**; rows labelled `Mar 2025` through `Jun 2026`. Separate pledge data is percentage **of promoter shares** and must not be confused with holding percentage.
- JASH raw record `a644e73a-92a2-4953-8ef9-5b0d7ed02206`: same promoter chart percentage heading. Existing normalized `p7_ic2_ownership_history` contains quarter labels and numeric values but not explicit denominator, original header provenance, original disclosure publication date or source-series revision identity.

## Smallest outstanding original-field proof

Obtain, from entitled Trendlyne MCP tool documentation or an authoritative, issuer-specific underlying filing, source proof for: (1) exact `chartData.Promoter` and `chartData.Institutional` percentage denominator and scope; (2) institutional aggregate inclusion/overlap across FII/FPI/DII/MF/other; (3) precise reported quarter end, original publication/availability date and corrections; (4) historical revisions and conflict-precedence semantics; (5) stable binding between provider instrument identity, original series, raw capture hash, and canonical source selection.

The source heading and 0–100 range alone do not prove TOTAL_EQUITY_PERCENT. Do not equate retrieval timestamps with reporting dates. Do not change the owner's chosen promoter/institutional/governance methodology; these are evidence-source questions only.

## Verification and admission boundary

Current code's `validateV14SelectedOwnership` is a **fail-closed guard**. Its `REVIEW_REQUIRED` result is correct when semantically proven denominators and independent governance review are absent, but it does **not yet implement a way for a reviewed, proven source to become an admissible canonical candidate**. That next integration must use the established review-ledger and canonical selector, not a parallel calculator.

Prior item-linked replay: `docs/private/PortfolioAI_V1_4_OWNERSHIP_RETAINED_DRYRUN_115_2026-10-08.json`, complete manifest of 115 (114 applicable ownership requirement items, 1 no applicable item), reasons 24 SOURCE_SEMANTICS_NOT_PROVEN, 39 SERIES_MISSING in linked source, 51 GOVERNANCE_REVIEW_REQUIRED. These are **not** full handler dry-run results; alternative source-level records may exist. Zero safe append-only candidates and no persisted READY change proven.

An isolated local TypeScript copy compiled strict ES2022, and its 11 behavior checks passed again. This is **not** the actual repository Vitest suite or full codebase/Edge/Deno/build verification: the container cannot resolve github.com for a complete clone. Therefore no exact-commit full PASS and no deployment recommendation.

No paid provider calls, R2 writes, canonical writes, migrations, scheduler activation, production or deployment occurred. Operational V1-4 remains NOT PROVEN; V1-5 unauthorized.
