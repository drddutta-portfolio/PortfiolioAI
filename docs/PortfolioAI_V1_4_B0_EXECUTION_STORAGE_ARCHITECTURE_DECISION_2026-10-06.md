# PortfolioAI — B0 Execution / Storage Architecture Decision — 2026-10-06

## Scope

Repository: `drddutta-portfolio/PortfiolioAI`  
Branch: `PortfolioAI-Development`  
Supabase Dev: `lrgpjimipfkyoqbpsqzz`

This is an architecture decision only.

No Angel One request, acquisition grant, R2 write, benchmark mapping/history write, migration, Auth/RLS change, scheduler action, Production change, P8 execution, Batch D/F, or V1-5 work is authorized or performed.

V1-4 remains **IN PROGRESS / NOT PROVEN**.

## Decision

Use **Development Node execution + existing private Development R2 bucket**, while keeping Supabase Dev as the control/audit plane.

Selected storage:
- Cloudflare account: `ced17d24f4b380721e58a08c9e9273e4`
- bucket: `portfolioai-history-dev`
- new Development-only prefix:
  `portfolioai-capture/development/v1/b0/angel-one/instrument-master/`

Current read-only prefix listing is empty.

Existing P8 historical data is under:
`portfolioai-history/development/p8/`

Existing Development DB backups are under:
`portfolioai-backups/development/`

The selected B0 prefix therefore does not overlap either P8 historical objects or Development database backups.

The bucket has no managed r2.dev access enabled and no custom domains. It is not publicly exposed.

## 1. Supabase Storage limit verification

Existing bucket:
`research-source-documents`
- private
- bucket file-size limit: **8 MiB**
- allowed MIME type: `application/pdf`

This is a **bucket-level application restriction**, not the project-wide maximum.

Supabase documentation distinguishes:
1. a project-wide **Global file size limit**;
2. optional lower **per-bucket file-size limits**.

A bucket limit may not exceed the effective global setting.

Supabase documents a maximum global file-size setting of:
- Free: **50 MB**
- Pro and above: up to **500 GB**

The attempted Development creation of `provider-capture-artifacts` with a **64 MiB** per-object limit failed through the supported Storage API with:
- HTTP 413
- `The object exceeded the maximum allowed size`

Therefore the demonstrated conclusion is:
- current effective project/global limit is **below 64 MiB**;
- a 64 MiB bucket cannot be configured under the present project settings;
- the existing 8 MiB PDF bucket is not evidence that the global limit itself is 8 MiB.

The available connector does not expose the Supabase Management API endpoint `GET /v1/projects/{ref}/config/storage`, so the exact current configured global value cannot be read directly here without a different Management-API credential path. It is not necessary to lower the B0 reliability contract based on that uncertainty.

## 2. Supabase Storage capture + Development Node preflight

This split is architecturally valid in principle:
- capture raw exact bytes to private Supabase Storage;
- retain SHA-256 and metadata in Supabase;
- run provider-free parsing/preflight in Node.

It is rejected for B0 because the approved capture contract currently allows up to **64 MiB**, while the present project will not accept a bucket configured to that ceiling.

Lowering the response ceiling solely to fit Storage would weaken the contract before the real Angel master size is known.

## 3. Resumable Supabase Edge preflight

The deployed B0 V2 synthetic evidence already proves:
- streamed capture/hash of a 33,590,549-byte synthetic master completed;
- memory remained low;
- subsequent streaming preflight hit the Supabase Edge **2-second CPU** limit;
- shutdown CPU was ~2001 ms.

A resumable preflight could be built by storing parser offsets/state and continuing across multiple Edge invocations.

Rejected because it adds:
- parser checkpoint state;
- continuation orchestration;
- multiple invocations;
- additional durable writes;
- recovery/idempotency logic;
- more complex audit semantics.

This is materially larger than moving the CPU-bound parser to Node.

## 4. Development Node / Vercel verification

Current Vercel project:
- project ID: `prj_Vp1QUuF63cnfuAl8ULYuHW44EbXU`
- name: `portfiolio-ai`
- framework: **Vite**
- configured Node version: **24.x**
- Development-branch preview deployments are present and READY
- inspected Development deployment type: `LAMBDAS`
- observed region: `iad1`

There is currently no repository `vercel.json` or existing B0 API route configuring a special runtime.

Vercel documentation confirms:
- Node.js is the default function runtime unless another runtime is selected;
- function memory and `maxDuration` are configurable for Node functions;
- Web-standard `fetch` / streaming APIs are supported;
- server-side examples stream objects through S3-compatible SDKs;
- maxDuration can be explicitly configured per function.

