import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.115.0"

type AdminClient = Pick<SupabaseClient, "from">

const SOURCE_CODE = "OWNER_REVIEWED_CLASSIFICATION"
const GRANT_KIND = "P4_EXECUTION_GRANT"
const CONSUMED_KIND = "P4_EXECUTION_GRANT_CONSUMED"
const DEV_PROJECT_REF = "lrgpjimipfkyoqbpsqzz"

const hash = async (value: unknown) => Array.from(new Uint8Array(await crypto.subtle.digest(
  "SHA-256",
  new TextEncoder().encode(JSON.stringify(value)),
))).map((byte) => byte.toString(16).padStart(2, "0")).join("")

export async function consumeP4ExecutionGrant(
  admin: AdminClient,
  input: {
    readonly grantId: unknown
    readonly action: string
    readonly portfolioId: string
    readonly securityId: string
  },
): Promise<{ readonly ok: true } | { readonly ok: false; readonly code: string; readonly message: string }> {
  if (typeof input.grantId !== "string" || !/^[0-9a-f-]{36}$/iu.test(input.grantId)) {
    return { ok: false, code: "P4_GRANT_REQUIRED", message: "A valid one-time P4 execution grant is required." }
  }

  const grant = await admin.from("data_source_records")
    .select("id,raw_payload")
    .eq("id", input.grantId)
    .eq("source_code", SOURCE_CODE)
    .eq("record_kind", GRANT_KIND)
    .maybeSingle()
  if (grant.error || !grant.data) {
    return { ok: false, code: "P4_GRANT_INVALID", message: "P4 execution grant was not found." }
  }

  const payload = grant.data.raw_payload as Record<string, unknown>
  const expiresAt = typeof payload.expires_at === "string" ? Date.parse(payload.expires_at) : NaN
  if (
    payload.environment !== "PortfolioAI Dev" ||
    payload.project_ref !== DEV_PROJECT_REF ||
    payload.action !== input.action ||
    payload.portfolio_id !== input.portfolioId ||
    payload.security_id !== input.securityId ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= Date.now()
  ) {
    return { ok: false, code: "P4_GRANT_SCOPE_MISMATCH", message: "P4 execution grant does not match the requested scope." }
  }

  const existing = await admin.from("data_source_records")
    .select("id")
    .eq("source_code", SOURCE_CODE)
    .eq("record_kind", CONSUMED_KIND)
    .eq("external_record_id", input.grantId)
    .limit(1)
    .maybeSingle()
  if (existing.error) return { ok: false, code: "P4_GRANT_CHECK_FAILED", message: "P4 execution grant could not be checked." }
  if (existing.data) return { ok: false, code: "P4_GRANT_ALREADY_USED", message: "P4 execution grant has already been consumed." }

  const consumedAt = new Date().toISOString()
  const consumedPayload = {
    grant_id: input.grantId,
    action: input.action,
    portfolio_id: input.portfolioId,
    security_id: input.securityId,
    environment: "PortfolioAI Dev",
    project_ref: DEV_PROJECT_REF,
    consumed_at: consumedAt,
  }
  const inserted = await admin.from("data_source_records").insert({
    source_code: SOURCE_CODE,
    record_kind: CONSUMED_KIND,
    external_record_id: input.grantId,
    payload_hash: await hash(consumedPayload),
    raw_payload: consumedPayload,
    retrieved_at: consumedAt,
    terms_snapshot: { mode: "POST_D_P4_ONE_TIME_EXECUTION_GRANT", secret_transport: false },
  })
  if (inserted.error) return { ok: false, code: "P4_GRANT_CONSUME_FAILED", message: "P4 execution grant could not be consumed." }
  return { ok: true }
}
