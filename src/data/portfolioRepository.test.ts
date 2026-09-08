import { describe, expect, it } from "vitest"
import { canonicalSourceTicker, holdingsSnapshotEvidence } from "./portfolioRepository"

const cell = (value: unknown, dataType = "number", formula: string | null = null) => ({ data_type: dataType, value, formatted_text: String(value), formula })

describe("HOLDINGS snapshot evidence projection", () => {
  it("matches explicit exchange-prefixed workbook tickers without changing source evidence", () => {
    expect(canonicalSourceTicker(" NSE:BEL ")).toBe("BEL")
    expect(canonicalSourceTicker("BSE:500325")).toBe("500325")
  })
  it("projects exact source values with immutable row provenance", () => {
    const evidence = holdingsSnapshotEvidence({ id: "row-1", import_batch_id: "batch-1", raw_data: { original_sheet_name: "HOLDINGS", original_row_number: 12, cells: { "Avg Buy Price": cell("123.4500"), "Invested Value": cell("10000.01"), "Realized P/L": cell("424"), "P&L %": cell("4.25", "number", "=A1/B1") } } })
    expect(evidence).toMatchObject({ sourceRowId: "row-1", importBatchId: "batch-1", averageCost: "123.45", investedValue: "10000.01", realisedPnl: "424", unrealisedPnlPercent: "4.25", containsFormulaResults: true })
  })

  it("rejects spreadsheet errors and non-numeric placeholders", () => {
    const evidence = holdingsSnapshotEvidence({ id: "row-2", import_batch_id: "batch-1", raw_data: { original_sheet_name: "HOLDINGS", original_row_number: 13, cells: { "Avg Buy Price": cell("#REF!", "error", "=BROKEN"), "Invested Value": cell("Unavailable", "string") } } })
    expect(evidence).toBeNull()
  })
})
