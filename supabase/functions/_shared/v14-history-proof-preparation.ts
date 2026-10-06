
export type CalendarEvidenceInput={
  sourceRecordIds:readonly string[]
  coverageKind:"COMPLETE_OFFICIAL_EXCHANGE_CALENDAR"|"OFFICIAL_SESSION_CANARIES"|"NONE"
  requiredFrom:string
  requiredTo:string
  coveredFrom:string|null
  coveredTo:string|null
}
export function evaluateExchangeCalendarEvidence(input:CalendarEvidenceInput){
  const verified=input.coverageKind==="COMPLETE_OFFICIAL_EXCHANGE_CALENDAR"
    && input.sourceRecordIds.length>0
    && input.coveredFrom!==null && input.coveredTo!==null
    && input.coveredFrom<=input.requiredFrom && input.coveredTo>=input.requiredTo
  return {
    state:verified?"VERIFIED" as const:"UNVERIFIED" as const,
    reason:verified?"COMPLETE_OFFICIAL_CALENDAR_COVERS_REQUIRED_WINDOW":"FULL_WINDOW_OFFICIAL_CALENDAR_NOT_PROVEN",
    sourceRecordIds:[...input.sourceRecordIds],
    independentOfBenchmarkIdentity:true,
    independentOfStockBenchmarkAlignment:true,
  }
}

export type CorporateActionTreatment =
 | {kind:"SPLIT";shareMultiplier:number;priceMultiplier:number;mechanical:true;formula:string}
 | {kind:"BONUS";shareMultiplier:number;priceMultiplier:number;mechanical:true;formula:string}
 | {kind:"NON_MECHANICAL";shareMultiplier:null;priceMultiplier:null;mechanical:false;formula:null}

export function corporateActionTreatment(subject:string):CorporateActionTreatment{
 const split=/From Rs\s*([0-9.]+)\/?-?\s*Per Share To (?:Rs|Re)\s*([0-9.]+)\/?-?\s*Per Share/iu.exec(subject)
 if(split){
   const oldFace=Number(split[1]),newFace=Number(split[2])
   if(oldFace>0&&newFace>0&&oldFace>newFace){
     const shares=oldFace/newFace,price=newFace/oldFace
     return{kind:"SPLIT",shareMultiplier:shares,priceMultiplier:price,mechanical:true,formula:"pre-event price × new face value / old face value; pre-event shares/volume × old face value / new face value"}
   }
 }
 const bonus=/Bonus\s+([0-9.]+)\s*:\s*([0-9.]+)/iu.exec(subject)
 if(bonus&&!/NCRPS|PREFERENCE|DEBENTURE|BOND/iu.test(subject)){
   const a=Number(bonus[1]),b=Number(bonus[2])
   if(a>0&&b>0){
     const shares=(a+b)/b,price=b/(a+b)
     return{kind:"BONUS",shareMultiplier:shares,priceMultiplier:price,mechanical:true,formula:"pre-event price × existing shares / post-bonus shares; pre-event shares/volume × post-bonus shares / existing shares"}
   }
 }
 return{kind:"NON_MECHANICAL",shareMultiplier:null,priceMultiplier:null,mechanical:false,formula:null}
}

export function evaluateStockHistoryFreshness(input:{latestSession:string|null;requiredFreshThrough:string}){
 if(!input.latestSession)return{state:"INSUFFICIENT" as const,reason:"NO_STOCK_HISTORY_SESSION"}
 return input.latestSession>=input.requiredFreshThrough
  ?{state:"FRESH" as const,reason:"STOCK_HISTORY_FRESH_THROUGH_REQUIRED_SESSION"}
  :{state:"STALE" as const,reason:"STOCK_HISTORY_LATEST_SESSION_STALE"}
}
