import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { ResearchRetainedResult } from "./ResearchRetainedResult"
import type { P7EvidenceRequirement } from "../../data/p7CurrentIntelligenceRepository"
const item: P7EvidenceRequirement = { id: "r1", snapshot_id: "s1", requirement_code: "ROCE", metric_code: "ROCE", required: true, minimum_history: 3, freshness_policy: "ANNUAL", benchmark_authority: [], applicability: "APPLICABLE", evidence_state: "REVIEW_REQUIRED", candidate_evidence_ids: [], selected_evidence_id: null, evidence_as_of_date: null, retrieved_at: null, fresh_through: null, source_provider: null, raw_source_record_id: null, normalized_value: null, validation_state: "UNVALIDATED", canonical_selection_state: "NO_SELECTION", reason_code: "REVIEW_REQUIRED", recommended_remediation_action: "REVIEW" }
afterEach(cleanup)
describe("source-bound retained results", () => {
  it("preserves exact zero and separates incompatible observation bases without creating a trend", () => {
    render(<ResearchRetainedResult item={{ ...item, normalized_value: { series: [
      { numeric_value: "0", unit: "PERCENT", period_type: "YEAR", period_end: "2026-03-31", consolidation_scope: "CONSOLIDATED", source_record_id: "source-a" },
      { numeric_value: "12.12345678901234567890", unit: "RATIO", period_type: "QUARTER", period_end: "2026-06-30", consolidation_scope: "STANDALONE", source_record_id: "source-b" },
    ] } }} />)
    expect(screen.getByText("0", { selector: "td" })).toBeInTheDocument()
    expect(screen.getByText("12.12345678901234567890")).toBeInTheDocument()
    expect(screen.getByText("CONSOLIDATED")).toBeInTheDocument()
    expect(screen.getByText("STANDALONE")).toBeInTheDocument()
    expect(screen.getByText(/Result qualification:/).closest("p")).toHaveTextContent("NO VALIDATED EVIDENCE")
  })
  it("does not render a monetary amount without its currency basis", () => {
    render(<ResearchRetainedResult item={{ ...item, normalized_value: { value: "123456789", unit: "INR_CRORE", period_type: "YEAR", period_end: "2026-03-31", scope: "CONSOLIDATED" } }} />)
    expect(screen.queryByText("123456789")).not.toBeInTheDocument()
    expect(screen.getByText("Unavailable — incomplete value basis")).toBeInTheDocument()
  })
  it("does not invent scalar metadata or treat a document payload as a numeric value", () => {
    render(<ResearchRetainedResult item={{ ...item, normalized_value: { document: "document-id", proposal: 92 } }} />)
    expect(screen.getByText(/No interpretable retained observation/)).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })
})
