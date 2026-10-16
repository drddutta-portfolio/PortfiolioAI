import type {SupabaseClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import {hashG02,g02StableId} from './v14-g02-source-import.ts'
import {g02PostgresTimestamp} from './v14-g02-document-review.ts'
import {deriveG03CashConversion,G03_CASH_KIND,type CashComponents} from './v14-g03-cash-components.ts'
import {G03_REMAINING_CASH_SOURCE_SCOPE as scope,REMAINING_CASH_POLICY as p,REMAINING_CASH_BATCH as batch,REMAINING_CASH_SOURCE_KIND} from './v14-g03-remaining-cash-contract.ts'
import {stableG02} from './v14-g02-source-import.ts'

/** Two issuers, six fixed annual cash reviews; no provider, registry or selection writes. */
export async function admitRemainingG03Cash(db:SupabaseClient,body:Record<string,unknown>,claims:Record<string,unknown>){
 const allowed=['action','authorizationHash','securityId','verifiedCells']
 const securityId=typeof body.securityId==='string'?body.securityId:''
 const cells=batch.cells.filter(c=>c.securityId===securityId),periods=batch.periods.filter(b=>b.securityId===securityId)
 if(Object.keys(body).some(k=>!allowed.includes(k))||body.action!=='ADMIT_FIXED_G03_REMAINING_CASH'||body.authorizationHash!==p.directiveSha256||periods.length!==3||stableG02(body.verifiedCells)!==stableG02(cells))throw Error('EXACT_G03_REMAINING_CASH_CELLS_REQUIRED')
 const holder=crypto.randomUUID(),operation=('G03_REMAINING_CASH_'+periods[0].symbol).toUpperCase()
 const lease=await db.rpc('acquire_data_ingestion_lease_v1',{p_source_code:'OWNER_REVIEWED_CLASSIFICATION',p_operation:operation,p_lease_holder:holder,p_lease_seconds:120})
 if(lease.error)throw Error('G03_REMAINING_CASH_LEASE_FAILED_'+lease.error.code)
 if(lease.data?.[0]?.acquired!==true)throw Error('G03_REMAINING_CASH_BUSY')
 try{
 const owner=await db.from('portfolios').select('user_id').eq('id',p.portfolioId).single(),authority=await db.from('data_sources').select('is_active,entitlement_verified,retention_rights_verified').eq('code',p.sourceAuthority).single()
 if(owner.error||owner.data.user_id!==p.ownerId||authority.error||authority.data.is_active!==true||authority.data.entitlement_verified!==true||authority.data.retention_rights_verified!==true)throw Error('G03_REMAINING_CASH_OWNER_OR_SOURCE_NOT_PROVEN')
 const originals=new Map<string,{id:string;documentId:string;url:string}>()
 for(const pin of scope.pins.filter(pin=>pin.security_id===securityId)){
  const id=await g02StableId({kind:scope.originalKind,security:securityId,hash:pin.original_sha256}),documentId=await g02StableId({kind:'G03_DOCUMENT',security:securityId,hash:pin.original_sha256}),linkId=await g02StableId({kind:'G03_DOCUMENT_SOURCE',documentId,sourceId:id})
  const source=await db.from('data_source_records').select('raw_payload,payload_hash,source_code').eq('id',id).single(),doc=await db.from('research_documents').select('security_id,canonical_content_hash,identity_status').eq('id',documentId).single(),link=await db.from('research_document_sources').select('research_document_id,source_record_id,content_hash,source_status').eq('id',linkId).single()
  if(source.error||source.data.source_code!==p.sourceAuthority||source.data.raw_payload.security_id!==securityId||source.data.raw_payload.original_sha256!==pin.original_sha256||source.data.payload_hash!==await hashG02(source.data.raw_payload)||doc.error||doc.data.security_id!==securityId||doc.data.canonical_content_hash!==pin.original_sha256||doc.data.identity_status!=='VERIFIED'||link.error||link.data.research_document_id!==documentId||link.data.source_record_id!==id||link.data.content_hash!==pin.original_sha256||link.data.source_status!=='VERIFIED')throw Error('G03_REMAINING_CASH_REGISTERED_ORIGINAL_NOT_PROVEN')
  originals.set(pin.original_sha256,{id,documentId,url:pin.original_url})
 }
 const results=[]
 for(const b of periods){
  const parent=originals.get(b.originalSha256),derivation=deriveG03CashConversion(b.components as CashComponents)
  if(!parent||!derivation)throw Error('G03_REMAINING_CASH_DERIVATION_NOT_PROVEN')
  const priorSource=await db.from('data_source_records').select('raw_payload,payload_hash,retrieved_at').eq('id',b.sourceId).maybeSingle()
  if(priorSource.error)throw Error('G03_REMAINING_CASH_SOURCE_LOOKUP_FAILED')
  const at=priorSource.data?.raw_payload.proven_availability_at??g02PostgresTimestamp(new Date().toISOString())
  const raw={version:REMAINING_CASH_SOURCE_KIND,security_id:securityId,original_source_record_id:parent.id,original_sha256:b.originalSha256,original_url:parent.url,fragment:b.fragment,financial_components:b.components,verified_source_cells:batch.cells.filter(c=>c.originalSha256===b.originalSha256),verified_scope_evidence:batch.scopeEvidence.filter(c=>c.originalSha256===b.originalSha256),derivation,authorization_reference:p.directiveSha256,publication_precision:'UNKNOWN',proven_availability_at:at,not_historical_pit_evidence:true,adjustment_policy:'NO_PORTFOLIOAI_RECLASSIFICATION_APPLIED'}
  const sourceHash=await hashG02(raw)
  if(priorSource.data&&(priorSource.data.payload_hash!==sourceHash||await hashG02(priorSource.data.raw_payload)!==sourceHash))throw Error('G03_REMAINING_CASH_IMMUTABLE_SOURCE_CONFLICT')
  if(!priorSource.data){const w=await db.from('data_source_records').insert({id:b.sourceId,source_code:p.sourceAuthority,record_kind:REMAINING_CASH_SOURCE_KIND,external_record_id:'G03_REMAINING_CASH:'+b.symbol+':'+b.fiscalYear,source_url:parent.url,retrieved_at:at,published_at:null,payload_hash:sourceHash,raw_payload:raw,terms_snapshot:{scope:'ASTRA_DATA_FIXED_CASH_ONLY',execution_sha:claims.sha,execution_run_id:claims.run_id,no_owner_session_attribution:true}});if(w.error)throw Error('G03_REMAINING_CASH_SOURCE_INSERT_REJECTED_'+w.error.code)}
  const sourceRead=await db.from('data_source_records').select('payload_hash,raw_payload,retrieved_at').eq('id',b.sourceId).single()
  if(sourceRead.error||sourceRead.data.payload_hash!==sourceHash||await hashG02(sourceRead.data.raw_payload)!==sourceHash)throw Error('G03_REMAINING_CASH_SOURCE_READBACK_FAILED')
  const prior=await db.from('research_evidence_requirement_reviews').select('review_hash,reviewed_at').eq('id',b.reviewId).maybeSingle()
  if(prior.error)throw Error('G03_REMAINING_CASH_REVIEW_LOOKUP_FAILED')
  const payload={portfolio_id:p.portfolioId,security_id:securityId,requirement_code:'CFO_FCF_CONVERSION',review_kind:G03_CASH_KIND,decision:'SUPPORTS',source_record_id:b.sourceId,research_document_id:parent.documentId,provider_document_id:null,source_payload_hash:sourceHash,supporting_quote:b.fragment,period_start:b.periodStart,period_end:b.periodEnd,period_type:'YEAR',unit:'RATIO',currency:null,consolidation_scope:'STANDALONE',published_at:null,retrieved_at:sourceRead.data.retrieved_at,fresh_through:g02PostgresTimestamp('2027-03-31T00:00:00Z'),review_version:'V1_4_REQUIREMENT_REVIEW_V2',reviewed_by:null,reviewed_at:prior.data?.reviewed_at??g02PostgresTimestamp(new Date().toISOString()),supersedes_review_id:null,metadata:{financial_components:b.components,derivation,original_sha256:b.originalSha256,review_authorization:{authorization_reference:p.directiveSha256,authorizing_owner_id:p.ownerId,executor:'GITHUB_OIDC_G03_APPROVED_FINANCIAL_QUALIFICATION'},not_issuer_reported_ratio:true,not_historical_pit_evidence:true}}
  const reviewHash=await hashG02(payload)
  if(prior.data&&prior.data.review_hash!==reviewHash)throw Error('G03_REMAINING_CASH_IMMUTABLE_REVIEW_CONFLICT')
  if(!prior.data){const w=await db.from('research_evidence_requirement_reviews').insert({id:b.reviewId,...payload,review_hash:reviewHash});if(w.error)throw Error('G03_REMAINING_CASH_REVIEW_INSERT_REJECTED_'+w.error.code)}
  const read=await db.from('research_evidence_requirement_reviews').select('review_hash,reviewed_by,source_payload_hash').eq('id',b.reviewId).single()
  if(read.error||read.data.review_hash!==reviewHash||read.data.reviewed_by!==null||read.data.source_payload_hash!==sourceHash)throw Error('G03_REMAINING_CASH_REVIEW_READBACK_FAILED')
  results.push({reviewId:b.reviewId,sourceId:b.sourceId,periodEnd:b.periodEnd,derivation,reused:Boolean(prior.data)})
 }
 return {code:'G03_REMAINING_CASH_ADMITTED_NOT_CANONICAL_READY',results,providerCalls:0,providerApiCalls:0,canonicalMaterialization:false,metricRegistryWrites:0}
 }finally{await db.rpc('release_data_ingestion_lease_v1',{p_source_code:'OWNER_REVIEWED_CLASSIFICATION',p_operation:operation,p_lease_holder:holder,p_cooldown_seconds:0})}
}
