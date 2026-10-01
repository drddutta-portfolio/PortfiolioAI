import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import {
  ACTION, COMPLETION_KIND, CONSUMED_KIND, DEV_REF, EXPECTED_PLAN_HASH, EXPERIMENT_ID,
  GRANT_SOURCE, Json, PORTFOLIO_ID, PROD_REF, clean, materializationStatus, projectRef,
  reply, sha256, validateGrant,
} from "./shared.ts"
import { beginMonth, identityBatch, observationBatch } from "./identity.ts"
import { beginRun, evidenceBatch, memberBatch, selectMonth } from "./universe.ts"

async function completeCampaign(
  admin: ReturnType<typeof createClient>,
  grantId: string,
) {
  const counts = await materializationStatus(admin)
  const expected: Record<string, number> = {
    p8_historical_security_identities: 4524,
    p8_historical_source_archives: 32,
    p8_historical_listing_observations_v3: 562790,
    p8_historical_universe_runs_v3: 32,
    p8_historical_universe_members_v3: 144768,
    p8_historical_universe_member_listing_evidence_v3: 562790,
    p8_historical_universe_run_selections_v3: 32,
  }

  for (const [table, value] of Object.entries(expected)) {
    if (counts[table] !== value) {
      throw new Error(
        "P8_B2_COMPLETION_COUNT:" + table + ":" + counts[table] + ":" + value,
      )
    }
  }

  const latest = await admin.from("current_p8_historical_universe_run_v3")
    .select("decision_date,eligible_count,ineligible_count,blocked_count,run_hash")
    .eq("portfolio_id", PORTFOLIO_ID)
    .eq("experiment_id", EXPERIMENT_ID)
    .order("decision_date", { ascending: false })
    .limit(1)
    .single()

  if (
    latest.error ||
    latest.data.decision_date !== "2026-09-29" ||
    Number(latest.data.eligible_count) !== 4385 ||
    Number(latest.data.ineligible_count) !== 139 ||
    Number(latest.data.blocked_count) !== 0
  ) throw new Error("P8_B2_COMPLETION_LATEST_VERIFY")

  const completedAt = new Date().toISOString()
  const completionPayload = {
    action: ACTION,
    plan_hash: EXPECTED_PLAN_HASH,
    portfolio_id: PORTFOLIO_ID,
    experiment_id: EXPERIMENT_ID,
    counts,
    latest: latest.data,
    completed_at: completedAt,
  }
  const completionHash = await sha256(completionPayload)

  const completion = await admin.from("data_source_records").upsert({
    source_code: GRANT_SOURCE,
    record_kind: COMPLETION_KIND,
    external_record_id: EXPECTED_PLAN_HASH,
    payload_hash: completionHash,
    raw_payload: completionPayload,
    retrieved_at: completedAt,
    terms_snapshot: {
      mode: "P8_B2_V3_MATERIALIZATION_COMPLETION",
      provider_calls: 0,
      production_change: false,
    },
  }, {
    onConflict: "source_code,record_kind,external_record_id,payload_hash",
    ignoreDuplicates: true,
  })
  if (completion.error) throw completion.error

  const consumedPayload = {
    grant_id: grantId,
    action: ACTION,
    plan_hash: EXPECTED_PLAN_HASH,
    completed_at: completedAt,
  }
  const consumed = await admin.from("data_source_records").upsert({
    source_code: GRANT_SOURCE,
    record_kind: CONSUMED_KIND,
    external_record_id: grantId,
    payload_hash: await sha256(consumedPayload),
    raw_payload: consumedPayload,
    retrieved_at: completedAt,
    terms_snapshot: {
      mode: "P8_B2_ONE_CAMPAIGN_EXECUTION_GRANT",
      provider_calls: 0,
    },
  }, {
    onConflict: "source_code,record_kind,external_record_id,payload_hash",
    ignoreDuplicates: true,
  })
  if (consumed.error) throw consumed.error

  return { counts, latest: latest.data, completion_hash: completionHash }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return reply(405, { error: "Method not allowed." })

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  const ref = projectRef(supabaseUrl)

  if (ref === PROD_REF) {
    return reply(409, {
      error: "P8-B2 materializer refuses Production.",
      code: "UNEXPECTED_PRODUCTION_DB_TARGET",
    })
  }
  if (ref !== DEV_REF || !serviceKey) {
    return reply(500, {
      error: "PortfolioAI Dev runtime configuration is incomplete.",
      code: "P8_B2_RUNTIME_CONFIG",
    })
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  try {
    const body = await request.json() as Json

    if (body.action !== ACTION) {
      return reply(400, {
        error: "Exact P8-B2 materialization action is required.",
        code: "P8_B2_ACTION",
      })
    }
    if (body.planHash !== EXPECTED_PLAN_HASH) {
      return reply(409, { error: "Plan hash mismatch.", code: "P8_B2_PLAN_HASH" })
    }

    const grant = await validateGrant(admin, body.grantId)
    if (!grant.ok) {
      return reply(401, {
        error: "Materialization grant rejected.",
        code: grant.code,
      })
    }

    const operation = clean(body.operation)
    if (grant.consumed && operation !== "status") {
      return reply(409, {
        error: "Materialization grant is already consumed.",
        code: "P8_B2_GRANT_ALREADY_USED",
      })
    }

    if (operation === "status") {
      return reply(200, {
        status: "OK",
        consumed: grant.consumed,
        counts: await materializationStatus(admin),
      })
    }

    if (operation === "identity_batch") {
      return reply(200, {
        status: "OK",
        operation,
        ...await identityBatch(admin, Array.isArray(body.rows) ? body.rows as Json[] : []),
      })
    }

    if (operation === "begin_month") {
      return reply(200, {
        status: "OK",
        operation,
        ...await beginMonth(
          admin,
          body.archive && typeof body.archive === "object" ? body.archive as Json : {},
        ),
      })
    }

    if (operation === "observation_batch") {
      return reply(200, {
        status: "OK",
        operation,
        ...await observationBatch(
          admin,
          clean(body.sourceDate),
          clean(body.archiveHash),
          Array.isArray(body.rows) ? body.rows as Json[] : [],
        ),
      })
    }

    if (operation === "begin_run") {
      return reply(200, {
        status: "OK",
        operation,
        ...await beginRun(
          admin,
          body.month && typeof body.month === "object" ? body.month as Json : {},
        ),
      })
    }

    if (operation === "member_batch") {
      return reply(200, {
        status: "OK",
        operation,
        ...await memberBatch(
          admin,
          clean(body.runId),
          clean(body.decisionAt),
          Array.isArray(body.rows) ? body.rows as Json[] : [],
        ),
      })
    }

    if (operation === "evidence_batch") {
      return reply(200, {
        status: "OK",
        operation,
        ...await evidenceBatch(
          admin,
          clean(body.runId),
          clean(body.decisionAt),
          clean(body.sourceDate),
          clean(body.archiveHash),
          Array.isArray(body.rows) ? body.rows as Json[] : [],
        ),
      })
    }

    if (operation === "select_month") {
      return reply(200, {
        status: "OK",
        operation,
        ...await selectMonth(
          admin,
          body.month && typeof body.month === "object" ? body.month as Json : {},
        ),
      })
    }

    if (operation === "complete_campaign") {
      return reply(200, {
        status: "COMPLETE",
        operation,
        ...await completeCampaign(admin, grant.grantId),
      })
    }

    return reply(400, {
      error: "Unknown materialization operation.",
      code: "P8_B2_OPERATION",
    })
  } catch (error) {
    const detail = error instanceof Error
      ? { code: error.message }
      : (error && typeof error === "object"
        ? {
            code: String((error as Record<string, unknown>).code ?? "P8_B2_MATERIALIZATION_FAILED"),
            message: String((error as Record<string, unknown>).message ?? ""),
            details: String((error as Record<string, unknown>).details ?? ""),
            hint: String((error as Record<string, unknown>).hint ?? ""),
          }
        : { code: "P8_B2_MATERIALIZATION_FAILED" })

    console.error("P8_B2_MATERIALIZATION_STOP", detail)
    return reply(500, {
      error: "P8-B2 materialization stopped safely.",
      ...detail,
    })
  }
})
