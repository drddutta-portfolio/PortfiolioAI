# PortfolioAI — Existing Large Dataset Offload Plan — 2026-10-06

## Scope and status

Planning only. **No table rows are deleted, migrated, truncated, archived, or rewritten by this plan.**

Target architecture:
- Supabase Postgres remains the operational relational/control layer.
- Cloudflare R2 holds large historical/raw/archive payloads.
- Postgres retains compact identifiers, hashes, manifests, current operational windows, and relationship-preserving metadata.

Any future offload requires its own owner authorization, read-path implementation, parity proof, rollback plan, and post-offload verification.

## Current capacity context

Current Dev Postgres size: **202,812,563 bytes** of the owner-confirmed **500,000,000-byte** quota.

Current state is NORMAL; there is no emergency need to delete data.

The purpose of this plan is to prevent future avoidable growth and preserve Supabase capacity for relational workloads that benefit from Postgres.

## Largest current relations and dependency-aware disposition

### 1. `p8_b4_decision_evidence_eligibility_compact` — ~48.3 MB

Dependency:
- references `p8_historical_security_identities(id)`.

Plan:
- do not move until P8 replay/read contracts are explicitly reopened;
- first build an immutable R2 export format by experiment/run;
- retain compact experiment/identity manifest and current materialization status in Postgres;
- verify replay parity before any Postgres reduction.

Priority: **high size / medium operational risk**.

### 2. `market_price_history` — ~40.4 MB

Dependencies:
- `securities`;
- `market_data_providers`;
- composite consistency relationship to `market_data_instrument_mappings`.

Plan:
- preserve recent/current operational price window in Postgres;
- candidate for historical cold-segment offload to R2 by provider/security/date partition;
- add an R2 historical reader before removing any rows;
- prove stock research UI, scoring, and replay consumers distinguish hot Postgres history from cold R2 history without semantic changes.

Priority: **high size / high operational dependency**. Do not offload first without reader parity.

### 3. `data_source_records` — ~19.6 MB

Dependencies:
- heavily referenced by fundamental observations, research snapshot items/selections, research document sources, identity/reconciliation evidence, news evidence, and other evidence tables.

Plan:
- **do not relocate row identities**;
- future optimization should externalize only large `raw_payload` bodies to R2 while retaining the same Postgres record ID, source metadata, hash, timestamps and object reference;
- migration requires per-record hash parity and all FK identities unchanged.

Priority: **medium size / very high dependency**. Payload-externalization only.

### 4. `research_evidence_snapshot_items` — ~13.2 MB

Dependencies:
- `research_evidence_snapshots`;
- `data_source_records` through `raw_source_record_id`.

Plan:
- classify columns into replay-critical relational keys vs large repeated evidence detail;
- externalize immutable detailed item payloads only after selection/replay readers support R2;
- keep snapshot/item identity and canonical selection relationships in Postgres.

Priority: **medium**.

### 5. P8 B3 adjustment/corporate-action group — ~28.2 MB combined

Relations:
- `p8_b3_adjustment_factors` ~12.9 MB;
- `p8_b3_corporate_action_observations` ~8.45 MB;
- `p8_b3_corporate_action_normalizations` ~6.81 MB.

Dependencies:
- tightly connected to `p8_historical_security_identities`;
- observations depend on `p8_b3_source_archives`;
- normalizations depend on observations;
- adjustment factors depend on normalizations and identities.

Plan:
- treat this as one dependency group rather than independent table deletions;
- export immutable raw observations/source archives to R2 first;
- preserve lineage IDs and derived/current adjustment state in Postgres until a complete R2 replay adapter passes;
- never offload one member in isolation if that breaks FK/replay lineage.

Priority: **medium/high**, but only as a coordinated P8 workstream.

### 6. `p8_b6_canonical_snapshot_vectors` — ~5.75 MB

Dependencies:
- historical identity;
- B6 materialization run.

Plan:
- candidate for immutable run-level R2 archive after B6 consumers support retained manifests;
- keep active/current run metadata in Postgres.

Priority: **lower** at current size.

## Offload order

When capacity work is authorized, use this order:

1. **Prevent new large Postgres payloads** — R2-first for new provider captures and archives.
2. **Externalize large raw bodies while preserving row IDs** — especially evidence/source payloads where FK identity matters.
3. **Add cold-history read adapters** — market price history and historical replay data.
4. **Move immutable P8 run artifacts as dependency groups**, not individual tables.
5. Only after read parity and rollback proof, consider removing duplicated/cold Postgres rows.

## Required gates for every future offload

1. exact source row count and byte inventory;
2. dependency/FK/view/reader inventory;
3. deterministic R2 object schema and immutable naming;
4. SHA-256 manifest;
5. write/readback parity;
6. application/read-path dual-read verification;
7. rollback/re-hydration procedure;
8. owner approval;
9. only then deletion/reduction;
10. final `pg_database_size` and functional verification.

## R2 namespace rule

Do not mix new offloads into B0 capture paths.

Proposed future namespaces should remain workload-specific, for example:

- `portfolioai-history/development/market-price-history/...`
- `portfolioai-history/development/evidence-archives/...`
- existing P8 namespace remains `portfolioai-history/development/p8/...`

No Production prefix is included in this Development plan.

## Disposition

Offload architecture: **PLANNED / NOT EXECUTED**.

No migrations or deletions are authorized by this document.
