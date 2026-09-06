import type { Json, TablesInsert } from "../../supabase/types/database.types"
import type {
  AnalyzedSourceRow,
  CellEvidence,
  CommitImportResult,
  DuplicateContext,
  ImportReferences,
  ImportSourceType,
  PreparedImportCommit,
  StageImportInput,
  StageImportResult,
} from "../features/import/types"
import { supabase } from "../lib/supabase"

const INSERT_CHUNK_SIZE = 200
const FILTER_CHUNK_SIZE = 100

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown import persistence error"
}

export async function loadImportReferences(): Promise<ImportReferences> {
  const [portfoliosResult, securitiesResult, identifiersResult, accountsResult, brokersResult] = await Promise.all([
    supabase.from("portfolios").select("id,name").eq("is_active", true).order("name"),
    supabase.from("securities").select("id,symbol,isin,name,exchange").eq("is_active", true).order("symbol"),
    supabase.from("security_identifiers").select("security_id,identifier_type,identifier_value,provider_code"),
    supabase.from("broker_accounts").select("id,portfolio_id,account_name,broker_id").eq("is_active", true),
    supabase.from("brokers").select("id,name,code,api_provider").eq("is_active", true),
  ])

  const failure = [portfoliosResult, securitiesResult, identifiersResult, accountsResult, brokersResult]
    .find((result) => result.error)
  if (failure?.error) throw failure.error

  const brokerById = new Map((brokersResult.data ?? []).map((broker) => [broker.id, broker]))
  return {
    portfolios: (portfoliosResult.data ?? []).map((portfolio) => ({
      id: portfolio.id,
      name: portfolio.name,
    })),
    securities: (securitiesResult.data ?? []).map((security) => ({
      id: security.id,
      symbol: security.symbol,
      isin: security.isin,
      name: security.name,
      exchange: security.exchange,
    })),
    securityIdentifiers: (identifiersResult.data ?? []).map((identifier) => ({
      securityId: identifier.security_id,
      identifierType: identifier.identifier_type,
      identifierValue: identifier.identifier_value,
      providerCode: identifier.provider_code,
    })),
    brokerAccounts: (accountsResult.data ?? []).flatMap((account) => {
      const broker = brokerById.get(account.broker_id)
      return broker ? [{
        id: account.id,
        portfolioId: account.portfolio_id,
        accountName: account.account_name,
        brokerName: broker.name,
        brokerCode: broker.code,
        apiProvider: broker.api_provider,
      }] : []
    }),
  }
}

function chunks<T>(values: readonly T[], size: number) {
  const result: T[][] = []
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size))
  }
  return result
}

export async function loadDuplicateContext(
  portfolioId: string,
  sourceType: ImportSourceType,
  fileSha256: string,
  rawRowHashes: readonly string[],
): Promise<DuplicateContext> {
  const batchResult = await supabase
    .from("import_batches")
    .select("id")
    .eq("portfolio_id", portfolioId)
    .eq("source_type", sourceType)
    .eq("file_sha256", fileSha256)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (batchResult.error) throw batchResult.error

  const priorRowHashes = new Set<string>()
  const uniqueHashes = [...new Set(rawRowHashes)]
  for (const hashChunk of chunks(uniqueHashes, FILTER_CHUNK_SIZE)) {
    const rowsResult = await supabase
      .from("import_source_rows")
      .select("raw_row_hash")
      .eq("portfolio_id", portfolioId)
      .in("raw_row_hash", hashChunk)
    if (rowsResult.error) throw rowsResult.error
    rowsResult.data.forEach((row) => {
      if (row.raw_row_hash) priorRowHashes.add(row.raw_row_hash)
    })
  }

  return {
    duplicateOfImportBatchId: batchResult.data?.id ?? null,
    priorRowHashes,
  }
}

function cellEvidenceJson(cell: CellEvidence): Json {
  return {
    data_type: cell.dataType,
    value: cell.value,
    formatted_text: cell.formattedText,
    formula: cell.formula,
  }
}

function rawDataJson(row: AnalyzedSourceRow): Json {
  const cells: Record<string, Json> = {}
  Object.entries(row.source.cells).forEach(([header, cell]) => {
    cells[header] = cellEvidenceJson(cell)
  })
  return {
    original_sheet_name: row.source.sheetName,
    original_row_number: row.source.originalRowNumber,
    record_kind: row.source.sheetKind,
    cells,
  }
}

