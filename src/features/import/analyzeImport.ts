import {
  addExact,
  decimalsEqual,
  negateExact,
  parseNumeric38x18,
  subtractExact,
} from "./decimal"
import type {
  AnalyzedSourceRow,
  BrokerAccountReference,
  CellEvidence,
  DataQualityStatus,
  DuplicateContext,
  ImportAnalysis,
  ImportReferences,
  NormalizedTransaction,
  ParsedImportFile,
  ParsedSourceRow,
  ReconciliationResult,
  SecurityResolution,
  StockMasterIdentity,
  TransactionType,
  ValidationStatus,
} from "./types"

export type ManualSecurityMappings = Readonly<Record<string, string>>

const FIELD_ALIASES = {
  date: ["DATE", "TRANSACTIONDATE", "TRADEDATE"],
  side: ["BUYSELL", "TYPE", "TRANSACTIONTYPE"],
  ticker: ["TICKER", "SYMBOL", "STOCK", "SCRIP"],
  quantity: ["UNITS", "QUANTITY", "QTY", "NETUNITS", "TOTALUNITS", "TOTALQUANTITY", "CURRENTQUANTITY"],
  price: ["PRICEUNIT", "PRICEPERUNIT", "UNITPRICE", "PRICE"],
  broker: ["BROKER", "BROKERNAME", "ACCOUNT"],
  company: ["COMPANY", "COMPANYNAME", "NAME"],
  isin: ["ISIN", "ISINCODE"],
} as const

function normalizeToken(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
}

export function normalizeSourceTicker(value: string) {
  return value.trim().toUpperCase()
}

function findCell(row: ParsedSourceRow, aliases: readonly string[]) {
  for (const [header, cell] of Object.entries(row.cells)) {
    if (aliases.includes(normalizeToken(header))) return cell
  }
  return null
}

interface SourceValue {
  readonly value: string | number | null
  readonly ignoredFormula: boolean
}

function sourceValue(cell: CellEvidence | null): SourceValue {
  if (!cell) return { value: null, ignoredFormula: false }
  if (cell.formula) return { value: null, ignoredFormula: true }
  if (typeof cell.value === "string" || typeof cell.value === "number") {
    return { value: cell.value, ignoredFormula: false }
  }
  return { value: null, ignoredFormula: false }
}

function cachedEvidenceValue(cell: CellEvidence | null): SourceValue {
  if (!cell) return { value: null, ignoredFormula: false }
  if (typeof cell.value === "string" || typeof cell.value === "number") {
    return { value: cell.value, ignoredFormula: false }
  }
  return { value: null, ignoredFormula: false }
}

function optionalText(value: SourceValue) {
  if (value.value === null) return null
  const text = String(value.value).trim()
  return text || null
}

function parseTransactionType(value: SourceValue): TransactionType | null {
  const normalized = optionalText(value)?.toUpperCase()
  if (normalized === "BUY") return "BUY"
  if (normalized === "SELL") return "SELL"
  return null
}

function validDateParts(year: number, month: number, day: number) {
  const candidate = new Date(Date.UTC(year, month - 1, day))
  return candidate.getUTCFullYear() === year
    && candidate.getUTCMonth() === month - 1
    && candidate.getUTCDate() === day
}

function isoDate(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
}

function parseSourceDate(cell: CellEvidence | null) {
  if (!cell || cell.formula || cell.value === null) return null
  if (cell.dataType === "date" && typeof cell.value === "string") {
    const iso = cell.value.slice(0, 10)
    return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null
  }
  if (typeof cell.value !== "string") return null
  const text = cell.value.trim()
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  if (isoMatch) {
    const [, year = "", month = "", day = ""] = isoMatch
    return validDateParts(Number(year), Number(month), Number(day))
      ? isoDate(Number(year), Number(month), Number(day))
      : null
  }
  const indianMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text)
  if (indianMatch) {
    const [, day = "", month = "", year = ""] = indianMatch
    return validDateParts(Number(year), Number(month), Number(day))
      ? isoDate(Number(year), Number(month), Number(day))
      : null
  }
  return null
}

function buildStockMaster(rows: readonly ParsedSourceRow[]) {
  const bySymbol = new Map<string, StockMasterIdentity[]>()

  for (const row of rows.filter((candidate) => candidate.sheetKind === "STOCK_MASTER")) {
    const sourceSymbol = optionalText(sourceValue(findCell(row, FIELD_ALIASES.ticker)))
    if (!sourceSymbol) continue
    const identity: StockMasterIdentity = {
      sourceSymbol,
      sourceCompany: optionalText(sourceValue(findCell(row, FIELD_ALIASES.company))),
      isin: optionalText(sourceValue(findCell(row, FIELD_ALIASES.isin)))?.toUpperCase() ?? null,
    }
    const key = normalizeSourceTicker(sourceSymbol)
    bySymbol.set(key, [...(bySymbol.get(key) ?? []), identity])
  }

  return bySymbol
}

