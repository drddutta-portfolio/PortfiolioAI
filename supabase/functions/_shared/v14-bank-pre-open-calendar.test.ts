import {describe,it,expect} from "vitest"
import {verifiedPreOpenCalendar,type CalendarRecord} from "./v14-bank-pre-open-calendar.ts"
const records:CalendarRecord[]=[
 {
  "id": "d3a39583-b851-4a5a-99b6-dcc412c4ad26",
  "record_kind": "V1_4_NSE_TRADING_CALENDAR_2026_BASE",
  "retrieved_at": "2026-10-10 10:58:27.416946+00",
  "raw_payload": {
   "segment": "CAPITAL_MARKET",
   "version": "V1_4_NSE_CM_CALENDAR_2026_BASE_V1",
   "source_url": "https://nsearchives.nseindia.com/content/circulars/CMTR71775.pdf",
   "published_date": "2025-12-12",
   "fail_closed_rule": "UNKNOWN_OR_CONTRADICTORY_DATES_DO_NOT_DISPATCH",
   "weekend_holidays": [
    "2026-02-15",
    "2026-03-21",
    "2026-08-15",
    "2026-11-08"
   ],
   "circular_reference": "172/2025",
   "download_reference": "NSE/CMTR/71775",
   "special_sessions_pending": [
    {
     "event": "Muhurat Trading",
     "timings": "PENDING_SEPARATE_OFFICIAL_CIRCULAR",
     "session_date": "2026-11-08"
    }
   ],
   "verification_horizon_end": "2026-12-31",
   "weekday_trading_holidays": [
    "2026-01-26",
    "2026-03-03",
    "2026-03-26",
    "2026-03-31",
    "2026-04-03",
    "2026-04-14",
    "2026-05-01",
    "2026-05-28",
    "2026-06-26",
    "2026-09-14",
    "2026-10-02",
    "2026-10-20",
    "2026-11-10",
    "2026-11-24",
    "2026-12-25"
   ]
  }
 },
 {
  "id": "8e9e7299-7dfc-46fc-b6bd-4d04e23aedbc",
  "record_kind": "V1_4_NSE_CALENDAR_APPROVED_BASELINE",
  "retrieved_at": "2026-10-10 12:13:07.640416+00",
  "raw_payload": {
   "version": "V1_4_NSE_CALENDAR_APPROVED_BASELINE_V2",
   "source_url": "https://www.nseindia.com/resources/exchange-communication-holidays?apiversion=v2",
   "approval_basis": "Exact-head bff5c565 verified by Architecture Guard and Banking V1-4 Full Verification; raw HTML remains audit telemetry, semantic calendar fingerprint controls blocking change detection",
   "content_sha256": "82f5df767bb277c7c56837278d4d2d5a6970b24b511a18b8734a46631ff4e9fa",
   "semantic_scope": "NSE live holiday-page special-session note between <p>Note: and <p>The holidays falling",
   "special_session_anchor": "November 08, 2026 / Muhurat Trading",
   "verification_horizon_end": "2026-12-31",
   "semantic_fingerprint_sha256": "64b65c5f42f6694cc1ad30feada7272e7f5dff28226b50083f7b45accbd6c295"
  }
 },
 {
  "id": "b25bc0db-8a4c-4f85-934b-6301fd18ae8a",
  "record_kind": "V1_4_NSE_CALENDAR_REFRESH_CAPTURE",
  "retrieved_at": "2026-10-11 13:30:00.063148+00",
  "raw_payload": {
   "version": "V1_4_NSE_CALENDAR_REFRESH_CAPTURE_V2",
   "request_id": 600,
   "source_url": "https://www.nseindia.com/resources/exchange-communication-holidays?apiversion=v2",
   "status_code": 200,
   "session_date": "2026-10-11",
   "content_sha256": "e7144ca5359f9b32b0fccc51911606e1d16e0da7e85b56e924512b5cf3c28d5d",
   "special_note_anchor": "November 08, 2026 / Muhurat Trading",
   "raw_byte_change_detected": true,
   "semantic_fingerprint_sha256": "64b65c5f42f6694cc1ad30feada7272e7f5dff28226b50083f7b45accbd6c295"
  }
 }
]
const at="2026-10-11T18:52:00Z"
describe("retained NSE calendar proof before ordinary pre-open",()=>{
 it("identifies Friday as Monday midnight's latest completed session without inventing Monday's execution",()=>{
  expect(verifiedPreOpenCalendar(records,at)).toMatchObject({latestCompletedSession:"2026-10-09",validBefore:"2026-10-12T09:00:00+05:30"})
 })
 it("expires at the pre-open boundary and never uses future or over-age refreshes",()=>{
  expect(verifiedPreOpenCalendar(records,"2026-10-12T03:30:00Z")).toBeNull()
  expect(verifiedPreOpenCalendar(records,"2026-10-11T12:00:00Z")).toBeNull()
  expect(verifiedPreOpenCalendar(records,"2026-10-13T00:00:00Z")).toBeNull()
 })
 it("blocks missing, changed or ambiguous official calendar authority",()=>{
  expect(verifiedPreOpenCalendar(records.slice(1),at)).toBeNull()
  const changed=structuredClone(records);changed[2].raw_payload={...changed[2].raw_payload,semantic_fingerprint_sha256:"changed"}
  expect(verifiedPreOpenCalendar(changed,at)).toBeNull()
  expect(verifiedPreOpenCalendar([...records,{...changed[2],id:"conflict"}],at)).toBeNull()
 })
 it("does not infer pending special sessions or extend the approved annual horizon",()=>{
  const special=structuredClone(records);special[0].raw_payload={...special[0].raw_payload,special_sessions_pending:[{session_date:"2026-10-12"}]}
  expect(verifiedPreOpenCalendar(special,at)).toBeNull()
  expect(verifiedPreOpenCalendar(records,"2027-01-01T00:00:00Z")).toBeNull()
 })
})
