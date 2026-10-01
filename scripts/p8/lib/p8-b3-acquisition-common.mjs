import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

export const PROJECT_REF = "lrgpjimipfkyoqbpsqzz"
export const ACTION = "P8_B3_FULL_SOURCE_ACQUISITION_V1"
export const CAMPAIGN_ID = "P8_B3_FULL_SOURCE_ACQUISITION_20261001_V1"
export const PLAN_HASH = "9367d9a55b5c7a6db176ef3e2b80da96cb97b3ac114f0ef884f124352a54919a"
export const START = "2023-10-01"
export const END = "2026-09-30"
export const UDIFF_CUTOVER = "2024-07-08"
export const ROOT = process.env.P8_B3_ACQUISITION_OUT || "tmp/p8-b3/full-source-acquisition"
export const FUNCTION_URL = process.env.P8_B3_ACQUISITION_URL ||
  "https://" + PROJECT_REF + ".supabase.co/functions/v1/p8-b3-acquire-market-history"
export const GRANT_ID = String(process.env.P8_B3_SOURCE_ACQUISITION_GRANT || "").trim()
export const PROGRESS_PATH = join(ROOT, "progress.json")
export const FINAL_MANIFEST_PATH = join(ROOT, "P8_B3_FULL_SOURCE_ACQUISITION_MANIFEST.json")
export const CACHE = {
  tri: join(ROOT, "tri"),
  actions: join(ROOT, "actions"),
  prices: join(ROOT, "prices"),
}
export const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"

for (const dir of Object.values(CACHE)) mkdirSync(dir, { recursive: true })
mkdirSync(ROOT, { recursive: true })

export function clean(value) { return String(value ?? "").trim() }

export function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]"
  return "{" + Object.keys(value).sort()
    .map((key) => JSON.stringify(key) + ":" + canonical(value[key])).join(",") + "}"
}

export function sha256(value) {
  return createHash("sha256")
    .update(typeof value === "string" || Buffer.isBuffer(value) ? value : canonical(value))
    .digest("hex")
}

export function assert(condition, message) {
  if (!condition) throw new Error(message)
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function chunks(rows, size) {
  const out = []
  for (let index = 0; index < rows.length; index += size) {
    out.push(rows.slice(index, index + size))
  }
  return out
}

export function ymd(date) { return date.toISOString().slice(0, 10) }
export function parseYmd(value) { return new Date(value + "T00:00:00Z") }

export function formatNseDate(value) {
  const parts = value.split("-")
  return parts[2] + "-" + parts[1] + "-" + parts[0]
}

export function monthWindows(start = START, end = END) {
  const rows = []
  let cursor = new Date(start + "T00:00:00Z")
  const final = new Date(end + "T00:00:00Z")
  while (cursor <= final) {
    const first = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1))
    const last = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0))
    const periodStart = first < parseYmd(start) ? parseYmd(start) : first
    const periodEnd = last > final ? final : last
    rows.push({
      key: ymd(first).slice(0, 7),
      start: ymd(periodStart),
      end: ymd(periodEnd),
    })
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1))
  }
  return rows
}

export const MONTHS = monthWindows()
assert(MONTHS.length === 36, "Expected exactly 36 frozen calendar months")

export function loadProgress() {
  if (!existsSync(PROGRESS_PATH)) {
    return {
      version: "P8_B3_FULL_SOURCE_ACQUISITION_PROGRESS_V1",
      campaign_id: CAMPAIGN_ID,
      plan_hash: PLAN_HASH,
      completed_tri_months: [],
      completed_action_months: [],
      completed_price_dates: [],
      metrics: {
        price_rows_resolved: 0,
        price_rows_unknown_isin: 0,
        action_rows_submitted: 0,
        action_resolved: 0,
        action_ambiguous: 0,
        action_unresolved: 0,
      },
    }
  }

  const progress = JSON.parse(readFileSync(PROGRESS_PATH, "utf8"))
  if (progress.campaign_id !== CAMPAIGN_ID || progress.plan_hash !== PLAN_HASH) {
    throw new Error("Local progress belongs to another B3 campaign/plan")
  }
  return progress
}

export function saveProgress(progress) {
  writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2) + "\n")
}

