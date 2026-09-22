#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"

const DEFAULT_INPUT = "artifacts/k1-nse-classification-reconciliation.json"
const DEFAULT_OUTPUT = "artifacts/k1-final-reconciled-sector-inventory.json"

function argValue(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : null
}

function clean(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function countBy(rows, keyFn) {
  const counts = new Map()
  for (const row of rows) {
    const key = keyFn(row)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

async function main() {
  const inputPath = argValue("--input") ?? DEFAULT_INPUT
  const outputPath = argValue("--output") ?? DEFAULT_OUTPUT

  const reconciliation = JSON.parse(await fs.readFile(inputPath, "utf8"))
  if (!Array.isArray(reconciliation.rows)) throw new Error("RECONCILIATION_ROWS_MISSING")
  if (reconciliation.freezeEligible !== true) throw new Error("RECONCILIATION_NOT_FREEZE_ELIGIBLE")
  if ((reconciliation.counts?.REVIEW_REQUIRED ?? 0) !== 0) throw new Error("REVIEW_REQUIRED_REMAINS")
  if ((reconciliation.counts?.OFFICIAL_MISSING ?? 0) !== 0) throw new Error("OFFICIAL_MISSING_REMAINS")

  const rows = reconciliation.rows.map((row) => {
    const finalSector = clean(row?.official?.sector) ?? clean(row?.canonical?.sector)
    const finalIndustry = clean(row?.official?.industry) ?? clean(row?.canonical?.industry)
    const finalBasicIndustry = clean(row?.official?.basicIndustry)
    if (!finalSector) throw new Error(`FINAL_SECTOR_MISSING:${row?.symbol ?? "UNKNOWN"}`)

    return {
      symbol: row.symbol,
      finalSector,
      finalIndustry,
      finalBasicIndustry,
      referenceSource: row?.official?.sourceKind ?? "UNKNOWN",
      reconciliationState: row.state,
      changeScopes: row.changeScopes ?? [],
      canonicalSector: row?.canonical?.sector ?? null,
      canonicalIndustry: row?.canonical?.industry ?? null,
      referenceSector: row?.official?.sector ?? null,
      referenceIndustry: row?.official?.industry ?? null,
      referenceBasicIndustry: row?.official?.basicIndustry ?? null,
    }
  })

  const sectorCounts = countBy(rows, (row) => row.finalSector)
  const sourceCounts = countBy(rows, (row) => row.referenceSource)
  const reconciliationCounts = countBy(rows, (row) => row.reconciliationState)

  const result = {
    contract: "PORTFOLIOAI_K1_FINAL_RECONCILED_SECTOR_INVENTORY_V2",
    generatedAt: new Date().toISOString(),
    sourceReconciliationContract: reconciliation.contract ?? null,
    rowCount: rows.length,
    freezeEligible: true,
    sectorCount: sectorCounts.length,
    sectorCounts,
    sourceCounts,
    reconciliationCounts,
    rows,
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, JSON.stringify(result, null, 2) + "\n", "utf8")

  process.stdout.write("K1 FINAL RECONCILED SECTOR INVENTORY\n")
  process.stdout.write(`Rows: ${result.rowCount}\n`)
  process.stdout.write(`Distinct sectors: ${result.sectorCount}\n\n`)
  process.stdout.write("SECTOR\tCOUNT\n")
  for (const item of sectorCounts) process.stdout.write(`${item.name}\t${item.count}\n`)

  process.stdout.write("\nREFERENCE SOURCE\tCOUNT\n")
  for (const item of sourceCounts) process.stdout.write(`${item.name}\t${item.count}\n`)

  process.stdout.write(`\nOutput: ${outputPath}\n`)
}

main().catch((error) => {
  process.stderr.write(`K1 final sector inventory failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
