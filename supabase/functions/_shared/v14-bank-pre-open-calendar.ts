/** Read-only interpretation of already retained, approved NSE calendar evidence. */
export interface CalendarRecord { id:string; record_kind:string; retrieved_at:string; raw_payload:Readonly<Record<string,unknown>> }
export interface PreOpenCalendarProof { latestCompletedSession:string; sourceRecordIds:readonly string[]; verifiedAt:string; validBefore:string }
const LIVE_URL="https://www.nseindia.com/resources/exchange-communication-holidays?apiversion=v2"
const SEMANTIC_HASH="64b65c5f42f6694cc1ad30feada7272e7f5dff28226b50083f7b45accbd6c295"
export function verifiedOrdinaryCompletedSessionCalendar(records:readonly CalendarRecord[],at:string):PreOpenCalendarProof|null {
 const now=Date.parse(at);if(!Number.isFinite(now))return null
 const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23"}).formatToParts(new Date(now))
 const part=(key:Intl.DateTimeFormatPartTypes)=>parts.find(p=>p.type===key)?.value??""
 const date=`${part("year")}-${part("month")}-${part("day")}`
 // Stop before the ordinary pre-open auction; this is not an OPEN-session acquisition permission.
 if(date<"2026-01-01"||date>"2026-12-31")return null
 const available=records.filter(r=>Number.isFinite(Date.parse(r.retrieved_at))&&Date.parse(r.retrieved_at)<=now)
 const latest=(kind:string)=>{
  const candidates=available.filter(r=>r.record_kind===kind).sort((a,b)=>Date.parse(b.retrieved_at)-Date.parse(a.retrieved_at))
  if(!candidates.length)return null
  if(candidates.some(r=>r.retrieved_at===candidates[0].retrieved_at&&JSON.stringify(r.raw_payload)!==JSON.stringify(candidates[0].raw_payload)))return null
  return candidates[0]
 }
 const base=latest("V1_4_NSE_TRADING_CALENDAR_2026_BASE"),baseline=latest("V1_4_NSE_CALENDAR_APPROVED_BASELINE"),refresh=latest("V1_4_NSE_CALENDAR_REFRESH_CAPTURE")
 if(!base||!baseline||!refresh||base.id!=="d3a39583-b851-4a5a-99b6-dcc412c4ad26"||baseline.id!=="8e9e7299-7dfc-46fc-b6bd-4d04e23aedbc")return null
 if(base.raw_payload.version!=="V1_4_NSE_CM_CALENDAR_2026_BASE_V1"||base.raw_payload.segment!=="CAPITAL_MARKET"||base.raw_payload.source_url!=="https://nsearchives.nseindia.com/content/circulars/CMTR71775.pdf"||base.raw_payload.verification_horizon_end!=="2026-12-31")return null
 if(baseline.raw_payload.source_url!==LIVE_URL||baseline.raw_payload.semantic_fingerprint_sha256!==SEMANTIC_HASH||refresh.raw_payload.source_url!==LIVE_URL||refresh.raw_payload.semantic_fingerprint_sha256!==SEMANTIC_HASH||refresh.raw_payload.status_code!==200||now-Date.parse(refresh.retrieved_at)>86400000)return null
 const holidays=base.raw_payload.weekday_trading_holidays,specials=base.raw_payload.special_sessions_pending
 if(!Array.isArray(holidays)||holidays.some(d=>typeof d!=="string"||!/^2026-\d{2}-\d{2}$/.test(d))||!Array.isArray(specials))return null
 const specialDates=new Set<string>()
 for(const s of specials){if(!s||typeof s!=="object"||!("session_date" in s)||typeof s.session_date!=="string")return null;specialDates.add(s.session_date)}
 // Qualified special-session timing is deliberately not inferred by this ordinary-session path.
 if(specialDates.has(date)||holidays.includes(date)||[0,6].includes(new Date(date+"T00:00:00Z").getUTCDay()))return null
 let cursor=Date.parse(date+"T00:00:00Z")-86400000
 for(let n=0;n<10;n++,cursor-=86400000){
  const d=new Date(cursor),candidate=d.toISOString().slice(0,10)
  if(candidate<"2026-01-01"||specialDates.has(candidate))return null
  if(d.getUTCDay()===0||d.getUTCDay()===6||holidays.includes(candidate))continue
  return{latestCompletedSession:candidate,sourceRecordIds:[base.id,baseline.id,refresh.id],verifiedAt:at,validBefore:date+"T09:00:00+05:30"}
 }
 return null
}

export function verifiedPreOpenCalendar(records:readonly CalendarRecord[],at:string):PreOpenCalendarProof|null {
 const ordinary=verifiedOrdinaryCompletedSessionCalendar(records,at)
 return ordinary&&Date.parse(at)<Date.parse(ordinary.validBefore)?ordinary:null
}
