# V1-4 exact official benchmark fallback — reviewable proposal

Status: PROPOSED / OWNER SOURCE-AUTHORITY DECISION REQUIRED. V1-4 remains IN PROGRESS / NOT PROVEN. V1-5 and later gates remain unauthorized. This proposal changes the acquisition source for missing exact benchmark history, not the frozen equity cohort, classification hierarchy, methodology requirements, release thresholds or benchmark assignment.

## Verified capability, not fabricated data

The official Nifty sector/thematic catalogue exposes the required sector indices. Their absence from Angel One's retained master is a provider capability gap, not proof that those indices do not exist.

Sources:
- https://www.niftyindices.com/indices/equity/sectoral-indices
- https://www.niftyindices.com/indices/equity/thematic-indices
- https://www.niftyindices.com/reports/historical-data

Exactly two official history POSTs were made for NIFTY CAPITAL GOODS over 25-Aug-2025 through 06-Oct-2026, with no retries. Both returned HTTP 200 and 276 unique dated sessions, from 2025-08-25 to 2026-10-06. Every row has the exact official index identity and a positive decimal value. Raw values remain strings; no provider number was inferred or rounded.

| Evidence | Endpoint | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| Total-return index | `/BackPage/getTotalReturnIndexString` | 40,573 | `c8b7e00968f349f2274f9df14e81a78d521d181d02ea507517302f3ef913a1b2` |
| Price-index closes | `/BackPage/getHistoricaldatatabletoString` | 48,853 | `7e6b840117f2eaff9a07b2438516da6e939d8ef58f205b3dc912b252edbb6b6e` |

TRI retrieval: 2026-10-06T19:50:26.278545+00:00. Price retrieval: 2026-10-06T19:54:23.529529+00:00. Request encoding follows the official site's JavaScript: JSON `cinfo` containing `name`, `indexName`, `startDate`, `endDate`. Names are NIFTY CAPITAL GOODS, dates 25-Aug-2025 / 06-Oct-2026.

Raw captures are retained only in private Development R2 bucket `portfolioai-history-dev`, under `portfolioai-research/development/v1-4/official-index-capability/2026-10-07/<SHA-256>.json`. R2 upload byte counts equal the local source counts. No benchmark mapping/history rows or readiness snapshots were written; no raw body was inserted into Supabase. These are capability captures, not READY evidence.

The price endpoint explicitly returns `OPEN`, `HIGH`, `LOW` as `-`. Only CLOSE is available. Never manufacture OHLC by copying CLOSE into those fields. TRI and price-index series are distinct and must not be conflated. Successful fetching alone does not prove exchange-calendar completeness or stock/benchmark adjustment-basis compatibility.

## Concrete source-policy decision

Approve official NSE/Nifty index history as the benchmark-only fallback where Angel One has no exact supported instrument, with all of these boundaries:

1. Angel One remains current stock-price and stock OHLCV authority; Trendlyne remains the reviewed research acquisition path.
2. Use the same approved exact benchmark. Verify official identity before acquiring history. No ETF, BSE index, nearest-name, derivative or broader-index substitution.
3. Keep return basis explicit. Consume official price-index closes only where the approved calculation calls for price-index returns. Consume TRI only where the stock/benchmark contract explicitly permits compatible total-return inputs. No mixed-basis acceptance.
4. Preserve exact values, dated sessions, source URL, request window, retrieval date, raw-body hash and raw R2 reference. Reuse shared benchmark requests across affected stocks.
5. Treat close-only history as close-only. Do not force it into an OHLCV schema that requires invented values. Any needed schema change remains separately subject to specific migration approval.
6. Preserve immutable evidence, current canonical route precedence, calendar validation, corporate-action handling, freshness and failure reasons. Acquisition does not authorize READY.
7. `NIFTY_TELECOM` currently names NIFTY Telecom, whereas the official catalogue uses Nifty Telecommunications. Preserve this discrepancy for explicit identity reconciliation; do not accept a similarity match as approved equivalence.
8. Human/owner evidence-review requirements remain unchanged. Prepare source-anchored review records for one consolidated owner review, rather than recording agent review as owner review.

The current architecture designates Angel One as primary daily historical OHLCV authority and the approved batch requires exact Angel One benchmark identity. Owner call-volume authorization does not amend that source/identity contract. AGENTS.md requires reporting an architectural conflict before implementation. This limited source exception is therefore proposed explicitly, rather than silently activating a competing authority.

## Completed source parser repair

The shared source validator previously rejected the official date format `06 Oct 2026`. It now accepts both space-delimited and hyphen-delimited explicit dates and rejects impossible rollover dates, including 31-Feb / 2026-02-30. Exact index identity, positive TRI values, required dates and request-window checks remain intact. The actual 276-row retained TRI response passes the repaired semantic validator. This is capture validation only; it does not override source approval, history alignment or readiness gates.

Checks: nine new provider-free regression assertions PASS; existing source validation tests 5/5 PASS; targeted standalone TypeScript ESLint PASS; architecture guard PASS; TypeScript/Vite build PASS with existing chunk-size advisory. Shared Edge source is repaired in the repository but not redeployed or materialized in this phase.

## Execution boundary

No Angel One or Trendlyne call was needed for this capability proof. In addition to the two official history POSTs, direct source discovery made one historical-page GET and three script requests (one timed out; duplicate script links yielded the same retained JavaScript). Web-tool catalogue discovery was separate. No automatic retries, Production/main changes, database mutation, migration, Auth/RLS change, scheduler action, P8 execution or V1-5 work occurred. Exactly two new raw capability objects were written to Development R2.

Proceed with the exact-source adapter/acquisition integration only after the owner accepts the limited benchmark source exception. Other valid cached evidence work can continue independently; missing mandatory facts and factual reviews must remain explicit.
