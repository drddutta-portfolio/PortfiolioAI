# R4N migration baseline cutover plan

Status: **GATE 2 CURATION AND DISPOSABLE EQUIVALENCE VERIFIED / CUTOVER NOT STARTED**

## Decision

Do not run `supabase migration squash` directly on the PortfolioAI migration directory. The command produces a schema-oriented squash and omits data-manipulation statements, including required reference/configuration rows and cron jobs. PortfolioAI migrations contain substantial canonical registry and policy DML, so an unreviewed CLI squash would produce an incomplete application database.

Do not use `supabase migration repair` merely to bypass failed SQL. History repair changes ledger state only; it does not execute or reverse schema/data changes.

The safe permanent remedy is a controlled baseline cutover with an immutable legacy archive, a checksum/index manifest, an independently verified schema baseline, explicit allowlisted reference data, and separate history-bridge instructions.

## 1. Legacy preservation

Create `supabase/migrations_legacy/20260915_pre_r4n_baseline/` and copy every pre-baseline migration into it byte-for-byte.

Create `supabase/migration_baselines/20260915_pre_r4n_manifest.json` containing for every legacy file:

- original filename and version;
- SHA-256 checksum;
- duplicate-version group, if any;
- normalized disposable-replay version, if any;
- whether the file contains schema, reference/configuration DML, operational scheduling, or state-dependent business-data reconciliation;
- its expected final-state objects or rows.

The cutover must abort if any archived checksum differs from the current committed file.

## 2. Active migration-history compatibility

After explicit cutover approval, replace the pre-baseline files in the active `supabase/migrations/` directory with one no-op compatibility marker for each **unique historical version**. The original SQL remains available unchanged in the legacy archive and Git history.

This avoids renaming an already-applied version and keeps existing database ledgers comparable by version. The four second files that shared a version cannot receive independent historical ledger identities; their checksums and effects remain recorded in the manifest and incorporated into the new baseline.

No active migration marker may share a version with another marker.

## 3. Baseline artifacts

Generate and review three new artifacts from the successfully verified disposable database:

1. `*_portfolioai_schema_baseline_v1.sql`
   - schema, functions, views, constraints, indexes, triggers, extensions, grants and RLS;
   - includes the two verified forward repairs;
   - contains no user, portfolio, broker-account, transaction, price, evidence, score, recommendation or sizing rows.
2. `*_portfolioai_reference_registry_v1.sql`
   - explicit allowlist of global application registries, scoring/profile definitions, source definitions, refresh policies and other non-user configuration rows;
   - excludes mutable operational history and all security-specific reviewed evidence unless separately justified as canonical reference data.
3. `*_portfolioai_local_operational_defaults_v1.sql`
   - environment-safe local scheduling/configuration only;
   - no credentials, Vault values, provider execution or production activation;
   - cron definitions are kept separate so schema/reference correctness does not imply scheduler authorization.

Every exported reference table must have an explicit owner, purpose, natural key and row-count assertion. No broad `data-only` dump is permitted.

## 4. Baseline verification

In a new disposable stack:

1. Apply unique no-op legacy markers.
2. Apply the schema baseline.
3. Apply the reference registry.
4. Apply local-safe operational defaults.
5. Apply all post-baseline forward migrations.
6. Run the complete pgTAP suite, database lint, architecture checks and schema diff.
7. Compare the new baseline schema against the previously verified full legacy replay using normalized catalog fingerprints.
8. Compare allowlisted reference/configuration rows by stable key and canonical JSON/hash.
9. Assert zero user/portfolio/transaction/evidence/score/recommendation/sizing rows and zero network requests.
10. Destroy the stack.

Required equivalence excludes nondeterministic object identifiers, timestamps, owner-internal metadata and environment-generated secrets. All functional schema, grants, RLS, constraints, functions, views and allowlisted canonical rows must match.

## 5. Ordinary-local cutover

The ordinary local database currently contains only seven applied migrations and no approved business-data baseline. It cannot safely receive the new baseline on top of its partial schema.

After separate destructive-reset approval:

