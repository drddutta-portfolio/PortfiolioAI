import {describe,expect,it} from "vitest"
import {validateCapturedResponse,validateBhavcopyRows} from "./v14-source-validation.ts"

describe("V1-4 source semantic validation",()=>{
 it("rejects HTTP 200 HTML Error 500",()=>{
  const x=validateCapturedResponse({status:200,contentType:"text/html; charset=utf-8",bodyText:"<!DOCTYPE html><html><head><title>Error 500</title></head><body>server error</body></html>",format:"NIFTY_TRI_JSON",expectedIndex:"NIFTY 500"})
  expect(x).toMatchObject({ok:false,reason:"HTML_ERROR_OR_CHALLENGE_PAGE"})
 })
 it("accepts only exact TRI identity, dates and positive values",()=>{
  const body=JSON.stringify({d:JSON.stringify([
   {"Index Name":"NIFTY 500","Date":"01-Oct-2026","TotalReturnsIndex":"12345.67"},
   {"Index Name":"NIFTY 500","Date":"05-Oct-2026","TotalReturnsIndex":"12400.10"},
  ])})
  const x=validateCapturedResponse({status:200,contentType:"application/json; charset=utf-8",bodyText:body,format:"NIFTY_TRI_JSON",expectedIndex:"NIFTY 500",requestedFrom:"2026-10-01",requestedTo:"2026-10-05",requiredDates:["2026-10-01","2026-10-05"]})
  expect(x).toMatchObject({ok:true,reason:"CAPTURE_SEMANTICALLY_VALID"})
 })
 it("rejects wrong TRI index even when transport and JSON are valid",()=>{
  const body=JSON.stringify([{"Index Name":"NIFTY 50","Date":"01-Oct-2026","TotalReturnsIndex":"123"}])
  expect(validateCapturedResponse({status:200,contentType:"application/json",bodyText:body,format:"NIFTY_TRI_JSON",expectedIndex:"NIFTY 500"})).toMatchObject({ok:false,reason:"TRI_INDEX_IDENTITY_MISMATCH"})
 })
 it("normalizes valid bhavcopy and excludes identity/date mismatches",()=>{
  const headers=["TradDt","BizDt","ISIN","TckrSymb","SctySrs","ClsPric"]
  const canonical=new Map([["ABC",{isin:"INE000A01001"}],["XYZ",{isin:"INE000B01002"}]])
  const x=validateBhavcopyRows({headers,expectedDate:"2026-10-01",canonical,rows:[
   {TradDt:"2026-10-01",BizDt:"2026-10-01",ISIN:"INE000A01001",TckrSymb:"ABC",SctySrs:"EQ",ClsPric:"100.25"},
   {TradDt:"2026-10-01",BizDt:"2026-10-01",ISIN:"WRONG",TckrSymb:"XYZ",SctySrs:"EQ",ClsPric:"12.00"},
   {TradDt:"2026-10-02",BizDt:"2026-10-02",ISIN:"INE000C01003",TckrSymb:"DATE",SctySrs:"EQ",ClsPric:"10"},
  ]})
  expect(x.state).toBe("FRESH")
  expect(x.candidates).toHaveLength(1)
  expect(x.exclusions.map(e=>e.reason)).toEqual(expect.arrayContaining(["CANONICAL_ISIN_MISMATCH","TRADE_DATE_MISMATCH"]))
 })
 it("detects conflicting duplicate rows",()=>{
  const headers=["TradDt","BizDt","ISIN","TckrSymb","SctySrs","ClsPric"]
  const x=validateBhavcopyRows({headers,expectedDate:"2026-10-01",rows:[
   {TradDt:"2026-10-01",BizDt:"2026-10-01",ISIN:"INE000A01001",TckrSymb:"ABC",SctySrs:"EQ",ClsPric:"100"},
   {TradDt:"2026-10-01",BizDt:"2026-10-01",ISIN:"INE000A01001",TckrSymb:"ABC",SctySrs:"EQ",ClsPric:"101"},
  ]})
  expect(x.state).toBe("CONFLICTING")
 })
})