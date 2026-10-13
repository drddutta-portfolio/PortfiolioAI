import type { QuarterlyMetric, QuarterlyResultSummary, ResultSecurity, ResultsMatrixViewModel, ResultStrength } from "./types"

const periods = [
  { id: "q2-fy27", label: "Q2 FY27", fiscalYear: 2027, quarter: 2, latest: true },
  { id: "q1-fy27", label: "Q1 FY27", fiscalYear: 2027, quarter: 1 },
  { id: "q4-fy26", label: "Q4 FY26", fiscalYear: 2026, quarter: 4 },
  { id: "q3-fy26", label: "Q3 FY26", fiscalYear: 2026, quarter: 3 },
  { id: "q2-fy26", label: "Q2 FY26", fiscalYear: 2026, quarter: 2 },
  { id: "q1-fy26", label: "Q1 FY26", fiscalYear: 2026, quarter: 1 },
] as const

function metrics(revenue: number | null, pat: number | null, eps: number | null, yoy: number | null): readonly QuarterlyMetric[] {
  return [
    { id: "revenue", label: "Revenue", value: revenue, unit: "INR_CRORE", qoqPercent: revenue === null ? null : 1.8, yoyPercent: yoy },
    { id: "pat", label: "PAT", value: pat, unit: "INR_CRORE", qoqPercent: pat === null ? null : 5.4, yoyPercent: pat === null ? null : 5.4 },
    { id: "eps", label: "EPS", value: eps, unit: "INR", qoqPercent: eps === null ? null : 5.3, yoyPercent: eps === null ? null : 5.4 },
  ]
}

function result(
  securityId: string,
  periodId: string,
  primaryMetricLabel: string,
  primaryMetricYoY: number | null,
  strength: ResultStrength,
  revenue: number | null,
  pat: number | null,
  eps: number | null,
  newlyReported = false,
): QuarterlyResultSummary {
  return {
    securityId,
    periodId,
    primaryMetricLabel,
    primaryMetricYoY,
    strength,
    newlyReported,
    available: primaryMetricYoY !== null,
    verificationState: "DEMO",
    metrics: metrics(revenue, pat, eps, primaryMetricYoY),
  }
}

const securityRows = [
  ["hdfcbank", "HDFCBANK", "HDFC Bank", "Private Banks", "CURRENT", [8.1, 6.4, 3.2, 7.6, 6.9, 2.8], "NII"],
  ["tcs", "TCS", "Tata Consultancy Services", "IT Services & Consulting", "CURRENT", [7.2, 5.9, 6.8, 2.9, 5.4, 3.1], "Rev"],
  ["infy", "INFY", "Infosys", "IT Services & Consulting", "CURRENT", [2.1, 3.4, 6.1, 2.5, -1.2, 2.8], "Rev"],
  ["kvb", "KVB", "Karur Vysya Bank", "Private Banks", "CURRENT", [-4.3, 1.2, 1.6, 2.4, 5.7, 4.9], "NII"],
  ["reliance", "RELIANCE", "Reliance Industries", "Diversified Industries", "CURRENT", [6.9, 5.6, 4.8, 2.1, 3.5, 6.2], "Rev"],
  ["auropharma", "AUROPHARMA", "Aurobindo Pharma", "Pharmaceuticals", "CLOSED", [null, 4.6, 9.1, 7.4, 1.8, -2.6], "Rev"],
] as const

function strength(value: number | null): ResultStrength {
  if (value === null) return "UNAVAILABLE"
  if (value >= 4.5) return "STRONG"
  if (value >= 0) return "MIXED"
  return "WEAK"
}

export const resultsDemoModel: ResultsMatrixViewModel = {
  periods,
  collectionStatus: {
    configured: false,
    label: "Demo · scheduler not configured",
    lastScanAt: null,
    newResults: null,
    coverageLabel: "Current + Closed Positions",
  },
  securities: securityRows.map(([id, symbol, name, industry, positionKind, values, metricLabel], rowIndex): ResultSecurity => ({
    id,
    symbol,
    name,
    industry,
    positionKind,
    position: {
      status: positionKind === "CURRENT" ? "OPEN" : "CLOSED",
      quantity: positionKind === "CURRENT" ? 100 + rowIndex * 20 : 0,
      averageCost: positionKind === "CURRENT" ? 3320 + rowIndex * 120 : null,
      currentPrice: positionKind === "CURRENT" ? 3891 + rowIndex * 75 : null,
      currentValue: positionKind === "CURRENT" ? 389100 + rowIndex * 42000 : null,
      pnl: positionKind === "CURRENT" ? 57100 + rowIndex * 5000 : 84200,
      pnlPercent: positionKind === "CURRENT" ? 17.2 - rowIndex : 22.4,
      allocationPercent: positionKind === "CURRENT" ? 4.2 + rowIndex * 0.4 : null,
    },
    results: periods.map((period, periodIndex) => {
      const value = values[periodIndex]
      const available = typeof value === "number" ? value : null
      const baseRevenue = available === null ? null : 63437 - periodIndex * 3200 + rowIndex * 1100
      const basePat = available === null ? null : 13180 - periodIndex * 620 + rowIndex * 340
      const eps = available === null ? null : 31.4 - periodIndex * 1.3 + rowIndex * 0.7
      return result(id, period.id, metricLabel, available, strength(available), baseRevenue, basePat, eps, rowIndex === 5 && periodIndex === 1)
    }),
  })),
}
