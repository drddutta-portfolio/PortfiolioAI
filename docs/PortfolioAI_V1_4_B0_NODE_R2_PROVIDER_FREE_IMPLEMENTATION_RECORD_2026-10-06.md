# PortfolioAI — B0 Node/R2 Provider-Free Implementation Record — 2026-10-06

## Scope

Repository: `drddutta-portfolio/PortfiolioAI`  
Branch: `PortfolioAI-Development`  
Supabase Dev: `lrgpjimipfkyoqbpsqzz`

This phase implemented the Development Node / Cloudflare R2 B0 architecture and provider-free verification only.

No Angel One request, authentication request, history request, replacement acquisition grant, benchmark mapping/history write, migration, Auth/RLS change, scheduler action, P8 execution, Batch D/F, V1-5 work, Production deployment or `main` change was performed.

V1-4 remains **IN PROGRESS / NOT PROVEN**.

## 1. Supabase capacity policy

Owner-confirmed application quota:
- **500,000,000 bytes**

This replaces the obsolete 200,000,000-byte acquisition restriction.

Latest authoritative measurement:
- `pg_database_size('postgres') = 202,812,563 bytes`
- quota used: **40.56%**
- quota headroom: **297,187,437 bytes**
- status: **NORMAL**

Capacity thresholds:
- WARNING: 400,000,000 bytes
- ACTION: 450,000,000 bytes
- HARD STOP: 475,000,000 bytes
- ABSOLUTE OWNER QUOTA: 500,000,000 bytes

B0 keeps the complete instrument-master body in Cloudflare R2. Supabase stores only compact control/audit rows and object metadata.

The deployed control function requires a recent authoritative capacity snapshot before mutating B0 actions:
- snapshot max age: **30 minutes**
- expected B0 control increment: **100,000 bytes**
- projected size must remain below the 475,000,000-byte hard-stop threshold

Before creating any future replacement acquisition grant, refresh the authoritative database-size snapshot provider-free and redeploy/update the control attestation if necessary.

No B0 V3 control rows, provider-usage rows, grants or grant consumptions were created during the provider-free preparation.

## 2. Cloudflare R2 storage design

Cloudflare account:
`ced17d24f4b380721e58a08c9e9273e4`

Bucket:
`portfolioai-history-dev`

Existing isolation:
- P8: `portfolioai-history/development/p8/`
- backups: `portfolioai-backups/development/`
- B0 root: `portfolioai-capture/development/v1/b0/`

B0 capture prefix:
`portfolioai-capture/development/v1/b0/angel-one/instrument-master/`

B0 synthetic-test prefix:
`portfolioai-capture/development/v1/b0/tests/`

P8 and backup prefixes remain present and were not written or deleted.

## 3. Development R2 gateway Worker

Worker:
`portfolioai-b0-r2-gateway-dev`

Workers.dev host:
`portfolioai-b0-r2-gateway-dev.dr-d-dutta.workers.dev`

Latest gateway deployment ID:
`021549aa1e9c4eea966d2db8ebacdf12`

Worker script ETag:
`17694efe4e3188197fa59681113ef426c5239c90737865292fb373962bc83c45`

Properties:
- direct R2 binding to `portfolioai-history-dev`
- hard-coded allowed B0 prefixes
- rejects arbitrary keys outside B0
- 64 MiB byte ceiling
- streamed request body to R2
- create-only conditional PUT (`If-None-Match: *`)
- GET / HEAD for retained objects
- DELETE allowed only for `.../tests/` keys
- completed capture keys cannot be deleted through this gateway
- no public R2 bucket/domain enabled
- gateway authentication checks SHA-256 of a bearer token; only the digest is embedded in Worker code
- credential itself is not in Git, browser `VITE_*` variables, logs or responses

The connected Vercel secret API would not accept secret injection through this environment, so the Node route uses the caller's authenticated server bearer token and forwards that same credential server-to-server to the gateway. The route stores only the token SHA-256 digest.

## 4. Node B0 implementation

Source:
`api/b0-node.ts`

Key source commit:
`da49dcf09bca0c33bebe0658b29387a3b658ad22`

Preview-only self-test addition:
`a0f433a671a0a9a85f7c9f8cb61877cdebdeb3dd`

Vercel configuration:
- `maxDuration: 60`
- `memory: 1024` MB

Existing `vercel.json` rewrites were preserved.

Node route actions:
- `SELF_TEST` — provider-free only
- `R2_TEST` — provider-free only
- `CAPTURE` — real provider path, not invoked
- `PREFLIGHT` — retained-artifact provider-free preflight, not invoked against a real master

Hard runtime guard:
- `VERCEL_ENV === "preview"`
- `VERCEL_GIT_COMMIT_REF === "PortfolioAI-Development"`