The connected Vercel account can read project/deployment metadata, but team-plan/resource-entitlement inspection returns 403 for the `dibyendu-dutta` scope. Therefore exact account-specific maximum memory and maximum duration are **not yet proven**.

The selected implementation must therefore be provider-free deployed and measured before any provider authorization.

The design intentionally does **not** depend on Vercel temporary filesystem. Capture streams provider bytes directly to R2, so uncertain `/tmp` capacity is removed from the critical path.

## 5. R2 verification and isolation

Cloudflare account:
`ced17d24f4b380721e58a08c9e9273e4`

Existing bucket:
`portfolioai-history-dev`

Bucket properties:
- location: APAC
- storage class: Standard
- jurisdiction: default
- managed `r2.dev` public domain: disabled
- custom domains: none

Existing object namespaces include:
- `portfolioai-history/development/p8/...`
- `portfolioai-backups/development/...`

Proposed B0 namespace:
`portfolioai-capture/development/v1/b0/angel-one/instrument-master/`

A read-only list for the proposed prefix returned zero objects.

This gives explicit namespace isolation from P8 and backup objects.

## 6. Selected implementation

### Supabase Dev remains the control plane

Reuse existing PortfolioAI:
- one-time grant validation;
- capture accounting state;
- append-only evidence stages;
- B0 counters;
- benchmark registry;
- exact twelve-code frozen order;
- exact identity rules.

Supabase stores only small metadata:
- R2 object key;
- byte length;
- SHA-256;
- source URL;
- retrieval timestamp;
- HTTP status/content type;
- stage state;
- twelve-code preflight results.

Never store the master JSON/base64 body in Postgres.

This also protects the owner requirement that Supabase Postgres remain around/below the 200 MB operating ceiling.

### Development Node function

Add one Development B0 API handler to the existing Vercel project.

No separate acquisition subsystem.

Actions:
1. provider-free `SELF_TEST`;
2. owner/grant-gated `CAPTURE`;
3. provider-free `PREFLIGHT`.

The handler must refuse Production context and require the known Dev Supabase project/ref.

### Capture

For the later separately authorized B0:
1. validate Development target, frozen code order and fresh scoped grant;
2. persist `ATTEMPT_STARTED` / provider usage UNKNOWN before network transport;
3. issue max one Angel master GET;
4. persist `RESPONSE_RECEIVED` only when independently observed;
5. stream response bytes through:
   - byte counter;
   - SHA-256;
   - R2 upload stream;
6. reject if byte count exceeds 64 MiB; never truncate;
7. mark `BODY_COMPLETE` only after EOF;
8. confirm R2 object metadata/size;
9. mark `CAPTURE_PERSISTED`;
10. stop provider activity.

### Preflight

Separate provider-free action:
1. stream retained R2 object;
2. recompute byte count + SHA-256;
3. require exact match with capture metadata;
4. parse/validate complete JSON;
5. run all twelve frozen codes through the existing exact identity rules;
6. persist `PREFLIGHT_COMPLETED`;
7. report `EXACT_MATCH / AMBIGUOUS / UNAVAILABLE`.

No benchmark mapping or history writes.

## 7. Object naming and immutability

Prefix:
`portfolioai-capture/development/v1/b0/angel-one/instrument-master/`

Final key format:
`<run-id>/<grant-id>/<retrieved-at-utc>.json`

Properties:
- run ID and grant ID make the path acquisition-specific;
- timestamp is UTC and immutable;
- no overwrite is permitted;
- application must fail if final key already exists.

Where supported, use conditional write semantics to reject an existing object rather than replace it.

SHA-256 remains authoritative integrity evidence and is stored in metadata/Supabase; it does not need to be part of the object name.

## 8. Credentials

Do not reuse broad Cloudflare credentials in frontend code.

Preferred runtime credential:
- R2 S3-compatible credential;
- bucket restricted to `portfolioai-history-dev`;
- Object Read & Write only;
- server-side Development environment only.

Cloudflare supports temporary R2 credentials that can additionally be path-scoped. For strongest isolation, issue short-lived credentials scoped to:

`portfolioai-capture/development/v1/b0/angel-one/instrument-master/*`

Required operations:
- PutObject
- GetObject / HeadObject
- AbortMultipartUpload / multipart operations only if multipart is used
- DeleteObject only for explicitly incomplete test objects / failed incomplete captures

No permission is required to list, mutate or delete P8 objects.

No Production environment should receive these credentials.

## 9. Upload method and cleanup

