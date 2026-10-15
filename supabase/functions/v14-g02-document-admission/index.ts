import {g03SessionStatusExecutorQualified} from '../_shared/v14-g03-executor-identity.ts'
import {refreshG03CurrentSessionStatus} from '../_shared/v14-g03-session-status-runtime.ts'
import {g03FinancialExecutorQualified} from '../_shared/v14-g03-executor-identity.ts'
import {admitFixedG03Cash} from '../_shared/v14-g03-cash-admission-runtime.ts'
import {g03DocumentExecutorQualified,g03OrderExecutorQualified} from '../_shared/v14-g03-executor-identity.ts'
import {g03RoceExecutorQualified} from '../_shared/v14-g03-executor-identity.ts'
import {admitFixedG03Roce} from '../_shared/v14-g03-roce-admission-runtime.ts'
import {G02_SOURCE_SCOPE,G03_SOURCE_SCOPE} from '../_shared/v14-g02-source-import.ts'
import {G03_DOCUMENT_REVIEW_BATCH,G03_ORDER_REVIEW_BATCH,G03_ORDER_POLICY,g03OrderFacts,g03OrderFactsQualified,G03_DOCUMENT_KIND,G03_DOCUMENT_REVIEW_KIND} from '../_shared/v14-g03-document-review.ts'
import {renewG02History} from '../_shared/v14-g02-history-renewal-runtime.ts'
import {g02DocumentExecutorQualified} from '../_shared/v14-g02-executor-identity.ts'
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import {createRemoteJWKSet,jwtVerify} from 'https://esm.sh/jose@6.1.0'
import {G02_OWNER_POLICY as policy,g02StableId,hashG02,g02SourcePin} from '../_shared/v14-g02-source-import.ts'
import {G02_DOCUMENT_REVIEW_BATCH as batch,G02_DOCUMENT_KIND,G02_DOCUMENT_REVIEW_KIND,g02PostgresTimestamp} from '../_shared/v14-g02-document-review.ts'
const audience=`https://${policy.developmentProject}.supabase.co/functions/v1/v14-g02-document-admission`,jwks=createRemoteJWKSet(new URL('https://token.actions.githubusercontent.com/.well-known/jwks'))
Deno.serve(async req=>{
 const reply=(s:number,code:string,data:Record<string,unknown>={})=>new Response(JSON.stringify({code,...data}),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}})
 if(req.method!=='POST')return reply(405,'METHOD_NOT_ALLOWED')
 const url=Deno.env.get('SUPABASE_URL')??'',key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??''
 if(url!==`https://${policy.developmentProject}.supabase.co`||!key)return reply(409,'DEVELOPMENT_ONLY')
 let claims:Record<string,unknown>
 try{const v=await jwtVerify((req.headers.get('authorization')??'').replace(/^Bearer\s+/i,''),jwks,{issuer:'https://token.actions.githubusercontent.com',audience,algorithms:['RS256'],maxTokenAge:'5m'});claims=v.payload}catch{return reply(401,'SIGNED_G02_EXECUTOR_REQUIRED')}
 const body=await req.json().catch(()=>null)
 if(body?.action==='ADMIT_FIXED_G03_BEL_ROCE_BATCH'){
  if(!g03RoceExecutorQualified(claims))return reply(403,'G03_ROCE_EXECUTOR_SCOPE_INVALID')
  try{return reply(200,'G03_FIXED_ROCE_REVIEWS_ADMITTED_NOT_CANONICAL_READY',await admitFixedG03Roce(createClient(url,key,{auth:{persistSession:false}}),body,claims))}catch(e){return reply(409,e instanceof Error&&/^[A-Z0-9_:]+$/.test(e.message)?e.message:'G03_ROCE_ADMISSION_FAILED')}
 }
 if(body?.action==='QUALIFY_G03_BEL_CURRENT_SESSION'){
  if(!g03SessionStatusExecutorQualified(claims))return reply(403,'G03_SESSION_STATUS_EXECUTOR_SCOPE_INVALID')
  try{return reply(200,'G03_CURRENT_SESSION_RESULT',await refreshG03CurrentSessionStatus(createClient(url,key,{auth:{persistSession:false}}),body,undefined,undefined,claims))}catch(e){return reply(409,e instanceof Error&&/^[A-Z0-9_:]+$/.test(e.message)?e.message:'G03_CURRENT_SESSION_QUALIFICATION_FAILED')}
 }
 if(body?.action==='ADMIT_FIXED_G03_BEL_CASH_COMPONENTS'){
  if(!g03FinancialExecutorQualified(claims))return reply(403,'G03_FINANCIAL_EXECUTOR_SCOPE_INVALID')
  try{return reply(200,'G03_CASH_COMPONENTS_ADMITTED_NOT_CANONICAL_READY',await admitFixedG03Cash(createClient(url,key,{auth:{persistSession:false}}),body,claims))}catch(e){return reply(409,e instanceof Error&&/^[A-Z0-9_:]+$/.test(e.message)?e.message:'G03_CASH_ADMISSION_FAILED')}
 }
 const order=body?.action==='ADMIT_FIXED_G03_ORDER_HISTORY',g03=order||body?.action==='ADMIT_FIXED_G03_DOCUMENT',scope=g03?G03_SOURCE_SCOPE:G02_SOURCE_SCOPE,sourcePolicy=order?G03_ORDER_POLICY:scope.policy,selectedBatch=order?G03_ORDER_REVIEW_BATCH:g03?G03_DOCUMENT_REVIEW_BATCH:batch,documentKind=g03?G03_DOCUMENT_KIND:G02_DOCUMENT_KIND,reviewKind=g03?G03_DOCUMENT_REVIEW_KIND:G02_DOCUMENT_REVIEW_KIND
 if(!(order?g03OrderExecutorQualified(claims):g03?g03DocumentExecutorQualified(claims):g02DocumentExecutorQualified(claims)))return reply(403,scope.group+'_EXECUTOR_SCOPE_INVALID')
 if(body?.action==='RENEW_FIXED_G02_STOCK_HISTORY'){try{return reply(200,'G02_STOCK_HISTORY_PROOFS_RENEWED_NOT_READY',await renewG02History(createClient(url,key,{auth:{persistSession:false}}),body))}catch(e){return reply(409,e instanceof Error&&/^[A-Z0-9_:]+$/.test(e.message)?e.message:'G02_HISTORY_RENEWAL_FAILED')}}
 const b=selectedBatch.find(x=>x.securityId===body?.securityId&&x.requirementCode===(body.requirementCode??'BUSINESS_DURABILITY')&&(!order||x.reportingPeriodEnd===body.reportingPeriodEnd))
 if(body?.action!==(order?'ADMIT_FIXED_G03_ORDER_HISTORY':g03?'ADMIT_FIXED_G03_DOCUMENT':'ADMIT_FIXED_G02_DURABILITY_DOCUMENT')||body.authorizationHash!==sourcePolicy.directiveSha256||!b||body.originalHash!==b.originalHash||body.normalizedFragment!==b.fragment||body.extractionMethod!=='POPPLER_LAYOUT_WHITESPACE_NORMALIZED_ORIGINAL_BYTES')return reply(400,'EXACT_G02_DOCUMENT_BATCH_REQUIRED')
 if(order&&(!b||!('sourceReportPeriodEnd' in b)||!g03OrderFactsQualified(b as typeof G03_ORDER_REVIEW_BATCH[number],body.verifiedOrderCells)))return reply(400,'G03_ORDER_CHART_CELLS_NOT_VERIFIED')
 const orderFacts=order&&b&&'sourceReportPeriodEnd' in b?g03OrderFacts(b as typeof G03_ORDER_REVIEW_BATCH[number]):null
 const db=createClient(url,key,{auth:{persistSession:false}})
 try{
  const pin=g02SourcePin(b.originalHash,scope),originalId=await g02StableId({kind:scope.originalKind,security:b.securityId,hash:b.originalHash}),documentId=await g02StableId({kind:scope.group+'_DOCUMENT',security:b.securityId,hash:b.originalHash})
  const owner=await db.from('portfolios').select('user_id').eq('id',sourcePolicy.portfolioId).single(),original=await db.from('data_source_records').select('id,raw_payload,payload_hash').eq('id',originalId).single(),document=await db.from('research_documents').select('canonical_content_hash,identity_status').eq('id',documentId).single()
  if(owner.error||owner.data.user_id!==sourcePolicy.ownerId||original.error||original.data.raw_payload.original_sha256!==b.originalHash||original.data.payload_hash!==await hashG02(original.data.raw_payload)||document.error||document.data.canonical_content_hash!==b.originalHash||document.data.identity_status!=='VERIFIED')return reply(409,'G02_ORIGINAL_OWNER_AND_DOCUMENT_NOT_VERIFIED')
  const sourceId=await g02StableId({kind:documentKind,originalId,fragment:b.fragment}),oldSource=await db.from('data_source_records').select('id,payload_hash,raw_payload,retrieved_at').eq('id',sourceId).maybeSingle()
  if(oldSource.error)return reply(503,'G02_EXCERPT_LOOKUP_FAILED')
  const at=oldSource.data?.raw_payload.proven_availability_at??new Date().toISOString(),raw={version:scope.group+'_ORIGINAL_DOCUMENT_EXCERPT_V1',security_id:b.securityId,symbol:b.symbol,original_source_record_id:originalId,original_sha256:b.originalHash,original_url:pin.original_url,fragment:b.fragment,assessment:b.assessment,finding:b.finding,does_not_prove:b.doesNotProve,publication_precision:'UNKNOWN',proven_availability_at:at,extraction_method:body.extractionMethod,authorization_reference:sourcePolicy.directiveSha256,...(order?{order_history:orderFacts}:{})}
  const sourceHash=await hashG02(raw)
  if(oldSource.data&&(oldSource.data.payload_hash!==sourceHash||await hashG02(oldSource.data.raw_payload)!==sourceHash))return reply(409,'G02_EXCERPT_IMMUTABLE_CONFLICT')
  if(!oldSource.data){const insert=await db.from('data_source_records').insert({id:sourceId,source_code:pin.source_code,record_kind:documentKind,external_record_id:scope.group+'_EXCERPT:'+sourceId,source_url:pin.original_url,retrieved_at:at,published_at:null,payload_hash:sourceHash,raw_payload:raw,terms_snapshot:{owner_delegated:true,no_owner_session_attribution:true,execution_sha:claims.sha,execution_run_id:claims.run_id}});if(insert.error&&insert.error.code!=='23505')return reply(409,'G02_EXCERPT_INSERT_REJECTED',{postgresCode:insert.error.code})}
  const sourceRead=await db.from('data_source_records').select('payload_hash,raw_payload,retrieved_at').eq('id',sourceId).single();if(sourceRead.error||sourceRead.data.payload_hash!==sourceHash||await hashG02(sourceRead.data.raw_payload)!==sourceHash)return reply(409,'G02_EXCERPT_READBACK_FAILED')
  const associationSourceId=g03||b.requirementCode==='OWNERSHIP_GOVERNANCE'?originalId:sourceId,linkId=await g02StableId({kind:scope.group+'_DOCUMENT_SOURCE',documentId,sourceId:associationSourceId}),link={id:linkId,research_document_id:documentId,source_code:pin.source_code,source_record_id:associationSourceId,provider_document_id:null,source_url:pin.original_url,source_title:pin.title,source_published_at:null,retrieved_at:at,content_hash:b.originalHash,extraction_method:body.extractionMethod,extraction_version:'G02_DOCUMENT_QUALIFICATION_V1',extraction_provenance:{original_source_record_id:originalId,execution_sha:claims.sha,execution_run_id:claims.run_id},source_status:'VERIFIED'}
  const linkInsert=g03||b.requirementCode==='OWNERSHIP_GOVERNANCE'?{error:null}:await db.from('research_document_sources').insert(link);if(linkInsert.error&&linkInsert.error.code!=='23505')return reply(409,'G02_EXCERPT_LINK_REJECTED')
  const linkRead=await db.from('research_document_sources').select('content_hash,source_record_id,research_document_id,source_status').eq('id',linkId).single();if(linkRead.error||linkRead.data.content_hash!==b.originalHash||linkRead.data.source_record_id!==associationSourceId||linkRead.data.research_document_id!==documentId||linkRead.data.source_status!=='VERIFIED')return reply(409,'G02_EXCERPT_LINK_READBACK_FAILED')
  const reviewId=await g02StableId({kind:reviewKind,sourceId,requirement:b.requirementCode}),oldReview=await db.from('research_evidence_requirement_reviews').select('id,review_hash,reviewed_at').eq('id',reviewId).maybeSingle();if(oldReview.error)return reply(503,'G02_REVIEW_LOOKUP_FAILED')
  const payload={portfolio_id:sourcePolicy.portfolioId,security_id:b.securityId,requirement_code:b.requirementCode,review_kind:reviewKind,decision:'SUPPORTS',source_record_id:sourceId,research_document_id:documentId,provider_document_id:null,source_payload_hash:sourceHash,supporting_quote:b.fragment,period_start:b.reportingPeriodStart,period_end:b.reportingPeriodEnd,period_type:b.periodType,unit:null,currency:null,consolidation_scope:null,published_at:null,retrieved_at:sourceRead.data.retrieved_at,fresh_through:g02PostgresTimestamp(new Date(Date.parse((order?G03_ORDER_POLICY.sourceReportPeriodEnd:b.reportingPeriodEnd)+'T00:00:00Z')+(g03?365:550)*86400000).toISOString()),review_version:'V1_4_REQUIREMENT_REVIEW_V2',reviewed_by:null,reviewed_at:oldReview.data?.reviewed_at??g02PostgresTimestamp(new Date().toISOString()),supersedes_review_id:null,metadata:{...(order?{order_history:orderFacts}:{}),original_sha256:b.originalHash,assessment:b.assessment,does_not_prove:b.doesNotProve,review_authorization:{authorization_reference:sourcePolicy.directiveSha256,authorizing_owner_id:sourcePolicy.ownerId,executor:'GITHUB_OIDC_'+scope.group+'_OFFICIAL_QUALIFICATION'}}}
  const reviewHash=await hashG02(payload);if(oldReview.data&&oldReview.data.review_hash!==reviewHash)return reply(409,'G02_REVIEW_IMMUTABLE_CONFLICT')
  if(!oldReview.data){const insert=await db.from('research_evidence_requirement_reviews').insert({id:reviewId,...payload,review_hash:reviewHash});if(insert.error&&insert.error.code!=='23505')return reply(409,'G02_DOCUMENT_REVIEW_REJECTED',{postgresCode:insert.error.code})}
  const read=await db.from('research_evidence_requirement_reviews').select('review_hash,decision,reviewed_by,review_kind').eq('id',reviewId).single();if(read.error||read.data.review_hash!==reviewHash||read.data.decision!=='SUPPORTS'||read.data.reviewed_by!==null||read.data.review_kind!==reviewKind)return reply(409,'G02_REVIEW_READBACK_FAILED')
  return reply(200,scope.group+'_DOCUMENT_REVIEW_ADMITTED_NOT_CANONICAL_READY',{securityId:b.securityId,sourceId,reviewId,reused:Boolean(oldReview.data),providerApiCalls:0,canonicalMaterialization:false})
 }catch{return reply(500,'G02_DOCUMENT_ADMISSION_FAILED')}
})
