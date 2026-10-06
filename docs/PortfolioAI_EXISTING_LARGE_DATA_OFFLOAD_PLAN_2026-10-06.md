# PortfolioAI — Existing Large Dataset Offload Plan — 2026-10-06

## Purpose

Prepare a dependency-aware plan to keep Supabase Postgres comfortably below the owner-confirmed **500,000,000-byte** quota while moving large historical/raw data toward Cloudflare R2.

This document authorizes **no migration or deletion**.

## Current baseline

Current Postgres size:
- **202,812,563 bytes**

Largest public relations:

| Relation | Approx total size | Approx rows | Dependency notes |
|---|---:|---:|---|
| `p8_b4_decision_evidence_eligibility_compact` | 48,300,032 | 289,536 | FK to historical identities; consumed by view `p8_b4_decision_evidence_eligibility`; no incoming FK |
| `market_price_history` | 40,370,176 | 63,172 | FKs to securities/provider/mapping; no incoming FK |
| `data_source_records` | 19,595,264 | 4,796 | heavily referenced by many evidence/research tables |
| `research_evidence_snapshot_items` | 13,238,272 | 20,584 | FKs to snapshots and data_source_records |
| `p8_b3_adjustment_factors` | 12,894,208 | 4,983 | depends on historical identities + normalization rows |
| `p8_b3_corporate_action_observations` | 8,454,144 | 6,704 | referenced by corporate-action normalizations |
| `p8_b3_corporate_action_normalizations` | 6,807,552 | 6,703 | referenced by adjustment factors |
| `p8_b6_canonical_snapshot_vectors` | 5,750,784 | 4,524 | consumed by `p8_b6_canonical_historical_snapshots_v1` view |
| `import_source_rows` | 3,301,376 | 1,346 | bidirectional transaction/import dependencies |

## Offload principles

1. R2 becomes the source for bulky immutable/history-oriented payloads.
2. Supabase retains compact indexes, identities, hashes, object keys and hot operational state.
3. No table is dropped merely because it is large.
4. A read-through adapter must exist and be verified before any source rows are removed.
5. Any table participating in an FK chain is offloaded only as part of a dependency-safe bundle or via payload externalization that preserves the relational row.
6. All R2 objects are immutable/versioned and carry SHA-256 + row-count/manifest metadata.
7. P8 and B0 namespaces remain separate.

## Candidate classes

### Class A — Highest-value, lowest relational risk

#### A1. `p8_b4_decision_evidence_eligibility_compact`
Why:
- largest single relation (~48.3 MB)
- append/materialization-style historical data
- no incoming foreign key
- downstream dependency is a known view

Proposed future pattern:
- export immutable materialization partitions to R2, partitioned by experiment/materialization run
- retain a compact manifest/index in Supabase
- replace direct historical scans with an R2-backed materializer/reader
- preserve the current compatibility view contract until all consumers are migrated

Do not delete rows until the view/consumer replacement is proven.

#### A2. Cold segments of `market_price_history`
Why:
- ~40.4 MB
- time-series/history semantics fit R2
- no incoming FK

Proposed future pattern:
- keep latest/hot operational window in Supabase
- place older immutable candles in R2, partitioned by provider/security/year-month
- maintain compact coverage manifest in Supabase
- implement read-through history service merging hot Postgres + cold R2
- validate stock research, scoring and backtest consumers before removing cold rows

This is likely the most reusable long-term offload because history will continue to grow.

## Class B — Offload only as dependency bundles

### B1. P8 B3 corporate-action bundle
Tables:
- `p8_b3_corporate_action_observations`
- `p8_b3_corporate_action_normalizations`
- `p8_b3_adjustment_factors`

Dependency chain:
observations -> normalizations -> adjustment factors.

Plan:
- archive all three together under one immutable run manifest
- preserve historical identity IDs
- prove reconstruction/read-through of the full chain
- only then consider removing cold completed experiment runs

Never offload one member of this chain independently.

### B2. P8 B6 snapshot vectors
`p8_b6_canonical_snapshot_vectors` is consumed by `p8_b6_canonical_historical_snapshots_v1`.

Plan:
- first create a provider-neutral reader that reproduces the existing view output from an R2 snapshot-vector object
- compare row count + aggregate fingerprint against Postgres
- retain current run metadata/selections in Postgres
- only cold immutable materialization vectors become offload candidates

## Class C — Keep relational rows; externalize heavy payloads selectively

### C1. `data_source_records`
Do **not** bulk-offload/delete rows early.

Reason:
- many incoming FKs from fundamental, identity, research-document, news, classification and snapshot tables

Safer pattern:
- keep the relational record ID and compact provenance fields in Postgres
- for future large raw payloads, store body in R2 and keep object key/hash/size in `raw_payload`
- later audit historical rows for unusually large JSON payloads and externalize only those with a reversible mapping

### C2. `research_evidence_snapshot_items`
Keep until evidence snapshot/selectors are fully audited. It references both snapshots and raw source records and is part of current V1 research evidence integrity.

## Class D — Not priority candidates

`import_source_rows` should remain relational for now because transactions reference it and its total size is only ~3.3 MB.

## Proposed phased execution

### Phase O0 — Read-only dependency freeze
- inventory consumers in repository/SQL/views
- record row counts, hashes and size baseline
- assign every candidate HOT / COLD / IMMUTABLE / ACTIVE
- no writes except documentation

### Phase O1 — R2 manifest contract
Define one shared archive contract:
- dataset
- schema/version
- partition key
- source table/run
- row count
- min/max time
- SHA-256
- object size
- created/retrieved timestamp
- producer commit

Supabase stores only compact manifest pointers.

