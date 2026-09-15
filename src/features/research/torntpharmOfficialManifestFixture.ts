export type ManifestLineage = "DIRECT_OFFICIAL" | "PORTFOLIOAI_DERIVED"

export interface TorntpharmOfficialManifestRow {
  readonly id: string
  readonly metricCode: string
  readonly periodEnd: string
  readonly value: string
  readonly unit: "INR_CR" | "INR_PER_SHARE" | "PERCENT" | "MULTIPLE"
  readonly lineage: ManifestLineage
}

const rows = (
  prefix: string,
  metricCode: string,
  unit: TorntpharmOfficialManifestRow["unit"],
  lineage: ManifestLineage,
  values: readonly (readonly [string, string])[],
): readonly TorntpharmOfficialManifestRow[] => values.map(([periodEnd, value], index) => ({
  id: `${prefix}${index + 1}`,
  metricCode,
  periodEnd,
  value,
  unit,
  lineage,
}))

/** Exact, non-writing fixture transcribed from the owner-review R4L manifest. */
export const TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE = Object.freeze([
  ...rows("A", "REVENUE_ANNUAL", "INR_CR", "DIRECT_OFFICIAL", [["2025-03-31", "11516.09"], ["2024-03-31", "10728.00"]]),
  ...rows("B", "OPERATING_REVENUE_QUARTER", "INR_CR", "DIRECT_OFFICIAL", [["2026-03-31", "4197"]]),
  ...rows("B", "OPERATING_PROFIT_QUARTER", "INR_CR", "DIRECT_OFFICIAL", [["2025-03-31", "964"], ["2024-12-31", "914"]]).map((row, index) => ({ ...row, id: `B${index + 2}` })),
  ...rows("C", "PAT_ATTRIBUTABLE_ANNUAL", "INR_CR", "DIRECT_OFFICIAL", [["2026-03-31", "2163.37"], ["2025-03-31", "1911.25"], ["2024-03-31", "1656.38"]]),
  ...rows("C", "EPS_DILUTED_ANNUAL", "INR_PER_SHARE", "DIRECT_OFFICIAL", [["2026-03-31", "63.92"], ["2025-03-31", "56.47"], ["2024-03-31", "48.94"]]).map((row, index) => ({ ...row, id: `C${index + 4}` })),
  ...rows("D", "CFO_ANNUAL", "INR_CR", "DIRECT_OFFICIAL", [["2026-03-31", "3022.71"]]),
  ...rows("D", "CAPEX_ANNUAL", "INR_CR", "DIRECT_OFFICIAL", [["2026-03-31", "677.39"], ["2025-03-31", "611.87"], ["2024-03-31", "432.78"]]).map((row, index) => ({ ...row, id: `D${index + 2}` })),
  ...rows("D", "FREE_CASH_FLOW_ANNUAL", "INR_CR", "PORTFOLIOAI_DERIVED", [["2026-03-31", "2345.32"], ["2025-03-31", "1973.24"], ["2024-03-31", "2833.30"]]).map((row, index) => ({ ...row, id: `D${index + 5}` })),
  ...rows("E", "ROCE_MANAGEMENT_ANNUAL", "PERCENT", "DIRECT_OFFICIAL", [["2026-03-31", "26"], ["2025-03-31", "31"], ["2024-03-31", "28"]]),
  ...rows("F", "NET_DEBT_EBITDA_ANNUAL", "MULTIPLE", "DIRECT_OFFICIAL", [["2026-03-31", "2.3"], ["2025-03-31", "0.6"], ["2024-03-31", "0.9"]]),
  ...rows("F", "INTEREST_COVERAGE_ANNUAL", "MULTIPLE", "DIRECT_OFFICIAL", [["2026-03-31", "9.26"], ["2025-03-31", "12.43"], ["2024-03-31", "8.40"]]).map((row, index) => ({ ...row, id: `F${index + 4}` })),
  ...rows("F", "TOTAL_DEBT_ANNUAL", "INR_CR", "PORTFOLIOAI_DERIVED", [["2026-03-31", "14798.24"], ["2025-03-31", "3026.09"], ["2024-03-31", "3937.42"]]).map((row, index) => ({ ...row, id: `F${index + 7}` })),
  ...rows("F", "CASH_EQUIVALENTS_ANNUAL", "INR_CR", "DIRECT_OFFICIAL", [["2026-03-31", "1117.20"], ["2025-03-31", "573.48"], ["2024-03-31", "835.14"]]).map((row, index) => ({ ...row, id: `F${index + 10}` })),
  ...rows("F", "EBITDA_ANNUAL", "INR_CR", "DIRECT_OFFICIAL", [["2026-03-31", "4559"], ["2025-03-31", "3721"], ["2024-03-31", "3368"]]).map((row, index) => ({ ...row, id: `F${index + 13}` })),
  ...rows("G", "RND_EXPENSE_ANNUAL", "INR_CR", "DIRECT_OFFICIAL", [["2026-03-31", "650"], ["2025-03-31", "581"], ["2024-03-31", "527"]]),
  ...rows("G", "RND_INTENSITY_PERCENT", "PERCENT", "PORTFOLIOAI_DERIVED", [["2026-03-31", "4.6496"], ["2025-03-31", "5.0451"], ["2024-03-31", "4.9124"]]).map((row, index) => ({ ...row, id: `G${index + 4}` })),
])
