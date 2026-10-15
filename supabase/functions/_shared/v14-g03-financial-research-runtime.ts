import type {SupabaseClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import {TrendlyneObservedMcpClient} from './trendlyne-observed.ts'
import {hashG02} from './v14-g02-source-import.ts'
import policy from './v14-g03-financial-authorization.json' with {type:'json'}
export const G03_BEL_RESEARCH_KIND='G03_BEL_APPROVED_FINANCIAL_RESEARCH_V1'
const SOURCE='TRENDLYNE_MCP',BATCH='2026-10-15'
const queries={
 MARGIN:'Only Bharat Electronics Limited, NSE BEL, ISIN INE263A01024, Trendlyne stock 175. Return the actual quarterly standalone Operating Profit and Operating Revenue for each quarter ending Sep-2024, Dec-2024, Mar-2025, Jun-2025, Sep-2025, Dec-2025, Mar-2026 and Jun-2026. Include exact quarter-end dates, accounting scope and INR units, original parameter labels, latest reported quarter date, and the published definition of Operating Profit: whether depreciation, finance costs and other income are included/excluded. Parameters Operating Profit Qtr, Operating Profit 1Q Ago through Operating Profit 7Qtr Ago, Operating Rev. Qtr through Operating Rev. 7Q ago. Do not use forecasts, growth rates, annual values or another company. If standalone is unavailable explicitly identify the actual scope. Preserve missing fields as missing.',
 DEBT_VALUATION_DOCUMENTS:'Bharat Electronics Limited NSE BEL ISIN INE263A01024 only. Find original issuer/exchange documents for FY2024, FY2025 and FY2026 giving numeric interest-bearing borrowings including zero (not a printed dash), lease liabilities, unrestricted versus pledged/restricted cash, EBIT, EBITDA and total finance costs including lease interest. Also find original quarterly result/annual-report disclosures with authoritative original publication/filing timestamps and outstanding shares suitable for dated historical P/E, EV/EBITDA and FCF-yield qualification. Return original document URLs, exact financial period/scope, definition passages and source/publication dates, not forecasts or inferred zero debt. Research discovery only; do not assert our readiness.'
} as const
type ResearchKind=keyof typeof queries
export function g03BelResearchScope(body:Record<string,unknown>):ResearchKind{
 const kind=body.researchKind
 if(body.action!=='ACQUIRE_G03_BEL_FINANCIAL_RESEARCH'||body.authorizationHash!==policy.contractSha256||body.portfolioId!==policy.portfolioId||body.securityId!==policy.securityId||body.batchDate!==BATCH||!Object.hasOwn(queries,String(kind)))throw Error('G03_RESEARCH_EXACT_SCOPE_REQUIRED')
 return kind as ResearchKind
}
type Client=Pick<TrendlyneObservedMcpClient,'getParameterValuesMultiStock'|'getDocumentSearchResults'>
async function releaseResearchLease(db:SupabaseClient,operation:string,holder:string){
 const released=await db.rpc('release_data_ingestion_lease_v1',{p_source_code:SOURCE,p_operation:operation,p_lease_holder:holder,p_cooldown_seconds:0})
 if(released.error)throw Error('G03_RESEARCH_LEASE_RELEASE_FAILED')
}
export async function acquireG03BelFinancialResearch(db:SupabaseClient,body:Record<string,unknown>,claims:Record<string,unknown>,client:Client){
 const kind=g03BelResearchScope(body),operation=G03_BEL_RESEARCH_KIND+':'+kind,holder=crypto.randomUUID()
 const owner=await db.from('portfolios').select('user_id').eq('id',policy.portfolioId).single()
 const source=await db.from('data_sources').select('is_active,entitlement_verified,retention_rights_verified').eq('code',SOURCE).single()
 const control=await db.from('provider_ingestion_controls').select('ingestion_enabled,policy_version').eq('source_code',SOURCE).single()
 const identity=await db.from('security_identity_observations').select('provider_instrument_id').eq('security_id',policy.securityId).eq('source_code',SOURCE).eq('evidence_status','MATCHED').order('created_at',{ascending:false}).limit(1).maybeSingle()
 const holding=await db.from('current_holdings').select('security_id').eq('portfolio_id',policy.portfolioId).eq('security_id',policy.securityId).gt('current_quantity',0).maybeSingle()
 if(owner.error||owner.data?.user_id!==policy.ownerId||!holding.data||holding.error||identity.error||String(identity.data?.provider_instrument_id)!=='175')throw Error('G03_RESEARCH_HELD_OWNER_IDENTITY_NOT_VERIFIED')
 if(source.error||!source.data?.is_active||!source.data.entitlement_verified||!source.data.retention_rights_verified||control.error||!control.data?.ingestion_enabled)throw Error('G03_RESEARCH_PROVIDER_CONTROLS_NOT_VERIFIED')
 const leaseOperation=operation+':'+BATCH,lease=await db.rpc('acquire_data_ingestion_lease_v1',{p_source_code:SOURCE,p_operation:leaseOperation,p_lease_holder:holder,p_lease_seconds:300})
 if(lease.error||lease.data?.[0]?.acquired!==true)throw Error('G03_RESEARCH_LEASE_BUSY_OR_UNAVAILABLE')
 try{
  const prior=await db.from('data_ingestion_runs').select('id,status,metadata').eq('source_code',SOURCE).eq('operation',operation).eq('metadata->>batch_date',BATCH).limit(1).maybeSingle()
  if(prior.error)throw Error('G03_RESEARCH_PRIOR_RUN_LOOKUP_FAILED')
  if(prior.data)return {code:'G03_RESEARCH_ALREADY_ATTEMPTED_NO_RETRY',priorRunId:prior.data.id,status:prior.data.status,providerApiCalls:0,canonicalMaterialization:false,reused:true}
  const run=await db.from('data_ingestion_runs').insert({source_code:SOURCE,operation,portfolio_id:policy.portfolioId,orchestration_type:'OWNER_AUTHORIZED_G03_FINANCIAL_RESEARCH',trigger_source:'MANUAL',status:'RUNNING',requested_count:1,estimated_call_count:1,reserved_call_count:0,attempted_call_count:0,metadata:{batch_date:BATCH,research_kind:kind,authorization_reference:policy.contractSha256,execution_sha:claims.sha,execution_run_id:claims.run_id,automatic_retries:0,canonical_promotion:false}}).select('id').single()
  if(run.error)throw Error('G03_RESEARCH_RUN_CREATE_FAILED')
  const runId=String(run.data.id)
  const reservation=await db.rpc('reserve_provider_budget_v1',{p_source_code:SOURCE,p_ingestion_run_id:runId,p_reservation_key:operation+':'+BATCH,p_estimated_units:1,p_reservation_seconds:300}),reserved=reservation.data?.[0]
  if(reservation.error||!reserved?.reserved||!reserved.reservation_id){
   const closed=await db.from('data_ingestion_runs').update({status:'FAILED',completed_at:new Date().toISOString(),error_summary:'G03_RESEARCH_BUDGET_NOT_GRANTED',skipped_count:1}).eq('id',runId)
   if(closed.error)throw Error('G03_RESEARCH_BUDGET_REJECTION_ACCOUNTING_FAILED')
   throw Error('G03_RESEARCH_BUDGET_NOT_GRANTED')
  }
  const reservationId=String(reserved.reservation_id)
  let attempted=0,providerSucceeded=false,captureId:string|null=null,captureHash:string|null=null,failure:string|null=null,itemId:string|null=null,usageVerified=false
  try{
   const item=await db.from('data_ingestion_run_items').insert({ingestion_run_id:runId,security_id:policy.securityId,data_domain:operation,status:'PLANNED',metadata:{query:queries[kind],discovery_only:true}}).select('id').single()
   if(item.error)throw Error('G03_RESEARCH_ITEM_CREATE_FAILED');itemId=String(item.data.id)
   const started=new Date().toISOString();attempted=1
   let result:string|null=null
   try{result=kind==='MARGIN'?await client.getParameterValuesMultiStock(queries[kind],'stock'):await client.getDocumentSearchResults(queries[kind]);providerSucceeded=true}catch{failure='G03_RESEARCH_PROVIDER_REQUEST_FAILED'}
   const usage=await db.rpc('record_provider_usage_event_v1',{p_source_code:SOURCE,p_ingestion_run_id:runId,p_run_item_id:itemId,p_security_id:policy.securityId,p_data_domain:operation,p_operation_class:kind==='MARGIN'?'GET_PARAMETER_VALUES_MULTI_STOCK':'GET_DOCUMENT_SEARCH_RESULTS',p_accounting_class:'PROVIDER_TOOL_ATTEMPT',p_estimated_internal_units:1,p_actual_internal_units:1,p_attempted_at:started,p_completed_at:new Date().toISOString(),p_outcome:providerSucceeded?'SUCCEEDED':'FAILED',p_safe_error_code:failure,p_retry_attempt:0,p_idempotency_key:runId+':1'})
   if(usage.error)throw Error('G03_RESEARCH_USAGE_ACCOUNTING_FAILED');usageVerified=true
   if(result!==null){
    if(new TextEncoder().encode(result).byteLength>512*1024)throw Error('G03_RESEARCH_CAPTURE_TOO_LARGE')
    const raw={version:G03_BEL_RESEARCH_KIND,security_id:policy.securityId,symbol:'BEL',isin:'INE263A01024',provider_instrument_id:'175',research_kind:kind,query:queries[kind],result,canonical_promotion:false,source_semantics_not_automatically_proven:true},hash=await hashG02(raw)
    const capture=await db.from('data_source_records').insert({source_code:SOURCE,ingestion_run_id:runId,record_kind:G03_BEL_RESEARCH_KIND,external_record_id:BATCH+':'+kind,retrieved_at:new Date().toISOString(),published_at:null,payload_hash:hash,raw_payload:raw,terms_snapshot:{owner_authorized_research:true,authorization_reference:policy.contractSha256,execution_sha:claims.sha,reservation_id:reservationId,canonical_promotion:false}}).select('id,payload_hash').single()
    if(capture.error||capture.data?.payload_hash!==hash)throw Error('G03_RESEARCH_CAPTURE_PERSISTENCE_FAILED');captureId=String(capture.data.id);captureHash=hash
   }
  }catch(e){failure=e instanceof Error&&/^G03_[A-Z_]+$/.test(e.message)?e.message:'G03_RESEARCH_EXECUTION_FAILED'}
  const settled=await db.rpc('settle_provider_budget_v1',{p_reservation_id:reservationId,p_consumed_units:attempted&&providerSucceeded?1:0,p_failed_units:attempted&&!providerSucceeded?1:0,p_released_units:attempted?0:1})
  if(settled.error)throw Error('G03_RESEARCH_SETTLEMENT_FAILED')
  if(itemId){const itemResult=await db.rpc('record_refresh_item_result_v1',{p_run_item_id:itemId,p_status:failure?'FAILED':'ACCEPTED',p_safe_reason_code:failure,p_attempted_call_count:attempted,p_accepted_record_count:0,p_metadata:{capture_id:captureId,canonical_promotion:false}});if(itemResult.error)failure='G03_RESEARCH_ITEM_ACCOUNTING_FAILED'}
  const metadata={batch_date:BATCH,research_kind:kind,reservation_id:reservationId,capture_id:captureId,payload_hash:captureHash,usage_verified:usageVerified,automatic_retries:0,canonical_promotion:false,execution_sha:claims.sha,execution_run_id:claims.run_id,authorization_reference:policy.contractSha256}
  const complete=await db.from('data_ingestion_runs').update({status:failure?'FAILED':'SUCCEEDED',completed_at:new Date().toISOString(),reserved_call_count:1,attempted_call_count:attempted,fetched_count:captureId?1:0,accepted_count:0,failed_count:failure?1:0,error_summary:failure,metadata}).eq('id',runId)
  if(complete.error)throw Error('G03_RESEARCH_RUN_COMPLETION_FAILED')
  if(failure)throw Error(failure)
  return {code:'G03_RESEARCH_CAPTURED_NOT_ADMITTED',runId,reservationId,captureId,payloadHash:captureHash,providerApiCalls:attempted,retryAttempts:0,canonicalMaterialization:false,financialObservationWrites:0,acceptedReviews:0,reused:false}
 }finally{await releaseResearchLease(db,leaseOperation,holder)}
}
