import batch from './v14-g03-margin-review-batch.json' with {type:'json'}
import {G03_FINANCIAL_POLICY as p,G03_MARGIN_KIND,G03_MARGIN_SOURCE_KIND,deriveG03Margin,type MarginComponents} from './v14-g03-margin-components.ts'
import {stableDebt as stable} from './v14-g03-debt-review.ts'
export {batch as G03_MARGIN_BATCH}
type Json=Readonly<Record<string,unknown>>
export function approvedG03MarginReview(r:{id:string;portfolio_id:string;security_id:string;requirement_code:string;review_kind:string;reviewed_by:string|null;period_start:string|null;period_end:string|null;period_type:string|null;unit:string|null;currency:string|null;consolidation_scope:string|null;metadata:Json},ownerId:string,family:string){
 const b=batch.periods.find(b=>b.reviewId===r.id),a=r.metadata.review_authorization as Json|undefined
 return Boolean(b&&family==='NUMERIC_SERIES'&&ownerId===p.ownerId&&r.portfolio_id===p.portfolioId&&r.security_id===p.securityId&&r.requirement_code==='OPERATING_MARGIN_HISTORY'&&r.review_kind===G03_MARGIN_KIND&&r.reviewed_by===null&&r.period_start===b.periodStart&&r.period_end===b.periodEnd&&r.period_type==='QUARTER'&&r.unit==='PERCENT'&&r.currency===null&&r.consolidation_scope==='CONSOLIDATED'&&stable(r.metadata.financial_components)===stable(b.components)&&a?.authorization_reference===p.contractSha256&&a.authorizing_owner_id===ownerId&&a.executor==='GITHUB_OIDC_G03_APPROVED_FINANCIAL_QUALIFICATION')
}
export function approvedG03MarginSource(r:{id:string;source_record_id:string|null;supporting_quote:string|null},s:{id:string;source_code:string;raw_payload:Json}){
 const b=batch.periods.find(b=>b.reviewId===r.id),raw=s.raw_payload
 return Boolean(b&&s.id===b.sourceId&&r.source_record_id===b.sourceId&&s.source_code==='TRENDLYNE_MCP'&&raw.version===G03_MARGIN_SOURCE_KIND&&raw.security_id===p.securityId&&raw.original_sha256===b.originalSha256&&typeof raw.original_source_record_id==='string'&&raw.fragment===b.fragment&&r.supporting_quote===b.fragment&&raw.authorization_reference===p.contractSha256&&raw.publication_precision==='UNKNOWN'&&stable(raw.financial_components)===stable(b.components)&&stable(raw.verified_source_cells)===stable(batch.cells)&&stable(raw.provider_records)===stable(batch.providerRecords)&&stable(raw.profit_field)===stable(b.profitField)&&stable(raw.revenue_field)===stable(b.revenueField)&&stable(raw.caption_discrepancy)===stable(b.captionDiscrepancy)&&stable(raw.derivation)===stable(deriveG03Margin(b.components as MarginComponents)))
}
/** Preserve this exact undated, UNKNOWN-scope legacy TTM candidate. It cannot
 * conflict with or replace eight explicitly dated quarterly raw pairs. Any
 * changed, additional or otherwise qualified canonical evidence stays blocked. */
export function fixedG03UnqualifiedMarginCandidate(rows:readonly {id:string;source_record_id:string;metric_code:string;numeric_value:string|number|null;period_type:string|null;period_start:string|null;period_end:string|null;consolidation_scope:string|null}[]){
 return rows.length===1&&rows.every(r=>r.id==='c5c302f8-c8c5-4fd8-8cd9-7bf23f0eeddb'&&r.source_record_id==='cf472a75-1d5d-4045-b3c0-f7cc36f10d8d'&&r.metric_code==='OPM_TTM'&&String(r.numeric_value)==='28.55'&&r.period_type==='TTM'&&r.period_start===null&&r.period_end===null&&r.consolidation_scope==='UNKNOWN')
}
