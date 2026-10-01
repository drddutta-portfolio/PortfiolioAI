#!/usr/bin/env node
import { writeFileSync } from "node:fs"
import {
  ACTION,
  CAMPAIGN_ID,
  END,
  FINAL_MANIFEST_PATH,
  FUNCTION_URL,
  GRANT_ID,
  MONTHS,
  PLAN_HASH,
  START,
  assert,
  loadProgress,
  post,
  saveProgress,
  sha256,
} from "./lib/p8-b3-acquisition-common.mjs"
import {
  acquireActionMonth,
  acquireTriMonth,
  newNseCookie,
} from "./lib/p8-b3-acquisition-tri-actions.mjs"
import {
  acquirePriceDate,
} from "./lib/p8-b3-acquisition-prices.mjs"

if (!/^[0-9a-f-]{36}$/iu.test(GRANT_ID)) {
  throw new Error("P8_B3_SOURCE_ACQUISITION_GRANT is required")
}

const args = new Set(process.argv.slice(2))
const statusOnly = args.has("--status")
const resume = args.has("--resume")
if (!statusOnly && !resume) {
  throw new Error("Use --status or --resume")
}

console.log(JSON.stringify({
  mode: statusOnly ? "STATUS" : "RESUME",
  action: ACTION,
  campaign_id: CAMPAIGN_ID,
  plan_hash: PLAN_HASH,
  frozen_window: [START, END],
  function_url: FUNCTION_URL,
}, null, 2))

const initialStatus = await post("status")
console.log("Initial hosted status:")
console.log(JSON.stringify(initialStatus, null, 2))

if (statusOnly) process.exit(0)
if (initialStatus.consumed) {
  console.log("Campaign already complete; grant is consumed.")
  process.exit(0)
}

const progress = loadProgress()
const tradingDates = new Set()

console.log("\nStage 1/3 - official NIFTY 500 TRI + trading calendar")
for (const month of MONTHS) {
  await acquireTriMonth(month, progress, tradingDates)
}

const sortedTradingDates = [...tradingDates].sort()
assert(
  sortedTradingDates.length >= 600 && sortedTradingDates.length <= 800,
  "Unexpected frozen-window NIFTY 500 trading-date count: " +
    sortedTradingDates.length,
)
assert(
  sortedTradingDates[0] >= START &&
  sortedTradingDates.at(-1) <= END,
  "Trading-calendar range escaped frozen window",
)

console.log(
  "Trading calendar proven: " + sortedTradingDates.length + " dates (" +
    sortedTradingDates[0] + " through " +
    sortedTradingDates.at(-1) + ")",
)

console.log("\nStage 2/3 - official NSE corporate actions")
let cookie = await newNseCookie()
for (const month of MONTHS) {
  if (progress.completed_action_months.includes(month.key)) {
    console.log(
      "  actions " + month.key + ": completed slice; skipping replay",
    )
    continue
  }

  try {
    await acquireActionMonth(month, progress, cookie)
  } catch (error) {
    const message = String(error?.message || error)
    if (message.includes("HTTP 401") || message.includes("HTTP 403")) {
      console.log("  refreshing NSE session cookies")
      cookie = await newNseCookie()
      await acquireActionMonth(month, progress, cookie)
    } else {
      throw error
    }
  }
}

console.log("\nStage 3/3 - official NSE raw OHLCV for proven trading dates")
for (let index = 0; index < sortedTradingDates.length; index++) {
  const date = sortedTradingDates[index]

  if (progress.completed_price_dates.includes(date)) {
    if ((index + 1) % 50 === 0) {
      console.log(
        "  price progress " + (index + 1) + "/" +
        sortedTradingDates.length + " (completed cached slice)",
      )
    }
    continue
  }

  await acquirePriceDate(date, progress)

  if (
    (index + 1) % 25 === 0 ||
    index + 1 === sortedTradingDates.length
  ) {
    console.log(
      "  price progress " + (index + 1) + "/" +
      sortedTradingDates.length,
    )
  }
}

saveProgress(progress)

const finalStatus = await post("status")
console.log("\nHosted status before completion:")
console.log(JSON.stringify(finalStatus, null, 2))

const counts = finalStatus.counts || {}
const summary = {
  version: "P8_B3_FULL_SOURCE_ACQUISITION_MANIFEST_V1",
  campaign_id: CAMPAIGN_ID,
  plan_hash: PLAN_HASH,
  frozen_window: [START, END],
  proven_trading_dates: sortedTradingDates.length,
  benchmark_archives: 36,
  action_archives: 36,
  price_archives: sortedTradingDates.length,
  source_archives: Number(
    counts.p8_b3_source_archives || 0,
  ),
  raw_price_rows: Number(
    counts.p8_b3_raw_market_price_observations || 0,
  ),
  corporate_action_rows: Number(
    counts.p8_b3_corporate_action_observations || 0,
  ),
  benchmark_rows: Number(
    counts.p8_b3_benchmark_total_return_history || 0,
  ),
  local_metrics: progress.metrics,
  completed_tri_months: progress.completed_tri_months.length,
  completed_action_months: progress.completed_action_months.length,
  completed_price_dates: progress.completed_price_dates.length,
}

writeFileSync(
  FINAL_MANIFEST_PATH,
  JSON.stringify({
    ...summary,
    manifest_hash: sha256(summary),
  }, null, 2) + "\n",
)

const completed = await post("complete_campaign", { summary })
console.log("\nCampaign completion:")
console.log(JSON.stringify(completed, null, 2))
console.log("\nP8_B3_FULL_SOURCE_ACQUISITION_COMPLETE")
console.log("Manifest: " + FINAL_MANIFEST_PATH)
