import Decimal from "https://esm.sh/decimal.js@10.6.0"

const Money=Decimal.clone({precision:40,rounding:Decimal.ROUND_HALF_UP})
const decimal=/^(?:0|[1-9]\d*)(?:\.\d+)?$/
const signedDecimal=/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/
const positive=(value:unknown)=>typeof value==="string"&&decimal.test(value)&&new Money(value).gt(0)
const date=(value:unknown)=>typeof value==="string"&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)?Date.parse(value):NaN
export const BANK_PB_CALCULATION_VERSION="V1_4_BANK_STATUTORY_BOOK_PRICE_MULTIPLE_V1"

export interface BankPbCalculationInput{
 readonly rawClose:string
 readonly capital:string
 readonly reservesAndSurplus:string
 readonly currency:"INR"
 readonly amountScale:"INR"|"INR_THOUSAND"|"INR_LAKH"|"INR_CRORE"
 readonly fullyPaidShares:string
 readonly equityPeriodEnd:string
 readonly sharesPeriodEnd:string
 readonly reportingScope:"STANDALONE"|"CONSOLIDATED"
 readonly shareCountBasis:"FULLY_PAID_OUTSTANDING"
 readonly bookBasis:"STATUTORY_COMMON_EQUITY"
 readonly priceBasis:"RAW_CONTEMPORANEOUS_CLOSE"
 readonly equityAvailableAt:string
 readonly sharesAvailableAt:string
 readonly priceAsOf:string
 readonly evaluationAsOf:string
 /** Exact share-basis conversion for the denominator. Do not adjust an already
  * adjusted price, subtract proposed dividends, or apply an ROE transformation. */
 readonly denominatorShareFactorNumerator:string
 readonly denominatorShareFactorDenominator:string
 readonly shareAlignment:"SOURCE_QUALIFIED"
}
export type BankPbCalculationResult={
 readonly state:"CALCULATED_NOT_ADMITTED";readonly version:typeof BANK_PB_CALCULATION_VERSION
 readonly bookValuePerShare:string;readonly multiple:string;readonly sourceAvailableAt:string
}|{readonly state:"REVIEW_REQUIRED";readonly reason:string}

/** One deterministic owner of the approved unadjusted price/book calculation.
 * Caller must independently qualify original facts and admission authority.
 * This function never creates a review, admits a ledger row or assigns READY. */
export function calculateBankPbMultiple(input:BankPbCalculationInput):BankPbCalculationResult{
 const fail=(reason:string):BankPbCalculationResult=>({state:"REVIEW_REQUIRED",reason})
 if(!positive(input.rawClose)||!positive(input.capital)||typeof input.reservesAndSurplus!=="string"||!signedDecimal.test(input.reservesAndSurplus)||
    !positive(input.fullyPaidShares)||!/^\d+$/.test(input.fullyPaidShares)||
    !positive(input.denominatorShareFactorNumerator)||!positive(input.denominatorShareFactorDenominator))
  return fail("BANK_PB_EXACT_POSITIVE_INPUTS_REQUIRED")
 const scales={INR:"1",INR_THOUSAND:"1000",INR_LAKH:"100000",INR_CRORE:"10000000"}
 const scale=Object.hasOwn(scales,input.amountScale)?scales[input.amountScale]:null
 if(!scale||input.currency!=="INR"||!["STANDALONE","CONSOLIDATED"].includes(input.reportingScope)||
    input.shareCountBasis!=="FULLY_PAID_OUTSTANDING"||input.bookBasis!=="STATUTORY_COMMON_EQUITY"||
    input.priceBasis!=="RAW_CONTEMPORANEOUS_CLOSE"||input.shareAlignment!=="SOURCE_QUALIFIED")
  return fail("BANK_PB_ACCOUNTING_OR_SHARE_BASIS_NOT_PROVEN")
 const period=Date.parse(input.equityPeriodEnd+"T00:00:00Z")
 if(!/^\d{4}-\d{2}-\d{2}$/.test(input.equityPeriodEnd)||input.equityPeriodEnd!==input.sharesPeriodEnd||
    !Number.isFinite(period)||new Date(period).toISOString().slice(0,10)!==input.equityPeriodEnd||period>date(input.priceAsOf))
  return fail("BANK_PB_MATCHED_REPORTING_PERIOD_REQUIRED")
 const instants=[input.equityAvailableAt,input.sharesAvailableAt,input.priceAsOf,input.evaluationAsOf].map(date)
 if(instants.some(t=>!Number.isFinite(t))||instants[0]!>instants[2]!||instants[1]!>instants[2]!||instants[2]!>instants[3]!)
  return fail("BANK_PB_PUBLICATION_LOOKAHEAD_OR_DATE_INVALID")
 const equity=new Money(input.capital).plus(input.reservesAndSurplus).mul(scale)
 if(equity.lte(0))return fail("BANK_PB_COMMON_EQUITY_NONPOSITIVE")
 const book=equity.div(input.fullyPaidShares).mul(input.denominatorShareFactorNumerator).div(input.denominatorShareFactorDenominator)
 const multiple=new Money(input.rawClose).div(book)
 return{state:"CALCULATED_NOT_ADMITTED",version:BANK_PB_CALCULATION_VERSION,bookValuePerShare:book.toFixed(16),
  multiple:multiple.toFixed(16),sourceAvailableAt:instants[0]!>=instants[1]!?input.equityAvailableAt:input.sharesAvailableAt}
}
