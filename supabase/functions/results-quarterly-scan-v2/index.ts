import { createClient } from "https://esm.sh/@supabase/supabase-js@2.115.0"

/** Owner-authenticated Results scan dispatch.
 * Runs a Development-only, verified R3->R4 background acquisition through an
 * isolated GitHub push-triggered worker branch. No raw-source fetching in the
 * browser, no duplicate fundamental storage authority, no Production writes.
 */
const OPERATION = "RESULTS_QUARTERLY_SCAN_V2"
const SOURCE = "COMPANY_EXCHANGE_FILING"
const DOMAIN = "QUARTERLY_RESULTS"
const APPROVED_PORTFOLIO = "6193a4aa-3235-4057-bddc-209fcf443fc2"
const WORKER_BRANCH = "results-scan-worker-dev"
const PATH = ".github/scan-requests/latest.json"
const GITHUB_URL = "https://api.github.com/repos/drddutta-portfolio/PortfiolioAI/contents/" + PATH
const responseHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info",
  "Content-Type": "application/json",
}
const reply = (code: number, value: Record<string, unknown>) =>
  new Response(JSON.stringify(value), { status: code, headers: responseHeaders })
const fail = (e: unknown) => e instanceof Error ? e.message.slice(0, 90) : "SCAN_UNKNOWN_FAILURE"
type Client = ReturnType<typeof createClient>
type Body = { action?: "START" | "STATUS" | "SCHEDULED_START"; portfolioId?: string }
// Supports current independently rotated Supabase API keys while keeping
// legacy JWT keys as a fallback during the November 2026 transition.
function apiKey(dictionaryName: string, legacyName: string): string | undefined {
  const serialized = Deno.env.get(dictionaryName)
  if (serialized) {
    try {
      const keys: unknown = JSON.parse(serialized)
      if (keys && typeof keys === "object" && "default" in keys) {
        const current = (keys as {default?:unknown}).default
        if (typeof current === "string" && current.length) return current
      }
    } catch { /* No authority is inferred from an invalid configuration. */ }
  }
  return Deno.env.get(legacyName)
}

async function checkOwner(admin: Client, authHeader: string, portfolioId: string): Promise<string | null> {
  const url = Deno.env.get("SUPABASE_URL")!
  const anon = apiKey("SUPABASE_PUBLISHABLE_KEYS","SUPABASE_ANON_KEY")
  if (!anon) return null
  const session = createClient(url, anon, { global: { headers: { Authorization: authHeader } } })
  const user = await session.auth.getUser()
  if (user.error || !user.data.user) return null
  const row = await admin.from("portfolios").select("id").eq("id",portfolioId)
    .eq("user_id",user.data.user.id).maybeSingle()
  return !row.error && row.data ? user.data.user.id : null
}

