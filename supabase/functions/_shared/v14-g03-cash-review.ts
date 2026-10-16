import batch from './v14-g03-cash-review-batch.json' with {type:'json'}
import {approvedRemainingG03CashReview,approvedRemainingG03CashSource} from './v14-g03-remaining-cash-contract.ts'
import {G03_FINANCIAL_POLICY as p,G03_CASH_KIND,G03_CASH_SOURCE_KIND,deriveG03CashConversion,type CashComponents} from './v14-g03-cash-components.ts'
export {batch as G03_CASH_BATCH}
type Json=Readonly<Record<string,unknown>>
export function stableCash(v:unknown):string{
 if(Array.isArray(v))return '['+v.map(stableCash).join(',')+']'
 if(v!==null&&typeof v==='object')return '{'+Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>JSON.stringify(k)+':'+stableCash(x)).join(',')+'}'
 return JSON.stringify(v)??'null'
}
export function approvedG03CashReview(r:{id:string;portfolio_id:string;security_id:string;requirement_code:string;review_kind:string;reviewed_by:string|null;period_start:string|null;period_end:string|null;period_type:string|null;unit:string|null;currency:string|null;consolidation_scope:string|null;metadata:Json},ownerId:string,family:string){
 if(approvedRemainingG03CashReview(r,ownerId,family))return true
 const b=batch.periods.find(b=>b.reviewId===r.id),a=r.metadata.review_authorization as Json|undefined
 return Boolean(b&&family==='NUMERIC_SERIES'&&ownerId===p.ownerId&&r.portfolio_id===p.portfolioId&&r.security_id===p.securityId&&r.requirement_code==='CFO_FCF_CONVERSION'&&r.review_kind===G03_CASH_KIND&&r.reviewed_by===null&&r.period_start===b.periodStart&&r.period_end===b.periodEnd&&r.period_type==='YEAR'&&r.unit==='RATIO'&&r.currency===null&&r.consolidation_scope==='STANDALONE'&&stableCash(r.metadata.financial_components)===stableCash(b.components)&&a?.authorization_reference===p.contractSha256&&a.authorizing_owner_id===ownerId&&a.executor==='GITHUB_OIDC_G03_APPROVED_FINANCIAL_QUALIFICATION')
}
export function approvedG03CashSource(r:{id:string;source_record_id:string|null;supporting_quote:string|null;metadata:Json},s:{id:string;source_code:string;raw_payload:Json}){
 if(approvedRemainingG03CashSource(r,s))return true
 const b=batch.periods.find(b=>b.reviewId===r.id),raw=s.raw_payload
 return Boolean(b&&s.id===b.sourceId&&r.source_record_id===b.sourceId&&s.source_code===p.sourceAuthority&&raw.version===G03_CASH_SOURCE_KIND&&raw.security_id===p.securityId&&raw.original_sha256===b.originalSha256&&typeof raw.original_source_record_id==='string'&&raw.fragment===b.fragment&&r.supporting_quote===b.fragment&&raw.authorization_reference===p.contractSha256&&raw.publication_precision==='UNKNOWN'&&stableCash(raw.financial_components)===stableCash(b.components)&&stableCash(raw.verified_source_cells)===stableCash(batch.cells.filter(c=>c.originalSha256===b.originalSha256))&&stableCash(raw.derivation)===stableCash(deriveG03CashConversion(b.components as CashComponents)))
}
