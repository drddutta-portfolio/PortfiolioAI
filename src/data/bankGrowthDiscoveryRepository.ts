import { invokeEdgeFunction } from "../lib/edgeFunction"

export interface BankGrowthDiscoveryResult {
  readonly mode: "BANK_GROWTH_CONTRACT_DISCOVERY"
  readonly security: string
  readonly providerCalls: number
  readonly captureId: string
  readonly runId: string
  readonly note: string
}

export async function discoverBankGrowthContract(portfolioId: string, securityId: string) {
  const { data, error } = await invokeEdgeFunction("discover-trendlyne-bank-growth-contract", { portfolioId, securityId, confirmation: "OWNER_CONFIRMED_BANK_GROWTH_DISCOVERY" },
  )
  if (error) throw error
  if (!data || typeof data !== "object") throw new Error("Bank growth discovery returned no result.")
  if ("error" in data && typeof data.error === "string") throw new Error(data.error)
  return data as BankGrowthDiscoveryResult
}
