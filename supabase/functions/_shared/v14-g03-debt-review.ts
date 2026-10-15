import batch from './v14-g03-debt-review-batch.json' with {type:'json'}
import {G03_FINANCIAL_POLICY as p,G03_DEBT_KIND,G03_DEBT_SOURCE_KIND,deriveG03DebtCoverage,type DebtComponents} from './v14-g03-debt-components.ts'
export {batch as G03_DEBT_BATCH}
type Json=Readonly<Record<string,unknown>>
export function stableDebt(v:unknown):string{
 if(Array.isArray(v))return '['+v.map(stableDebt).join(',')+']'
 if(v!==null&&typeof v==='object')return '{'+Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>JSON.stringify(k)+':'+stableDebt(x)).join(',')+'}'
 return JSON.stringify(v)??'null'
}
export function approvedG03DebtReview(r:{id:string;portfolio_id:string;security_id:string;requirement_code:string;review_kind:string;reviewed_by:string|null;period_start:string|null;period_end:string|null;period_type:string|null;unit:string|null;currency:string|null;consolidation_scope:string|null;metadata:Json},ownerId:string,family:string){
 const b=batch.periods.find(b=>b.reviewId===r.id),a=r.metadata.review_authorization as Json|undefined
 return Boolean(b&&family==='NUMERIC_SERIES'&&ownerId===p.ownerId&&r.portfolio_id===p.portfolioId&&r.security_id===p.securityId&&r.requirement_code==='NET_DEBT_AND_INTEREST_COVERAGE'&&r.review_kind===G03_DEBT_KIND&&r.reviewed_by===null&&r.period_start===b.periodStart&&r.period_end===b.periodEnd&&r.period_type==='YEAR'&&r.unit==='RATIO'&&r.currency===null&&r.consolidation_scope==='STANDALONE'&&stableDebt(r.metadata.financial_components)===stableDebt(b.components)&&a?.authorization_reference===p.contractSha256&&a.authorizing_owner_id===ownerId&&a.executor==='GITHUB_OIDC_G03_APPROVED_FINANCIAL_QUALIFICATION')
}
export function approvedG03DebtSource(r:{id:string;source_record_id:string|null;supporting_quote:string|null;metadata:Json},s:{id:string;source_code:string;raw_payload:Json}){
 const b=batch.periods.find(b=>b.reviewId===r.id),raw=s.raw_payload
 return Boolean(b&&s.id===b.sourceId&&r.source_record_id===b.sourceId&&s.source_code===p.sourceAuthority&&raw.version===G03_DEBT_SOURCE_KIND&&raw.security_id===p.securityId&&raw.original_sha256===b.originalSha256&&raw.xml_original_sha256===b.xmlOriginalSha256&&typeof raw.original_source_record_id==='string'&&raw.fragment===b.fragment&&r.supporting_quote===b.fragment&&raw.authorization_reference===p.contractSha256&&raw.publication_precision==='UNKNOWN'&&stableDebt(raw.financial_components)===stableDebt(b.components)&&stableDebt(raw.verified_source_cells)===stableDebt(batch.cells)&&stableDebt(raw.derivation)===stableDebt(deriveG03DebtCoverage(b.components as DebtComponents)))
}
