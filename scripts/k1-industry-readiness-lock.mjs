#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"

const DEFAULT_INVENTORY = "artifacts/k1-final-reconciled-sector-inventory.json"
const DEFAULT_TAXONOMY = "docs/k1/PortfolioAI_GATE_K_INDUSTRY_RESEARCH_TAXONOMY.json"
const DEFAULT_OUTPUT = "artifacts/k1-industry-readiness-lock.json"

function argValue(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : null
}

function key(value) {
  return typeof value === "string"
    ? value.trim().toUpperCase().replace(/[^A-Z0-9]+/gu, "_").replace(/^_+|_+$/gu, "")
    : ""
}

function countBy(values) {
  const map = new Map()
  for (const value of values) map.set(value, (map.get(value) ?? 0) + 1)
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

function matchRoute(row, taxonomy) {
  const sector = key(row.finalSector)
  const industry = key(row.finalIndustry)
  if (!industry) return null

  for (const route of taxonomy.routes ?? []) {
    const sectorMatch = route.sectors?.includes("*") || route.sectors?.includes(sector)
    const industryMatch = route.industries?.includes(industry)
    if (sectorMatch && industryMatch) return route
  }
  return null
}

async function main() {
  const inventoryPath = argValue("--inventory") ?? DEFAULT_INVENTORY
  const taxonomyPath = argValue("--taxonomy") ?? DEFAULT_TAXONOMY
  const outputPath = argValue("--output") ?? DEFAULT_OUTPUT

  const [inventory, taxonomy] = await Promise.all([
    fs.readFile(inventoryPath, "utf8").then(JSON.parse),
    fs.readFile(taxonomyPath, "utf8").then(JSON.parse),
  ])

  if (!Array.isArray(inventory.rows) || inventory.rows.length === 0) throw new Error("FINAL_INVENTORY_ROWS_MISSING")
  if (!Array.isArray(taxonomy.routes)) throw new Error("INDUSTRY_TAXONOMY_ROUTES_MISSING")

  const rows = inventory.rows.map((row) => {
    const route = matchRoute(row, taxonomy)
    const industryPresent = Boolean(key(row.finalIndustry))
    const basicIndustryPresent = Boolean(key(row.finalBasicIndustry))
    const readinessState = !industryPresent
      ? "INDUSTRY_MISSING"
      : route
        ? "ROUTABLE_WITH_CURRENT_TAXONOMY"
        : "INDUSTRY_PRESENT_TAXONOMY_PENDING"

    return {
      symbol: row.symbol,
      sector: row.finalSector ?? null,
      industry: row.finalIndustry ?? null,
      basicIndustry: row.finalBasicIndustry ?? null,
      referenceSource: row.referenceSource ?? null,
      readinessState,
      profileCode: route?.profileCode ?? null,
      methodologyFamily: route?.methodologyFamily ?? null,
      taxonomyState: route?.state ?? null,
    }
  })

  const industryPresentCount = rows.filter((row) => row.industry).length
  const industryMissingCount = rows.length - industryPresentCount
  const basicIndustryPresentCount = rows.filter((row) => row.basicIndustry).length
  const routableCount = rows.filter((row) => row.readinessState === "ROUTABLE_WITH_CURRENT_TAXONOMY").length
  const taxonomyPendingCount = rows.filter((row) => row.readinessState === "INDUSTRY_PRESENT_TAXONOMY_PENDING").length

  const result = {
    contract: "PORTFOLIOAI_K1_INDUSTRY_READINESS_LOCK_V1",
    generatedAt: new Date().toISOString(),
    sourceInventoryContract: inventory.contract ?? null,
    taxonomyContract: taxonomy.contract ?? null,
    equityCount: rows.length,
    industryPresentCount,
    industryMissingCount,
    industryCoveragePct: Number(((industryPresentCount / rows.length) * 100).toFixed(2)),
    basicIndustryPresentCount,
    basicIndustryCoveragePct: Number(((basicIndustryPresentCount / rows.length) * 100).toFixed(2)),
    routableWithCurrentTaxonomyCount: routableCount,
    industryPresentTaxonomyPendingCount: taxonomyPendingCount,
    distinctIndustries: countBy(rows.filter((row) => row.industry).map((row) => row.industry)).length,
    readinessCounts: countBy(rows.map((row) => row.readinessState)),
    sectorCounts: countBy(rows.map((row) => row.sector ?? "UNCLASSIFIED")),
    industryCounts: countBy(rows.filter((row) => row.industry).map((row) => row.industry)),
    missingIndustrySymbols: rows.filter((row) => row.readinessState === "INDUSTRY_MISSING").map((row) => row.symbol),
    taxonomyPendingRows: rows.filter((row) => row.readinessState === "INDUSTRY_PRESENT_TAXONOMY_PENDING"),
    routableRows: rows.filter((row) => row.readinessState === "ROUTABLE_WITH_CURRENT_TAXONOMY"),
    rows,
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, JSON.stringify(result, null, 2) + "\n", "utf8")

  process.stdout.write("K1 INDUSTRY READINESS LOCK\n")
  process.stdout.write(`Equities: ${result.equityCount}\n`)
  process.stdout.write(`Industry present: ${result.industryPresentCount} (${result.industryCoveragePct}%)\n`)
  process.stdout.write(`Industry missing: ${result.industryMissingCount}\n`)
  process.stdout.write(`Basic industry present: ${result.basicIndustryPresentCount} (${result.basicIndustryCoveragePct}%)\n`)
  process.stdout.write(`Routable with current taxonomy: ${result.routableWithCurrentTaxonomyCount}\n`)
  process.stdout.write(`Industry present but taxonomy pending: ${result.industryPresentTaxonomyPendingCount}\n`)
  process.stdout.write(`Distinct industries: ${result.distinctIndustries}\n\n`)

  process.stdout.write("READINESS STATE\tCOUNT\n")
  for (const item of result.readinessCounts) process.stdout.write(`${item.name}\t${item.count}\n`)

  process.stdout.write("\nINDUSTRY\tCOUNT\n")
  for (const item of result.industryCounts) process.stdout.write(`${item.name}\t${item.count}\n`)

  if (result.missingIndustrySymbols.length) {
    process.stdout.write("\nINDUSTRY MISSING\n")
    process.stdout.write(result.missingIndustrySymbols.join(", ") + "\n")
  }

  process.stdout.write(`\nOutput: ${outputPath}\n`)
}

main().catch((error) => {
  process.stderr.write(`K1 industry readiness failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
