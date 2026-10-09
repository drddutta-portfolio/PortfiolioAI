import {createClient} from "https://esm.sh/@supabase/supabase-js@2.115.0"
import {consumeP4ExecutionGrant} from "../_shared/p4-execution-grant.ts"
import {TrendlyneObservedMcpClient} from "../_shared/trendlyne-observed.ts"
const PROJECT="lrgpjimipfkyoqbpsqzz",PORTFOLIO="6193a4aa-3235-4057-bddc-209fcf443fc2",SECURITY="d77abadc-d171-49d9-bfee-0b34dd0281f4"
const ACTION="V1_4_SBIN_OWNERSHIP_CAPTURE_2026_10_09",SOURCE="TRENDLYNE_MCP",DOMAIN="OWNERSHIP",OPERATION="GET_OWNERSHIP_DEALS_INSIDER_SAST"
const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store"}})
export const ownershipTransportContainsEvidence=(result:string)=>result.trim().length>0&&!/^status:\s*error/imu.test(result)&&!/no shareholding data available/iu.test(result)
const hash=async(v:unknown)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(v))))).map(x=>x.toString(16).padStart(2,"0")).join("")
Deno.serve(async req=>{
 if(req.method!=="POST")return reply(405,{code:"METHOD_NOT_ALLOWED"})
 const url=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"",mcp=Deno.env.get("TRENDLYNE_MCP_URL")
 if(url!==`https://${PROJECT}.supabase.co`||!key)return reply(409,{code:"DEVELOPMENT_TARGET_REQUIRED",providerCalls:0})
 try{
  const body=await req.json() as Record<string,unknown>
  if(body.action!==ACTION||body.portfolioId!==PORTFOLIO||body.securityId!==SECURITY)return reply(400,{code:"SBIN_OWNERSHIP_SCOPE_INVALID",providerCalls:0})
  const admin=createClient(url,key,{auth:{persistSession:false}})
  const grant=await consumeP4ExecutionGrant(admin,{grantId:body.grantId,action:ACTION,portfolioId:PORTFOLIO,securityId:SECURITY})
  if(!grant.ok)return reply(401,{code:grant.code,providerCalls:0})
  if(!mcp)return reply(409,{code:"PROVIDER_CONFIGURATION_UNAVAILABLE",providerCalls:0})
  const held=await admin.from("current_holdings").select("security_id").eq("portfolio_id",PORTFOLIO).eq("security_id",SECURITY).gt("current_quantity",0).maybeSingle()
  const security=await admin.from("securities").select("symbol,asset_class").eq("id",SECURITY).single()
  if(held.error||!held.data||security.error||security.data.symbol!=="SBIN"||security.data.asset_class!=="EQUITY")return reply(409,{code:"SBIN_OPEN_EQUITY_REQUIRED",providerCalls:0})
  const cached=await admin.from("data_source_records").select("id,raw_payload").eq("source_code",SOURCE).eq("record_kind","COMPLETE_RESEARCH_OWNERSHIP").eq("raw_payload->>security_id",SECURITY).order("retrieved_at",{ascending:false}).limit(50)
  if(cached.error)return reply(503,{code:"OWNERSHIP_CACHE_CHECK_FAILED",providerCalls:0})
  const usable=(cached.data??[]).find(row=>{const result=(row.raw_payload as Record<string,unknown>).result;return typeof result==="string"&&ownershipTransportContainsEvidence(result)})
  if(usable)return reply(200,{status:"SKIPPED_RETAINED_SOURCE_EXISTS",sourceRecordId:usable.id,providerCalls:0,canonicalWrites:0})
  const identity=await admin.from("security_identity_observations").select("provider_instrument_id").eq("security_id",SECURITY).eq("source_code",SOURCE).eq("evidence_status","MATCHED").not("provider_instrument_id","is",null).order("created_at",{ascending:false}).limit(1).maybeSingle()
  const source=await admin.from("data_sources").select("is_active,entitlement_verified,retention_rights_verified").eq("code",SOURCE).single()
  const control=await admin.from("provider_ingestion_controls").select("ingestion_enabled,policy_version").eq("source_code",SOURCE).single()
  const portfolio=await admin.from("portfolios").select("user_id").eq("id",PORTFOLIO).single()
  if(identity.error||!identity.data?.provider_instrument_id||source.error||!source.data.is_active||!source.data.entitlement_verified||!source.data.retention_rights_verified||control.error||!control.data.ingestion_enabled||portfolio.error)return reply(409,{code:"PROVIDER_IDENTITY_OR_CONTROL_NOT_VERIFIED",providerCalls:0})
  const run=await admin.from("data_ingestion_runs").insert({source_code:SOURCE,portfolio_id:PORTFOLIO,operation:ACTION,orchestration_type:ACTION,trigger_source:"OWNER",requested_by:portfolio.data.user_id,status:"RUNNING",requested_count:1,estimated_call_count:1,reserved_call_count:1,attempted_call_count:0,policy_version:control.data.policy_version,metadata:{execution_authority:"EXPLICIT_OWNER_DELEGATION_WITH_SINGLE_USE_P4_GRANT",canonical_admission:false}}).select("id").single()
  if(run.error)return reply(503,{code:"RUN_ACCOUNTING_FAILED",providerCalls:0})
  const runId=String(run.data.id)
  const item=await admin.from("data_ingestion_run_items").insert({ingestion_run_id:runId,security_id:SECURITY,data_domain:DOMAIN,status:"PLANNED",metadata:{mode:ACTION}}).select("id").single()
  if(item.error){await admin.from("data_ingestion_runs").update({status:"FAILED",completed_at:new Date().toISOString(),error_summary:"RUN_ITEM_ACCOUNTING_FAILED"}).eq("id",runId);return reply(503,{code:"RUN_ITEM_ACCOUNTING_FAILED",providerCalls:0,runId})}
  const itemId=String(item.data.id)
  const reservation=await admin.rpc("reserve_provider_budget_v1",{p_source_code:SOURCE,p_ingestion_run_id:runId,p_reservation_key:`${runId}:${DOMAIN}`,p_estimated_units:1,p_reservation_seconds:900})
  const reserved=reservation.data?.[0]
  if(reservation.error||!reserved?.reserved||!reserved.reservation_id){
   await admin.from("data_ingestion_runs").update({status:"FAILED",completed_at:new Date().toISOString(),reserved_call_count:0,attempted_call_count:0,error_summary:"BUDGET_RESERVATION_NOT_GRANTED"}).eq("id",runId)
   await admin.rpc("record_refresh_item_result_v1",{p_run_item_id:itemId,p_status:"SKIPPED_BUDGET",p_safe_reason_code:"BUDGET_RESERVATION_NOT_GRANTED",p_attempted_call_count:0,p_accepted_record_count:0,p_metadata:{mode:ACTION}})
   return reply(409,{code:"BUDGET_RESERVATION_NOT_GRANTED",providerCalls:0,runId})
  }
  const attemptedAt=new Date().toISOString();let providerSucceeded=false,safeCode:string|null=null,sourceRecordId:string|null=null,result:string|null=null
  try{
   result=await new TrendlyneObservedMcpClient(mcp).getOwnershipDealsInsiderSast(String(identity.data.provider_instrument_id),"shareholding")
   providerSucceeded=ownershipTransportContainsEvidence(result)
   if(!providerSucceeded)safeCode="PROVIDER_BUSINESS_DATA_UNAVAILABLE"
  }catch{safeCode="PROVIDER_REQUEST_FAILED"}
  const usage=await admin.rpc("record_provider_usage_event_v1",{p_source_code:SOURCE,p_ingestion_run_id:runId,p_run_item_id:itemId,p_security_id:SECURITY,p_data_domain:DOMAIN,p_operation_class:OPERATION,p_accounting_class:"PROVIDER_TOOL_ATTEMPT",p_estimated_internal_units:1,p_actual_internal_units:1,p_attempted_at:attemptedAt,p_completed_at:new Date().toISOString(),p_outcome:providerSucceeded?"SUCCEEDED":"FAILED",p_safe_error_code:safeCode,p_retry_attempt:0,p_idempotency_key:`${runId}:${DOMAIN}:1`})
  if(usage.error)safeCode="USAGE_ACCOUNTING_FAILED"
  if(result!==null){
   const payload={mode:ACTION,run_id:runId,security_id:SECURITY,security_symbol:"SBIN",provider_instrument_id:identity.data.provider_instrument_id,provider_tool:"get_ownership_deals_insider_sast",result}
   if(new TextEncoder().encode(JSON.stringify(payload)).byteLength>512*1024)safeCode="SOURCE_CAPTURE_TOO_LARGE"
   else{const raw=await admin.from("data_source_records").insert({source_code:SOURCE,ingestion_run_id:runId,record_kind:providerSucceeded?"COMPLETE_RESEARCH_OWNERSHIP":"V1_4_BANK_TRENDLYNE_FAILED_CAPTURE",external_record_id:`${identity.data.provider_instrument_id}:bank-v14-ownership:${runId}`,retrieved_at:new Date().toISOString(),payload_hash:await hash(payload),raw_payload:payload,terms_snapshot:{mode:ACTION,owner_authorized:true,canonical_admission:false,retries:0}}).select("id").single();if(raw.error)safeCode="RAW_CAPTURE_FAILED";else sourceRecordId=String(raw.data.id)}
  }
  const settled=await admin.rpc("settle_provider_budget_v1",{p_reservation_id:reserved.reservation_id,p_consumed_units:providerSucceeded?1:0,p_failed_units:providerSucceeded?0:1,p_released_units:0})
  if(settled.error)safeCode="BUDGET_SETTLEMENT_FAILED"
  const finished=await admin.rpc("record_refresh_item_result_v1",{p_run_item_id:itemId,p_status:safeCode?"FAILED":"ACCEPTED",p_safe_reason_code:safeCode,p_attempted_call_count:1,p_accepted_record_count:sourceRecordId?1:0,p_metadata:{mode:ACTION,raw_capture_only:true,source_record_id:sourceRecordId}})
  if(finished.error)safeCode="RUN_ITEM_ACCOUNTING_FAILED"
  const completed=await admin.from("data_ingestion_runs").update({status:safeCode?"FAILED":"SUCCEEDED",completed_at:new Date().toISOString(),attempted_call_count:1,accepted_count:sourceRecordId?1:0,failed_count:safeCode?1:0,error_summary:safeCode,metadata:{mode:ACTION,canonical_admission:false,source_record_id:sourceRecordId}}).eq("id",runId)
  if(completed.error)safeCode="RUN_ACCOUNTING_FAILED"
  return reply(safeCode?502:200,{status:safeCode?"FAILED":"RAW_CAPTURED_NOT_QUALIFIED",code:safeCode,providerCalls:1,retries:0,canonicalWrites:0,runId,sourceRecordId,budgetSettled:!settled.error})
 }catch{return reply(500,{code:"SBIN_OWNERSHIP_CONTROL_OR_RUNTIME_FAILURE"})}
})
