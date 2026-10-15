import {Decimal} from 'decimal.js'
export {G03_FINANCIAL_POLICY} from './v14-g03-cash-components.ts'
export const G03_VALUATION_KIND='DELEGATED_G03_APPROVED_DATED_VALUATION_REVIEW'
export const G03_VALUATION_SOURCE_KIND='G03_BEL_SOURCE_BOUND_DATED_VALUATIONS_V1'
export const G03_VALUATION_FRESH_THROUGH='2026-10-15T23:59:59+05:30'
const Money=Decimal.clone({precision:40,rounding:Decimal.ROUND_HALF_UP})
export interface ValuationComponents {
 readonly valuationDate:string;readonly price:string;readonly shares:string;readonly scope:string;readonly currency:string;readonly amountUnit:string;readonly priceBasis:string
 readonly financialTtmStart:string;readonly financialTtmEnd:string;readonly cashFlowStart:string;readonly cashFlowEnd:string
 readonly annualPat:string;readonly priorJunePat:string;readonly currentJunePat:string
 readonly annualOperatingEbitda:string;readonly priorJuneOperatingEbitda:string;readonly currentJuneOperatingEbitda:string
 readonly grossDebt:string;readonly verifiedUnpledgedCash:string;readonly annualCfo:string;readonly annualCashCapex:string
 readonly financialAvailabilityAt:string;readonly shareAvailabilityAt:string
}
/** Single calculation owner for the approved defence dated valuation AND join.
 * No score or fair-value recommendation is calculated here. Amounts are all
 * standalone INR lakh; shares are exact counts, not rounded paid-up capital. */
export function deriveG03Valuation(c:ValuationComponents){
 const names=['price','shares','annualPat','priorJunePat','currentJunePat','annualOperatingEbitda','priorJuneOperatingEbitda','currentJuneOperatingEbitda','grossDebt','verifiedUnpledgedCash','annualCfo','annualCashCapex'] as const
 if(c.scope!=='STANDALONE'||c.currency!=='INR'||c.amountUnit!=='INR_LAKH'||c.priceBasis!=='PRICE_RETURN_RAW_CLOSE'||!/^\d{4}-\d{2}-\d{2}$/.test(c.valuationDate)||names.some(k=>typeof c[k]!=='string'||! /^-?\d+(?:\.\d+)?$/.test(c[k]))||!/^\d+$/.test(c.shares))return null
 const close=Date.parse(c.valuationDate+'T15:30:00+05:30'),financial=Date.parse(c.financialAvailabilityAt),share=Date.parse(c.shareAvailabilityAt)
 if(!Number.isFinite(close)||new Date(close+5.5*3600000).toISOString().slice(0,10)!==c.valuationDate||!Number.isFinite(financial)||!Number.isFinite(share)||financial>close||share>close||c.financialTtmStart!=='2025-07-01'||c.financialTtmEnd!=='2026-06-30'||c.cashFlowStart!=='2025-04-01'||c.cashFlowEnd!=='2026-03-31'||Date.parse(c.financialTtmEnd)>close)return null
 const v=Object.fromEntries(names.map(k=>[k,new Money(c[k])])) as Record<typeof names[number],Decimal>
 if(v.price.lte(0)||v.shares.lte(0)||v.grossDebt.lt(0)||v.verifiedUnpledgedCash.lt(0)||v.annualCashCapex.lt(0))return null
 const pat=v.annualPat.minus(v.priorJunePat).plus(v.currentJunePat),ebitda=v.annualOperatingEbitda.minus(v.priorJuneOperatingEbitda).plus(v.currentJuneOperatingEbitda),marketCap=v.price.mul(v.shares).div(100000),ev=marketCap.plus(v.grossDebt).minus(v.verifiedUnpledgedCash),fcf=v.annualCfo.minus(v.annualCashCapex)
 if(pat.lte(0)||ebitda.lte(0)||ev.lte(0))return null
 return {peTtm:marketCap.div(pat).toFixed(6),evOperatingEbitdaTtm:ev.div(ebitda).toFixed(6),fcfYieldPercent:fcf.div(marketCap).mul(100).toFixed(6),ttmEps:pat.mul(100000).div(v.shares).toFixed(9),ttmPatLakh:pat.toString(),ttmOperatingEbitdaLakh:ebitda.toString(),marketCapCrore:marketCap.div(100).toFixed(9),enterpriseValueCrore:ev.div(100).toFixed(9),qualifiedAnnualFcfCrore:fcf.div(100).toFixed(2),financialPeriodEnd:c.financialTtmEnd,cashFlowPeriodEnd:c.cashFlowEnd,valuationDate:c.valuationDate,exactShares:c.shares,calculationAuthority:'deriveG03Valuation',issuerReportedRatios:false,forecastsUsed:false}
}
