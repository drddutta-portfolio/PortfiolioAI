import type {SupabaseClient} from 'https://esm.sh/@supabase/supabase-js@2.115.0'
import {hashG02,g02StableId,G03_VALUATION_SOURCE_SCOPE} from './v14-g02-source-import.ts'
import {g02PostgresTimestamp} from './v14-g02-document-review.ts'
import {G03_FINANCIAL_POLICY as p,G03_VALUATION_KIND,G03_VALUATION_SOURCE_KIND,G03_VALUATION_FRESH_THROUGH,deriveG03Valuation,type ValuationComponents} from './v14-g03-valuation-components.ts'
import {G03_VALUATION_BATCH as batch,stableValuation} from './v14-g03-valuation-review.ts'

import {Decimal} from 'decimal.js'
import {historyTailCaptureProducerHash} from './v14-history-tail-capture-integrity.ts'
import {approvedG03CashReview,approvedG03CashSource} from './v14-g03-cash-review.ts'
import {approvedG03DebtReview,approvedG03DebtSource} from './v14-g03-debt-review.ts'
export async function verifyRetainedValuationInputs(db:SupabaseClient){
 const captures=new Map<string,Record<string,unknown>>()
 for(const pin of batch.retainedCaptures){
  const row=await db.from('data_source_records').select('source_code,record_kind,raw_payload,payload_hash').eq('id',pin.id).single()
  const producerHash=row.data?(pin.record_kind==='V1_4_G03_HISTORY_TAIL_CAPTURE'?await historyTailCaptureProducerHash(row.data.raw_payload):await hashG02(row.data.raw_payload)):null
  if(row.error||!row.data||row.data.source_code!==pin.source_code||row.data.record_kind!==pin.record_kind||row.data.payload_hash!==pin.payload_hash||producerHash!==pin.payload_hash)throw Error('G03_VALUATION_RETAINED_CAPTURE_NOT_VERIFIED')
  captures.set(pin.id,row.data.raw_payload)
 }
 const proof=captures.get('7b3221d4-1580-5474-a48b-98dc9730adb1')!,contract=proof.proof as Record<string,unknown>,validation=proof.validation as Record<string,unknown>
 if(proof.target_id!==p.securityId||contract.returnBasis!=='PRICE_RETURN_RAW_CLOSE'||contract.corporateActionState!=='COMPLETE'||contract.exchangeCalendarState!=='VERIFIED'||contract.unresolvedCorporateActionCount!==0||validation.latest_completed_session!=='2026-10-15'||validation.structural_action_count!==0||stableValuation(validation.structural_actions)!=='[]')throw Error('G03_VALUATION_SHARE_PRICE_BASIS_NOT_PROVEN')
 for(const b of batch.periods){
  const capture=captures.get(b.priceSourceId),candles=capture?.candles as Array<{periodStart:string;close:string}>|undefined
  const timestamp=new Date(b.pricePeriodStart).toISOString(),candle=candles?.filter(x=>x.periodStart===timestamp)
  if(capture?.security_id!==p.securityId||candle?.length!==1||!new Decimal(candle[0].close).eq(b.components.price))throw Error('G03_VALUATION_EXACT_PRICE_CAPTURE_NOT_PROVEN')
  const row=await db.from('market_price_history').select('close,provider_code,provenance').eq('security_id',p.securityId).eq('provider_code','ANGEL_ONE').eq('period_start',b.pricePeriodStart).single()
  if(row.error||!row.data||!new Decimal(row.data.close).eq(b.components.price)||row.data.provenance?.source_record_id!==b.priceSourceId)throw Error('G03_VALUATION_PERSISTED_PRICE_LINEAGE_MISMATCH')
 }
 for(const [id,kind] of [[batch.acceptedCashReviewId,'cash'],[batch.acceptedDebtReviewId,'debt']]){
  const row=await db.from('research_evidence_requirement_reviews').select('*').eq('id',id).single()
  if(row.error||!row.data||row.data.decision!=='SUPPORTS')throw Error('G03_VALUATION_ACCEPTED_COMPONENT_REVIEW_MISSING')
  const payload={...row.data};delete payload.id;delete payload.review_hash;delete payload.created_at
  if(await hashG02(payload)!==row.data.review_hash||(kind==='cash'?!approvedG03CashReview(row.data,p.ownerId,'NUMERIC_SERIES'):!approvedG03DebtReview(row.data,p.ownerId,'NUMERIC_SERIES')))throw Error('G03_VALUATION_COMPONENT_REVIEW_NOT_VERIFIED')
  const source=await db.from('data_source_records').select('id,source_code,raw_payload,payload_hash').eq('id',row.data.source_record_id).single()
  if(source.error||!source.data||await hashG02(source.data.raw_payload)!==row.data.source_payload_hash||source.data.payload_hash!==row.data.source_payload_hash||(kind==='cash'?!approvedG03CashSource(row.data,source.data):!approvedG03DebtSource(row.data,source.data)))throw Error('G03_VALUATION_COMPONENT_SOURCE_NOT_VERIFIED')
 }
 return {verifiedPrices:3,verifiedAcceptedComponentReviews:2,structuralShareActions:0}
}

