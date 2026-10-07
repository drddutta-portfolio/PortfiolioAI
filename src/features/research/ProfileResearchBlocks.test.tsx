import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { P7CurrentEvidenceDetails, P7EvidenceRequirement } from "../../data/p7CurrentIntelligenceRepository"
import { SECTOR_ENGINE_REGISTRY } from "./sectorEngineRegistry"
import { ProfileResearchBlocks } from "./ProfileResearchBlocks"

const snapshot: P7CurrentEvidenceDetails["snapshot"] = {
  snapshotId: "snapshot-1", portfolioId: "p1", securityId: "s1", asOfDate: "2026-10-07", snapshotStatus: "REVIEW_REQUIRED",
  profileCode: "BANK", subprofileCode: "RETAIL_BANK", methodologyAuthority: "approved-method", methodologyVersion: "V1",
  classificationVersion: "classification-v1", methodologyRole: "PRIMARY", assignmentId: "assignment-1", assignmentAuthority: "approved-assignment", assignmentVersion: "V1",
}
function requirement(index: number, override: Partial<P7EvidenceRequirement> = {}): P7EvidenceRequirement {
  return { id: `r${index}`, snapshot_id: "snapshot-1", requirement_code: `REQUIREMENT_${index}`, metric_code: null, required: true,
    minimum_history: 5, freshness_policy: "ANNUAL", benchmark_authority: ["approved-benchmark"], applicability: "APPLICABLE", evidence_state: "REVIEW_REQUIRED",
    candidate_evidence_ids: [`candidate-${index}`], selected_evidence_id: null, evidence_as_of_date: "2026-03-31", retrieved_at: "2026-10-06",
    fresh_through: "2027-03-31", source_provider: "ISSUER", raw_source_record_id: `source-${index}`,
    normalized_value: { value: "42", unit: "INR_CRORE", period_end: "2026-03-31", scope: "CONSOLIDATED" },
    validation_state: "REVIEW_REQUIRED", canonical_selection_state: "UNSELECTED", reason_code: "SOURCE_BINDING_REVIEW", recommended_remediation_action: "REVIEW_SOURCE", ...override }
}
const details: P7CurrentEvidenceDetails = { snapshot, requirements: [
  ...Array.from({ length: 8 }, (_, i) => requirement(i + 1)),
  requirement(9, { required: false, evidence_state: "MISSING", normalized_value: null }),
  requirement(10, { applicability: "NOT_APPLICABLE", evidence_state: "NOT_APPLICABLE", normalized_value: null }),
] }
const evidence = { applicable: true, isLoading: false, error: null as string | null, data: details as P7CurrentEvidenceDetails | null }
const load = vi.fn<(portfolioId: string, securityId: string, assetClass: string) => typeof evidence>(() => evidence)
vi.mock("./useCanonicalEvidenceReadiness", () => ({ useCanonicalEvidenceReadiness: (portfolioId: string, securityId: string, assetClass: string) => { load(portfolioId, securityId, assetClass); return evidence } }))
function open() { const onViewEvidence = vi.fn(); render(<ProfileResearchBlocks portfolioId="p1" securityId="s1" assetClass="EQUITY" onViewEvidence={onViewEvidence} />); return onViewEvidence }
afterEach(() => { cleanup(); Object.assign(evidence, { applicable: true, isLoading: false, error: null, data: details }); load.mockClear() })

describe("selected-contract stock research", () => {
  it("retains all results beyond the compact preview, with full source binding", () => {
    const viewEvidence = open()
    expect(load).toHaveBeenCalledWith("p1", "s1", "EQUITY")
    expect(screen.getByText("All remaining applicable research (3)")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Requirement 8" })).toBeInTheDocument()
    expect(screen.getByText("Source reference: source-8")).toBeInTheDocument()
    expect(screen.getAllByText(/INR_CRORE/)).toHaveLength(8)
    expect(screen.getAllByText(/CONSOLIDATED/)).toHaveLength(8)
    expect(screen.getByText(/9 applicable retained requirements · 1 not applicable/)).toBeInTheDocument()
    expect(screen.getByText(/Explicit contract exclusions are not missing evidence/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "View complete profile evidence" }))
    expect(viewEvidence).toHaveBeenCalledOnce()
  })
  it("searches the entire contract and filters actual retained evidence states", () => {
    open()
    fireEvent.change(screen.getByLabelText("Find profile research"), { target: { value: "REQUIREMENT_8" } })
    expect(screen.getByRole("heading", { name: "Requirement 8" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Requirement 1" })).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("Find profile research"), { target: { value: "" } })
    fireEvent.change(screen.getByLabelText("Stored evidence state"), { target: { value: "MISSING" } })
    expect(screen.getByRole("heading", { name: "Requirement 9" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Requirement 1" })).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("Stored evidence state"), { target: { value: "FRESH" } })
    expect(screen.getByText("No applicable requirements match these filters.")).toBeInTheDocument()
  })
  it.each([...new Set(SECTOR_ENGINE_REGISTRY.flatMap(engine => engine.profileCodes)), "FINANCIAL_HOLDING_COMPANY", "RETAIL_COMMERCE", "UNREGISTERED_PROFILE"])("exposes retained results without a substituted methodology for %s", profileCode => {
    evidence.data = { ...details, snapshot: { ...snapshot, profileCode, subprofileCode: null } }
    open()
    expect(screen.getByRole("heading", { name: "Requirement 8" })).toBeInTheDocument()
    expect(screen.getByText(/approved-method · V1/)).toBeInTheDocument()
    if (!["BANK", "PHARMA"].includes(profileCode)) expect(screen.getByText(/Specialist snapshot presentation is not registered/)).toBeInTheDocument()
    expect(screen.queryByText(/General Research|Banks \/ NBFCs|Canonical score/)).not.toBeInTheDocument()
  })
  it("preserves a real zero normalized result and unavailable source metadata", () => {
    evidence.data = { snapshot, requirements: [requirement(1, { normalized_value: 0, source_provider: null, minimum_history: 0 })] }
    open()
    expect(screen.getByText("0", { selector: "pre" })).toBeInTheDocument()
    expect(screen.getByText(/Source unavailable/)).toBeInTheDocument()
    expect(screen.getByText("History requirement: 0 (requirement-specific units)")).toBeInTheDocument()
  })
  it.each(["loading", "error", "empty", "not-applicable"])("discloses %s without borrowing another stock's results", state => {
    Object.assign(evidence, { data: null, applicable: state !== "not-applicable", isLoading: state === "loading", error: state === "error" ? "Read failed" : null })
    open()
    expect(screen.queryByText("Source reference: source-8")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Find profile research")).not.toBeInTheDocument()
    const message = state === "loading" ? "Loading the selected research contract…" : state === "error" ? "Read failed" : state === "empty" ? "No selected profile evidence snapshot. Applicability is unresolved." : "Equity research is not applicable to this asset class."
    expect(screen.getByText(message)).toBeInTheDocument()
  })
})
