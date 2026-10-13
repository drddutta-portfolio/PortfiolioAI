import {validateBankTail} from "../_shared/v14-bank-tail-validation.ts"
const candle={periodStart:"2026-10-08T00:00:00+05:30",open:"100.00",high:"102",low:"99.5",close:"101.25",volume:"0",retrievedAt:"2026-10-09T00:00:00Z"}
Deno.test("bounded append-only bank tails validate exact prices and reject incomplete or contradictory windows",()=>{
 validateBankTail([candle],"2026-10-08","2026-10-08")
 for(const rows of [[],[candle,candle],[{...candle,high:"100"}],[{...candle,close:"0"}],[{...candle,volume:"-1"}],[{...candle,periodStart:"2026-10-07T00:00:00+05:30"}]]){
  let failed=false;try{validateBankTail(rows,"2026-10-08","2026-10-08")}catch{failed=true}
  if(!failed)throw new Error("Invalid source candles accepted")
 }
})

Deno.test("UTC storage representation resolves to the intended NSE local session",()=>{
  const {bankTailDay}=await import("../_shared/v14-bank-tail-validation.ts")
  if(bankTailDay("2026-10-07T18:30:00.000Z")!=="2026-10-08")throw new Error("UTC timestamp was misclassified as the previous NSE session")
})
