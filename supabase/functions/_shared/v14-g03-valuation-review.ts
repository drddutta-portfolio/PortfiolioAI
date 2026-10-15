import batch from './v14-g03-valuation-review-batch.json' with {type:'json'}
import {G03_FINANCIAL_POLICY as p,G03_VALUATION_KIND,G03_VALUATION_SOURCE_KIND,deriveG03Valuation,type ValuationComponents} from './v14-g03-valuation-components.ts'
export {batch as G03_VALUATION_BATCH}
type Json=Readonly<Record<string,unknown>>
export function stableValuation(v:unknown):string{
 if(Array.isArray(v))return '['+v.map(stableValuation).join(',')+']'
 if(v!==null&&typeof v==='object')return '{'+Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>JSON.stringify(k)+':'+stableValuation(x)).join(',')+'}'
 return JSON.stringify(v)??'null'
}
export function approvedG03ValuationReview(r:{id:string;portfolio_id:string;security_id:string;requirement_code:string;review_kind:string;reviewed_by:string|null;period_start:string|null;period_end:string|null;period_type:string|null;unit:string|null;currency:string|null;consolidation_scope:string|null;metadata:Json},ownerId:string,family:string){
 const b=batch.periods.find(b=>b.reviewId===r.id),a=r.metadata.review_authorization as Json|undefined
 return Boolean(b&&family==='NUMERIC_SERIES'&&ownerId===p.ownerId&&r.portfolio_id===p.portfolioId&&r.security_id===p.securityId&&r.requirement_code==='VALUATION'&&r.review_kind===G03_VALUATION_KIND&&r.reviewed_by===null&&r.period_start===b.valuationDate&&r.period_end===b.valuationDate&&r.period_type==='POINT_IN_TIME'&&r.unit==='COMPOSITE_VALUATION'&&r.currency===null&&r.consolidation_scope==='STANDALONE'&&stableValuation(r.metadata.financial_components)===stableValuation(b.components)&&a?.authorization_reference===p.contractSha256&&a.authorizing_owner_id===ownerId&&a.executor==='GITHUB_OIDC_G03_APPROVED_FINANCIAL_QUALIFICATION')
}
export function approvedG03ValuationSource(r:{id:string;source_record_id:string|null;supporting_quote:string|null;metadata:Json},s:{id:string;source_code:string;raw_payload:Json}){
 const b=batch.periods.find(b=>b.reviewId===r.id),raw=s.raw_payload
 return Boolean(b&&s.id===b.sourceId&&r.source_record_id===b.sourceId&&s.source_code===p.sourceAuthority&&raw.version===G03_VALUATION_SOURCE_KIND&&raw.security_id===p.securityId&&raw.original_sha256===b.originalSha256&&typeof raw.original_source_record_id==='string'&&raw.fragment===b.fragment&&r.supporting_quote===b.fragment&&raw.authorization_reference===p.contractSha256&&raw.publication_precision==='UNKNOWN'&&stableValuation(raw.financial_components)===stableValuation(b.components)&&stableValuation(raw.verified_source_cells)===stableValuation(batch.cells)&&stableValuation(raw.registered_originals)===stableValuation(batch.registeredOriginals)&&stableValuation(raw.availability_proofs)===stableValuation(batch.availability)&&stableValuation(raw.retained_captures)===stableValuation(batch.retainedCaptures)&&raw.share_source_sha256===b.shareSourceSha256&&raw.price_source_id===b.priceSourceId&&stableValuation(raw.derivation)===stableValuation(deriveG03Valuation(b.components as ValuationComponents)))
}

/** The retained undated P/E is neither a dated observation nor the approved
 * PE + EV/EBITDA + FCF-yield AND join. Exclude only this exact audited legacy
 * candidate after the complete reviewed series validates; preserve other,
 * modified, valid or conflicting canonical facts for normal reconciliation. */
export function fixedG03UnqualifiedValuationCandidate(rows:readonly {id:string;source_record_id:string|null;metric_code:string;numeric_value:string|null;period_start:string|null;period_end:string|null;period_type:string|null;consolidation_scope:string|null;unit:string|null;source_code:string}[]){
 return rows.length===1&&rows.every(r=>r.id==='426c0693-713e-48fa-a32f-90552fc6fc5b'&&r.source_record_id==='fa44ae66-5226-4a52-9c6d-70179e9dc7ba'&&r.metric_code==='PE_TTM'&&/^46\.60*$/.test(String(r.numeric_value))&&r.period_start===null&&r.period_end===null&&r.period_type==='TTM'&&r.consolidation_scope==='UNKNOWN'&&r.unit===null&&r.source_code==='TRENDLYNE_MCP')
}
