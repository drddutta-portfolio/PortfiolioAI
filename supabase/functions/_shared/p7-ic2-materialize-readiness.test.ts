import {describe,expect,it} from "vitest"
import source from "../p7-ic2-materialize-readiness/index.ts?raw"
describe("P7 IC2 readiness materializer",()=>{
 it("is Development-only and requires a one-time grant",()=>{expect(source).toContain("UNEXPECTED_PRODUCTION_DB_TARGET");expect(source).toContain("consumeP4ExecutionGrant")})
 it("caps resumable materialization slices",()=>{expect(source).toContain("limit>40");expect(source).toContain(".slice(offset,offset+limit)");expect(source).toContain("totalEquities")})
 it("uses the append-only V2 selection contract",()=>{expect(source).toContain('append_and_select_research_evidence_snapshot_v2');expect(source).toContain('selection_run_id:selectionRunId');expect(source).toContain('execution_grant_id:String(body.grantId??"")');expect(source).toContain('selection_basis:"MATERIALIZED_RECONCILIATION"')})
 it("freezes campaign time and source cutoff",()=>{expect(source).toContain("evaluationAsOfMs");expect(source).toContain("sourceCutoffAt");expect(source).toContain('.lte("retrieved_at",sourceCutoffAt)');expect(source).not.toContain("Date.now()))")})
 it("reports zero provider calls",()=>{expect(source).toContain("providerCalls:0")})
 it("preserves all terminal evidence states",()=>{for(const state of ["FRESH","STALE","MISSING","INSUFFICIENT","CONFLICTING","REVIEW_REQUIRED","NOT_APPLICABLE"])expect(source).toContain(`"${state}"`)})
 it("does not score R6 or R7",()=>{expect(source).not.toMatch(/stock_score_runs|recommendation_runs|executeR6|executeR7/u)})
})
