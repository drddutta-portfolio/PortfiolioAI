import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

export const DEV_REF = "lrgpjimipfkyoqbpsqzz"
export const PROD_REF = "uxiyufbsbgzzdujzcdxe"
export const PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2"
export const EXPERIMENT_ID = "P8_EXP_NSE_MONTHLY_6M_V1"
export const ACTION = "P8_B3_FULL_SOURCE_ACQUISITION_V1"
export const CAMPAIGN_ID = "P8_B3_FULL_SOURCE_ACQUISITION_20261001_V1"
export const PLAN_HASH = "9367d9a55b5c7a6db176ef3e2b80da96cb97b3ac114f0ef884f124352a54919a"
export const GRANT_SOURCE = "OWNER_REVIEWED_CLASSIFICATION"
export const GRANT_KIND = "P8_B3_SOURCE_ACQUISITION_GRANT"
export const CONSUMED_KIND = "P8_B3_SOURCE_ACQUISITION_GRANT_CONSUMED"
export const COMPLETION_KIND = "P8_B3_SOURCE_ACQUISITION_COMPLETION"

export type Json = Record<string, unknown>
export type Admin = ReturnType<typeof createClient>

export const reply = (status: number, body: Json) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Connection": "keep-alive" },
  })

export const clean = (value: unknown) => String(value ?? "").trim()
export const isHash = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{64}$/u.test(value)
export const isUuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value)

export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]"
  const row = value as Record<string, unknown>
  return "{" + Object.keys(row).sort()
    .map((key) => JSON.stringify(key) + ":" + canonical(row[key])).join(",") + "}"
}

export async function sha256(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(
    typeof value === "string" ? value : canonical(value),
  )
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("")
}

export async function deterministicUuid(seed: string): Promise<string> {
  const hex = await sha256(seed)
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16)
  return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-5" +
    hex.slice(13, 16) + "-" + variant + hex.slice(17, 20) + "-" +
    hex.slice(20, 32)
}

export function projectRef(value: string) {
  try {
    return new URL(value).hostname.match(/^([a-z0-9]+)\.supabase\.co$/u)?.[1] ?? null
  } catch {
    return null
  }
}

export async function validateGrant(admin: Admin, grantId: unknown) {
  if (!isUuid(grantId)) {
    return { ok: false as const, code: "P8_B3_GRANT_REQUIRED" }
  }

  const grant = await admin.from("data_source_records")
    .select("id,raw_payload")
    .eq("id", grantId)
    .eq("source_code", GRANT_SOURCE)
    .eq("record_kind", GRANT_KIND)
    .maybeSingle()

  if (grant.error || !grant.data) {
    return { ok: false as const, code: "P8_B3_GRANT_INVALID" }
  }

  const payload = grant.data.raw_payload as Json
  const expiresAt =
    typeof payload.expires_at === "string" ? Date.parse(payload.expires_at) : NaN

  if (
    payload.environment !== "PortfolioAI Dev" ||
    payload.project_ref !== DEV_REF ||
    payload.action !== ACTION ||
    payload.campaign_id !== CAMPAIGN_ID ||
    payload.portfolio_id !== PORTFOLIO_ID ||
    payload.experiment_id !== EXPERIMENT_ID ||
    payload.plan_hash !== PLAN_HASH ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= Date.now()
  ) {
    return { ok: false as const, code: "P8_B3_GRANT_SCOPE_MISMATCH" }
  }

  const consumed = await admin.from("data_source_records")
    .select("id")
    .eq("source_code", GRANT_SOURCE)
    .eq("record_kind", CONSUMED_KIND)
    .eq("external_record_id", grantId)
    .limit(1)
    .maybeSingle()

  if (consumed.error) {
    return { ok: false as const, code: "P8_B3_GRANT_CHECK_FAILED" }
  }

  return {
    ok: true as const,
    grantId,
    consumed: Boolean(consumed.data),
  }
}

export async function campaignCounts(admin: Admin) {
  const tables = [
    "p8_b3_source_archives",
    "p8_b3_raw_market_price_observations",
    "p8_b3_corporate_action_observations",
    "p8_b3_benchmark_total_return_history",
  ]

  const out: Record<string, number> = {}
  for (const table of tables) {
    const result = await admin.from(table)
      .select("id", { count: "exact", head: true })
      .eq("portfolio_id", PORTFOLIO_ID)
      .eq("experiment_id", EXPERIMENT_ID)
      .contains("raw_metadata", { campaign_id: CAMPAIGN_ID })

    if (result.error) throw result.error
    out[table] = result.count ?? 0
  }

  return out
}
