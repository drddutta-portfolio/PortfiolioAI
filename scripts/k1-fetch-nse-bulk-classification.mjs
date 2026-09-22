#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"

const DEFAULT_INPUT = "artifacts/k1-current-canonical-classification.json"
const DEFAULT_OUTPUT = "artifacts/k1-nse-bulk-primary-classification.json"
const DEFAULT_URL = "https://www.niftyindices.com/IndexConstituent/ind_niftytotalmarket_list.csv"

function argValue(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : null
}

function normalizeHeader(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "")
}

function parseCsv(text) {
  const rows = []
  let row = []
  let value = ""
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    const next = text[i + 1]
    if (quoted) {
      if (ch === '"' && next === '"') {
        value += '"'
        i += 1
      } else if (ch === '"') {
        quoted = false
      } else {
        value += ch
      }
      continue
    }
    if (ch === '"') {
      quoted = true
    } else if (ch === ",") {
      row.push(value)
      value = ""
    } else if (ch === "\n") {
      row.push(value.replace(/\r$/u, ""))
      rows.push(row)
      row = []
      value = ""
    } else {
      value += ch
    }
  }
  if (value.length || row.length) {
    row.push(value.replace(/\r$/u, ""))
    rows.push(row)
  }
  return rows.filter((item) => item.some((cell) => cell.trim()))
}

function pick(row, headerMap, names) {
  for (const name of names) {
    const index = headerMap.get(name)
    if (index !== undefined) {
      const value = row[index]?.trim()
      if (value) return value
    }
  }
  return null
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 PortfolioAI-K1-Classification-Audit",
      "accept": "text/csv,text/plain,application/octet-stream,*/*",
      "referer": "https://www.niftyindices.com/indices/equity/broad-based-indices/nifty-total-market",
    },
    redirect: "follow",
  })
  if (!response.ok) throw new Error(`NIFTY_TOTAL_MARKET_HTTP_${response.status}`)
  return response.text()
}

async function main() {
  const inputPath = argValue("--input") ?? DEFAULT_INPUT
  const outputPath = argValue("--output") ?? DEFAULT_OUTPUT
  const sourceUrl = argValue("--url") ?? DEFAULT_URL

  const canonical = JSON.parse(await fs.readFile(inputPath, "utf8"))
  if (!Array.isArray(canonical.rows)) throw new Error("CANONICAL_ROWS_MISSING")

  const csv = await fetchText(sourceUrl)
  const parsed = parseCsv(csv)
  if (parsed.length < 2) throw new Error("NIFTY_TOTAL_MARKET_CSV_EMPTY")

  const headers = parsed[0].map(normalizeHeader)
  const headerMap = new Map(headers.map((header, index) => [header, index]))

  const symbolHeader = ["symbol", "nse_symbol"].find((name) => headerMap.has(name))
  const industryHeader = ["industry", "sector"].find((name) => headerMap.has(name))
  if (!symbolHeader) throw new Error(`NIFTY_TOTAL_MARKET_SYMBOL_COLUMN_MISSING:${headers.join("|")}`)
  if (!industryHeader) throw new Error(`NIFTY_TOTAL_MARKET_INDUSTRY_COLUMN_MISSING:${headers.join("|")}`)

  const officialBySymbol = new Map()
  for (const row of parsed.slice(1)) {
    const symbol = pick(row, headerMap, ["symbol", "nse_symbol"])
    if (!symbol) continue
    officialBySymbol.set(symbol.toUpperCase(), {
      exchange: "NSE",
      symbol,
      companyName: pick(row, headerMap, ["company_name", "company"]),
      isin: pick(row, headerMap, ["isin_code", "isin"]),
      sector: pick(row, headerMap, ["industry", "sector"]),
      industry: null,
      basicIndustry: null,
      macroEconomicSector: null,
      sourceKind: "NSE_INDICES_NIFTY_TOTAL_MARKET_CONSTITUENT",
      sourceUrl,
      retrievedAt: new Date().toISOString(),
    })
  }

  const rows = []
  const residual = []
  for (const current of canonical.rows) {
    const symbol = String(current.symbol ?? "").trim().toUpperCase()
    if (!symbol) continue
    const official = officialBySymbol.get(symbol)
    if (official) {
      rows.push(official)
    } else {
      residual.push({
        symbol,
        isin: current.isin ?? null,
        canonicalSector: current.sector ?? null,
        canonicalIndustry: current.industry ?? null,
        reasonCode: "NOT_IN_NIFTY_TOTAL_MARKET_CURRENT_CONSTITUENTS",
      })
    }
  }

  const result = {
    contract: "PORTFOLIOAI_K1_NSE_BULK_PRIMARY_CLASSIFICATION_V1",
    generatedAt: new Date().toISOString(),
    source: "NSE_INDICES_NIFTY_TOTAL_MARKET_CONSTITUENT",
    sourceUrl,
    canonicalRowCount: canonical.rows.length,
    totalMarketConstituentCount: officialBySymbol.size,
    resolvedCount: rows.length,
    residualCount: residual.length,
    rows,
    residual,
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, JSON.stringify(result, null, 2) + "\n", "utf8")

  process.stdout.write(`Nifty Total Market constituents loaded: ${officialBySymbol.size}\n`)
  process.stdout.write(`Portfolio equities resolved from official bulk source: ${rows.length}/${canonical.rows.length}\n`)
  process.stdout.write(`Residual targeted-review equities: ${residual.length}\n`)
  if (residual.length) {
    process.stdout.write("\nResidual symbols requiring targeted official verification:\n")
    for (const item of residual) process.stdout.write(`${item.symbol}\n`)
  }
}

main().catch((error) => {
  process.stderr.write(`K1 NSE bulk classification failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
