/** Owner-approved BANK V1-4 direct-source semantic preflight, not factual ACCEPT.
 * Canonical evaluator and source-bound review ledger remain the only admission owners.
 * No calculation, inference of annual/TTM equivalence, database access or READY output.
 */
export type ApprovedDirectBankCode = "NIM_TTM" | "CET1_RATIO" | "CAPITAL_ADEQUACY_RATIO" | "ROA_ANNUAL"
export interface DirectBankClaim {
  readonly code: ApprovedDirectBankCode
  readonly sourceAuthority: "ISSUER_OFFICIAL" | "NSE_OFFICIAL" | "TRENDLYNE_MCP"
  readonly originalContentHash: string
  readonly originalSourceUrl: string
  readonly issuerIsin: string
  readonly nativeField: string
  readonly statedValue: string
  readonly unit: "PERCENT"
  readonly periodStart: string
  readonly periodEnd: string
  readonly periodType: "TRAILING_FOUR_QUARTERS" | "REGULATORY_AS_OF" | "FULL_FINANCIAL_YEAR"
  readonly reportingPerimeter: string
  readonly denominatorDefinition: string
  readonly sourceExplicitlyCertifiesMetric: boolean
  readonly publishedAt: string
  readonly retrievedAt: string
  readonly supportingExcerpt: string
  readonly baselRegime?: "BASEL_III" | "BASEL_II"
  readonly numeratorCapitalCategory?: "CET1" | "TOTAL_REGULATORY_CAPITAL" | "TIER_1"
}
export type DirectBankPreflight = {readonly qualifiedForFactualReview:boolean;readonly reasons:readonly string[]}

const isoDay=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+"T00:00:00Z"))&&new Date(s+"T00:00:00Z").toISOString().slice(0,10)===s
const timestamp=(s:string)=>/^\d{4}-\d{2}-\d{2}T/.test(s)&&Number.isFinite(Date.parse(s))
const positiveDecimal=(s:string)=>/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(s)&&Number(s)>0

/** Passing this gate means only 'eligible for source-bound factual review', NEVER admitted or READY. */
export function preflightApprovedBankDirectClaim(x:DirectBankClaim):DirectBankPreflight {
  const reasons:string[]=[]
  if(!["NIM_TTM","CET1_RATIO","CAPITAL_ADEQUACY_RATIO","ROA_ANNUAL"].includes(x.code))reasons.push("METRIC_NOT_APPROVED")
  if(!["ISSUER_OFFICIAL","NSE_OFFICIAL","TRENDLYNE_MCP"].includes(x.sourceAuthority))reasons.push("SOURCE_AUTHORITY_UNSUPPORTED")
  if(!/^[a-f0-9]{64}$/i.test(x.originalContentHash))reasons.push("ORIGINAL_HASH_REQUIRED")
  if(!/^https:\/\//.test(x.originalSourceUrl))reasons.push("ORIGINAL_URL_REQUIRED")
  if(!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(x.issuerIsin))reasons.push("ISSUER_IDENTITY_REQUIRED")
  if(!x.nativeField.trim()||!x.supportingExcerpt.trim())reasons.push("DIRECT_SOURCE_FRAGMENT_REQUIRED")
  if(x.unit!=="PERCENT"||!positiveDecimal(x.statedValue))reasons.push("PERCENT_MEASUREMENT_INVALID")
  if(!isoDay(x.periodStart)||!isoDay(x.periodEnd)||x.periodStart>x.periodEnd)reasons.push("SOURCE_PERIOD_UNPROVEN")
  if(!timestamp(x.publishedAt)||!timestamp(x.retrievedAt)||Date.parse(x.publishedAt)>Date.parse(x.retrievedAt))reasons.push("PUBLICATION_LINEAGE_INVALID")
  if(!x.reportingPerimeter.trim()||!x.denominatorDefinition.trim())reasons.push("SCOPE_OR_DENOMINATOR_MISSING")
  if(x.sourceExplicitlyCertifiesMetric!==true)reasons.push("DIRECT_METRIC_SEMANTICS_UNPROVEN")
  if(x.code==="NIM_TTM"&&(
    x.periodType!=="TRAILING_FOUR_QUARTERS"||
    !/interest.earning.assets/i.test(x.denominatorDefinition)||
    !/net.interest.(income|margin)/i.test(x.nativeField+" "+x.supportingExcerpt)
  ))reasons.push("TTM_NIM_EXPLICIT_BASIS_REQUIRED")
  if((x.code==="CET1_RATIO"||x.code==="CAPITAL_ADEQUACY_RATIO")&&(
    x.periodType!=="REGULATORY_AS_OF"||x.periodStart!==x.periodEnd||
    x.baselRegime!=="BASEL_III"||!/risk.weighted.assets/i.test(x.denominatorDefinition)
  ))reasons.push("BASEL_III_REGULATORY_BASIS_REQUIRED")
  if(x.code==="CET1_RATIO"&&x.numeratorCapitalCategory!=="CET1")reasons.push("CET1_NOT_TIER1_REQUIRED")
  if(x.code==="CAPITAL_ADEQUACY_RATIO"&&x.numeratorCapitalCategory!=="TOTAL_REGULATORY_CAPITAL")reasons.push("TOTAL_REGULATORY_CAPITAL_REQUIRED")
  if(x.code==="ROA_ANNUAL"&&(
    x.periodType!=="FULL_FINANCIAL_YEAR"||
    !/average.total.assets/i.test(x.denominatorDefinition)||
    !/annual|full.year|return.on.assets/i.test(x.nativeField+" "+x.supportingExcerpt)
  ))reasons.push("AUDITED_FULL_YEAR_ROA_BASIS_REQUIRED")
  return {qualifiedForFactualReview:reasons.length===0,reasons}
}
