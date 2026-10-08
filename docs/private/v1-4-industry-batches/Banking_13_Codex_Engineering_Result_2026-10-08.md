# V1-4 banking engineering execution — 8 October 2026

## Outcome

Engineering verification PASS for implementation commit `08eccdc5ec77ead2e0949ad95297bef7dacc3657` (the tested code tree was committed without further code edits). Based on current Development `73e46b7d`, preserving changes after the supplied `838087b7` handoff.

Live authenticated banking validation NOT EXECUTED. Development deployment NOT PERFORMED. Persisted banking readiness remains 0/13 in the read-only census. V1-4 NOT PROVEN; V1-5 excluded.

## Demonstrated repair

The existing canonical materializer now accepts `securityIds` only with `P7_IC3_VALIDATE_CANONICAL_INPUTS`. Requests contain 1–40 unique valid UUIDs, omit offset/limit and preserve requested order. Existing Development project guards, portfolio-owner authentication and source/evaluation cutoff checks apply. Every ID must belong to that owner's portfolio's open equity holdings; a mixed eligible/ineligible request fails before evidence loading. Targeted mode never consumes a write grant or invokes snapshot materialization. Existing offset/limit materialization remains unchanged.

Handler-level tests exercise all four approved slices (4/4/4/1), missing authentication, wrong owner, mixed eligible/ineligible IDs, duplicate/malformed/oversized selections, invalid cutoff, unexpected action, existing Production/project protections and zero writes/grant consumption/provider requests. These run the real Deno handler with mocked HTTP database/auth transport; they are not live authenticated Development results.

## Verification

All commands exited 0:

- `npm ci`
- `npm run check:architecture` and `npm run lint:architecture`
- `npm run typecheck`, `npm run lint`, `npm run lint:edge`
- `npm run test:edge -- --reporter=dot`: 57 files / 375 tests
- `npm test -- --reporter=dot`: 351 files / 2,300 tests
- `npm run build`: production build (chunk-size advisory remains)
- Deno 2 handler tests, with type checking: `deno test --allow-env --allow-net=esm.sh --no-lock supabase/functions/complete-research-refresh/index.deno.test.ts supabase/functions/p7-ic2-materialize-readiness/index.deno.test.ts`
- `git diff --check`

Node 24.19; Deno invoked through npx with caches outside the repository. No dependency/lockfile change. Test logs are local execution artifacts, not hosted CI claims.

## Fresh read-only findings

SQL census measured 2026-10-08T15:04:01.553549Z on Development `lrgpjimipfkyoqbpsqzz`: 13 banks, 11 REVIEW_REQUIRED, 2 CONFLICTING, 234 blocked requirement items, zero requirement-review ledger rows. Full item identifiers/source links and explicitly null prospective results are in `Banking_13_Codex_Read_Only_Audit_2026-10-08.json`.

| Persisted reason | Items |
| --- | ---: |
| NORMALIZED_INPUT_CONTRACT_NOT_PROVEN | 94 |
| REQUIRED_EVIDENCE_MISSING | 77 |
| DOCUMENT_EVIDENCE_REQUIRES_REVIEW | 32 |
| REPORTING_PERIOD_TYPE_NOT_PROVEN | 13 |
| CORPORATE_ACTION_TREATMENT_NOT_PROVEN | 10 |
| ADJUSTMENT_CALENDAR_ALIGNMENT_NOT_PROVEN | 5 |
| REPORTING_PERIOD_INVALID | 3 |

All 13 bundled coverage entries are RESOLVED/BANK with authority BANK_NBFC_STAGE_8_BANK_V1; persisted assignment versions match bundled authority parent `e7c021b865fcd1d49a7c59924ef9c44f0383f301`. This verifies code-effective assignment and snapshot/bundle consistency, not a new live owner review or approval of subsequent classification changes.

The 77 missing items require retained-source/projection investigation before acquisition is justified. The 94 normalization and 16 period items require source-linked contract proof. The 32 documentary items require independent substantive source-bound review. The five alignment items require actual history/calendar validation. These are provisional investigation routes from persisted reasons, not completed factual adjudications.

## KARURVYSYA / KOTAKBANK conflicts

Each has five conflicting requirements: MAX_DRAWDOWN_1Y, PRICE_MOMENTUM_12M, PRICE_MOMENTUM_6M, RELATIVE_STRENGTH_12M, VOLATILITY_RELATIVE. Persisted normalized validation reports CORPORATE_ACTION_TREATMENT_NOT_PROVEN, UNSUPPORTED corporate-action state and 276 sessions. Insufficient session count is therefore not the reported conflict cause.

Retained proofs retrieved 2026-10-07 05:21:38.50398+00 subsequently declare COMPLETE:

| Stock | Later proof | Superseded proof | Treatment record |
| --- | --- | --- | --- |
| KARURVYSYA | df22259b-d334-4106-88c5-1f2134f9dbc9 | fc14c57e-5633-4403-a42f-172e17dfa596 | 80883e0f-a0b8-4752-8aad-3a4b3017838a |
| KOTAKBANK | ba379ac0-386f-40e0-96c6-7cc4cc87ea1b | 7e808b4b-c8aa-4320-af2f-603e81a66890 | f80e824b-8cfe-4c34-b1c5-bf4837856e6d |

They reference KARURVYSYA Bonus 1:5 source d77b371f-54ab-4fae-b2db-66e9bb2b9c75 and KOTAKBANK face-value split 5-to-1 source 9f2b18b1-f388-4f57-8924-9a14592126e8. Both use PRICE_RETURN_RAW_CLOSE and latest session 2026-10-06.

This demonstrates different retained and persisted lineage states. It does not prove treatment correctness, current freshness or READY. Existing history-proof loading already selects the latest eligible proof under the supplied cutoff and fails on conflicting tied payloads; no speculative financial repair was made. The actual authenticated replay must validate linked treatment/calendar/session records and report whether the prospective conflict changes.

## Smallest activation package

Review the code change and, if approved, deploy only `p7-ic2-materialize-readiness` (including bundled dependencies) to Development project `lrgpjimipfkyoqbpsqzz`. This deployment is outside the present authorization; no schema migration, scheduler or Production change is required.

A supported runtime must supply an existing genuine portfolio-owner session securely. Do not copy JWTs or keys into chat, repository or evidence artifacts. The present runtime has no provisioned owner session; SQL connector access is not a substitute.

Use `Banking_13_Read_Only_Request_Manifest.json`, add the verified portfolio ID, a fresh selection-run UUID and explicit evaluation/source cutoffs meeting the existing handler contract; omit offset/limit. Execute its four slices with the read-only action. Record deployment source hash, exact request identities/cutoffs, response hashes, per-requirement prospective results and pre/post persisted snapshot-selection comparison. Confirm zero provider calls, DB/R2 writes and grant consumption independently.

Deployment authorization here would cover only that one Development function. It would not authorize materialization, provider acquisition or documentary decisions. After read-only results identify genuinely admissible candidates, request separately bounded execution authority if needed.

Frozen 111 membership, ₹13,25,856.96 baseline and minimum 100 READY / ₹11,93,271.27 remain unchanged. No live before/after improvement is claimed.

