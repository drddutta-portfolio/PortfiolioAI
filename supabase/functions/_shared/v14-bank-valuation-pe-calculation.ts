import Decimal from "https://esm.sh/decimal.js@10.6.0"
const Exact=Decimal.clone({precision:40,rounding:Decimal.ROUND_HALF_UP})
const decimal=/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/u,positive=/^(?:0|[1-9]\d*)(?:\.\d+)?$/u,hash=/^[a-f0-9]{64}$/u
const instant=(v:string)=>/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(v)?Date.parse(v):NaN
function quarter(v:string):number|null{
 if(!/^\d{4}-\d{2}-\d{2}$/u.test(v))return null
 const d=new Date(v+"T00:00:00Z"),m=d.getUTCMonth()+1
 return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v&&[3,6,9,12].includes(m)
  &&d.getUTCDate()===new Date(Date.UTC(d.getUTCFullYear(),m,0)).getUTCDate()?d.getUTCFullYear()*4+m/3-1:null
}
export const BANK_PE_CALCULATION_VERSION="V1_4_BANK_FOUR_ORIGINAL_DILUTED_QUARTER_EPS_MULTIPLE_V1"
export interface BankDilutedQuarterEps{
 readonly quarterStart:string;readonly quarterEnd:string;readonly dilutedEps:string
 readonly epsBasis:"DILUTED_NONANNUALIZED_QUARTER";readonly unit:"INR_PER_SHARE"
 readonly reportingScope:"STANDALONE"|"CONSOLIDATED";readonly originalSha256:string;readonly sourceAvailableAt:string
 readonly denominatorShareFactorNumerator:string;readonly denominatorShareFactorDenominator:string
 readonly shareBasisAvailableAt:string;readonly shareAlignment:"SOURCE_QUALIFIED"
}
export interface BankPeCalculationInput{
 readonly rawClose:string;readonly currency:"INR";readonly priceBasis:"RAW_CONTEMPORANEOUS_CLOSE"
 readonly reportingScope:"STANDALONE"|"CONSOLIDATED";readonly ttmPeriodEnd:string
 readonly quarters:readonly BankDilutedQuarterEps[];readonly priceAsOf:string;readonly evaluationAsOf:string
}
export type BankPeCalculationResult={readonly state:"CALCULATED_NOT_ADMITTED";readonly version:typeof BANK_PE_CALCULATION_VERSION;
 readonly ttmDilutedEps:string;readonly multiple:string;readonly sourceAvailableAt:string}
 |{readonly state:"REVIEW_REQUIRED";readonly reason:string}
function quartersQualified(rows:readonly BankDilutedQuarterEps[],scope:string,periodEnd:string,cutoff:string):{reason:string|null;sum:Decimal;availableAt:string}{
 const fail=(reason:string)=>({reason,sum:new Exact(0),availableAt:""})
 if(!Array.isArray(rows)||rows.length!==4||rows.some(q=>!q||typeof q!=="object"||typeof q.quarterEnd!=="string")||quarter(periodEnd)===null||!["STANDALONE","CONSOLIDATED"].includes(scope)||!Number.isFinite(instant(cutoff)))return fail("BANK_PE_FOUR_EXACT_CONTIGUOUS_QUARTERS_REQUIRED")
 const sorted=[...rows].sort((a,b)=>a.quarterEnd.localeCompare(b.quarterEnd));let sum=new Exact(0),availableAt=""
 for(let i=0;i<4;i++){
  const q=sorted[i]!,ordinal=quarter(q.quarterEnd),parts=q.quarterEnd.split("-").map(Number)
  if(ordinal===null||ordinal!==quarter(periodEnd)!-3+i||q.quarterStart!==`${parts[0]}-${String(parts[1]!-2).padStart(2,"0")}-01`)
   return fail("BANK_PE_QUARTER_GAP_DUPLICATE_OR_DATES_INVALID")
  if(q.epsBasis!=="DILUTED_NONANNUALIZED_QUARTER"||q.unit!=="INR_PER_SHARE"||q.reportingScope!==scope||q.shareAlignment!=="SOURCE_QUALIFIED"
   ||!hash.test(q.originalSha256)||!decimal.test(q.dilutedEps)||!positive.test(q.denominatorShareFactorNumerator)||!positive.test(q.denominatorShareFactorDenominator)
   ||new Exact(q.denominatorShareFactorNumerator).lte(0)||new Exact(q.denominatorShareFactorDenominator).lte(0))return fail("BANK_PE_ORIGINAL_DILUTED_EPS_OR_SHARE_BASIS_NOT_PROVEN")
  const timestamps=[q.sourceAvailableAt,q.shareBasisAvailableAt].map(instant)
  if(timestamps.some(t=>!Number.isFinite(t)||t>instant(cutoff))||timestamps[0]!<Date.parse(q.quarterEnd+"T00:00:00Z"))
   return fail("BANK_PE_PUBLICATION_OR_SHARE_BASIS_LOOKAHEAD")
  for(const time of [q.sourceAvailableAt,q.shareBasisAvailableAt])if(!availableAt||instant(time)>instant(availableAt))availableAt=time
  sum=sum.plus(new Exact(q.dilutedEps).mul(q.denominatorShareFactorNumerator).div(q.denominatorShareFactorDenominator))
 }
 return {reason:null,sum,availableAt}
}
/** Approved four-source quarter EPS sum; never substitutes annual EPS, inverts
 * rounded EPS into shares, chooses sources or admits readiness. Original source
 * factual qualification and then-applicable share-basis proof remain caller duties. */
