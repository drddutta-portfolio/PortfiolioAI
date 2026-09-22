import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const [sourceDirectory, outputPath] = process.argv.slice(2);
if (!sourceDirectory || !outputPath) {
  throw new Error("Usage: node scripts/generateMigrationBaselineManifest.mjs <migration-directory> <output-path>");
}

const files = readdirSync(sourceDirectory)
  .filter((name) => /^\d+_.+\.sql$/.test(name))
  .sort();
const versionCounts = new Map();
for (const name of files) {
  const version = name.split("_", 1)[0];
  versionCounts.set(version, (versionCounts.get(version) ?? 0) + 1);
}

const classify = (sql) => ({
  schema: /\b(create|alter|drop)\s+(table|view|materialized view|function|trigger|policy|index|extension|type)\b/i.test(sql),
  reference_or_configuration_dml: /\b(insert into|update|delete from)\s+public\.(data_sources|refresh_domain_policies|fundamental_metric_definitions|scoring_|recommendation_profile_policies|research_subprofile_contracts)/i.test(sql),
  operational_scheduling: /\bcron\.(schedule|unschedule)\b/i.test(sql),
  state_dependent_reconciliation: /\binto strict\b|\braise exception\b/i.test(sql),
});

const migrations = files.map((name) => {
  const sql = readFileSync(join(sourceDirectory, name));
  const version = name.split("_", 1)[0];
  return {
    filename: name,
    version,
    sha256: createHash("sha256").update(sql).digest("hex"),
    duplicate_version_group: versionCounts.get(version) > 1 ? version : null,
    classification: classify(sql.toString("utf8")),
  };
});

const manifest = {
  manifest_version: "PORTFOLIOAI_MIGRATION_BASELINE_V1",
  source_directory: basename(sourceDirectory),
  migration_count: migrations.length,
  unique_version_count: versionCounts.size,
  duplicate_versions: [...versionCounts.entries()].filter(([, count]) => count > 1).map(([version]) => version),
  migrations,
};

writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
