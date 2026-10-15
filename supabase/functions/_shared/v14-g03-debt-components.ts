import {Decimal} from 'decimal.js'
export {G03_FINANCIAL_POLICY} from './v14-g03-cash-components.ts'
export const G03_DEBT_KIND='DELEGATED_G03_APPROVED_DEBT_COMPONENT_REVIEW'
export const G03_DEBT_SOURCE_KIND='G03_BEL_SOURCE_BOUND_DEBT_COMPONENTS_V1'
const Money=Decimal.clone({precision:40,rounding:Decimal.ROUND_HALF_UP})
export interface DebtComponents{
 readonly fiscalYear:number;readonly scope:string;readonly unit:string;readonly ebitdaBasis:string
 readonly borrowingCurrent:string;readonly borrowingNoncurrent:string;readonly leaseCurrent:string;readonly leaseNoncurrent:string
 readonly cashEquivalents:string;readonly pledgedCashEquivalents:string;readonly issuerOperatingEbitda:string;readonly depreciation:string
 readonly financeCosts:string;readonly leaseInterest:string;readonly profitBeforeTax:string;readonly otherIncome:string
}
/** One owner for the approved AND-joined debt and coverage components. The
 * issuer's explicit operating EBITDA is corroborated against the same annual
 * P&L; ROCE's total-income EBIT is deliberately not substituted. Pledged cash
 * is excluded, and the cash residual must be source-proven, never zero-filled.
 */
export function deriveG03DebtCoverage(c:DebtComponents){
 const names=['borrowingCurrent','borrowingNoncurrent','leaseCurrent','leaseNoncurrent','cashEquivalents','pledgedCashEquivalents','issuerOperatingEbitda','depreciation','financeCosts','leaseInterest','profitBeforeTax','otherIncome'] as const
 if(c.scope!=='STANDALONE'||c.unit!=='INR_LAKH'||c.ebitdaBasis!=='ISSUER_REPORTED_OPERATING_EBITDA_EXCLUDING_OTHER_INCOME'||!Number.isInteger(c.fiscalYear)||names.some(k=>typeof c[k]!=='string'||!/^\d+(?:\.\d+)?$/.test(c[k])))return null
 const v=Object.fromEntries(names.map(k=>[k,new Money(c[k])])) as Record<typeof names[number],Decimal>
 if(v.issuerOperatingEbitda.lte(0)||v.financeCosts.lte(0)||v.leaseInterest.gt(v.financeCosts)||v.pledgedCashEquivalents.gt(v.cashEquivalents)||!v.profitBeforeTax.plus(v.financeCosts).plus(v.depreciation).minus(v.otherIncome).eq(v.issuerOperatingEbitda))return null
 const debt=v.borrowingCurrent.plus(v.borrowingNoncurrent).plus(v.leaseCurrent).plus(v.leaseNoncurrent),cash=v.cashEquivalents.minus(v.pledgedCashEquivalents),net=debt.minus(cash),ebit=v.issuerOperatingEbitda.minus(v.depreciation)
 return {grossDebtCrore:debt.div(100).toFixed(2),verifiedUnpledgedCashCrore:cash.div(100).toFixed(2),excludedPledgedCashCrore:v.pledgedCashEquivalents.div(100).toFixed(2),netDebtCrore:net.div(100).toFixed(2),operatingEbitdaCrore:v.issuerOperatingEbitda.div(100).toFixed(2),operatingEbitCrore:ebit.div(100).toFixed(2),financeCostsCrore:v.financeCosts.div(100).toFixed(2),leaseInterestCrore:v.leaseInterest.div(100).toFixed(2),netDebtEbitda:net.div(v.issuerOperatingEbitda).toFixed(6),interestCoverage:ebit.div(v.financeCosts).toFixed(6),calculationAuthority:'deriveG03DebtCoverage',includesLeaseDebtAndInterest:true,issuerReportedRatio:false}
}
