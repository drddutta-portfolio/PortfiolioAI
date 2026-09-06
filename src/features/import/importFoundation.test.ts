import { describe, expect, it } from "vitest"
import { analyzeImport } from "./analyzeImport"
import { addExact, parseNumeric38x18 } from "./decimal"
import type {
  CellEvidence,
  DuplicateContext,
  ImportReferences,
  NormalizedTransaction,
  AnalyzedSourceRow,
  ParsedImportFile,
  ParsedSourceRow,
  SheetKind,
} from "./types"

const NO_DUPLICATES: DuplicateContext = {
  duplicateOfImportBatchId: null,
  priorRowHashes: new Set<string>(),
}

const REFERENCES: ImportReferences = {
  portfolios: [{ id: "portfolio-a", name: "Primary" }],
  securities: [
    { id: "security-a", symbol: "ALPHA", isin: "INE009A01021", name: "Alpha Ltd", exchange: "NSE" },
    { id: "security-b", symbol: "BEL", isin: "INE263A01024", name: "Bharat Electronics Ltd", exchange: "NSE" },
  ],
  securityIdentifiers: [],
  brokerAccounts: [{
    id: "account-a",
    portfolioId: "portfolio-a",
    accountName: "Primary",
    brokerName: "Motilal Oswal",
    brokerCode: "MOSL",
    apiProvider: null,
  }],
}

function evidence(
  value: string | number | null,
  options: { readonly formula?: string; readonly dataType?: CellEvidence["dataType"] } = {},
): CellEvidence {
  return {
    dataType: options.dataType ?? (typeof value === "number" ? "number" : value === null ? "blank" : "string"),
    value,
    formattedText: value === null ? null : String(value),
    formula: options.formula ?? null,
  }
}

function row(
  sheetKind: SheetKind,
  rowNumber: number,
  values: Readonly<Record<string, CellEvidence>>,
  hash = `${sheetKind}-${rowNumber}`,
): ParsedSourceRow {
  return {
    sheetName: sheetKind,
    sheetKind,
    originalRowNumber: rowNumber,
    cells: values,
    rawRowHash: hash.padEnd(64, "0").slice(0, 64),
  }
}

function transactionRow(overrides: Readonly<Record<string, CellEvidence>> = {}, rowNumber = 2) {
  return row("TRANSACTIONS", rowNumber, {
    "Buy/Sell": evidence("BUY"),
    Ticker: evidence("ALPHA"),
    Units: evidence("10.000000000000000001"),
    "Price/Unit": evidence("123.456789012345678901"),
    Date: evidence("2026-01-31"),
    Broker: evidence("Motilal"),
    Company: evidence("Alpha Ltd"),
    ...overrides,
  })
}

function parsed(rows: readonly ParsedSourceRow[]): ParsedImportFile {
  return {
    fileName: "portfolio.xlsx",
    fileFormat: "XLSX",
    fileSha256: "a".repeat(64),
    sheets: [],
    rows,
  }
}

function firstTransaction(
  analysis: ReturnType<typeof analyzeImport>,
): AnalyzedSourceRow & { readonly normalized: NormalizedTransaction } {
  const transaction = analysis.rows.find((candidate) => candidate.source.sheetKind === "TRANSACTIONS")
  if (!transaction?.normalized) throw new Error("Expected analyzed transaction")
  return { ...transaction, normalized: transaction.normalized }
}

