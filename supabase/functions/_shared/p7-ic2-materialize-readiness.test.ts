import {describe,expect,it} from "vitest"
import source from "../p7-ic2-materialize-readiness/index.ts?raw"
describe("P7 IC2 readiness materializer",()=>{
 it("is Development-only and requires a one-time grant",()=>{expect(source).toContain("UNEXPECTED_PRODUCTION_DB_TARGET");expect(source).toContain("consumeP4ExecutionGrant")})
 it("caps resumable materialization slices",()=>{expect(source).toContain("limit>40");expect(source).toContain("facts.securities.slice(offset,offset+limit)")})
 it("preserves all terminal evidence states",()=>{for(const state of ["FRESH","STALE","MISSING","INSUFFICIENT","CONFLICTING","REVIEW_REQUIRED","NOT_APPLICABLE"])expect(source).toContain(`"${state}"`)})
 it("does not score R6 or R7",()=>{expect(source).not.toMatch(/stock_score_runs|recommendation_runs|executeR6|executeR7/u)})
})