1. capture its migration ledger and verify that user/business row counts remain zero;
2. stop the ordinary local stack;
3. reset its disposable local volumes only;
4. start it from the new active no-op markers plus baseline artifacts;
5. run all pgTAP, lint, RLS, schema and no-business-data assertions;
6. keep production untouched.

If any user or business rows are discovered, stop. Do not reset; design an explicit backup/restore migration instead.

## 6. Production history bridge — separately gated

The baseline must never be executed against an existing production schema.

A future production cutover requires separate approval and must:

1. take a verified backup and read-only migration/schema/reference-state inventory;
2. prove production schema and allowlisted reference state are equivalent to the baseline target;
3. retain all unique historical migration ledger rows;
4. mark only the new baseline artifacts as applied without executing them, using an exact reviewed history-repair command;
5. verify ledger alignment and schema/reference fingerprints again;
6. apply only genuinely pending post-baseline forward migrations normally.

If equivalence is not exact, do not repair history. Create forward reconciliation migrations instead.

## 7. Duplicate-version disposition

There is no safe forward-only SQL migration that can split an already-applied version into two historical identities. Supabase compares migration timestamps as identifiers, and the history table can represent only one row for a version.

The controlled baseline resolves future clean environments by:

- preserving both original files and checksums in the immutable archive;
- representing each unique historical version once in active compatibility markers;
- incorporating the final effects of both duplicate files into the verified baseline;
- never renaming or rewriting a version already recorded by an existing database.

## 8. Approval gates

Separate approval is required for:

1. creating the legacy archive, manifest, markers and generated baseline artifacts;
2. replacing the active pre-baseline migration set with markers;
3. resetting the ordinary local database;
4. any production inventory or backup access beyond read-only inspection;
5. any production migration-history repair or schema application.

The immediate next step is gate 1 only. No database or active migration history changes are authorized by this document.

## 9. Gate 1 result — 15 September 2026

- All 78 current migration files were copied byte-for-byte to `supabase/migrations_legacy/20260915_pre_r4n_baseline/`.
- The generated manifest records 78 files, 74 unique versions, four duplicate-version groups, SHA-256 checksums and coarse migration classifications.
- A disposable full-history replay generated a schema-only candidate and an explicitly allowlisted reference/configuration data candidate.
- No fixture identity or business row appears in either candidate export.
- The reference export raised an expected curation warning for the self-referential `scoring_profiles` relationship; the candidate README requires a constraint-preserving two-phase load rather than disabling triggers.
- A separate operational-default candidate is opt-in and inert by default.
- These candidates are review inputs, not executable active migrations. Active migration files, ordinary local and production were not changed.

## 10. Gate 2 result — 15 September 2026

- Deterministic curated schema, reference-registry, reference-contract and inert
  local-operational artifacts now live under
  `supabase/migration_baselines/20260915_curated/`; they remain outside the active
  migration directory.
- The schema baseline now supplies the reviewed extension preamble and neutralizes
  fresh-bootstrap default privileges before object creation. Captured explicit
  grants then restore the repaired full-history ACL state.
- Replay timestamps are deterministically mapped to ordered millisecond offsets,
  preserving strict effective-date intervals. The first flat-timestamp attempt
  correctly failed the `refresh_domain_policy_dates` constraint and was discarded.
- `scoring_profiles` loads parent-first with its self-referential foreign key
  continuously enforced. No constraints, triggers or RLS policies are disabled.
- A clean disposable baseline-only replay passed. Its public schema dump is
  byte-identical to the gate-1 schema candidate generated from the repaired
  full-history replay; database lint is clean and schema diff is empty.
- The R4N and forward-repair pgTAP suites passed 29/29 assertions. Direct checks
  found 85/85 public tables with RLS, zero cron jobs, zero business/evidence/
  score/recommendation/sizing rows, five R4N contracts and the repaired closed
  NEWS V6 policy state.
- The repository-wide pgTAP run passed 13 of 14 files. The Stage 7.2A provider
  control-plane test is pinned to superseded historical defaults and failed on
  current final-state values; this is documented as legacy test drift rather than
  bypassed.
- The disposable stack is destroyed after verification. Active migrations,
  ordinary local and production remain unchanged.