Real capture path:
1. validates exact frozen twelve-code order;
2. calls Supabase control `BEGIN_CAPTURE`;
3. only after grant/control success may issue one Angel master GET;
4. zero automatic provider retries;
5. 30-second provider timeout;
6. rejects declared or streamed body over 64 MiB;
7. computes SHA-256 while streaming exact bytes;
8. streams directly to Development R2 gateway;
9. uses immutable acquisition-specific object key;
10. separately records response received, body complete and capture persisted;
11. does not start history acquisition.

Retained-artifact preflight:
- reads R2 object as stream;
- recomputes SHA-256 and byte count;
- requires exact hash match;
- parses full JSON;
- applies the existing twelve-code exact identity registry;
- similarity remains investigation-only;
- no mapping/history writes.

## 5. Supabase Node control endpoint

Function:
`p7-ic-b0-node-control`

Function ID:
`ffa71346-b3be-4e95-9075-9f8c54ec0327`

Version:
**4**

Bundle SHA-256:
`894f0b59b192dfb23c69232a3003ec8095117145f4b7962779ada9181fd90b64`

Control source commits:
- `c9266e70352cb1fa0ba11b3100a45d5c91961605`
- `537141e659475037e66b1dae9a590233c3934d74`

Authenticated provider-free `HEALTH` returned HTTP 200.

Control v4 no longer contains the obsolete 200 MB hard block.

Mutating actions are instead capacity-gated by the owner-confirmed 500 MB policy and a fresh authoritative capacity attestation.

Current deployed capacity state:
- verified bytes: 202,812,563
- projected B0 control bytes: 202,912,563
- level: NORMAL

`BEGIN_CAPTURE` remains acquisition-grant gated and was not invoked.

When later invoked under separate owner authorization, `BEGIN_CAPTURE`:
- consumes a fresh scoped grant;
- inserts one provider-usage row as `PROVIDER_TOOL_ATTEMPT`;
- initial outcome `UNKNOWN`;
- appends `ATTEMPT_STARTED`.

`RESPONSE_RECEIVED` updates provider outcome only after a response is independently established.

## 6. Vercel deployment and verified runtime evidence

Protected Development branch alias:

`portfiolio-ai-git-portfolioai-development-dibyendu-dutta.vercel.app`

Alias mapping verified from Vercel metadata:
- deployment: `dpl_A9jugTdUESKUaa8aZHgeoLjTSZtv`
- deployment URL: `portfiolio-blewbjb1f-dibyendu-dutta.vercel.app`
- Git branch: `PortfolioAI-Development`
- deployment Git SHA: `3fbc8e3c864ff40199e7a6770145d00d6e0b9e36`
- deployment type: `LAMBDAS`
- framework: `vite`
- state: **READY**
- region: `iad1`

### Effective B0 Node application SHA

The deployment Git SHA includes later documentation/control-plane commits.

Source comparison from `2e14e073a917716a57746c1a8ec322bc59ccbcc6` to the deployed `3fbc8e3c864ff40199e7a6770145d00d6e0b9e36` shows only:
- documentation changes; and
- `supabase/functions/p7-ic-b0-node-control/index.ts` changes.

The following Vercel B0 application files are byte-for-byte identical at both SHAs:
- `api/b0-node.ts`
- `supabase/functions/_shared/v14-master-capture.ts`
- `supabase/functions/_shared/v14-batch-b-contract.ts`
- `supabase/functions/_shared/p7-ic-benchmark-adapter.ts`
- `vercel.json`

Therefore the effective B0 Node application SHA serving the verified SELF_TEST is:

`2e14e073a917716a57746c1a8ec322bc59ccbcc6`

No application redeployment is required solely because later documentation/control-plane commits exist.

### Codex-verified protected runtime SELF_TEST — PASS

Codex successfully invoked:

`https://portfiolio-ai-git-portfolioai-development-dibyendu-dutta.vercel.app/api/b0-node?action=SELF_TEST`

Verified response:
- HTTP: **200**
- Node: **v24.21.0**
- environment: **preview**
- branch: **PortfolioAI-Development**
- region: **iad1**
- synthetic payload: **41,972,803 bytes**
- duration: **1,903 ms**
- observed peak RSS: **163,631,104 bytes**
- observed peak heap: **46,495,008 bytes**
- parsed rows: **1,289**
- twelve synthetic identities: **12/12 EXACT_MATCH**
- SHA-256: `e53516e0ae20a683198452f399235f0b7c0ff7c40d77e0836d41cbd4adf4defa`
- request ID: `bom1:iad1::iad1::456z5-1791312368062-4cfc7bf098fc`

Expected provider-free failure-path outputs were also returned for:
- malformed JSON;
- response >64 MiB;
- hash mismatch;
- ambiguous exact identity.

Runtime interpretation:
- the 40 MiB-scale parser/hash path completes within the configured Vercel Node function envelope;
- measured runtime and memory are materially below the configured 60-second / 1024 MB bounds;
- all twelve synthetic exact identities resolve correctly in the real protected Development runtime.

This is **parser/runtime evidence only**.

It does **not** establish that any of the twelve real Angel One benchmark identities are available, exact, ambiguous or unavailable. Actual benchmark availability remains unproven until a separately authorized real master is captured and provider-free preflight is run against that retained artifact.

