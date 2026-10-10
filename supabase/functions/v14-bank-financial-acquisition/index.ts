import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {consumeP4ExecutionGrant} from "../_shared/p4-execution-grant.ts"
import {TrendlyneObservedMcpClient} from "../_shared/trendlyne-observed.ts"
import policy from "../_shared/v14-bank-approved-delegation.json" with {type:"json"}
const PROJECT=policy.developmentProject,PORTFOLIO=policy.portfolioId
export const BANK_FINANCIAL_SLICES:Readonly<Record<string,readonly string[]>>={
 "BANK-P1-01":["BANKBARODA","ICICIBANK","SBIN","FEDERALBNK"],
 "BANK-P1-02":["KARURVYSYA","KOTAKBANK","HDFCBANK","AXISBANK"],
 "BANK-P1-03":["IDFCFIRSTB","BANDHANBNK","IDBI","INDIANB"],
 "BANK-P1-04":["AUBANK"],
}
export function financialQuery(identities:readonly {securityId:string;symbol:string;instrumentId:string}[]){return `For ONLY these exact NSE banking equities: ${identities.map(x=>`${x.symbol} verified Trendlyne instrument ${x.instrumentId}`).join("; ")}. Return exact available structured fields for annual ROE, NIM TTM, annual ROA, CET1 ratio, Basel III total capital adequacy ratio, period-end gross advances YoY growth, period-end total deposits YoY growth, EPS quarterly YoY growth, generic price/book and its dated book-value basis, P/E TTM and self-history/peer valuation context. For each field return native label, value, unit, denominator, standalone/consolidated scope, reporting start/end and publication/as-of dates if actually available. Do not infer missing dates, annualize quarterly returns, equate Tier 1 with CET1, use Basel II zeros as current CAR, substitute adjusted PBV for generic P/B, or synthesize unavailable financial values. Mark unavailable concepts explicitly. Include exact stock identity per result.`}

