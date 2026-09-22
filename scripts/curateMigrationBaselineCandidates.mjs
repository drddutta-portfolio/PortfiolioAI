import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(scriptDirectory, "..");
const candidateDirectory = join(
  repositoryRoot,
  "supabase/migration_baselines/20260915_candidate",
);
const curatedDirectory = join(
  repositoryRoot,
  "supabase/migration_baselines/20260915_curated",
);

const schemaCandidatePath = join(
  candidateDirectory,
  "portfolioai_schema_baseline_v1.candidate.sql",
);
const referenceCandidatePath = join(
  candidateDirectory,
  "portfolioai_reference_registry_v1.candidate.sql",
);
const operationalCandidatePath = join(
  candidateDirectory,
  "portfolioai_local_operational_defaults_v1.candidate.sql",
);

const schemaOutputPath = join(
  curatedDirectory,
  "portfolioai_schema_baseline_v1.sql",
);
const referenceOutputPath = join(
  curatedDirectory,
  "portfolioai_reference_registry_v1.sql",
);
const contractOutputPath = join(
  curatedDirectory,
  "portfolioai_reference_registry_contract_v1.json",
);
const operationalOutputPath = join(
  curatedDirectory,
  "portfolioai_local_operational_defaults_v1.sql",
);

const extensionPreamble = `-- Curated PortfolioAI schema baseline V1.
-- Generated from a disposable repaired full-history replay; contains no business rows.
begin;

set check_function_bodies = false;

create schema if not exists extensions;
create schema if not exists graphql;
create schema if not exists vault;

create extension if not exists btree_gist with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_graphql with schema graphql;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_stat_statements with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists supabase_vault with schema vault;
create extension if not exists "uuid-ossp" with schema extensions;

-- Supabase bootstrap roles may define permissive defaults. Neutralize them before
-- creating baseline objects; the captured explicit grants and final default
-- privileges below restore the repaired full-history state exactly.
alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated, service_role;

`;

