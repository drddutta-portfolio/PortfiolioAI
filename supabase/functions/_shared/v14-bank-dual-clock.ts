/** BANK M1-M4 owner-approved dual-clock expiry, Development only.
 * Calendar-day ceilings apply to financial period end and independently
 * VERIFIED original-source bytes. A new download never resets period age.
 */
export const BANK_DUAL_CLOCK_POLICY="BANK_DIRECT_150D_550D_DUAL_CLOCK_V1";
export const BANK_DIRECT_CEILINGS:Readonly<Record<string,number>>={
 NIM_TTM:150,CET1_RATIO:150,CAPITAL_ADEQUACY_RATIO:150,ROA_ANNUAL:550,
};
export const BANK_FINANCIAL_DIRECT_CODES=Object.freeze(Object.keys(BANK_DIRECT_CEILINGS));
const DAY=86400000;
function dateEnd(date:string):number{
 const n=Date.parse(date+"T00:00:00.000Z");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(n)||new Date(n).toISOString().slice(0,10)!==date) return NaN;
 return n+DAY-1;
}
/** Closing instant of the Nth calendar day after the reported period end. */
export function bankReportingDeadline(periodEnd:string,days:number):number{
 const n=dateEnd(periodEnd);
 return Number.isFinite(n)&&Number.isInteger(days)&&days>0?n+days*DAY:NaN;
}
/** Verification ceiling uses success from original bytes re-hashed from
 * approved durable storage, never an ordinary transport retrieval time. */
export function bankVerificationDeadline(verifiedAt:string,days:number):number{
 const n=Date.parse(verifiedAt);
 return Number.isFinite(n)&&Number.isInteger(days)&&days>0?n+days*DAY:NaN;
}
export function bankDualClockExpiry(input:{
 code:string;periodEnd:string;lastVerifiedOriginalBytesAt:string;
 publishedAt:string;retrievedAt:string;cutoffAtMs:number;
 disqualifyingEventAt?:string|null;
}):{ok:boolean;expiryMs:number;reason:string}{
 const days=BANK_DIRECT_CEILINGS[input.code];
 if(!days) return {ok:false,expiryMs:NaN,reason:"BANK_DUAL_CLOCK_CODE_NOT_APPROVED"};
 const period=bankReportingDeadline(input.periodEnd,days);
 const verified=bankVerificationDeadline(input.lastVerifiedOriginalBytesAt,days);
 const publish=Date.parse(input.publishedAt),retrieve=Date.parse(input.retrievedAt),proof=Date.parse(input.lastVerifiedOriginalBytesAt);
 if(![period,verified,publish,retrieve,proof,input.cutoffAtMs].every(Number.isFinite))
  return {ok:false,expiryMs:NaN,reason:"BANK_DUAL_CLOCK_PROVENANCE_INCOMPLETE"};
 if(publish<Date.parse(input.periodEnd+"T00:00:00Z")||publish>input.cutoffAtMs||retrieve>input.cutoffAtMs||proof>input.cutoffAtMs)
  return {ok:false,expiryMs:NaN,reason:"BANK_DUAL_CLOCK_SOURCE_CUTOFF_INVALID"};
 const adverse=input.disqualifyingEventAt?Date.parse(input.disqualifyingEventAt):Infinity;
 if(input.disqualifyingEventAt&&!Number.isFinite(adverse))
  return {ok:false,expiryMs:NaN,reason:"BANK_DUAL_CLOCK_EVENT_INVALID"};
 const expiryMs=Math.min(period,verified,adverse);
 return {ok:true,expiryMs,reason:expiryMs<input.cutoffAtMs?"BANK_DUAL_CLOCK_EXPIRED":"BANK_DUAL_CLOCK_BOUNDED"};
}
