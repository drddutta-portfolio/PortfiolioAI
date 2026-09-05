import Papa from "papaparse"
import {
  read,
  utils,
  type CellObject,
  type Range,
  type WorkBook,
  type WorkSheet,
} from "@e965/xlsx"
import { sha256Bytes, sha256Json } from "./hash"
import type {
  CellEvidence,
  ImportSourceType,
  ParsedImportFile,
  ParsedSheetSummary,
  ParsedSourceRow,
  SheetKind,
} from "./types"

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024
const HEADER_SEARCH_LIMIT = 25

const HEADER_HINTS: Readonly<Record<Exclude<SheetKind, "UNSUPPORTED">, readonly string[]>> = {
  TRANSACTIONS: ["DATE", "BUYSELL", "TICKER", "UNITS", "PRICEUNIT", "BROKER", "COMPANY"],
  HOLDINGS: ["TICKER", "SYMBOL", "UNITS", "QUANTITY", "COMPANY"],
  STOCK_MASTER: ["COMPANY", "SECTOR", "SYMBOL", "SERIES", "ISIN", "MARKETCAP", "CATEGORY"],
}

const BUSINESS_FIELD_ALIASES = {
  ticker: ["TICKER", "SYMBOL", "STOCK", "SCRIP", "SECURITY"],
  side: ["BUYSELL", "TYPE", "TRANSACTIONTYPE"],
  quantity: ["UNITS", "QUANTITY", "QTY", "NETUNITS", "TOTALUNITS", "TOTALQUANTITY", "CURRENTQUANTITY"],
  isin: ["ISIN", "ISINCODE"],
  company: ["COMPANY", "COMPANYNAME", "NAME"],
} as const

function normalizeToken(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
}

export function recognizeSheetName(sheetName: string): SheetKind {
  const normalized = normalizeToken(sheetName)
  if (normalized === "TRANSACTIONS") return "TRANSACTIONS"
  if (normalized === "COPYOFHOLDINGS" || normalized === "HOLDINGS") return "HOLDINGS"
  if (normalized === "COPYOFSTOCKMASTER" || normalized === "STOCKMASTER") return "STOCK_MASTER"
  return "UNSUPPORTED"
}

function isCellObject(value: unknown): value is CellObject {
  return value !== null && typeof value === "object" && "t" in value
}

function getCell(sheet: WorkSheet, rowIndex: number, columnIndex: number) {
  const sheetRecord = sheet as unknown as Readonly<Record<string, unknown>>
  const candidate = sheetRecord[utils.encode_cell({ r: rowIndex, c: columnIndex })]
  return isCellObject(candidate) ? candidate : null
}

function serializableCellValue(value: CellObject["v"]) {
  if (value instanceof Date) return value.toISOString()
  return value ?? null
}

function cellEvidence(cell: CellObject | null): CellEvidence {
  if (!cell) {
    return { dataType: "blank", value: null, formattedText: null, formula: null }
  }

  const value = serializableCellValue(cell.v)
  const dataType = cell.t === "d"
    ? "date"
    : cell.t === "n"
      ? "number"
      : cell.t === "b"
        ? "boolean"
        : cell.t === "e"
          ? "error"
          : cell.t === "z"
            ? "blank"
            : "string"

  return {
    dataType,
    value,
    formattedText: cell.w ?? (value === null ? null : String(value)),
    formula: cell.f ?? null,
  }
}

function cellHeader(cell: CellObject | null) {
  if (!cell || cell.f) return ""
  return String(cell.w ?? cell.v ?? "").trim()
}

function worksheetRange(sheet: WorkSheet): Range | null {
  const sheetRecord = sheet as unknown as Readonly<Record<string, unknown>>
  const reference = sheetRecord["!ref"]
  return typeof reference === "string" ? utils.decode_range(reference) : null
}

