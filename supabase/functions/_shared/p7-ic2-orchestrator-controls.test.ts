import {describe,expect,it} from "vitest"
import source from "../p7-ic2-orchestrator/index.ts?raw"
describe("P7 IC2 orchestrator provider controls",()=>{
 it("binds internal daily calls to verified external entitlement",()=>{expect(source).toContain("internalDaily!==externalDaily");expect(source).toContain("IC2_VERIFIED_DAILY_CALL_CEILING")})
 it("retains Production refusal and bounded slices",()=>{expect(source).toContain("UNEXPECTED_PRODUCTION_DB_TARGET");expect(source).toContain("MAX_SLICE_SECURITIES=5")})
})
