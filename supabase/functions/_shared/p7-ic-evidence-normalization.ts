export const P7_IC_EVIDENCE_NORMALIZATION_VERSION="P7_IC_EVIDENCE_NORMALIZATION_V3_TYPED_DOCUMENT_MINIMA" as const
export type EvidenceChannel="TRENDLYNE_PARAMETERS"|"TRENDLYNE_OWNERSHIP"|"TRENDLYNE_DOCUMENTS"|"ANGEL_ONE_STOCK_HISTORY"|"ANGEL_ONE_BENCHMARK_HISTORY"|"LOCAL_DERIVATION"|"REVIEW_REQUIRED"
export interface Ic1SignalRequirement{readonly signalCode:string;readonly dimensionCode?:string;readonly evidenceCodes?:readonly string[];readonly minimumPeriods?:number;readonly required?:boolean}
export interface Ic1ProfileEvidenceContract{readonly profileCode:string;readonly benchmarkAuthority?:readonly string[];readonly signalRequirements:readonly Ic1SignalRequirement[]}
export interface EvidenceRequirementPlan{readonly evidenceCode:string;readonly channels:readonly EvidenceChannel[];readonly parameterHints:readonly string[];readonly documentKeywords:readonly string[];readonly minimumPeriods:number;readonly signalLookbackPeriods?:number;readonly minimumUnit?:"DOCUMENT_IDENTITIES";readonly deterministicCoverageRule:"NUMERIC_SERIES"|"OWNERSHIP_4Q"|"TEXT_EVIDENCE_REVIEW"|"MARKET_HISTORY"|"BENCHMARK_HISTORY"|"LOCAL_DERIVATION"}

/** Owner-approved 2026-10-07: a market-session lookback is not a document count.
 * Current qualitative risk requires a source-bound comprehensive review; rating
 * trend retains three distinct dated documentary identities. Other minima unchanged. */
