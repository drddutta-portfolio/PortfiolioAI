import { supabase } from "../lib/supabase"

function exact(value: number | null) { return value === null ? null : String(value) }

export interface TransactionListRow {
  readonly id: string; readonly portfolioId: string; readonly securityId: string; readonly symbol: string; readonly company: string
  readonly brokerAccountId: string | null; readonly broker: string | null; readonly account: string | null
  readonly transactionType: string; readonly transactionDate: string | null; readonly quantity: string | null; readonly unitPrice: string | null
  readonly grossAmount: string | null; readonly charges: string | null; readonly taxes: string | null; readonly sourceType: string
  readonly sourceProvider: string | null; readonly dataQualityStatus: string; readonly accountingStatus: string
  readonly importBatchId: string | null; readonly importSourceRowId: string | null; readonly createdAt: string; readonly notes: string | null
  readonly correctedFromTransactionId: string | null; readonly correctionReason: string | null; readonly supersededAt: string | null
}

export interface TransactionReferences {
  readonly portfolios: readonly { id: string; name: string }[]
  readonly accounts: readonly { id: string; portfolioId: string; label: string }[]
  readonly securities: readonly { id: string; symbol: string; name: string; exchange: string; isin: string | null; instrumentType: string }[]
}

export async function loadTransactions(): Promise<{ rows: readonly TransactionListRow[]; references: TransactionReferences }> {
  const [transactions, portfolios, accounts, brokers, securities] = await Promise.all([
    supabase.from("transactions").select("id,portfolio_id,security_id,broker_account_id,transaction_type,transaction_date,quantity,unit_price,gross_amount,charges,taxes,source_type,source_provider,data_quality_status,accounting_status,import_batch_id,import_source_row_id,created_at,notes,corrected_from_transaction_id,correction_reason,superseded_at").order("transaction_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }),
    supabase.from("portfolios").select("id,name").eq("is_active", true).order("name"),
    supabase.from("broker_accounts").select("id,portfolio_id,broker_id,account_name").eq("is_active", true).order("account_name"),
    supabase.from("brokers").select("id,name"),
    supabase.from("securities").select("id,symbol,name,exchange,isin,instrument_type").eq("is_active", true).order("symbol"),
  ])
  const failure = [transactions, portfolios, accounts, brokers, securities].find((result) => result.error)
  if (failure?.error) throw failure.error
  const securityMap = new Map((securities.data ?? []).map((security) => [security.id, security]))
  const brokerMap = new Map((brokers.data ?? []).map((broker) => [broker.id, broker.name]))
  const accountMap = new Map((accounts.data ?? []).map((account) => [account.id, account]))
  return {
    rows: (transactions.data ?? []).map((transaction) => {
      const security = securityMap.get(transaction.security_id)
      const account = transaction.broker_account_id ? accountMap.get(transaction.broker_account_id) : null
      return { id: transaction.id, portfolioId: transaction.portfolio_id, securityId: transaction.security_id,
        symbol: security?.symbol ?? "Unknown", company: security?.name ?? "Unknown security",
        brokerAccountId: transaction.broker_account_id, broker: account ? brokerMap.get(account.broker_id) ?? null : null,
        account: account?.account_name ?? null, transactionType: transaction.transaction_type, transactionDate: transaction.transaction_date,
        quantity: exact(transaction.quantity), unitPrice: exact(transaction.unit_price), grossAmount: exact(transaction.gross_amount),
        charges: exact(transaction.charges), taxes: exact(transaction.taxes), sourceType: transaction.source_type,
        sourceProvider: transaction.source_provider, dataQualityStatus: transaction.data_quality_status,
        accountingStatus: transaction.accounting_status, importBatchId: transaction.import_batch_id,
        importSourceRowId: transaction.import_source_row_id, createdAt: transaction.created_at, notes: transaction.notes,
        correctedFromTransactionId: transaction.corrected_from_transaction_id, correctionReason: transaction.correction_reason,
        supersededAt: transaction.superseded_at }
    }),
    references: {
      portfolios: portfolios.data ?? [],
      accounts: (accounts.data ?? []).map((account) => ({ id: account.id, portfolioId: account.portfolio_id, label: `${brokerMap.get(account.broker_id) ?? "Broker"} · ${account.account_name}` })),
      securities: (securities.data ?? []).map((security) => ({ id: security.id, symbol: security.symbol, name: security.name,
        exchange: security.exchange, isin: security.isin, instrumentType: security.instrument_type })),
    },
  }
}

export interface ManualSecurityInput {
  readonly portfolioId: string; readonly exchange: "NSE" | "BSE"; readonly symbol: string; readonly name: string
  readonly assetClass: "EQUITY" | "ETF"; readonly instrumentType: "STOCK" | "ETF"; readonly isin: string | null
  readonly series: string | null; readonly idempotencyKey: string
}

export async function createManualSecurity(input: ManualSecurityInput) {
  const nullableText = (value: string | null) => value as unknown as string
  const result = await supabase.rpc("create_manual_security_v1", { p_portfolio_id: input.portfolioId, p_exchange: input.exchange,
    p_symbol: input.symbol, p_name: input.name, p_asset_class: input.assetClass, p_instrument_type: input.instrumentType,
    p_isin: nullableText(input.isin), p_series: nullableText(input.series), p_idempotency_key: input.idempotencyKey })
  if (result.error) throw result.error
  return result.data as { readonly security_id: string; readonly mapping_status: string }
}

export interface TransactionCorrectionInput extends Omit<ManualTransactionInput, "idempotencyKey" | "brokerAccountId" | "transactionDate"> {
  readonly originalTransactionId: string; readonly brokerAccountId: string | null; readonly transactionDate: string | null
  readonly reason: string; readonly idempotencyKey: string
}

export async function correctTransaction(input: TransactionCorrectionInput) {
  const numeric = (value: string) => value as unknown as number
  const nullableNumeric = (value: string | null) => value as unknown as number
  const nullableText = (value: string | null) => value as unknown as string
  const nullableUuid = (value: string | null) => value as unknown as string
  const result = await supabase.rpc("correct_transaction_v1", { p_original_transaction_id: input.originalTransactionId,
    p_portfolio_id: input.portfolioId, p_broker_account_id: nullableUuid(input.brokerAccountId), p_security_id: input.securityId,
    p_transaction_type: input.transactionType, p_transaction_date: nullableText(input.transactionDate), p_quantity: numeric(input.quantity),
    p_unit_price: numeric(input.unitPrice), p_total_charges: nullableNumeric(input.totalCharges), p_notes: nullableText(input.notes),
    p_reason: input.reason, p_idempotency_key: input.idempotencyKey })
  if (result.error) throw result.error
  return result.data
}

export interface ManualTransactionInput {
  readonly portfolioId: string; readonly brokerAccountId: string; readonly securityId: string; readonly transactionType: "BUY" | "SELL"
  readonly transactionDate: string; readonly quantity: string; readonly unitPrice: string; readonly totalCharges: string | null
  readonly notes: string | null; readonly idempotencyKey: string
}

export async function createManualTransaction(input: ManualTransactionInput) {
  // Supabase's generated PostgreSQL numeric type is `number`, but exact decimal
  // strings must cross the wire unchanged. This cast changes only TypeScript's view.
  const numeric = (value: string) => value as unknown as number
  const nullableNumeric = (value: string | null) => value as unknown as number
  const nullableText = (value: string | null) => value as unknown as string
  const result = await supabase.rpc("create_manual_transaction_v1", {
    p_portfolio_id: input.portfolioId, p_broker_account_id: input.brokerAccountId, p_security_id: input.securityId,
    p_transaction_type: input.transactionType, p_transaction_date: input.transactionDate, p_quantity: numeric(input.quantity),
    p_unit_price: numeric(input.unitPrice), p_total_charges: nullableNumeric(input.totalCharges), p_notes: nullableText(input.notes), p_idempotency_key: input.idempotencyKey,
  })
  if (result.error) throw result.error
  return result.data
}