function findHeaderRow(sheet: WorkSheet, range: Range, kind: Exclude<SheetKind, "UNSUPPORTED">) {
  const finalRow = Math.min(range.e.r, range.s.r + HEADER_SEARCH_LIMIT - 1)
  let best: { readonly rowIndex: number; readonly score: number } | null = null

  for (let rowIndex = range.s.r; rowIndex <= finalRow; rowIndex += 1) {
    const tokens = new Set<string>()
    for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
      const header = cellHeader(getCell(sheet, rowIndex, columnIndex))
      if (header) tokens.add(normalizeToken(header))
    }
    const score = HEADER_HINTS[kind].filter((hint) => tokens.has(hint)).length
    if (!best || score > best.score) best = { rowIndex, score }
  }

  const minimumScore = kind === "TRANSACTIONS" ? 3 : 2
  return best && best.score >= minimumScore ? best.rowIndex : null
}

function uniqueHeaders(sheet: WorkSheet, range: Range, headerRowIndex: number) {
  const occurrences = new Map<string, number>()
  const headers: string[] = []

  for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
    const rawHeader = cellHeader(getCell(sheet, headerRowIndex, columnIndex))
    const fallback = `Column ${columnIndex + 1}`
    const base = rawHeader || fallback
    const count = (occurrences.get(base) ?? 0) + 1
    occurrences.set(base, count)
    headers.push(count === 1 ? base : `${base} [${count}]`)
  }

  return headers
}

function findBusinessCell(
  cells: Readonly<Record<string, CellEvidence>>,
  aliases: readonly string[],
) {
  for (const [header, cell] of Object.entries(cells)) {
    if (aliases.includes(normalizeToken(header))) return cell
  }
  return null
}

function hasMeaningfulSourceValue(
  cell: CellEvidence | null,
  options: { readonly allowCachedFormula?: boolean } = {},
) {
  if (!cell || (!options.allowCachedFormula && cell.formula !== null) || cell.value === null) return false
  return typeof cell.value !== "string" || cell.value.trim().length > 0
}

function isGenuineBusinessRow(
  kind: Exclude<SheetKind, "UNSUPPORTED">,
  cells: Readonly<Record<string, CellEvidence>>,
) {
  const hasTicker = hasMeaningfulSourceValue(findBusinessCell(cells, BUSINESS_FIELD_ALIASES.ticker))
  if (kind === "TRANSACTIONS") {
    const hasSide = hasMeaningfulSourceValue(findBusinessCell(cells, BUSINESS_FIELD_ALIASES.side))
    const hasQuantity = hasMeaningfulSourceValue(findBusinessCell(cells, BUSINESS_FIELD_ALIASES.quantity))
    return hasTicker && (hasSide || hasQuantity)
  }
  if (kind === "HOLDINGS") {
    return hasTicker || hasMeaningfulSourceValue(
      findBusinessCell(cells, BUSINESS_FIELD_ALIASES.ticker),
      { allowCachedFormula: true },
    )
  }
  return hasTicker
    || hasMeaningfulSourceValue(findBusinessCell(cells, BUSINESS_FIELD_ALIASES.isin))
    || hasMeaningfulSourceValue(findBusinessCell(cells, BUSINESS_FIELD_ALIASES.company))
}

async function parseWorksheet(
  sheetName: string,
  sheet: WorkSheet,
  kind: Exclude<SheetKind, "UNSUPPORTED">,
) {
  const range = worksheetRange(sheet)
  if (!range) return { headerRowNumber: null, rows: [] as ParsedSourceRow[] }

  const headerRowIndex = findHeaderRow(sheet, range, kind)
  if (headerRowIndex === null) return { headerRowNumber: null, rows: [] as ParsedSourceRow[] }

  const headers = uniqueHeaders(sheet, range, headerRowIndex)
  const pendingRows: Omit<ParsedSourceRow, "rawRowHash">[] = []

  for (let rowIndex = headerRowIndex + 1; rowIndex <= range.e.r; rowIndex += 1) {
    const cells: Record<string, CellEvidence> = {}
    for (let offset = 0; offset < headers.length; offset += 1) {
      const header = headers[offset]
      if (!header) continue
      cells[header] = cellEvidence(getCell(sheet, rowIndex, range.s.c + offset))
    }
    if (!isGenuineBusinessRow(kind, cells)) continue
    pendingRows.push({
      sheetName,
      sheetKind: kind,
      originalRowNumber: rowIndex + 1,
      cells,
    })
  }

  const rows = await Promise.all(
    pendingRows.map(async (row) => ({ ...row, rawRowHash: await sha256Json(row.cells) })),
  )
  return { headerRowNumber: headerRowIndex + 1, rows }
}

