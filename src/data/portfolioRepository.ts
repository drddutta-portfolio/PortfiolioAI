import type {
  BrokerAccountReference,
  LedgerTransaction,
  MarketPrice,
  PortfolioLedgerSnapshot,
  PortfolioRole,
  SecurityReference,
} from "../features/portfolio/types"
import { supabase } from "../lib/supabase"

export interface MarketPriceProvider {
  loadLatestPrices(securityIds: readonly string[]): Promise<readonly MarketPrice[]>
}

export const unavailableMarketPriceProvider: MarketPriceProvider = {
  loadLatestPrices() { return Promise.resolve([]) },
}

function exact(value: number | null) {
  return value === null ? null : String(value)
}

interface SourceTransactionEvidence {
  readonly quantity?: unknown
  readonly unit_price?: unknown
  readonly source_ticker?: unknown
  readonly source_company?: unknown
}

interface SourceRowEvidence {
  readonly id: string
  readonly importBatchId: string
  readonly normalized: SourceTransactionEvidence
}

function sourceEvidence(value: unknown): SourceTransactionEvidence | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : null
}

function exactEvidence(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null
}

function rawCellText(rawData: unknown, aliases: readonly string[]) {
  if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) return null
  const cells = (rawData as { readonly cells?: unknown }).cells
  if (!cells || typeof cells !== "object" || Array.isArray(cells)) return null
  const normalizedAliases = new Set(aliases.map((alias) => alias.replace(/[^A-Z0-9]/giu, "").toUpperCase()))
  for (const [header, cell] of Object.entries(cells)) {
    const normalizedHeader = header.replace(/[^A-Z0-9]/giu, "").toUpperCase()
    if (!normalizedAliases.has(normalizedHeader) || !cell || typeof cell !== "object" || Array.isArray(cell)) continue
    const value = (cell as { readonly value?: unknown }).value
    if (typeof value === "string" && value.trim()) return value.trim()
    if (typeof value === "number") return String(value)
  }
  return null
}

function chunks<T>(values: readonly T[], size: number) {
  const result: T[][] = []
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size))
  return result
}

function role(value: string): PortfolioRole {
  return value === "CORE" || value === "SATELLITE" || value === "THEMATIC"
    ? value
    : "UNCLASSIFIED"
}

