import {describe, expect, it} from "vitest"
import {sameQualifiedHistoryNumeric} from "./v14-history-numeric-equality.ts"
describe("exact numeric equality for retained bank OHLCV",()=>{
 it("recognizes equivalent database NUMERIC formatting",()=>{
  expect(sameQualifiedHistoryNumeric("000123.45000",123.45)).toBe(true)
  expect(sameQualifiedHistoryNumeric("-0.000","0")).toBe(true)
  expect(sameQualifiedHistoryNumeric("0000.100","0.10")).toBe(true)
 })
 it("detects differences hidden by Number floating-point rounding",()=>{
  expect(sameQualifiedHistoryNumeric("9007199254740993","9007199254740992")).toBe(false)
  expect(sameQualifiedHistoryNumeric("123.45000000000000000001","123.45")).toBe(false)
 })
 it("fails closed for missing/unparseable data",()=>{
  expect(sameQualifiedHistoryNumeric(null,0)).toBe(false)
  expect(sameQualifiedHistoryNumeric("not a price",0)).toBe(false)
  expect(sameQualifiedHistoryNumeric("0",Number.NaN)).toBe(false)
  expect(sameQualifiedHistoryNumeric("1e+2",100)).toBe(false)
 })
})
