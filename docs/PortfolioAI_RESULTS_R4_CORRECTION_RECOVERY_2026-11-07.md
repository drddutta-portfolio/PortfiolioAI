# R4 continuation — 7 November 2026

## Verified starting state

Independent run [42334470028](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/42334470028), job 128293735230, completed at 09:39 IST: 2,046 / 2,096 company-quarters qualified across 262 equities, 42 missing and 8 conflicting. There are 32 historical gaps and 18 deferred current-quarter R3 gaps. It checked 4,027 source records and 12,106 qualified rows, preserved 6,191 decisions and reported zero protected-selection conflicts. ICICIAMC December 2024 is now independently selected in addition to the four recovered TMCV quarters. R4 remains PARTIAL.

The first full-cohort native-only workflow failed because its explicit fifteen-issuer target list exceeded the shared collector's four-issuer targeted-mode cap. No data was damaged. Commit `0a1db9c83ad720ccceebb8989576a11316c0ed21` removes that filter and uses the existing empty default, which queries every unresolved issuer. The regression proves that the full-cohort workflow cannot supply a targeted shortlist. Run [42346848901](https://github.com/drddutta-portfolio/PortfiolioAI/actions/runs/42346848901) started all four collector jobs successfully. Its native replay and independent qualification must finish before claiming new coverage.

## Whole-cohort current-conflict review

Fresh original-source checks covered all eight unresolved current-quarter conflict issuers: AVANTIFEED, BDL, COROMANDEL, DATAPATTNS, MGL, WELSPUNLIV, YATRA and ZAGGLE. Twenty-eight distinct existing XML/iXBRL source URLs were fetched or reused by exact source URL and hashed. Exchange-announcement discovery covered their original and revised filing dates. Fourteen signed/disclosure PDFs were retained locally for review. Historical catalog ISIN mismatches are retained explicitly as discovery-only evidence; they do not authorize canonical identity replacement or share rebasing. A newer timestamp, majority vote, apparent scale error, zero EPS or an alternate accounting scope never resolves a conflict by itself.

Avanti Feeds provides an explicit issuer correction dated 12 February 2026, referencing its 11 February submission and the quarter ended 31 December 2025. It states that only consolidated EPS was incorrect and that all other financial results remain unchanged. Its table distinguishes continuing, discontinued and combined operations; the combined diluted EPS is 10.96. The earlier exchange XML says 12; the revised XML says 10.96. Both report the same revenue of 1,383.5227 crore and PAT of 163.4735 crore.

The new closed correction proof binds all three complete primary originals:

- Original XML: `a87d4548a89a975acae864b57a86dcfe908f8258d2a4f4885d9c5fc8ab4385ab`.
- Revised XML: `651e0ce5ccc0e44f9dc0dc2fcb74d6fd24c87f5252bea7aca657cab65a199c21`.
- Issuer correction PDF: `735387cc8b7d578089e980ed086ad12d4f5cc457145b66c2de6f71bd6715423b`.

The pure validator independently reads exact issuer/ISIN/BSE code, Consolidated scope, OneD entity/duration, INR/INR-per-share units and all three XML values. It reads the notice's physical first-quarter column and combined-operation diluted row, rather than borrowing continuing EPS. Revenue and PAT must be unchanged, revised EPS must equal the notice, and all existing candidate facts must match their exact original version. Only that proven superseded original is omitted from the canonical selector. Other issuer versions remain competing evidence. Missing originals, changed bytes, incomplete trios, different identities/scopes/units/periods or notice disagreement preserve the unresolved conflict.

The dedicated Development workflow downloads and hash-checks both XML originals and the complete notice, retains and reads them back from private Cloudflare R2, then invokes the existing independent eight-quarter selector and readback. Existing observations/source records are immutable and preserved. No new source numbers are inserted or substituted. The selector can add decisions only when its existing protected-selection check finds no conflict. Decision provenance records the explicit correction, retained originals, as-reported EPS/comparability guard and unknown historical publication precision. No automatic stock-split conversion, historical point-in-time or V1-4 authority is introduced.

## Boundaries and validation

The canonical authorities remain `fundamental_observations` plus the existing independent `fundamental_observation_decisions` selector. The approved app repositories and UI access paths are unchanged. The new boolean in the selector's JSON proposal projection is a runtime record field, not a schema change. No migration, DDL, RLS, Auth, transaction, holding, source-record mutation, main or Production change occurs. Large originals remain in private R2; this work does not reset accumulated Supabase egress.

The corrected full-cohort workflow passed 25 collector tests. The new correction passes eight deterministic source/notice/unit/identity/quarter/failure-isolation tests and a local replay of the three actual originals. A full R4 regression run is in progress. Hosted independent qualification and a fresh final gap register are still required before reporting additional accepted coverage. The other seven current-quarter conflicts remain quarantined pending adequate correction/statement proof; parser-readable numbers alone are not acceptance.

## Current-quarter provider discovery extension

The existing authenticated Trendlyne workflow now includes an independent current-gap job. Its acquisition-only SQL projection was executed read-only against Development: 18 pending slots across 13 issuers, including the eight conflicts; four slots lack an exact matched Trendlyne provider identity. Every matched slot receives one exact-quarter primary-results search and one exact-quarter correction/EPS search. No annual/TTM or relative-quarter value is imported. The existing per-run, daily/monthly provider limits, sixty-second fresh-call spacing per job, authenticated workflow identity, same-day successful-response reuse and private R2 capture remain in effect. One request failure records a retry and does not prevent attempts for other slots. Missing identities remain explicit, never guessed. Historical source discovery retains its existing job and scope.

The new captures are discovery evidence only. They cannot create canonical financial observations or resolve a conflict without an independently validated original-source contract. Five new regression cases cover all-slot planning, exact dates, missing identities, deterministic deduplication and continuation after one failed request. Workflow authentication/provider-result regressions also pass. The full 435-case R4 Python suite passes. Hosted provider outcomes remain to be recorded.
