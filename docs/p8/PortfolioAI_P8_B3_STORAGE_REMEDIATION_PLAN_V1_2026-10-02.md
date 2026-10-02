# PortfolioAI P8-B3 Storage Remediation Plan V1

Date: 2 October 2026  
Target: `PortfolioAI-Development` only  
Repository baseline: `e9a5936d192b48ce5fe61e4baa337a64c7cb4969`  
Hosted Development Supabase: `PortfolioAI Dev` / `lrgpjimipfkyoqbpsqzz`  
Purpose: recover the Supabase Free database below the 500 MB database-size threshold without losing P8 historical evidence, point-in-time correctness, provenance, or deterministic replay capability.

## 1. Why this remediation is required

Supabase Free projects enter read-only mode when Postgres database size exceeds 500 MB. The Development database is currently 1,531,079,827 bytes (~1460 MB).

The four dominant immutable P8 historical relations are:

| Relation | Total size |
| --- | ---: |
| `p8_b3_raw_market_price_observations` | ~565 MB |
| `p8_historical_listing_observations_v3` | ~499 MB |
| `p8_historical_universe_member_listing_evidence_v3` | ~208 MB |
| `p8_historical_universe_members_v3` | ~78 MB |
| Total | ~1350 MB |

The rest of Development Postgres is about ~110 MB.

Index deletion alone is not sufficient and is not authorized. The correct remediation is architectural: keep Supabase Postgres as the structured operational/control plane and move bulky immutable historical research materializations to durable object storage in versioned Parquet, retaining the original authoritative NSE files separately.

Target Development Postgres after remediation: preferably 150–250 MB, always comfortably below 500 MB.

## 2. Non-negotiable boundaries

- Development only.
- Production unchanged.
- `main` unchanged.
- No table deletion, truncation, index drop, destructive SQL or data rewrite until a separately approved final retirement gate.
- No B3 acquisition restart during preservation/remediation design.
- No B3 normalization/materialization.
- No B4 or P8-C+.
- No replacement of NSE authority with Trendlyne or another provider.
- No survivor-biased current-holdings shortcut.
- Missing source files, hash mismatches, parity failures or dependency ambiguity fail closed.
- Original source authority and derived analytical representation remain distinct.

## 3. Current authoritative P8 state

```text
P8-B2 = COMPLETE / PASS / CLOSED
P8-B3 = ACTIVE / STORAGE-BLOCKED

B3 Stage 1 NIFTY500 TRI = COMPLETE / PASS
B3 Stage 2 NSE Corporate Actions = COMPLETE / PASS
B3 Stage 3 NSE raw prices = 241 / 744 source dates acquired / PAUSED

B3 normalization = NOT AUTHORIZED
P8-B4+ = NOT AUTHORIZED
P8-C+ = NOT AUTHORIZED

Development DB = READ-ONLY
Production = UNCHANGED
main = UNCHANGED
```

Frozen B3 period: 2023-10-01 through 2026-09-30.  
Proven NSE trading dates: 744.  
Campaign: `P8_B3_FULL_SOURCE_ACQUISITION_20261001_V1`.  
Plan hash: `9367d9a55b5c7a6db176ef3e2b80da96cb97b3ac114f0ef884f124352a54919a`.

## 4. Target architecture

### 4.1 Supabase Postgres — operational/control plane

Retain compact, frequently accessed and relational control information:

- portfolios, transactions, holdings and operational application facts;
- current security identity and live/current market data;
- historical security identity master;
- P8 experiment/run/version records;
- P8 source archive metadata and hashes;
- dataset/object manifests;
- validation fingerprints and blocker/coverage summaries;
- NIFTY 500 TRI and corporate-action observations while small;
- compact historical symbol/identity validity resolver;
- compact adjustment factors where appropriate;
- current/live price history required by the application.

### 4.2 Immutable historical data plane

Move large immutable P8 materializations to object storage:

- original official NSE source archives;
- B2 listing observations;
- B2 universe membership materialization;
- B2 listing evidence;
- B3 raw historical market-price observations;
- future adjusted historical price series.

Store two representations:

1. **Raw source authority** — exact official NSE bytes, immutable and hash-verified.
2. **Analytical representation** — versioned Parquet datasets, deterministic and replayable.

### 4.3 Runtime principle

Normal PortfolioAI use must remain online. A developer workstation/localhost may be used for migration canaries, replay validation and administrative export work, but normal deployed PortfolioAI must not depend on a Mac, localhost process or user-run DuckDB service.

## 5. Object storage direction

Primary candidate: Cloudflare R2 or another durable S3-compatible object store with sufficient free/low-cost headroom.

Secondary copy: verified local/external-drive archive.

Optional tertiary copy: Google Drive for disaster-recovery backup.

Supabase Storage is not selected as the long-term historical authority because the Free allowance is only 1 GB and therefore provides limited growth headroom.

Final provider selection requires owner approval before credentials/configuration are introduced.

## 6. Phase S0 — forensic freeze

