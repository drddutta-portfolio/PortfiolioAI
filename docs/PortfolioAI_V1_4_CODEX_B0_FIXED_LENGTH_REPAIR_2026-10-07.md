# V1-4 B0 fixed-length capture repair

Development only. V1-4 remains IN PROGRESS / NOT PROVEN; V1-5 is unauthorized.

The owner authorizes the Angel One and Trendlyne calls needed for V1-4. Calls remain scoped, deduplicated and accounted, with no automatic retries or invented evidence. This does not authorize Production/main, P8, scheduler activation, Auth/RLS changes or migrations.

## Actual failure and repair

Grant `0bd038e6-71fd-4307-b0d0-689cbf6697cd` was consumed once. The single Angel instrument-master GET returned HTTP 200; BODY_COMPLETE records 34,101,944 decoded bytes and SHA-256 `6676b303812f3969c098b8efa794c5d32b99e3e206db55e3e9b13f219fd746a6`. R2 upload failed; no successful retained-master preflight is claimed. Neither prior consumed grant is reset or reused.

The gateway supplied R2 an ordinary transformed stream without a known length. The prior small R2 test used the object API rather than this gateway. The repaired Node capture stages bounded raw bytes in a private ephemeral file, calculates their hash and exact decoded length, uploads with Content-Length, and removes the file in finally. It does not parse or store the large payload in Supabase. The gateway uses Cloudflare FixedLengthStream, enforces the exact length and 64 MiB limit, preserves create-only writes and the existing Development bucket/prefix/auth scope. Permanent captures cannot be deleted through the gateway; cleanup remains restricted to synthetic test keys.

SELF_TEST now also stages and reads back its 40 MiB synthetic artifact with byte/hash verification. Regression tests verify chunked byte preservation, size rejection, authentication, protected prefixes, required length, upload/readback, overwrite prevention, short-body rejection and synthetic cleanup. Source is retained in `cloudflare/portfolioai-b0-r2-gateway-dev/worker.js`.

## Validation

- `node scripts/test-b0-spool-gateway.mjs`: PASS, no provider requests.
- `node scripts/test-b0-control-append-only.mjs`: 3/3 PASS.
- `npm run check:architecture`: PASS.
- `npm run build`: PASS; existing chunk-size advisory remains.
- Development gateway deployment: `215ee591f5d44d59b489d3fd124028c7`.
- Hosted runtime verification and replacement acquisition are recorded separately after actual execution; this preparation record does not claim them complete.

The first hosted invocation exposed a packaging omission: Vercel did not include the imported server TypeScript helper. `includeFiles` now includes both shared contracts and the server helper. No acquisition was invoked on that failed deployment. Repository ESLint does not include server/API files in its project service; those invocations failed configuration resolution and are not counted as lint PASS.

## Hosted execution and retained-master result

Tested application SHA: `108508ef7817fffe12c7c4468dffc88be597a758`. Protected Preview `dpl_EuvcP3ViAQybVohiMCY68CnTWDbz` is READY. The actual hosted 40 MiB SELF_TEST returned HTTP 200 in 4,152 ms, with 41,972,803 bytes, observed RSS 225,861,632 bytes / heap 47,174,216 bytes, and spool/readback hash equality. The actual protected Node → Development gateway → R2 small roundtrip returned HTTP 200, verified 132,645 bytes/hash and twelve synthetic identities, and deleted only its synthetic test object. These tests do not establish real benchmark availability.

Replacement grant `ac5b547f-f836-4d6a-9119-1e9058b327ce` was consumed exactly once. Exactly one new public instrument-master GET returned HTTP 200; no authentication/history call or retry occurred. CAPTURE_PERSISTED and PREFLIGHT_COMPLETED were appended. Master metadata record: `e8ea47d8-5414-4c69-b7f9-20b99759342c`.

Retained object: `portfolioai-capture/development/v1/b0/angel-one/instrument-master/ac5b547f-f836-4d6a-9119-1e9058b327ce/2026-10-06T19-28-47-521Z.json`.

