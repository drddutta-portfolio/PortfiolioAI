import {expect} from "https://deno.land/x/expect@v0.4.0/mod.ts"
import scope from "./scope.json" with {type:"json"}

Deno.test("KOTAKBANK PIT backfill uses the NSE historical ISIN observed throughout Oct-2021 to Sep-2023",()=>{
  const row=scope.find((x:{symbol:string})=>x.symbol==="KOTAKBANK") as Record<string,string>|undefined
  expect(row).toBeTruthy()
  expect(row?.isin).toBe("INE237A01028")
  expect(row?.currentIsin).toBe("INE237A01036")
  expect(row?.identityBasis).toBe("OFFICIAL_NSE_BHAVCOPY_HISTORICAL_ISIN_2021_10_THROUGH_2023_09")
})