async function status(admin: Client, portfolioId: string) {
  const recent = await admin.from("data_ingestion_runs")
    .select("id,status,started_at,completed_at,requested_count,accepted_count,failed_count,rejected_count,unchanged_count,error_summary,metadata")
    .eq("portfolio_id",portfolioId).eq("operation",OPERATION)
    .order("started_at",{ascending:false}).limit(1).maybeSingle()
  if (recent.error) throw recent.error
  const run = recent.data
  if (!run) return {lastScan:null,newResults:0,run:null}
  // GitHub's worker timeout is four hours. A stale job must not disable
  // Scan Now indefinitely after its runner fails or disappears.
  if (run.status === "RUNNING" && Date.now() - Date.parse(run.started_at) > 5 * 60 * 60 * 1000) {
    const completedAt = new Date().toISOString()
    const stale = await admin.from("data_ingestion_runs").update({
      status:"FAILED",completed_at:completedAt,error_summary:"SCAN_WORKER_TIMEOUT",
      metadata:{...(run.metadata ?? {}),stage:"WORKER_TIMEOUT"},
    }).eq("id",run.id).eq("status","RUNNING").select("id").maybeSingle()
    if (stale.error) throw stale.error
    if (stale.data) {
      const items=await admin.from("data_ingestion_run_items").update({
        status:"FAILED",safe_reason_code:"SCAN_WORKER_TIMEOUT",completed_at:completedAt,
      }).eq("ingestion_run_id",run.id).in("status",["PLANNED","ATTEMPTED"])
      if(items.error) throw items.error
      run.status="FAILED"
      run.completed_at=completedAt
      run.error_summary="SCAN_WORKER_TIMEOUT"
    } else {
      // The background worker completed concurrently; read fresh state.
      return status(admin,portfolioId)
    }
  }
  const rows = await admin.from("data_ingestion_run_items")
    .select("status").eq("ingestion_run_id",run.id).eq("data_domain",DOMAIN)
  if (rows.error) throw rows.error
  const pending = rows.data.filter(r=>r.status==="PLANNED"||r.status==="ATTEMPTED").length
  const processed = rows.data.length-pending
  return {
    lastScan: run.completed_at,
    newResults: run.accepted_count ?? 0,
    run: {
      id:run.id,status:run.status,started_at:run.started_at,
      completed_at:run.completed_at,requested_count:run.requested_count,
      processed,pending,accepted_count:run.accepted_count,
      failed_count:run.failed_count, rejected_count:run.rejected_count,
      unchanged_count:run.unchanged_count,
      error_summary:run.error_summary,
      // Owner-visible counts only: no credentials, URLs or source payloads.
      observationsInserted: Number(run.metadata?.observations_inserted??0),
      documentsParsed: Number(run.metadata?.issuer_documents_parsed??0),
    }
  }
}