function unique(values: readonly string[]) {
  return [...new Set(values)]
}

function resolveSecurity(
  sourceTicker: string | null,
  stockMaster: ReadonlyMap<string, readonly StockMasterIdentity[]>,
  references: ImportReferences,
  manualMappings: ManualSecurityMappings,
): SecurityResolution {
  if (!sourceTicker) {
    return { securityId: null, method: "UNRESOLVED", candidates: [], sourceIsin: null }
  }

  const tickerKey = normalizeSourceTicker(sourceTicker)
  const masterMatches = stockMaster.get(tickerKey) ?? []
  const sourceIsins = unique(masterMatches.flatMap((entry) => entry.isin ? [entry.isin] : []))
  if (sourceIsins.length === 1) {
    const sourceIsin = sourceIsins[0] ?? null
    const matches = references.securities.filter(
      (security) => security.isin?.toUpperCase() === sourceIsin,
    )
    if (matches.length === 1) {
      return {
        securityId: matches[0]?.id ?? null,
        method: "ISIN",
        candidates: matches.map((match) => match.id),
        sourceIsin,
      }
    }
    const manualId = manualMappings[tickerKey]
    if (manualId && references.securities.some((security) => security.id === manualId)) {
      return { securityId: manualId, method: "MANUAL", candidates: [manualId], sourceIsin }
    }
    return {
      securityId: null,
      method: "UNRESOLVED",
      candidates: matches.map((match) => match.id),
      sourceIsin,
    }
  }
  if (sourceIsins.length > 1) {
    const manualId = manualMappings[tickerKey]
    if (manualId && references.securities.some((security) => security.id === manualId)) {
      return { securityId: manualId, method: "MANUAL", candidates: [manualId], sourceIsin: null }
    }
    return { securityId: null, method: "UNRESOLVED", candidates: [], sourceIsin: null }
  }

  const identifierMatches = unique(
    references.securityIdentifiers
      .filter((identifier) => identifier.identifierValue.trim().toUpperCase() === tickerKey)
      .map((identifier) => identifier.securityId),
  )
  if (identifierMatches.length === 1) {
    return {
      securityId: identifierMatches[0] ?? null,
      method: "IDENTIFIER",
      candidates: identifierMatches,
      sourceIsin: null,
    }
  }
  if (identifierMatches.length > 1) {
    const manualId = manualMappings[tickerKey]
    if (manualId && references.securities.some((security) => security.id === manualId)) {
      return { securityId: manualId, method: "MANUAL", candidates: [manualId], sourceIsin: null }
    }
    return { securityId: null, method: "UNRESOLVED", candidates: identifierMatches, sourceIsin: null }
  }

  const symbolMatches = references.securities.filter(
    (security) => normalizeSourceTicker(security.symbol) === tickerKey,
  )
  if (symbolMatches.length === 1) {
    return {
      securityId: symbolMatches[0]?.id ?? null,
      method: "SYMBOL",
      candidates: symbolMatches.map((match) => match.id),
      sourceIsin: null,
    }
  }
  const manualId = manualMappings[tickerKey]
  if (manualId && references.securities.some((security) => security.id === manualId)) {
    return { securityId: manualId, method: "MANUAL", candidates: [manualId], sourceIsin: null }
  }
  return {
    securityId: null,
    method: "UNRESOLVED",
    candidates: symbolMatches.map((match) => match.id),
    sourceIsin: null,
  }
}

const BROKER_ALIASES: Readonly<Record<string, readonly string[]>> = {
  MOTILAL: ["MOTILAL", "MOTILALOSWAL", "MOSL"],
  SHAREKHAN: ["SHAREKHAN"],
  ANGELONE: ["ANGELONE", "ANGELBROKING"],
  ZERODHA: ["ZERODHA"],
  INDMONEY: ["INDMONEY"],
}

function brokerTokens(account: BrokerAccountReference) {
  return [account.accountName, account.brokerName, account.brokerCode, account.apiProvider ?? ""]
    .map(normalizeToken)
    .filter(Boolean)
}