export const EXACT_PARAMETER_QUERY="ROE Annual percent; ROA Annual percent; Net Interest Margin TTM; CET1 ratio; Capital Adequacy Basel III; Advances YoY growth; Deposits YoY growth; EPS Quarterly YoY Growth; Price to Book Value"
export const PARAMETER_SEARCH_QUERIES:Readonly<Record<string,string>>={CORE:EXACT_PARAMETER_QUERY,BANK_CAPITAL:"CET1 Common Equity Tier 1 ratio; Capital Adequacy Ratio Basel III",BANK_MARGIN:"Net Interest Margin NIM TTM Annual",BANK_GROWTH:"Advances Annual YoY Growth; Deposits Annual YoY Growth; EPS Quarterly YoY Growth; Price to Book Value"}
const ACTION="V1_4_BANK_FINANCIAL_CAPTURE_2026_10_09",SOURCE="TRENDLYNE_MCP",DOMAIN="BANK_FINANCIAL_CONTRACT_REFRESH",OPERATION="GET_PARAMETER_VALUES_MULTI_STOCK"
const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store"}})
export const financialTransportContainsEvidence=(result:string)=>{
 if(!result.trim()||/^status:\s*error/imu.test(result))return false
 try{const p=JSON.parse(result) as Record<string,unknown>;if(p.error||p.status==="error")return false;if("markdown_data" in p)return typeof p.markdown_data==="string"&&Boolean(p.markdown_data.trim())}catch{/* Plain provider text is retained, never automatically admitted. */}
 return true
}
const hash=async(v:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(v))))).map(x=>x.toString(16).padStart(2,"0")).join("")
Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,{code:"METHOD_NOT_ALLOWED"})
 const url=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"",mcp=Deno.env.get("TRENDLYNE_MCP_URL")
 if(url!==`https://${PROJECT}.supabase.co`||!key)return reply(409,{code:"DEVELOPMENT_TARGET_REQUIRED",providerCalls:0})
 try{
  const body=await req.json() as Record<string,unknown>
   const search=body.action==="V1_4_BANK_PARAMETER_SEARCH_2026_10_09",exact=body.action==="V1_4_BANK_EXACT_PARAMETERS_2026_10_09"
   const catalog=body.action==="V1_4_BANK_TOOL_CATALOG_2026_10_09",executionAction=catalog?"V1_4_BANK_TOOL_CATALOG_2026_10_09":search?"V1_4_BANK_PARAMETER_SEARCH_2026_10_09":exact?"V1_4_BANK_EXACT_PARAMETERS_2026_10_09":ACTION
  const slice=typeof body.sliceId==="string"?body.sliceId:"",symbols=BANK_FINANCIAL_SLICES[slice]
  if(body.action!==executionAction||(catalog||search)&&body.sliceId!=="BANK-P1-01"||body.portfolioId!==PORTFOLIO||!Object.hasOwn(BANK_FINANCIAL_SLICES,slice)||!symbols)return reply(400,{code:"BANK_FINANCIAL_SCOPE_INVALID",providerCalls:0})
  const queryKey=typeof body.queryKey==="string"?body.queryKey:"CORE"
  if(search&&!Object.hasOwn(PARAMETER_SEARCH_QUERIES,queryKey))return reply(400,{code:"PARAMETER_SEARCH_SCOPE_INVALID",providerCalls:0})
  const searchQuery=PARAMETER_SEARCH_QUERIES[queryKey]
  const parameters=Array.isArray(body.parameters)?body.parameters.filter((p):p is string=>typeof p==="string"):[]
  if(exact&&(!Array.isArray(body.parameters)||body.parameters.length!==parameters.length||!parameters.length||parameters.length>10||new Set(parameters).size!==parameters.length))return reply(400,{code:"EXACT_PARAMETER_SCOPE_INVALID",providerCalls:0})
  const ids=symbols.map(symbol=>Object.entries(policy.securities).find(([,s])=>s===symbol)![0]),SECURITY=ids[0]!,scope=search?(queryKey==="CORE"?"BANK_PARAMETER_SEARCH:2026-10-09":`BANK_PARAMETER_SEARCH:${queryKey}:2026-10-09`):exact?`${slice}:BANK_EXACT_PARAMETERS:2026-10-09`:catalog?"BANK_CONTRACT_TOOL_CATALOG:2026-10-09":`${slice}:BANK_FINANCIALS:2026-10-09`

  const admin=createClient(url,key,{auth:{persistSession:false}})
  const grant=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action:executionAction,portfolioId:PORTFOLIO,securityId:scope})
  if(!grant.ok)return reply(401,{code:grant.code,providerCalls:0})
  if(!mcp)return reply(409,{code:"PROVIDER_CONFIGURATION_UNAVAILABLE",providerCalls:0})
  const held=await admin.from("current_holdings").select("security_id").eq("portfolio_id",PORTFOLIO).in("security_id",ids).gt("current_quantity",0)
  const securities=await admin.from("securities").select("id,symbol,asset_class").in("id",ids)
  if(held.error||securities.error||ids.some(id=>!(held.data??[]).some(x=>x.security_id===id)||!(securities.data??[]).some(x=>x.id===id&&x.asset_class==="EQUITY"&&symbols.includes(x.symbol))))return reply(409,{code:"ALL_APPROVED_OPEN_BANKS_REQUIRED",providerCalls:0})
  if(exact){
   if(typeof body.parameterSourceId!=="string")return reply(400,{code:"PARAMETER_SEARCH_SOURCE_REQUIRED",providerCalls:0})
   const prior=await admin.from("data_source_records").select("raw_payload").eq("id",body.parameterSourceId).eq("source_code",SOURCE).eq("record_kind","V1_4_BANK_PARAMETER_SEARCH").single()
   const raw=(prior.data?.raw_payload as Record<string,unknown>|undefined)?.result
   let entries:unknown=[];try{const decoded=typeof raw==="string"?JSON.parse(raw):[];entries=Array.isArray(decoded)?decoded:decoded?.status==="success"&&Array.isArray(decoded.data)?decoded.data:[]}catch{/* Unproven tokens fail closed. */}
   if(prior.error||!Array.isArray(entries)||parameters.some(p=>!entries.some(e=>e&&typeof e==="object"&&e.parameter===p)))return reply(409,{code:"PARAMETER_TOKENS_NOT_SOURCE_PROVEN",providerCalls:0})
  }
  const recordKind=search?"V1_4_BANK_PARAMETER_SEARCH":exact?"V1_4_BANK_EXACT_PARAMETER_CAPTURE":catalog?"V1_4_BANK_TOOL_CATALOG":"V1_4_BANK_FINANCIAL_CONTRACT_CAPTURE"
  let cacheQuery=admin.from("data_source_records").select("id,retrieved_at").eq("source_code",SOURCE).eq("record_kind",recordKind).eq("raw_payload->>slice_id",slice).gte("retrieved_at",new Date(Date.now()-15*60*1000).toISOString()).limit(1)
  if(search)cacheQuery=cacheQuery.eq("raw_payload->>query_key",queryKey)
  const cached=await cacheQuery.maybeSingle()
  if(cached.error)return reply(503,{code:"FINANCIAL_CACHE_CHECK_FAILED",providerCalls:0})
  if(cached.data)return reply(200,{status:"SKIPPED_RECENT_CAPTURE_EXISTS",sourceRecordId:cached.data.id,providerCalls:0,canonicalWrites:0})
  const identities=[]
  for(const id of ids){
   const identity=await admin.from("security_identity_observations").select("provider_instrument_id").eq("security_id",id).eq("source_code",SOURCE).eq("evidence_status","MATCHED").not("provider_instrument_id","is",null).order("created_at",{ascending:false}).limit(1).maybeSingle()
   if(identity.error||!identity.data?.provider_instrument_id)return reply(409,{code:"ALL_PROVIDER_IDENTITIES_REQUIRED",providerCalls:0})
   identities.push({securityId:id,symbol:policy.securities[id as keyof typeof policy.securities],instrumentId:String(identity.data.provider_instrument_id)})
  }
  const source=await admin.from("data_sources").select("is_active,entitlement_verified,retention_rights_verified").eq("code",SOURCE).single()
  const control=await admin.from("provider_ingestion_controls").select("ingestion_enabled,policy_version").eq("source_code",SOURCE).single()
  const portfolio=await admin.from("portfolios").select("user_id").eq("id",PORTFOLIO).single()
  if(source.error||!source.data.is_active||!source.data.entitlement_verified||!source.data.retention_rights_verified||control.error||!control.data.ingestion_enabled||portfolio.error)return reply(409,{code:"PROVIDER_IDENTITY_OR_CONTROL_NOT_VERIFIED",providerCalls:0})
  const run=await admin.from("data_ingestion_runs").insert({source_code:SOURCE,portfolio_id:PORTFOLIO,operation:executionAction,orchestration_type:executionAction,trigger_source:"OWNER",requested_by:portfolio.data.user_id,status:"RUNNING",requested_count:catalog?1:ids.length,estimated_call_count:1,reserved_call_count:1,attempted_call_count:0,policy_version:control.data.policy_version,metadata:{execution_authority:"EXPLICIT_OWNER_DELEGATION_WITH_SINGLE_USE_P4_GRANT",canonical_admission:false,slice_id:slice,security_ids:ids,accounting:catalog?"ONE_MCP_PROTOCOL_DISCOVERY_REQUEST":"ONE_MULTI_STOCK_TOOL_ATTEMPT; PRIMARY_RUN_ITEM_ANCHOR_ONLY"}}).select("id").single()
  if(run.error)return reply(503,{code:"RUN_ACCOUNTING_FAILED",providerCalls:0})
  const runId=String(run.data.id)
  const item=await admin.from("data_ingestion_run_items").insert({ingestion_run_id:runId,security_id:SECURITY,data_domain:DOMAIN,status:"PLANNED",metadata:{mode:executionAction,slice_id:slice,security_ids:ids}}).select("id").single()
  if(item.error){await admin.from("data_ingestion_runs").update({status:"FAILED",completed_at:new Date().toISOString(),error_summary:"RUN_ITEM_ACCOUNTING_FAILED"}).eq("id",runId);return reply(503,{code:"RUN_ITEM_ACCOUNTING_FAILED",providerCalls:0,runId})}
  const itemId=String(item.data.id)
  const reservation=await admin.rpc("reserve_provider_budget_v1",{p_source_code:SOURCE,p_ingestion_run_id:runId,p_reservation_key:`${runId}:${DOMAIN}`,p_estimated_units:1,p_reservation_seconds:900})
  const reserved=reservation.data?.[0]
  if(reservation.error||!reserved?.reserved||!reserved.reservation_id){
   await admin.from("data_ingestion_runs").update({status:"FAILED",completed_at:new Date().toISOString(),reserved_call_count:0,attempted_call_count:0,error_summary:"BUDGET_RESERVATION_NOT_GRANTED"}).eq("id",runId)
   await admin.rpc("record_refresh_item_result_v1",{p_run_item_id:itemId,p_status:"SKIPPED_BUDGET",p_safe_reason_code:"BUDGET_RESERVATION_NOT_GRANTED",p_attempted_call_count:0,p_accepted_record_count:0,p_metadata:{mode:executionAction}})
   return reply(409,{code:"BUDGET_RESERVATION_NOT_GRANTED",providerCalls:0,runId})
  }
  const attemptedAt=new Date().toISOString();let providerSucceeded=false,safeCode:string|null=null,sourceRecordId:string|null=null,result:string|null=null
  try{
   const client=new TrendlyneObservedMcpClient(mcp)
   result=catalog?await client.listAvailableTools():search?await client.searchFinancialParameters(searchQuery!):exact?await client.getStockParameterValues(symbols,parameters):await client.getParameterValuesMultiStock(financialQuery(identities),"stock")
   providerSucceeded=financialTransportContainsEvidence(result)
   if(!providerSucceeded)safeCode="PROVIDER_BUSINESS_DATA_UNAVAILABLE"
  }catch{safeCode="PROVIDER_REQUEST_FAILED"}
  const usage=await admin.rpc("record_provider_usage_event_v1",{p_source_code:SOURCE,p_ingestion_run_id:runId,p_run_item_id:itemId,p_security_id:SECURITY,p_data_domain:DOMAIN,p_operation_class:catalog?"MCP_TOOLS_LIST":search?"SEARCH_FINANCIAL_PARAMETERS":exact?"GET_STOCK_PARAMETER_VALUES":OPERATION,p_accounting_class:catalog?"TRANSPORT_BOOTSTRAP":"PROVIDER_TOOL_ATTEMPT",p_estimated_internal_units:catalog?0:1,p_actual_internal_units:catalog?0:1,p_attempted_at:attemptedAt,p_completed_at:new Date().toISOString(),p_outcome:providerSucceeded?"SUCCEEDED":"FAILED",p_safe_error_code:safeCode,p_retry_attempt:0,p_idempotency_key:`${runId}:${DOMAIN}:1`})
  if(usage.error)safeCode="USAGE_ACCOUNTING_FAILED"
  if(result!==null){
   const payload={mode:executionAction,run_id:runId,slice_id:slice,security_ids:ids,identities,provider_tool:catalog?"tools/list":search?"search_financial_parameters":exact?"get_stock_parameter_values":"get_parameter_values_multi_stock",query_key:search?queryKey:null,query:catalog?null:search?searchQuery:exact?null:financialQuery(identities),parameters:exact?parameters:null,parameter_source_id:exact?body.parameterSourceId:null,result}
   if(new TextEncoder().encode(JSON.stringify(payload)).byteLength>512*1024)safeCode="SOURCE_CAPTURE_TOO_LARGE"
   else{const raw=await admin.from("data_source_records").insert({source_code:SOURCE,ingestion_run_id:runId,record_kind:providerSucceeded?recordKind:"V1_4_BANK_TRENDLYNE_FAILED_CAPTURE",external_record_id:`${slice}:bank-v14-financials:${runId}`,retrieved_at:new Date().toISOString(),payload_hash:await hash(payload),raw_payload:payload,terms_snapshot:{mode:executionAction,owner_authorized:true,canonical_admission:false,retries:0}}).select("id").single();if(raw.error)safeCode="RAW_CAPTURE_FAILED";else sourceRecordId=String(raw.data.id)}
  }
  const settled=await admin.rpc("settle_provider_budget_v1",{p_reservation_id:reserved.reservation_id,p_consumed_units:catalog?0:providerSucceeded?1:0,p_failed_units:catalog?0:providerSucceeded?0:1,p_released_units:catalog?1:0})
  if(settled.error)safeCode="BUDGET_SETTLEMENT_FAILED"
  const finished=await admin.rpc("record_refresh_item_result_v1",{p_run_item_id:itemId,p_status:safeCode?"FAILED":"ACCEPTED",p_safe_reason_code:safeCode,p_attempted_call_count:1,p_accepted_record_count:sourceRecordId?1:0,p_metadata:{mode:executionAction,raw_capture_only:true,source_record_id:sourceRecordId}})
  if(finished.error)safeCode="RUN_ITEM_ACCOUNTING_FAILED"
  const completed=await admin.from("data_ingestion_runs").update({status:safeCode?"FAILED":"SUCCEEDED",completed_at:new Date().toISOString(),attempted_call_count:1,accepted_count:sourceRecordId?1:0,failed_count:safeCode?1:0,error_summary:safeCode,metadata:{mode:executionAction,execution_authority:"EXPLICIT_OWNER_DELEGATION_WITH_SINGLE_USE_P4_GRANT",slice_id:slice,security_ids:ids,accounting:catalog?"ONE_MCP_PROTOCOL_DISCOVERY_REQUEST":"ONE_MULTI_STOCK_TOOL_ATTEMPT; PRIMARY_RUN_ITEM_ANCHOR_ONLY",canonical_admission:false,source_record_id:sourceRecordId}}).eq("id",runId)
  if(completed.error)safeCode="RUN_ACCOUNTING_FAILED"
  return reply(safeCode?502:200,{status:safeCode?"FAILED":"RAW_CAPTURED_NOT_QUALIFIED",code:safeCode,providerCalls:catalog?0:1,protocolRequests:catalog?1:0,retries:0,canonicalWrites:0,runId,sourceRecordId,budgetSettled:!settled.error})
 }catch{return reply(500,{code:"BANK_FINANCIAL_CONTROL_OR_RUNTIME_FAILURE"})}
})
