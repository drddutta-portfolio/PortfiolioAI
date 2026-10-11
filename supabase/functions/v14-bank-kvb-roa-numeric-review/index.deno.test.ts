import {sourceEligible} from "./index.ts";
const quote="KARURVYSYA Return on Assets FY2025-26 full-year audited Standalone 01-04-2025 31-03-2026 1.93% average total assets";
const base={source_code:"COMPANY_EXCHANGE_FILING",raw_payload:{original_url:"https://www.kvb.bank.in/ar-26/assets/pdfs/Karur_Vysya_Bank_IAR_Schedules.pdf",original_sha256:"8".repeat(64),verified_quote:quote}};
Deno.test("KVB numeric review requires precise issuer hash and denominator binding",()=>{
 if(!sourceEligible(base,quote))throw Error("Qualified source not recognized");
 const failures=[
  {...base,source_code:"THIRD_PARTY"},
  {...base,raw_payload:{...base.raw_payload,original_url:"https://ltnr.ca/report"}},
  {...base,raw_payload:{...base.raw_payload,original_sha256:"invalid"}},
  {...base,raw_payload:{...base.raw_payload,verified_quote:"unrelated"}},
 ];
 for(const s of failures)if(sourceEligible(s,quote))throw Error("Unqualified source accepted");
 for(const q of [quote.replace("average total assets","reported assets"),quote.replace("1.93%","1.81%"),quote.replace("FY2025-26","undated"),quote.replace("31-03-2026","31-03-2025")])
  if(sourceEligible({...base,raw_payload:{...base.raw_payload,verified_quote:q}},q))throw Error("Unqualified literal accepted");
});
