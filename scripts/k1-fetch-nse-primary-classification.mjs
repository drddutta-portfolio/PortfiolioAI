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
const delayMs = Number(argValue("--delay-ms") ?? "900")
const maxAttempts = Number(argValue("--max-attempts") ?? "3")

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function parseCookieHeaders(headers) {
  const values = typeof headers.getSetCookie === "function"
    ? headers.getSetCookie()
    : [headers.get("set-cookie")].filter(Boolean)

  return values
    .flatMap((value) => String(value).split(/,(?=[^;,]+=)/gu))
    .map((part) => part.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ")
}

function mergeCookies(...cookieStrings) {
  const byName = new Map()
  for (const cookieString of cookieStrings) {
    for (const part of String(cookieString ?? "").split(";")) {
      const trimmed = part.trim()
      if (!trimmed) continue
      const index = trimmed.indexOf("=")
      if (index <= 0) continue
      byName.set(trimmed.slice(0, index), trimmed.slice(index + 1))
    }
  }
  return [...byName.entries()].map(([name, value]) => `${name}=${value}`).join("; ")
}

function browserHeaders(extra = {}) {
  return {
    "user-agent": UA,
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    ...extra,
  }
}

async function getNseSessionCookie(seedUrl = "https://www.nseindia.com/") {
  const response = await fetch(seedUrl, {
    headers: browserHeaders({
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": seedUrl === "https://www.nseindia.com/" ? "none" : "same-origin",
      "upgrade-insecure-requests": "1",
    }),
    redirect: "follow",
  })
  if (!response.ok) throw new Error(`NSE_SESSION_HTTP_${response.status}`)
  return parseCookieHeaders(response.headers)
}

async function warmQuoteSession(symbol, existingCookie = "") {
  const quotePage = `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(symbol)}`
  const response = await fetch(quotePage, {
    headers: browserHeaders({
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "cookie": existingCookie,
      "referer": "https://www.nseindia.com/",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "upgrade-insecure-requests": "1",
    }),
    redirect: "follow",
  })
  if (!response.ok) throw new Error(`NSE_QUOTE_PAGE_HTTP_${response.status}`)
  return mergeCookies(existingCookie, parseCookieHeaders(response.headers))
}

async function fetchNseQuote(symbol, cookie) {
  const url = `https://www.nseindia.com/api/quote-equity?symbol=${encodeURIComponent(symbol)}`
  const response = await fetch(url, {
    headers: browserHeaders({
      "accept": "application/json,text/plain,*/*",
      "cookie": cookie,
      "referer": `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(symbol)}`,
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
    }),
  })

  if (response.status === 401 || response.status === 403) {
    const error = new Error(`NSE_AUTH_HTTP_${response.status}`)
    error.retryWithFreshCookie = true
    throw error
  }
  if (!response.ok) throw new Error(`NSE_QUOTE_HTTP_${response.status}`)
  return response.json()
}

async function fetchNseQuoteWithRetry(symbol, startingCookie) {
  let cookie = startingCookie
  let lastError = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      if (!cookie) cookie = await getNseSessionCookie()
      cookie = await warmQuoteSession(symbol, cookie)
      await sleep(500)
      const quote = await fetchNseQuote(symbol, cookie)
      return { quote, cookie, attempts: attempt }
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : String(error)
      const retryable =
        error?.retryWithFreshCookie ||
        message.startsWith("NSE_SESSION_HTTP_") ||
        message.startsWith("NSE_QUOTE_PAGE_HTTP_")

      if (!retryable || attempt >= maxAttempts) break

      const backoff = 1200 * attempt
      process.stderr.write(`${symbol}: retry ${attempt}/${maxAttempts} after ${message}; waiting ${backoff}ms\n`)
      await sleep(backoff)
      try {
        cookie = await getNseSessionCookie(
          `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(symbol)}`,
        )
      } catch {
        cookie = ""
      }
    }
  }

  throw lastError ?? new Error("NSE_QUOTE_UNKNOWN_FAILURE")
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
  if (!Number.isFinite(delayMs) || delayMs < 0) throw new Error("INVALID_DELAY_MS")
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 5) throw new Error("INVALID_MAX_ATTEMPTS")

  let cookie = ""
  try {
    cookie = await getNseSessionCookie()
  } catch (error) {
    process.stderr.write(`Initial NSE session warm-up failed: ${error instanceof Error ? error.message : String(error)}; continuing per symbol.\n`)
  }

  const rows = []
  const failures = []

  for (let i = 0; i < symbols.length; i += 1) {
    const symbol = symbols[i]
    try {
      const fetched = await fetchNseQuoteWithRetry(symbol, cookie)
      cookie = fetched.cookie
      const normalized = normalizeQuote(symbol, fetched.quote)
      rows.push(normalized)
      process.stdout.write(
        `[${i + 1}/${symbols.length}] ${symbol}: ${normalized.sector ?? "MISSING"} / ${normalized.industry ?? "MISSING"} / ${normalized.basicIndustry ?? "MISSING"} (attempts=${fetched.attempts})\n`,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failures.push({
        exchange: "NSE",
        symbol,
        error: message,
      })
      process.stderr.write(`[${i + 1}/${symbols.length}] ${symbol}: FAILED (${message})\n`)
      cookie = ""
    }
    if (i + 1 < symbols.length) await sleep(delayMs)
  }

  const output = {
    contract: "PORTFOLIOAI_K1_NSE_PRIMARY_CLASSIFICATION_SNAPSHOT_V2",
    source: "NSE_OFFICIAL_QUOTE_EQUITY_INDUSTRY_INFO",
    sourceEndpoint: "https://www.nseindia.com/api/quote-equity?symbol={SYMBOL}",
    sessionStrategy: "QUOTE_PAGE_WARMUP_RETRY_V2",
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