Status: COMPLETE / PASS for hosted and repository baseline.

Verified:

- Development project ref: `lrgpjimipfkyoqbpsqzz`;
- project state: ACTIVE_HEALTHY;
- PostgreSQL: 17.6.1;
- repository branch `PortfolioAI-Development` equals `e9a5936d192b48ce5fe61e4baa337a64c7cb4969`;
- Development DB: 1,531,079,827 bytes / 1460 MB;
- four large relations remain 565 MB / 499 MB / 208 MB / 78 MB;
- Supabase Storage currently has 0 buckets, 0 objects and 0 stored object bytes.

No mutation was performed.

## 7. Phase S1 — authoritative source verification

Before any PostgreSQL copy is retired, verify every B2/B3 raw authority file against the hashes recorded in the database/manifests.

For B3 source archives, preservation fields include:

- archive UUID;
- source kind;
- source period start/end;
- exact source URL;
- source file name;
- compressed SHA-256;
- uncompressed/content SHA-256;
- source publication/retrieval timestamps;
- source contract version;
- archive hash;
- campaign ID;
- plan hash.

Example verified metadata exists for:

- legacy 2023-10-03 bhavcopy:
  `cm03OCT2023bhav.csv.zip`
  compressed SHA-256 `62b64e1510cb453a4c96a52d5ea24932a41e520ab61321506c21f7e5a2d1e502`
  CSV/content SHA-256 `54a44f1006ea1f7054aa6f3c267e946e12bcd39871ac8f3c42e373b2c506bf19`.

- UDiFF 2024-07-08 bhavcopy:
  `BhavCopy_NSE_CM_0_0_0_20240708_F_0000.csv.zip`
  compressed SHA-256 `0ef55b77c30c8a57d5451cd371424242ad515f708630736ea6dc44c38d6e1e85`
  CSV/content SHA-256 `f54e6145169c99e541dfa284e2b3fb4676f0e7f7909f3eac71d59e85c5d5c664`.

This ChatGPT execution environment cannot directly download `nsearchives.nseindia.com`, so raw-byte re-verification is not claimed complete here. It must be performed from an environment with access to the official NSE archive or against the existing local cache. Missing files or any hash mismatch stop the remediation.

## 8. Phase S2 — preservation contract and Parquet layout

### B3 raw market-price Parquet v1

Required logical columns:

- `id` — stable raw observation UUID;
- `portfolio_id`;
- `experiment_id`;
- `historical_identity_id`;
- `source_archive_id`;
- `trade_date`;
- `exchange`;
- `trading_symbol`;
- `series`;
- `source_format`;
- `previous_close`;
- `open`;
- `high`;
- `low`;
- `close`;
- `last_price`;
- `volume`;
- `traded_value`;
- `trade_count`;
- `row_hash`;
- `raw_metadata`;
- `created_at`.

Exact numeric values must be exported without binary floating-point conversion. Decimal strings or exact Arrow decimal types must be used.

Partition path:

```text
portfolioai-history/
  development/
    p8/
      b3/
        raw-prices/
          v1/
            year=YYYY/
              month=MM/
                trade_date=YYYY-MM-DD/
                  part-00000.parquet
                  manifest.json
```

Raw NSE source archives are stored independently under a source-authority tree. Parquet does not replace raw authority.

### B2 Parquet v1

Natural partitioning:

- listing observations: `source_date`;
- universe membership: `decision_at` / decision date;
- listing evidence: `decision_at` / decision date.

The existing UUIDs, row/source hashes, identity links, evidence role and provenance must be preserved.

## 9. Compact Postgres resolver replacement

The current B3 action resolver loads B2 listing observations and reduces them to identity ranges per symbol.

The externalization design shall derive a compact deterministic resolver projection from the exact existing semantics, conceptually:

- `portfolio_id`;
- `experiment_id`;
- `trading_symbol`;
- `series` where semantically applicable;
- `historical_identity_id`;
- `min_source_date`;
- `max_source_date`;
- `observation_count`;
- source/fingerprint metadata.

The final schema must reproduce the current resolver behavior exactly before the 499 MB source relation can be retired. It must not invent validity intervals not supported by the original observation contract.

## 10. Raw-to-adjusted lineage redesign

Future adjusted series must not require the bulky raw row to remain in PostgreSQL.

The stable lineage contract should retain at least:

- raw observation UUID;
- source archive UUID;
- raw `row_hash`;
- historical identity UUID;
- trade date;
- Parquet dataset/schema version;
- partition/object identity.

This allows an adjusted observation to prove the exact raw authority row that produced it even when the raw row is externally stored.

## 11. Dataset manifest contract

A compact Postgres catalog shall eventually record:

- dataset name;
- schema version;
- dataset version;
- environment;
- portfolio/experiment/run IDs where relevant;
- storage provider;
- immutable object key;
- partition key/date range;
- row count;
- byte size;
- object SHA-256;
- source archive IDs or source-set fingerprint;
- min/max trade/source/decision dates;
- validation fingerprint;
- status;
- created_at.

