import { readFile } from "node:fs/promises"
import { execFileSync } from "node:child_process"
import { createServer } from "vite"
import { assertProgramAA2ProviderResult } from "./program-a-a2-provider-result.mjs"

const [mode, snapshotPath, approvedStage, approvedPlanId, confirmationToken] = process.argv.slice(2)
if (!mode || !snapshotPath || !["PLAN", "EXECUTE_STAGE"].includes(mode)) throw new Error("Usage: runner PLAN <snapshot> | EXECUTE_STAGE <snapshot> <A2A|A2B|A2C> <plan-id> <confirmation-token>")

const localUrl = process.env.PROGRAM_A_LOCAL_SUPABASE_URL ?? "http://127.0.0.1:54321"
const server = await createServer({ appType: "custom", server: { middlewareMode: true }, logLevel: "error" })
try {
  const cacheModule = await server.ssrLoadModule("/src/features/research/programAA1CacheMaterializer.ts")
  const a2Module = await server.ssrLoadModule("/src/features/research/programAA2PilotController.ts")
  const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"))
  const materialized = cacheModule.materializeProgramAA1CacheBaseline(snapshot)
  const currentPlan = await a2Module.buildProgramAA2Plan(materialized)
  if (mode === "PLAN") {
    process.stdout.write(`${JSON.stringify(currentPlan, null, 2)}\n`)
    process.exitCode = 0
  } else {
    if (!approvedStage || !approvedPlanId || !confirmationToken) throw new Error("EXECUTE_STAGE requires the approved stage, plan id, and exact confirmation token.")
    const accessToken = process.env.PROGRAM_A_LOCAL_ACCESS_TOKEN
    const anonKey = process.env.PROGRAM_A_LOCAL_ANON_KEY
    const classificationToken = process.env.PROGRAM_A_LOCAL_CLASSIFICATION_TOKEN
    if (!accessToken || !anonKey || !classificationToken) throw new Error("EXECUTE requires PROGRAM_A_LOCAL_ACCESS_TOKEN, PROGRAM_A_LOCAL_ANON_KEY, and PROGRAM_A_LOCAL_CLASSIFICATION_TOKEN.")
    const approvedPlan = { ...currentPlan, planId: approvedPlanId }
    const invoke = async (name, body, headers = {}, includeAuthorization = true) => {
      const authHeaders = includeAuthorization ? { Authorization: `Bearer ${accessToken}` } : {}
      const response = await fetch(`${localUrl}/functions/v1/${name}`, { method: "POST", headers: { "Content-Type": "application/json", apikey: anonKey, ...authHeaders, ...headers }, body: JSON.stringify(body) })
      const payload = await response.json()
      if (!response.ok || payload.error) {
        const error = new Error(payload.code ?? payload.error ?? "CAPABILITY_MISMATCH")
        error.providerCalls = Number(payload.providerCalls ?? 0)
        error.localWrites = Number(payload.localWrites ?? 0)
        throw error
      }
      return payload
    }
    const executeAction = async (action) => {
      let payload
      if (action.capability === "SEARCH_ENTITIES_CLASSIFICATION") payload = await invoke("refresh-trendlyne-classification", { action: "A2_EXECUTE", portfolioId: snapshot.registry.records[0]?.portfolioId, securityIds: [action.securityId], securityNames: [action.canonicalName], confirmation: "OWNER_CONFIRMED_PROGRAM_A_A2_CLASSIFICATION" }, { "x-portfolioai-classification-token": classificationToken }, false)
      else if (action.capability === "COMPLETE_RESEARCH_REFRESH") {
        let identityResult = { providerCalls: 0, localWrites: 0 }
        if (action.providerIdentityState === "IDENTITY_DISCOVERY_REQUIRED") {
          const identityPayload = await invoke("resolve-trendlyne-identity", { action: "EXECUTE", portfolioId: snapshot.registry.records[0]?.portfolioId, securityId: action.securityId, confirmation: "OWNER_CONFIRMED_PROGRAM_A_A2_IDENTITY_DISCOVERY" })
          identityResult = assertProgramAA2ProviderResult(identityPayload)
        }
        payload = await invoke("complete-research-refresh", { action: "EXECUTE", portfolioId: snapshot.registry.records[0]?.portfolioId, securityId: action.securityId, confirmation: "OWNER_CONFIRMED_COMPLETE_RESEARCH_REFRESH" })
        const researchResult = assertProgramAA2ProviderResult(payload)
        return { providerCalls: identityResult.providerCalls + researchResult.providerCalls, localWrites: identityResult.localWrites + researchResult.localWrites }
      }
      else if (action.capability === "SECURITY_HISTORY") payload = await invoke("refresh-market-history", { action: "EXECUTE", portfolioId: snapshot.registry.records[0]?.portfolioId, securityId: action.securityId, confirmation: "OWNER_CONFIRMED_MARKET_HISTORY_REFRESH", requestFrom: action.historyWindow.from, requestTo: action.historyWindow.to })
      else if (action.capability === "PHARMA_BENCHMARK_HISTORY") payload = await invoke("refresh-pharma-benchmark", { action: "EXECUTE", portfolioId: snapshot.registry.records[0]?.portfolioId, securityId: action.securityId, confirmation: "OWNER_CONFIRMED_PHARMA_BENCHMARK_REFRESH" })
      else if (action.capability === "BANK_BENCHMARK_HISTORY") payload = await invoke("refresh-bank-benchmark", { action: "EXECUTE", portfolioId: snapshot.registry.records[0]?.portfolioId, securityId: action.securityId, confirmation: "OWNER_CONFIRMED_BANK_BENCHMARK_REFRESH" })
      else throw new Error("UNSUPPORTED_PROVIDER_ENDPOINT")
      return assertProgramAA2ProviderResult(payload)
    }
    const loadRefreshedMaterialized = () => {
      const databaseUrl = process.env.PROGRAM_A_LOCAL_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
      const portfolioId = snapshot.registry.records[0]?.portfolioId
      const raw = execFileSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-Atq", "-v", `portfolio_id=${portfolioId}`, "-v", `as_of_date=${snapshot.asOfDate}`, "-f", "scripts/program-a-a1-cache-snapshot.sql"], { encoding: "utf8" })
      return cacheModule.materializeProgramAA1CacheBaseline(JSON.parse(raw))
    }
    const loadPostExecutionA1Summary = () => {
      const refreshed = loadRefreshedMaterialized()
      const rows = refreshed.baseline.eligibility
      return Promise.resolve({ totalHoldings: rows.length, eligible: rows.filter((row) => row.eligibilityState === "ELIGIBLE").length, reviewRequired: rows.filter((row) => row.eligibilityState === "REVIEW_REQUIRED").length, methodologyUnavailable: rows.filter((row) => row.eligibilityState === "METHODOLOGY_NOT_AVAILABLE").length })
    }
    const result = await a2Module.executeProgramAA2Plan({ approvedPlan, currentPlan, approvedStage, confirmationToken, localSupabaseUrl: localUrl, executeAction, loadPostExecutionA1Summary })
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    if (result.status !== "SUCCEEDED") process.exitCode = 2
  }
} finally {
  await server.close()
}
