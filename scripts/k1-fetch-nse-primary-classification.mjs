#!/usr/bin/env node
import fs from "node:fs/promises"

const DEFAULT_INPUT = "scripts/k1-current-nse-equities-2026-09-22.txt"
const DEFAULT_OUTPUT = "artifacts/k1-nse-primary-classification.json"

function argValue(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : null
}

const inputPath = argValue("--input") ?? DEFAULT_INPUT
const outputPath = argValue("--output") ?? DEFAULT_OUTPUT
const delayMs = Number(argValue("--delay-ms") ?? "350")

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function parseCookieHeader(setCookie) {
  if (!setCookie) return ""
  return setCookie
    .split(/,(?=[^;,]+=)/g)
    .map((part) => part.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ")
}

async function getNseSessionCookie() {
  const response = await fetch("https://www.nseindia.com/", {
    headers: {
      "user-agent": UA,
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  })
  if (!response.ok) throw new Error(`NSE_SESSION_HTTP_${response.status}`)
  return parseCookieHeader(response.headers.get("set-cookie"))
}

async function fetchNseQuote(symbol, cookie) {
  const url = `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(symbol)}`
  const response = await fetch(url, {
    headers: {
      "user-agent": UA,
      "accept": "application/json,text/plain,*/*",
      "accept-language": "en-US,en;q=0.9",
      "referer": `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(symbol)}`,
      "cookie": cookie,
    },
  })

  if (response.status === 401 || response.status === 403) {
    const error = new Error(`NSE_AUTH_HTTP_${response.status}`)
    error.retryWithFreshCookie = true
    throw error
  }
  if (!response.ok) throw new Error(`NSE_QUOTE_HTTP_${response.status}`)
  return response.json()
}

function normalizeQuote(symbol, quote) {
  const industry = quote?.industryInfo ?? {}
  const info = quote?.info ?? {}
  return {
    exchange: "NSE",
    symbol,
    isin: typeof info.isin === "string" ? info.isin : null,
    companyName: typeof info.companyName === "string" ? info.companyName : null,
    isEtf: Boolean(info.isETFSec),
    macroEconomicSector: typeof industry.macro === "string" ? industry.macro : null,
    sector: typeof industry.sector === "string" ? industry.sector : null,
    industry: typeof industry.industry === "string" ? industry.industry : null,
    basicIndustry: typeof industry.basicIndustry === "string" ? industry.basicIndustry : null,
    sourceUrl: `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(symbol)}`,
    retrievedAt: new Date().toISOString(),
  }
}

async function main() {
  const raw = await fs.readFile(inputPath, "utf8")
  const symbols = [...new Set(
    raw.split(/\r?\n/u).map((value) => value.trim()).filter((value) => value && !value.startsWith("#")),
  )]

  if (!symbols.length) throw new Error("NO_SYMBOLS")

  let cookie = await getNseSessionCookie()
  const rows = []
  const failures = []

  for (let i = 0; i < symbols.length; i += 1) {
    const symbol = symbols[i]
    try {
      let quote
      try {
        quote = await fetchNseQuote(symbol, cookie)
      } catch (error) {
        if (!error?.retryWithFreshCookie) throw error
        cookie = await getNseSessionCookie()
        quote = await fetchNseQuote(symbol, cookie)
      }

      const normalized = normalizeQuote(symbol, quote)
      rows.push(normalized)
      process.stdout.write(`[${i + 1}/${symbols.length}] ${symbol}: ${normalized.sector ?? "MISSING"} / ${normalized.industry ?? "MISSING"} / ${normalized.basicIndustry ?? "MISSING"}\n`)
    } catch (error) {
      failures.push({
        exchange: "NSE",
        symbol,
        error: error instanceof Error ? error.message : String(error),
      })
      process.stderr.write(`[${i + 1}/${symbols.length}] ${symbol}: FAILED\n`)
    }
    if (i + 1 < symbols.length) await sleep(delayMs)
  }

  const output = {
    contract: "PORTFOLIOAI_K1_NSE_PRIMARY_CLASSIFICATION_SNAPSHOT_V1",
    source: "NSE_OFFICIAL_QUOTE_EQUITY_INDUSTRY_INFO",
    sourceEndpoint: "https://www.nseindia.com/api/quote-equity?symbol={SYMBOL}",
    generatedAt: new Date().toISOString(),
    inputPath,
    requestedCount: symbols.length,
    resolvedCount: rows.filter((row) => row.sector).length,
    missingSectorCount: rows.filter((row) => !row.sector).length,
    failureCount: failures.length,
    rows,
    failures,
  }

  await fs.mkdir(outputPath.split("/").slice(0, -1).join("/") || ".", { recursive: true })
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2) + "\n", "utf8")

  process.stdout.write(
    `K1 NSE classification snapshot: requested=${symbols.length} resolved=${output.resolvedCount} missing=${output.missingSectorCount} failures=${failures.length}\n`,
  )

  if (failures.length) process.exitCode = 2
}

main().catch((error) => {
  process.stderr.write(`K1 NSE classification fetch failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
