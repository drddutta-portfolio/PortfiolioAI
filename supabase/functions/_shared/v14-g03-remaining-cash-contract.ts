import policy from './v14-g03-remaining-cash-authorization.json' with {type:'json'}
import pins from './v14-g03-remaining-cash-original-pins.json' with {type:'json'}
import batch from './v14-g03-remaining-cash-review-batch.json' with {type:'json'}
import {stableG02,type OriginalSourceScope} from './v14-g02-source-import.ts'
import {deriveG03CashConversion,G03_CASH_KIND,type CashComponents} from './v14-g03-cash-components.ts'
export {policy as REMAINING_CASH_POLICY,batch as REMAINING_CASH_BATCH}
export const REMAINING_CASH_SOURCE_KIND='G03_REMAINING_SOURCE_BOUND_CASH_COMPONENTS_V1'
export const G03_REMAINING_CASH_SOURCE_SCOPE:OriginalSourceScope={group:'G03',policy,pins,originalKind:'V1_4_G03_REGISTERED_OFFICIAL_ORIGINAL'}
type Json=Readonly<Record<string,unknown>>
export function remainingCashSecurityQualified(id:string){return policy.securityIds.includes(id)}
export function approvedRemainingG03CashReview(r:{id:string;portfolio_id:string;security_id:string;requirement_code:string;review_kind:string;reviewed_by:string|null;period_start:string|null;period_end:string|null;period_type:string|null;unit:string|null;currency:string|null;consolidation_scope:string|null;metadata:Json},ownerId:string,family:string){
 const b=batch.periods.find(b=>b.reviewId===r.id),a=r.metadata.review_authorization as Json|undefined
 return Boolean(b&&family==='NUMERIC_SERIES'&&ownerId===policy.ownerId&&r.portfolio_id===policy.portfolioId&&r.security_id===b.securityId&&r.requirement_code==='CFO_FCF_CONVERSION'&&r.review_kind===G03_CASH_KIND&&r.reviewed_by===null&&r.period_start===b.periodStart&&r.period_end===b.periodEnd&&r.period_type==='YEAR'&&r.unit==='RATIO'&&r.currency===null&&r.consolidation_scope==='STANDALONE'&&stableG02(r.metadata.financial_components)===stableG02(b.components)&&a?.authorization_reference===policy.directiveSha256&&a.authorizing_owner_id===ownerId&&a.executor==='GITHUB_OIDC_G03_APPROVED_FINANCIAL_QUALIFICATION')
}
export function approvedRemainingG03CashSource(r:{id:string;source_record_id:string|null;supporting_quote:string|null;metadata:Json},s:{id:string;source_code:string;raw_payload:Json}){
 const b=batch.periods.find(b=>b.reviewId===r.id),raw=s.raw_payload
 return Boolean(b&&s.id===b.sourceId&&r.source_record_id===b.sourceId&&s.source_code===policy.sourceAuthority&&raw.version===REMAINING_CASH_SOURCE_KIND&&raw.security_id===b.securityId&&raw.original_sha256===b.originalSha256&&typeof raw.original_source_record_id==='string'&&raw.fragment===b.fragment&&r.supporting_quote===b.fragment&&r.metadata.original_sha256===b.originalSha256&&raw.authorization_reference===policy.directiveSha256&&raw.publication_precision==='UNKNOWN'&&stableG02(raw.financial_components)===stableG02(b.components)&&stableG02(raw.verified_source_cells)===stableG02(batch.cells.filter(c=>c.originalSha256===b.originalSha256))&&stableG02(raw.verified_scope_evidence)===stableG02(batch.scopeEvidence.filter(c=>c.originalSha256===b.originalSha256))&&stableG02(raw.derivation)===stableG02(deriveG03CashConversion(b.components as CashComponents)))
}
