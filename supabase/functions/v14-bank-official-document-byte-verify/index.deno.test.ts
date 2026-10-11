import {expect} from "https://deno.land/x/expect@v0.4.0/mod.ts"
import {approvedNseCorporatePdf} from "./index.ts"

Deno.test("NSE document verifier permits only exact corporate PDFs",()=>{
 expect(approvedNseCorporatePdf("https://nsearchives.nseindia.com/corporate/KARURVYSYA_07052026155944_NSE_BSE_IP_DSC.pdf")).toBe(true)
 expect(approvedNseCorporatePdf("http://nsearchives.nseindia.com/corporate/a.pdf")).toBe(false)
 expect(approvedNseCorporatePdf("https://evil.example/corporate/a.pdf")).toBe(false)
 expect(approvedNseCorporatePdf("https://nsearchives.nseindia.com/content/a.pdf")).toBe(false)
 expect(approvedNseCorporatePdf("https://nsearchives.nseindia.com/corporate/a.pdf?x=1")).toBe(false)
 expect(approvedNseCorporatePdf("https://nsearchives.nseindia.com/corporate/a.html")).toBe(false)
})
