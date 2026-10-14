import policy from './v14-g03-roce-authorization.json' with {type:'json'}
import batch from './v14-g03-roce-review-batch.json' with {type:'json'}
import {sameQualifiedHistoryNumeric} from './v14-history-numeric-equality.ts'
export {policy as G03_ROCE_POLICY,batch as G03_ROCE_BATCH}
export const G03_ROCE_SOURCE_KIND='V1_4_G03_FIXED_BEL_ROCE_CELL'
export const G03_ROCE_REVIEW_KIND='DELEGATED_G03_FIXED_NUMERIC_REVIEW'
type Json=Readonly<Record<string,unknown>>
export function approvedG03RoceReview(review:{id:string;portfolio_id:string;security_id:string;requirement_code:string;review_kind:string;reviewed_by:string|null;supporting_quote?:string|null;metadata:Json},ownerId:string,family:string){
 const a=review.metadata.review_authorization as Json|undefined,b=batch.find(x=>x.reviewId===review.id)
 return Boolean(b&&family==='NUMERIC_SERIES'&&ownerId===policy.ownerId&&review.portfolio_id===policy.portfolioId&&review.security_id===b.securityId&&review.requirement_code==='ROCE_OR_ROIC'&&review.review_kind===G03_ROCE_REVIEW_KIND&&review.reviewed_by===null&&review.supporting_quote===b.fragment&&review.metadata.metric_code===b.metricCode&&review.metadata.numeric_value===b.numericValue&&a?.authorization_reference===policy.directiveSha256&&a.authorizing_owner_id===ownerId&&a.executor==='GITHUB_OIDC_G03_FIXED_ROCE_QUALIFICATION')
}
export function approvedG03RoceSource(review:{id:string;source_record_id?:string|null;supporting_quote?:string|null;metadata:Json},source:{id:string;source_code:string;record_kind?:string;raw_payload:Json}){
 const b=batch.find(x=>x.reviewId===review.id),r=source.raw_payload
 return Boolean(b&&source.id===b.sourceId&&review.source_record_id===b.sourceId&&source.source_code===policy.sourceAuthority&&source.record_kind===G03_ROCE_SOURCE_KIND&&r.security_id===b.securityId&&r.original_sha256===b.originalSha256&&r.fragment===b.fragment&&review.supporting_quote===b.fragment&&r.numeric_value===b.numericValue&&r.metric_code===b.metricCode&&r.period_start===b.periodStart&&r.period_end===b.periodEnd&&r.period_type==='YEAR'&&r.unit==='PERCENT'&&r.consolidation_scope==='STANDALONE'&&r.source_basis===b.sourceBasisKey&&r.authorization_reference===policy.directiveSha256&&typeof r.original_source_record_id==='string')
}
export function approvedG03RoceSeries(rows:readonly {id:string;metric_code:string;numeric_value:number|string|null;source_code:string;source_record_id:string;period_start:string|null;period_end:string|null;period_type:string|null;consolidation_scope:string|null;unit:string|null;currency:string|null}[]){
 return rows.length===batch.length&&new Set(rows.map(r=>r.id)).size===batch.length&&rows.every(r=>batch.some(b=>r.id===b.reviewId&&r.source_record_id===b.sourceId&&r.metric_code===b.metricCode&&r.numeric_value===b.numericValue&&r.source_code===policy.sourceAuthority&&r.period_start===b.periodStart&&r.period_end===b.periodEnd&&r.period_type==='YEAR'&&r.consolidation_scope==='STANDALONE'&&r.unit==='PERCENT'&&r.currency===null))
}
export function fixedG03UnqualifiedRoceCandidate(rows:readonly {id:string;metric_code:string;numeric_value:number|string|null;source_code:string;source_record_id:string;period_start:string|null;period_end:string|null;period_type:string|null;consolidation_scope:string|null;evidence_status:string}[]){
 const p=policy.legacyUnqualifiedCandidate,r=rows[0]
 return rows.length===1&&r?.id===p.id&&r.metric_code===p.metricCode&&r.source_record_id===p.sourceId&&r.source_code===p.sourceCode&&sameQualifiedHistoryNumeric(r.numeric_value,p.numericValue)&&r.period_start===null&&r.period_end===null&&r.period_type==='YEAR'&&r.consolidation_scope==='UNKNOWN'&&r.evidence_status==='AVAILABLE'
}
