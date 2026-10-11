import { describe, expect, it } from "vitest"
import { bankMaintenanceExecutionWindow } from "./v14-bank-maintenance-time.ts"
describe("approved banking maintenance dispatch time", () => {
 it("rejects an OPEN-date request before 19:00 IST, including the midnight regression", () => {
  expect(bankMaintenanceExecutionWindow("2026-10-12", Date.parse("2026-10-11T18:52:00Z"))).toBe(false)
  expect(bankMaintenanceExecutionWindow("2026-10-12", Date.parse("2026-10-12T13:29:59Z"))).toBe(false)
 })
 it("permits the scheduled 19:00 IST start only for the matching local session", () => {
  expect(bankMaintenanceExecutionWindow("2026-10-12", Date.parse("2026-10-12T13:30:00Z"))).toBe(true)
  expect(bankMaintenanceExecutionWindow("2026-10-11", Date.parse("2026-10-12T13:30:00Z"))).toBe(false)
  expect(bankMaintenanceExecutionWindow("2026-10-12", Date.parse("2026-10-12T18:30:00Z"))).toBe(false)
 })
 it("fails closed for invalid date or time", () => {
  expect(bankMaintenanceExecutionWindow("2026-10-12", NaN)).toBe(false)
  expect(bankMaintenanceExecutionWindow("bad", Date.now())).toBe(false)
 })
})
