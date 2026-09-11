import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}
const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "Content-Type": "application/json" },
})

const DEFAULT_MODEL = "gpt-5.6-luna"

type RequestBody = {
  readonly action?: unknown
  readonly portfolioId?: unknown
  readonly securityId?: unknown
}

type Interpretation = {
  readonly headline: string
  readonly summary: string
  readonly why_role: string
  readonly why_action: string
  readonly weight_guidance: string
  readonly strengths: readonly { readonly title: string; readonly detail: string }[]
  readonly cautions: readonly { readonly title: string; readonly detail: string }[]
  readonly upgrade_triggers: readonly string[]
  readonly downgrade_triggers: readonly string[]
  readonly evidence_limits: readonly string[]
}

const hash = async (value: unknown) => Array.from(new Uint8Array(await crypto.subtle.digest(
  "SHA-256",
  new TextEncoder().encode(JSON.stringify(value)),
))).map(byte => byte.toString(16).padStart(2, "0")).join("")

function parseJsonObject(text: string): Record<string, unknown> {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
  const parsed = JSON.parse(cleaned)
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("AI_OUTPUT_INVALID")
  return parsed as Record<string, unknown>
}

function stringValue(value: unknown, max = 1200): string {
  if (typeof value !== "string") throw new Error("AI_OUTPUT_INVALID")
  const trimmed = value.trim()
  if (!trimmed) throw new Error("AI_OUTPUT_INVALID")
  return trimmed.slice(0, max)
}

function stringArray(value: unknown, maxItems = 4): string[] {
  if (!Array.isArray(value)) throw new Error("AI_OUTPUT_INVALID")
  return value.slice(0, maxItems).map(item => stringValue(item, 500))
}

function cardArray(value: unknown, maxItems = 4): { title: string; detail: string }[] {
  if (!Array.isArray(value)) throw new Error("AI_OUTPUT_INVALID")
  return value.slice(0, maxItems).map(item => {
    if (!item || typeof item !== "object") throw new Error("AI_OUTPUT_INVALID")
    const row = item as Record<string, unknown>
    return { title: stringValue(row.title, 120), detail: stringValue(row.detail, 500) }
  })
}

function validateInterpretation(raw: Record<string, unknown>): Interpretation {
  return {
    headline: stringValue(raw.headline, 180),
    summary: stringValue(raw.summary, 1200),
    why_role: stringValue(raw.why_role, 1000),
    why_action: stringValue(raw.why_action, 1000),
    weight_guidance: stringValue(raw.weight_guidance, 1000),
    strengths: cardArray(raw.strengths),
    cautions: cardArray(raw.cautions),
    upgrade_triggers: stringArray(raw.upgrade_triggers),
    downgrade_triggers: stringArray(raw.downgrade_triggers),
    evidence_limits: stringArray(raw.evidence_limits),
  }
}

