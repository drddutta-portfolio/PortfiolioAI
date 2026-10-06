# PortfolioAI — B0 Node/R2 Provider-Free Implementation Record — 2026-10-06

## Scope

Repository: `drddutta-portfolio/PortfiolioAI`  
Branch: `PortfolioAI-Development`  
Supabase Dev: `lrgpjimipfkyoqbpsqzz`

This phase implemented the Development Node / Cloudflare R2 B0 architecture and provider-free verification only.

No Angel One request, authentication request, history request, replacement acquisition grant, benchmark mapping/history write, migration, Auth/RLS change, scheduler action, P8 execution, Batch D/F, V1-5 work, Production deployment or `main` change was performed.

V1-4 remains **IN PROGRESS / NOT PROVEN**.

## 1. Supabase hard size gate

Initial authoritative measurement at start of this task:

- `pg_database_size('postgres') = 202,771,603 bytes`

Owner ceiling:

- **strictly below 200,000,000 bytes**

Therefore the database was already **2,771,603 bytes over the ceiling before implementation began**.

The B0 control plane was intentionally deployed with mutating actions fail-closed.

Final measurement:

- `202,812,563 bytes`

Difference during this phase:

- +40,960 bytes

No B0 application control rows, provider-usage rows, grants or grant consumptions were created during this phase. The database can allocate pages for extension/system activity and the provider-free health request used `pg_net`; this record does not attribute the 40,960-byte difference to B0 application data.

Verified zero current B0 V3 rows:
- `V1_4_B0_NODE_STAGE_V3`: 0
- `V1_4_ANGEL_INSTRUMENT_MASTER_V3`: 0
- provider usage `V1_4_B0_NODE_MASTER_%`: 0
- new P4 grants in this phase: 0
- new consumed P4 grants in this phase: 0

Interrupted grant `ccddba7a-f599-4ca6-a48f-249b120dd9bd` remains exactly one consumed record.

### Expected future compact control footprint

Read-only row-size evidence:
- average existing P4 grant/consumption row: 590.55 bytes
- maximum observed existing P4 grant/consumption row: 984 bytes
- average provider-usage row: 299.01 bytes
- representative B0 stage JSONB payload: 449 bytes
- representative B0 compact metadata JSONB payload: 402 bytes

A replacement B0 is expected to add only compact control rows, not the master body:
- grant <=1
- grant consumption <=1
- provider usage <=1
- stage records <=5
- compact metadata <=1

Payload-level storage is only a few KiB. Allowing for tuple/index/page overhead, reopen the B0 DB write gate only after authoritative size is **<=199,500,000 bytes**, leaving at least 500,000 bytes headroom below the owner ceiling.

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
**1**

Bundle SHA-256:
`fb62ea6265247f6ac2cd9230c962af63346afa071e89288fb227630ac055f954`

Control source commits:
- `c9266e70352cb1fa0ba11b3100a45d5c91961605`
- `537141e659475037e66b1dae9a590233c3934d74`

Authenticated provider-free `HEALTH` returned HTTP 200.

All mutating actions are currently blocked by:
`WRITE_GATE_OPEN=false`

Therefore no grant can currently be consumed and no provider attempt can begin.

When later reopened after authoritative DB-size verification below the operational threshold, `BEGIN_CAPTURE`:
- consumes a fresh scoped grant;
- inserts one provider-usage row as `PROVIDER_TOOL_ATTEMPT`;
- initial outcome `UNKNOWN`;
- appends `ATTEMPT_STARTED`.

`RESPONSE_RECEIVED` updates provider outcome only after a response is independently established.

## 6. Vercel deployment

Provider-free Node preview:

Deployment:
`dpl_Av32QZyCcsYYhfkci8dVvqXZCNrZ`

URL:
`portfiolio-dejoyx613-dibyendu-dutta.vercel.app`

Commit:
`a0f433a671a0a9a85f7c9f8cb61877cdebdeb3dd`

State:
**READY**

Deployment type:
`LAMBDAS`

Framework:
`vite`

Region:
`iad1`

Repository project configuration reports Node `24.x`.

GitHub combined status for this commit:
- Vercel: **success**

### Deployed self-test limitation

The protected preview could not be invoked from the available Vercel connection:
- protection-bypass creation returned Vercel scope 403;
- the protected fetch connector was blocked before issuing the request;
- no Vercel CLI session is installed in the execution container;
- direct web access to the protected preview is unavailable.

Therefore the requested **40 MiB SELF_TEST in the deployed Vercel function has NOT been proven at runtime**.

It is not marked PASS by inference.

What is proven:
- source compiles/builds in Vercel;
- configured Node/Lambda preview is READY;
- the route and 60s / 1024 MB configuration are accepted by the deployment;
- the existing shared parser previously passed provider-free local synthetic-volume tests;
- deployed Vercel runtime duration and process-memory measurements for the 40 MiB test remain unverified because invocation was blocked by deployment protection tooling.

No deployment-protection setting was weakened.

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

The deployed `SELF_TEST` additionally contains hash-mismatch and malformed/interrupted/oversize/ambiguity cases but remains uninvoked due Vercel protection tooling.

## 9. Required conditions before replacement B0

Do not authorize the provider GET yet.

Before a replacement B0 acquisition:
1. reduce and verify Supabase Postgres to **<=199,500,000 bytes**;
2. provider-free redeploy the control endpoint with `WRITE_GATE_OPEN=true` only after that measurement;
3. obtain a supported way to invoke the protected Development Vercel function and run `SELF_TEST`;
4. require the 40 MiB deployed Node test to PASS with recorded duration/RSS/heap;
5. run an end-to-end Node -> R2 gateway synthetic test if protected-function invocation becomes available;
6. confirm test object cleanup and zero provider/grant activity;
7. only then prepare a fresh one-time B0 grant for separate owner approval.

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
- database must remain <200,000,000 bytes at all times
- operational B0 start gate <=199,500,000 bytes
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

Supabase compact control endpoint: **DEPLOYED / WRITE-GATED CLOSED**.

Vercel build/deployment: **PASS / READY**.

Deployed 40 MiB Node runtime self-test: **NOT VERIFIED due protected-preview tooling access**.

Database size gate: **BLOCKED — current 202,812,563 bytes > 200,000,000**.

Replacement acquisition grant: **NOT CREATED**.

Angel One request: **NOT MADE**.

B1: **NOT AUTHORIZED**.

V1-4: **IN PROGRESS / NOT PROVEN**.
