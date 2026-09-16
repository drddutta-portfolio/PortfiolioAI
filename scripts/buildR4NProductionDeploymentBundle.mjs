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

const approvedMigrations = [
  {
    filename: "20260915190026_reconcile_r4n_research_subprofiles.sql",
    sha256: "17bae04bd9bc613ad3e6a746526b24af5c7998343c0a7e0a490fb3d591104e3d",
  },
  {
    filename: "20260915193011_reconcile_news_policy_final_state.sql",
    sha256: "4d2bb5128764f4f40bf93b8ce93ca7c85dd449cb422e5ba65c563b07bf6b295c",
  },
  {
    filename: "20260915193024_reconcile_portfolio_weight_context.sql",
    sha256: "11fbe76699fdaa23d06ca7d84f07626cc4d92632eaac08bcb1ab5e31947d497d",
  },
];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

for (const migration of approvedMigrations) {
  const source = join(sourceSupabaseDirectory, "migrations", migration.filename);
  const actual = sha256(readFileSync(source));
  if (actual !== migration.sha256) {
    throw new Error(`Checksum mismatch for ${migration.filename}: ${actual}`);
  }
}

const ledgerOutput = execFileSync(
  "supabase",
  ["migration", "list", "--linked"],
  { cwd: repositoryRoot, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
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

for (const migration of approvedMigrations) {
  const version = migration.filename.slice(0, 14);
  if (remoteVersions.includes(version)) {
    throw new Error(`Approved migration is already present remotely: ${version}`);
  }
}

const bundleRoot = mkdtempSync(join(tmpdir(), "portfolioai-r4n-prod-"));
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

for (const migration of approvedMigrations) {
  copyFileSync(
    join(sourceSupabaseDirectory, "migrations", migration.filename),
    join(bundleMigrationDirectory, migration.filename),
  );
}

process.stdout.write(
  JSON.stringify(
    {
      bundleRoot,
      remoteVersionCount: remoteVersions.length,
      approvedMigrations,
    },
    null,
    2,
  ) + "\n",
);
