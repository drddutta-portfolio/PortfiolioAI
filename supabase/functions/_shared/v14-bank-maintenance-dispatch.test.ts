import {describe,it,expect} from "vitest"
import {beginBankSessionDispatch,bankSessionLeaseOperation,type BankDispatchStore} from "./v14-bank-maintenance-dispatch.ts"
describe("atomic one-attempt banking session dispatch",()=>{
 it("uses a date-specific key accepted by the existing PostgreSQL operation constraint",()=>{
  expect(bankSessionLeaseOperation("V1_4_BANK_MAINTENANCE_DAILY_V1","2026-10-12")).toBe("V1_4_BANK_MAINTENANCE_DAILY_V1_20261012")
  expect(()=>bankSessionLeaseOperation("arbitrary:operation","2026-10-12")).toThrow()
 })
 it("admits only one concurrent caller and blocks the failed-run retry after releasing its lease",async()=>{
  let leased=false,prior=false
  const store:BankDispatchStore={acquire:async()=>{if(leased)return false;leased=true;return true},hasPriorRun:async()=>prior,release:async()=>{leased=false;return true}}
  const first=await beginBankSessionDispatch(store)
  expect(first.ok).toBe(true)
  expect(await beginBankSessionDispatch(store)).toMatchObject({ok:false,code:"BANK_MAINTENANCE_SESSION_LEASE_BUSY"})
  prior=true // any persisted run counts, including FAILED or interrupted RUNNING
  if(first.ok)expect(await first.release()).toBe(true)
  expect(await beginBankSessionDispatch(store)).toMatchObject({ok:false,code:"BANK_MAINTENANCE_SESSION_ALREADY_ATTEMPTED"})
  expect(leased).toBe(false)
 })
 it("releases the lease on an unsuccessful prior-run read instead of dispatching",async()=>{
  let released=false
  const store:BankDispatchStore={acquire:async()=>true,hasPriorRun:async()=>{throw Error("BANK_MAINTENANCE_PRIOR_RUN_READ_FAILED")},release:async()=>{released=true;return true}}
  await expect(beginBankSessionDispatch(store)).rejects.toThrow("BANK_MAINTENANCE_PRIOR_RUN_READ_FAILED")
  expect(released).toBe(true)
 })
 it("does not hide a release failure or consult prior runs without a lease",async()=>{
  let reads=0
  expect(await beginBankSessionDispatch({acquire:async()=>false,hasPriorRun:async()=>{reads++;return false},release:async()=>true})).toMatchObject({ok:false})
  expect(reads).toBe(0)
  expect(await beginBankSessionDispatch({acquire:async()=>true,hasPriorRun:async()=>true,release:async()=>false})).toMatchObject({ok:false,code:"BANK_MAINTENANCE_LEASE_RELEASE_FAILED"})
 })
})
