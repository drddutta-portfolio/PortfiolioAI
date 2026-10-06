# PortfolioAI — B0 V2 Capture Reliability Recovery Package — 6 October 2026

## Scope

Repository: `drddutta-portfolio/PortfiolioAI`  
Branch: `PortfolioAI-Development`  
Supabase Dev: `lrgpjimipfkyoqbpsqzz`

This work prepared and deployed provider-free B0 V2 infrastructure only. It did not create or consume a replacement acquisition grant and did not call Angel One.

V1-4 remains **IN PROGRESS / NOT PROVEN**. No new benchmark availability conclusion is established.

## Demonstrated original failure cause

The interrupted B0 v9 execution ended with HTTP 546 / `WORKER_RESOURCE_LIMIT`.

Execution logs demonstrate:
- shutdown reason: `Memory`;
- explicit log: `Memory limit exceeded`;
- total memory: 294,209,405 bytes;
- heap: 114,550,488 bytes;
- external: 179,658,917 bytes;
- CPU used: 574 ms;
- execution time: about 9.3 seconds.

Supabase Edge documents a 256 MB maximum memory limit and 2 second CPU limit.

The log proves memory exhaustion. It does not identify one exact source line.

The deployed v9 capture path materially amplified memory because one invocation could retain:
1. the HTTP response/body buffers;
2. a decoded full `bodyText`;
3. a full parsed JSON array;
4. another encoded copy for SHA-256;
5. a large Postgres JSON payload containing the complete body.

A second independent defect was found: v9 attempted provider usage writes with `accounting_class='EXTERNAL_REQUEST'`, while live Dev accepts only `PROVIDER_TOOL_ATTEMPT` or `TRANSPORT_BOOTSTRAP`.

## Code repair

Committed shared helper:
- `supabase/functions/_shared/v14-master-capture.ts`

Key contracts:
- max response bytes: 64 MiB;
- max individual JSON object: 1 MiB;
- fetch timeout: 30 seconds;
- storage timeout: 60 seconds;
- streaming exact-byte SHA-256;
- no silent truncation;
- incremental twelve-code preflight;
- append-only stage model:
  - `ATTEMPT_STARTED`
  - `RESPONSE_RECEIVED`
  - `BODY_COMPLETE`
  - `CAPTURE_PERSISTED`
  - `PREFLIGHT_COMPLETED`
- an interrupted attempt remains `UNKNOWN` unless later evidence establishes an outcome.

Committed isolated function:
- `supabase/functions/p7-ic-b0-v2/index.ts`

The real capture action is isolated from history acquisition and requires:
- PortfolioAI Dev project;
- exact frozen twelve-code order;
- frozen portfolio ID;
- a fresh one-time grant scoped to `P7_IC2_CAPTURE_MASTER_V2`;
- sentinel `P7_IC2_BATCH_B_MASTER_PREFLIGHT_V2`.

It contains no history action.

Provider usage now uses `accounting_class='PROVIDER_TOOL_ATTEMPT'`.

## Deployed function

Function: `p7-ic-b0-v2`  
Version: **v4**  
Bundle SHA-256: `43f22a9c20347fe651b652813873aee3654fe5448c42a770569c37fb9477d38a`  
Repository entrypoint blob SHA: `94edb58910259a4c963c078a68b493102b2dec44`

Deployed entrypoint is byte-for-byte equal to current `PortfolioAI-Development` source.

The associated Vercel commit status failed only because of a build-rate-limit/upgrade gate, not a source compile error. Supabase successfully bundled and activated v4.

## Storage verification

Existing bucket `research-source-documents` remains unchanged:
- private;
- 8 MiB limit;
- PDF only.

An attempt to create `provider-capture-artifacts` with a 64 MiB per-object limit through the supported Supabase Storage client failed with:
- HTTP 413;
- `The object exceeded the maximum allowed size`.

Supabase documentation states bucket limits cannot exceed the project global file-size limit. The proposed 64 MiB storage contract is therefore not currently available in this project.

No `provider-capture-artifacts` bucket was created.

## Deployed synthetic runtime verification

A provider-free synthetic test was run in the real Supabase Edge runtime.

### Capture/hash phase

A **33,590,549-byte** synthetic JSON master was generated and streamed to `/tmp`.

The capture/hash phase completed successfully before shutdown.

Exact SHA-256:
`6e0d577d5667a4cf0d7324fad4223ea22510eaa167314528409fff066beea1c8`

This demonstrates in the deployed runtime:
- `/tmp` write works;
- Node-compatible streaming SHA-256 works;
- bounded streaming capture avoids the original memory amplification.

### Resource measurements

The later invocation shutdown was:
- reason: `CPUTime`;
- CPU used: **2001 ms**;
- total memory: **13,945,077 bytes**;
- heap: 10,716,672 bytes;
- external: 3,228,405 bytes.

