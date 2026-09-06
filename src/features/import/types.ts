import type { Json } from "../../../supabase/types/database.types"

export type ImportSourceType = "PORTFOLIO_HISTORICAL_XLSX" | "GENERIC_CSV"
export type FileFormat = "XLSX" | "CSV"
export type SheetKind = "TRANSACTIONS" | "HOLDINGS" | "STOCK_MASTER" | "UNSUPPORTED"
export type TransactionType = "BUY" | "SELL"
export type DataQualityStatus =
  | "COMPLETE"
  | "MISSING_DATE"
  | "MISSING_BROKER"
  | "MISSING_DATE_AND_BROKER"
  | "NEEDS_REVIEW"
export type ValidationStatus =
  | "VALID"
  | "INVALID"
  | "AMBIGUOUS"
  | "DUPLICATE"
  | "IGNORED"
export type DuplicateStatus =
  | "NOT_DUPLICATE"
  | "POSSIBLE_DUPLICATE"
  | "CONFIRMED_DUPLICATE"

export interface CellEvidence {
  readonly dataType: "blank" | "string" | "number" | "boolean" | "date" | "error"
  readonly value: string | number | boolean | null
  readonly formattedText: string | null
  readonly formula: string | null
}

export interface ParsedSourceRow {
  readonly sheetName: string
  readonly sheetKind: SheetKind
  readonly originalRowNumber: number
  readonly cells: Readonly<Record<string, CellEvidence>>
  readonly rawRowHash: string
}

export interface ParsedSheetSummary {
  readonly originalName: string
  readonly kind: SheetKind
  readonly headerRowNumber: number | null
  readonly dataRowCount: number
}

export interface ParsedImportFile {
  readonly fileName: string
  readonly fileFormat: FileFormat
  readonly fileSha256: string
  readonly sheets: readonly ParsedSheetSummary[]
  readonly rows: readonly ParsedSourceRow[]
}

export interface PortfolioReference {
  readonly id: string
  readonly name: string
}

export interface SecurityReference {
  readonly id: string
  readonly symbol: string
  readonly isin: string | null
  readonly name: string
  readonly exchange: string
}

export interface SecurityIdentifierReference {
  readonly securityId: string
  readonly identifierType: string
  readonly identifierValue: string
  readonly providerCode: string
}

export interface BrokerAccountReference {
  readonly id: string
  readonly portfolioId: string
  readonly accountName: string
  readonly brokerName: string
  readonly brokerCode: string
  readonly apiProvider: string | null
}

export interface ImportReferences {
  readonly portfolios: readonly PortfolioReference[]
  readonly securities: readonly SecurityReference[]
  readonly securityIdentifiers: readonly SecurityIdentifierReference[]
  readonly brokerAccounts: readonly BrokerAccountReference[]
}

export interface StockMasterIdentity {
  readonly sourceSymbol: string
  readonly sourceCompany: string | null
  readonly isin: string | null
}

export interface SecurityResolution {
  readonly securityId: string | null
  readonly method: "ISIN" | "IDENTIFIER" | "SYMBOL" | "MANUAL" | "UNRESOLVED"
  readonly candidates: readonly string[]
  readonly sourceIsin: string | null
}

export interface NormalizedTransaction {
  readonly transactionType: TransactionType | null
  readonly transactionDate: string | null
  readonly brokerAccountId: string | null
  readonly securityId: string | null
  readonly sourceTicker: string | null
  readonly sourceCompany: string | null
  readonly sourceBroker: string | null
  readonly quantity: string | null
  readonly unitPrice: string | null
  readonly dataQualityStatus: DataQualityStatus
}

export interface AnalyzedSourceRow {
  readonly source: ParsedSourceRow
  readonly normalized: NormalizedTransaction | null
  readonly securityResolution: SecurityResolution | null
  readonly validationStatus: ValidationStatus
  readonly validationErrors: readonly string[]
  readonly validationWarnings: readonly string[]
  readonly duplicateStatus: DuplicateStatus | null
}

export interface ReconciliationRow {
  readonly identity: string
  readonly label: string
  readonly transactionQuantity: string | null
  readonly holdingsQuantity: string | null
  readonly difference: string | null
  readonly matches: boolean
}

export interface ReconciliationResult {
  readonly available: boolean
  readonly holdingsRowCount: number
  readonly mismatchCount: number
  readonly rows: readonly ReconciliationRow[]
}

export interface ValidationSummary {
  readonly parsedTransactionCount: number
  readonly validRowCount: number
  readonly invalidRowCount: number
  readonly ambiguousRowCount: number
  readonly duplicateRowCount: number
  readonly missingDateCount: number
  readonly missingBrokerCount: number
  readonly needsReviewCount: number
  readonly mappedSecurityCount: number
  readonly unmappedSecurityCount: number
  readonly buyCount: number
  readonly sellCount: number
}

export interface ImportAnalysis {
  readonly file: ParsedImportFile
  readonly rows: readonly AnalyzedSourceRow[]
  readonly summary: ValidationSummary
  readonly reconciliation: ReconciliationResult
  readonly duplicateOfImportBatchId: string | null
  readonly validationComplete: boolean
  readonly unresolvedTickers: readonly string[]
}

export interface DuplicateContext {
  readonly duplicateOfImportBatchId: string | null
  readonly priorRowHashes: ReadonlySet<string>
}

export interface StageImportInput {
  readonly portfolioId: string
  readonly sourceType: ImportSourceType
  readonly analysis: ImportAnalysis
}

export interface StageImportResult {
  readonly importBatchId: string
  readonly status: "VALIDATED" | "PREVIEWED"
}

export interface PreparedImportCommit {
  readonly importBatchId: string
  readonly status: "AWAITING_CONFIRMATION"
  readonly approvedSourceRowIds: readonly string[]
}

export interface CommitImportResult {
  readonly importBatchId: string
  readonly status: "COMMITTED"
  readonly transactionCount: number
  readonly transactionIds: readonly string[]
  readonly alreadyCommitted: boolean
}

export function toJsonObject(value: Readonly<Record<string, Json>>): Json {
  return value
}