export async function admitFixedG03Valuation(db:SupabaseClient,body:Record<string,unknown>,claims:Record<string,unknown>){
 if(body.action!=='ADMIT_FIXED_G03_BEL_DATED_VALUATIONS'||body.authorizationHash!==p.contractSha256||stableValuation(body.verifiedCells)!==stableValuation(batch.cells)||stableValuation(body.verifiedAvailability)!==stableValuation(batch.availability))throw Error('G03_APPROVED_EXACT_VALUATION_CELLS_REQUIRED')
 // Historical, fully qualified observations remain admissible after their
 // current-price freshness expires. The canonical validator independently
 // returns STALE; admission never extends that timestamp or declares READY.
 const owner=await db.from('portfolios').select('user_id').eq('id',p.portfolioId).single(),authority=await db.from('data_sources').select('is_active,entitlement_verified,retention_rights_verified').eq('code',p.sourceAuthority).single()
 if(owner.error||owner.data.user_id!==p.ownerId||authority.error||authority.data.is_active!==true||authority.data.entitlement_verified!==true||authority.data.retention_rights_verified!==true)throw Error('G03_VALUATION_OWNER_OR_SOURCE_AUTHORITY_NOT_PROVEN')
 await verifyRetainedValuationInputs(db)
 const originals=new Map<string,{id:string;documentId:string;url:string}>()
 for(const pin of G03_VALUATION_SOURCE_SCOPE.pins){
  const id=await g02StableId({kind:G03_VALUATION_SOURCE_SCOPE.originalKind,security:pin.security_id,hash:pin.original_sha256}),documentId=await g02StableId({kind:'G03_DOCUMENT',security:pin.security_id,hash:pin.original_sha256}),linkId=await g02StableId({kind:'G03_DOCUMENT_SOURCE',documentId,sourceId:id})
  const source=await db.from('data_source_records').select('raw_payload,payload_hash,source_code').eq('id',id).single(),doc=await db.from('research_documents').select('security_id,canonical_content_hash,identity_status').eq('id',documentId).single(),link=await db.from('research_document_sources').select('source_record_id,content_hash,source_status').eq('id',linkId).single()
  if(source.error||source.data.source_code!==p.sourceAuthority||source.data.raw_payload.original_sha256!==pin.original_sha256||source.data.payload_hash!==await hashG02(source.data.raw_payload)||doc.error||doc.data.security_id!==p.securityId||doc.data.canonical_content_hash!==pin.original_sha256||doc.data.identity_status!=='VERIFIED'||link.error||link.data.source_record_id!==id||link.data.content_hash!==pin.original_sha256||link.data.source_status!=='VERIFIED')throw Error('G03_VALUATION_REGISTERED_ORIGINAL_NOT_PROVEN')
  originals.set(pin.original_sha256,{id,documentId,url:pin.original_url})
 }
 const results=[]
 for(const b of batch.periods){
  const parent=originals.get(b.originalSha256),derivation=deriveG03Valuation(b.components as ValuationComponents)
  if(!parent||!derivation)throw Error('G03_VALUATION_COMPONENT_DERIVATION_NOT_PROVEN')
  const priorSource=await db.from('data_source_records').select('payload_hash,raw_payload,retrieved_at').eq('id',b.sourceId).maybeSingle();if(priorSource.error)throw Error('G03_VALUATION_SOURCE_LOOKUP_FAILED')
  const at=priorSource.data?.retrieved_at??g02PostgresTimestamp(new Date().toISOString())
  const raw={version:G03_VALUATION_SOURCE_KIND,security_id:p.securityId,original_source_record_id:parent.id,original_sha256:b.originalSha256,original_url:parent.url,fragment:b.fragment,financial_components:b.components,verified_source_cells:batch.cells,availability_proofs:batch.availability,registered_originals:batch.registeredOriginals,retained_captures:batch.retainedCaptures,share_source_sha256:b.shareSourceSha256,price_source_id:b.priceSourceId,annual_shares_note:batch.annualSharesNote,derivation,authorization_reference:p.contractSha256,publication_precision:'UNKNOWN',proven_availability_at:at,financial_pit_availability_qualified:true}
  const sourceHash=await hashG02(raw)
  if(priorSource.data&&(priorSource.data.payload_hash!==sourceHash||await hashG02(priorSource.data.raw_payload)!==sourceHash))throw Error('G03_VALUATION_IMMUTABLE_SOURCE_CONFLICT')
  if(!priorSource.data){const w=await db.from('data_source_records').insert({id:b.sourceId,source_code:p.sourceAuthority,record_kind:G03_VALUATION_SOURCE_KIND,external_record_id:'G03_BEL_VALUATION:'+b.valuationDate,source_url:parent.url,retrieved_at:at,published_at:null,payload_hash:sourceHash,raw_payload:raw,terms_snapshot:{scope:'BEL_APPROVED_THREE_DATED_VALUATION_AND_JOIN',execution_sha:claims.sha,execution_run_id:claims.run_id,no_owner_session_attribution:true}});if(w.error&&w.error.code!=='23505')throw Error('G03_VALUATION_SOURCE_INSERT_REJECTED:'+w.error.code)}
  const sourceRead=await db.from('data_source_records').select('payload_hash,raw_payload,retrieved_at').eq('id',b.sourceId).single();if(sourceRead.error||sourceRead.data.payload_hash!==sourceHash||await hashG02(sourceRead.data.raw_payload)!==sourceHash)throw Error('G03_VALUATION_SOURCE_READBACK_FAILED')
  const prior=await db.from('research_evidence_requirement_reviews').select('review_hash,reviewed_at').eq('id',b.reviewId).maybeSingle();if(prior.error)throw Error('G03_VALUATION_REVIEW_LOOKUP_FAILED')
  const payload={portfolio_id:p.portfolioId,security_id:p.securityId,requirement_code:'VALUATION',review_kind:G03_VALUATION_KIND,decision:'SUPPORTS',source_record_id:b.sourceId,research_document_id:parent.documentId,provider_document_id:null,source_payload_hash:sourceHash,supporting_quote:b.fragment,period_start:b.periodStart,period_end:b.periodEnd,period_type:'POINT_IN_TIME',unit:'COMPOSITE_VALUATION',currency:null,consolidation_scope:'STANDALONE',published_at:null,retrieved_at:sourceRead.data.retrieved_at,fresh_through:g02PostgresTimestamp(G03_VALUATION_FRESH_THROUGH),review_version:'V1_4_REQUIREMENT_REVIEW_V2',reviewed_by:null,reviewed_at:prior.data?.reviewed_at??g02PostgresTimestamp(new Date().toISOString()),supersedes_review_id:null,metadata:{financial_components:b.components,derivation,original_sha256:b.originalSha256,review_authorization:{authorization_reference:p.contractSha256,authorizing_owner_id:p.ownerId,executor:'GITHUB_OIDC_G03_APPROVED_FINANCIAL_QUALIFICATION'},not_issuer_reported_ratios:true,financial_pit_availability_qualified:true}}
  const reviewHash=await hashG02(payload);if(prior.data&&prior.data.review_hash!==reviewHash)throw Error('G03_VALUATION_IMMUTABLE_REVIEW_CONFLICT')
  if(!prior.data){const w=await db.from('research_evidence_requirement_reviews').insert({id:b.reviewId,...payload,review_hash:reviewHash});if(w.error&&w.error.code!=='23505')throw Error('G03_VALUATION_REVIEW_INSERT_REJECTED:'+w.error.code)}
  const read=await db.from('research_evidence_requirement_reviews').select('review_hash,reviewed_by,source_payload_hash').eq('id',b.reviewId).single();if(read.error||read.data.review_hash!==reviewHash||read.data.reviewed_by!==null||read.data.source_payload_hash!==sourceHash)throw Error('G03_VALUATION_REVIEW_READBACK_FAILED')
  results.push({reviewId:b.reviewId,sourceId:b.sourceId,periodEnd:b.periodEnd,derivation,reused:Boolean(prior.data)})
 }
 return {code:'G03_DATED_VALUATIONS_ADMITTED_NOT_CANONICAL_READY',results,providerCalls:0,providerApiCalls:0,canonicalMaterialization:false,metricRegistryWrites:0,originalWrites:0,currentPriceFreshness:Date.now()>Date.parse(G03_VALUATION_FRESH_THROUGH)?'EXPIRED':'WITHIN_RECORDED_BOUND',recordedFreshThrough:G03_VALUATION_FRESH_THROUGH}
}