export async function post(operation, extra = {}) {
  const body = JSON.stringify({
    action: ACTION,
    campaignId: CAMPAIGN_ID,
    planHash: PLAN_HASH,
    grantId: GRANT_ID,
    operation,
    ...extra,
  })

  let lastError
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      })
      const payload = await response.json().catch(() => ({ error: "NON_JSON_RESPONSE" }))
      if (response.ok) return payload
      const message = operation + " HTTP " + response.status + ": " + JSON.stringify(payload)
      if (response.status < 500 && response.status !== 429) throw new Error(message)
      lastError = new Error(message)
    } catch (error) {
      lastError = error
    }

    if (attempt < 5) {
      const delay = Math.min(15000, 1000 * 2 ** (attempt - 1))
      console.log("  retry " + operation + " attempt " + (attempt + 1) + "/5 after " + delay + "ms")
      await sleep(delay)
    }
  }
  throw lastError || new Error(operation + " failed")
}

export async function fetchWithRetry(url, options = {}, attempts = 5) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 45000)
      const response = await fetch(url, {
        redirect: "follow",
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timer)
      if (response.ok) return response
      const body = await response.text().catch(() => "")
      throw new Error("HTTP " + response.status + " for " + url + ": " + body.slice(0, 160))
    } catch (error) {
      lastError = error
      if (attempt < attempts) {
        const delay = Math.min(15000, 1000 * 2 ** (attempt - 1))
        console.log("  network retry " + (attempt + 1) + "/" + attempts + " after " + delay + "ms")
        await sleep(delay)
      }
    }
  }
  throw lastError || new Error("request failed: " + url)
}

export function normalizeDate(value) {
  const raw = clean(value)
  if (!raw) return null
  if (/^\d{4}-\d{2}-\d{2}$/u.test(raw)) return raw

  const months = {
    JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
    JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
  }
  const named = raw.toUpperCase().match(/^(\d{1,2})[-\/ ]([A-Z]{3})[-\/ ](\d{4})$/u)
  if (named) {
    const dd = named[1]
    const mon = named[2]
    const yyyy = named[3]
    if (!months[mon]) throw new Error("Unknown month in date: " + raw)
    return yyyy + "-" + months[mon] + "-" + dd.padStart(2, "0")
  }
  const numeric = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/u)
  if (numeric) {
    return numeric[3] + "-" + numeric[2].padStart(2, "0") + "-" + numeric[1].padStart(2, "0")
  }
  throw new Error("Unsupported date format: " + raw)
}

const OPTIONAL_DATE_PLACEHOLDERS = new Set([
  "-", "--", "NA", "N/A", "N.A.", "NOT AVAILABLE", "NOT APPLICABLE", "NULL",
])

export function optionalDate(value) {
  const raw = clean(value)
  if (!raw) return null
  if (OPTIONAL_DATE_PLACEHOLDERS.has(raw.toUpperCase())) return null
  return normalizeDate(raw)
}

export function canonicalDecimal(value, label, options = {}) {
  const nullable = options.nullable !== false
  const text = clean(value).replaceAll(",", "")
  if (!text) {
    if (nullable) return null
    throw new Error(label + " is required")
  }
  if (!/^-?\d+(?:\.\d+)?$/u.test(text)) {
    throw new Error(label + " is not a decimal: " + text)
  }
  const number = Number(text)
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(label + " must be finite and non-negative")
  }
  return text
}

export function canonicalPositiveDecimal(value, label) {
  const text = canonicalDecimal(value, label, { nullable: false })
  if (Number(text) <= 0) throw new Error(label + " must be > 0")
  return text
}

export function firstDefined(row, keys) {
  for (const key of keys) {
    const value = row?.[key]
    if (value !== undefined && value !== null && clean(value) !== "") return value
  }
  return null
}

function archiveHash(archive) {
  return sha256({
    campaign_id: CAMPAIGN_ID,
    plan_hash: PLAN_HASH,
    source_kind: archive.source_kind,
    source_period_start: archive.source_period_start,
    source_period_end: archive.source_period_end,
    source_url: archive.source_url,
    content_sha256: archive.content_sha256,
    compressed_sha256: archive.compressed_sha256,
    source_contract_version: archive.source_contract_version,
  })
}

export async function uploadArchive(archive) {
  return post("archive", {
    archive: {
      ...archive,
      archive_hash: archiveHash(archive),
      raw_metadata: {
        ...(archive.raw_metadata || {}),
        acquisition_runner: "p8-b3-acquire-full-market-history.mjs",
      },
    },
  })
}
