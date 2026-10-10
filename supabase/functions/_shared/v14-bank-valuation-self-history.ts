/** Approved Banking V1-4 M5/M7 self-history comparator, independent of factual admission.
 * Inputs must already be canonical, timestamped, point-in-time source-verified month-end
 * observations. This function does not fetch, derive BVPS/EPS, accept reviews or READY.
 */
export type BankRelativeCode = "PB_RELATIVE" | "PE_TTM_RELATIVE";
export interface BankValuationObservation {
  readonly month: string; // YYYY-MM
  readonly multiple: number;
  readonly sourcePublishedAt: string;
  readonly priceAsOf: string;
  readonly reportingScope: string;
  readonly corporateActionBasis: string;
  readonly sourceHash: string;
  readonly admitted: boolean;
}
export type BankValuationResult={state:"REVIEW_REQUIRED"|"FRESH";reason:string;ratio?:number;referenceMedian?:number;eligibleMonths:number};
const allowed=/^\d{4}-(0[1-9]|1[0-2])$/;
function ordinal(s:string){const [y,m]=s.split("-").map(Number);return y*12+m}
function daysDate(s:string){const d=Date.parse(s);return Number.isFinite(d)?d:NaN}
export function compareBankSelfHistory(input:{
 code:BankRelativeCode; currentMultiple:number; currentMonth:string;
 currentScope:string; currentCorporateActionBasis:string;
 asOf:string; historical:readonly BankValuationObservation[];
}):BankValuationResult{
 const fail=(reason:string,eligibleMonths=0):BankValuationResult=>({state:"REVIEW_REQUIRED",reason,eligibleMonths});
 if(!["PB_RELATIVE","PE_TTM_RELATIVE"].includes(input.code)||!allowed.test(input.currentMonth)||!Number.isFinite(input.currentMultiple)||input.currentMultiple<=0||!Number.isFinite(daysDate(input.asOf)))return fail("BANK_VALUATION_CURRENT_BASIS_INVALID");
 const last=ordinal(input.currentMonth),perMonth=new Map<number,number>();
 for(const o of input.historical){
  if(!allowed.test(o.month)||!Number.isFinite(o.multiple)||o.multiple<=0||!o.admitted||
     !/^[0-9a-f]{64}$/i.test(o.sourceHash)||o.reportingScope!==input.currentScope||
     o.corporateActionBasis!==input.currentCorporateActionBasis)continue;
  const month=ordinal(o.month);
  if(month>=last||month<last-60||daysDate(o.sourcePublishedAt)>daysDate(o.priceAsOf)||
    daysDate(o.priceAsOf)>daysDate(input.asOf)||!Number.isFinite(daysDate(o.sourcePublishedAt))||
    !Number.isFinite(daysDate(o.priceAsOf)))continue;
  if(perMonth.has(month))return fail("BANK_VALUATION_DUPLICATE_MONTH_CONFLICT",perMonth.size);
  perMonth.set(month,o.multiple);
 }
 const months=[...perMonth.keys()].sort((a,b)=>a-b);
 if(months.length<36)return fail("BANK_VALUATION_MIN_36_OF_60_MISSING",months.length);
 for(let k=0;k<5;k++){
  const lo=last-60+k*12,hi=lo+12;
  if(months.filter(m=>m>=lo&&m<hi).length<6)return fail("BANK_VALUATION_YEARLY_DISTRIBUTION_INSUFFICIENT",months.length);
 }
 for(let x=last-60,missing=0;x<last;x++){
  missing=perMonth.has(x)?0:missing+1;
  if(missing>6)return fail("BANK_VALUATION_CONSECUTIVE_GAP_TOO_LONG",months.length);
 }
 const sorted=[...perMonth.values()].sort((a,b)=>a-b),n=sorted.length;
 const median=n%2?sorted[(n-1)/2]!: (sorted[n/2-1]!+sorted[n/2]!)/2;
 return {state:"FRESH",reason:"BANK_VALUATION_COMPARATOR_COVERAGE_PROVEN",ratio:input.currentMultiple/median,referenceMedian:median,eligibleMonths:n};
}
