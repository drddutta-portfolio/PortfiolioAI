import test from "node:test"
import assert from "node:assert/strict"
import { reconcileNseClassification } from "./k1-compare-nse-classification.mjs"

function canonical(overrides = {}) {
  return {
    contract: "CANONICAL",
    rows: [{
      symbol: "TEST",
      securityId: "security-1",
      isin: "INE000000001",
      sector: "Banking",
      industry: "Banks",
      enrichmentState: "AVAILABLE",
      sectorSource: "STOCK_MASTER",
      industrySource: "TRENDLYNE_MCP",
      ...overrides,
    }],
  }
}

function official(overrides = {}) {
  return {
    contract: "OFFICIAL",
    rows: [{
      symbol: "TEST",
      isin: "INE000000001",
      companyName: "Test Limited",
      sector: "Banking",
      industry: "Banks",
      basicIndustry: "Private Sector Bank",
      macroEconomicSector: "Financial Services",
      sourceUrl: "https://www.nseindia.com/",
      retrievedAt: "2026-09-22T00:00:00Z",
      ...overrides,
    }],
  }
}

test("reports exact canonical / NSE agreement", () => {
  const result = reconcileNseClassification(canonical(), official())
  assert.equal(result.counts.AGREE, 1)
  assert.equal(result.freezeEligible, true)
})

test("reports a missing canonical sector as change required", () => {
  const result = reconcileNseClassification(canonical({ sector: null, industry: null }), official())
  assert.equal(result.counts.CHANGE_REQUIRED, 1)
  assert.equal(result.rows[0].reasonCode, "CANONICAL_PRIMARY_SECTOR_MISSING")
})

test("reports missing canonical industry as detail missing", () => {
  const result = reconcileNseClassification(canonical({ industry: null }), official())
  assert.equal(result.counts.DETAIL_MISSING, 1)
  assert.equal(result.freezeEligible, true)
})

test("reports sector differences as change required", () => {
  const result = reconcileNseClassification(canonical(), official({ sector: "Financial Services", industry: "Finance" }))
  assert.equal(result.counts.CHANGE_REQUIRED, 1)
  assert.equal(result.rows[0].reasonCode, "CANONICAL_PRIMARY_SECTOR_DIFFERS_FROM_NSE")
})

test("reports ISIN disagreement as review required", () => {
  const result = reconcileNseClassification(canonical(), official({ isin: "INE999999999" }))
  assert.equal(result.counts.REVIEW_REQUIRED, 1)
  assert.equal(result.freezeEligible, false)
})

test("reports absent official rows as official missing", () => {
  const result = reconcileNseClassification(canonical(), { contract: "OFFICIAL", rows: [] })
  assert.equal(result.counts.OFFICIAL_MISSING, 1)
  assert.equal(result.freezeEligible, false)
})

test("does not silently accept an official symbol outside the canonical cohort", () => {
  const result = reconcileNseClassification(canonical(), {
    contract: "OFFICIAL",
    rows: [
      official().rows[0],
      { ...official().rows[0], symbol: "EXTRA", isin: "INE000000002" },
    ],
  })
  assert.equal(result.counts.REVIEW_REQUIRED, 1)
  assert.equal(result.comparisonRowCount, 2)
  assert.equal(result.freezeEligible, false)
})
