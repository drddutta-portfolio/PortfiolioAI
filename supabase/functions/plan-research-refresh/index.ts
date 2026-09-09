import {createClient} from "https://esm.sh/@supabase/supabase-js@2"
import {PLANNED_PRIMARY_ENRICHMENT_SOURCE} from "../_shared/enrichment.ts"
import {SafeOperationalError,safeError} from "../_shared/security.ts"
import {buildResearchRefreshPlan} from "../_shared/research-refresh-plan.ts"

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"}
const reply=(status:number,body:Record<string,unknown>)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}})
interface RequestBody{portfolioId?:unknown;securityIds?:unknown;documentSecurityIds?:unknown;sourceCode?:unknown}

Deno.serve(async request=>{
  if(request.method==="OPTIONS")return new Response("ok",{headers:cors})
  if(request.method!=="POST")return reply(405,{error:"Method not allowed."})
  const authorization=request.headers.get("Authorization")
  if(!authorization)return reply(401,{error:"Authentication required."})
  const supabaseUrl=Deno.env.get("SUPABASE_URL"),anonKey=Deno.env.get("SUPABASE_ANON_KEY"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if(!supabaseUrl||!anonKey||!serviceKey)return reply(500,{error:"Supabase server configuration is incomplete."})
  try{
    const body=await request.json() as RequestBody
    if(typeof body.portfolioId!=="string")throw new SafeOperationalError("INVALID_PORTFOLIO","portfolioId is required.",400)
    const ids=Array.isArray(body.securityIds)&&body.securityIds.every(value=>typeof value==="string")?[...new Set(body.securityIds as string[])]:[]
    if(!ids.length||ids.length>25)throw new SafeOperationalError("INVALID_REFRESH_SCOPE","Select between 1 and 25 holdings for refresh planning.",400)
    const documentIds=Array.isArray(body.documentSecurityIds)&&body.documentSecurityIds.every(value=>typeof value==="string")?[...new Set(body.documentSecurityIds as string[])]:[]
    if(documentIds.length>3||documentIds.some(id=>!ids.includes(id)))throw new SafeOperationalError("INVALID_DOCUMENT_SCOPE","Document discovery is limited to three selected holdings.",400)
    const sourceCode=typeof body.sourceCode==="string"?body.sourceCode:PLANNED_PRIMARY_ENRICHMENT_SOURCE
    if(sourceCode!==PLANNED_PRIMARY_ENRICHMENT_SOURCE)throw new SafeOperationalError("UNSUPPORTED_SOURCE","Only the approved research provider is supported.",400)

    const user=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:authorization}}}),auth=await user.auth.getUser()
    if(auth.error||!auth.data.user)throw new SafeOperationalError("AUTHENTICATION_REQUIRED","Invalid authenticated session.",401)
    const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false}})
    const portfolio=await admin.from("portfolios").select("id").eq("id",body.portfolioId).eq("user_id",auth.data.user.id).single()
    if(portfolio.error)throw new SafeOperationalError("PORTFOLIO_NOT_FOUND","Portfolio not found.",404)

    const holdings=await admin.from("current_holdings").select("security_id").eq("portfolio_id",body.portfolioId).in("security_id",ids)
    if(holdings.error)throw holdings.error
    const held=new Set((holdings.data??[]).map(row=>row.security_id))
    if(ids.some(id=>!held.has(id)))throw new SafeOperationalError("SECURITY_NOT_HELD","Every selected security must be an open holding.",403)

    const [securities,control,identity,fundamentals,documents,usage]=await Promise.all([
      admin.from("securities").select("id,symbol,asset_class").in("id",ids),
      admin.from("provider_ingestion_controls").select("daily_internal_attempt_limit,per_run_internal_attempt_limit,actual_provider_quota_status").eq("source_code",sourceCode).single(),
      admin.from("security_identity_observations").select("security_id,created_at").eq("source_code",sourceCode).eq("evidence_status","MATCHED").in("security_id",ids),
      admin.from("fundamental_observations").select("security_id,metric_code,fresh_until").eq("source_code",sourceCode).in("security_id",ids),
      documentIds.length?admin.from("research_documents").select("security_id,created_at").in("security_id",documentIds):Promise.resolve({data:[],error:null}),
      admin.from("provider_usage_events").select("actual_internal_units").eq("source_code",sourceCode).eq("accounting_class","PROVIDER_TOOL_ATTEMPT").gte("attempted_at",new Date(new Date().setUTCHours(0,0,0,0)).toISOString()),
    ])
    const failure=[securities,control,identity,fundamentals,documents,usage].find(result=>result.error)
    if(failure?.error)throw new SafeOperationalError("REFRESH_PLAN_UNAVAILABLE","Cached refresh planning evidence is unavailable.",503)
    if((securities.data??[]).length!==ids.length)throw new SafeOperationalError("SECURITY_NOT_FOUND","One or more selected securities could not be resolved.",404)
    if((securities.data??[]).some(row=>row.asset_class!=="EQUITY"))throw new SafeOperationalError("EQUITY_ONLY","Research refresh planning accepts equities only.",400)

    const now=new Date(),identityBy=new Map((identity.data??[]).map(row=>[row.security_id,new Date(new Date(row.created_at).getTime()+180*86400000).toISOString()]))
    const fundamentalCodes=new Set(["MARKET_CAP_PROVIDER_RAW","PE_TTM","PBV_ADJUSTED_PROVIDER","REVENUE_TTM","NET_PROFIT_TTM","CFO_ANNUAL","ROE_ANNUAL"])
    const ownershipCodes=new Set(["SHAREHOLDING_PROMOTER_PERCENT","SHAREHOLDING_FII_FPI_PERCENT","SHAREHOLDING_DII_PERCENT","SHAREHOLDING_PUBLIC_PERCENT"])
    const minimumFresh=(securityId:string,codes:Set<string>)=>{const latest=new Map<string,number>();for(const row of fundamentals.data??[]){if(row.security_id!==securityId||!codes.has(row.metric_code)||!row.fresh_until)continue;const value=Date.parse(row.fresh_until);if(Number.isFinite(value)&&value>(latest.get(row.metric_code)??0))latest.set(row.metric_code,value)}return latest.size===codes.size?new Date(Math.min(...latest.values())).toISOString():null}
    const documentFresh=new Map((documents.data??[]).map(row=>[row.security_id,new Date(new Date(row.created_at).getTime()+7*86400000).toISOString()]))
    const evidence=ids.map(securityId=>({securityId,identityFreshUntil:identityBy.get(securityId)??null,fundamentalFreshUntil:minimumFresh(securityId,fundamentalCodes),ownershipFreshUntil:minimumFresh(securityId,ownershipCodes),documentsFreshUntil:documentFresh.get(securityId)??null}))
    const dailyObservedUsage=(usage.data??[]).reduce((sum,row)=>sum+(row.actual_internal_units??0),0)
    const result=buildResearchRefreshPlan({
      securities:(securities.data??[]).map(row=>({id:row.id,symbol:row.symbol,assetClass:row.asset_class})),
      evidence,
      documentSecurityIds:documentIds,
      dailyObservedUsage,
      providerQuotaStatus:control.data.actual_provider_quota_status,
      policy:{dailyLimit:control.data.daily_internal_attempt_limit,perRunLimit:control.data.per_run_internal_attempt_limit,retryReservePercent:.2,maxRetryReserve:12,identitySearchCalls:2},
      now,
    })
    return reply(200,{...result,selectedSecurityCount:ids.length,perRunInternalAttemptLimit:control.data.per_run_internal_attempt_limit,dailyInternalAttemptLimit:control.data.daily_internal_attempt_limit,dailyObservedUsage})
  }catch(error){const safe=safeError(error);return reply(safe.status,{code:safe.code,error:safe.message,providerCalls:0,budgetConsumed:0,executionAllowed:false})}
})
