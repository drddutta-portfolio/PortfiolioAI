# Banking V1-4 — fresh Trendlyne financial calls executed

## Execution and accounting

After the owner requested fresh Trendlyne calls as needed, executed **four get_parameter_values_multi_stock attempts**, one for each approved banking slice (4/4/4/1 securities). Each slice used a separate one-time grant; existing matched provider identities, owned/open equity checks, entitlement/retention controls and budget reservation preceded execution. There were no automatic retries.

All four runs completed and captured their original responses. Independent readback confirms **four usage events, four internal units and four SETTLED reservations**. These are internal provider-control accounting units, not a claim about the provider's currency billing. One representative run-item anchors each multi-stock attempt; all requested security IDs are retained in the immutable raw capture and run-item metadata. This is not thirteen separately billed calls.

Source records:

| Slice | Source record |
| --- | --- |
| BANK-P1-01 | c7ff0a5d-f792-424f-a8ae-24d201017f38 |
| BANK-P1-02 | 0548bfd7-fe80-4d63-b04b-046e27bf74b7 |
| BANK-P1-03 | 54b95fde-ef71-463a-a836-5c6a396d9ac6 |
| BANK-P1-04 | 93a83b21-20a4-4bd5-810f-47f58be0aaa3 |

## Actual response findings

All **13 requested symbols match their verified Trendlyne instrument IDs** in the returned identity headers. The provider also returned ten identities per response, including unrequested entities outside each slice. Those original responses are preserved for audit; only exact requested symbol/instrument matches are included in the inspection projection. No extra entity is added to the frozen cohort or admitted as a portfolio fact.

All returned identity data dates are **2026-10-09**. They establish the provider's data timestamp, **not** an annual/quarterly reporting start/end. The responses do not supply the requested financial period, denominator and consolidation-scope proof needed for automatic admission. No reporting periods are inferred from retrieval date or suffixes such as Ann./Qtr.

- Exact `EPS Qtr YoY Growth %` values were returned for all thirteen targets. They remain retained candidates until their reporting periods/scope and source bindings are proven. `Basic EPS QoQ Growth %` and `EPS TTM Growth %` are separate concepts and are not substituted.
- `Capital Adequacy Ratios Ann. %` was returned for the eight targets in slices 1/2. The period and precise regulatory methodology remain unproven; it is not automatically registered as current CAR.
- `Capital Adequacy BaseII Qtr %` returned zero for twelve targets and 18.93 for AUBANK. Even the nonzero value does not establish an approved Basel III contract. This corrects the current census without rewriting the earlier historical all-zero discovery report.
- `Key Performance Tier1 Ann. %` is returned, but Tier 1 is not automatically CET1.
- AUBANK returned `NIM Ann. % = 4.75`, `PBV Adjusted = 3.57` and `BVSH Latest = 273.26`. Annual NIM is not NIM TTM; adjusted PBV is not generic P/B; BVSH Latest lacks the required dated book-value/return-basis contract. None was silently admitted.
- Native annual ROE, annual ROA and NIM TTM were not returned in these four responses. This is a response-specific finding, not proof that the provider has no such fields anywhere. The requested stock universe and broad field query caused the provider to return multiple other candidate labels, so absence from this response is not a source-definition proof.
- P/E TTM/self-history implied-upside values are retained distinctly. Implied upside is not a P/E ratio or intrinsic fair value and cannot satisfy a different required valuation primitive.

## Acceptance boundary

**Zero new canonical admissions resulted from these fresh responses.** Four source captures and provider-control accounting were written; canonical observations, review decisions, snapshots and selections were not written by the acquisition executor. The previously source-qualified 26 NPA reviews remain separately established and are not relabeled as fresh Trendlyne reviews.

Banking remains **0/13 persisted READY / NOT PROVEN**. Fresh transport does not resolve missing metric definitions, financial period/scope proofs, ownership denominators, ratings/governance review or historical corporate-action contracts. No complete bank currently qualifies for materialization. No Production, migrations, Auth/RLS, R2, scheduler or V1-5 changes.

## Engineering and audit evidence

New acquisition handler restricts exact four slices and Development project, rejects missing/mismatched grants before spending, verifies every requested open equity and provider identity, performs one budgeted attempt, retains raw evidence, settles accounting and performs no canonical writes. Deno regression verifies scope/project/grant rejection and business-error handling. One type-checked acquisition test, 377 Edge tests, Edge lint and whitespace PASS.

