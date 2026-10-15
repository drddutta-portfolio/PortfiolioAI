import {derivePharmaOperatingMarginPercent} from '../../../src/features/research/pharmaHistoryNormalization.ts'
export {G03_FINANCIAL_POLICY} from './v14-g03-cash-components.ts'
export const G03_MARGIN_KIND='DELEGATED_G03_APPROVED_MARGIN_PAIR_REVIEW'
export const G03_MARGIN_SOURCE_KIND='G03_BEL_SOURCE_BOUND_MARGIN_PAIRS_V1'
export const G03_MARGIN_FRESH_THROUGH='2026-11-27T00:00:00+00:00'
export interface MarginComponents {
 readonly periodStart:string;readonly periodEnd:string;readonly scope:string;readonly unit:string;readonly currency:string
 readonly profitDefinition:string;readonly profit:string;readonly revenue:string
}
/** Only the already-reviewed raw profit/revenue definition is eligible. The
 * percentage has exactly one calculation owner, shared with Pharma. */
export function deriveG03Margin(c:MarginComponents){
 if(c.scope!=='CONSOLIDATED'||c.unit!=='INR_CRORE'||c.currency!=='INR'||c.profitDefinition!=='TRENDLYNE_OPERATING_PROFIT_QUARTER_R4H_RAW_HISTORY_V1'||!/^\d{4}-\d{2}-\d{2}$/.test(c.periodStart)||!/^\d{4}-\d{2}-\d{2}$/.test(c.periodEnd)||! /^-?\d+(?:\.\d+)?$/.test(c.profit)||! /^\d+(?:\.\d+)?$/.test(c.revenue))return null
 const end=new Date(c.periodEnd+'T00:00:00Z'),start=new Date(c.periodStart+'T00:00:00Z')
 if(!Number.isFinite(end.getTime())||!Number.isFinite(start.getTime())||![2,5,8,11].includes(end.getUTCMonth())||end.toISOString().slice(0,10)!==c.periodEnd||new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()+1,0)).getUTCDate()!==end.getUTCDate()||start.toISOString().slice(0,10)!==c.periodStart||start.getUTCFullYear()!==end.getUTCFullYear()||start.getUTCMonth()!==end.getUTCMonth()-2||start.getUTCDate()!==1)return null
 const marginPercent=derivePharmaOperatingMarginPercent(c.profit,c.revenue)
 return marginPercent===null?null:{marginPercent,operatingProfit:c.profit,operatingRevenue:c.revenue,calculationAuthority:'derivePharmaOperatingMarginPercent',issuerReportedPercentage:false}
}