function normalizedDataJson(row: AnalyzedSourceRow): Json {
  if (!row.normalized) {
    return {
      record_kind: row.source.sheetKind,
      accounting_authority: row.source.sheetKind === "HOLDINGS"
        ? "RECONCILIATION_ONLY"
        : "IDENTITY_ENRICHMENT_ONLY",
    }
  }
  return {
    record_kind: "TRANSACTION",
    transaction_type: row.normalized.transactionType,
    transaction_date: row.normalized.transactionDate,
    broker_account_id: row.normalized.brokerAccountId,
    security_id: row.normalized.securityId,
    source_ticker: row.normalized.sourceTicker,
    source_company: row.normalized.sourceCompany,
    source_broker: row.normalized.sourceBroker,
    quantity: row.normalized.quantity,
    unit_price: row.normalized.unitPrice,
    data_quality_status: row.normalized.dataQualityStatus,
    security_resolution_method: row.securityResolution?.method ?? "UNRESOLVED",
    source_isin: row.securityResolution?.sourceIsin ?? null,
  }
}

function sourceRowInsert(
  batchId: string,
  portfolioId: string,
  row: AnalyzedSourceRow,
  batchRowNumber: number,
): TablesInsert<"import_source_rows"> {
  return {
    import_batch_id: batchId,
    portfolio_id: portfolioId,
    row_number: batchRowNumber,
    raw_data: rawDataJson(row),
    raw_row_hash: row.source.rawRowHash,
    normalized_data: normalizedDataJson(row),
    resolved_security_id: row.normalized?.securityId ?? null,
    validation_status: row.validationStatus,
    validation_errors: [...row.validationErrors],
    validation_warnings: [...row.validationWarnings],
    duplicate_status: row.duplicateStatus,
  }
}

export async function stageImport(input: StageImportInput): Promise<StageImportResult> {
  const { analysis, portfolioId, sourceType } = input
  const batchInsert: TablesInsert<"import_batches"> = {
    portfolio_id: portfolioId,
    source_type: sourceType,
    source_provider: sourceType === "PORTFOLIO_HISTORICAL_XLSX" ? "LEGACY_WORKBOOK" : "GENERIC_CSV",
    file_name: analysis.file.fileName,
    file_sha256: analysis.file.fileSha256,
    file_format: analysis.file.fileFormat,
    duplicate_of_import_batch_id: analysis.duplicateOfImportBatchId,
    mapping_version: "PORTFOLIOAI_IMPORT_V1",
    mapping_config: {
      recognized_sheets: analysis.file.sheets
        .filter((sheet) => sheet.kind !== "UNSUPPORTED")
        .map((sheet) => ({ original_name: sheet.originalName, kind: sheet.kind })),
      holdings_accounting_authority: false,
      formula_values_authoritative: false,
      security_match_order: ["ISIN", "IDENTIFIER", "SYMBOL", "MANUAL"],
    },
    status: "UPLOADED",
  }

  const batchResult = await supabase
    .from("import_batches")
    .insert(batchInsert)
    .select("id")
    .single()
  if (batchResult.error) throw batchResult.error

  const batchId = batchResult.data.id
  try {
    const sourceRows = analysis.rows.map((row, index) =>
      sourceRowInsert(batchId, portfolioId, row, index + 1))
    for (const rowChunk of chunks(sourceRows, INSERT_CHUNK_SIZE)) {
      const result = await supabase.from("import_source_rows").insert(rowChunk)
      if (result.error) throw result.error
    }

    const status = analysis.validationComplete ? "VALIDATED" : "PREVIEWED"
    const updateResult = await supabase
      .from("import_batches")
      .update({
        status,
        total_row_count: analysis.rows.length,
        valid_row_count: analysis.summary.validRowCount,
        invalid_row_count: analysis.summary.invalidRowCount,
        ambiguous_row_count: analysis.summary.ambiguousRowCount,
        duplicate_row_count: analysis.summary.duplicateRowCount,
      })
      .eq("id", batchId)
      .eq("portfolio_id", portfolioId)
    if (updateResult.error) throw updateResult.error
    return { importBatchId: batchId, status }
  } catch (error) {
    const failureResult = await supabase
      .from("import_batches")
      .update({
        status: "FAILED",
        failure_details: { stage: "SOURCE_ROW_STAGING", message: errorMessage(error) },
      })
      .eq("id", batchId)
      .eq("portfolio_id", portfolioId)
    if (failureResult.error) {
      console.error("Import staging failed and the batch could not be marked FAILED", {
        batchId,
        persistenceError: failureResult.error.message,
      })
    }
    throw error
  }
}