async function enqueue(admin: Client, portfolioId: string, userId: string | null, scheduled = false) {
  const token = Deno.env.get("RESULTS_SCAN_GITHUB_CONTENTS_TOKEN")
  if (!token) return reply(503,{error:"SCAN_WORKER_CONFIGURATION_PENDING",details:"Development scan dispatcher credential not configured"})
  const prior = await status(admin,portfolioId)
  if (prior.run?.status==="RUNNING") return reply(200,prior)
  // A scheduled dispatch may never start a second run on the same IST day.
  if (scheduled) {
    const recent=await admin.from("data_ingestion_runs").select("started_at")
      .eq("portfolio_id",portfolioId).eq("operation",OPERATION)
      .eq("trigger_source","SCHEDULED").order("started_at",{ascending:false}).limit(1).maybeSingle()
    if(recent.error)throw recent.error
    const istDay=(iso:string)=>new Date(Date.parse(iso)+330*60000).toISOString().slice(0,10)
    if(recent.data?.started_at && istDay(recent.data.started_at)===istDay(new Date().toISOString()))
      return reply(200,{...prior,scheduledSkipped:"ALREADY_SCHEDULED_TODAY"})
  }
  const transactions:{security_id:string}[]=[]
  for (let offset=0;;offset+=700) {
    const q=await admin.from("transactions").select("security_id")
      .eq("portfolio_id",portfolioId).is("superseded_at",null)
      .range(offset,offset+699)
    if(q.error)throw q.error
    transactions.push(...q.data)
    if(q.data.length<700) break
  }
  const ids=[...new Set(transactions.map(x=>x.security_id))]
  const equity:string[]=[]
  for (let offset=0;offset<ids.length;offset+=100) {
    const q=await admin.from("securities").select("id")
      .eq("asset_class","EQUITY").in("id",ids.slice(offset,offset+100))
    if(q.error)throw q.error
    equity.push(...q.data.map(x=>x.id))
  }
  equity.sort()
  if (equity.length<1||equity.length>262)
    return reply(409,{error:"SCAN_UNIVERSE_NOT_VERIFIED",details:"Unrecognized equity cohort size"})
  const create=await admin.from("data_ingestion_runs").insert({
    portfolio_id:portfolioId,source_code:SOURCE,operation:OPERATION,status:"RUNNING",
    trigger_source:scheduled?"SCHEDULED":"OWNER",orchestration_type:"BACKGROUND_VERIFIED_ORIGINALS",
    requested_by:userId,requested_count:equity.length,accepted_count:0,
    metadata:{contract:OPERATION,stage:"DISPATCHING",source:"EXCHANGE_ORIGINALS_REUSE_FIRST",trigger:scheduled?"DAILY_0700_IST":"OWNER"}
  }).select("id").single()
  if(create.error) {
    // Atomic partial-unique index is the authority for concurrent tabs.
    if(create.error.code==="23505")return reply(200,await status(admin,portfolioId))
    throw create.error
  }
  const runId=create.data.id as string
  try {
    for(let offset=0;offset<equity.length;offset+=80) {
      const batch=equity.slice(offset,offset+80).map(security_id=>({
        ingestion_run_id:runId,security_id,data_domain:DOMAIN,status:"PLANNED"
      }))
      const rows=await admin.from("data_ingestion_run_items").insert(batch)
      if(rows.error) throw rows.error
    }
    const requestHeaders={
      "Authorization":"Bearer "+token,
      "Accept":"application/vnd.github+json",
      "X-GitHub-Api-Version":"2022-11-28",
      "Content-Type":"application/json",
    }
    const lookup=await fetch(GITHUB_URL+"?ref="+encodeURIComponent(WORKER_BRANCH),{
      method:"GET",headers:requestHeaders
    })
    if(!lookup.ok&&lookup.status!==404)throw new Error("SCAN_WORKER_READ_HTTP_"+lookup.status)
    const existing=lookup.ok?await lookup.json():null
    if(existing&&!/^[0-9a-f]{40}$/.test(String(existing.sha??"")))
      throw new Error("SCAN_WORKER_CONTROL_SHA_UNVERIFIED")
    const content=btoa(JSON.stringify({contract:OPERATION,run_id:runId}))
    const body={
      branch:WORKER_BRANCH,
      message:"scan: owner-requested Results quarterly run "+runId,
      content,
      ...(existing?{sha:existing.sha}:{})
    }
    const publish=await fetch(GITHUB_URL,{
      method:"PUT",headers:requestHeaders,body:JSON.stringify(body)
    })
    if(!publish.ok) {
      // GitHub rejects writes for several independent reasons. Report only
      // a fixed, nonsecret reason code; never echo the token or request headers.
      const data: unknown = await publish.json().catch(()=>null)
      const message = data && typeof data==="object" && "message" in data
        && typeof (data as {message?:unknown}).message==="string"
        ? (data as {message:string}).message.toLowerCase() : ""
      const reason = message.includes("resource not accessible by personal access token")
        || message.includes("resource not accessible by integration")
        ? "GITHUB_TOKEN_CONTENTS_WRITE_DENIED"
        : message.includes("protected branch") || message.includes("ruleset")
          || message.includes("repository rule")
          ? "GITHUB_BRANCH_WRITE_RESTRICTED"
        : message.includes("workflow") && message.includes("permission")
          ? "GITHUB_WORKFLOW_PERMISSION_REQUIRED"
        : message.includes("must have write access") || message.includes("write access to this repository")
          ? "GITHUB_REPOSITORY_WRITE_ACCESS_DENIED"
        : message.includes("personal access token") && message.includes("organization")
          ? "GITHUB_TOKEN_ORGANIZATION_APPROVAL_REQUIRED"
        : "GITHUB_DISPATCH_FORBIDDEN_UNCLASSIFIED"
      console.error("RESULTS_SCAN_GITHUB_DISPATCH_REJECTED",{
        httpStatus:publish.status,reason,
        requiredPermission:"repository Contents:read/write",
        // GitHub itself supplies permission names, never access token contents.
        acceptedPermissions:(publish.headers.get("x-accepted-github-permissions")??"").slice(0,120),
      })
      throw new Error("SCAN_WORKER_DISPATCH_HTTP_"+publish.status+"_"+reason)
    }
    const pushed=await publish.json()
    if (!pushed?.commit?.sha) throw new Error("SCAN_WORKER_DISPATCH_ACK_MISSING")
    const mark=await admin.from("data_ingestion_runs").update({
      metadata:{contract:OPERATION,stage:"QUEUED",dispatch_commit:pushed.commit.sha,
        source:"EXCHANGE_ORIGINALS_REUSE_FIRST",trigger:scheduled?"DAILY_0700_IST":"OWNER"}
    }).eq("id",runId).eq("status","RUNNING")
    if(mark.error)throw mark.error
    return reply(200,await status(admin,portfolioId))
  } catch(error) {
    const reason=fail(error)
    const finishedAt=new Date().toISOString()
    await admin.from("data_ingestion_run_items").update({
      status:"FAILED",safe_reason_code:"SCAN_DISPATCH_FAILED",completed_at:finishedAt,
    }).eq("ingestion_run_id",runId).eq("status","PLANNED")
    await admin.from("data_ingestion_runs").update({
      status:"FAILED",completed_at:finishedAt,
      error_summary:reason,metadata:{contract:OPERATION,stage:"DISPATCH_FAILED"}
    }).eq("id",runId)
    return reply(503,{error:"SCAN_DISPATCH_FAILED",details:reason})
  }
}

