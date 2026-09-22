import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(scriptDirectory, "..");
const activeDirectory = join(repositoryRoot, "supabase/migrations");
const archiveDirectory = join(
  repositoryRoot,
  "supabase/migrations_legacy/20260915_pre_r4n_baseline",
);
const manifestPath = join(
  repositoryRoot,
  "supabase/migration_baselines/20260915_pre_r4n_manifest.json",
);
const curatedDirectory = join(
  repositoryRoot,
  "supabase/migration_baselines/20260915_curated",
);

const baselineMigrations = [
  ["20260915140000_portfolioai_schema_baseline_v1.sql", "portfolioai_schema_baseline_v1.sql"],
  ["20260915140001_portfolioai_reference_registry_v1.sql", "portfolioai_reference_registry_v1.sql"],
  ["20260915140002_portfolioai_local_operational_defaults_v1.sql", "portfolioai_local_operational_defaults_v1.sql"],
];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

if (manifest.manifest_version !== "PORTFOLIOAI_MIGRATION_BASELINE_V1") {
  throw new Error("Unexpected migration baseline manifest version.");
}

for (const migration of manifest.migrations) {
  const archivePath = join(archiveDirectory, migration.filename);
  const activePath = join(activeDirectory, migration.filename);
  if (!existsSync(archivePath) || !existsSync(activePath)) {
    throw new Error(`Missing archived or active migration: ${migration.filename}`);
  }
  const archived = readFileSync(archivePath);
  const active = readFileSync(activePath);
  if (sha256(archived) !== migration.sha256 || sha256(active) !== migration.sha256) {
    throw new Error(`Checksum mismatch; cutover aborted: ${migration.filename}`);
  }
}

const activeSqlFiles = readdirSync(activeDirectory)
  .filter((name) => /^\d+_.+\.sql$/.test(name))
  .sort();
const expectedActiveFiles = manifest.migrations
  .map(({ filename }) => filename)
  .sort();
if (JSON.stringify(activeSqlFiles) !== JSON.stringify(expectedActiveFiles)) {
  throw new Error("Active migration set differs from the immutable gate-1 manifest.");
}

const migrationsByVersion = new Map();
for (const migration of manifest.migrations) {
  const group = migrationsByVersion.get(migration.version) ?? [];
  group.push(migration);
  migrationsByVersion.set(migration.version, group);
}

for (const name of activeSqlFiles) {
  rmSync(join(activeDirectory, name));
}

for (const [version, migrations] of [...migrationsByVersion.entries()].sort()) {
  const archivedFiles = migrations.map(({ filename }) => filename);
  const markerName = `${version}_legacy_compatibility_marker.sql`;
  const marker = [
    "-- PortfolioAI migration-baseline compatibility marker.",
    `-- Historical version: ${version}`,
    "-- Original SQL is preserved byte-for-byte in:",
    ...archivedFiles.map(
      (filename) =>
        `-- supabase/migrations_legacy/20260915_pre_r4n_baseline/${filename}`,
    ),
    "-- Final effects are incorporated into the verified 20260915140000/1 baseline.",
    "-- Intentionally no-op.",
    "",
  ].join("\n");
  writeFileSync(join(activeDirectory, markerName), marker);
}

for (const [migrationName, curatedName] of baselineMigrations) {
  copyFileSync(
    join(curatedDirectory, curatedName),
    join(activeDirectory, migrationName),
  );
}

const resultingFiles = readdirSync(activeDirectory)
  .filter((name) => /^\d+_.+\.sql$/.test(name))
  .sort();
const resultingVersions = resultingFiles.map((name) => name.split("_", 1)[0]);
if (new Set(resultingVersions).size !== resultingVersions.length) {
  throw new Error("Cutover produced duplicate active migration versions.");
}
if (resultingFiles.length !== manifest.unique_version_count + baselineMigrations.length) {
  throw new Error("Cutover produced an unexpected active migration count.");
}

process.stdout.write(
  `Created ${manifest.unique_version_count} compatibility markers and ${baselineMigrations.length} baseline migrations.\n`,
);
