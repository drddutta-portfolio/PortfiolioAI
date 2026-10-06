export type CaptureFormat="ZIP"|"JSON"|"NIFTY_TRI_JSON"
export type CaptureValidation={ok:true;reason:"CAPTURE_SEMANTICALLY_VALID";details:Record<string,unknown>}|{ok:false;reason:string;details:Record<string,unknown>}
const text=(v:unknown)=>typeof v==="string"?v.trim():null
const num=(v:unknown)=>{const n=typeof v==="number"?v:Number(String(v??"").replace(/,/gu,""));return Number.isFinite(n)?n:null}
const iso=(v:unknown)=>{
 const s=text(v);if(!s)return null
 const m=/^(\d{2})[- ]([A-Za-z]{3})[- ](\d{4})$/u.exec(s)
 const months:Record<string,string>={jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12"}
 const month=m?months[m[2]!.toLowerCase()]:null
 const raw=m?(month?m[3]+"-"+month+"-"+m[1]:null):s.slice(0,10)
 if(!raw||!/^\d{4}-\d{2}-\d{2}$/u.test(raw))return null
 const instant=Date.parse(raw+"T00:00:00Z")
 return Number.isFinite(instant)&&new Date(instant).toISOString().slice(0,10)===raw?raw:null
}
function looksLikeHtmlError(body:string){const x=body.slice(0,200000).toLowerCase();return /<html|<!doctype html/u.test(x)&&(/<title[^>]*>\s*error\b/u.test(x)||/\berror\s*(4\d\d|5\d\d)\b/u.test(x)||/access denied|login|sign in|captcha|challenge/u.test(x))}
export function validateCapturedResponse(input:{status:number;contentType:string|null;bodyText?:string|null;format:CaptureFormat;expectedIndex?:string;requestedFrom?:string;requestedTo?:string;requiredDates?:readonly string[]}):CaptureValidation{
 const ct=(input.contentType??"").toLowerCase(),body=input.bodyText??""
 if(input.status<200||input.status>=300)return{ok:false,reason:"HTTP_STATUS_NOT_SUCCESS",details:{status:input.status}}
 if(looksLikeHtmlError(body))return{ok:false,reason:"HTML_ERROR_OR_CHALLENGE_PAGE",details:{contentType:input.contentType}}
 if(input.format==="ZIP"){if(!/(application\/zip|application\/octet-stream)/u.test(ct))return{ok:false,reason:"ZIP_CONTENT_TYPE_MISMATCH",details:{contentType:input.contentType}};return{ok:true,reason:"CAPTURE_SEMANTICALLY_VALID",details:{format:"ZIP"}}}
 if(!/(application\/json|text\/json|application\/javascript)/u.test(ct))return{ok:false,reason:"JSON_CONTENT_TYPE_MISMATCH",details:{contentType:input.contentType}}
 let parsed:unknown;try{parsed=JSON.parse(body)}catch{return{ok:false,reason:"JSON_PARSE_FAILED",details:{}}}
 if(input.format==="JSON")return{ok:true,reason:"CAPTURE_SEMANTICALLY_VALID",details:{format:"JSON"}}
 let rows:unknown=parsed;if(!Array.isArray(rows)&&parsed&&typeof parsed==="object"){const d=(parsed as Record<string,unknown>).d;if(typeof d==="string"){try{rows=JSON.parse(d)}catch{return{ok:false,reason:"TRI_WRAPPED_JSON_PARSE_FAILED",details:{}}}}else if(Array.isArray(d))rows=d}
 if(!Array.isArray(rows)||rows.length===0)return{ok:false,reason:"TRI_ROW_ARRAY_MISSING",details:{}}
 const dates:string[]=[],values:number[]=[];for(const raw of rows){if(!raw||typeof raw!=="object")return{ok:false,reason:"TRI_ROW_INVALID",details:{}};const row=raw as Record<string,unknown>;const index=text(row["Index Name"]??row.INDEX_NAME??row.IndexName);if(!index||index.toUpperCase()!==(input.expectedIndex??"").toUpperCase())return{ok:false,reason:"TRI_INDEX_IDENTITY_MISMATCH",details:{index}};const date=iso(row.Date??row.DATE??row.HistoricalDate);if(!date)return{ok:false,reason:"TRI_DATE_INVALID",details:{}};const tri=num(row.TotalReturnsIndex??row["Total Returns Index"]??row.TRI);if(tri===null||tri<=0)return{ok:false,reason:"TRI_VALUE_INVALID",details:{date}};dates.push(date);values.push(tri)}
 if(new Set(dates).size!==dates.length)return{ok:false,reason:"TRI_DUPLICATE_SESSION",details:{}}
 const sorted=[...dates].sort(),from=input.requestedFrom,to=input.requestedTo;if((from&&sorted.some(d=>d<from))||(to&&sorted.some(d=>d>to)))return{ok:false,reason:"TRI_DATE_OUTSIDE_REQUEST",details:{first:sorted[0],last:sorted.at(-1)}}
 for(const d of input.requiredDates??[])if(!dates.includes(d))return{ok:false,reason:"TRI_REQUIRED_SESSION_MISSING",details:{missing:d,dates:sorted}}
 return{ok:true,reason:"CAPTURE_SEMANTICALLY_VALID",details:{index:input.expectedIndex,dates:sorted,rows:rows.length,minValue:Math.min(...values),maxValue:Math.max(...values)}}
}
export type BhavcopyCandidate={symbol:string;isin:string;series:string;tradeDate:string;close:string}
export function validateBhavcopyRows(input:{headers:readonly string[];rows:readonly Record<string,string>[];expectedDate:string;canonical?:ReadonlyMap<string,{isin:string}>}){
 const required=["TradDt","BizDt","ISIN","TckrSymb","SctySrs","ClsPric"];const missing=required.filter(k=>!input.headers.includes(k));if(missing.length)return{state:"REVIEW_REQUIRED" as const,reason:"BHAVCOPY_SCHEMA_MISSING",missing,candidates:[] as BhavcopyCandidate[],exclusions:[] as Record<string,unknown>[]}
 const candidates:BhavcopyCandidate[]=[],exclusions:Record<string,unknown>[]=[],seen=new Map<string,string>()
 for(const row of input.rows){if(row.TradDt!==input.expectedDate||row.BizDt!==input.expectedDate){exclusions.push({symbol:row.TckrSymb,reason:"TRADE_DATE_MISMATCH",tradeDate:row.TradDt,bizDate:row.BizDt});continue}if(row.SctySrs!=="EQ")continue;if(!/^-?\d+(?:\.\d+)?$/u.test(row.ClsPric)||Number(row.ClsPric)<=0){exclusions.push({symbol:row.TckrSymb,reason:"CLOSE_INVALID"});continue}const canonical=input.canonical?.get(row.TckrSymb);if(canonical&&canonical.isin!==row.ISIN){exclusions.push({symbol:row.TckrSymb,reason:"CANONICAL_ISIN_MISMATCH",sourceIsin:row.ISIN,canonicalIsin:canonical.isin});continue}const key=[row.TckrSymb,row.ISIN,row.SctySrs,row.TradDt].join("|"),prior=seen.get(key);if(prior!==undefined&&prior!==row.ClsPric){exclusions.push({symbol:row.TckrSymb,reason:"DUPLICATE_CONFLICT",first:prior,second:row.ClsPric});continue}seen.set(key,row.ClsPric);candidates.push({symbol:row.TckrSymb,isin:row.ISIN,series:row.SctySrs,tradeDate:row.TradDt,close:row.ClsPric})}
 return{state:exclusions.some(x=>x.reason==="DUPLICATE_CONFLICT")?"CONFLICTING" as const:"FRESH" as const,reason:"BHAVCOPY_CANDIDATES_NORMALIZED",candidates,exclusions}
}