Manifest/schema creation is NOT authorized by this documentation-only plan.

## 12. Phase S3 — canary protocol

The first canary is read-only with respect to hosted PostgreSQL.

Canary source:

- one small deterministic B3 raw-price slice from source archive
  `183e942c-a54d-5889-8043-436eebeb635d`
  / trade date 2023-10-03;
- rows ordered by stable UUID for export verification.

Required PASS conditions:

1. exported row count equals selected source row count;
2. all UUIDs identical;
3. exact decimal strings round-trip identically;
4. dates/timestamps round-trip identically;
5. nullable fields round-trip identically;
6. `row_hash` values identical;
7. `raw_metadata` canonical content preserved;
8. Parquet file can be read back;
9. deterministic canonical slice fingerprint equals the pre-export fingerprint;
10. object-store read-back, when configured, produces the same file SHA-256.

A preliminary 5-row Development read-only sample has already been inspected and confirms the proposed export shape can preserve the current raw table fields. Actual Parquet generation is pending selection/availability of a Parquet writer (DuckDB/PyArrow/approved Node equivalent). No new dependency is introduced silently.

## 13. Phase S4 — full non-destructive export

After S3 PASS and owner approval:

- stream B2/B3 relations in deterministic bounded pages;
- avoid global `COUNT(DISTINCT)`, large database-side sorts and temp-heavy operations;
- materialize partition files outside Postgres;
- validate each partition independently;
- generate immutable partition manifests and a dataset-level fingerprint;
- retain local and remote copies;
- keep all original PostgreSQL relations unchanged.

## 14. Phase S5 — local/Development parity implementation

Build an external historical adapter and compact resolver.

Prove old PostgreSQL versus new historical-store parity for:

- B2 historical universe reconstruction;
- listing evidence;
- symbol/identity action resolution;
- B3 raw market coverage;
- individual security history;
- date-range history;
- source provenance;
- row counts and fingerprints;
- later adjusted-price lineage.

Normal deployed PortfolioAI must query online infrastructure. Localhost is validation infrastructure only.

## 15. Phase S6 — owner retirement checkpoint

Before any PostgreSQL physical retirement present:

- exact raw-source verification status;
- exact Parquet/object inventory;
- measured object sizes;
- independent backup status;
- partition and dataset fingerprints;
- old/new parity matrix;
- compact replacement schemas and indexes;
- every retired FK/view/function dependency;
- rollback/reconstruction procedure;
- projected Postgres size.

No destructive action before explicit S7 approval.

## 16. Phase S7 — physical Postgres retirement

OWNER APPROVAL REQUIRED — NOT AUTHORIZED BY THIS PLAN.

Only after all dependencies have been migrated and parity passes:

- enter an explicitly controlled writable maintenance session if required by Supabase read-only recovery guidance;
- retire only the approved historical physical relations/indexes;
- never use an uncontrolled `CASCADE`;
- reclaim/recheck database space using the least risky supported maintenance sequence;
- verify `pg_database_size` is comfortably below 500 MB;
- verify application and P8 control-plane integrity.

Expected target after externalizing the four dominant relations and adding compact replacements: approximately 150–250 MB.

## 17. B3 continuation after remediation

Do not restart from zero.

The current source campaign remains frozen. After separate authorization, resume at the first missing trading date after the current 241/744 set.

For each future trading date:

1. obtain official NSE daily authority;
2. persist exact raw source bytes once;
3. hash and manifest;
4. write one immutable historical Parquet partition;
5. append only operational/current securities to Postgres where needed;
6. update compact coverage/control metadata.

The frozen 2023–2026 experiment does not change because a security is later purchased.

## 18. Online/runtime rule

Final PortfolioAI remains online.

Normal use must NOT require:

- the owner's Mac to be powered on;
- localhost;
- a local DuckDB daemon;
- manual mounting of Parquet files.

Local/desktop execution is permitted only for migration, forensic verification, development replay or disaster recovery. Deployed historical reads must use an online object-store/server-side adapter.

## 19. Approval gates

- **S0** forensic baseline — COMPLETE / PASS.
- **S1** all raw authoritative files verified — PENDING.
- **S2** preservation/schema contract — DOCUMENTED / OWNER REVIEW.
- **S3** Parquet canary + read-back parity — PENDING.
- **S4** full immutable export — NOT AUTHORIZED.
- **S5** replacement runtime + old/new parity — NOT AUTHORIZED.
- **S6** retirement evidence package — NOT AUTHORIZED.
- **S7** destructive PostgreSQL retirement — NOT AUTHORIZED.

## 20. Current mutation report

```text
Production = UNCHANGED
main = UNCHANGED

NO SUPABASE DATA WRITE
NO MIGRATION
NO TABLE DROP
NO TRUNCATE
NO INDEX DROP
NO VACUUM FULL
NO OBJECT-STORAGE MIGRATION
NO B3 ACQUISITION RESTART
NO B3 NORMALIZATION
NO B4/P8-C PROGRESSION
```