### Connector-access note

The ChatGPT Vercel connector still cannot itself invoke this protected preview because its current team-scoped access returns HTTP 403 for scope `dibyendu-dutta`.

That connector limitation does not negate the Codex-verified runtime PASS above. The runtime result is tied to the branch alias/deployment through Vercel alias metadata and source comparison.

A runtime-log lookup using the supplied request ID returned no matching log entry in the available log window; no contradictory runtime evidence was found.

## 7. Authorized one-object R2 integration test

Test key:
`portfolioai-capture/development/v1/b0/tests/49e6f219-85f3-48cd-8b76-5c44334b7180/master.json`

Operations:
- uploads: **1**
- object readbacks: **1**
- object deletes: **1**
- retries: **0**

Payload:
- 132,645 bytes
- SHA-256:
  `a91ab83e928e5f6fb7f93c13373aab1e3ec3846e3a4077b14a9b02346a2af976`

Upload:
- HTTP/API status 200
- stored size 132,645
- R2 ETag `76a864d53929b9a0535db602c2dd44dc`
- version `7e5eedd6ca2e01445cf07ff6d7e7f400`

Readback:
- size 132,645
- SHA-256 identical
- exact bytes identical

Cleanup:
- delete issued in the same bounded test operation;
- subsequent prefix listing returned zero objects.

No synthetic test provider-usage row was created.

Note: the execution container could not resolve the Workers.dev hostname, so the object lifecycle was executed through Cloudflare's authenticated R2 object API rather than end-to-end through the gateway. R2 integrity/cleanup is proven; Node-to-gateway network invocation remains unverified for the same provider-free tooling-access reason described above.

## 8. Failure-path checks

Existing shared capture/parser tests cover:
- exact-byte hashing
- malformed JSON
- oversize rejection without truncation
- ambiguous exact identities
- exact/unavailable identity behavior
- interrupted accounting
- representative large synthetic streams

Current local route-guard mock checks PASS:
- P8 prefix rejected
- backup prefix rejected
- B0 capture prefix allowed
- B0 tests prefix allowed
- HTTP 412 => `B0_R2_OBJECT_EXISTS`
- HTTP 413 => `B0_R2_OBJECT_TOO_LARGE`
- Production runtime rejected
- wrong preview branch rejected
- exact Development preview context accepted

The deployed `SELF_TEST` returned the expected malformed-JSON, oversize, hash-mismatch and ambiguity results during the Codex-verified runtime PASS. Interrupted-accounting behavior remains covered by the shared provider-free test contract.

## 9. Required conditions before replacement B0

Do not authorize the provider GET yet.

Capacity policy is no longer a blocker at the current 202,812,563-byte database size.

Before a replacement B0 acquisition:
1. refresh and verify `pg_database_size('postgres')` within 30 minutes of the first B0 control write;
2. require projected bounded B0 control writes to remain below the 475,000,000-byte hard-stop threshold and absolute 500,000,000-byte quota;
3. use a **fresh** one-time grant scoped only to B0 V3 capture;
4. preserve the exact immutable R2 master artifact before provider-free preflight;
5. stop after B0 and obtain separate owner authorization before B1.

The protected Development 40 MiB Vercel Node `SELF_TEST` is **Codex-verified PASS** and is no longer a technical blocker.

## 10. Proposed replacement-B0 ceilings

Not authorized in this phase.

Provider:
- Angel master GET <=1
- authentication 0
- history 0
- automatic provider retries 0
- provider timeout 30 seconds
- response ceiling 64 MiB

R2:
- completed master object <=1
- immutable object key
- no P8/backup writes
- no completed-capture delete through gateway

Supabase:
- absolute owner quota: <500,000,000 bytes
- WARNING threshold: 400,000,000 bytes
- ACTION threshold: 450,000,000 bytes
- B0/noncritical HARD STOP threshold: 475,000,000 bytes
- fresh capacity snapshot required before writes
- fresh grant <=1
- consumed grant row <=1
- provider usage row <=1
- append-only stage records <=5
- compact master metadata row <=1
- master body/base64 in Postgres: 0
- benchmark mapping/history writes: 0

## Disposition

Cloudflare R2 storage policy: **SELECTED / PRESERVED**.

B0 Node source implementation: **COMPLETE**.

R2 gateway: **DEPLOYED**.

R2 one-object integrity/cleanup test: **PASS**.

Supabase compact control endpoint: **DEPLOYED / CAPACITY-GATED / ACQUISITION NOT INVOKED**.

Vercel build/deployment: **PASS / READY**.

Deployed 40 MiB Node runtime self-test: **PASS — Codex-verified protected Development runtime**.

Database capacity gate: **PASS / NORMAL — 202,812,563 bytes of 500,000,000**.

Replacement acquisition grant: **NOT CREATED**.

Angel One request: **NOT MADE**.

B1: **NOT AUTHORIZED**.

V1-4: **IN PROGRESS / NOT PROVEN**.