### Phase O2 — Dual-write / export-only canary
For one candidate partition:
- export to isolated Development R2 prefix
- do not delete Postgres rows
- verify byte/hash/row reconstruction
- compare query outputs against Postgres

### Phase O3 — Dual-read compatibility
Introduce read-through adapter and migrate one consumer at a time.

Required:
- exact row-count equivalence
- exact key coverage
- deterministic aggregate fingerprints
- no fallback to missing data silently

### Phase O4 — Cold-row retirement proposal
Only after O2/O3 pass:
- calculate exact reclaimable bytes
- list precise rows/partitions proposed for removal
- verify backups/manifests
- obtain separate owner authorization

Deletion is never implicit.

## Suggested priority

1. `market_price_history` cold history — structural growth risk and broad future benefit.
2. `p8_b4_decision_evidence_eligibility_compact` — largest current relation, immutable materialization semantics.
3. P8 B3 action/adjustment bundle — meaningful size but dependency-sensitive.
4. P8 B6 snapshot vectors — smaller but clean immutable candidate.
5. selective large-payload externalization from `data_source_records` only after a payload-size audit.

## Trigger policy

- <400 MB: plan/export work can proceed opportunistically.
- >=400 MB: begin scheduled offload implementation work.
- >=450 MB: stop adding any new unbounded Postgres datasets.
- >=475 MB: freeze noncritical growth and execute an approved offload/remediation before further large writes.
- 500 MB: absolute owner quota; must not be reached.

## Current disposition

Offload plan: **PREPARED / NO DATA MOVED**.

Existing rows: **UNCHANGED**.

R2 P8 objects: **UNCHANGED**.

Production: **UNTOUCHED**.


## Bounded first offload proposal — review only

### Exact dataset

Table:
`public.market_price_history`

Candidate rows:
`period_start < '2026-01-01T00:00:00Z'`

Read-only audit result:
- rows: **20,774**
- securities: **238**
- date range: **2025-08-07 18:30:00+00** through **2025-12-31 18:30:00+00**
- logical tuple bytes from `sum(pg_column_size(row))`: **8,130,387 bytes**
- current full table: 63,932 rows, 40,370,176 bytes total table+indexes
- proportional candidate total footprint including indexes: approximately **13.1 MB**

The proportional figure is planning evidence, not a promise of immediately reclaimable physical disk.

### Cloudflare destination

Proposed immutable prefix:

`portfolioai-history/development/market-price-history/v1/period-year=2025/`

Proposed files:
- partitioned immutable data objects, preferably Parquet for compact typed analytics;
- one JSON manifest containing schema version, row count, min/max period, security count, object SHA-256 values and aggregate fingerprint.

No P8 prefix is reused.

### Integrity verification

Before any later row retirement:
1. export exactly the 20,774 scoped rows ordered by `security_id, provider_code, interval, period_start`;
2. calculate deterministic row-set fingerprint before export;
3. calculate SHA-256 for every R2 object;
4. read all objects back from R2;
5. reconstruct the canonical row set;
6. require exact:
   - row count = 20,774;
   - security count = 238;
   - min/max timestamps;
   - key coverage;
   - aggregate fingerprint;
   - OHLC/adjusted-close/volume values;
7. compare representative application queries against current Postgres results.

### Required reference/application change

R2 does not replace relational querying directly.

Before deletion, introduce a market-history repository/adapter with:
- hot Postgres source for retained/current rows;
- cold R2 source for archived partitions;
- deterministic merge by existing natural key;
- identical response contract for current callers.

A compact Supabase manifest reference may be added later under a separately authorized migration/change contract. No migration is authorized by this plan.

### Compatibility gate

Must demonstrate:
- Holdings/stock research pages still obtain required price history;
- research/scoring code receives identical candles for archived dates;
- no provider call is triggered merely because history moved to R2;
- backtest/P8 consumers are explicitly mapped before they are allowed to depend on this archive;
- no silent empty-history fallback.

### Rollback

Until a separately approved cleanup phase:
- keep all 20,774 Postgres rows unchanged;
- treat R2 export as a verified duplicate/canary only;
- rollback is simply switching reads back to Postgres and abandoning the R2 manifest/object set.

After any future retirement, rollback requires re-import from the immutable R2 manifest and hash-verified objects before removing the archive.

### Physical-space expectation

Deleting rows later would create reusable space inside the relation but does **not** guarantee an immediate reduction in `pg_database_size`.

Supabase/Postgres documentation notes that physical files do not automatically shrink after ordinary row deletion. A later explicit physical compaction/rewrite could be required to reduce reported database size. Such operations are intentionally **not authorized in this phase**.

Therefore:
- logical candidate payload: ~8.13 MB;
- proportional table/index footprint: ~13.1 MB;
- immediately reportable physical reduction after a future ordinary delete: **not guaranteed**;
- actual post-cleanup reclamation must be measured after the separately authorized maintenance strategy.

## Growth outlook

Current `market_price_history` density:
- 63,932 rows occupy ~40.37 MB total;
- approximately 631 bytes of total table/index footprint per row at the current layout.

At roughly 240 securities × 252 exchange sessions/year, another full year of daily history would add about 60,480 rows. At current density, that is approximately **38 MB/year** before schema/index changes.

This is a structural projection, not an observed ingestion-rate forecast.

Large JSON evidence is a second growth vector:
- `data_source_records` currently has ~13.98 MB of TOAST storage;
- 714 rows have individual `raw_payload` sizes >=8 KiB;
- those 714 payloads total ~10.35 MB by `pg_column_size(raw_payload)`.

Because `data_source_records` has many incoming foreign keys, the safe future strategy is payload externalization while retaining the relational record, not bulk row deletion.
