import {describe,expect,it} from "vitest"
import source from "../p7-ic2-materialize-readiness/index.ts?raw"
describe("P7 IC3 canonical snapshot materializer",()=>{
 it("is Development-only and requires a one-time grant",()=>{expect(source).toContain("UNEXPECTED_PRODUCTION_DB_TARGET");expect(source).toContain("consumeP4ExecutionGrant")})
 it("caps resumable materialization slices",()=>{expect(source).toContain("limit>40");expect(source).toContain(".slice(offset,offset+limit)");expect(source).toContain("totalEquities")})
 it("uses the append-only V3 IC3 lineage contract",()=>{expect(source).toContain('append_and_select_research_evidence_snapshot_v3');expect(source).toContain('selection_run_id:selectionRunId');expect(source).toContain('execution_grant_id:String(body.grantId??"")');expect(source).toContain('selection_basis:"IC3_CANONICAL_MATERIALIZATION"');expect(source).toContain('classification_version');expect(source).toContain('methodology_role');expect(source).toContain('assignment_version')})
 it("freezes campaign time and source cutoff",()=>{expect(source).toContain("evaluationAsOfMs");expect(source).toContain("sourceCutoffAt");expect(source).toContain('.lte("retrieved_at",sourceCutoffAt)');expect(source).not.toContain("Date.now()))")})
 it("reports zero provider calls",()=>{expect(source).toContain("providerCalls:0")})
 it("routes market and benchmark history through the deterministic V1-4 readiness contract",()=>{expect(source).toContain("validateStockHistoryReadiness");expect(source).toContain("validateBenchmarkPairReadiness");expect(source).toContain("historyProofFromRows");expect(source).toContain("VALIDATED_HISTORY_CONTRACT");expect(source).not.toContain('"ADJUSTMENT_CALENDAR_ALIGNMENT_NOT_PROVEN","VALIDATE_APPROVED_HISTORY_CONTRACT"')})
 it("applies the shared historical-period guard to retained normalized evidence",()=>{expect(source).toContain('cachedEvidenceReadiness(guardedNumericEvidenceState(String((x as Json).state??"MISSING"),x,minimum),x,minimum)')})
 it("dispatches reviewed evidence from approved requirement families",()=>{expect(source).toContain("family:req.deterministicCoverageRule");expect(source).toContain("validateReviewedRequirementEvidence");expect(source).toContain("reconcileCanonicalAndReviewed")})
 it("paginates review ledger reads and fails closed on incomplete loading",()=>{expect(source).toContain('range(offset,offset+499)');expect(source).toContain("REVIEW_FACTS_COMPLETENESS_NOT_PROVEN");expect(source).toContain("REVIEW_REFERENCED_FACTS_INCOMPLETE")})
 it("preserves all terminal evidence states",()=>{for(const state of ["FRESH","STALE","MISSING","INSUFFICIENT","CONFLICTING","REVIEW_REQUIRED","NOT_APPLICABLE"])expect(source).toContain(`"${state}"`)})
 it("does not score R6 or R7",()=>{expect(source).not.toMatch(/stock_score_runs|recommendation_runs|executeR6|executeR7/u)})
})