Four real calls executed handler **v1**, bundle SHA-256 `28f457941e0a3966f060727455e30457de5e07204afc9acc06589d6f225a0d1e`. Intermediate **v2 ACTIVE at that checkpoint**, SHA-256 `c748eb62d6d895a3f5a19fe74941ed50d2cd6cd2b895ef7714b3e8e40d7757e2`, additionally rejects JSON business errors and retains full run-scope metadata. v2 was not re-executed; no retry is disguised as validation. Canonical validator remains v46.

Adjacent execution, source-capture, target-only contract inspection, budget reconciliation and deployment records provide the exact evidence. Active grant IDs and provider credentials are excluded from repository artifacts. The provider response originals are explicitly untrusted evidence, not instructions.

## Native-tool continuation and corrected SBIN selector

The live MCP tools/list response established the actual selector and exact-parameter contracts. The earlier SBIN request supplied internal instrument ID `1193`; the ownership endpoint requires an NSE symbol/BSE code/ISIN. A newly scoped, non-retry call with **SBIN** succeeded, source `7046502f-1d08-4c33-bb30-b6bc8cdd34b0`. Six consecutive Promoter and Institutional chart entries parse through the existing production parser. This corrects evidence availability to **13/13 banks**. Percentage denominator, original disclosure dates/revisions and source admission still require proof; both selected ownership guards correctly remain SOURCE_SEMANTICS_NOT_PROVEN. The earlier unsuccessful capture is preserved.

Four parameter-search attempts (one core, three focused) supplied actual masked tokens. Four exact get_stock_parameter_values calls, one per approved slice, used source-proven `roea` and `roaa` tokens and NSE symbols. All **13 banks returned annual ROE and ROA** with exact requested identities and no extra stocks. These values were missed by broad semantic search. Reporting period and consolidation scope remain absent; 2026-10-09 remains a provider data date, not an inferred fiscal year-end. No new reviews or observations were admitted.

Focused capital search returned annual capital adequacy, Basel II quarterly and Tier 1 labels, but did not prove CET1 or Basel III semantics. Margin search returned `nima` = NIM Annual %, not NIM TTM; Net Profit Margin TTM is a different metric. Growth search returned `epsyoygrowth` = EPS Qtr YoY Growth %, alongside distinct QoQ/TTM fields. Absence from these bounded top-result searches does not prove global provider absence. Do not invent or substitute the unfinished banking metric contracts.

This fresh continuation totals **13 successful provider tool attempts** (4 broad financial + 4 parameter searches + 4 exact annual + 1 corrected SBIN) and **one MCP protocol discovery request**. All fourteen reservations independently read back SETTLED: thirteen internal units consumed, zero failed units, one catalog reservation unit released. Catalog accounting uses TRANSPORT_BOOTSTRAP with zero provider tool units. No automatic retries. Internal units do not assert provider currency costs.

Financial acquisition **v7 ACTIVE**, bundle `c6558102460e6d31a93608dd80ef00c29a86bad2d856d4b9101d6e4fb422c5bb`; corrected SBIN executor **v3**, bundle `09ec6d81eaf11ec974c52ba8cfdaea8eceed6682159a1f3a5ed6e256bb18a3b6`. Native calls executed versions 3/4/5/6 as recorded in adjacent deployment/execution files; final v7 adds invalid-token-array rejection, not another provider attempt. Exact tokens must bind a retained successful search result; arbitrary queries, slices, arrays and Production projects fail closed. Four relevant type-checked Deno tests, 377 Edge tests, architecture guard, TypeScript and Edge lint PASS. The two unused test-server argument lint findings were repaired without skipping tests.

Independent post-acquisition readback verifies **all 13 selection/snapshot identities exactly unchanged**: 11 REVIEW_REQUIRED, 2 CONFLICTING, 0 READY. Earlier history qualification replays remain historical observations with their recorded evaluation times and freshness windows, not an assertion that those short-lived proofs remain current indefinitely. Full owner-authenticated 299-item HTTP replay/materialization has not occurred in this continuation. The approved 26 source-qualified NPA reviews remain separately established; no whole bank is declared complete.