export const V14_DOCUMENT_IDENTITY_MINIMA:Readonly<Record<string,number>>={
 REGULATORY_RISK:1,
 COTTON_INPUT_FX_DEMAND_CYCLE:1,
 COUNTERPARTY_RECEIVABLE_REGULATORY_PROJECT:1,
 INPUT_COST_DEMAND_CAPEX:1,
 HOLDCO_DISCOUNT_LEVERAGE_COMPLEXITY:1,
 INPUT_COST_DEMAND_COMPETITION:1,
 INVENTORY_COMPETITION_UNIT_ECONOMICS:1,
 CLIENT_CONCENTRATION_WAGE_FX_AUTOMATION:1,
 GOLD_PRICE_INVENTORY_REGULATION:1,
 CROP_INPUT_PRICE_FX_CUSTOMER_CONCENTRATION:1,
 REGULATION_COMPETITION_CAPEX_TECH_TRANSITION:1,
 CLIENT_CONCENTRATION_LABOUR_REGULATION:1,
 COMMODITY_POLICY_ENERGY_TRANSITION_MINING:1,
 COMMODITY_POLICY_COUNTERPARTY_TRANSITION:1,
 FUEL_COMPETITION_CLIENT_CONCENTRATION:1,
 ENVIRONMENTAL_COMPLIANCE:1,
 FEEDSTOCK_GLOBAL_PRICING:1,
 CUSTOMER_CONCENTRATION_RECEIVABLE_REGULATION:1,
 RATING_TREND:3,
}
const PARAMETER_HINTS:Readonly<Record<string,readonly string[]>>={ROCE_OR_ROIC:["ROCE Ann. %","ROCE Ann. 1Y Ago %","ROCE Ann. 2Y Ago %","ROCE Ann. 3Y Ago %"],OPERATING_MARGIN_HISTORY:["OPM TTM %","OPM 1Y Ago %","OPM 2Y Ago %","OPM 3Y Ago %","EBITDA Margin"],GROSS_OPERATING_MARGIN_HISTORY:["OPM TTM %","OPM 1Y Ago %","OPM 2Y Ago %","OPM 3Y Ago %"],REVENUE_GROWTH_MULTI_PERIOD:["Revenue 1Y Growth %","Revenue 2Y Growth %","Revenue 3Y Growth %","Revenue 5Y Growth %","Sales 3Y Growth %","Sales 5Y Growth %"],REVENUE_AND_VOLUME_GROWTH_MULTI_PERIOD:["Revenue 1Y Growth %","Revenue 3Y Growth %","Revenue 5Y Growth %"],VOLUME_AND_REVENUE_GROWTH_MULTI_PERIOD:["Revenue 1Y Growth %","Revenue 3Y Growth %","Revenue 5Y Growth %"],NET_PROFIT_GROWTH_MULTI_PERIOD:["Net Profit 1Y Growth %","Net Profit 2Y Growth %","Net Profit 3Y Growth %","Net Profit 5Y Growth %"],EPS_GROWTH_MULTI_PERIOD:["EPS 1Y Growth %","EPS 3Y Growth %","Cash EPS 1Y Growth %","Cash EPS 5Y Growth %"],CFO_OR_FCF_CONVERSION:["Operating Cash Flow 1Y Growth %","Operating Cash Flow 3Y Growth %","Cash Flow from Operations","Free Cash Flow"],CFO_FCF_INVENTORY_WORKING_CAPITAL:["Operating Cash Flow 3Y Growth %","Free Cash Flow","Working Capital Days","Inventory Days"],NET_CASH_OR_LEVERAGE:["Debt Equity","Net debt to EBITDA","Interest Coverage","Total Debt"],PE:["PE TTM","PE 5Yr Average","PE 3Yr Average","Fair Price 5YrPE Upside%"],EV_EBITDA:["EV EBITDA","EV/EBITDA"],FCF_YIELD:["FCF Yield","Free Cash Flow Yield"],PBV:["PBV","Price to Book"],PRICE_TO_BOOK:["PBV","Price to Book"],GROSS_NPA_PERCENT:["Gross NPA ratio Qtr %","Gross NPA Ratio Qtr 1Q ago %","Gross NPA Ratio 4Q Ago %"],NET_NPA_PERCENT:["Net NPA ratio % Qtr","Net NPA ratio % 1Q Ago","Net NPA ratio 4Q Ago %","Net NPA ratio 8Q Ago %"],EPS_GROWTH_YOY:["EPS Qtr YoY Growth %"],ADVANCES_GROWTH_YOY:["Advances Growth YoY %","Gross Advances Growth YoY %"],DEPOSITS_GROWTH_YOY:["Deposits Growth YoY %"],CAPITAL_ADEQUACY:["Capital Adequacy","CAR %","CET1 %"],NIM:["NIM %","Net Interest Margin %"],ROA:["RoA Qtr %","ROA %"]}
const DOCUMENT_KEYWORDS:Readonly<Record<string,readonly string[]>>={BUSINESS_DURABILITY:["competitive advantage","moat","market share","customer","capacity","distribution"],PRODUCT_MIX:["product mix","segment revenue","revenue mix"],BRAND_CUSTOMER_SUPPLY_CHAIN:["brand","customer","distribution","supply chain"],PROCUREMENT_AND_PROCESSING_MOAT:["procurement","processing","sourcing","supply chain"],ORDER_BOOK:["order book","order inflow","backlog"],ORDER_BOOK_EXECUTION:["order book","execution","order inflow"],CAPACITY_UTILIZATION:["capacity utilisation","capacity utilization","installed capacity"],CAPACITY_AND_UTILIZATION:["capacity utilisation","capacity utilization","installed capacity","expansion"],CUSTOMER_CONCENTRATION:["customer concentration","top customer","client concentration"],EXPORT_MIX:["export","international revenue","overseas revenue"],REGULATORY_RISK:["regulatory","compliance","license","approval"],GOVERNANCE_EVENT_REVIEW:["auditor","qualification","related party","fraud","investigation","governance"],LITIGATION_REGULATORY_EVENTS:["litigation","regulatory","penalty","notice","investigation"],CAPEX:["capex","capital expenditure"],CAPEX_PIPELINE:["capex","capital expenditure","expansion"],SUBSCRIBER_ARPU_CHURN:["subscriber","ARPU","churn"],OCCUPANCY_ARPOB:["occupancy","ARPOB","average revenue per occupied bed"],AUM_FLOWS_MARKET_SHARE:["AUM","assets under management","net flows","market share"],PREMIUM_GROWTH_COMBINED_RATIO:["premium","combined ratio","solvency"],UNIT_ECONOMICS:["unit economics","contribution margin","take rate"],RESERVES_PRODUCTION_COST:["reserves","production","lifting cost","cost per barrel"],PLANT_LOAD_FACTOR:["plant load factor","PLF","generation"],RECEIVABLES_REGULATORY_ASSET:["receivables","regulatory asset","collection efficiency"],CAPACITY_PIPELINE_PPA:["capacity","pipeline","PPA","power purchase agreement"]}
const PHARMA_FALLBACK_SIGNALS:readonly Ic1SignalRequirement[]=[{signalCode:"PHARMA_OPERATING_MARGIN_HISTORY",dimensionCode:"QUALITY",evidenceCodes:["OPERATING_MARGIN_HISTORY"],minimumPeriods:8,required:true},{signalCode:"PHARMA_ROCE_HISTORY",dimensionCode:"CAPITAL_EFFICIENCY",evidenceCodes:["ROCE_OR_ROIC"],minimumPeriods:3,required:true},{signalCode:"PHARMA_REVENUE_GROWTH_HISTORY",dimensionCode:"GROWTH",evidenceCodes:["REVENUE_GROWTH_MULTI_PERIOD"],minimumPeriods:3,required:true},{signalCode:"PHARMA_PAT_EPS_HISTORY",dimensionCode:"GROWTH",evidenceCodes:["NET_PROFIT_GROWTH_MULTI_PERIOD","EPS_GROWTH_MULTI_PERIOD"],minimumPeriods:3,required:true},{signalCode:"PHARMA_CASH_CONVERSION_HISTORY",dimensionCode:"CASH_FLOW",evidenceCodes:["CFO_OR_FCF_CONVERSION","CAPEX"],minimumPeriods:3,required:true},{signalCode:"PHARMA_BALANCE_SHEET_LEVERAGE",dimensionCode:"BALANCE_SHEET_CREDIT",evidenceCodes:["NET_CASH_OR_LEVERAGE"],minimumPeriods:3,required:true},{signalCode:"PHARMA_VALUATION_CONTEXT",dimensionCode:"VALUATION",evidenceCodes:["PE","EV_EBITDA","FCF_YIELD"],minimumPeriods:3,required:true},{signalCode:"PHARMA_MOMENTUM",dimensionCode:"MOMENTUM",evidenceCodes:["PRICE_HISTORY_252D","APPROVED_BENCHMARK_HISTORY_252D"],minimumPeriods:252,required:true},{signalCode:"PHARMA_RISK",dimensionCode:"RISK",evidenceCodes:["MARKET_DRAWDOWN","VOLATILITY_252D","REGULATORY_RISK"],minimumPeriods:252,required:true},{signalCode:"PHARMA_OWNERSHIP_GOVERNANCE",dimensionCode:"OWNERSHIP_GOVERNANCE",evidenceCodes:["OWNERSHIP_TREND_4Q","GOVERNANCE_EVENT_REVIEW"],minimumPeriods:4,required:true}]
function key(value:string){return value.trim().toUpperCase().replace(/[^A-Z0-9]+/gu,"_").replace(/^_+|_+$/gu,"")}
function words(value:string){return value.trim().toLowerCase().replace(/_/gu," ")}
function documentish(code:string){return /(BUSINESS|DURABILITY|MOAT|ORDER_BOOK|ORDER_AND|CAPACITY_(?!ADEQUACY)|CUSTOMER|CLIENT_CONCENTRATION|CLIENT_RETENTION|CUSTOMER_RETENTION|BRAND|DISTRIBUTION|FRANCHISE|SUPPLY_CHAIN|PROCUREMENT|PRODUCT_MIX|REGULATORY|REGULATION|GOVERNANCE|LITIGATION|CAPEX_PIPELINE|SUBSCRIBER|ARPU|CHURN|OCCUPANCY|ARPOB|AUM_FLOWS|COMBINED_RATIO|UNIT_ECONOMICS|RESERVES|PLANT_LOAD|PPA|RECEIVABLES|EXTERNAL_.*RATING|RATING_TREND|ENVIRONMENTAL_COMPLIANCE|FEEDSTOCK|GOLD_PRICE|INPUT_COST|COTTON_INPUT|COMMODITY_POLICY|LAND_BANK|PRE_SALES|CONTRACT_RENEWAL|SERVICE_DEPTH|NETWORK_DENSITY|DELIVERY_SCALE|DOMAIN_DEPTH|TENANCY|UPTIME|UNDERWRITING|FLEET_AGE|FUEL_COMPETITION|TECHNOLOGY_PERMITS|REGIONAL_DIVERSIFICATION|CAPITAL_ACCESS|CAPITAL_ALLOCATION|HOLDCO|SUBSIDIARY_QUALITY)/u.test(code)}
function marketish(code:string){return /(PRICE_HISTORY|MARKET_DRAWDOWN|MAX_DRAWDOWN|CYCLE_DRAWDOWN|VOLATILITY|MOMENTUM|TOTAL_RETURN|RELATIVE_STRENGTH)/u.test(code)}
function benchmarkish(code:string){return /(APPROVED_BENCHMARK|BENCHMARK_HISTORY|BENCHMARK_RELATIVE)/u.test(code)}
function ownershipish(code:string){return /(OWNERSHIP|PROMOTER|FII|DII|INSTITUTIONAL|SHAREHOLDING)/u.test(code)}
function derivedish(code:string){return /(CONVERSION|CAGR|SPREAD|RECOVERY|TREND|RELATIVE|CONTEXT|NORMALIZED)/u.test(code)}
function parameterHintsFor(code:string):readonly string[]{
 const direct=PARAMETER_HINTS[code];if(direct?.length)return direct
 if(/GROSS_NPA|GNPA/u.test(code))return PARAMETER_HINTS.GROSS_NPA_PERCENT
 if(/NET_NPA|NNPA/u.test(code))return PARAMETER_HINTS.NET_NPA_PERCENT
 if(/NIM|NET_INTEREST_MARGIN/u.test(code))return PARAMETER_HINTS.NIM
 if(/CAPITAL_ADEQUACY|CET1/u.test(code))return PARAMETER_HINTS.CAPITAL_ADEQUACY
 if(/^ROA|_ROA|ROA_/u.test(code))return PARAMETER_HINTS.ROA
 if(/^ROE|_ROE|ROE_/u.test(code))return ["ROE Ann. %","ROE Ann. 1Y Ago %","ROE Ann. 2Y Ago %","ROE Ann. 3Y Ago %"]
 if(/ROCE|ROIC|CAPITAL_EFFICIENCY/u.test(code))return PARAMETER_HINTS.ROCE_OR_ROIC
 if(/OPERATING_MARGIN|GROSS_.*MARGIN|EBITDA.*MARGIN|MARGIN_HISTORY|MARGIN_QUALITY|UNIT_LEVEL_MARGIN/u.test(code))return PARAMETER_HINTS.OPERATING_MARGIN_HISTORY
 if(/ADVANCES.*GROWTH/u.test(code))return PARAMETER_HINTS.ADVANCES_GROWTH_YOY
 if(/DEPOSITS.*GROWTH/u.test(code))return PARAMETER_HINTS.DEPOSITS_GROWTH_YOY
 if(/EPS.*GROWTH/u.test(code))return PARAMETER_HINTS.EPS_GROWTH_MULTI_PERIOD
 if(/NET_PROFIT|PAT_|EARNINGS_GROWTH/u.test(code))return PARAMETER_HINTS.NET_PROFIT_GROWTH_MULTI_PERIOD
 if(/REVENUE|SALES|AUM.*GROWTH|VOLUME.*GROWTH|THROUGHPUT.*GROWTH|NETWORK_GROWTH|BOOKING_GROWTH|CLIENT_GROWTH|PREMIUM.*GROWTH/u.test(code))return PARAMETER_HINTS.REVENUE_GROWTH_MULTI_PERIOD
 if(/CFO|FCF|CASH_FLOW|CASH_CONVERSION|WORKING_CAPITAL|CASH_BURN/u.test(code))return ["Operating Cash Flow YoY Growth %","Operating Cash Flow 3Y Growth %","Cash Flow from Operations","Free Cash Flow","Working Capital Days","Inventory Days"]
 if(/NET_CASH|NET_DEBT|LEVERAGE|INTEREST_COVERAGE|TOTAL_DEBT|FUNDING_RUNWAY|DEBT_TO_EQUITY/u.test(code))return PARAMETER_HINTS.NET_CASH_OR_LEVERAGE
 if(/EV_EBITDA/u.test(code))return PARAMETER_HINTS.EV_EBITDA
 if(/FCF_YIELD/u.test(code))return PARAMETER_HINTS.FCF_YIELD
 if(/PBV|PRICE_TO_BOOK|PB_|_PB|NAV_DISCOUNT/u.test(code))return PARAMETER_HINTS.PBV
 if(/PE_|_PE|^PE$|VALUATION/u.test(code))return [...PARAMETER_HINTS.PE,...PARAMETER_HINTS.EV_EBITDA,...PARAMETER_HINTS.PBV,...PARAMETER_HINTS.FCF_YIELD]
 if(/DIVIDEND_YIELD/u.test(code))return ["Dividend yield 1yr %","Dividend Yield %"]
 if(/ASSET_QUALITY/u.test(code))return [...PARAMETER_HINTS.GROSS_NPA_PERCENT,...PARAMETER_HINTS.NET_NPA_PERCENT]
 return [words(code)]
}
export function planEvidenceRequirement(raw:string,minimumPeriods=1):EvidenceRequirementPlan{const evidenceCode=key(raw);if(benchmarkish(evidenceCode))return {evidenceCode,channels:["ANGEL_ONE_BENCHMARK_HISTORY","LOCAL_DERIVATION"],parameterHints:[],documentKeywords:[],minimumPeriods:Math.max(252,minimumPeriods),deterministicCoverageRule:"BENCHMARK_HISTORY"};if(marketish(evidenceCode))return {evidenceCode,channels:["ANGEL_ONE_STOCK_HISTORY","LOCAL_DERIVATION"],parameterHints:[],documentKeywords:[],minimumPeriods:Math.max(252,minimumPeriods),deterministicCoverageRule:"MARKET_HISTORY"};if(evidenceCode==="OWNERSHIP_TREND_4Q"||ownershipish(evidenceCode))return {evidenceCode,channels:["TRENDLYNE_OWNERSHIP"],parameterHints:[],documentKeywords:[],minimumPeriods:Math.max(4,minimumPeriods),deterministicCoverageRule:"OWNERSHIP_4Q"};if(documentish(evidenceCode))return {evidenceCode,channels:["TRENDLYNE_DOCUMENTS"],parameterHints:PARAMETER_HINTS[evidenceCode]??[],documentKeywords:DOCUMENT_KEYWORDS[evidenceCode]??words(evidenceCode).split(/\s+/u).filter(token=>token.length>=5),minimumPeriods:minimumPeriods===252?(V14_DOCUMENT_IDENTITY_MINIMA[evidenceCode]??minimumPeriods):minimumPeriods,signalLookbackPeriods:minimumPeriods,minimumUnit:"DOCUMENT_IDENTITIES",deterministicCoverageRule:"TEXT_EVIDENCE_REVIEW"};const hints=parameterHintsFor(evidenceCode);return {evidenceCode,channels:["TRENDLYNE_PARAMETERS",...(derivedish(evidenceCode)?["LOCAL_DERIVATION" as const]:[])],parameterHints:hints,documentKeywords:[],minimumPeriods,deterministicCoverageRule:derivedish(evidenceCode)?"LOCAL_DERIVATION":"NUMERIC_SERIES"}}
export function buildProfileEvidencePlan(profile:Ic1ProfileEvidenceContract){const signals=profile.signalRequirements.length?profile.signalRequirements:profile.profileCode==="PHARMA"?PHARMA_FALLBACK_SIGNALS:[];if(!signals.length)throw new Error("P7_IC_PROFILE_SIGNAL_REQUIREMENTS_MISSING");const requirements=signals.flatMap(signal=>(signal.evidenceCodes?.length?signal.evidenceCodes:[signal.signalCode]).map(evidenceCode=>({signalCode:signal.signalCode,dimensionCode:signal.dimensionCode??null,required:signal.required!==false,...planEvidenceRequirement(evidenceCode,signal.minimumPeriods??1)}))),parameterHints=[...new Set(requirements.flatMap(item=>item.parameterHints))],documentKeywords=[...new Set(requirements.flatMap(item=>item.documentKeywords))];return {version:P7_IC_EVIDENCE_NORMALIZATION_VERSION,profileCode:profile.profileCode,requirements,providerPlan:{structuredParameterCalls:parameterHints.length?1:0,ownershipCalls:requirements.some(item=>item.channels.includes("TRENDLYNE_OWNERSHIP"))?1:0,documentCalls:requirements.some(item=>item.channels.includes("TRENDLYNE_DOCUMENTS"))?1:0,stockHistoryCalls:requirements.some(item=>item.channels.includes("ANGEL_ONE_STOCK_HISTORY"))?1:0,benchmarkHistoryShared:requirements.some(item=>item.channels.includes("ANGEL_ONE_BENCHMARK_HISTORY")),parameterHints,documentKeywords}}}
export function buildProfileAwareTrendlyneQueries(input:{readonly companyName:string;readonly symbol:string;readonly providerInstrumentId:string;readonly profile:Ic1ProfileEvidenceContract}){const plan=buildProfileEvidencePlan(input.profile),identity=input.companyName+" "+input.symbol+" instrument "+input.providerInstrumentId;return {detailedQuery:(identity+" latest and historical "+plan.providerPlan.parameterHints.join(", ")).trim(),documentQuery:(identity+" annual report quarterly result investor presentation earnings call "+plan.providerPlan.documentKeywords.join(" ")).trim(),plan}}
export function unwrapTrendlyneMarkdown(providerResult:string){let parsed:unknown;try{parsed=JSON.parse(providerResult)}catch{throw new Error("PROVIDER_RESULT_JSON_INVALID")}if(!parsed||typeof parsed!=="object"||typeof (parsed as {markdown_data?:unknown}).markdown_data!=="string")throw new Error("PROVIDER_MARKDOWN_MISSING");let markdown=(parsed as {markdown_data:string}).markdown_data.trim();if(markdown.startsWith('"')&&markdown.endsWith('"'))markdown=markdown.slice(1,-1);return markdown.replace(/\\n/gu,"\n")}
export function parseTrendlyneParameterSections(providerResult:string,expectedSymbol:string,expectedInstrumentId:string){const lines=unwrapTrendlyneMarkdown(providerResult).split(/\r?\n/u).map(line=>line.trim()),identityRows=lines.filter(line=>line.includes("|")).slice(0,20),expected=identityRows.some(line=>{const fields=line.split("|").map(x=>x.trim());return fields[0]===expectedInstrumentId&&fields[2]?.toUpperCase()===expectedSymbol.toUpperCase()});if(!expected)throw new Error("PROVIDER_PRIMARY_ENTITY_MISMATCH");const result:Array<{label:string;numericValue:number}>=[],valueRow=/^[^:]+:(?:-?[\d,]+(?:\.\d+)?|None)$/u;for(let i=0;i<lines.length;i++){const label=lines[i];if(!label||label==="---"||label.includes("|")||valueRow.test(label))continue;let matched:string|null=null;for(let j=i+1;j<lines.length;j++){const line=lines[j];if(line==="---")break;if(line.includes("|"))break;if(line.startsWith(expectedSymbol+":")){if(matched!==null){matched=null;break}matched=line.slice(expectedSymbol.length+1).trim()}}if(!matched||matched==="None")continue;const numericValue=Number(matched.replace(/,/gu,""));if(Number.isFinite(numericValue))result.push({label,numericValue})}return result}
function normalizeLabel(value:string){return value.toUpperCase().replace(/[^A-Z0-9]+/gu," ").trim().replace(/\s+/gu," ")}
function labelMatches(label:string,hint:string){const a=normalizeLabel(label),b=normalizeLabel(hint);return a===b||a.includes(b)||b.includes(a)}
/** Old cached AVAILABLE labels cannot establish dated history either. Preserve their payload for review. */
export function guardedNumericEvidenceState(state:string,value:unknown,minimumPeriods:number):string {
 if(state!=="AVAILABLE"||minimumPeriods<=1||!value||typeof value!=="object")return state
 const retained=value as {readonly matchedSections?:unknown}
 return Array.isArray(retained.matchedSections)?"EVIDENCE_PRESENT_REVIEW_REQUIRED":state
}
export function normalizeNumericEvidence(input:{readonly providerResult:string;readonly expectedSymbol:string;readonly expectedInstrumentId:string;readonly requirements:readonly EvidenceRequirementPlan[]}) {
 const sections=parseTrendlyneParameterSections(input.providerResult,input.expectedSymbol,input.expectedInstrumentId)
 return input.requirements.filter(req=>req.channels.includes("TRENDLYNE_PARAMETERS")).map(req=>{
  const matches=sections.filter(section=>req.parameterHints.some(h=>labelMatches(section.label,h)))
  // Parameter labels (growth horizons, alternate metrics, or relative "years ago")
  // are not distinct, dated reporting periods. Retain observations for review;
  // never let a label count satisfy the approved multi-period history minimum.
  const historyUnproven=matches.length>0&&req.minimumPeriods>1
  return {
   evidenceCode:req.evidenceCode,
   state:guardedNumericEvidenceState(matches.length?"AVAILABLE":"MISSING",{matchedSections:matches},req.minimumPeriods),
   minimumPeriods:req.minimumPeriods,
   matchedSections:matches,
   ...(historyUnproven?{reasonCode:"DATED_REPORTING_PERIODS_NOT_PROVEN",deterministicScoreReady:false}:{}),
  }
 })
}
export function normalizeDocumentEvidence(input:{readonly providerResult:string;readonly expectedSymbol:string;readonly expectedInstrumentId:string;readonly requirements:readonly EvidenceRequirementPlan[]}){const markdown=unwrapTrendlyneMarkdown(input.providerResult),identityRows=markdown.split(/\r?\n/u).map(line=>line.trim()).filter(line=>line.includes("|")).slice(0,100),expected=identityRows.some(line=>{const fields=line.split("|").map(x=>x.trim());return fields.length>=4&&fields[2]?.toUpperCase()===input.expectedSymbol.toUpperCase()&&(fields[3]===input.expectedInstrumentId||fields[0]===input.expectedInstrumentId)});if(!expected)throw new Error("PROVIDER_PRIMARY_ENTITY_MISMATCH");const flat=markdown.replace(/\s+/gu," ");return input.requirements.filter(req=>req.channels.includes("TRENDLYNE_DOCUMENTS")).map(req=>{const hits=req.documentKeywords.filter(keyword=>flat.toLowerCase().includes(keyword.toLowerCase()));return {evidenceCode:req.evidenceCode,state:hits.length?"EVIDENCE_PRESENT_REVIEW_REQUIRED":"MISSING",matchedKeywords:hits,deterministicScoreReady:false}})}
export const V14_OWNERSHIP_METHOD_VERSION="V1_4_OWNERSHIP_METHOD_SELECTION_V1" as const
export type V14OwnershipRequirement="OWNERSHIP_TREND_4Q"|"INSTITUTIONAL_OWNERSHIP_TREND_4Q"|"OWNERSHIP_GOVERNANCE"
export interface V14OwnershipValidation{
 readonly contractVersion:typeof V14_OWNERSHIP_METHOD_VERSION
 readonly status:"REVIEW_REQUIRED"
 readonly reason:"OWNERSHIP_SOURCE_SEMANTICS_NOT_PROVEN"|"OWNERSHIP_GOVERNANCE_DOCUMENT_REVIEW_REQUIRED"|"OWNERSHIP_QUARTERS_INVALID"|"OWNERSHIP_SERIES_MISSING"
 readonly series:"Promoter"|"Institutional"|null
 readonly observedQuarters:readonly string[]
 readonly eligibleForCanonicalPersistence:false
}
/** Provider chart values cannot establish percentage denominator or a factual governance review.
 * This validator applies the owner-selected series and quarter constraints, and deliberately
 * refuses automatic FRESH/READY until the established reviewed-evidence authority proves source semantics.
 */
