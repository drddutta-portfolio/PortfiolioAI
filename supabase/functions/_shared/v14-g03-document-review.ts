import remainingPolicy from './v14-g03-remaining-authorization.json' with {type:'json'}
import remainingBatch from './v14-g03-remaining-document-batch.json' with {type:'json'}
export {remainingBatch as G03_REMAINING_DOCUMENT_BATCH}
import orderPolicy from './v14-g03-order-authorization.json' with {type:'json'}
import orderBatch from './v14-g03-order-review-batch.json' with {type:'json'}
import policy from './v14-g03-pilot-authorization.json' with {type:'json'}
import batch from './v14-g03-document-review-batch.json' with {type:'json'}
export {batch as G03_DOCUMENT_REVIEW_BATCH,orderBatch as G03_ORDER_REVIEW_BATCH,orderPolicy as G03_ORDER_POLICY}
export const g03OrderFacts=(b:typeof orderBatch[number])=>({turnover_crore:b.turnoverCrore,turnover_fiscal_label:b.turnoverFiscalLabel,order_book_crore:b.orderBookCrore,order_book_as_of:b.orderBookAsOf,latest_order_inflow_crore:b.latestOrderInflowCrore,pdf_page:b.pdfPage,latest_order_inflow_pdf_page:b.latestOrderInflowPdfPage,source_report_period_end:b.sourceReportPeriodEnd})
export function g03OrderFactsQualified(b:typeof orderBatch[number],value:unknown){if(!value||typeof value!=='object'||Array.isArray(value))return false;const expected=g03OrderFacts(b),actual=value as Record<string,unknown>;return Object.keys(actual).length===Object.keys(expected).length&&Object.entries(expected).every(([k,v])=>actual[k]===v)}
export const G03_DOCUMENT_KIND='V1_4_G03_QUALIFIED_ORIGINAL_EXCERPT'
export const G03_DOCUMENT_REVIEW_KIND='DELEGATED_G03_DOCUMENT_REVIEW'
export function approvedG03DocumentReview(review:{portfolio_id:string;security_id:string;requirement_code:string;review_kind:string;reviewed_by:string|null;supporting_quote?:string|null;period_start?:string|null;period_end?:string|null;fresh_through?:string|null;period_type?:string|null;published_at?:string|null;metadata:Readonly<Record<string,unknown>>},ownerId:string,family:string){
 const authorization=review.metadata.review_authorization as Record<string,unknown>|undefined
 const remaining=remainingBatch.find(x=>x.securityId===review.security_id&&x.requirementCode===review.requirement_code&&x.fragment===review.supporting_quote)
 if(remaining&&(review.period_start!==remaining.reportingPeriodStart||review.period_end!==remaining.reportingPeriodEnd||review.period_type!==remaining.periodType||review.published_at!==null||Date.parse(review.fresh_through??'')!==Date.parse(remaining.reportingPeriodEnd+'T00:00:00Z')+365*86400000))return false
 const b=orderBatch.find(x=>x.securityId===review.security_id&&x.requirementCode===review.requirement_code&&x.fragment===review.supporting_quote&&x.reportingPeriodStart===review.period_start&&x.reportingPeriodEnd===review.period_end),p=b?orderPolicy:remaining?remainingPolicy:policy
 if(b&&(!g03OrderFactsQualified(b,review.metadata.order_history)||review.period_type!=='YEAR'||review.published_at!==null||Date.parse(review.fresh_through??'')!==Date.parse(b.sourceReportPeriodEnd+'T00:00:00Z')+365*86400000))return false
 return family==='TEXT_EVIDENCE_REVIEW'&&ownerId===p.ownerId&&review.portfolio_id===p.portfolioId&&review.reviewed_by===null&&review.review_kind===G03_DOCUMENT_REVIEW_KIND&&(Boolean(b)||Boolean(remaining)||batch.some(x=>x.securityId===review.security_id&&x.requirementCode===review.requirement_code&&x.fragment===review.supporting_quote))&&authorization?.authorization_reference===p.directiveSha256&&authorization.authorizing_owner_id===ownerId&&authorization.executor==='GITHUB_OIDC_G03_OFFICIAL_QUALIFICATION'

}
export function approvedG03DocumentSource(review:{security_id:string;supporting_quote:string|null;metadata:Readonly<Record<string,unknown>>;requirement_code?:string;period_end?:string|null},source:{source_code:string;record_kind?:string;raw_payload:Readonly<Record<string,unknown>>}){
 const order=orderBatch.find(x=>x.securityId===review.security_id&&x.requirementCode===review.requirement_code&&x.fragment===review.supporting_quote&&x.reportingPeriodEnd===review.period_end),b=order??batch.find(x=>x.securityId===review.security_id&&x.requirementCode===review.requirement_code)??remainingBatch.find(x=>x.securityId===review.security_id&&x.requirementCode===review.requirement_code),p=order?orderPolicy:remainingBatch.some(x=>x.securityId===review.security_id)?remainingPolicy:policy
 if(order&&!g03OrderFactsQualified(order,source.raw_payload.order_history))return false
 return Boolean(b&&source.source_code==='COMPANY_EXCHANGE_FILING'&&source.record_kind===G03_DOCUMENT_KIND&&source.raw_payload.security_id===b.securityId&&source.raw_payload.original_sha256===b.originalHash&&source.raw_payload.fragment===b.fragment&&review.supporting_quote===b.fragment&&source.raw_payload.assessment===b.assessment&&review.metadata.original_sha256===b.originalHash&&source.raw_payload.authorization_reference===p.directiveSha256&&typeof source.raw_payload.original_source_record_id==='string')
}