function resolveBrokerAccount(sourceBroker: string | null, accounts: readonly BrokerAccountReference[]) {
  if (!sourceBroker) return null
  const sourceToken = normalizeToken(sourceBroker)
  const acceptedTokens = BROKER_ALIASES[sourceToken] ?? [sourceToken]
  const matches = accounts.filter((account) =>
    brokerTokens(account).some((token) => acceptedTokens.includes(token)),
  )
  return matches.length === 1 ? matches[0]?.id ?? null : null
}

function qualityStatus(
  transactionDate: string | null,
  brokerAccountId: string | null,
  needsReview: boolean,
): DataQualityStatus {
  if (needsReview) return "NEEDS_REVIEW"
  if (!transactionDate && !brokerAccountId) return "MISSING_DATE_AND_BROKER"
  if (!transactionDate) return "MISSING_DATE"
  if (!brokerAccountId) return "MISSING_BROKER"
  return "COMPLETE"
}

function analyzeTransactionRow(
  row: ParsedSourceRow,
  stockMaster: ReadonlyMap<string, readonly StockMasterIdentity[]>,
  references: ImportReferences,
  manualMappings: ManualSecurityMappings,
  duplicateContext: DuplicateContext,
  currentHashCounts: ReadonlyMap<string, number>,
): AnalyzedSourceRow {
  const errors: string[] = []
  const warnings: string[] = []
  const sideSource = sourceValue(findCell(row, FIELD_ALIASES.side))
  const tickerSource = sourceValue(findCell(row, FIELD_ALIASES.ticker))
  const quantitySource = sourceValue(findCell(row, FIELD_ALIASES.quantity))
  const priceCell = findCell(row, FIELD_ALIASES.price)
  const priceSource = sourceValue(priceCell)
  const brokerSource = sourceValue(findCell(row, FIELD_ALIASES.broker))
  const companySource = sourceValue(findCell(row, FIELD_ALIASES.company))
  const dateCell = findCell(row, FIELD_ALIASES.date)

  const transactionType = parseTransactionType(sideSource)
  const sourceTicker = optionalText(tickerSource)
  const sourceCompany = optionalText(companySource)
  const sourceBroker = optionalText(brokerSource)
  const quantityResult = parseNumeric38x18(quantitySource.value, { allowZero: false })
  const priceResult = parseNumeric38x18(priceSource.value, { allowZero: true })
  const transactionDate = parseSourceDate(dateCell)

  if (sideSource.ignoredFormula) errors.push("Buy/Sell formula was ignored; an original value is required.")
  if (!transactionType) errors.push("Transaction type must be BUY or SELL.")
  if (tickerSource.ignoredFormula) errors.push("Ticker formula was ignored; an original value is required.")
  if (!sourceTicker) errors.push("Ticker is required.")
  if (quantitySource.ignoredFormula) errors.push("Quantity formula was ignored; an original value is required.")
  if (!quantitySource.ignoredFormula && quantitySource.value === null) errors.push("Quantity is required.")
  if (quantityResult.error) errors.push(`Quantity: ${quantityResult.error}`)
  if (priceSource.ignoredFormula) warnings.push("Formula-derived price was preserved as evidence but ignored.")
  if (
    !priceSource.ignoredFormula
    && priceCell
    && priceCell.value !== null
    && priceSource.value === null
  ) errors.push("Price must be a decimal number when supplied.")
  if (priceResult.error) errors.push(`Price: ${priceResult.error}`)
  if (dateCell?.formula) warnings.push("Formula-derived date was preserved as evidence but ignored.")
  if (dateCell && dateCell.value !== null && !dateCell.formula && !transactionDate) {
    errors.push("Date is present but not a supported unambiguous date value.")
  }

  const securityResolution = resolveSecurity(sourceTicker, stockMaster, references, manualMappings)
  if (!securityResolution.securityId && sourceTicker) {
    warnings.push("Security could not be mapped confidently and requires review.")
  }

  const brokerAccountId = resolveBrokerAccount(sourceBroker, references.brokerAccounts)
  if (!transactionDate) warnings.push("Transaction date is missing and remains null.")
  if (!brokerAccountId) {
    warnings.push(sourceBroker
      ? "Broker account could not be mapped confidently and remains null."
      : "Broker is missing and remains null.")
  }

  const possibleDuplicate = duplicateContext.duplicateOfImportBatchId !== null
    || duplicateContext.priorRowHashes.has(row.rawRowHash)
    || (currentHashCounts.get(row.rawRowHash) ?? 0) > 1
  if (possibleDuplicate) warnings.push("Possible duplicate source row requires review; it was not discarded.")

  const needsReview = errors.length > 0 || !securityResolution.securityId
  const normalized: NormalizedTransaction = {
    transactionType,
    transactionDate,
    brokerAccountId,
    securityId: securityResolution.securityId,
    sourceTicker,
    sourceCompany,
    sourceBroker,
    quantity: quantityResult.value,
    unitPrice: priceResult.value,
    dataQualityStatus: qualityStatus(transactionDate, brokerAccountId, needsReview),
  }

  let validationStatus: ValidationStatus = "VALID"
  if (errors.length > 0) validationStatus = "INVALID"
  else if (!securityResolution.securityId) validationStatus = "AMBIGUOUS"
  else if (possibleDuplicate) validationStatus = "DUPLICATE"

  return {
    source: row,
    normalized,
    securityResolution,
    validationStatus,
    validationErrors: errors,
    validationWarnings: warnings,
    duplicateStatus: possibleDuplicate ? "POSSIBLE_DUPLICATE" : "NOT_DUPLICATE",
  }
}