34,101,944 bytes; 145,636 parsed rows; SHA-256 `6676b303812f3969c098b8efa794c5d32b99e3e206db55e3e9b13f219fd746a6`, verified independently from R2 readback. Large body is R2-only; Supabase contains its compact reference and preflight metadata.

| Original benchmark | Exact identity outcome |
| --- | --- |
| NIFTY_CAPITAL_GOODS | UNAVAILABLE — NO_EXACT_ACCEPTED_ALIAS_NSE_AMXIDX |
| NIFTY_CHEMICALS | UNAVAILABLE — NO_EXACT_ACCEPTED_ALIAS_NSE_AMXIDX |
| NIFTY_CONSUMER_DURABLES | UNAVAILABLE — NO_EXACT_ACCEPTED_ALIAS_NSE_AMXIDX |
| NIFTY_CONSUMER_SERVICES | UNAVAILABLE — NO_EXACT_ACCEPTED_ALIAS_NSE_AMXIDX |
| NIFTY_FINANCIAL_SERVICES_EX_BANK | UNAVAILABLE — NO_EXACT_ACCEPTED_ALIAS_NSE_AMXIDX |
| NIFTY_HOSPITALS | UNAVAILABLE — NO_EXACT_ACCEPTED_ALIAS_NSE_AMXIDX |
| NIFTY_INDIA_DEFENCE | UNAVAILABLE — NO_EXACT_ACCEPTED_ALIAS_NSE_AMXIDX |
| NIFTY_OIL_GAS | UNAVAILABLE — NO_EXACT_ACCEPTED_ALIAS_NSE_AMXIDX |
| NIFTY_POWER | UNAVAILABLE — NO_EXACT_ACCEPTED_ALIAS_NSE_AMXIDX |
| NIFTY_SERVICES_SECTOR | UNAVAILABLE — NO_EXACT_ACCEPTED_ALIAS_NSE_AMXIDX |
| NIFTY_TELECOM | UNAVAILABLE — NO_EXACT_ACCEPTED_ALIAS_NSE_AMXIDX |
| NIFTY_TRANSPORTATION_LOGISTICS | UNAVAILABLE — NO_EXACT_ACCEPTED_ALIAS_NSE_AMXIDX |

**B0 capture/readback/preflight: COMPLETE. B1 eligibility: 0/12.** This is a real provider-capability result, not an access failure. Similarity candidates, including BSE indices and derivatives, are investigation evidence only. No substitute mapping/history was written, and no identity was fabricated. The existing all-twelve-exact B1 contract was not weakened.

## Safety reconciliation

Across the three actual capture attempts in this Codex execution: three master GETs, zero automatic retries, zero Angel authentication/history requests and zero Trendlyne calls. Two earlier attempts failed at independently observed stages; their consumed grants and immutable usage records remain untouched. Usage is 1,730 (+3 from 1,727); sources are 4,977 (+17 from 4,960: three grants, three consumptions, ten stages and one retained-master metadata record). The immutable UNKNOWN attempt outcomes are supplemented by append-only response-stage evidence; no usage event was updated.

Canonical counts remain snapshots 1,485; items 22,401; selections 956; lineage 478; reviews 0; benchmark-history rows 2,710. Frozen manifest SHA-256 remains `79f551558333adc1f37d6a26298d8088ee02db3161f03c6d6e59f9a19a93fc27`. Database measured 202,837,139 bytes, safely below the 500,000,000-byte owner quota.

No Production/main, migrations, Auth/RLS changes, scheduler activation, P8 execution or V1-5 work occurred. Only the Development B0 gateway code, synthetic test objects, one real retained capture and compact append-only control records were changed.

## Remaining V1-4 boundary

Further Angel master fetches cannot establish the missing exact identities. B1 cannot run under its current contract. Exact benchmark authority/source coverage must be resolved without substituting a different index, weakening methodology or inferring calendar proof. Moving to an independently supported official source for the same exact approved benchmark is distinct from changing the benchmark assignment. Unknown/nonexistent authority labels require factual resolution rather than a guessed replacement. The existing financial-period, source-metadata, ownership/document-review and corporate-action blockers also remain; B0 does not remove them and does not promote any member to READY. V1-4 remains IN PROGRESS / NOT PROVEN.
