# Operational V1-4 — bounded execution and owner-decision contract (8 October 2026)

Status: PREPARED / NO SOURCE OR CANONICAL MUTATION AUTHORIZED. Operational V1-4 remains NOT PROVEN.

Source Development HEAD: `adb6d9a15680461ee5c4232f7b1bb39f8d1594cd`; source canonical run `c0b7f1c4-3e36-4d5c-b79a-19e44fe74e83`. This contract is subordinate to AGENTS.md and canonical architecture and must be revalidated for freshness before execution.

## Immutable target identity

- Fixed remediation members: 115 from `docs/private/PortfolioAI_V1_4_115_EXECUTION_MANIFEST_2026-10-07.json`, 76 of whom belong to the separately frozen release cohort.
- Frozen release: 111, SHA-256 `79f551558333adc1f37d6a26298d8088ee02db3161f03c6d6e59f9a19a93fc27`, 132,585,696 paise; acceptance **at least 100 identical members and 119,327,127 paise**; no rebuilding or denominator changes.
- Detailed execution-group inventory: `docs/private/PortfolioAI_V1_4_BOUNDED_ACQUISITION_GROUPS_2026-10-08.json`.
- Current source grouping: 292 documentary requirement rows mapped to 131 capture groups (114 distinct linked document IDs and 17 individually unlinked items); 537 numeric requirement rows mapped to 252 raw-source or individually unlinked groups. These are grouping units, **not proven original documents or provider request counts**.

## Dependency-ordered batch contracts

| Batch | Inputs/target | Existing authority | Missing decision or scoped approval | Calls / writes and hard boundary | Stop/acceptance checks |
|---|---|---|---|---|---|
| A. Ownership methodology | 53 OWNERSHIP_TREND_4Q; 10 INSTITUTIONAL_OWNERSHIP_TREND_4Q; 51 OWNERSHIP_GOVERNANCE | Existing ownership source parsing and immutable snapshots | **Owner choice for each family** before use | 0 provider and DB writes in approval phase; later separate versioned implementation and explicit ingestion grant | Exact same provider series and percentage basis across four consecutive quarters; no aggregate double counting or governance inference |
| B. Document identity and source capture | 131 source groups serving 292 documentary items; 17 currently unlinked | Read-only source discovery; prior approved private-R2 architecture | Bounded original-source acquisition, R2 retention and matching evidence-ingestion approval | Requests **not yet safely countable**: exact URL list absent; do not approve a generic download allowance. Record URL, original title, issuer, reporting/publication date, page/section, actual bytes and SHA-256 per unique original | Hash-verified R2 readback and immutable link; no generic keyword/provider-summary ACCEPT; 292 review rows remain DEFER until evidence and human review |
| C. Numeric source proof | 252 grouped retained/raw-source identities serving 537 items | Existing Trendlyne research authority and read-only captures | A source-specific dated-period/scope-capable acquisition plan and bounded approval, **not** same undated endpoint replay | Calls **unquantifiable until exact entitled field-method contract is established**. 0 canonical candidates ready from current captures; no writes until validated | Exact entity, field meaning, start/end, annual/quarter/TTM, scope, unit/scale/currency, distinct periods, source hash/freshness; reject ambiguity, duplicates or incompatible candidates |
| D1. Exact official index refresh | NIFTY_CAPITAL_GOODS: CPPLUS/ICEMAKE/JASH/JTLIND; NIFTY_CONSUMER_SERVICES: DMART/ETERNAL/INDHOTEL/ITCHOTELS/JUBLFOOD | **Approved** official benchmark-only NSE/Nifty fallback source policy | One bounded physical batch + R2/canonical permission | Up to **3** official HTTP requests (one warm-up, two exact history requests), **zero automatic retries**; reuse across all nine stocks | Latest completed NSE session as-of execution, exact code/name, dates, valid positive decimal CLOSE, 252 distinct aligned sessions, correct price/TRI semantics, raw hash/readback, idempotent append/selection; no fabricated OHLC |
| D2. NIFTY_TELECOM identity | BHARTIARTL and INDUSTOWER | Read-only official catalogue/capture-path study | Separate bounded identity/capture grant; mapping write only after exact identity proof | Up to **3** official HTTP requests (one warm-up, two date ranges), **zero automatic retries** | Do not equate 'NIFTY Telecom' and 'Nifty Telecommunications' by string similarity; require official continuity/alias/identifier and exact rows; otherwise mapping UNRESOLVED |
| E. HINDUNILVR | Single frozen equity, existing COMPLETE corporate-action history proof | Read-only inspection and code/test preparation | One-security append-only correction write and materialization grant | **0 provider calls**; one explicitly superseding proof record, only via established canonical authority; no overwrite or historical deletion | Source proof ID, supersession linkage, corporate-action date/adjustment basis, reason for conflicting treatment; preserve raw/adjusted prices, block FRESH until independent correction proof passes |
| F. Human review and bounded canonical materialization | All validated candidates/reviews and 115 immutable manifest members | Existing review-ledger + scoped-grant mechanism | Genuine owner reviewer decisions and correctly scoped unexpired materialization grant | Append only audited review records and snapshots within approved bounds; no provider calls unless separately authorized | Re-read selected snapshots/items/source lineage, conflicts, provider accounting, replay idempotency; reconcile 115 status distribution and unchanged frozen 111 value/count |