export function validateV14SelectedOwnership(input:{
 readonly requirementCode:V14OwnershipRequirement
 readonly history:ReturnType<typeof parseTrendlyneOwnershipHistory>
}):V14OwnershipValidation{
 const base={contractVersion:V14_OWNERSHIP_METHOD_VERSION,status:"REVIEW_REQUIRED" as const,eligibleForCanonicalPersistence:false as const}
 if(input.requirementCode==="OWNERSHIP_GOVERNANCE")return {...base,series:null,observedQuarters:[],reason:"OWNERSHIP_GOVERNANCE_DOCUMENT_REVIEW_REQUIRED" as const}
 const series=input.requirementCode==="OWNERSHIP_TREND_4Q"?"Promoter" as const:"Institutional" as const
 const entries=input.history.series[series]??[]
 const quarters=entries.map(x=>x.quarter)
 if(entries.length<4)return {...base,series,observedQuarters:quarters,reason:"OWNERSHIP_SERIES_MISSING" as const}
 const months:Readonly<Record<string,number>>={Mar:0,Jun:1,Sep:2,Dec:3}
 const periodKeys=quarters.map(q=>{const match=/^(Mar|Jun|Sep|Dec) (\d{4})$/u.exec(q);return match?Number(match[2])*4+months[match[1]]!:NaN})
 const valid=periodKeys.every(Number.isFinite)&&new Set(periodKeys).size===periodKeys.length&&
  [...periodKeys].sort((a,b)=>a-b).slice(-4).every((n,i,arr)=>i===0||n===arr[i-1]+1)&&
  entries.every(x=>Number.isFinite(x.value)&&x.value>=0&&x.value<=100)
 if(!valid)return {...base,series,observedQuarters:quarters,reason:"OWNERSHIP_QUARTERS_INVALID" as const}
 return {...base,series,observedQuarters:quarters,reason:"OWNERSHIP_SOURCE_SEMANTICS_NOT_PROVEN" as const}
}
export function parseTrendlyneOwnershipHistory(providerResult:string){
 const sections=["Promoter","Institutional","FII","MF","DII","Public"] as const
 const result:Record<string,Array<{quarter:string;value:number;exactValue:string}>>={}
 for(const section of sections){
  const match=providerResult.match(new RegExp(section+":\\s*\\n([\\s\\S]*?)(?=\\n\\s{2}[A-Z][A-Za-z]+:|\\ninsights:|$)","u"))
  if(!match)continue
  const values=[...match[1].matchAll(/\[\\?"([A-Z][a-z]{2} \d{4})\\?",\s*(-?\d+(?:\.\d+)?)/gu)].map(item=>({quarter:item[1],value:Number(item[2]),exactValue:item[2]}))
  if(values.length)result[section]=values
 }
 // AVAILABLE means chart capture exists; it is NOT approved percentage semantics or READY.
 const availableSeries=Object.values(result).filter(series=>series.length>=4).length
 return {series:result,state:availableSeries?"AVAILABLE":"INSUFFICIENT_PERIODS",minimumQuarterSeries:4,semanticBasisVerified:false}
}
