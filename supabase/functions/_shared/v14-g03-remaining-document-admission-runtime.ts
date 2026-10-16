import type {SupabaseClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import {g02StableId,hashG02,g02SourcePin,type OriginalSourceScope} from './v14-g02-source-import.ts'
import policy from './v14-g03-remaining-authorization.json' with {type:'json'}
import pins from './v14-g03-remaining-original-pins.json' with {type:'json'}
const scope:OriginalSourceScope={group:'G03',policy,pins,originalKind:'V1_4_G03_REGISTERED_OFFICIAL_ORIGINAL'}
import batch from './v14-g03-remaining-document-batch.json' with {type:'json'}
import {G03_DOCUMENT_KIND,G03_DOCUMENT_REVIEW_KIND} from './v14-g03-document-review.ts'
import {g02PostgresTimestamp} from './v14-g02-document-review.ts'

/** Fixed documentary findings only: no providers, arbitrary reviews or snapshots. */
export async function admitRemainingG03Document(db:SupabaseClient,body:Record<string,unknown>,claims:Record<string,unknown>){
 const allowed=['action','authorizationHash','securityId','requirementCode','originalHash','normalizedFragment','extractionMethod']
 const b=batch.find(b=>b.securityId===body.securityId&&b.requirementCode===body.requirementCode)
 if(Object.keys(body).some(k=>!allowed.includes(k))||body.action!=='ADMIT_FIXED_G03_REMAINING_DOCUMENT'||body.authorizationHash!==scope.policy.directiveSha256||!b||body.originalHash!==b.originalHash||body.normalizedFragment!==b.fragment||body.extractionMethod!=='POPPLER_LAYOUT_WHITESPACE_NORMALIZED_ORIGINAL_BYTES')throw Error('EXACT_G03_REMAINING_DOCUMENT_REQUIRED')
 const holder=crypto.randomUUID(),operation='G03_REMAINING_DOCUMENT:'+b.securityId+':'+b.requirementCode
 const lease=await db.rpc('acquire_data_ingestion_lease_v1',{p_source_code:'OWNER_REVIEWED_CLASSIFICATION',p_operation:operation,p_lease_holder:holder,p_lease_seconds:60})
 if(lease.error||lease.data?.[0]?.acquired!==true)throw Error('G03_REMAINING_DOCUMENT_BUSY')
 try{
  const pin=g02SourcePin(b.originalHash,scope),originalId=await g02StableId({kind:scope.originalKind,security:b.securityId,hash:b.originalHash}),documentId=await g02StableId({kind:'G03_DOCUMENT',security:b.securityId,hash:b.originalHash}),linkId=await g02StableId({kind:'G03_DOCUMENT_SOURCE',documentId,sourceId:originalId})
  const owner=await db.from('portfolios').select('user_id').eq('id',scope.policy.portfolioId).single(),original=await db.from('data_source_records').select('raw_payload,payload_hash,source_code').eq('id',originalId).single(),document=await db.from('research_documents').select('security_id,canonical_content_hash,identity_status').eq('id',documentId).single(),link=await db.from('research_document_sources').select('source_record_id,research_document_id,content_hash,source_status').eq('id',linkId).single()
  if(owner.error||owner.data.user_id!==scope.policy.ownerId||original.error||!original.data||original.data.source_code!==pin.source_code||original.data.raw_payload.security_id!==b.securityId||original.data.raw_payload.original_sha256!==b.originalHash||original.data.payload_hash!==await hashG02(original.data.raw_payload)||document.error||document.data.security_id!==b.securityId||document.data.canonical_content_hash!==b.originalHash||document.data.identity_status!=='VERIFIED'||link.error||link.data.source_record_id!==originalId||link.data.research_document_id!==documentId||link.data.content_hash!==b.originalHash||link.data.source_status!=='VERIFIED')throw Error('G03_REMAINING_OWNER_AND_ORIGINAL_NOT_VERIFIED')
  const sourceId=await g02StableId({kind:G03_DOCUMENT_KIND,originalId,fragment:b.fragment}),oldSource=await db.from('data_source_records').select('payload_hash,raw_payload,retrieved_at').eq('id',sourceId).maybeSingle()
  if(oldSource.error)throw Error('G03_REMAINING_EXCERPT_LOOKUP_FAILED')
  const at=oldSource.data?.raw_payload.proven_availability_at??g02PostgresTimestamp(new Date().toISOString())
  const raw={version:'G03_ORIGINAL_DOCUMENT_EXCERPT_V1',security_id:b.securityId,symbol:b.symbol,original_source_record_id:originalId,original_sha256:b.originalHash,original_url:pin.original_url,fragment:b.fragment,assessment:b.assessment,finding:b.finding,does_not_prove:b.doesNotProve,publication_precision:'UNKNOWN',proven_availability_at:at,extraction_method:body.extractionMethod,authorization_reference:scope.policy.directiveSha256,pdf_page:b.pdfPage}
  const sourceHash=await hashG02(raw)
  if(oldSource.data&&(oldSource.data.payload_hash!==sourceHash||await hashG02(oldSource.data.raw_payload)!==sourceHash))throw Error('G03_REMAINING_EXCERPT_IMMUTABLE_CONFLICT')
  if(!oldSource.data){const w=await db.from('data_source_records').insert({id:sourceId,source_code:pin.source_code,record_kind:G03_DOCUMENT_KIND,external_record_id:'G03_EXCERPT:'+sourceId,source_url:pin.original_url,retrieved_at:at,published_at:null,payload_hash:sourceHash,raw_payload:raw,terms_snapshot:{owner_delegated:true,no_owner_session_attribution:true,execution_sha:claims.sha,execution_run_id:claims.run_id}});if(w.error)throw Error('G03_REMAINING_EXCERPT_INSERT_FAILED')}
  const sourceRead=await db.from('data_source_records').select('payload_hash,raw_payload,retrieved_at').eq('id',sourceId).single()
  if(sourceRead.error||sourceRead.data.payload_hash!==sourceHash||await hashG02(sourceRead.data.raw_payload)!==sourceHash)throw Error('G03_REMAINING_EXCERPT_READBACK_FAILED')
  const reviewId=await g02StableId({kind:G03_DOCUMENT_REVIEW_KIND,sourceId,requirement:b.requirementCode}),old=await db.from('research_evidence_requirement_reviews').select('review_hash,reviewed_at').eq('id',reviewId).maybeSingle()
  if(old.error)throw Error('G03_REMAINING_REVIEW_LOOKUP_FAILED')
  const payload={portfolio_id:scope.policy.portfolioId,security_id:b.securityId,requirement_code:b.requirementCode,review_kind:G03_DOCUMENT_REVIEW_KIND,decision:'SUPPORTS',source_record_id:sourceId,research_document_id:documentId,provider_document_id:null,source_payload_hash:sourceHash,supporting_quote:b.fragment,period_start:b.reportingPeriodStart,period_end:b.reportingPeriodEnd,period_type:b.periodType,unit:null,currency:null,consolidation_scope:null,published_at:null,retrieved_at:sourceRead.data.retrieved_at,fresh_through:g02PostgresTimestamp(new Date(Date.parse(b.reportingPeriodEnd+'T00:00:00Z')+365*86400000).toISOString()),review_version:'V1_4_REQUIREMENT_REVIEW_V2',reviewed_by:null,reviewed_at:old.data?.reviewed_at??g02PostgresTimestamp(new Date().toISOString()),supersedes_review_id:null,metadata:{original_sha256:b.originalHash,assessment:b.assessment,does_not_prove:b.doesNotProve,pdf_page:b.pdfPage,review_authorization:{authorization_reference:scope.policy.directiveSha256,authorizing_owner_id:scope.policy.ownerId,executor:'GITHUB_OIDC_G03_OFFICIAL_QUALIFICATION'}}}
  const reviewHash=await hashG02(payload)
  if(old.data&&old.data.review_hash!==reviewHash)throw Error('G03_REMAINING_REVIEW_IMMUTABLE_CONFLICT')
  if(!old.data){const w=await db.from('research_evidence_requirement_reviews').insert({id:reviewId,...payload,review_hash:reviewHash});if(w.error)throw Error('G03_REMAINING_REVIEW_INSERT_FAILED')}
  const read=await db.from('research_evidence_requirement_reviews').select('review_hash,decision,reviewed_by').eq('id',reviewId).single()
  if(read.error||read.data.review_hash!==reviewHash||read.data.decision!=='SUPPORTS'||read.data.reviewed_by!==null)throw Error('G03_REMAINING_REVIEW_READBACK_FAILED')
  return {code:'G03_DOCUMENT_REVIEW_ADMITTED_NOT_CANONICAL_READY',securityId:b.securityId,sourceId,reviewId,reused:Boolean(old.data),providerApiCalls:0,canonicalMaterialization:false}
 }finally{await db.rpc('release_data_ingestion_lease_v1',{p_source_code:'OWNER_REVIEWED_CLASSIFICATION',p_operation:operation,p_lease_holder:holder,p_cooldown_seconds:0})}
}
