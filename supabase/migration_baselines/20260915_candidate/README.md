# PortfolioAI baseline V1 candidate artifacts

Status: **GENERATED FOR REVIEW — NOT ACTIVE MIGRATIONS**

These files were generated from a disposable full-history replay after R4N and the two forward repairs. They must not be moved into `supabase/migrations/` or applied to any database until the baseline equivalence work and cutover gate are approved.

## Files

- `portfolioai_schema_baseline_v1.candidate.sql`: schema-only `public` dump. It contains tables, functions, views, constraints, indexes, triggers, grants and RLS, but extension creation must be supplied by a reviewed preamble.
- `portfolioai_reference_registry_v1.candidate.sql`: data-only export of the explicit global reference/configuration allowlist. It contains no portfolio, transaction, security, listing, mapping, evidence, score, recommendation or sizing rows.
- `portfolioai_local_operational_defaults_v1.candidate.sql`: opt-in local scheduler definitions; it is inert unless the database setting `portfolioai.enable_local_schedulers` is explicitly set to `on`.

## Required curation before activation

1. Add the reviewed extension preamble for `btree_gist`, `pg_cron`, `pg_graphql`, `pg_net`, `pg_stat_statements`, `pgcrypto`, `supabase_vault` and `uuid-ossp` in their canonical schemas.
2. Remove dump-session boilerplate that is unsuitable inside a migration.
3. Replace nondeterministic reference-row timestamps with deterministic values or omit them where defaults are not semantically relevant.
4. Resolve the `scoring_profiles` circular foreign-key restore warning through an explicit two-phase insert/update sequence; do not disable triggers or constraints.
5. Add stable-key row counts and canonical JSON/hash assertions for every allowlisted table.
6. Replay the curated candidates from zero and compare catalog/reference fingerprints to the full-history source.

## Reference allowlist

`classification_source_mappings`, `classification_taxonomies`, `data_sources`, `fundamental_metric_definitions`, `industries`, `market_benchmarks`, `market_cap_classification_policies`, `market_data_providers`, `provider_ingestion_controls`, `rating_agencies`, `recommendation_profile_policies`, `refresh_domain_policies`, `research_subprofile_contracts`, `scoring_model_dimensions`, `scoring_model_metric_rules`, `scoring_models`, `scoring_profile_dimension_overrides`, `scoring_profile_metric_overrides`, `scoring_profile_sector_rules`, `scoring_profiles`, `sectors`.

Explicitly excluded non-empty disposable tables were `auth.users`, `portfolios`, `securities`, `security_listings`, `transactions`, `market_data_instrument_mappings`, `market_data_mapping_reviews` and `data_source_records`.

The excluded rows include the migration-replay fixture and security/evidence-specific reconciliation state. They are not baseline reference data.