### Owner methodology choices — proposals, not approved contract

1. **OWNERSHIP_TREND_4Q:** propose **Promoter / TOTAL_EQUITY_PERCENT** for four consecutive reporting quarters to measure promoter commitment rather than institutional demand. Other possible single series: Institutional, FII, MF, DII, Public. This choice requires explicit owner review and a versioned contract; promoter holding is not a governance audit.
2. **INSTITUTIONAL_OWNERSHIP_TREND_4Q:** propose the provider's **Institutional / TOTAL_EQUITY_PERCENT**, four consecutive reporting quarters, **without** adding FII, MF or DII to it. Confirm the provider's denominator and whether the quarters represent percentage of total shares outstanding.
3. **OWNERSHIP_GOVERNANCE:** recommend **separate Promoter ownership measurement plus independently source-reviewed governance events/disclosures**. A percentage series alone must never satisfy qualitative governance; leave the requirement DEFER until the governing methodology defines its necessary conjunction and treatment of missing documentary facts. Do **not** add an unapproved numerical composite.

Sample retained Trendlyne series: Promoter, Institutional, FII, MF, DII, Public; historical samples for ABCAPITAL, AKUMS, ALIVUS, ACMESOLAR and ANGELONE have reported multiple quarters to June 2026. Reporting period and percentage basis still require source-bound verification at canonical admission.

### Structural equity exceptions and frozen-value consequences

- GROWW retains 223 sessions and is outside frozen 111.
- ICICIAMC retains 196 sessions and is inside frozen 111 at **919,740 paise**. Even assuming that it remains permanently ineligible, **110** other frozen members remain, so the count minimum of 100 is mathematically attainable, **not proven achieved**. The remaining potential value is **131,665,956 paise**, above 119,327,127; this is a hypothetical upper bound, **not readiness**.
- INDUSTOWER is frozen at 454,800 paise and depends partly on exact Telecom index evidence.
- No member is substituted, no pre-listing session is invented, no rule softened.

### Validation and recovery requirements for all authorized executions

Use existing provider reservations, leases, kill switches, capped retries and scoped-grant checks. Before any batch: verify the Development identity, no Production target, head/manifest/hash stability, source clock/cutoff, current budget, R2 path, DB size below 400 MB warning / 500 MB policy ceiling. Record physical attempted/successful provider requests separately from rows accepted and persisted. Use deterministic idempotency keys based on security, exact source, reporting period, field or document hash; prefer reuse of complete retained captures. On conflicting values, duplicate-but-not-identical raw payloads, ambiguous identity, insufficient sessions, or a fresh cutoff mismatch, fail closed and keep existing canonical selection. On interruption, recover by immutable record IDs and accepted source hashes, not by rerunning everything. Re-run architecture/typing/lint/regression/build and verify current code HEAD before claiming code PASS.

## Specific permissions still needed

- A: owner chooses one methodology variant in each of three requirement families.
- B/C: source-bound input manifest with **actual approved tool/URL, named fields, target periods, deduplicated expected calls, private-R2 objects and write scope** must be populated before asking for spending or writes. This document is intentionally **not** an unlimited provider authorization.
- D: authorize the two incremental exact-index captures (maximum 3 official requests total) and separately the Telecom identity batch (maximum 3). Source-policy approval is already recorded; do not request it again.
- E: authorize exactly one HINDUNILVR immutable superseding history proof through the approved owner.
- F: authorize only subsequently validated evidence reviews and canonical materialization with explicit scoped grants, never automatic acceptance of all 292 reviews.

Before/after disposition: preparation only; no new source, R2, review-ledger, provider or canonical writes and **no demonstrated removal** of any of the blocker families. V1-4 remains NOT PROVEN; V1-5 remains outside scope.