const dumpHeaderPattern = /^(?:\s*--[^\n]*\n|\s*SET [^;]+;\n|\s*SELECT pg_catalog\.set_config\([^;]+;\n)*/;
const dumpFooterPattern = /\n*--\n-- PostgreSQL database dump complete\n--\s*$/;

const schemaCandidate = readFileSync(schemaCandidatePath, "utf8");
const curatedSchemaBody = schemaCandidate
  .replace(dumpHeaderPattern, "")
  .replace(dumpFooterPattern, "\n")
  .trim();

writeFileSync(
  schemaOutputPath,
  `${extensionPreamble}${curatedSchemaBody}\n\ncommit;\n`,
);

const referenceCandidate = readFileSync(referenceCandidatePath, "utf8");
const replayTimestampPattern = /2026-09-15 \d{2}:\d{2}:\d{2}(?:\.\d+)?\+00/g;
const replayTimestamps = [
  ...new Set(referenceCandidate.match(replayTimestampPattern) ?? []),
].sort();
const deterministicTimestampByReplayValue = new Map(
  replayTimestamps.map((timestamp, index) => {
    const seconds = Math.floor(index / 1000);
    const milliseconds = index % 1000;
    const deterministicTimestamp = new Date(
      Date.UTC(2026, 8, 15, 0, 0, seconds, milliseconds),
    )
      .toISOString()
      .replace("T", " ")
      .replace("Z", "+00");
    return [timestamp, deterministicTimestamp];
  }),
);
const deterministicReferenceBody = referenceCandidate
  .replace(dumpHeaderPattern, "")
  .replace(dumpFooterPattern, "\n")
  .replace(replayTimestampPattern, (timestamp) =>
    deterministicTimestampByReplayValue.get(timestamp),
  )
  .trim();

const tableContracts = [
  ["classification_taxonomies", "classification taxonomy authority", "versioned classification taxonomy definitions", ["code", "version"], 2],
  ["data_sources", "source registry authority", "approved source identity and capability registry", ["code"], 8],
  ["sectors", "classification taxonomy authority", "canonical sector registry", ["code"], 5],
  ["industries", "classification taxonomy authority", "canonical industry registry", ["code"], 6],
  ["classification_source_mappings", "classification mapping authority", "reviewed provider-to-canonical classification mappings", ["source_code", "taxonomy_code", "taxonomy_version", "source_sector", "source_industry"], 6],
  ["fundamental_metric_definitions", "fundamental metric registry authority", "canonical metric definitions and provenance requirements", ["metric_code"], 47],
  ["market_benchmarks", "market benchmark registry authority", "canonical benchmark definitions", ["code"], 1],
  ["market_cap_classification_policies", "market-cap policy authority", "versioned market-cap classification policy", ["code", "version"], 1],
  ["market_data_providers", "market-data provider authority", "approved market-data provider registry", ["code"], 1],
  ["provider_ingestion_controls", "provider control-plane authority", "provider ingestion safety limits", ["source_code"], 2],
  ["rating_agencies", "ratings registry authority", "canonical external rating agency registry", ["code"], 7],
  ["scoring_profiles", "scoring profile authority", "profile hierarchy used by deterministic scoring contracts", ["code"], 13],
  ["recommendation_profile_policies", "recommendation policy authority", "versioned profile recommendation policies", ["profile_code", "policy_version"], 12],
  ["refresh_domain_policies", "research refresh policy authority", "versioned domain refresh and freshness policies", ["domain_code", "policy_version"], 21],
  ["research_subprofile_contracts", "research subprofile contract authority", "PHARMA_V1 subprofile contract registry", ["parent_profile_code", "parent_profile_version", "subprofile_code", "subprofile_version"], 5],
  ["scoring_models", "scoring model authority", "versioned deterministic scoring model registry", ["code", "version"], 1],
  ["scoring_model_dimensions", "scoring model authority", "model dimension definitions", ["scoring_model_id", "dimension_code"], 28],
  ["scoring_model_metric_rules", "scoring model authority", "deterministic metric-to-dimension rules", ["scoring_model_id", "dimension_code", "input_code"], 70],
  ["scoring_profile_dimension_overrides", "scoring profile authority", "profile-specific dimension applicability and weights", ["scoring_model_id", "scoring_profile_code", "dimension_code"], 90],
  ["scoring_profile_metric_overrides", "scoring profile authority", "profile-specific metric applicability and weights", ["scoring_model_id", "scoring_profile_code", "dimension_code", "input_code"], 20],
  ["scoring_profile_sector_rules", "scoring profile routing authority", "sector and industry routing into scoring profiles", ["scoring_profile_code", "sector_pattern", "industry_pattern"], 31],
].map(([table, owner, purpose, naturalKey, expectedRowCount]) => ({
  table,
  owner,
  purpose,
  natural_key: naturalKey,
  expected_row_count: expectedRowCount,
}));

const assertions = tableContracts
  .map(
    ({ table, expected_row_count: expectedRowCount }) =>
      `  if (select count(*) from public.${table}) <> ${expectedRowCount} then\n` +
      `    raise exception 'PORTFOLIOAI_BASELINE_REFERENCE_COUNT_MISMATCH:${table}';\n` +
      "  end if;",
  )
  .join("\n");

const referencePreamble = `-- Curated PortfolioAI reference registry baseline V1.
-- Replay-generated audit timestamps are normalized to the baseline date.
begin;

`;
const referenceAssertions = `

do $baseline_assertions$
begin
${assertions}
end
$baseline_assertions$;

commit;
`;

writeFileSync(
  referenceOutputPath,
  `${referencePreamble}${deterministicReferenceBody}${referenceAssertions}`,
);

const operationalCandidate = readFileSync(operationalCandidatePath, "utf8");
writeFileSync(
  operationalOutputPath,
  `-- Curated PortfolioAI local operational defaults V1.\n${operationalCandidate}`,
);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

writeFileSync(
  contractOutputPath,
  `${JSON.stringify(
    {
      contract_version: "PORTFOLIOAI_REFERENCE_REGISTRY_BASELINE_V1",
      baseline_date: "2026-09-15",
      timestamp_policy:
        "Unique replay-generated 2026-09-15 SQL timestamp literals are sorted and mapped to stable millisecond offsets from 2026-09-15T00:00:00Z. This preserves ordering and effective intervals; business dates, embedded source timestamps, and historical dates remain unchanged.",
      source_candidate_sha256: {
        schema: sha256(schemaCandidate),
        reference_registry: sha256(referenceCandidate),
        local_operational_defaults: sha256(operationalCandidate),
      },
      tables: tableContracts,
    },
    null,
    2,
  )}\n`,
);
