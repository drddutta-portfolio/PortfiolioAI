import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

export const DEV_REF = "lrgpjimipfkyoqbpsqzz"
export const PROD_REF = "uxiyufbsbgzzdujzcdxe"
export const PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2"
export const EXPERIMENT_ID = "P8_EXP_NSE_MONTHLY_6M_V1"
export const UNIVERSE_VERSION = "P8_NSE_HISTORICAL_UNIVERSE_V1"
export const RESOLVER_VERSION = "P8_B2_HISTORICAL_IDENTITY_RESOLVER_V3"
export const SELECTOR_VERSION = "P8_B2_HISTORICAL_IDENTITY_SELECTOR_V3"
export const EXPECTED_PLAN_HASH = "ea253903259183d3bf287e51412c6fa0938ea8b06260e48e40c682af2dfdf5b3"
export const GRANT_SOURCE = "OWNER_REVIEWED_CLASSIFICATION"
export const GRANT_KIND = "P8_B2_MATERIALIZATION_GRANT"
export const CONSUMED_KIND = "P8_B2_MATERIALIZATION_GRANT_CONSUMED"
export const COMPLETION_KIND = "P8_B2_MATERIALIZATION_COMPLETION"
export const ACTION = "P8_B2_MATERIALIZE_HISTORICAL_UNIVERSE_V3"

export type Json = Record<string, unknown>
export type Admin = ReturnType<typeof createClient>

export const reply = (status: number, body: Json) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })

export const projectRef = (value: string) => {
  try { return new URL(value).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1] ?? null }
  catch { return null }
}

export const clean = (value: unknown) => String(value ?? "").trim()
export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value)
export const isHash = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{64}$/u.test(value)
export const frozenIsin = (isin: string) => /^IN[E9][A-Z0-9]{4}01[A-Z0-9]{3}$/u.test(isin)

export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]"
  const row = value as Record<string, unknown>
  return "{" + Object.keys(row).sort().map((key) => JSON.stringify(key) + ":" + canonical(row[key])).join(",") + "}"
}

export async function sha256(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(typeof value === "string" ? value : canonical(value))
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export async function deterministicUuid(seed: string): Promise<string> {
  const hex = await sha256(seed)
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16)
  return hex.slice(0,8) + "-" + hex.slice(8,12) + "-5" + hex.slice(13,16) + "-" +
    variant + hex.slice(17,20) + "-" + hex.slice(20,32)
}

export function chunks<T>(rows: T[], size: number): T[][] {
  const out: T[][] = []
  for (let index = 0; index < rows.length; index += size) out.push(rows.slice(index, index + size))
  return out
}

export async function ownerId(admin: Admin): Promise<string> {
  const result = await admin.from("portfolios").select("user_id").eq("id", PORTFOLIO_ID).single()
  if (result.error || !result.data?.user_id) throw new Error("P8_B2_PORTFOLIO_OWNER_NOT_FOUND")
  return String(result.data.user_id)
}

export async function validateGrant(admin: Admin, grantId: unknown) {
  if (!isUuid(grantId)) return { ok: false as const, code: "P8_B2_GRANT_REQUIRED" }
  const grant = await admin.from("data_source_records")
    .select("id,raw_payload")
    .eq("id", grantId)
    .eq("source_code", GRANT_SOURCE)
    .eq("record_kind", GRANT_KIND)
    .maybeSingle()
  if (grant.error || !grant.data) return { ok: false as const, code: "P8_B2_GRANT_INVALID" }

  const payload = grant.data.raw_payload as Json
  const expiresAt = typeof payload.expires_at === "string" ? Date.parse(payload.expires_at) : NaN
  if (
    payload.environment !== "PortfolioAI Dev" ||
    payload.project_ref !== DEV_REF ||
    payload.action !== ACTION ||
    payload.portfolio_id !== PORTFOLIO_ID ||
    payload.experiment_id !== EXPERIMENT_ID ||
    payload.plan_hash !== EXPECTED_PLAN_HASH ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= Date.now()
  ) return { ok: false as const, code: "P8_B2_GRANT_SCOPE_MISMATCH" }

  const consumed = await admin.from("data_source_records")
    .select("id")
    .eq("source_code", GRANT_SOURCE)
    .eq("record_kind", CONSUMED_KIND)
    .eq("external_record_id", grantId)
    .limit(1)
    .maybeSingle()
  if (consumed.error) return { ok: false as const, code: "P8_B2_GRANT_CHECK_FAILED" }
  return { ok: true as const, grantId, consumed: Boolean(consumed.data) }
}

export async function materializationStatus(admin: Admin) {
  const tables = [
    "p8_historical_security_identities",
    "p8_historical_source_archives",
    "p8_historical_listing_observations_v3",
    "p8_historical_universe_runs_v3",
    "p8_historical_universe_members_v3",
    "p8_historical_universe_member_listing_evidence_v3",
    "p8_historical_universe_run_selections_v3",
  ]
  const counts: Record<string, number> = {}
  for (const table of tables) {
    const result = await admin.from(table).select("id", { count: "exact", head: true })
      .eq("portfolio_id", PORTFOLIO_ID).eq("experiment_id", EXPERIMENT_ID)
    if (result.error) throw result.error
    counts[table] = result.count ?? 0
  }
  return counts
}
