#!/usr/bin/env node
import { readFile } from "node:fs/promises"

const POLICY_PATH = new URL("../docs/p3/PortfolioAI_P3_ACCEPTANCE_DATA_POLICY_V1.json", import.meta.url)
const policy = JSON.parse(await readFile(POLICY_PATH, "utf8"))
const [sourcePath, targetPath] = process.argv.slice(2)

if (!sourcePath || !targetPath) {
  throw new Error("Usage: node scripts/p3-acceptance-refresh-plan.mjs <source-inventory.json> <target-inventory.json>")
}

const source = JSON.parse(await readFile(sourcePath, "utf8"))
const target = JSON.parse(await readFile(targetPath, "utf8"))

if (source.projectRef !== policy.sourceProject.ref) {
  throw new Error("Source inventory is not the approved Production reference.")
}
if (source.accessMode !== "READ_ONLY") {
  throw new Error("Production source must be explicitly READ_ONLY.")
}
if (target.projectRef !== policy.targetProject.ref) {
  throw new Error("Target inventory is not the approved Development project.")
}
if (target.projectRef === policy.sourceProject.ref) {
  throw new Error("Refusing to generate a refresh plan with Production as the target.")
}
if (target.localFixturePortfolioRows !== 0) {
  throw new Error("Development contains the local regression fixture portfolio; fixture separation must be repaired before refresh planning.")
}

const steps = [
  "Freeze exact source and target inventory manifests.",
  "Verify Production access is read-only and Development is the only write target.",
  "Export only the approved acceptance-data table families; never export Auth credentials, sessions, Vault values, provider secrets, scheduler tokens or AI credentials.",
  "Create or resolve the controlled Development Auth identity.",
  "Apply the deterministic Production-owner → Development-owner identity map at ownership boundaries only.",
  "Load parent/reference rows before dependent rows; preserve stable canonical IDs where safe and preserve immutable raw/provenance rows.",
  "Do not activate ingestion, providers, schedulers, paid AI, notifications, score/recommendation/sizing execution or trading.",
  "Run post-load row-count, FK, RLS, ownership, canonical-price-path and fixture-separation verification.",
  "Run authenticated browser acceptance against the existing Development surfaces.",
  "Store the refresh evidence/manifest; remove temporary transfer files and credentials."
]

const plan = {
  version: "P3_ACCEPTANCE_REFRESH_PLAN_V1",
  generatedFromPolicy: policy.version,
  sourceProjectRef: source.projectRef,
  sourceAccessMode: source.accessMode,
  targetProjectRef: target.projectRef,
  writeTarget: "DEVELOPMENT_ONLY",
  destructiveTargetReset: false,
  productionMutation: false,
  providerExecution: false,
  schedulerActivation: false,
  paidAi: false,
  trading: false,
  steps
}

process.stdout.write(JSON.stringify(plan, null, 2) + "\n")