function outputText(payload: Record<string, unknown>): string {
  if (typeof payload.output_text === "string") return payload.output_text
  const output = Array.isArray(payload.output) ? payload.output : []
  for (const item of output) {
    if (!item || typeof item !== "object") continue
    const content = Array.isArray((item as Record<string, unknown>).content) ? (item as Record<string, unknown>).content as unknown[] : []
    for (const part of content) {
      if (!part || typeof part !== "object") continue
      const row = part as Record<string, unknown>
      if (row.type === "output_text" && typeof row.text === "string") return row.text
    }
  }
  throw new Error("AI_OUTPUT_MISSING")
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (request.method !== "POST") return reply(405, { error: "Method not allowed." })
  const authorization = request.headers.get("Authorization")
  if (!authorization) return reply(401, { error: "Authentication required." })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !anonKey || !serviceKey) return reply(500, { error: "Server configuration is incomplete." })

  try {
    const body = await request.json() as RequestBody
    if (body.action !== "PLAN" && body.action !== "GENERATE") return reply(400, { error: "Unknown action." })
    if (typeof body.portfolioId !== "string" || typeof body.securityId !== "string") return reply(400, { error: "portfolioId and securityId are required." })

    const user = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
    const auth = await user.auth.getUser()
    if (auth.error || !auth.data.user) return reply(401, { error: "Invalid authenticated session." })
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    const portfolio = await admin.from("portfolios").select("id").eq("id", body.portfolioId).eq("user_id", auth.data.user.id).single()
    if (portfolio.error) return reply(404, { error: "Portfolio not found." })
    const security = await admin.from("securities").select("id,symbol,name").eq("id", body.securityId).single()
    if (security.error) return reply(404, { error: "Security not found." })

    const recommendation = await admin.from("stock_recommendation_runs")
      .select("id,scoring_profile_code,recommendation_policy_version,overall_score,score_ready_coverage,evidence_confidence,suggested_role,action_bias,current_user_role,current_weight,suggested_weight_min,suggested_weight_max,change_signal,transition_status,persistence_count,rationale,created_at,ai_summary,ai_interpretation,ai_interpretation_input_hash,ai_interpretation_provider,ai_interpretation_model,ai_interpretation_generated_at,ai_interpretation_status")
      .eq("portfolio_id", body.portfolioId).eq("security_id", body.securityId)
      .in("run_state", ["PREVIEW", "OFFICIAL"]).order("created_at", { ascending: false }).limit(1).maybeSingle()
    if (recommendation.error || !recommendation.data) return reply(409, { error: "A validated recommendation state is required before AI interpretation." })
    if (recommendation.data.suggested_role === "INSUFFICIENT") return reply(409, { error: "Recommendation evidence is currently insufficient for AI interpretation." })

    const evidence = {
      security: { symbol: security.data.symbol, name: security.data.name },
      recommendation: {
        profile: recommendation.data.scoring_profile_code,
        policyVersion: recommendation.data.recommendation_policy_version,
        overallScore: recommendation.data.overall_score,
        scoreReadyCoverage: recommendation.data.score_ready_coverage,
        evidenceConfidence: recommendation.data.evidence_confidence,
        suggestedRole: recommendation.data.suggested_role,
        actionBias: recommendation.data.action_bias,
        currentUserRole: recommendation.data.current_user_role,
        currentWeight: recommendation.data.current_weight,
        suggestedWeightMin: recommendation.data.suggested_weight_min,
        suggestedWeightMax: recommendation.data.suggested_weight_max,
        changeSignal: recommendation.data.change_signal,
        transitionStatus: recommendation.data.transition_status,
        persistenceCount: recommendation.data.persistence_count,
        rationale: recommendation.data.rationale ?? {},
        createdAt: recommendation.data.created_at,
      },
    }
    const inputHash = await hash(evidence)
    const configured = Boolean(Deno.env.get("OPENAI_API_KEY"))
    const model = Deno.env.get("OPENAI_INTERPRETATION_MODEL") || DEFAULT_MODEL
    const cached = recommendation.data.ai_interpretation_status === "READY" && recommendation.data.ai_interpretation_input_hash === inputHash && recommendation.data.ai_interpretation

    if (body.action === "PLAN") return reply(200, {
      mode: "AI_INTERPRETATION_PLAN",
      configured,
      model,
      recommendationRunId: recommendation.data.id,
      cached: Boolean(cached),
      generatedAt: recommendation.data.ai_interpretation_generated_at ?? null,
      interpretation: cached ? recommendation.data.ai_interpretation : null,
      note: configured ? "AI interpretation uses only the persisted deterministic recommendation evidence." : "OPENAI_API_KEY is not configured in Supabase secrets.",
    })

    if (cached) return reply(200, {
      mode: "AI_INTERPRETATION",
      cached: true,
      model: recommendation.data.ai_interpretation_model ?? model,
      recommendationRunId: recommendation.data.id,
      generatedAt: recommendation.data.ai_interpretation_generated_at,
      interpretation: recommendation.data.ai_interpretation,
    })

    const apiKey = Deno.env.get("OPENAI_API_KEY")
    if (!apiKey) return reply(409, { error: "AI interpretation provider is not configured yet.", code: "AI_PROVIDER_NOT_CONFIGURED" })

    const systemPrompt = `You are the PortfolioAI interpretation layer. You explain a deterministic investment recommendation; you do not replace, override or recalculate it.\n\nRules:\n1. Use only the supplied JSON evidence. Never invent financial metrics, news, prices, forecasts, sector facts or portfolio exposures.\n2. The deterministic suggested role, action bias and suggested weight range are fixed facts. Do not change them.\n3. Explain disagreements explicitly (for example strong long-term quality with weak momentum).\n4. Be sector/profile-aware using only the supplied scoring profile and rationale.\n5. Distinguish long-term thesis, near-term timing and portfolio sizing.\n6. Upgrade/downgrade triggers must describe evidence changes that would justify reconsideration; do not invent numeric thresholds unless supplied.\n7. If portfolio classification coverage is incomplete, say concentration guidance remains provisional.\n8. Keep the language concise, plain-English and decision-oriented.\n9. This is advisory research interpretation, not an autonomous trade instruction.\n10. Return JSON only, with exactly these keys: headline, summary, why_role, why_action, weight_guidance, strengths, cautions, upgrade_triggers, downgrade_triggers, evidence_limits. strengths and cautions are arrays of {title,detail}; trigger/limit fields are arrays of strings.`

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        reasoning: { effort: "low" },
        max_output_tokens: 1800,
        input: [
          { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
          { role: "user", content: [{ type: "input_text", text: JSON.stringify(evidence) }] },
        ],
      }),
    })
    if (!response.ok) {
      await admin.from("stock_recommendation_runs").update({ ai_interpretation_status: "FAILED" }).eq("id", recommendation.data.id)
      return reply(502, { error: "AI interpretation provider request failed.", code: `AI_PROVIDER_HTTP_${response.status}` })
    }
    const responsePayload = await response.json() as Record<string, unknown>
    const interpretation = validateInterpretation(parseJsonObject(outputText(responsePayload)))
    const usage = responsePayload.usage && typeof responsePayload.usage === "object" ? responsePayload.usage : {}
    const generatedAt = new Date().toISOString()

    const updated = await admin.from("stock_recommendation_runs").update({
      ai_summary: interpretation.summary,
      ai_interpretation: interpretation,
      ai_interpretation_input_hash: inputHash,
      ai_interpretation_provider: "OPENAI",
      ai_interpretation_model: model,
      ai_interpretation_generated_at: generatedAt,
      ai_interpretation_status: "READY",
      ai_interpretation_usage: usage,
    }).eq("id", recommendation.data.id)
    if (updated.error) return reply(500, { error: "AI interpretation could not be stored safely." })

    return reply(200, {
      mode: "AI_INTERPRETATION",
      cached: false,
      model,
      recommendationRunId: recommendation.data.id,
      generatedAt,
      interpretation,
    })
  } catch (error) {
    const code = error instanceof Error ? error.message : "AI_INTERPRETATION_FAILED"
    return reply(500, { error: "AI interpretation failed safely.", code })
  }
})
