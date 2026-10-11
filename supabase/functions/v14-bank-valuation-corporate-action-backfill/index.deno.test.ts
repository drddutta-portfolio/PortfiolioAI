import {expect} from "https://deno.land/x/expect@v0.4.0/mod.ts"
import {candidateShareBasis,validWindow} from "./index.ts"

Deno.test("BANK PIT corporate-action backfill is bounded to six-month slices in the approved gap",()=>{
 expect(validWindow("2021-10-01","2022-03-31")).toBe(true)
 expect(validWindow("2023-04-01","2023-09-30")).toBe(true)
 expect(validWindow("2021-09-30","2022-03-31")).toBe(false)
 expect(validWindow("2023-04-01","2023-10-01")).toBe(false)
 expect(validWindow("2021-10-01","2022-04-30")).toBe(false)
})
Deno.test("share-basis candidates are captured for review, not silently adjusted",()=>{
 expect(candidateShareBasis("Sub-Division of face value from Rs 5 to Re 1")).toBe(true)
 expect(candidateShareBasis("Bonus 1:1")).toBe(true)
 expect(candidateShareBasis("Rights Issue")).toBe(true)
 expect(candidateShareBasis("Final Dividend - Rs 2 Per Share")).toBe(false)
 expect(candidateShareBasis("Annual General Meeting")).toBe(false)
})
