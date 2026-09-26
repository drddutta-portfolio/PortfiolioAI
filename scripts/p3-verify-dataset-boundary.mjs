#!/usr/bin/env node
import { readFile } from "node:fs/promises"

const POLICY_PATH = new URL("../docs/p3/PortfolioAI_P3_ACCEPTANCE_DATA_POLICY_V1.json", import.meta.url)
const policy = JSON.parse(await readFile(POLICY_PATH, "utf8"))

const [mode, inventoryPath] = process.argv.slice(2)
if (!["LOCAL_FIXTURE", "DEV_ACCEPTANCE"].includes(mode ?? "")) {
  throw new Error("Usage: node scripts/p3-verify-dataset-boundary.mjs <LOCAL_FIXTURE|DEV_ACCEPTANCE> <inventory.json>")
}
if (!inventoryPath) throw new Error("An inventory JSON path is required.")

const inventory = JSON.parse(await readFile(inventoryPath, "utf8"))
const fixture = policy.localRegressionFixture
const acceptance = policy.developmentAcceptancePortfolio

function requireEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

if (mode === "LOCAL_FIXTURE") {
  requireEqual(inventory.environment, "LOCAL", "environment")
  requireEqual(inventory.portfolioId, fixture.portfolioId, "local fixture portfolioId")
  requireEqual(inventory.portfolioName, fixture.name, "local fixture portfolioName")
  requireEqual(inventory.openHoldingCount, fixture.expectedHoldingCount, "local fixture openHoldingCount")
  if (inventory.productionProjectRef || inventory.developmentProjectRef) {
    throw new Error("Local regression fixture inventory must not identify a hosted Supabase project.")
  }
}

if (mode === "DEV_ACCEPTANCE") {
  requireEqual(inventory.environment, "DEVELOPMENT", "environment")
  requireEqual(inventory.projectRef, policy.targetProject.ref, "Development projectRef")
  requireEqual(inventory.portfolioId, acceptance.portfolioId, "Development acceptance portfolioId")
  requireEqual(inventory.portfolioName, acceptance.name, "Development acceptance portfolioName")
  requireEqual(inventory.transactionRows, acceptance.transactionRows, "Development acceptance transactionRows")
  requireEqual(inventory.localFixturePortfolioRows, fixture.permittedDevPortfolioRows, "local fixture rows in Development")
  if (inventory.projectRef === policy.sourceProject.ref) {
    throw new Error("Development inventory cannot target the Production project.")
  }
}

process.stdout.write(JSON.stringify({
  version: policy.version,
  mode,
  result: "PASS",
  portfolioId: inventory.portfolioId,
}, null, 2) + "\n")
