import { invokeEdgeFunctionUnknown, unknownErrorMessage, unknownRecord } from "../lib/edgeFunction"

export interface BankGrowthDiscoveryResult {
  readonly mode: "BANK_GROWTH_CONTRACT_DISCOVERY"
  readonly security: string
  readonly providerCalls: number
  readonly captureId: string
  readonly runId: string
  readonly note: string
}

export async function discoverBankGrowthContract(portfolioId: string, securityId: string) {
  const { data, error } = await invokeEdgeFunctionUnknown("discover-trendlyne-bank-growth-contract", { portfolioId, securityId, confirmation: "OWNER_CONFIRMED_BANK_GROWTH_DISCOVERY" })
  if (error) throw new Error(unknownErrorMessage(error, "Bank growth discovery failed."))
  const record = unknownRecord(data)
  if (!record) throw new Error("Bank growth discovery returned no result.")
  if (typeof record.error === "string") throw new Error(record.error)
  return data as BankGrowthDiscoveryResult
}
