import { describe, expect, it } from "vitest"
import { P7_IC_PROFILE_CONTRACTS } from "../../../supabase/functions/_shared/p7-ic-profile-contracts"
import { selectedRequirementDimensions, selectSectionRequirements, retainedResultState } from "./selectedResearchPresentation"
import type { P7EvidenceRequirement } from "../../data/p7CurrentIntelligenceRepository"
const item = (code: string, overrides: Partial<P7EvidenceRequirement> = {}): P7EvidenceRequirement => ({ id: code, snapshot_id: "s1", requirement_code: code, metric_code: null, required: true, minimum_history: 3, freshness_policy: "ANNUAL", benchmark_authority: [], applicability: "APPLICABLE", evidence_state: "MISSING", candidate_evidence_ids: [], selected_evidence_id: null, evidence_as_of_date: null, retrieved_at: null, fresh_through: null, source_provider: null, raw_source_record_id: null, normalized_value: null, validation_state: "UNVALIDATED", canonical_selection_state: "NO_SELECTION", reason_code: "REQUIRED_EVIDENCE_MISSING", recommended_remediation_action: "REVIEW", ...overrides })
describe("canonical requirement presentation", () => {
  it.each(Object.keys(P7_IC_PROFILE_CONTRACTS))("retains all immutable items for %s without profile substitutions", code => {
    const rows = [item("UNMAPPED_REQUIREMENT")]
    expect(selectSectionRequirements(rows, code, "Overview")).toBe(rows)
    expect(selectSectionRequirements(rows, code, "Valuation")).toEqual([])
  })
  it("uses the same Pharma parent requirements as canonical materialization", () => {
    expect(selectedRequirementDimensions("PHARMA").get("PE")).toContain("VALUATION")
    expect(selectedRequirementDimensions("PHARMA").get("CFO_OR_FCF_CONVERSION")).toContain("CASH_FLOW")
    expect(selectSectionRequirements([item("PE"), item("CFO_OR_FCF_CONVERSION"), item("UNMAPPED")], "PHARMA", "Valuation").map(row => row.requirement_code)).toEqual(["PE"])
  })
  it("keeps unknown profiles unmapped rather than borrowing bank dimensions", () => {
    expect(selectedRequirementDimensions("UNREGISTERED").size).toBe(0)
    expect(selectSectionRequirements([item("NPA"), item("PE")], "UNREGISTERED", "Financials")).toEqual([])
  })
  it("never equates an unreviewed or conflicting retained result with scoring", () => {
    expect(retainedResultState(item("x"))).toBe("NO_DATA")
    expect(retainedResultState(item("x", { evidence_state: "FRESH", validation_state: "VALIDATED", canonical_selection_state: "DETERMINISTIC_HISTORY_AGGREGATE" }))).toBe("EVIDENCE_NOT_SCORE_READY")
    expect(retainedResultState(item("x", { evidence_state: "CONFLICTING", validation_state: "VALIDATED", canonical_selection_state: "DETERMINISTIC_HISTORY_AGGREGATE" }))).toBe("NO_VALIDATED_EVIDENCE")
    expect(retainedResultState(item("x", { applicability: "NOT_APPLICABLE" }))).toBe("NOT_APPLICABLE")
  })
})