async function parseCsv(text: string) {
  const result = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: "greedy",
  })
  if (result.errors.length > 0) {
    const first = result.errors[0]
    throw new Error(`CSV parsing failed${first?.row === undefined ? "" : ` at row ${first.row + 1}`}: ${first?.message ?? "Unknown CSV error"}`)
  }
  if (result.data.length === 0) throw new Error("The CSV file is empty.")

  const [headerValues = [], ...dataRows] = result.data
  const occurrences = new Map<string, number>()
  const headers = headerValues.map((value, index) => {
    const base = value.trim() || `Column ${index + 1}`
    const count = (occurrences.get(base) ?? 0) + 1
    occurrences.set(base, count)
    return count === 1 ? base : `${base} [${count}]`
  })

  const pendingRows = dataRows.map((values, index) => {
    const cells: Record<string, CellEvidence> = {}
    headers.forEach((header, columnIndex) => {
      const value = values[columnIndex] ?? ""
      cells[header] = {
        dataType: value === "" ? "blank" : "string",
        value: value === "" ? null : value,
        formattedText: value === "" ? null : value,
        formula: null,
      }
    })
    return {
      sheetName: "CSV",
      sheetKind: "TRANSACTIONS" as const,
      originalRowNumber: index + 2,
      cells,
    }
  }).filter((row) => isGenuineBusinessRow("TRANSACTIONS", row.cells))

  const rows = await Promise.all(
    pendingRows.map(async (row) => ({ ...row, rawRowHash: await sha256Json(row.cells) })),
  )
  const summary: ParsedSheetSummary = {
    originalName: "CSV",
    kind: "TRANSACTIONS",
    headerRowNumber: 1,
    dataRowCount: rows.length,
  }
  return { rows, sheets: [summary] }
}

async function parseXlsx(buffer: ArrayBuffer) {
  const workbook: WorkBook = read(buffer, {
    type: "array",
    cellDates: true,
    cellFormula: true,
    cellText: true,
    raw: true,
  })
  const sheets: ParsedSheetSummary[] = []
  const rows: ParsedSourceRow[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const kind = recognizeSheetName(sheetName)
    if (!sheet || kind === "UNSUPPORTED") {
      sheets.push({ originalName: sheetName, kind, headerRowNumber: null, dataRowCount: 0 })
      continue
    }
    const parsed = await parseWorksheet(sheetName, sheet, kind)
    rows.push(...parsed.rows)
    sheets.push({
      originalName: sheetName,
      kind,
      headerRowNumber: parsed.headerRowNumber,
      dataRowCount: parsed.rows.length,
    })
  }

  if (!sheets.some((sheet) => sheet.kind === "TRANSACTIONS" && sheet.headerRowNumber !== null)) {
    throw new Error("A recognizable TRANSACTIONS sheet was not found.")
  }

  return { rows, sheets }
}

export async function parseImportFile(file: File, sourceType: ImportSourceType): Promise<ParsedImportFile> {
  if (file.size === 0) throw new Error("The selected file is empty.")
  if (file.size > MAX_FILE_SIZE_BYTES) throw new Error("The selected file exceeds the 25 MB limit.")

  const buffer = await file.arrayBuffer()
  const fileSha256 = await sha256Bytes(buffer)

  if (sourceType === "GENERIC_CSV") {
    if (!file.name.toLowerCase().endsWith(".csv")) throw new Error("Generic CSV imports require a .csv file.")
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(buffer)
    const parsed = await parseCsv(decoded)
    return { fileName: file.name, fileFormat: "CSV", fileSha256, ...parsed }
  }

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    throw new Error("Portfolio Historical XLSX imports require a .xlsx file.")
  }
  const parsed = await parseXlsx(buffer)
  return { fileName: file.name, fileFormat: "XLSX", fileSha256, ...parsed }
}
