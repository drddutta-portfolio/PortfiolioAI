#!/usr/bin/env node

import { readFileSync } from "node:fs"

const path = process.argv[2] ?? "docs/p7-ic/PortfolioAI_P7_IC0_PORTFOLIO_COVERAGE_MATRIX_2026-09-28.json"
const matrix = JSON.parse(readFileSync(path, "utf8"))
const fail = (message) => { throw new Error(`IC0 validation failed: ${message}`) }

if (matrix.contract !== "PORTFOLIOAI_P7_IC0_PORTFOLIO_COVERAGE_MATRIX_V1") fail("unexpected contract")
if (!Array.isArray(matrix.records) || matrix.records.length !== matrix.totals.openHoldings) fail("record completeness")
if (new Set(matrix.records.map((record) => record.identity.securityId)).size !== matrix.records.length) fail("security identity uniqueness")
if (matrix.records.filter((record) => record.identity.assetClass === "EQUITY").length !== matrix.totals.equities) fail("equity total")
if (matrix.environment.providerCalls !== 0 || matrix.environment.budgetConsumed !== 0) fail("provider-call boundary")
if (matrix.environment.databaseWrites !== 0 || matrix.environment.productionChanges !== 0) fail("write/Production boundary")
if (matrix.records.some((record) => !record.methodology.lifecycle || !record.r6.state || !record.r7.state || !record.r10.state)) fail("explicit engine state")
if (matrix.records.some((record) => record.lineage.referenceOutputsPromoted !== false)) fail("reference/current-state separation")
if (matrix.records.some((record) => !record.finalDisposition.currentCanonicalBlocker || !record.finalDisposition.nextCanonicalAction)) fail("blocker/action completeness")

console.log(`IC0 validation PASS: ${matrix.records.length}/${matrix.totals.openHoldings} explicit records; zero provider calls; zero writes.`)
