import { utils, write } from "@e965/xlsx"
import { describe, expect, it } from "vitest"
import { parseImportFile, recognizeSheetName } from "./workbookParser"

describe("workbook parsing", () => {
  it("recognizes supported sheet names without depending on case or spacing", () => {
    expect(recognizeSheetName(" transactions ")).toBe("TRANSACTIONS")
    expect(recognizeSheetName("COPY of Holdings")).toBe("HOLDINGS")
    expect(recognizeSheetName("copy OF stock master")).toBe("STOCK_MASTER")
    expect(recognizeSheetName("Notes")).toBe("UNSUPPORTED")
  })

  it("parses CSV cell text without inventing an opening position", async () => {
    const file = new File(
      ["Date,Buy/Sell,Ticker,Units,Price/Unit,Broker,Company\n,BUY,ALPHA,1.000000000000000001,5.25,,Alpha Ltd\n"],
      "portfolio.csv",
      { type: "text/csv" },
    )
    const result = await parseImportFile(file, "GENERIC_CSV")
    expect(result.fileFormat).toBe("CSV")
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]?.cells.Units?.value).toBe("1.000000000000000001")
    expect(JSON.stringify(result)).not.toContain("OPENING_POSITION")
  })

  it("retains XLSX formula and cached-value evidence", async () => {
    const workbook = utils.book_new()
    const transactions = utils.aoa_to_sheet([
      ["Date", "Buy/Sell", "Ticker", "Units", "Price/Unit", "Broker", "Company"],
      ["2026-01-31", "BUY", "ALPHA", "10", null, "Motilal", "Alpha Ltd"],
    ])
    transactions.E2 = { t: "n", v: 125, f: "5*25" }
    utils.book_append_sheet(workbook, transactions, "transactions")
    const output: unknown = write(workbook, { bookType: "xlsx", type: "array" })
    if (!(output instanceof ArrayBuffer)) throw new Error("Expected XLSX ArrayBuffer")

    const result = await parseImportFile(
      new File([output], "portfolio.xlsx"),
      "PORTFOLIO_HISTORICAL_XLSX",
    )
    const price = result.rows[0]?.cells["Price/Unit"]
    expect(price?.formula).toBe("5*25")
    expect(price?.value).toBe(125)
    expect(price?.formattedText).toBe("125")
  })

  it("filters structural remnants while retaining genuine rows and Excel row numbers", async () => {
    const workbook = utils.book_new()
    const transactions = utils.aoa_to_sheet([
      ["Date", "Buy/Sell", "Ticker", "Units", "Price/Unit", "Broker", "Company", "Derived"],
      [null, "BUY", "ALPHA", 10, null, null, "Alpha Ltd"],
      [],
      [null, null, "BETA", 5],
      [],
      [],
    ])
    transactions.H3 = { t: "n", v: 0, f: "IF(A3=\"\",\"\",1)" }
    transactions.H5 = { t: "n", v: 0, f: "IF(A5=\"\",\"\",1)" }
    transactions.A6 = { t: "z", v: undefined, s: { numFmt: "yyyy-mm-dd" } }
    transactions["!ref"] = "A1:H6"
    utils.book_append_sheet(workbook, transactions, "TRANSACTIONS")

    const holdings = utils.aoa_to_sheet([
      ["Ticker", "Units", "Derived"],
      ["ALPHA", null, null],
      [],
      [],
    ])
    holdings.C3 = { t: "n", v: 0, f: "IF(A3=\"\",\"\",1)" }
    holdings.A4 = { t: "z", v: undefined, s: { numFmt: "@" } }
    holdings["!ref"] = "A1:C4"
    utils.book_append_sheet(workbook, holdings, "HOLDINGS")

    const stockMaster = utils.aoa_to_sheet([
      ["Symbol", "ISIN", "Company", "Derived"],
      ["ALPHA", null, null, null],
      [null, "INE000B00002", null, null],
      [null, null, "Company without identifiers", null],
      [],
    ])
    stockMaster.D5 = { t: "n", v: 0, f: "IF(A5=\"\",\"\",1)" }
    stockMaster["!ref"] = "A1:D5"
    utils.book_append_sheet(workbook, stockMaster, "STOCK MASTER")

    const output: unknown = write(workbook, { bookType: "xlsx", type: "array" })
    if (!(output instanceof ArrayBuffer)) throw new Error("Expected XLSX ArrayBuffer")
    const result = await parseImportFile(
      new File([output], "portfolio.xlsx"),
      "PORTFOLIO_HISTORICAL_XLSX",
    )

    expect(result.sheets.map(({ kind, dataRowCount }) => ({ kind, dataRowCount }))).toEqual([
      { kind: "TRANSACTIONS", dataRowCount: 2 },
      { kind: "HOLDINGS", dataRowCount: 1 },
      { kind: "STOCK_MASTER", dataRowCount: 3 },
    ])
    expect(result.rows.filter((row) => row.sheetKind === "TRANSACTIONS").map((row) => row.originalRowNumber))
      .toEqual([2, 4])
    expect(result.rows.find((row) => row.originalRowNumber === 2)?.cells.Date?.value).toBeNull()
    expect(result.rows.find((row) => row.originalRowNumber === 4)?.cells["Buy/Sell"]?.value).toBeNull()
  })
})