The phase marker `TMP_CAPTURE_COMPLETE` was emitted before the CPU shutdown.

Therefore:
- the 32 MiB capture/hash phase completed within the Edge resource envelope;
- the subsequent retained-artifact streaming preflight did not complete before the 2-second CPU ceiling;
- memory remained low.

This changes the remaining blocker from memory to CPU for the current character-by-character parser.

The earlier local/provider-free tests remain useful for logic validation, but the deployed runtime proves the current parser is not safe at representative payload volume under the Supabase Edge CPU budget.

## Remaining unverified items

Because the 64 MiB Storage bucket could not be created:
- persistent streamed Storage upload was not tested;
- persisted-object readback was not tested;
- exact byte/hash preservation across durable Storage was not tested;
- the 12-code deployed preflight did not complete at 32 MiB due CPU limit;
- no real Angel master response has been acquired.

## Runtime safety reconciliation

After all B0 V2 preparation:
- new acquisition grants: 0;
- new grant consumptions: 0;
- B0 V2 stage rows: 0;
- B0 V2 master metadata rows: 0;
- B0 V2 provider-usage rows: 0;
- `provider-capture-artifacts` bucket: absent;
- capture objects: 0;
- benchmark mapping rows changed by this phase: 0;
- benchmark history rows created by this phase: 0;
- consumed grant `ccddba7a-f599-4ca6-a48f-249b120dd9bd`: still exactly one consumed record.

The interrupted historical audit record was not rewritten or erased.

## Required dependency before replacement B0

The current Supabase-only plan cannot meet both:
1. the 64 MiB durable object contract; and
2. realistic-volume preflight within the 2-second Edge CPU limit.

A replacement B0 therefore requires owner approval for a different durable storage / execution combination.

### Recommended recovery architecture

**Control plane:** Supabase Dev remains authoritative for grant, usage accounting, stage records and small metadata.

**Capture execution:** Development-only Node/serverless runtime with a CPU budget greater than 2 seconds.

**Durable capture:** an explicitly authorized object store that accepts at least 64 MiB objects. The existing Cloudflare R2 environment is technically suitable, but R2 writes were explicitly out of scope for this phase and were not performed.

**Preflight execution:** the same Development-only Node/serverless runtime, reading the preserved object as a stream, verifying byte count/SHA-256, validating JSON and resolving all twelve identities.

The complete master must not be copied into Postgres JSON/base64.

A Supabase-only alternative would require raising the project global Storage file-size limit to at least 64 MiB and either materially optimizing the parser below 2 seconds or moving preflight to another runtime.

## Proposed replacement B0 ceiling

Requires separate owner approval.

External/provider calls:
- Angel instrument-master GET: **maximum 1**
- authentication: **0**
- history: **0**
- provider retries: **0**

Provider response:
- maximum accepted response: **64 MiB**
- no truncation
- fetch timeout: **30 seconds**

Durable object:
- maximum **1** master object
- maximum object size **64 MiB**
- private, Development-only

Database/control writes:
- fresh execution grant: <=1
- grant-consumption record: <=1
- provider usage record: <=1
- capture audit run: <=1
- provider-free preflight audit run: <=1
- append-only stage records: <=5
- small master metadata record: <=1
- benchmark mapping writes: **0**
- benchmark history writes: **0**
- fundamental/review/snapshot/selection/lineage writes: **0**

Required stage semantics:
1. `ATTEMPT_STARTED` — request outcome remains UNKNOWN;
2. `RESPONSE_RECEIVED` — HTTP response independently observed;
3. `BODY_COMPLETE` — exact complete body received and hashed;
4. `CAPTURE_PERSISTED` — exact object durably stored;
5. `PREFLIGHT_COMPLETED` — stored object re-read, re-hashed, schema-validated and all twelve codes evaluated.

## Historical B0 reconciliation proposal

The prior interrupted run should remain unchanged.

Under a separately authorized write contract, append:
- one reconciliation evidence record referencing the interrupted audit run;
- consumed grant `ccddba7a-f599-4ca6-a48f-249b120dd9bd`;
- HTTP 546 / `WORKER_RESOURCE_LIMIT`;
- demonstrated memory peak 294,209,405 bytes;
- shutdown reason `Memory`;
- request outcome **UNKNOWN** because no durable response-received marker exists;
- no retained master artifact.

Do not reset or reuse the consumed grant.

## Disposition

B0 V2 source repair: **PREPARED / DEPLOYED FOR PROVIDER-FREE VERIFICATION**.

Memory amplification: **materially remediated in the streaming capture design**.

64 MiB Supabase Storage destination: **BLOCKED by current project Storage limit**.

Representative-volume Edge preflight: **BLOCKED by 2-second CPU ceiling**.

Replacement B0 provider acquisition: **NOT AUTHORIZED / NOT EXECUTED**.

B1: **NOT AUTHORIZED**.

V1-4: **IN PROGRESS / NOT PROVEN**.