describe("legacy transaction validation", () => {
  it.each([
    ["missing date", { Date: evidence(null) }, "MISSING_DATE"],
    ["missing broker", { Broker: evidence(null) }, "MISSING_BROKER"],
    ["missing date and broker", { Date: evidence(null), Broker: evidence(null) }, "MISSING_DATE_AND_BROKER"],
  ] as const)("accepts %s without fabricating values", (_label, overrides, expectedStatus) => {
    const transaction = firstTransaction(analyzeImport(
      parsed([transactionRow(overrides)]),
      REFERENCES,
      {},
      NO_DUPLICATES,
    ))

    expect(transaction.validationStatus).toBe("VALID")
    expect(transaction.normalized.dataQualityStatus).toBe(expectedStatus)
    if ("Date" in overrides) expect(transaction.normalized.transactionDate).toBeNull()
    if ("Broker" in overrides) expect(transaction.normalized.brokerAccountId).toBeNull()
  })

  it("maps BUY and SELL without creating opening positions", () => {
    const analysis = analyzeImport(parsed([
      transactionRow({}, 2),
      transactionRow({ "Buy/Sell": evidence("SELL") }, 3),
    ]), REFERENCES, {}, NO_DUPLICATES)

    expect(analysis.rows.flatMap((candidate) => candidate.normalized?.transactionType ?? []))
      .toEqual(["BUY", "SELL"])
    expect(JSON.stringify(analysis)).not.toContain("OPENING_POSITION")
  })

  it.each(["0", "-1"])("rejects a quantity of %s", (quantity) => {
    const transaction = firstTransaction(analyzeImport(
      parsed([transactionRow({ Units: evidence(quantity) })]),
      REFERENCES,
      {},
      NO_DUPLICATES,
    ))
    expect(transaction.validationStatus).toBe("INVALID")
    expect(transaction.validationErrors.join(" ")).toMatch(/quantity/i)
  })

  it("flags an ambiguous security instead of creating one", () => {
    const transaction = firstTransaction(analyzeImport(
      parsed([transactionRow({ Ticker: evidence("UNKNOWN") })]),
      REFERENCES,
      {},
      NO_DUPLICATES,
    ))
    expect(transaction.validationStatus).toBe("AMBIGUOUS")
    expect(transaction.normalized.securityId).toBeNull()
    expect(transaction.normalized.dataQualityStatus).toBe("NEEDS_REVIEW")
  })

  it("leaves a broker null when no selected-portfolio account is available", () => {
    const transaction = firstTransaction(analyzeImport(
      parsed([transactionRow()]),
      { ...REFERENCES, brokerAccounts: [] },
      {},
      NO_DUPLICATES,
    ))
    expect(transaction.validationStatus).toBe("VALID")
    expect(transaction.normalized.brokerAccountId).toBeNull()
    expect(transaction.normalized.dataQualityStatus).toBe("MISSING_BROKER")
  })

  it("prefers STOCK MASTER ISIN over a ticker match", () => {
    const sourceRows = [
      transactionRow(),
      row("STOCK_MASTER", 2, {
        Symbol: evidence("ALPHA"),
        Company: evidence("Renamed Alpha"),
        ISIN: evidence("INE263A01024"),
      }),
    ]
    const transaction = firstTransaction(analyzeImport(parsed(sourceRows), REFERENCES, {}, NO_DUPLICATES))
    expect(transaction.normalized.securityId).toBe("security-b")
    expect(transaction.securityResolution?.method).toBe("ISIN")
  })

  it("excludes checksum-invalid ISIN evidence without discarding the raw workbook value", () => {
    const sourceRows = [
      transactionRow({ Ticker: evidence("NSE:BEL") }),
      row("STOCK_MASTER", 2, {
        Symbol: evidence("NSE:BEL"),
        Company: evidence("Bharat Electronics Ltd"),
        ISIN: evidence("INE263A01024"),
      }),
      row("STOCK_MASTER", 3, {
        Symbol: evidence("NSE:BEL"),
        Company: evidence("Bharat Electronics Ltd"),
        ISIN: evidence("INE263A01025"),
      }),
    ]

    const analysis = analyzeImport(parsed(sourceRows), REFERENCES, {}, NO_DUPLICATES)
    const transaction = firstTransaction(analysis)
    const invalidEvidence = analysis.rows.find(
      (candidate) => candidate.source.originalRowNumber === 3,
    )?.source.cells.ISIN

    expect(transaction.normalized.securityId).toBe("security-b")
    expect(transaction.securityResolution).toMatchObject({
      method: "ISIN",
      sourceIsin: "INE263A01024",
    })
    expect(invalidEvidence?.value).toBe("INE263A01025")
  })

  it("falls through to a trusted identifier when STOCK MASTER has only an invalid ISIN", () => {
    const sourceRows = [
      transactionRow(),
      row("STOCK_MASTER", 2, {
        Symbol: evidence("ALPHA"),
        Company: evidence("Alpha Ltd"),
        ISIN: evidence("INE263A01025"),
      }),
    ]
    const references: ImportReferences = {
      ...REFERENCES,
      securityIdentifiers: [{
        securityId: "security-a",
        identifierType: "LEGACY_TICKER",
        identifierValue: "ALPHA",
        providerCode: "LEGACY_WORKBOOK",
      }],
    }

    const transaction = firstTransaction(analyzeImport(
      parsed(sourceRows), references, {}, NO_DUPLICATES,
    ))

    expect(transaction.normalized.securityId).toBe("security-a")
    expect(transaction.securityResolution?.method).toBe("IDENTIFIER")
    expect(transaction.securityResolution?.sourceIsin).toBeNull()
  })

  it("preserves but ignores formula-derived accounting fields", () => {
    const transaction = firstTransaction(analyzeImport(
      parsed([transactionRow({
        "Price/Unit": evidence(999, { formula: "A1*B1" }),
        "Current Value": evidence(9990, { formula: "D2*E2" }),
      })]),
      REFERENCES,
      {},
      NO_DUPLICATES,
    ))
    expect(transaction.normalized.unitPrice).toBeNull()
    expect(transaction.validationWarnings.join(" ")).toMatch(/formula-derived price/i)
    expect(transaction.source.cells["Current Value"]?.formula).toBe("D2*E2")
  })

  it("marks repeated files and repeated rows as possible duplicates without discarding them", () => {
    const duplicateContext: DuplicateContext = {
      duplicateOfImportBatchId: "previous-batch",
      priorRowHashes: new Set<string>(),
    }
    const transaction = firstTransaction(analyzeImport(
      parsed([transactionRow()]),
      REFERENCES,
      {},
      duplicateContext,
    ))
    expect(transaction.validationStatus).toBe("DUPLICATE")
    expect(transaction.duplicateStatus).toBe("POSSIBLE_DUPLICATE")
    expect(transaction.normalized.quantity).toBe("10.000000000000000001")
  })

  it("warns on a complete repeated normalized identity even when raw row hashes differ", () => {
    const first = transactionRow({}, 2)
    const second = { ...transactionRow({}, 3), rawRowHash: "different".padEnd(64, "0") }
    const analysis = analyzeImport(parsed([first, second]), REFERENCES, {}, NO_DUPLICATES)
    expect(analysis.summary.duplicateRowCount).toBe(2)
    expect(analysis.rows.filter((candidate) => candidate.validationStatus === "DUPLICATE"))
      .toHaveLength(2)
  })
})