export async function loadPortfolioLedgerSnapshot(
  priceProvider: MarketPriceProvider = unavailableMarketPriceProvider,
): Promise<PortfolioLedgerSnapshot> {
  const portfoliosResult = await supabase
    .from("portfolios")
    .select("id,name,base_currency")
    .eq("is_active", true)
    .order("created_at")
    .limit(1)
    .single()
  if (portfoliosResult.error) throw portfoliosResult.error
  const portfolio = portfoliosResult.data

  const [transactionsResult, securitiesResult, sectorsResult, accountsResult, brokersResult, settingsResult] = await Promise.all([
    supabase.from("transactions").select("id,portfolio_id,security_id,broker_account_id,transaction_type,transaction_date,executed_at,quantity,unit_price,gross_amount,charges,taxes,net_amount,data_quality_status,accounting_status,source_type,source_provider,source_sequence,import_batch_id,import_source_row_id,notes").eq("portfolio_id", portfolio.id).eq("accounting_status", "ACTIVE").order("transaction_date", { nullsFirst: false }).order("executed_at", { nullsFirst: false }).order("created_at"),
    supabase.from("securities").select("id,symbol,name,sector_id,asset_class").eq("is_active", true),
    supabase.from("sectors").select("id,name"),
    supabase.from("broker_accounts").select("id,account_name,broker_id").eq("portfolio_id", portfolio.id).eq("is_active", true),
    supabase.from("brokers").select("id,name").eq("is_active", true),
    supabase.from("portfolio_security_settings").select("security_id,portfolio_role").eq("portfolio_id", portfolio.id),
  ])
  const failure = [transactionsResult, securitiesResult, sectorsResult, accountsResult, brokersResult, settingsResult]
    .find((result) => result.error)
  if (failure?.error) throw failure.error

  const sourceRows = new Map<string, SourceRowEvidence>()
  const sourceRowIds = (transactionsResult.data ?? []).flatMap((transaction) =>
    transaction.import_source_row_id ? [transaction.import_source_row_id] : [])
  for (const idChunk of chunks(sourceRowIds, 100)) {
    const rowsResult = await supabase.from("import_source_rows").select("id,import_batch_id,normalized_data").in("id", idChunk)
    if (rowsResult.error) throw rowsResult.error
    rowsResult.data.forEach((row) => {
      const evidence = sourceEvidence(row.normalized_data)
      if (evidence) sourceRows.set(row.id, { id: row.id, importBatchId: row.import_batch_id, normalized: evidence })
    })
  }
  const transactions: LedgerTransaction[] = (transactionsResult.data ?? []).map((transaction) => {
    const evidence = transaction.import_source_row_id ? sourceRows.get(transaction.import_source_row_id)?.normalized : null
    return {
    id: transaction.id,
    portfolioId: transaction.portfolio_id,
    securityId: transaction.security_id,
    sourceRowId: transaction.import_source_row_id,
    brokerAccountId: transaction.broker_account_id,
    transactionType: transaction.transaction_type,
    transactionDate: transaction.transaction_date,
    executedAt: transaction.executed_at,
    quantity: exactEvidence(evidence?.quantity) ?? exact(transaction.quantity),
    unitPrice: exactEvidence(evidence?.unit_price) ?? exact(transaction.unit_price),
    charges: exact(transaction.charges),
    taxes: exact(transaction.taxes),
    dataQualityStatus: transaction.data_quality_status,
    accountingStatus: transaction.accounting_status,
    sourceType: transaction.source_type,
    sourceProvider: transaction.source_provider,
    grossAmount: exact(transaction.gross_amount),
    netAmount: exact(transaction.net_amount),
    notes: transaction.notes,
    importBatchId: transaction.import_batch_id,
    sourceSequence: transaction.source_sequence,
  }})
  const companyNames = new Map<string, string>()
  transactions.forEach((transaction) => {
    if (!transaction.sourceRowId) return
    const company = sourceRows.get(transaction.sourceRowId)?.normalized.source_company
    if (typeof company === "string" && company.trim()) companyNames.set(transaction.securityId, company.trim())
  })
  const securityIdBySourceTicker = new Map<string, string>()
  transactions.forEach((transaction) => {
    if (!transaction.sourceRowId) return
    const ticker = sourceRows.get(transaction.sourceRowId)?.normalized.source_ticker
    if (typeof ticker === "string" && ticker.trim()) securityIdBySourceTicker.set(ticker.trim().toUpperCase(), transaction.securityId)
  })
  const importBatchIds = [...new Set([...sourceRows.values()].map((row) => row.importBatchId))]
  if (importBatchIds.length) {
    const holdingsResult = await supabase
      .from("import_source_rows")
      .select("raw_data")
      .in("import_batch_id", importBatchIds)
      .eq("raw_data->>record_kind", "HOLDINGS")
    if (holdingsResult.error) throw holdingsResult.error
    holdingsResult.data.forEach((row) => {
      const ticker = rawCellText(row.raw_data, ["TICKER", "SYMBOL", "STOCK", "SCRIP"])
      const company = rawCellText(row.raw_data, ["COMPANY", "COMPANYNAME", "SECURITYNAME", "NAME"])
      const securityId = ticker ? securityIdBySourceTicker.get(ticker.toUpperCase()) : null
      if (securityId && company) companyNames.set(securityId, company)
    })
  }
  const sectors = new Map((sectorsResult.data ?? []).map((sector) => [sector.id, sector.name]))
  const securities: SecurityReference[] = (securitiesResult.data ?? []).map((security) => ({
    id: security.id,
    symbol: security.symbol,
    name: security.name === security.symbol ? companyNames.get(security.id) ?? security.name : security.name,
    sector: security.sector_id ? sectors.get(security.sector_id) ?? null : null,
    assetClass: security.asset_class,
  }))
  const brokers = new Map((brokersResult.data ?? []).map((broker) => [broker.id, broker.name]))
  const brokerAccounts: BrokerAccountReference[] = (accountsResult.data ?? []).map((account) => ({
    id: account.id,
    name: account.account_name,
    brokerName: brokers.get(account.broker_id) ?? "Unknown broker",
  }))
  const securityIds = [...new Set(transactions.map((transaction) => transaction.securityId))]
  const prices = await priceProvider.loadLatestPrices(securityIds)
  const roles = new Map<string, PortfolioRole>((settingsResult.data ?? []).map((setting) => [
    setting.security_id,
    role(setting.portfolio_role),
  ]))
  return {
    portfolio: { id: portfolio.id, name: portfolio.name, currency: portfolio.base_currency },
    transactions,
    securities,
    brokerAccounts,
    roles,
    prices,
  }
}