R2 current documented limits:
- single PUT: up to 5 GiB;
- multipart: up to 5 TiB;
- multipart minimum part: 5 MiB except last;
- incomplete multipart uploads auto-abort after 7 days by default.

The current bucket already has:
- `Default Multipart Abort Rule`
- max age 604800 seconds (7 days)

For a maximum 64 MiB master, select **single streaming PUT** unless the chosen Node S3 library requires multipart for unknown-length streaming.

Single PUT is simpler and comfortably within R2's documented 5 GiB limit.

If multipart is used:
- `leavePartsOnError=false`;
- explicitly abort on caught failure;
- the existing 7-day bucket lifecycle remains final cleanup protection.

No completed object is auto-deleted.

## 10. Exact write/request ceilings for replacement B0

Not authorized yet.

Provider/network:
- Angel master GET: <= 1
- Angel authentication: 0
- Angel history: 0
- provider retry: 0

R2:
- completed master objects: <= 1
- response/object ceiling: 64 MiB
- incomplete multipart upload: <= 1 if multipart is required
- no P8/backup object writes
- no overwrite

Supabase/control:
- fresh grant: <= 1
- grant consumption: <= 1
- provider usage row: <= 1
- capture audit run: <= 1
- preflight audit run: <= 1
- append-only stage records: <= 5
- master metadata record: <= 1
- benchmark mapping writes: 0
- benchmark history writes: 0

## 11. Provider-free test gate before replacement GET

Before any provider authorization, deploy the Development Node route and test with synthetic fixtures only.

Required tests:

1. **Runtime identity**
   - prove Node runtime and Node version;
   - prove Development branch/ref;
   - prove Production refusal.

2. **32–48 MiB synthetic streaming**
   - generate deterministic JSON stream;
   - hash while streaming;
   - for the no-write phase use a discard/mock R2 sink;
   - measure peak RSS/heap and duration.

3. **Parser/preflight**
   - exact 12-code success;
   - ambiguous exact match;
   - unavailable code;
   - ETF/context similarity remains investigation-only.

4. **Integrity**
   - exact-byte SHA-256;
   - altered object hash mismatch;
   - incomplete body rejected;
   - malformed JSON rejected;
   - >64 MiB rejected without truncation.

5. **Accounting**
   - abrupt failure after ATTEMPT_STARTED => UNKNOWN;
   - HTTP response without EOF != BODY_COMPLETE;
   - BODY_COMPLETE without durable storage != CAPTURE_PERSISTED;
   - PRELIGHT_COMPLETE only after full retained-object verification.

6. **Resource gate**
   - test must finish comfortably below configured Vercel duration and memory limits;
   - record actual elapsed time and process memory.

7. **R2 integration test**
   - requires a later explicit authorization for synthetic R2 writes;
   - maximum three objects / <=64 MiB total as separately approved;
   - verify upload/readback/hash and cleanup;
   - no P8 prefix access.

Only after those tests pass should a replacement B0 grant/GET be proposed for execution.

## Alternatives rejected

### Supabase Storage + Node preflight
Rejected for current B0 because the project rejected a 64 MiB bucket ceiling. It would only become viable if the global limit is raised above the B0 ceiling or the B0 response ceiling is deliberately reduced after evidence.

### Resumable Supabase Edge preflight
Technically feasible, but not smallest. Requires parser continuation/checkpoint orchestration solely to work around the 2-second CPU ceiling.

### Development Node + R2
Selected. It removes both demonstrated Supabase constraints:
- Storage object ceiling mismatch;
- Edge CPU ceiling.

It reuses the existing Development R2 bucket and existing PortfolioAI B0 components, and requires only one new Node route plus server-side R2 access.

## Configuration/deployment changes requiring later authorization

1. Add Development B0 Node API route to PortfolioAI.
2. Add explicit Node function `maxDuration` / memory configuration after provider-free entitlement verification.
3. Add Development-only R2 credentials to the Vercel Preview environment, preferably temporary/path-scoped.
4. Keep Production environment free of these B0 credentials.
5. Run provider-free Node tests.
6. Separately authorize synthetic R2 write/readback test.
7. Separately authorize one fresh B0 grant + max one Angel GET.

## Current disposition

Selected design: **Development Node + existing private Development R2 + Supabase control plane**.

Architecture decision: **READY FOR OWNER REVIEW**.

R2 write: **NOT AUTHORIZED / NOT PERFORMED**.

Replacement grant: **NOT AUTHORIZED / NOT CREATED**.

Angel master GET: **NOT AUTHORIZED / NOT PERFORMED**.

B1: **NOT AUTHORIZED**.

V1-4: **IN PROGRESS / NOT PROVEN**.