describe("holdings reconciliation and decimal precision", () => {
  it("reconciles BUY minus SELL against holdings with exact decimal arithmetic", () => {
    const analysis = analyzeImport(parsed([
      transactionRow({ Units: evidence("10.1") }, 2),
      transactionRow({ "Buy/Sell": evidence("SELL"), Units: evidence("3.05") }, 3),
      row("HOLDINGS", 2, { Ticker: evidence("ALPHA"), Units: evidence("7.05") }),
    ]), REFERENCES, {}, NO_DUPLICATES)

    expect(analysis.reconciliation.available).toBe(true)
    expect(analysis.reconciliation.holdingsRowCount).toBe(1)
    expect(analysis.reconciliation.mismatchCount).toBe(0)
    expect(analysis.reconciliation.rows[0]?.transactionQuantity).toBe("7.05")
  })

  it("uses cached holding formulas only for reconciliation evidence", () => {
    const analysis = analyzeImport(parsed([
      transactionRow({ Units: evidence("10") }, 2),
      row("HOLDINGS", 2, {
        Ticker: evidence("ALPHA", { formula: "A1" }),
        "Net Units": evidence(10, { formula: "SUMIFS(...)" }),
      }),
    ]), REFERENCES, {}, NO_DUPLICATES)

    expect(analysis.reconciliation.available).toBe(true)
    expect(analysis.reconciliation.holdingsRowCount).toBe(1)
    expect(analysis.reconciliation.mismatchCount).toBe(0)
    expect(analysis.rows.find((candidate) => candidate.source.sheetKind === "HOLDINGS")?.normalized)
      .toBeNull()
  })

  it("retains exact decimals and rejects values outside numeric(38,18)", () => {
    expect(addExact("0.1", "0.2")).toBe("0.3")
    expect(parseNumeric38x18("10.123456789012345678", { allowZero: false }).value)
      .toBe("10.123456789012345678")
    expect(parseNumeric38x18("10.1234567890123456789", { allowZero: false }).error)
      .toMatch(/numeric\(38,18\)/i)
  })
})
