import policy from './v14-g02-owner-authorization.json' with {type:'json'}
import batch from './v14-g02-document-review-batch.json' with {type:'json'}
export {batch as G02_DOCUMENT_REVIEW_BATCH}
export const G02_DOCUMENT_KIND='V1_4_G02_QUALIFIED_ORIGINAL_EXCERPT'
export const G02_DOCUMENT_REVIEW_KIND='DELEGATED_G02_DOCUMENT_REVIEW'
export function approvedG02DocumentReview(review:{portfolio_id:string;security_id:string;requirement_code:string;review_kind:string;reviewed_by:string|null;supporting_quote?:string|null;metadata:Readonly<Record<string,unknown>>},ownerId:string,family:string){
 const a=review.metadata.review_authorization as Record<string,unknown>|undefined
 return family==='TEXT_EVIDENCE_REVIEW'&&ownerId===policy.ownerId&&review.portfolio_id===policy.portfolioId&&review.reviewed_by===null&&review.review_kind===G02_DOCUMENT_REVIEW_KIND&&batch.some(b=>b.securityId===review.security_id&&b.requirementCode===review.requirement_code&&b.fragment===review.supporting_quote)&&a?.authorization_reference===policy.directiveSha256&&a.authorizing_owner_id===ownerId&&a.executor==='GITHUB_OIDC_G02_OFFICIAL_QUALIFICATION'
}
export function approvedG02DocumentSource(review:{security_id:string;supporting_quote:string|null;metadata:Readonly<Record<string,unknown>>;requirement_code?:string},source:{source_code:string;record_kind?:string;raw_payload:Readonly<Record<string,unknown>>}){
 const b=batch.find(x=>x.securityId===review.security_id&&x.requirementCode===(review.requirement_code??'BUSINESS_DURABILITY'))
 return Boolean(b&&source.source_code==='COMPANY_EXCHANGE_FILING'&&source.record_kind===G02_DOCUMENT_KIND&&source.raw_payload.security_id===b.securityId&&source.raw_payload.original_sha256===b.originalHash&&source.raw_payload.fragment===b.fragment&&review.supporting_quote===b.fragment&&source.raw_payload.assessment===b.assessment&&review.metadata.original_sha256===b.originalHash&&source.raw_payload.authorization_reference===policy.directiveSha256)
}

/** PostgREST timestamptz representation must match the integrity-hashed row. */
export function g02PostgresTimestamp(value:string){const t=new Date(value);if(!Number.isFinite(t.getTime()))throw Error('G02_REVIEW_TIMESTAMP_INVALID');return t.toISOString().replace(/(\.\d*?[1-9])0+Z$/,'$1Z').replace(/\.0+Z$/,'Z').replace(/Z$/,'+00:00')}
