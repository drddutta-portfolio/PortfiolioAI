import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(scriptDirectory, "..");
const sourceSupabaseDirectory = join(repositoryRoot, "supabase");

const approvedMigration = {
  filename: "20260916100032_reconcile_r4n_secondary_exposure_contract.sql",
  sha256: "17715c03fe12ad0fa46d1b09a76bd5aae4828c39336e2f0d57db39d250918605",
};

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const sourceMigration = join(
  sourceSupabaseDirectory,
  "migrations",
  approvedMigration.filename,
);
const actualChecksum = sha256(readFileSync(sourceMigration));
if (actualChecksum !== approvedMigration.sha256) {
  throw new Error(
    `Checksum mismatch for ${approvedMigration.filename}: ${actualChecksum}`,
  );
}

const ledgerOutput = execFileSync(
  "supabase",
  ["migration", "list", "--linked"],
  {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  },
);

const remoteVersions = ledgerOutput
  .split("\n")
  .filter((line) => line.includes("|"))
  .map((line) => line.split("|")[1]?.trim())
  .filter((version) => /^\d{14}$/.test(version ?? ""));

if (remoteVersions.length === 0) {
  throw new Error("No remote migration versions were parsed; refusing to build bundle.");
}
if (new Set(remoteVersions).size !== remoteVersions.length) {
  throw new Error("Remote migration ledger contains duplicate versions.");
}

const targetVersion = approvedMigration.filename.slice(0, 14);
if (remoteVersions.includes(targetVersion)) {
  throw new Error(`Target migration is already present remotely: ${targetVersion}`);
}

for (const requiredVersion of [
  "20260915190026",
  "20260915193011",
  "20260915193024",
]) {
  if (!remoteVersions.includes(requiredVersion)) {
    throw new Error(
      `Required predecessor migration is missing remotely: ${requiredVersion}`,
    );
  }
}

const bundleRoot = mkdtempSync(join(tmpdir(), "portfolioai-r4n-secondary-prod-"));
const bundleSupabaseDirectory = join(bundleRoot, "supabase");
const bundleMigrationDirectory = join(bundleSupabaseDirectory, "migrations");
const bundleTempDirectory = join(bundleSupabaseDirectory, ".temp");
mkdirSync(bundleMigrationDirectory, { recursive: true });
mkdirSync(bundleTempDirectory, { recursive: true });

copyFileSync(
  join(sourceSupabaseDirectory, "config.toml"),
  join(bundleSupabaseDirectory, "config.toml"),
);

for (const metadataFile of ["project-ref", "pooler-url", "postgres-version"]) {
  const source = join(sourceSupabaseDirectory, ".temp", metadataFile);
  if (!existsSync(source)) {
    throw new Error(`Missing linked-project metadata: ${metadataFile}`);
  }
  copyFileSync(source, join(bundleTempDirectory, metadataFile));
}

for (const version of [...remoteVersions].sort()) {
  writeFileSync(
    join(bundleMigrationDirectory, `${version}_remote_ledger_compatibility_marker.sql`),
    [
      "-- PortfolioAI isolated production deployment compatibility marker.",
      `-- Remote ledger version: ${version}`,
      "-- Intentionally no-op; this version is already applied remotely.",
      "",
    ].join("\n"),
  );
}

copyFileSync(
  sourceMigration,
  join(bundleMigrationDirectory, approvedMigration.filename),
);

process.stdout.write(
  JSON.stringify(
    {
      bundleRoot,
      remoteVersionCount: remoteVersions.length,
      approvedMigration,
    },
    null,
    2,
  ) + "\n",
);
