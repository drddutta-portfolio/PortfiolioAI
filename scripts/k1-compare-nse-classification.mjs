#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const DEFAULT_OFFICIAL = "artifacts/k1-nse-primary-classification.json"
const DEFAULT_CANONICAL = "artifacts/k1-current-canonical-classification.json"
const DEFAULT_OUTPUT = "artifacts/k1-nse-classification-reconciliation.json"

function argValue(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : null
}

function normalize(value) {
  return typeof value === "string"
    ? value.trim().toUpperCase().replace(/[^A-Z0-9]+/gu, "_").replace(/^_+|_+$/gu, "")
    : ""
}

function clean(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function rowMap(rows, label) {
  const map = new Map()
  for (const row of rows ?? []) {
    const symbol = clean(row?.symbol)
    if (!symbol) throw new Error(`${label}_ROW_WITHOUT_SYMBOL`)
    const key = symbol.toUpperCase()
    if (map.has(key)) throw new Error(`${label}_DUPLICATE_SYMBOL:${symbol}`)
    map.set(key, row)
  }
  return map
}

function sameIsin(a, b) {
  if (!a || !b) return true
  return normalize(a) === normalize(b)
}

function classifyPair(canonical, official) {
  if (!official) {
    return {
      state: "OFFICIAL_MISSING",
      reasonCode: "NO_OFFICIAL_NSE_SNAPSHOT_ROW",
    }
  }

  if (!clean(official.sector)) {
    return {
      state: "OFFICIAL_MISSING",
      reasonCode: "OFFICIAL_NSE_PRIMARY_SECTOR_MISSING",
    }
  }

  if (!sameIsin(canonical?.isin, official?.isin)) {
    return {
      state: "REVIEW_REQUIRED",
      reasonCode: "ISIN_MISMATCH",
    }
  }

  const canonicalSector = normalize(canonical?.sector)
  const officialSector = normalize(official?.sector)
  const canonicalIndustry = normalize(canonical?.industry)
  const officialIndustry = normalize(official?.industry)

  if (!canonicalSector) {
    return {
      state: "CHANGE_REQUIRED",
      reasonCode: "CANONICAL_PRIMARY_SECTOR_MISSING",
    }
  }

  if (canonicalSector !== officialSector) {
    return {
      state: "CHANGE_REQUIRED",
      reasonCode: "CANONICAL_PRIMARY_SECTOR_DIFFERS_FROM_NSE",
    }
  }

  if (officialIndustry && !canonicalIndustry) {
    return {
      state: "DETAIL_MISSING",
      reasonCode: "CANONICAL_INDUSTRY_MISSING",
    }
  }

  if (officialIndustry && canonicalIndustry && officialIndustry !== canonicalIndustry) {
    return {
      state: "CHANGE_REQUIRED",
      reasonCode: "CANONICAL_INDUSTRY_DIFFERS_FROM_NSE",
    }
  }

  return {
    state: "AGREE",
    reasonCode: officialIndustry
      ? "CANONICAL_SECTOR_INDUSTRY_AGREE_WITH_NSE"
      : "CANONICAL_PRIMARY_SECTOR_AGREES_WITH_NSE",
  }
}

export function reconcileNseClassification(canonicalSnapshot, officialSnapshot) {
  const canonicalRows = canonicalSnapshot?.rows
  const officialRows = officialSnapshot?.rows

  if (!Array.isArray(canonicalRows)) throw new Error("CANONICAL_ROWS_MISSING")
  if (!Array.isArray(officialRows)) throw new Error("OFFICIAL_ROWS_MISSING")

  const canonical = rowMap(canonicalRows, "CANONICAL")
  const official = rowMap(officialRows, "OFFICIAL")
  const symbols = [...new Set([...canonical.keys(), ...official.keys()])].sort()

  const rows = symbols.map((symbol) => {
    const current = canonical.get(symbol) ?? null
    const exchange = official.get(symbol) ?? null

    if (!current) {
      return {
        symbol,
        state: "REVIEW_REQUIRED",
        reasonCode: "OFFICIAL_SYMBOL_NOT_IN_CURRENT_CANONICAL_COHORT",
        canonical: null,
        official: exchange,
      }
    }

    const assessment = classifyPair(current, exchange)
    return {
      symbol,
      state: assessment.state,
      reasonCode: assessment.reasonCode,
      canonical: {
        securityId: current.securityId ?? null,
        isin: current.isin ?? null,
        sector: current.sector ?? null,
        industry: current.industry ?? null,
        enrichmentState: current.enrichmentState ?? null,
        sectorSource: current.sectorSource ?? null,
        industrySource: current.industrySource ?? null,
      },
      official: exchange
        ? {
            isin: exchange.isin ?? null,
            companyName: exchange.companyName ?? null,
            macroEconomicSector: exchange.macroEconomicSector ?? null,
            sector: exchange.sector ?? null,
            industry: exchange.industry ?? null,
            basicIndustry: exchange.basicIndustry ?? null,
            sourceUrl: exchange.sourceUrl ?? null,
            retrievedAt: exchange.retrievedAt ?? null,
          }
        : null,
    }
  })

  const counts = rows.reduce((acc, row) => {
    acc[row.state] = (acc[row.state] ?? 0) + 1
    return acc
  }, {})

  return {
    contract: "PORTFOLIOAI_K1_NSE_CLASSIFICATION_RECONCILIATION_V1",
    generatedAt: new Date().toISOString(),
    canonicalContract: canonicalSnapshot?.contract ?? null,
    officialContract: officialSnapshot?.contract ?? null,
    canonicalRowCount: canonicalRows.length,
    officialRowCount: officialRows.length,
    comparisonRowCount: rows.length,
    counts,
    freezeEligible:
      rows.length === canonicalRows.length &&
      (counts.OFFICIAL_MISSING ?? 0) === 0 &&
      (counts.REVIEW_REQUIRED ?? 0) === 0,
    rows,
  }
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"))
}

async function main() {
  const officialPath = argValue("--official") ?? DEFAULT_OFFICIAL
  const canonicalPath = argValue("--canonical") ?? DEFAULT_CANONICAL
  const outputPath = argValue("--output") ?? DEFAULT_OUTPUT

  const [official, canonical] = await Promise.all([
    readJson(officialPath),
    readJson(canonicalPath),
  ])

  const result = reconcileNseClassification(canonical, official)
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, JSON.stringify(result, null, 2) + "\n", "utf8")

  const order = ["AGREE", "DETAIL_MISSING", "CHANGE_REQUIRED", "REVIEW_REQUIRED", "OFFICIAL_MISSING"]
  for (const state of order) {
    process.stdout.write(`${state}: ${result.counts[state] ?? 0}\n`)
  }
  process.stdout.write(`Freeze eligible: ${result.freezeEligible ? "YES" : "NO"}\n`)
  process.stdout.write(`Output: ${outputPath}\n`)

  if ((result.counts.REVIEW_REQUIRED ?? 0) > 0 || (result.counts.OFFICIAL_MISSING ?? 0) > 0) {
    process.exitCode = 2
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isMain) {
  main().catch((error) => {
    process.stderr.write(`K1 NSE reconciliation failed: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
