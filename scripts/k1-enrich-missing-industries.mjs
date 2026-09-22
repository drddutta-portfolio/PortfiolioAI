#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"

const DEFAULT_INVENTORY = "artifacts/k1-final-reconciled-sector-inventory.json"
const DEFAULT_CAPTURE = "artifacts/k1-public-industry-enrichment.json"
const DEFAULT_ENRICHED = "artifacts/k1-final-reconciled-research-classification-inventory.json"

function argValue(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : null
}

const inventoryPath = argValue("--inventory") ?? DEFAULT_INVENTORY
const capturePath = argValue("--capture") ?? DEFAULT_CAPTURE
const enrichedPath = argValue("--output") ?? DEFAULT_ENRICHED
const delayMs = Number(argValue("--delay-ms") ?? "850")

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const clean = (value) => typeof value === "string" && value.trim() ? value.trim() : null

function decodeHtml(value) {
  return value
    .replace(/&amp;/giu, "&")
    .replace(/&nbsp;/giu, " ")
    .replace(/&#39;/giu, "'")
    .replace(/&quot;/giu, '"')
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]+>/gu, " ").replace(/\s+/gu, " ").trim())
}

function normalize(value) {
  return clean(value)?.toUpperCase().replace(/[^A-Z0-9]+/gu, "_").replace(/^_+|_+$/gu, "") ?? ""
}

async function fetchHtml(url, attempt = 1) {
  const response = await fetch(url, {
    headers: {
      "accept": "text/html,application/xhtml+xml",
      "accept-language": "en-US,en;q=0.9",
      "user-agent": "Mozilla/5.0 PortfolioAI-K1-Industry-Readiness/1.0",
    },
    redirect: "follow",
  })

  if (response.status === 429 && attempt < 4) {
    await sleep(4000 * attempt)
    return fetchHtml(url, attempt + 1)
  }
  if (!response.ok) throw new Error(`HTTP_${response.status}`)
  return response.text()
}

