import Decimal from "decimal.js"
import type {
  BrokerAccountReference,
  LedgerTransaction,
  MarketPrice,
  HoldingsSnapshotEvidence,
  PortfolioLedgerSnapshot,
  PortfolioRole,
  PortfolioTheme,
  PositionSettings,
  SecurityReference,
} from "../features/portfolio/types"
import { supabase } from "../lib/supabase"

export interface MarketPriceProvider {
  loadLatestPrices(securityIds: readonly string[]): Promise<readonly MarketPrice[]>
}

export const unavailableMarketPriceProvider: MarketPriceProvider = {
  loadLatestPrices() { return Promise.resolve([]) },
}

function exact(value: unknown) {
  return typeof value === "number" || typeof value === "string" ? String(value) : null
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

interface RawCellEvidence {
  readonly data_type?: unknown
  readonly value?: unknown
  readonly formula?: unknown
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

function rawCell(rawData: unknown, aliases: readonly string[]): RawCellEvidence | null {
  if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) return null
  const cells = (rawData as { readonly cells?: unknown }).cells
  if (!cells || typeof cells !== "object" || Array.isArray(cells)) return null
  const normalizedAliases = new Set(aliases.map((alias) => alias.replace(/[^A-Z0-9]/giu, "").toUpperCase()))
  for (const [header, value] of Object.entries(cells)) {
    if (!normalizedAliases.has(header.replace(/[^A-Z0-9]/giu, "").toUpperCase())) continue
    return value && typeof value === "object" && !Array.isArray(value) ? value as RawCellEvidence : null
  }
  return null
}

function snapshotDecimal(rawData: unknown, aliases: readonly string[]) {
  const cell = rawCell(rawData, aliases)
  if (!cell || cell.data_type === "error" || (typeof cell.value !== "string" && typeof cell.value !== "number")) return null
  const normalized = String(cell.value).trim().replaceAll(",", "").replace(/^₹/u, "").replace(/%$/u, "")
  if (!normalized || /^(?:#|N\/A|NA|NULL|UNAVAILABLE)/iu.test(normalized)) return null
  try {
    return new Decimal(normalized).toFixed()
  } catch {
    return null
  }
}

export function holdingsSnapshotEvidence(row: { readonly id: string; readonly import_batch_id: string; readonly raw_data: unknown }): HoldingsSnapshotEvidence | null {
  const raw = row.raw_data
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const data = raw as { readonly original_sheet_name?: unknown; readonly original_row_number?: unknown; readonly cells?: unknown }
  const metrics = {
    averageCost: snapshotDecimal(raw, ["AVG BUY PRICE", "AVERAGE BUY PRICE", "AVG PRICE", "AVERAGE PRICE", "BUY AVG PRICE", "AVG COST"]),
    investedValue: snapshotDecimal(raw, ["INVESTED VALUE", "INVESTMENT VALUE", "INVESTED AMOUNT", "COST VALUE", "COST BASIS"]),
    currentPrice: snapshotDecimal(raw, ["CURRENT PRICE", "CMP", "LTP", "MARKET PRICE"]),
    currentValue: snapshotDecimal(raw, ["CURRENT VALUE", "MARKET VALUE"]),
    unrealisedPnl: snapshotDecimal(raw, ["UNREALISED P&L", "UNREALIZED P&L", "UNREALISED PNL", "UNREALIZED PNL"]),
    unrealisedPnlPercent: snapshotDecimal(raw, ["P&L %", "PNL %", "UNREALISED %", "UNREALIZED %", "UNREALISED P&L %", "UNREALIZED P&L %", "UNREALISED PNL %"]),
    realisedPnl: snapshotDecimal(raw, ["REALISED P&L", "REALIZED P&L", "REALISED PNL", "REALIZED PNL"]),
  }
  if (Object.values(metrics).every((value) => value === null)) return null
  const cells = data.cells && typeof data.cells === "object" && !Array.isArray(data.cells)
    ? Object.values(data.cells) : []
  return {
    sourceRowId: row.id,
    importBatchId: row.import_batch_id,
    sourceLabel: "Original XLSX HOLDINGS snapshot",
    originalSheetName: typeof data.original_sheet_name === "string" ? data.original_sheet_name : "HOLDINGS",
    originalRowNumber: typeof data.original_row_number === "number" ? data.original_row_number : 0,
    ...metrics,
    containsFormulaResults: cells.some((cell) => cell && typeof cell === "object" && !Array.isArray(cell) && typeof (cell as RawCellEvidence).formula === "string"),
  }
}

function chunks<T>(values: readonly T[], size: number) {
  const result: T[][] = []
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size))
  return result
}

export function canonicalSourceTicker(value: string) {
  return value.trim().toUpperCase().replace(/^(?:NSE|BSE):/u, "").trim()
}

function role(value: string): PortfolioRole {
  return value === "CORE" || value === "SATELLITE" || value === "THEMATIC" || value === "ETF" || value === "OTHER"
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

  const [transactionsResult, securitiesResult, sectorsResult, industriesResult, accountsResult, brokersResult, settingsResult, themesResult, membershipsResult] = await Promise.all([
    supabase.from("transactions").select("id,portfolio_id,security_id,broker_account_id,transaction_type,transaction_date,executed_at,quantity,unit_price,gross_amount,charges,taxes,net_amount,data_quality_status,accounting_status,source_type,source_provider,source_sequence,import_batch_id,import_source_row_id,notes").eq("portfolio_id", portfolio.id).eq("accounting_status", "ACTIVE").order("transaction_date", { nullsFirst: false }).order("executed_at", { nullsFirst: false }).order("created_at"),
    supabase.from("securities").select("id,symbol,name,sector_id,industry_id,asset_class,exchange,isin,instrument_type,series").eq("is_active", true),
    supabase.from("sectors").select("id,name"),
    supabase.from("industries").select("id,name"),
    supabase.from("broker_accounts").select("id,account_name,broker_id").eq("portfolio_id", portfolio.id).eq("is_active", true),
    supabase.from("brokers").select("id,name").eq("is_active", true),
    supabase.from("portfolio_security_settings").select("id,security_id,portfolio_role,target_weight,minimum_weight,maximum_weight,priority,is_watchlisted,is_frozen,investment_horizon,notes").eq("portfolio_id", portfolio.id),
    supabase.from("themes").select("id,name,description,max_allocation,priority,is_active").eq("portfolio_id", portfolio.id).order("priority", { nullsFirst: false }).order("name"),
    supabase.from("theme_securities").select("theme_id,security_id").eq("portfolio_id", portfolio.id),
  ])
  const failure = [transactionsResult, securitiesResult, sectorsResult, industriesResult, accountsResult, brokersResult, settingsResult, themesResult, membershipsResult]
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
  const securityIdBySourceTicker = new Map<string, string>((securitiesResult.data ?? []).map((security) => [security.symbol.toUpperCase(), security.id]))
  transactions.forEach((transaction) => {
    if (!transaction.sourceRowId) return
    const ticker = sourceRows.get(transaction.sourceRowId)?.normalized.source_ticker
    if (typeof ticker === "string" && ticker.trim()) securityIdBySourceTicker.set(canonicalSourceTicker(ticker), transaction.securityId)
  })
  const importBatchIds = [...new Set([...sourceRows.values()].map((row) => row.importBatchId))]
  const snapshotEvidence = new Map<string, HoldingsSnapshotEvidence>()
  if (importBatchIds.length) {
    const holdingsResult = await supabase
      .from("import_source_rows")
      .select("id,import_batch_id,raw_data")
      .in("import_batch_id", importBatchIds)
      .eq("raw_data->>record_kind", "HOLDINGS")
      .order("created_at", { ascending: false })
    if (holdingsResult.error) throw holdingsResult.error
    holdingsResult.data.forEach((row) => {
      const ticker = rawCellText(row.raw_data, ["TICKER", "SYMBOL", "STOCK", "SCRIP"])
      const company = rawCellText(row.raw_data, ["COMPANY", "COMPANYNAME", "SECURITYNAME", "NAME"])
      const securityId = ticker ? securityIdBySourceTicker.get(canonicalSourceTicker(ticker)) : null
      if (securityId && company) companyNames.set(securityId, company)
      const evidence = holdingsSnapshotEvidence(row)
      if (securityId && evidence && !snapshotEvidence.has(securityId)) snapshotEvidence.set(securityId, evidence)
    })
  }
  const sectors = new Map((sectorsResult.data ?? []).map((sector) => [sector.id, sector.name]))
  const industries = new Map((industriesResult.data ?? []).map((industry) => [industry.id, industry.name]))
  const securities: SecurityReference[] = (securitiesResult.data ?? []).map((security) => ({
    id: security.id,
    symbol: security.symbol,
    name: security.name === security.symbol ? companyNames.get(security.id) ?? security.name : security.name,
    sector: security.sector_id ? sectors.get(security.sector_id) ?? null : null,
    industry: security.industry_id ? industries.get(security.industry_id) ?? null : null,
    assetClass: security.asset_class,
    exchange: security.exchange,
    isin: security.isin,
    instrumentType: security.instrument_type,
    series: security.series,
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
  const settings = new Map<string, PositionSettings>((settingsResult.data ?? []).map((setting) => [setting.security_id, {
    id: setting.id,
    portfolioRole: role(setting.portfolio_role) as Exclude<PortfolioRole, "UNCLASSIFIED">,
    targetWeight: exact(setting.target_weight),
    minimumWeight: exact(setting.minimum_weight),
    maximumWeight: exact(setting.maximum_weight),
    priority: setting.priority,
    isWatchlisted: setting.is_watchlisted,
    isFrozen: setting.is_frozen,
    investmentHorizon: setting.investment_horizon,
    notes: setting.notes,
  }]))
  const themes: PortfolioTheme[] = (themesResult.data ?? []).map((theme) => ({
    id: theme.id,
    name: theme.name,
    description: theme.description,
    maxAllocation: exact(theme.max_allocation),
    priority: theme.priority,
    isActive: theme.is_active,
  }))
  const themeIdsBySecurity = new Map<string, string[]>()
  ;(membershipsResult.data ?? []).forEach((membership) => {
    themeIdsBySecurity.set(membership.security_id, [...(themeIdsBySecurity.get(membership.security_id) ?? []), membership.theme_id])
  })
  return {
    portfolio: { id: portfolio.id, name: portfolio.name, currency: portfolio.base_currency },
    transactions,
    securities,
    brokerAccounts,
    roles,
    settings,
    themes,
    themeIdsBySecurity,
    snapshotEvidence,
    prices,
  }
}