Deno.serve(async(request:Request)=>{
  if(request.method==="OPTIONS")return new Response("ok",{headers:responseHeaders})
  if(request.method!=="POST")return reply(405,{error:"METHOD_NOT_ALLOWED"})
  const header=request.headers.get("Authorization")
  if(!header)return reply(401,{error:"AUTH_REQUIRED"})
  const url=Deno.env.get("SUPABASE_URL"),key=apiKey("SUPABASE_SECRET_KEYS","SUPABASE_SERVICE_ROLE_KEY")
  if(!url||!key||!apiKey("SUPABASE_PUBLISHABLE_KEYS","SUPABASE_ANON_KEY"))
    return reply(503,{error:"SUPABASE_CONFIGURATION_MISSING"})
  const admin=createClient(url,key,{auth:{persistSession:false}})
  try {
    const payload=await request.json() as Body
    if(!payload.portfolioId||!["START","STATUS","SCHEDULED_START"].includes(payload.action??""))
      return reply(400,{error:"INVALID_SCAN_REQUEST"})
    if(payload.portfolioId!==APPROVED_PORTFOLIO)
      return reply(403,{error:"PORTFOLIO_NOT_IN_DEVELOPMENT_SCAN_SCOPE"})
    if(payload.action==="SCHEDULED_START") {
      // No user session may impersonate a scheduler. A dedicated 256-bit
      // Supabase Vault secret, verified by an RPC reserved for service_role,
      // is mandatory and cannot be sent to the browser.
      const supplied=request.headers.get("x-portfolioai-results-scheduler-token")
      if(!supplied || !/^[0-9a-f]{64}$/.test(supplied))
        return reply(403,{error:"SCHEDULED_SCAN_FORBIDDEN"})
      const verified=await admin.rpc("verify_results_scan_scheduler_token_v1",{p_token:supplied})
      if(verified.error || verified.data!==true)
        return reply(403,{error:"SCHEDULED_SCAN_FORBIDDEN"})
      const active=await admin.from("portfolios").select("id")
        .eq("id",payload.portfolioId).eq("is_active",true).maybeSingle()
      if(active.error||!active.data) return reply(403,{error:"SCHEDULED_PORTFOLIO_INACTIVE"})
      return await enqueue(admin,payload.portfolioId,null,true)
    }
    const userId=await checkOwner(admin,header,payload.portfolioId)
    if(!userId)return reply(403,{error:"PORTFOLIO_FORBIDDEN"})
    if(payload.action==="STATUS")return reply(200,await status(admin,payload.portfolioId))
    return await enqueue(admin,payload.portfolioId,userId)
  }catch(error){
    console.error("Results scan V2:",fail(error))
    return reply(500,{error:"SCAN_OPERATION_FAILED",details:fail(error)})
  }
})
