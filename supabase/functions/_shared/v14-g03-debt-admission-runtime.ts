import type {SupabaseClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import {hashG02,g02StableId,G03_ROCE_SOURCE_SCOPE,G03_DEBT_SOURCE_SCOPE} from './v14-g02-source-import.ts'
import {g02PostgresTimestamp} from './v14-g02-document-review.ts'
import {G03_FINANCIAL_POLICY as p,G03_DEBT_KIND,G03_DEBT_SOURCE_KIND,deriveG03DebtCoverage,type DebtComponents} from './v14-g03-debt-components.ts'
import {G03_DEBT_BATCH as batch,stableDebt} from './v14-g03-debt-review.ts'
export async function admitFixedG03Debt(db:SupabaseClient,body:Record<string,unknown>,claims:Record<string,unknown>){
 if(body.action!=='ADMIT_FIXED_G03_BEL_DEBT_COMPONENTS'||body.authorizationHash!==p.contractSha256||stableDebt(body.verifiedCells)!==stableDebt(batch.cells))throw Error('G03_APPROVED_EXACT_DEBT_CELLS_REQUIRED')
 const owner=await db.from('portfolios').select('user_id').eq('id',p.portfolioId).single(),authority=await db.from('data_sources').select('is_active,entitlement_verified,retention_rights_verified').eq('code',p.sourceAuthority).single()
 if(owner.error||owner.data.user_id!==p.ownerId||authority.error||authority.data.is_active!==true||authority.data.entitlement_verified!==true||authority.data.retention_rights_verified!==true)throw Error('G03_DEBT_OWNER_OR_SOURCE_AUTHORITY_NOT_PROVEN')
 const originals=new Map<string,{id:string;documentId:string;url:string}>()
 for(const pin of [...G03_ROCE_SOURCE_SCOPE.pins,...G03_DEBT_SOURCE_SCOPE.pins]){
  const id=await g02StableId({kind:G03_ROCE_SOURCE_SCOPE.originalKind,security:pin.security_id,hash:pin.original_sha256}),documentId=await g02StableId({kind:'G03_DOCUMENT',security:pin.security_id,hash:pin.original_sha256}),linkId=await g02StableId({kind:'G03_DOCUMENT_SOURCE',documentId,sourceId:id})
  const source=await db.from('data_source_records').select('raw_payload,payload_hash,source_code').eq('id',id).single(),doc=await db.from('research_documents').select('security_id,canonical_content_hash,identity_status').eq('id',documentId).single(),link=await db.from('research_document_sources').select('source_record_id,content_hash,source_status').eq('id',linkId).single()
  if(source.error||source.data.source_code!==p.sourceAuthority||source.data.raw_payload.original_sha256!==pin.original_sha256||source.data.payload_hash!==await hashG02(source.data.raw_payload)||doc.error||doc.data.security_id!==p.securityId||doc.data.canonical_content_hash!==pin.original_sha256||doc.data.identity_status!=='VERIFIED'||link.error||link.data.source_record_id!==id||link.data.content_hash!==pin.original_sha256||link.data.source_status!=='VERIFIED')throw Error('G03_DEBT_REGISTERED_ORIGINAL_NOT_PROVEN')
  originals.set(pin.original_sha256,{id,documentId,url:pin.original_url})
 }
 const results=[]
 for(const b of batch.periods){
  const parent=originals.get(b.originalSha256),derivation=deriveG03DebtCoverage(b.components as DebtComponents)
  if(!parent||!derivation)throw Error('G03_DEBT_COMPONENT_DERIVATION_NOT_PROVEN')
  const priorSource=await db.from('data_source_records').select('payload_hash,raw_payload,retrieved_at').eq('id',b.sourceId).maybeSingle();if(priorSource.error)throw Error('G03_DEBT_SOURCE_LOOKUP_FAILED')
  const at=priorSource.data?.retrieved_at??g02PostgresTimestamp(new Date().toISOString())
  const raw={version:G03_DEBT_SOURCE_KIND,security_id:p.securityId,original_source_record_id:parent.id,original_sha256:b.originalSha256,xml_original_sha256:b.xmlOriginalSha256,original_url:parent.url,fragment:b.fragment,financial_components:b.components,verified_source_cells:batch.cells,derivation,authorization_reference:p.contractSha256,publication_precision:'UNKNOWN',proven_availability_at:at,not_historical_pit_evidence:true}
  const sourceHash=await hashG02(raw)
  if(priorSource.data&&(priorSource.data.payload_hash!==sourceHash||await hashG02(priorSource.data.raw_payload)!==sourceHash))throw Error('G03_DEBT_IMMUTABLE_SOURCE_CONFLICT')
  if(!priorSource.data){const w=await db.from('data_source_records').insert({id:b.sourceId,source_code:p.sourceAuthority,record_kind:G03_DEBT_SOURCE_KIND,external_record_id:'G03_BEL_DEBT:'+b.fiscalYear,source_url:parent.url,retrieved_at:at,published_at:null,payload_hash:sourceHash,raw_payload:raw,terms_snapshot:{scope:'BEL_APPROVED_COMPONENT_DERIVATION_ONLY',execution_sha:claims.sha,execution_run_id:claims.run_id,no_owner_session_attribution:true}});if(w.error&&w.error.code!=='23505')throw Error('G03_DEBT_SOURCE_INSERT_REJECTED:'+w.error.code)}
  const sourceRead=await db.from('data_source_records').select('payload_hash,raw_payload,retrieved_at').eq('id',b.sourceId).single();if(sourceRead.error||sourceRead.data.payload_hash!==sourceHash||await hashG02(sourceRead.data.raw_payload)!==sourceHash)throw Error('G03_DEBT_SOURCE_READBACK_FAILED')
  const prior=await db.from('research_evidence_requirement_reviews').select('review_hash,reviewed_at').eq('id',b.reviewId).maybeSingle();if(prior.error)throw Error('G03_DEBT_REVIEW_LOOKUP_FAILED')
  const payload={portfolio_id:p.portfolioId,security_id:p.securityId,requirement_code:'NET_DEBT_AND_INTEREST_COVERAGE',review_kind:G03_DEBT_KIND,decision:'SUPPORTS',source_record_id:b.sourceId,research_document_id:parent.documentId,provider_document_id:null,source_payload_hash:sourceHash,supporting_quote:b.fragment,period_start:b.periodStart,period_end:b.periodEnd,period_type:'YEAR',unit:'RATIO',currency:null,consolidation_scope:'STANDALONE',published_at:null,retrieved_at:sourceRead.data.retrieved_at,fresh_through:g02PostgresTimestamp('2027-03-31T00:00:00.000Z'),review_version:'V1_4_REQUIREMENT_REVIEW_V2',reviewed_by:null,reviewed_at:prior.data?.reviewed_at??g02PostgresTimestamp(new Date().toISOString()),supersedes_review_id:null,metadata:{financial_components:b.components,derivation,original_sha256:b.originalSha256,review_authorization:{authorization_reference:p.contractSha256,authorizing_owner_id:p.ownerId,executor:'GITHUB_OIDC_G03_APPROVED_FINANCIAL_QUALIFICATION'},not_issuer_reported_ratio:true,not_historical_pit_evidence:true}}
  const reviewHash=await hashG02(payload);if(prior.data&&prior.data.review_hash!==reviewHash)throw Error('G03_DEBT_IMMUTABLE_REVIEW_CONFLICT')
  if(!prior.data){const w=await db.from('research_evidence_requirement_reviews').insert({id:b.reviewId,...payload,review_hash:reviewHash});if(w.error&&w.error.code!=='23505')throw Error('G03_DEBT_REVIEW_INSERT_REJECTED:'+w.error.code)}
  const read=await db.from('research_evidence_requirement_reviews').select('review_hash,reviewed_by,source_payload_hash').eq('id',b.reviewId).single();if(read.error||read.data.review_hash!==reviewHash||read.data.reviewed_by!==null||read.data.source_payload_hash!==sourceHash)throw Error('G03_DEBT_REVIEW_READBACK_FAILED')
  results.push({reviewId:b.reviewId,sourceId:b.sourceId,periodEnd:b.periodEnd,derivation,reused:Boolean(prior.data)})
 }
 return {code:'G03_DEBT_COMPONENTS_ADMITTED_NOT_CANONICAL_READY',results,providerCalls:0,providerApiCalls:0,canonicalMaterialization:false,metricRegistryWrites:0,originalWrites:0}
}
