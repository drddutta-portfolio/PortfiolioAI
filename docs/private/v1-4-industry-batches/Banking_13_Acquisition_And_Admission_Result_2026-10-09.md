# Banking V1-4 — executed acquisition and canonical admission repairs

## Acceptance result

**NOT PROVEN: 0/13 persisted READY, 11 REVIEW_REQUIRED, 2 CONFLICTING.** All thirteen selected snapshot IDs remain unchanged in the independent post-acquisition readback. No canonical snapshots or selections were written. Frozen banking value remains 20,513,862 paise; READY value remains zero. Frozen membership, methodology and the V1-4 release threshold are unchanged.

This record supersedes the execution boundary in `Banking_13_Acceptance_Execution_2026-10-09.md`, which describes the earlier read-only checkpoint. The original owner-authenticated replay remains 299 items / 15 FRESH / 284 blocked. The history replay below is narrower and must not be presented as a new authenticated 299-item result.

## Actual authorized acquisition

The owner explicitly authorized Angel One, Trendlyne and internet acquisition as needed. Execution used Development `lrgpjimipfkyoqbpsqzz`, existing server-side secrets and scoped single-use execution grants. No credentials were supplied by the owner through chat.

- Angel One: one authentication request and fourteen exact history requests, appending **sixteen stock sessions and one NIFTY_BANK session**, with fourteen immutable raw capture records. No overlap upsert or price rewrite. The thirteen-stock scope and benchmark are fixed in the executor manifest. Captured sessions are October 7/8 as required, not incomplete October 9 data.
- Official NSE ownership: thirteen master responses and **65 original XBRL filings**, five per bank; thirteen append-only structured source captures. Original fractions and ownership categories are retained literally, without synthesizing Institutional by adding FII/DII.
- Official NSE financial/governance: **207 original integrated filings**, thirteen structured source captures. Exact URLs, original byte hashes, filing identifiers, literal period/scope labels and financial table fragments are retained. Documentary capture is not a factual ACCEPT decision.
- Official NSE calendar/timing and thirteen exact tail corporate-action queries: fifteen source captures; thirteen corporate-action queries returned no events in the acquisition window. This does not prove treatment of older bonus/split events.
- Trendlyne SBIN: one request, zero retries, budget settled. HTTP/transport success contained provider business failure: `No shareholding data available` (1011). Raw capture `2bcf7129-0d28-4b62-9959-c9b4a908a31c` is preserved; append-only validation `ee27bdf9-700d-442b-99d8-5f8169a76961` classifies it UNAVAILABLE. This is not a recovered six-quarter ownership series. The corrected executor excludes failed responses from reusable ownership cache.

No R2 writes, migrations, Auth/RLS changes, schedulers, Production changes or V1-5 work. Source records and market rows were written; historical statements of zero database writes apply only to the earlier checkpoint.

## History qualification and remaining treatment conflicts

Fourteen append-only history-validation source records link prior proofs, acquired tails, official calendar/session evidence and corporate-action window sources. Price-history provenance checks found no selected rows without source IDs and no selected fixture rows. Selected 252-session windows align exactly with NIFTY_BANK; no contradictory close dates were found.

The provider-free replay executes the existing canonical history validators over read-only database projections, at **2026-10-09T03:37:19.040Z**:

| Result | Banks |
| --- | --- |
| Stock history and benchmark pair FRESH | AUBANK, AXISBANK, BANDHANBNK, BANKBARODA, FEDERALBNK, ICICIBANK, IDBI, IDFCFIRSTB, INDIANB, SBIN |
| Corporate-action treatment REVIEW_REQUIRED | HDFCBANK, KARURVYSYA, KOTAKBANK |

The replay is **not an owner-authenticated deployed-handler invocation**, not a full requirement replay, and not materialization. Its compact row projection is reconstructed after independent source/fixture checks, rather than a byte-identical full handler database load. Proof freshness is bounded by the actual qualification instant and the existing four-hour grace policy; this historical result does not guarantee freshness at a later evaluation time.

HDFCBANK's bonus, KARURVYSYA's bonus and KOTAKBANK's split need independently qualified price-adjustment/return-basis lineage. Their new proofs remain INCOMPLETE rather than accepting prior COMPLETE labels at face value. No price adjustment calculation or historical price rewrite was introduced.

## Demonstrated canonical engineering defects repaired

