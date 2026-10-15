import Decimal from 'decimal.js'
import policy from './v14-g03-financial-authorization.json' with {type:'json'}
export {policy as G03_FINANCIAL_POLICY}
export const G03_CASH_KIND='DELEGATED_G03_APPROVED_CASH_COMPONENT_REVIEW'
export const G03_CASH_SOURCE_KIND='G03_BEL_SOURCE_BOUND_CASH_COMPONENTS_V1'
export const G03_CASH_BASIS='FY2026_ISSUER_OPERATING_INVESTING_CLASSIFICATION'
const Money=Decimal.clone({precision:40,rounding:Decimal.ROUND_HALF_UP})
export interface CashComponents {
 readonly fiscalYear:number;readonly scope:string;readonly unit:string;readonly classification:string
 readonly cfoOriginal:string;readonly cashCapexOutflow:string;readonly pat:string
 readonly excludedRental:string;readonly excludedMutualFundGain:string
 readonly adjustmentKind:'ISSUER_REPORTED'|'PORTFOLIOAI_CLASSIFICATION_NORMALIZATION'
}
const decimal=(v:unknown)=>typeof v==='string'&&/^-?\d+(?:\.\d+)?$/.test(v)?new Money(v):null
/** Single deterministic owner for the approved source-bound cash conversion.
 * Source amounts stay in INR lakh; monetary output is INR crore exactly. Only
 * the dimensionless CFO/PAT ratio is rounded, half-up at six decimal places.
 * Negative CFO/FCF is valid adverse evidence. PAT <= 0 is undefined.
 */
export function deriveG03CashConversion(c:CashComponents){
 const values=[c.cfoOriginal,c.cashCapexOutflow,c.pat,c.excludedRental,c.excludedMutualFundGain].map(decimal)
 if(values.some(v=>v===null)||c.scope!=='STANDALONE'||c.unit!=='INR_LAKH'||c.classification!==G03_CASH_BASIS||!Number.isInteger(c.fiscalYear))return null
 const [cfo,capex,pat,rental,gain]=values as Decimal[]
 if(capex.gt(0)||pat.lte(0)||rental.lt(0)||gain.lt(0))return null
 const normalized=cfo.minus(rental).minus(gain)
 if(c.adjustmentKind==='ISSUER_REPORTED'&&(!rental.isZero()||!gain.isZero()))return null
 if(c.adjustmentKind!=='ISSUER_REPORTED'&&c.adjustmentKind!=='PORTFOLIOAI_CLASSIFICATION_NORMALIZATION')return null
 return {cfoCrore:normalized.div(100).toFixed(2),patCrore:pat.div(100).toFixed(2),cashCapexCrore:capex.neg().div(100).toFixed(2),fcfCrore:normalized.plus(capex).div(100).toFixed(2),cfoPat:normalized.div(pat).toFixed(6),calculationAuthority:'deriveG03CashConversion',classification:c.classification,adjustmentKind:c.adjustmentKind,issuerReportedRestatement:false,derived:true}
}