export function calculateBankPeMultiple(input:BankPeCalculationInput):BankPeCalculationResult{
 const fail=(reason:string):BankPeCalculationResult=>({state:"REVIEW_REQUIRED",reason})
 if(!positive.test(input.rawClose)||new Exact(input.rawClose).lte(0)||input.currency!=="INR"||input.priceBasis!=="RAW_CONTEMPORANEOUS_CLOSE"
  ||!Number.isFinite(instant(input.priceAsOf))||!Number.isFinite(instant(input.evaluationAsOf))||instant(input.priceAsOf)>instant(input.evaluationAsOf))return fail("BANK_PE_RAW_PRICE_OR_EVALUATION_INVALID")
 const result=quartersQualified(input.quarters,input.reportingScope,input.ttmPeriodEnd,input.priceAsOf)
 if(result.reason)return fail(result.reason)
 if(result.sum.lte(0))return fail("BANK_PE_TTM_DILUTED_EPS_NONPOSITIVE")
 return {state:"CALCULATED_NOT_ADMITTED",version:BANK_PE_CALCULATION_VERSION,ttmDilutedEps:result.sum.toFixed(16),
  multiple:new Exact(input.rawClose).div(result.sum).toFixed(16),sourceAvailableAt:result.availableAt}
}
/** Annual figure is used solely as an independent same-basis reconciliation.
 * Four 2dp rounded source EPS components permit at most 0.02 absolute difference.
 * The annual figure never becomes a replacement trailing denominator. */
export function reconcileBankQuarterEpsAnnual(input:{quarters:readonly BankDilutedQuarterEps[];reportingScope:"STANDALONE"|"CONSOLIDATED";
 annualPeriodEnd:string;annualDilutedEps:string;annualOriginalSha256:string;annualAvailableAt:string;evaluationAsOf:string;annualShareAlignment:"SOURCE_QUALIFIED_SAME_BASIS"}){
 if(input.annualShareAlignment!=="SOURCE_QUALIFIED_SAME_BASIS"||!input.annualPeriodEnd.endsWith("-03-31")||!hash.test(input.annualOriginalSha256)||!decimal.test(input.annualDilutedEps)
  ||!Number.isFinite(instant(input.annualAvailableAt))||instant(input.annualAvailableAt)>instant(input.evaluationAsOf)||instant(input.annualAvailableAt)<Date.parse(input.annualPeriodEnd+"T00:00:00Z"))return {state:"REVIEW_REQUIRED" as const,reason:"BANK_PE_ANNUAL_RECONCILIATION_SOURCE_INVALID"}
 const result=quartersQualified(input.quarters,input.reportingScope,input.annualPeriodEnd,input.evaluationAsOf)
 if(result.reason)return {state:"REVIEW_REQUIRED" as const,reason:result.reason}
 if(input.quarters.some(q=>!/^-?(?:0|[1-9]\d*)\.\d{2}$/u.test(q.dilutedEps)))return {state:"REVIEW_REQUIRED" as const,reason:"BANK_PE_ANNUAL_RECONCILIATION_2DP_PRECISION_REQUIRED"}
 const difference=result.sum.minus(input.annualDilutedEps)
 return difference.abs().gt("0.02")?{state:"REVIEW_REQUIRED" as const,reason:"BANK_PE_ANNUAL_QUARTER_SUM_OUTSIDE_ROUNDING_BOUND",difference:difference.toFixed(16)}
  :{state:"RECONCILED_NOT_ADMITTED" as const,quarterSum:result.sum.toFixed(16),annualDilutedEps:input.annualDilutedEps,difference:difference.toFixed(16),absoluteBound:"0.02"}
}
