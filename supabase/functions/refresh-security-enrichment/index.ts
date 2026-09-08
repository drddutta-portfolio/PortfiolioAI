import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { parseEnrichmentAction, PLANNED_PRIMARY_ENRICHMENT_SOURCE } from "../_shared/enrichment.ts"
import { safeError, SafeOperationalError } from "../_shared/security.ts"

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" }
const json = (status: number, body: Readonly<Record<string, unknown>>) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } })

interface RequestBody { readonly action?: unknown; readonly portfolioId?: unknown; readonly securityIds?: unknown; readonly sourceCode?: unknown }

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (request.method !== "POST") return json(405,{ error: "Method not allowed." })
  const authorization = request.headers.get("Authorization")
  if (!authorization) return json(401,{ error: "Authentication required." })
  const url = Deno.env.get("SUPABASE_URL"), anonKey = Deno.env.get("SUPABASE_ANON_KEY"), serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !anonKey || !serviceKey) return json(500,{ error: "Supabase server configuration is incomplete." })
  try {
    const body = await request.json() as RequestBody
    const action = parseEnrichmentAction(body.action)
    if (!action) throw new SafeOperationalError("INVALID_ACTION","Unknown enrichment action.",400)
    const userClient = createClient(url,anonKey,{ global:{ headers:{ Authorization:authorization } } })
    const { data:userData,error:userError } = await userClient.auth.getUser()
    if (userError || !userData.user) throw new SafeOperationalError("AUTHENTICATION_REQUIRED","Invalid authenticated session.",401)
    const securityIds = Array.isArray(body.securityIds) && body.securityIds.every((value) => typeof value === "string") ? [...new Set(body.securityIds as string[])].slice(0,1000) : []
    if (action === "READ_CACHE") {
      if (!securityIds.length) return json(200,{ observations:[] })
      const { data,error } = await userClient.from("current_security_enrichment_v1").select("*").in("security_id",securityIds)
      if (error) throw error
      return json(200,{ observations:data ?? [] })
    }
    if (typeof body.portfolioId !== "string") throw new SafeOperationalError("INVALID_PORTFOLIO","portfolioId is required.",400)
    const admin = createClient(url,serviceKey,{ auth:{ persistSession:false } })
    const { data:portfolio,error:portfolioError } = await admin.from("portfolios").select("id").eq("id",body.portfolioId).eq("user_id",userData.user.id).single()
    if (portfolioError || !portfolio) throw new SafeOperationalError("PORTFOLIO_NOT_FOUND","Portfolio not found.",404)
    const sourceCode = typeof body.sourceCode === "string" ? body.sourceCode : PLANNED_PRIMARY_ENRICHMENT_SOURCE
    const { data:source,error:sourceError } = await admin.from("data_sources").select("code,is_active,entitlement_verified,retention_rights_verified,capabilities").eq("code",sourceCode).single()
    if (sourceError || !source) throw new SafeOperationalError("SOURCE_NOT_FOUND","Enrichment source is not registered.",404)
    if (!source.is_active || !source.entitlement_verified || !source.retention_rights_verified) {
      const completedAt = new Date().toISOString()
      await admin.from("data_ingestion_runs").insert({ source_code:source.code,operation:action,requested_by:userData.user.id,status:"CONFIGURATION_PENDING",completed_at:completedAt,requested_count:securityIds.length,metadata:{ reason:"ENTITLEMENT_OR_RETENTION_UNVERIFIED" } })
      return json(409,{ code:"SOURCE_CONFIGURATION_PENDING",error:"The subscribed source methods, entitlement, and retention rights must be verified before ingestion.",sourceCode:source.code })
    }
    throw new SafeOperationalError("ADAPTER_NOT_REGISTERED","No verified provider adapter is registered for this source.",501)
  } catch (error) {
    const safe = safeError(error)
    return json(safe.status,{ error:safe.publicMessage,code:safe.code })
  }
})