function ignoredRow(row: ParsedSourceRow): AnalyzedSourceRow {
  return {
    source: row,
    normalized: null,
    securityResolution: null,
    validationStatus: "IGNORED",
    validationErrors: [],
    validationWarnings: [
      row.sheetKind === "HOLDINGS"
        ? "Holdings row retained for reconciliation only; it will not create a transaction."
        : "Stock-master row retained for identity enrichment only; it will not create a transaction.",
    ],
    duplicateStatus: null,
  }
}

function reconciliationIdentity(
  ticker: string | null,
  resolution: SecurityResolution,
) {
  if (resolution.securityId) return `SECURITY:${resolution.securityId}`
  return ticker ? `TICKER:${normalizeSourceTicker(ticker)}` : null
}

function reconcile(
  rows: readonly AnalyzedSourceRow[],
  stockMaster: ReadonlyMap<string, readonly StockMasterIdentity[]>,
  references: ImportReferences,
  manualMappings: ManualSecurityMappings,
): ReconciliationResult {
  const transactionTotals = new Map<string, { label: string; quantity: string }>()
  const holdingTotals = new Map<string, { label: string; quantity: string | null }>()

  for (const row of rows) {
    const normalized = row.normalized
    if (!normalized?.transactionType || !normalized.quantity || !row.securityResolution) continue
    const identity = reconciliationIdentity(normalized.sourceTicker, row.securityResolution)
    if (!identity) continue
    const signed = normalized.transactionType === "SELL"
      ? negateExact(normalized.quantity)
      : normalized.quantity
    const current = transactionTotals.get(identity)?.quantity ?? "0"
    transactionTotals.set(identity, {
      label: normalized.sourceTicker ?? identity,
      quantity: addExact(current, signed),
    })
  }

  const holdings = rows.filter((row) => row.source.sheetKind === "HOLDINGS")
  for (const analyzed of holdings) {
    const ticker = optionalText(cachedEvidenceValue(findCell(analyzed.source, FIELD_ALIASES.ticker)))
    const resolution = resolveSecurity(ticker, stockMaster, references, manualMappings)
    const identity = reconciliationIdentity(ticker, resolution)
    if (!identity) continue
    const quantitySource = cachedEvidenceValue(findCell(analyzed.source, FIELD_ALIASES.quantity))
    const parsed = parseNumeric38x18(quantitySource.value, { allowZero: true })
    const previous = holdingTotals.get(identity)
    const quantity = parsed.error || !parsed.value
      ? null
      : previous?.quantity
        ? addExact(previous.quantity, parsed.value)
        : parsed.value
    holdingTotals.set(identity, { label: ticker ?? identity, quantity })
  }

  const identities = new Set([...transactionTotals.keys(), ...holdingTotals.keys()])
  const resultRows = [...identities].sort().map((identity) => {
    const transaction = transactionTotals.get(identity)
    const holding = holdingTotals.get(identity)
    const transactionQuantity = transaction?.quantity ?? null
    const holdingsQuantity = holding?.quantity ?? null
    const matches = transactionQuantity !== null
      && holdingsQuantity !== null
      && decimalsEqual(transactionQuantity, holdingsQuantity)
    return {
      identity,
      label: holding?.label ?? transaction?.label ?? identity,
      transactionQuantity,
      holdingsQuantity,
      difference: transactionQuantity !== null && holdingsQuantity !== null
        ? subtractExact(transactionQuantity, holdingsQuantity)
        : null,
      matches,
    }
  })

  return {
    available: holdings.length > 0,
    holdingsRowCount: holdings.length,
    mismatchCount: resultRows.filter((row) => !row.matches).length,
    rows: resultRows,
  }
}

