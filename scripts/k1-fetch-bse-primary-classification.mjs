#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"

const DEFAULT_INPUT = "artifacts/k1-nse-residual-symbols.txt"
const DEFAULT_OUTPUT = "artifacts/k1-bse-primary-classification.json"
const SEARCH_ENDPOINT = "https://api.bseindia.com/BseIndiaAPI/api/PeerSmartSearch/w"
const HEADER_ENDPOINT = "https://api.bseindia.com/BseIndiaAPI/api/ComHeadernew/w"

function argValue(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : null
}

const inputPath = argValue("--input") ?? DEFAULT_INPUT
const outputPath = argValue("--output") ?? DEFAULT_OUTPUT
const delayMs = Number(argValue("--delay-ms") ?? "450")

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const clean = (value) => typeof value === "string" && value.trim() ? value.trim() : null
const norm = (value) => typeof value === "string" ? value.trim().toUpperCase() : ""

function browserHeaders(referer = "https://www.bseindia.com/") {
  return {
    "accept": "application/json,text/plain,*/*",
    "accept-language": "en-US,en;q=0.9",
    "user-agent": "Mozilla/5.0 PortfolioAI-K1-BSE-Classification",
    "referer": referer,
    "origin": "https://www.bseindia.com",
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: browserHeaders(),
    redirect: "follow",
  })
  if (!response.ok) throw new Error(`BSE_HTTP_${response.status}`)
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error("BSE_JSON_PARSE_FAILED")
  }
}

function flattenObjects(value, out = []) {
  if (Array.isArray(value)) {
    for (const item of value) flattenObjects(item, out)
  } else if (value && typeof value === "object") {
    out.push(value)
    for (const child of Object.values(value)) flattenObjects(child, out)
  }
  return out
}

function firstValue(object, keys) {
  for (const key of keys) {
    const value = object?.[key]
    if (typeof value === "string" || typeof value === "number") {
      const text = String(value).trim()
      if (text) return text
    }
  }
  return null
}

function chooseSearchCandidate(payload, symbol) {
  const objects = flattenObjects(payload)
  const candidates = objects.map((item) => ({
    securityId: firstValue(item, ["ScripID", "SCRIP_ID", "SecurityId", "SecurityID", "securityId", "symbol", "Symbol"]),
    securityCode: firstValue(item, ["ScripCd", "ScripCode", "SCRIP_CD", "SecurityCode", "securityCode", "code", "Code"]),
    companyName: firstValue(item, ["ScripName", "CompanyName", "companyName", "name", "Name"]),
    isin: firstValue(item, ["ISIN", "Isin", "isin"]),
  })).filter((item) => item.securityCode)

  const exact = candidates.filter((item) => norm(item.securityId) === symbol)
  if (exact.length === 1) return exact[0]

  const symbolContained = candidates.filter((item) => norm(item.securityId).includes(symbol) || norm(item.companyName).includes(symbol))
  if (symbolContained.length === 1) return symbolContained[0]

  if (candidates.length === 1) return candidates[0]
  throw new Error(exact.length > 1 || symbolContained.length > 1 ? "BSE_SEARCH_AMBIGUOUS" : "BSE_SEARCH_NO_MATCH")
}

function parseHeader(payload, expectedSymbol, expectedCode) {
  const objects = flattenObjects(payload)
  for (const item of objects) {
    const securityCode = firstValue(item, ["SecurityCode", "ScripCode", "ScripCd", "securityCode"])
    const securityId = firstValue(item, ["SecurityId", "SecurityID", "ScripID", "SCRIP_ID", "securityId"])
    const industry = firstValue(item, ["Industry", "industry", "IndustryName", "industryName"])
    const isin = firstValue(item, ["ISIN", "Isin", "isin"])
    const companyName = firstValue(item, ["FullN", "CompanyName", "companyName", "Cmpname", "ScripName", "name"])

    if (!industry) continue
    if (securityCode && String(securityCode) !== String(expectedCode)) continue
    if (securityId && norm(securityId) !== expectedSymbol) {
      const aliasLike = norm(securityId).replace(/[^A-Z0-9]/gu, "")
      const expectedLike = expectedSymbol.replace(/[^A-Z0-9]/gu, "")
      if (aliasLike !== expectedLike) continue
    }

    return {
      exchange: "BSE",
      symbol: expectedSymbol,
      bseSecurityId: securityId,
      bseSecurityCode: securityCode ?? String(expectedCode),
      isin,
      companyName,
      sector: industry,
      industry: null,
      basicIndustry: null,
      macroEconomicSector: null,
      sourceKind: "BSE_OFFICIAL_QUOTE_HEADER",
      classificationAuthority: "OFFICIAL_EXCHANGE_FALLBACK",
      sourceUrl: `https://m.bseindia.com/StockReach.aspx?scripcd=${encodeURIComponent(String(expectedCode))}`,
      retrievedAt: new Date().toISOString(),
    }
  }
  throw new Error("BSE_HEADER_INDUSTRY_MISSING")
}

async function resolveSymbol(symbol) {
  const searchUrl = new URL(SEARCH_ENDPOINT)
  searchUrl.searchParams.set("Type", "SS")
  searchUrl.searchParams.set("text", symbol)
  searchUrl.searchParams.set("flag", "1")
  const searchPayload = await fetchJson(searchUrl)
  const candidate = chooseSearchCandidate(searchPayload, symbol)

  const headerUrl = new URL(HEADER_ENDPOINT)
  headerUrl.searchParams.set("quotetype", "EQ")
  headerUrl.searchParams.set("scripcode", String(candidate.securityCode))
  headerUrl.searchParams.set("seriesid", "")
  const headerPayload = await fetchJson(headerUrl)

  const row = parseHeader(headerPayload, symbol, candidate.securityCode)
  return {
    ...row,
    isin: row.isin ?? candidate.isin ?? null,
    companyName: row.companyName ?? candidate.companyName ?? null,
  }
}

async function main() {
  const raw = await fs.readFile(inputPath, "utf8")
  const symbols = [...new Set(raw.split(/\r?\n/u).map((v) => norm(v)).filter(Boolean))]
  if (!symbols.length) throw new Error("NO_SYMBOLS")
  if (!Number.isFinite(delayMs) || delayMs < 0) throw new Error("INVALID_DELAY_MS")

  const rows = []
  const failures = []

  for (let index = 0; index < symbols.length; index += 1) {
    const symbol = symbols[index]
    try {
      const row = await resolveSymbol(symbol)
      rows.push(row)
      process.stdout.write(`[${index + 1}/${symbols.length}] ${symbol}: ${row.sector} (BSE ${row.bseSecurityCode})\n`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failures.push({ symbol, error: message })
      process.stderr.write(`[${index + 1}/${symbols.length}] ${symbol}: FAILED (${message})\n`)
    }
    if (index + 1 < symbols.length) await sleep(delayMs)
  }

  const result = {
    contract: "PORTFOLIOAI_K1_BSE_PRIMARY_CLASSIFICATION_FALLBACK_V1",
    source: "BSE_OFFICIAL_QUOTE_HEADER",
    generatedAt: new Date().toISOString(),
    requestedCount: symbols.length,
    resolvedCount: rows.length,
    failureCount: failures.length,
    rows,
    failures,
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, JSON.stringify(result, null, 2) + "\n", "utf8")

  process.stdout.write(`K1 BSE fallback: requested=${symbols.length} resolved=${rows.length} failures=${failures.length}\n`)
  process.stdout.write(`Output: ${outputPath}\n`)
  if (failures.length) process.exitCode = 2
}

main().catch((error) => {
  process.stderr.write(`K1 BSE fallback failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