function parseClassification(html, symbol) {
  const plain = stripTags(html)
  const identityPattern = new RegExp(`NSE:\\s*${symbol.replace(/[.*+?^$()|[\]\\]/gu, "\\$&")}\\b`, "iu")
  if (!identityPattern.test(plain)) throw new Error("SCREENER_IDENTITY_MISMATCH")

  const marker = html.search(/Peer\s+comparison/iu)
  const window = marker >= 0 ? html.slice(marker, marker + 18000) : html
  const matches = [...window.matchAll(/<a\b[^>]*href=["']([^"']*\/market\/[^"']*)["'][^>]*>([\s\S]*?)<\/a>/giu)]

  const labels = []
  for (const match of matches) {
    const label = stripTags(match[2] ?? "")
    if (!label) continue
    if (!labels.some((item) => item.label === label)) {
      labels.push({ label, href: match[1] ?? null })
    }
    if (labels.length >= 4) break
  }

  if (labels.length < 3) throw new Error("SCREENER_CLASSIFICATION_PATH_MISSING")

  return {
    macroEconomicSector: labels[0]?.label ?? null,
    sector: labels[1]?.label ?? null,
    industry: labels[2]?.label ?? null,
    basicIndustry: labels[3]?.label ?? null,
    classificationPath: labels.map((item) => item.label),
  }
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"))
  } catch {
    return null
  }
}

async function saveCapture(state) {
  await fs.mkdir(path.dirname(capturePath), { recursive: true })
  await fs.writeFile(capturePath, JSON.stringify(state, null, 2) + "\n", "utf8")
}

async function main() {
  const inventory = JSON.parse(await fs.readFile(inventoryPath, "utf8"))
  if (!Array.isArray(inventory.rows) || !inventory.rows.length) throw new Error("FINAL_INVENTORY_ROWS_MISSING")

  const missingRows = inventory.rows.filter((row) => !clean(row.finalIndustry))
  if (!missingRows.length) {
    process.stdout.write("K1 industry enrichment not needed: no missing industries.\n")
    return
  }

  const previous = await readJsonIfExists(capturePath)
  const previousRows = Array.isArray(previous?.rows) ? previous.rows : []
  const bySymbol = new Map(previousRows.map((row) => [String(row.symbol).toUpperCase(), row]))
  const failures = new Map((Array.isArray(previous?.failures) ? previous.failures : []).map((row) => [String(row.symbol).toUpperCase(), row]))

  process.stdout.write("K1 PUBLIC INDUSTRY ENRICHMENT\n")
  process.stdout.write(`Missing industry symbols: ${missingRows.length}\n`)
  process.stdout.write("Source: Screener public company pages\n")
  process.stdout.write("Sector overwrite: DISABLED\n")
  process.stdout.write("Production writes: 0\n\n")

  let index = 0
  for (const row of missingRows) {
    index += 1
    const symbol = String(row.symbol).trim().toUpperCase()
    if (bySymbol.has(symbol)) {
      process.stdout.write(`[${index}/${missingRows.length}] ${symbol}: cached\n`)
      continue
    }

    const sourceUrl = `https://www.screener.in/company/${encodeURIComponent(symbol)}/`
    try {
      const html = await fetchHtml(sourceUrl)
      const parsed = parseClassification(html, symbol)
      const captured = {
        symbol,
        sourceUrl,
        sourceKind: "SCREENER_PUBLIC_CLASSIFICATION",
        capturedAt: new Date().toISOString(),
        existingSector: clean(row.finalSector),
        sourceMacroEconomicSector: parsed.macroEconomicSector,
        sourceSector: parsed.sector,
        industry: parsed.industry,
        basicIndustry: parsed.basicIndustry,
        classificationPath: parsed.classificationPath,
        sectorComparison: normalize(row.finalSector) === normalize(parsed.sector) ? "AGREE" : "DIFF",
      }
      bySymbol.set(symbol, captured)
      failures.delete(symbol)
      process.stdout.write(`[${index}/${missingRows.length}] ${symbol}: ${parsed.industry} / ${parsed.basicIndustry ?? "-"}\n`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failures.set(symbol, { symbol, sourceUrl, error: message })
      process.stderr.write(`[${index}/${missingRows.length}] ${symbol}: FAILED (${message})\n`)
    }

    await saveCapture({
      contract: "PORTFOLIOAI_K1_PUBLIC_INDUSTRY_ENRICHMENT_V1",
      source: "SCREENER_PUBLIC_COMPANY_PAGE",
      generatedAt: new Date().toISOString(),
      requestedCount: missingRows.length,
      resolvedCount: bySymbol.size,
      failureCount: failures.size,
      rows: [...bySymbol.values()].sort((a, b) => a.symbol.localeCompare(b.symbol)),
      failures: [...failures.values()].sort((a, b) => a.symbol.localeCompare(b.symbol)),
    })

    if (index < missingRows.length) await sleep(delayMs)
  }

  const capture = {
    contract: "PORTFOLIOAI_K1_PUBLIC_INDUSTRY_ENRICHMENT_V1",
    source: "SCREENER_PUBLIC_COMPANY_PAGE",
    generatedAt: new Date().toISOString(),
    requestedCount: missingRows.length,
    resolvedCount: bySymbol.size,
    failureCount: failures.size,
    rows: [...bySymbol.values()].sort((a, b) => a.symbol.localeCompare(b.symbol)),
    failures: [...failures.values()].sort((a, b) => a.symbol.localeCompare(b.symbol)),
    productionWrites: 0,
  }
  await saveCapture(capture)

  const enrichedRows = inventory.rows.map((row) => {
    const symbol = String(row.symbol).trim().toUpperCase()
    const enrichment = bySymbol.get(symbol)
    if (!enrichment) {
      return {
        ...row,
        industrySource: clean(row.finalIndustry) ? (row.referenceSource ?? null) : null,
        basicIndustrySource: clean(row.finalBasicIndustry) ? (row.referenceSource ?? null) : null,
      }
    }

    return {
      ...row,
      finalIndustry: clean(row.finalIndustry) ?? clean(enrichment.industry),
      finalBasicIndustry: clean(row.finalBasicIndustry) ?? clean(enrichment.basicIndustry),
      industrySource: clean(row.finalIndustry) ? (row.referenceSource ?? null) : enrichment.sourceKind,
      basicIndustrySource: clean(row.finalBasicIndustry) ? (row.referenceSource ?? null) : enrichment.sourceKind,
      industryEvidenceUrl: enrichment.sourceUrl,
      sourceClassificationPath: enrichment.classificationPath,
      sourceSectorComparison: enrichment.sectorComparison,
    }
  })

  const industryPresentCount = enrichedRows.filter((row) => clean(row.finalIndustry)).length
  const basicIndustryPresentCount = enrichedRows.filter((row) => clean(row.finalBasicIndustry)).length

  const enriched = {
    ...inventory,
    contract: "PORTFOLIOAI_K1_FINAL_RECONCILED_RESEARCH_CLASSIFICATION_INVENTORY_V1",
    generatedAt: new Date().toISOString(),
    industryEnrichmentContract: capture.contract,
    industryPresentCount,
    industryMissingCount: enrichedRows.length - industryPresentCount,
    basicIndustryPresentCount,
    rows: enrichedRows,
  }

  await fs.mkdir(path.dirname(enrichedPath), { recursive: true })
  await fs.writeFile(enrichedPath, JSON.stringify(enriched, null, 2) + "\n", "utf8")

  process.stdout.write("\nK1 INDUSTRY ENRICHMENT RESULT\n")
  process.stdout.write(`Resolved from public source: ${capture.resolvedCount}/${capture.requestedCount}\n`)
  process.stdout.write(`Failures: ${capture.failureCount}\n`)
  process.stdout.write(`Industry present after merge: ${industryPresentCount}/${enrichedRows.length}\n`)
  process.stdout.write(`Basic industry present after merge: ${basicIndustryPresentCount}/${enrichedRows.length}\n`)
  process.stdout.write(`Capture: ${capturePath}\n`)
  process.stdout.write(`Enriched inventory: ${enrichedPath}\n`)
  process.stdout.write("No canonical sector was overwritten.\n")
  process.stdout.write("No production database write was performed.\n")
}

main().catch((error) => {
  process.stderr.write(`K1 public industry enrichment failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
