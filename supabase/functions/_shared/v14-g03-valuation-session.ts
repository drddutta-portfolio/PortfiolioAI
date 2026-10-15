import {Decimal} from 'decimal.js'
import {validateStockHistoryReadiness,type HistoryContractProof,type CurrentSessionDecision} from './v14-history-readiness.ts'
import type {HistoryRow} from './p7-ic-input-validation.ts'
import {G03_VALUATION_BATCH as batch} from './v14-g03-valuation-review.ts'

/** Trusted canonical storage context, never accepted from a browser request.
 * The existing market-history validator owns freshness, including its approved
 * close grace and verified CLOSED/pre-open/OPEN-session handling. */
export interface G03ValuationHistoryContext {
 readonly rows:readonly HistoryRow[]
 readonly proof:HistoryContractProof|null
 readonly currentSessionDecision:CurrentSessionDecision|null
}
export function qualifyG03ValuationCurrentSession(context:G03ValuationHistoryContext|undefined,evaluationAsOfMs:number,sourceCutoffAtMs:number){
 if(!context?.proof)return null
 const v=validateStockHistoryReadiness({rows:context.rows,proof:context.proof,currentSessionDecision:context.currentSessionDecision,minimum:252,evaluationAsOfMs,sourceCutoffAtMs,freshnessPolicy:'LATEST_COMPLETED_SESSION'})
 const dates=batch.periods.map(p=>p.valuationDate).sort()
 if(v.state!=='FRESH'||v.latestSession!==dates.at(-1)||v.returnBasis!=='PRICE_RETURN_RAW_CLOSE')return null
 const decision=context.currentSessionDecision
 const freshThrough=decision?.preOpenCalendar?.validBefore??decision?.openSessionStatus?.validBefore??(decision?.decision==='CLOSED'?decision.sessionDate+'T23:59:59+05:30':null)
 if(!freshThrough||!Number.isFinite(Date.parse(freshThrough))||Date.parse(freshThrough)<=evaluationAsOfMs)return null
 for(const b of batch.periods){
  const rows=context.rows.filter(r=>r.period_start===b.pricePeriodStart||Date.parse(r.period_start)===Date.parse(b.pricePeriodStart))
  if(rows.length!==1||rows[0].provenance?.source_record_id!==b.priceSourceId||!new Decimal(String(rows[0].close)).eq(b.components.price))return null
 }
 const financialDeadline=Math.min(...batch.periods.map(p=>Date.parse(p.components.financialTtmEnd+'T00:00:00Z')+150*86400000))
 if(evaluationAsOfMs>financialDeadline)return null
 return {version:'G03_VALUATION_EXISTING_COMPLETED_SESSION_VALIDATION_V1',latestSession:v.latestSession,freshThrough:new Date(Math.min(Date.parse(freshThrough),financialDeadline)).toISOString(),marketValidationAuthority:'validateStockHistoryReadiness',marketLineage:v.lineage,priceSourceIds:batch.periods.map(p=>p.priceSourceId),recordedDatesUnchanged:true,sourceExpiryUnchanged:true}
}
