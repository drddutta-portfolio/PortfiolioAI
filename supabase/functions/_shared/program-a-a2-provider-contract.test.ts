import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const root = process.cwd()
const classification = readFileSync(`${root}/supabase/functions/refresh-trendlyne-classification/index.ts`, "utf8")
const history = readFileSync(`${root}/supabase/functions/refresh-market-history/index.ts`, "utf8")
const bankBenchmark = readFileSync(`${root}/supabase/functions/refresh-bank-benchmark/index.ts`, "utf8")
const pharmaBenchmark = readFileSync(`${root}/supabase/functions/refresh-pharma-benchmark/index.ts`, "utf8")
const localConfig = readFileSync(`${root}/supabase/config.toml`, "utf8")
const complete = readFileSync(`${root}/supabase/functions/complete-research-refresh/index.ts`, "utf8")
const identity = readFileSync(`${root}/supabase/functions/resolve-trendlyne-identity/index.ts`, "utf8")
const runner = readFileSync(`${root}/scripts/program-a-a2-runner.mjs`, "utf8")
const normalizedClassificationMigration = readFileSync(`${root}/supabase/migrations/20260923110816_use_normalized_current_security_classification.sql`, "utf8")

describe("Program A A2 provider-control reuse", () => {
  it("requires the exact local-only A2 classification cohort and confirmation", () => {
    expect(classification).toContain('body.action === "A2_EXECUTE"')
    expect(classification).toContain('exactSecurityIds.length > 5')
    expect(classification).toContain('OWNER_CONFIRMED_PROGRAM_A_A2_CLASSIFICATION')
    expect(classification).toContain('UNEXPECTED_PRODUCTION_DB_TARGET')
    expect(classification).toContain('url.hostname === "kong" && url.port === "8000"')
    expect(classification).toContain('acquire_data_ingestion_lease_v1')
    expect(classification).toContain('reserve_provider_budget_v1')
    expect(classification).toContain('"User-Agent": "PortfolioAI/1.0"')
    expect(classification).toContain('PROVIDER_REMOTE_')
    expect(classification).toContain('CLASSIFICATION_IDENTITY_PREREQUISITE_MISSING')
    expect(classification).toContain('rejectionCodes[0]')
    expect(classification).toContain('p_metadata: { ...parsed.metadata, ...match.metadata }')
    expect(classification).toContain('p_safe_reason_code: "PROVIDER_SCHEMA_MISMATCH"')
    expect(classification).toContain('canonical_mapping: canonicalPair')
    expect(classification).toContain('ignoreDuplicates: true')
    expect(classification).toContain('normalizedValue: pairMapped ? canonicalPair!.sector : null')
    expect(normalizedClassificationMigration).toContain('coalesce(o.normalized_value, o.text_value)')
    expect(normalizedClassificationMigration).toContain('security_invoker = true')
    expect(runner).toContain('assertProgramAA2ProviderResult(payload)')
    expect(runner).not.toContain('new Error("AMBIGUOUS_PROVIDER_IDENTITY")')
  })

  it("passes the approved incremental window into the existing Angel One adapter", () => {
    expect(history).toContain('readonly requestFrom?: unknown')
    expect(history).toContain('readonly requestTo?: unknown')
    expect(history).toContain('Program A A2 execution is local-only')
    expect(history).toContain('url.hostname === "kong" && url.port === "8000"')
    expect(history).toContain('to.getTime() - from.getTime() > HISTORY_DAYS * DAY')
    expect(history).toContain('getDailyHistory(instrument, kolkataDateTime(from), kolkataDateTime(to))')
    expect(history).toContain('acquire_market_data_operation_lease')
  })

  it("retains the reviewed R3 budget, lease, accounting, and canonical persistence path", () => {
    expect(complete).toContain('const RESERVED_UNITS = 4')
    expect(complete).toContain('reserve_provider_budget_v1')
    expect(complete).toContain('acquire_data_ingestion_lease_v1')
    expect(complete).toContain('record_provider_usage_event_v1')
    expect(complete).toContain('fundamental_observations')
    expect(complete).toContain('research_documents')
  })

  it("uses bounded exact provider identity discovery before Complete Research", () => {
    expect(identity).toContain('const RESERVED_UNITS = 2')
    expect(identity).toContain('reconcileTrendlyneIdentityDiscovery')
    expect(identity).toContain('security_identity_observations')
    expect(identity).toContain('evidence_status: "MATCHED"')
    expect(identity).toContain('if (!same.data)')
    expect(identity).toContain('BLOCKED_IDENTITY_CONFLICT')
    expect(identity).toContain('reserve_provider_budget_v1')
    expect(identity).toContain('record_provider_usage_event_v1')
    expect(runner).toContain('action.providerIdentityState === "IDENTITY_DISCOVERY_REQUIRED"')
    expect(runner).toContain('resolve-trendlyne-identity')
  })

  it("paces approved A2C actions across the existing Angel One lease cooldown", () => {
    expect(runner).toContain("waitForAngelOneCooldown")
    expect(runner).toContain("61_000")
    expect(runner).toContain("lastAngelOneDispatchCompletedAt = Date.now()")
  })

  it("lets ES256 requests reach only A2C handlers that enforce Supabase user auth internally", () => {
    for (const functionName of ["refresh-market-history", "refresh-bank-benchmark", "refresh-pharma-benchmark"]) {
      expect(localConfig).toContain(`[functions.${functionName}]\nverify_jwt = false`)
    }
    for (const source of [history, bankBenchmark, pharmaBenchmark]) {
      expect(source).toContain('request.headers.get("Authorization")')
      expect(source).toContain('return json(401, { error: "Authentication required." })')
      expect(source).toContain("auth.getUser()")
      expect(source).toContain('return json(401, { error: "Invalid authenticated session." })')
      expect(source).toContain('.eq("user_id",')
    }
  })
})
