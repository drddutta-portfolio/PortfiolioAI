import {describe,expect,it} from "vitest"
import source from "../v14-bank-maintenance-run/index.ts?raw"

describe("BANK V1-4 scheduled runner failure and duplicate contract",()=>{
 it("uses no-retry history transport and hard-caps history attempts at 14",()=>{
  expect(source).toContain("const HISTORY_LIMIT=14")
  expect(source).toContain("getDailyHistoryNoRetry")
  expect(source).toContain("BANK_MAINTENANCE_REQUEST_LIMIT")
  expect(source).toContain("p_retry_attempt:0")
 })
 it("skips an already retained target session before issuing another history request",()=>{
  expect(source).toContain('if(existing.has(sessionDate)){results.push({target:target.target,status:"SKIPPED_CURRENT"});continue}')
  expect(source.indexOf("SKIPPED_CURRENT")).toBeLessThan(source.indexOf("getDailyHistoryNoRetry"))
 })
 it("accounts failed attempted calls and settles unused reservation units",()=>{
  expect(source).toContain('p_outcome:"FAILED"')
  expect(source).toContain("p_safe_error_code:safe(error)")
  expect(source).toContain('const accounted=consumed+failed,released=Math.max(0,HISTORY_LIMIT-accounted)')
  expect(source).toContain('p_consumed_units:consumed,p_failed_units:failed,p_released_units:released')
 })
 it("persists PARTIAL only when some targets were ingested and others failed",()=>{
  expect(source).toContain('status:failures===0?"SUCCEEDED":ingested>0?"PARTIAL":"FAILED"')
  expect(source).toContain("failed_count:failures")
  expect(source).toContain("accepted_count:ingested")
 })
 it("does not silently overwrite a retained session and requires explicit overlap review",()=>{
  expect(source).toContain("BANK_MAINTENANCE_OVERLAP_REQUIRES_REVIEW")
  expect(source).toContain("BANK_MAINTENANCE_INSERT_FAILED_RAW_RETAINED")
 })
})