export function analyzeImport(
  file: ParsedImportFile,
  references: ImportReferences,
  manualMappings: ManualSecurityMappings,
  duplicateContext: DuplicateContext,
): ImportAnalysis {
  const stockMaster = buildStockMaster(file.rows)
  const transactionSourceRows = file.rows.filter((row) => row.sheetKind === "TRANSACTIONS")
  const currentHashCounts = new Map<string, number>()
  transactionSourceRows.forEach((row) => {
    currentHashCounts.set(row.rawRowHash, (currentHashCounts.get(row.rawRowHash) ?? 0) + 1)
  })

  const initiallyAnalyzedRows = file.rows.map((row) => row.sheetKind === "TRANSACTIONS"
    ? analyzeTransactionRow(
        row,
        stockMaster,
        references,
        manualMappings,
        duplicateContext,
        currentHashCounts,
      )
    : ignoredRow(row))

  const normalizedIdentityCounts = new Map<string, number>()
  initiallyAnalyzedRows.forEach((row) => {
    const value = row.normalized
    if (
      !value?.transactionType
      || !value.transactionDate
      || !value.brokerAccountId
      || !value.securityId
      || !value.quantity
      || value.unitPrice === null
    ) return
    const key = [
      value.securityId,
      value.brokerAccountId,
      value.transactionType,
      value.transactionDate,
      value.quantity,
      value.unitPrice,
    ].join("|")
    normalizedIdentityCounts.set(key, (normalizedIdentityCounts.get(key) ?? 0) + 1)
  })

  const rows = initiallyAnalyzedRows.map((row): AnalyzedSourceRow => {
    const value = row.normalized
    if (
      row.validationStatus !== "VALID"
      || !value?.transactionType
      || !value.transactionDate
      || !value.brokerAccountId
      || !value.securityId
      || !value.quantity
      || value.unitPrice === null
    ) return row
    const key = [
      value.securityId,
      value.brokerAccountId,
      value.transactionType,
      value.transactionDate,
      value.quantity,
      value.unitPrice,
    ].join("|")
    if ((normalizedIdentityCounts.get(key) ?? 0) < 2) return row
    return {
      ...row,
      validationStatus: "DUPLICATE",
      duplicateStatus: "POSSIBLE_DUPLICATE",
      validationWarnings: [
        ...row.validationWarnings,
        "Possible duplicate normalized transaction identity requires review; it was not discarded.",
      ],
    }
  })

  const transactions = rows.filter((row) => row.normalized !== null)
  const mapped = new Set<string>()
  const unmapped = new Set<string>()
  transactions.forEach((row) => {
    const ticker = row.normalized?.sourceTicker
    if (!ticker) return
    if (row.normalized?.securityId) mapped.add(row.normalized.securityId)
    else unmapped.add(normalizeSourceTicker(ticker))
  })

  const summary = {
    parsedTransactionCount: transactions.length,
    validRowCount: transactions.filter((row) => row.validationStatus === "VALID").length,
    invalidRowCount: transactions.filter((row) => row.validationStatus === "INVALID").length,
    ambiguousRowCount: transactions.filter((row) => row.validationStatus === "AMBIGUOUS").length,
    duplicateRowCount: transactions.filter((row) => row.validationStatus === "DUPLICATE").length,
    missingDateCount: transactions.filter((row) => !row.normalized?.transactionDate).length,
    missingBrokerCount: transactions.filter((row) => !row.normalized?.brokerAccountId).length,
    needsReviewCount: transactions.filter((row) => row.normalized?.dataQualityStatus === "NEEDS_REVIEW").length,
    mappedSecurityCount: mapped.size,
    unmappedSecurityCount: unmapped.size,
    buyCount: transactions.filter((row) => row.normalized?.transactionType === "BUY").length,
    sellCount: transactions.filter((row) => row.normalized?.transactionType === "SELL").length,
  }
  const unresolvedTickers = [...unmapped].sort()
  const reconciliation = reconcile(rows, stockMaster, references, manualMappings)
  const validationComplete = transactions.length > 0
    && summary.invalidRowCount === 0
    && summary.ambiguousRowCount === 0
    && summary.duplicateRowCount === 0
    && (!reconciliation.available || reconciliation.mismatchCount === 0)

  return {
    file,
    rows,
    summary,
    reconciliation,
    duplicateOfImportBatchId: duplicateContext.duplicateOfImportBatchId,
    validationComplete,
    unresolvedTickers,
  }
}