1. The ownership branch previously returned from its raw-chart guard before reaching the existing review-ledger validator. Qualified owner reviews can now reach the canonical admission path; unreviewed retained charts still fail closed.
2. Selected ownership series are centrally defined once. Promoter/Institutional reviews require TOTAL_EQUITY basis, a single source authority and at least four consecutive quarters. Wrong category, contradictory quarters, source mixing and governance-as-shareholding remain blocked.
3. BANK requirement names GROSS_NPA and NET_NPA now map to the existing GROSS_NPA_PERCENT and NET_NPA_PERCENT primitives. No new banking formula or source authority was invented.
4. Existing backend CORS repair is retained, including OPTIONS 204 and CORS headers on failure responses. Custom portfolio-owner / scoped-grant authentication is unchanged.
5. The SBIN acquisition executor now distinguishes business failure from successful transport and does not reuse business-error captures as evidence.

These repairs make valid evidence admissible; they do not manufacture valid evidence or auto-sign owner reviews.

## Executed verification and deployment

Local complete worktree verification: npm ci, architecture guard/lint, TypeScript, application lint, Edge lint, **2,305 application tests**, **375 Edge tests**, production build and whitespace checks passed. Final type-checked Deno run passed **five tests** covering owner/read-only boundaries, actual ownership admission integration, scoped tail validation and SBIN acquisition rejection/business-error classification. Tests use clearly identified mocked fixtures; no mock facts were written to live evidence.

Development canonical function **version 44 ACTIVE**, bundle SHA-256 `93e0f0b2a4db3918bad720e4512ebc43e7fc8db012c5987d5ffe72f5e8305016`. Existing custom authentication and gateway configuration are retained. Live unauthenticated smoke confirms OPTIONS 204 with CORS and malformed POST 400. Earlier version-43 valid-slice request without an owner session returned 401; no new genuine owner session was available for version-44 handler replay.

Tail executor version 1 bundle SHA-256 `56f5ee80adb96072bfef5bc573eca99acd43cd6ca510594d6be6ee3f7987f753` executed the authorized history scope. SBIN executor version 2 bundle SHA-256 `7afafd5921709a37d52f5f2afa9d1b0133601fbbd1bb454982c7d0d2d197e912` contains the business-error fix; it was not re-executed after the failed single capture.

Repository work is on draft PR #124, dependent on PR #123 / #121, without merge into Development. Development branch HEAD remains `927181cf02d01d5f27d441dea6fac9d9b11a6d9b`. Deployment is an explicit Development-only execution boundary, not proof that these draft PRs have merged.

## Remaining acceptance work

- Prove direct Institutional percentage denominator, quarter dates, revision/conflict treatment and security identity, including official ISIN mismatches. Six apparent chart entries alone are insufficient. SBIN's MCP business failure remains unresolved; public Trendlyne pages cannot be dated by their changing headline or URL alone.
- Establish source-qualified dates, scope and units for all required bank numeric metrics, with exact canonical metric definitions. Many existing definitions explicitly require TRENDLYNE_MCP; primary NSE filings are captured for corroboration and cannot be mislabeled as that provider.
- Complete source-linked factual/documentary review, external rating evidence and established relative-valuation contracts. Bank owner-review ledger currently has zero rows. Acquisition authorization is not a fabricated owner attestation.
- Resolve the three historical corporate-action return-basis conflicts.
- Run a genuine owner-authenticated full banking replay after evidence admission. Materialize only fully qualified candidates under valid scoped authority, then independently read back persisted canonical selections and READY frozen value.

A concrete source/review decision proposal is provided in `Banking_13_Source_Admission_Decision_2026-10-09.md`. Additional provider-call permission is not needed; changing canonical financial source authority or delegated-review attribution is a separate architecture decision.

## Evidence package

Adjacent files preserve actual Angel One execution, original SBIN transport result, exact source URL/hash manifests, the canonical-module history replay, version-44 deployment metadata, smoke checks and the final persisted selection readback. The original 299-item worklist remains unchanged for comparison.

Original 65 XML and 207 HTML filings are kept outside Git and Supabase bodies in the download archive `Banking_V1-4_Official_Source_Archive_2026-10-09.zip` (2,984,876 bytes; SHA-256 `ddd5110001520875f0af31b34bfe7c0928c98034a6ecbe738d4744f354efeeb8`). It contains source originals and acquisition/replay evidence, not later code or the version-44 deployment. Source retention and portability are not equivalent to existing R2/document binding.