export async function prepareImportCommit(
  importBatchId: string,
  portfolioId: string,
): Promise<PreparedImportCommit> {
  const approvedSourceRowIds = await loadApprovedTransactionSourceRowIds(importBatchId, portfolioId)

  const batchResult = await supabase
    .from("import_batches")
    .update({ status: "AWAITING_CONFIRMATION" })
    .eq("id", importBatchId)
    .eq("portfolio_id", portfolioId)
    .eq("status", "VALIDATED")
    .select("id,status")
    .single()
  if (batchResult.error) throw batchResult.error
  if (batchResult.data.status !== "AWAITING_CONFIRMATION") {
    throw new Error("Import batch did not enter AWAITING_CONFIRMATION.")
  }

  return { importBatchId, status: "AWAITING_CONFIRMATION", approvedSourceRowIds }
}

async function loadApprovedTransactionSourceRowIds(importBatchId: string, portfolioId: string) {
  const rowsResult = await supabase
    .from("import_source_rows")
    .select("id,row_number,normalized_data")
    .eq("import_batch_id", importBatchId)
    .eq("portfolio_id", portfolioId)
    .eq("validation_status", "VALID")
    .order("row_number")
  if (rowsResult.error) throw rowsResult.error

  const approvedSourceRowIds = (rowsResult.data ?? []).flatMap((row) => {
    const normalized = row.normalized_data
    return normalized
      && typeof normalized === "object"
      && !Array.isArray(normalized)
      && normalized.record_kind === "TRANSACTION"
      ? [row.id]
      : []
  })
  if (approvedSourceRowIds.length === 0) {
    throw new Error("No validated transaction rows are available for commit confirmation.")
  }
  return approvedSourceRowIds
}

export async function resumePreparedImportCommit(
  importBatchId: string,
  portfolioId: string,
): Promise<PreparedImportCommit> {
  const batchResult = await supabase
    .from("import_batches")
    .select("id,status")
    .eq("id", importBatchId)
    .eq("portfolio_id", portfolioId)
    .eq("status", "AWAITING_CONFIRMATION")
    .single()
  if (batchResult.error) throw batchResult.error
  if (batchResult.data.status !== "AWAITING_CONFIRMATION") {
    throw new Error("Import batch is not awaiting confirmation.")
  }

  const approvedSourceRowIds = await loadApprovedTransactionSourceRowIds(importBatchId, portfolioId)
  return { importBatchId, status: "AWAITING_CONFIRMATION", approvedSourceRowIds }
}

function parseCommitResult(value: Json): CommitImportResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Trusted import commit returned an invalid response.")
  }
  const rawTransactionIds = value.transaction_ids
  const transactionIds = Array.isArray(rawTransactionIds)
    ? rawTransactionIds.filter((id): id is string => typeof id === "string")
    : null
  if (
    value.status !== "COMMITTED"
    || typeof value.import_batch_id !== "string"
    || typeof value.transaction_count !== "number"
    || !Array.isArray(rawTransactionIds)
    || !transactionIds
    || transactionIds.length !== rawTransactionIds.length
    || typeof value.already_committed !== "boolean"
  ) {
    throw new Error("Trusted import commit returned an unexpected response shape.")
  }
  return {
    importBatchId: value.import_batch_id,
    status: value.status,
    transactionCount: value.transaction_count,
    transactionIds,
    alreadyCommitted: value.already_committed,
  }
}

export async function commitImportBatch(
  prepared: PreparedImportCommit,
): Promise<CommitImportResult> {
  const result = await supabase.rpc("commit_import_batch_v1", {
    p_import_batch_id: prepared.importBatchId,
    p_approved_source_row_ids: [...prepared.approvedSourceRowIds],
  })
  if (result.error) throw result.error
  return parseCommitResult(result.data)
}
